// Spread optimizer: pure calculations that answer "how many Stat Points does
// it take to ...". It never recommends a build - it just searches the 0–32 SP
// range of the stats involved and reports the cheapest ways to reach the goal
// the user set (survive a hit, KO, outspeed).

import { computeMoveResults, computeStats, type MoveResult } from "../calc/calcEngine";
import { getMoveInfo } from "../champions/data";
import { rollsFromRange } from "./combo";
import { evToSp, spToEv, STAT_POINT_BUDGET, STAT_POINT_CAP } from "../champions/statPoints";
import type { StatsTable } from "../calc/types";
import type { FieldState, PokemonState } from "../calc/types";

type StatKey = keyof StatsTable;

/** Natures used for the "what if I run a boosting / neutral nature" columns. */
export const BOOST_NATURE: Partial<Record<StatKey, string>> = {
  atk: "Adamant",
  spa: "Modest",
  def: "Bold",
  spd: "Calm",
  spe: "Jolly",
};
export const NEUTRAL_NATURE = "Hardy";

/** Rolls of a calculated move, interpolating when only the min/max is known (multi-hit). */
function rollsOf(res: MoveResult | undefined): number[] | null {
  if (!res || res.error || !res.range) return null;
  return res.rolls ?? rollsFromRange(res.range[0], res.range[1]);
}

/** Total Stat Points already placed in the given stats. */
function spIn(p: PokemonState, keys: StatKey[]): number {
  return keys.reduce((a, k) => a + evToSp(p.evs[k]), 0);
}

function hitOnce(src: PokemonState, tgt: PokemonState, field: FieldState, move: string, crit: boolean) {
  const s = { ...src, moves: [move, "", "", ""], critMoves: [crit, false, false, false] };
  return computeMoveResults(s, tgt, field, [move])[0];
}

/** Which defensive / offensive stat a move actually uses. */
export function statsForMove(move: string): { def: "def" | "spd"; atk: "atk" | "spa" } | null {
  const info = getMoveInfo(move);
  if (!info || info.category === "Status") return null;
  return info.category === "Physical" ? { def: "def", atk: "atk" } : { def: "spd", atk: "spa" };
}

// ------------------------------------------------------------- survive ----

export interface SurviveOption {
  hpSp: number;
  defSp: number;
  total: number;
  /** Share of damage rolls the target survives with this spread (0–1). */
  survivalRate: number;
  maxPercent: number;
}

export interface SurviveResult {
  defStat: "def" | "spd";
  /** SP still free for HP + the defensive stat once the other stats are paid for. */
  budget: number;
  options: SurviveOption[];
}

/**
 * Every non-dominated (HP, Def/SpD) investment that survives `move` with at
 * least `fraction` of the damage rolls (1 = always, 0.5 = on half the rolls...).
 */
export function findSurviveSpreads(
  attacker: PokemonState,
  defender: PokemonState,
  field: FieldState,
  move: string,
  fraction: number,
  crit = false
): SurviveResult | null {
  const st = statsForMove(move);
  if (!st) return null;
  const defStat = st.def;
  const other: StatKey[] = ["atk", "spa", "spe", defStat === "def" ? "spd" : "def"];
  const budget = Math.max(0, STAT_POINT_BUDGET - spIn(defender, other));

  const survival = (hpSp: number, defSp: number) => {
    const test: PokemonState = { ...defender, evs: { ...defender.evs, hp: spToEv(hpSp), [defStat]: spToEv(defSp) } };
    const res = hitOnce(attacker, test, field, move, crit);
    const rolls = rollsOf(res);
    if (!rolls) return null;
    const hp = computeStats(test).hp;
    return { rate: rolls.filter((r) => r < hp).length / rolls.length, max: Math.max(...rolls) / hp };
  };

  const found: SurviveOption[] = [];
  for (let hpSp = 0; hpSp <= STAT_POINT_CAP; hpSp++) {
    // Survival only improves with more Def/SpD, so binary-search the smallest one that works.
    let lo = 0;
    let hi = STAT_POINT_CAP;
    const top = survival(hpSp, hi);
    if (!top || top.rate < fraction) continue;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      const r = survival(hpSp, mid);
      if (r && r.rate >= fraction) hi = mid;
      else lo = mid + 1;
    }
    if (hpSp + lo > budget) continue;
    const r = survival(hpSp, lo)!;
    found.push({ hpSp, defSp: lo, total: hpSp + lo, survivalRate: r.rate, maxPercent: Math.round(r.max * 1000) / 10 });
  }
  // Keep only options no other option beats on both stats.
  const options = found
    .filter((a) => !found.some((b) => b !== a && b.hpSp <= a.hpSp && b.defSp <= a.defSp && (b.hpSp < a.hpSp || b.defSp < a.defSp)))
    .sort((a, b) => a.total - b.total || a.hpSp - b.hpSp);
  return { defStat, budget, options };
}

// ---------------------------------------------------------------- KO ------

export interface NatureColumn {
  nature: string;
  /** Minimum SP, or null when even 32 SP isn't enough. */
  minSp: number | null;
  /** Result at that SP (percent range for KO, final stat for speed). */
  detail: string;
}

export interface KoResult {
  atkStat: "atk" | "spa";
  columns: NatureColumn[];
}

/** Natures to compare for `stat`: the current one, a neutral one and the stat-boosting one. */
function natureSet(current: string, stat: StatKey): string[] {
  const out = [current, NEUTRAL_NATURE, BOOST_NATURE[stat]].filter((n): n is string => !!n);
  return Array.from(new Set(out));
}

/** Minimum Atk/SpA SP for `move` to KO the defender on at least `fraction` of the rolls. */
export function findKoSpreads(
  attacker: PokemonState,
  defender: PokemonState,
  field: FieldState,
  move: string,
  fraction: number,
  crit = false
): KoResult | null {
  const st = statsForMove(move);
  if (!st) return null;
  const hp = computeStats(defender).hp;
  const columns = natureSet(attacker.nature, st.atk).map((nature): NatureColumn => {
    for (let sp = 0; sp <= STAT_POINT_CAP; sp++) {
      const test: PokemonState = { ...attacker, nature, evs: { ...attacker.evs, [st.atk]: spToEv(sp) } };
      const res = hitOnce(test, defender, field, move, crit);
      const rolls = rollsOf(res);
      if (!rolls) continue;
      if (rolls.filter((r) => r >= hp).length / rolls.length >= fraction) {
        return { nature, minSp: sp, detail: `${Math.round((Math.min(...rolls) / hp) * 1000) / 10}–${Math.round((Math.max(...rolls) / hp) * 1000) / 10}%` };
      }
    }
    return { nature, minSp: null, detail: "" };
  });
  return { atkStat: st.atk, columns };
}

// -------------------------------------------------------------- speed -----

/** Minimum Speed SP for `me` to strictly outspeed `targetSpeed` (final speed, items/abilities/field included). */
export function findSpeedSpread(me: PokemonState, field: FieldState, targetSpeed: number): NatureColumn[] {
  return natureSet(me.nature, "spe").map((nature): NatureColumn => {
    for (let sp = 0; sp <= STAT_POINT_CAP; sp++) {
      const test: PokemonState = { ...me, nature, evs: { ...me.evs, spe: spToEv(sp) } };
      const speed = computeStats(test, field, "attackerSide").spe;
      if (speed > targetSpeed) return { nature, minSp: sp, detail: String(speed) };
    }
    return { nature, minSp: null, detail: "" };
  });
}
