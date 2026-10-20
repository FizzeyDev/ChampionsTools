import { gen } from "./gen";
import { champGen } from "./champions/megaSpecies";
import { REGIONAL_ARTWORK_IDS, MISSING_ITEM_SPRITES, MEGA_ARTWORK_IDS, ITEM_SPRITE_ALIASES } from "./features/spriteOverrides";

const SPRITES_BASE = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites";
// Needed so /custom-sprites/... (a real file in our own /public folder)
// still resolves correctly when the site is deployed under a subpath, e.g.
// GitHub Pages project sites (username.github.io/repo-name/...). Set at
// build time — see next.config.ts. Exported so any component rendering a
// plain <img>/<Image> pointing at a local /public file can prefix it too:
// next/image does NOT auto-prepend basePath when images.unoptimized is on
// (confirmed by inspecting the static-export output), so every hardcoded
// "/something.svg" needs this by hand or it silently 404s under a subpath
// deployment like username.github.io/repo-name/.
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

// Round, TCG-energy-style badges (colored circle + a distinct glyph per
// type) living in our own /public/type-icons — the official in-game type
// banners (PokeAPI's generation-ix/scarlet-violet set) read as a small
// colored dash and are hard to tell apart at a glance, especially at small
// sizes. One SVG per type, lowercase filename.
const TYPE_ICON_NAMES = new Set([
  "normal",
  "fighting",
  "flying",
  "poison",
  "ground",
  "rock",
  "bug",
  "ghost",
  "steel",
  "fire",
  "water",
  "grass",
  "electric",
  "psychic",
  "ice",
  "dragon",
  "dark",
  "fairy",
  "stellar",
]);

export function typeIconUrl(type: string | undefined): string | null {
  if (!type) return null;
  const key = type.toLowerCase();
  if (!TYPE_ICON_NAMES.has(key)) return null;
  return `${BASE_PATH}/type-icons/${key}.svg`;
}

export function pokemonSpriteUrl(species: string, small = false): string | null {
  if (!species) return null;
  if (MEGA_ARTWORK_IDS[species]) {
    const id = MEGA_ARTWORK_IDS[species];
    return small
      ? `${SPRITES_BASE}/pokemon/${id}.png`
      : `${SPRITES_BASE}/pokemon/other/official-artwork/${id}.png`;
  }
  if (REGIONAL_ARTWORK_IDS[species]) {
    const id = REGIONAL_ARTWORK_IDS[species];
    return small
      ? `${SPRITES_BASE}/pokemon/${id}.png`
      : `${SPRITES_BASE}/pokemon/other/official-artwork/${id}.png`;
  }
  const s = champGen.species.get(species as never) as { num?: number } | undefined;
  const num = s?.num;
  if (!num) return null;
  return small
    ? `${SPRITES_BASE}/pokemon/${num}.png`
    : `${SPRITES_BASE}/pokemon/other/official-artwork/${num}.png`;
}

function toKebab(name: string): string {
  return name
    .toLowerCase()
    .replace(/'/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function itemSpriteUrl(item: string | undefined): string | null {
  if (!item) return null;
  const kebab = toKebab(item);
  if (MISSING_ITEM_SPRITES.includes(kebab)) {
    return `${BASE_PATH}/custom-sprites/items/${kebab}.png`;
  }
  const resolved = ITEM_SPRITE_ALIASES[kebab] ?? kebab;
  return `${SPRITES_BASE}/items/${resolved}.png`;
}

export function moveInfo(move: string): { type?: string; category?: string; bp?: number } {
  const m = gen.moves.get(move);
  if (!m) return {};
  return { type: m.type, category: m.category, bp: m.basePower };
}

export function speciesTypes(species: string): string[] {
  const s = champGen.species.get(species as never);
  return s ? [...s.types] : [];
}