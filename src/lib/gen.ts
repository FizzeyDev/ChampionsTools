import { Generations } from "@pkmn/data";
import { Dex } from "@pkmn/dex";
import { CHAMPIONS_ITEM_NAMES } from "./champions/items";
import { MEGA_SPECIES_NAMES } from "./champions/megaSpecies";
import { CHAMPIONS_POKEDEX } from "./champions/pokedex";

// Champions shares most of its dex with Gen 9 Scarlet/Violet, so gen 9 is the
// working data source for movepools/abilities/natures/types. Species (for
// Mega forms) and items (for the real, smaller Champions item pool) are
// overridden — see champions/megaSpecies.ts and champions/items.ts.
export const gens = new Generations(Dex);
export const gen = gens.get(9);

function sortedNames(iterable: Iterable<{ name: string }>): string[] {
  const names: string[] = [];
  for (const item of iterable) names.push(item.name);
  return names.sort((a, b) => a.localeCompare(b));
}

// The species picker is restricted to the ~208 Pokémon actually obtainable
// in Champions (see champions/pokedex.ts) plus its Mega forms — not the
// full Gen 9 national dex.
export const SPECIES_NAMES = Array.from(new Set([...CHAMPIONS_POKEDEX, ...MEGA_SPECIES_NAMES])).sort((a, b) =>
  a.localeCompare(b)
);
export const MOVE_NAMES = sortedNames(gen.moves);
export const ITEM_NAMES = CHAMPIONS_ITEM_NAMES;
export const ABILITY_NAMES = sortedNames(gen.abilities);
export const NATURE_NAMES = sortedNames(gen.natures);
export const TYPE_NAMES = [...gen.types].map((t) => t.name).sort();

// Option values for status/weather/terrain selects. Display labels come from
// the i18n dictionary (status.<value>, weather.<value>, terrain.<value>,
// using "none" for the empty option) — see lib/i18n/translations.ts.
export const STATUS_VALUES = ["", "brn", "par", "slp", "frz", "psn", "tox"];
export const WEATHER_VALUES = ["", "Sun", "Rain", "Sand", "Snow"];
export const TERRAIN_VALUES = ["", "Electric", "Grassy", "Misty", "Psychic"];

export const STAT_KEYS = ["hp", "atk", "def", "spa", "spd", "spe"] as const;
export type StatKey = (typeof STAT_KEYS)[number];