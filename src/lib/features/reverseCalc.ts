import { computeMoveResults, computeStats } from "../calcEngine";
import { spToEv, STAT_POINT_CAP } from "../champions/statPoints";
import type { FieldState, PokemonState } from "../types";

export interface ReverseCalcResult {
  /** The defensive stat used to survive, or offensive stat used to KO. */
  statKey: "def" | "spd" | "atk" | "spa";
  /** Minimum Stat Points needed, or null if impossible even at the 32 SP cap. */
  minSp: number | null;
  /** True if the goal is already met at the Pokémon's current investment (0 extra SP needed on top). */
  alreadyMet: boolean;
}

/**
 * Minimum Stat Points the defender needs in its relevant defensive stat
 * (Def for Physical moves, SpD for Special) to guarantee surviving this
 * exact move — i.e. the highest damage roll stays below current HP. Every
 * other stat/investment on both sides is held fixed.
 */
export function minSpToSurvive(
  attacker: PokemonState,
  defender: PokemonState,
  field: FieldState,
  move: string,
  statKey: "def" | "spd"
): ReverseCalcResult {
  const currentSp = evToSpLocal(defender.evs[statKey]);
  for (let sp = 0; sp <= STAT_POINT_CAP; sp++) {
    const testDefender: PokemonState = {
      ...defender,
      evs: { ...defender.evs, [statKey]: spToEv(sp) },
    };
    const [result] = computeMoveResults(attacker, testDefender, field, [move]);
    if (!result || result.error || !result.range) continue;
    const maxHp = computeStats(testDefender).hp;
    if (result.range[1] < maxHp) {
      return { statKey, minSp: sp, alreadyMet: sp <= currentSp };
    }
  }
  return { statKey, minSp: null, alreadyMet: false };
}

/**
 * Minimum Stat Points the attacker needs in its relevant offensive stat
 * (Atk for Physical moves, SpA for Special) to guarantee an OHKO with this
 * exact move — i.e. the lowest damage roll already meets or exceeds the
 * defender's current HP.
 */
export function minSpToOhko(
  attacker: PokemonState,
  defender: PokemonState,
  field: FieldState,
  move: string,
  statKey: "atk" | "spa"
): ReverseCalcResult {
  const currentSp = evToSpLocal(attacker.evs[statKey]);
  const maxHp = computeStats(defender).hp;
  for (let sp = 0; sp <= STAT_POINT_CAP; sp++) {
    const testAttacker: PokemonState = {
      ...attacker,
      evs: { ...attacker.evs, [statKey]: spToEv(sp) },
    };
    const [result] = computeMoveResults(testAttacker, defender, field, [move]);
    if (!result || result.error || !result.range) continue;
    if (result.range[0] >= maxHp) {
      return { statKey, minSp: sp, alreadyMet: sp <= currentSp };
    }
  }
  return { statKey, minSp: null, alreadyMet: false };
}

function evToSpLocal(ev: number): number {
  if (ev <= 0) return 0;
  return Math.min(STAT_POINT_CAP, Math.ceil((ev - 4) / 8) + 1);
}