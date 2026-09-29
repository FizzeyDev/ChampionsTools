import { computeMoveResults, computeStats } from "../calcEngine";
import { spToEv } from "../champions/statPoints";
import { META_SETS } from "../champions/metaSets";
import { SPECIES_NAMES } from "../gen";
import { defaultPokemon } from "../types";
import type { FieldState, PokemonState, StatsTable } from "../types";
import type { StatKey } from "../gen";

export type KoType = "none" | "possible" | "guaranteed";
export type CompareCategory = "move1" | "move2" | "tie";

export interface MoveCompareEntry {
  species: string;
  percent1: [number, number] | null;
  percent2: [number, number] | null;
  ko1: KoType;
  ko2: KoType;
  category: CompareCategory;
  /** avg(%1) - avg(%2). Positive means move 1 hits/kills harder here. */
  avgGap: number;
}

export interface MoveCompareSummary {
  move1Kills: number;
  move2Kills: number;
  move1Stronger: number;
  move2Stronger: number;
  ties: number;
  total: number;
}

/** Species with a curated real competitive set (src/lib/champions/metaSets.ts)
 * — i.e. Pokémon that actually see play. This is the default candidate pool:
 * comparing against random unused Pokémon isn't useful for "which move
 * performs better against the field", so meta-relevant ones come first,
 * same principle as the Speed Tiers defaults. */
export function metaCandidatePool(exclude?: string): string[] {
  return Object.keys(META_SETS).filter((s) => s !== exclude);
}

/** Backfill source once the curated pool + hidden species leave a gap:
 * the rest of the Champions dex, alphabetically (stable, not random). */
export function widePool(exclude?: string): string[] {
  const meta = new Set(Object.keys(META_SETS));
  const rest = SPECIES_NAMES.filter((s) => !meta.has(s) && s !== exclude);
  return [...metaCandidatePool(exclude), ...rest];
}

/** Picks `count` species for the comparison list, skipping hidden species
 * and backfilling from the wider dex once the curated meta pool runs out. */
export function pickPool(count: number, exclude: string | undefined, hidden: Set<string>): string[] {
  const base = metaCandidatePool(exclude).filter((s) => !hidden.has(s));
  if (base.length >= count) return base.slice(0, count);
  const rest = widePool(exclude).filter((s) => !hidden.has(s) && !base.includes(s));
  return [...base, ...rest.slice(0, count - base.length)];
}

function koType(range: [number, number] | null, maxHp: number): KoType {
  if (!range || maxHp <= 0) return "none";
  if (range[0] >= maxHp) return "guaranteed";
  if (range[1] >= maxHp) return "possible";
  return "none";
}

/** A fresh defender for `species` at level 50, 0 IV-neutral/31 IV baseline,
 * with the shared bulk Stat Point spread applied — the "0 EV unless
 * configured otherwise" baseline the comparator is specified to use. */
function buildDefender(species: string, defenderSp: Partial<StatsTable>): PokemonState {
  const base = defaultPokemon(species);
  const evs = { ...base.evs };
  (Object.keys(defenderSp) as StatKey[]).forEach((key) => {
    evs[key] = spToEv(defenderSp[key] ?? 0);
  });
  return { ...base, evs };
}

/** Compares move1 vs move2 (same attacker) against one defender species. */
export function compareOne(
  attacker: PokemonState,
  move1: string,
  move2: string,
  field: FieldState,
  defenderSp: Partial<StatsTable>,
  species: string
): MoveCompareEntry | null {
  if (!species || species === attacker.species) return null;
  const defender = buildDefender(species, defenderSp);
  const [r1] = computeMoveResults(attacker, defender, field, [move1]);
  const [r2] = computeMoveResults(attacker, defender, field, [move2]);
  const fail1 = !r1 || !!r1.error || !r1.range;
  const fail2 = !r2 || !!r2.error || !r2.range;
  // Skip only when NEITHER move can be evaluated at all (e.g. both moves
  // are unset) — a move whiffing/being immune here is itself a useful
  // result to show, not something to filter out.
  if (fail1 && fail2) return null;

  const maxHp = computeStats(defender).hp;
  const range1 = fail1 ? null : (r1!.range as [number, number]);
  const range2 = fail2 ? null : (r2!.range as [number, number]);
  const percent1 = fail1 ? null : (r1!.percent as [number, number]);
  const percent2 = fail2 ? null : (r2!.percent as [number, number]);
  const ko1 = koType(range1, maxHp);
  const ko2 = koType(range2, maxHp);

  let category: CompareCategory;
  if (ko1 === "guaranteed" && ko2 !== "guaranteed") category = "move1";
  else if (ko2 === "guaranteed" && ko1 !== "guaranteed") category = "move2";
  else category = "tie";

  const avg1 = percent1 ? (percent1[0] + percent1[1]) / 2 : 0;
  const avg2 = percent2 ? (percent2[0] + percent2[1]) / 2 : 0;

  return { species, percent1, percent2, ko1, ko2, category, avgGap: avg1 - avg2 };
}

export function compareMoves(
  attacker: PokemonState,
  move1: string,
  move2: string,
  field: FieldState,
  defenderSp: Partial<StatsTable>,
  pool: string[]
): MoveCompareEntry[] {
  const entries: MoveCompareEntry[] = [];
  for (const species of pool) {
    const entry = compareOne(attacker, move1, move2, field, defenderSp, species);
    if (entry) entries.push(entry);
  }
  return entries;
}

export function summarize(entries: MoveCompareEntry[]): MoveCompareSummary {
  let move1Kills = 0;
  let move2Kills = 0;
  let move1Stronger = 0;
  let move2Stronger = 0;
  let ties = 0;
  for (const e of entries) {
    if (e.ko1 === "guaranteed") move1Kills++;
    if (e.ko2 === "guaranteed") move2Kills++;
    if (e.category === "move1") move1Stronger++;
    else if (e.category === "move2") move2Stronger++;
    else ties++;
  }
  return { move1Kills, move2Kills, move1Stronger, move2Stronger, ties, total: entries.length };
}

/** Move-1-favoring first (biggest gap first), then ties (biggest |gap|
 * first, since a near-tie next to a total non-event isn't equally
 * interesting), then move-2-favoring. */
export function sortEntries(entries: MoveCompareEntry[]): MoveCompareEntry[] {
  const order: Record<CompareCategory, number> = { move1: 0, tie: 1, move2: 2 };
  return [...entries].sort((a, b) => {
    if (order[a.category] !== order[b.category]) return order[a.category] - order[b.category];
    return Math.abs(b.avgGap) - Math.abs(a.avgGap);
  });
}