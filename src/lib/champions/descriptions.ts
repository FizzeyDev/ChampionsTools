import { gen } from "../gen";
import { champGen } from "./megaSpecies";

/** Official short description of a move, ability, or item, straight from
 * the game data — used as tooltips/dropdown subtitles so people don't have
 * to leave the site to check what something does. Returns "" if unknown. */
export function getMoveDescription(name: string): string {
  const m = gen.moves.get(name);
  return m?.shortDesc || m?.desc || "";
}

export function getAbilityDescription(name: string): string {
  const a = gen.abilities.get(name);
  return a?.shortDesc || a?.desc || "";
}

export function getItemDescription(name: string): string {
  const id = name.toLowerCase().replace(/[^a-z0-9]/g, "");
  const it = champGen.items.get(id) as { shortDesc?: string; desc?: string } | undefined;
  return it?.shortDesc || it?.desc || "";
}