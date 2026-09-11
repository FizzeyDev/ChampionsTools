import { gen } from "./gen";
import { champGen } from "./champions/megaSpecies";
import { REGIONAL_ARTWORK_IDS, MISSING_ITEM_SPRITES, MEGA_ARTWORK_IDS, ITEM_SPRITE_ALIASES } from "./features/spriteOverrides";

const SPRITES_BASE = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites";

// Official game type IDs (Normal…Stellar), used by the sprites repo's
// generation-ix/scarlet-violet type icon set.
const TYPE_IDS: Record<string, number> = {
  Normal: 1,
  Fighting: 2,
  Flying: 3,
  Poison: 4,
  Ground: 5,
  Rock: 6,
  Bug: 7,
  Ghost: 8,
  Steel: 9,
  Fire: 10,
  Water: 11,
  Grass: 12,
  Electric: 13,
  Psychic: 14,
  Ice: 15,
  Dragon: 16,
  Dark: 17,
  Fairy: 18,
  Stellar: 19,
};

export function typeIconUrl(type: string | undefined): string | null {
  if (!type) return null;
  const id = TYPE_IDS[type];
  if (!id) return null;
  return `${SPRITES_BASE}/types/generation-ix/scarlet-violet/${id}.png`;
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
    return `/custom-sprites/items/${kebab}.png`;
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