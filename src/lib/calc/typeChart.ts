import { gen, TYPE_NAMES } from "./gen";

const CODE_TO_MULTIPLIER: Record<number, number> = {
  0: 1, // normal damage
  1: 2, // this type is weak to the attacking type
  2: 0.5, // this type resists the attacking type
  3: 0, // this type is immune to the attacking type
};

/**
 * Returns, for each of the 18 attacking types, the damage multiplier a
 * Pokémon with `defenderTypes` would take (combining both types).
 */
export function computeTypeChart(defenderTypes: string[]): Record<string, number> {
  const chart: Record<string, number> = {};
  for (const atk of TYPE_NAMES) {
    let mult = 1;
    for (const def of defenderTypes) {
      const t = gen.types.get(def as never) as { damageTaken?: Record<string, number> } | undefined;
      if (!t?.damageTaken) continue;
      const code = t.damageTaken[atk];
      mult *= CODE_TO_MULTIPLIER[code] ?? 1;
    }
    chart[atk] = mult;
  }
  return chart;
}