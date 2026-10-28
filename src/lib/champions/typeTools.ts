// Pure helpers behind the Type calculator and the Coverage calculator.

import { computeTypeChart } from "../calc/typeChart";
import { getAllSpecies, REAL_TYPES, type SpeciesInfo } from "./data";

/** Damage multiplier of an attacking type against a (1–2 type) defender. */
export function effectiveness(attack: string, defenderTypes: string[]): number {
  return computeTypeChart(defenderTypes)[attack] ?? 1;
}

/** Defensive table: every attacking type grouped by the multiplier taken. */
export function defensiveGroups(types: string[]): { mult: number; types: string[] }[] {
  if (types.length === 0) return [];
  const chart = computeTypeChart(types);
  const order = [4, 2, 1, 0.5, 0.25, 0];
  return order
    .map((mult) => ({ mult, types: REAL_TYPES.filter((t) => chart[t] === mult) }))
    .filter((g) => g.types.length > 0);
}

/** Champions Pokémon with this typing. `exact` = same types (any order);
 * otherwise they must merely include every selected type. */
export function speciesWithTyping(types: string[], exact: boolean, includeMegas = true): SpeciesInfo[] {
  if (types.length === 0) return [];
  return getAllSpecies().filter((s) => {
    if (!includeMegas && s.isMega) return false;
    const has = types.every((t) => s.types.includes(t));
    return exact ? has && s.types.length === types.length : has;
  });
}

export type CoverageClass = "super" | "neutral" | "resisted" | "immune";

/** For each of the 18 single defending types: the best multiplier any of the
 * chosen attacking types achieves. */
export function coverageGrid(attackTypes: string[]): { defender: string; best: number; cls: CoverageClass }[] {
  return REAL_TYPES.map((defender) => {
    const best = attackTypes.length ? Math.max(...attackTypes.map((a) => effectiveness(a, [defender]))) : 1;
    const cls: CoverageClass = best >= 2 ? "super" : best === 1 ? "neutral" : best === 0 ? "immune" : "resisted";
    return { defender, best, cls };
  });
}

/** Champions Pokémon (real typings, dual types included) that NONE of the
 * chosen attacking types hits super effectively. */
export function uncoveredSpecies(attackTypes: string[], includeMegas = true): SpeciesInfo[] {
  if (attackTypes.length === 0) return [];
  return getAllSpecies().filter(
    (s) => (includeMegas || !s.isMega) && attackTypes.every((a) => (s.chart[a] ?? 1) < 2)
  );
}

/** Champions Pokémon (real typings) that resist EVERY chosen attacking type
 * (each hits for x0.5 or less, or not at all). "immune" lists the ones none of
 * the chosen types can touch. */
export function resistantSpecies(
  attackTypes: string[],
  includeMegas = true
): { resist: SpeciesInfo[]; immune: SpeciesInfo[] } {
  if (attackTypes.length === 0) return { resist: [], immune: [] };
  const resist: SpeciesInfo[] = [];
  const immune: SpeciesInfo[] = [];
  for (const s of getAllSpecies()) {
    if (!includeMegas && s.isMega) continue;
    const mults = attackTypes.map((a) => s.chart[a] ?? 1);
    if (!mults.every((m) => m <= 0.5)) continue;
    (mults.every((m) => m === 0) ? immune : resist).push(s);
  }
  return { resist, immune };
}

export interface FillSuggestion {
  type: string;
  /** How many currently-uncovered Pokémon this type would newly hit super effectively. */
  newlyCovered: number;
}

/** Which extra attacking types would close the most gaps. A calculation only -
 * it ranks types by how many uncovered Pokémon they add, nothing more. */
export function fillSuggestions(attackTypes: string[], uncovered: SpeciesInfo[]): FillSuggestion[] {
  return REAL_TYPES.filter((t) => !attackTypes.includes(t))
    .map((type) => ({ type, newlyCovered: uncovered.filter((s) => (s.chart[type] ?? 1) >= 2).length }))
    .filter((f) => f.newlyCovered > 0)
    .sort((a, b) => b.newlyCovered - a.newlyCovered || a.type.localeCompare(b.type));
}
