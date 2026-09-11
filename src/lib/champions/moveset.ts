import { Dex } from "@pkmn/dex";
import { gen } from "../gen";
import { champGen } from "./megaSpecies";

const cache = new Map<string, Promise<Set<string>>>();

/** Mega forms don't have their own learnset entry — they use their base
 * species' moveset unchanged, so resolve to that first. */
function resolveLearnsetId(species: string): string {
  const id = species.toLowerCase().replace(/[^a-z0-9]/g, "");
  const s = champGen.species.get(id) as { baseSpecies?: string } | undefined;
  const base = s?.baseSpecies || species;
  return base.toLowerCase().replace(/[^a-z0-9]/g, "");
}

async function fetchMoveset(learnsetId: string): Promise<Set<string>> {
  try {
    const learnsetData = await Dex.learnsets.get(learnsetId);
    const learnset = (learnsetData as { learnset?: Record<string, string[]> })?.learnset;
    if (!learnset) return new Set();

    const gen9Names = new Set<string>();
    const allNames = new Set<string>();
    for (const [moveId, methods] of Object.entries(learnset)) {
      const move = gen.moves.get(moveId as never);
      if (!move) continue;
      allNames.add(move.name);
      // method strings look like "9L30", "9M", "9E", "9T"... (gen prefix 9).
      if (methods.some((m) => m.startsWith("9"))) gen9Names.add(move.name);
    }
    // Species not in SV's own regional dex (e.g. Absol, Beedrill, Alakazam —
    // the same "Past"-tagged species from the sprite fix) have zero
    // gen9-tagged moves even though Champions lets them use their full
    // historical movepool. Fall back to the complete learnset for those.
    return gen9Names.size > 0 ? gen9Names : allNames;
  } catch {
    return new Set();
  }
}

/** Cached, de-duplicated fetch of a species' real Gen 9 / Champions moveset.
 * Mega forms automatically resolve to their base species' moveset. */
export function getChampionsMoveset(species: string): Promise<Set<string>> {
  if (!species) return Promise.resolve(new Set());
  const key = resolveLearnsetId(species);
  if (!cache.has(key)) {
    cache.set(key, fetchMoveset(key));
  }
  return cache.get(key)!;
}