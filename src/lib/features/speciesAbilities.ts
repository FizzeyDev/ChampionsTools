import { champGen } from "../champions/megaSpecies";

/** Returns the species' real ability slots (normal 1, normal 2, hidden), in order. */
export function getSpeciesAbilities(species: string): string[] {
  if (!species) return [];
  const id = species.toLowerCase().replace(/[^a-z0-9]/g, "");
  const s = champGen.species.get(id) as { abilities?: Record<string, string> } | undefined;
  if (!s?.abilities) return [];
  return Object.values(s.abilities).filter((a): a is string => !!a);
}