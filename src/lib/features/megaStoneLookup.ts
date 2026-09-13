import { champGen, MEGA_SPECIES_NAMES } from "../champions/megaSpecies";
import { MEGA_STONES, NEW_MEGA_STONES } from "../champions/items";

const ALL_STONES = [...MEGA_STONES, ...NEW_MEGA_STONES];
const MEGA_NAME_SET = new Set(MEGA_SPECIES_NAMES);

function suffix(name: string): "Z" | "X" | "Y" | null {
  if (/\bZ$/.test(name)) return "Z";
  if (/\bX$/.test(name)) return "X";
  if (/\bY$/.test(name)) return "Y";
  return null;
}

/**
 * Given a Mega species' display name (e.g. "Mega Absol Z", "Charizard-Mega-X"),
 * returns the exact Mega Stone item that unlocks it — or null if the species
 * isn't a Mega, or no stone could be matched (e.g. a Mega was added to
 * megaSpecies.ts without a corresponding entry in items.ts yet).
 */
export function getMegaStoneItem(megaSpeciesName: string): string | null {
  if (!megaSpeciesName) return null;
  // Checking against our own defined Mega list (rather than "does this
  // species' baseSpecies differ from its own name") matters: ANY alternate
  // forme (Floette-Eternal, Rotom-Wash, regional forms...) has a different
  // baseSpecies too, and would otherwise be misdetected as a Mega and
  // incorrectly locked onto that base species' Mega Stone.
  if (!MEGA_NAME_SET.has(megaSpeciesName)) return null;
  const id = megaSpeciesName.toLowerCase().replace(/[^a-z0-9]/g, "");
  const s = champGen.species.get(id) as { baseSpecies?: string; name?: string } | undefined;
  if (!s?.baseSpecies) return null;

  const candidates = ALL_STONES.filter((stone) => stone.species === s.baseSpecies);
  if (candidates.length === 0) return null;
  if (candidates.length === 1) return candidates[0].item;

  // Multiple stones for this base species (Charizard, Raichu, Absol,
  // Garchomp, Lucario) — disambiguate by matching the X/Y/Z suffix.
  const wantedSuffix = suffix(megaSpeciesName);
  const match = candidates.find((stone) => suffix(stone.item) === wantedSuffix);
  return match?.item ?? candidates[0].item;
}