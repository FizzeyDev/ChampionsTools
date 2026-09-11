import { champGen } from "../champions/megaSpecies";
import { MEGA_STONES, NEW_MEGA_STONES } from "../champions/items";

const ALL_STONES = [...MEGA_STONES, ...NEW_MEGA_STONES];

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
  const id = megaSpeciesName.toLowerCase().replace(/[^a-z0-9]/g, "");
  const s = champGen.species.get(id) as { baseSpecies?: string; name?: string } | undefined;
  if (!s?.baseSpecies || s.baseSpecies === megaSpeciesName) return null; // not a Mega (base form)

  const candidates = ALL_STONES.filter((stone) => stone.species === s.baseSpecies);
  if (candidates.length === 0) return null;
  if (candidates.length === 1) return candidates[0].item;

  // Multiple stones for this base species (Charizard, Raichu, Absol,
  // Garchomp, Lucario) — disambiguate by matching the X/Y/Z suffix.
  const wantedSuffix = suffix(megaSpeciesName);
  const match = candidates.find((stone) => suffix(stone.item) === wantedSuffix);
  return match?.item ?? candidates[0].item;
}