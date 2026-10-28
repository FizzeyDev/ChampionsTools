// Single source of truth for "what exists in Pokémon Champions" as far as the
// browsing/search features are concerned: one synchronous species table plus
// an async, cached learnset index (reverse lookups like "every Pokémon that
// learns Fake Out"). Everything here is derived from the same layers the
// calculator already uses (champGen + corrections.ts + curated META_SETS) so
// the Pokédex, the search and the damage calc can never disagree.

import { Dex } from "@pkmn/dex";
import { champGen, MEGA_SPECIES_NAMES } from "./megaSpecies";
import { SPECIES_NAMES, MOVE_NAMES, TYPE_NAMES, gen } from "../calc/gen";
import { getChampionsMoveset } from "./moveset";
import { META_SETS } from "./metaSets";
import { CHAMPIONS_ITEM_NAMES, MEGA_STONES, NEW_MEGA_STONES } from "./items";
import { getItemCategory, type ItemCategory } from "./itemCategories";
import { getMoveDescription, getAbilityDescription, getItemDescription } from "./descriptions";
import { computeTypeChart } from "../calc/typeChart";
import type { StatsTable } from "../calc/types";

export const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
const MEGA_SET = new Set(MEGA_SPECIES_NAMES);

export interface SpeciesInfo {
  name: string;
  num: number;
  types: string[];
  baseStats: StatsTable;
  bst: number;
  /** Regular ability slots (1 or 2). */
  abilities: string[];
  hiddenAbility: string | null;
  isMega: boolean;
  /** Base species name (itself for non-Megas). */
  baseSpecies: string;
  /** Mega forms available for this base species. */
  megaForms: string[];
  hasMetaSet: boolean;
  /** Defensive multiplier per attacking type, precomputed. */
  chart: Record<string, number>;
}

const ZERO: StatsTable = { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 };
const infoCache = new Map<string, SpeciesInfo | null>();

export function getSpeciesInfo(name: string): SpeciesInfo | null {
  if (!name) return null;
  if (infoCache.has(name)) return infoCache.get(name)!;
  const s = champGen.species.get(norm(name)) as
    | {
        num?: number;
        types?: string[];
        baseStats?: StatsTable;
        abilities?: Record<string, string>;
        baseSpecies?: string;
      }
    | undefined;
  // `species.get` hands back a placeholder object for unknown names, so also
  // require that it really exists and has stats.
  const real = s as { exists?: boolean } | undefined;
  if (!s || real?.exists === false || !s.baseStats || !s.types || !Object.values(s.baseStats).some((v) => v > 0)) {
    infoCache.set(name, null);
    return null;
  }
  const abil = s.abilities ?? {};
  const isMega = MEGA_SET.has(name);
  const baseSpecies = isMega ? s.baseSpecies || name : name;
  const baseStats = { ...ZERO, ...s.baseStats };
  const info: SpeciesInfo = {
    name,
    num: s.num ?? 0,
    types: [...s.types],
    baseStats,
    bst: Object.values(baseStats).reduce((a, b) => a + b, 0),
    abilities: [abil[0], abil[1]].filter((a): a is string => !!a),
    hiddenAbility: abil.H ?? null,
    isMega,
    baseSpecies,
    megaForms: [],
    hasMetaSet: !!META_SETS[name],
    chart: computeTypeChart(s.types),
  };
  infoCache.set(name, info);
  return info;
}

let allCache: SpeciesInfo[] | null = null;

/** Every species selectable in Champions (base forms + Megas). */
export function getAllSpecies(): SpeciesInfo[] {
  if (allCache) return allCache;
  const list: SpeciesInfo[] = [];
  for (const n of SPECIES_NAMES) {
    const i = getSpeciesInfo(n);
    if (i) list.push(i);
  }
  const byBase = new Map<string, string[]>();
  for (const i of list) {
    if (i.isMega) byBase.set(i.baseSpecies, [...(byBase.get(i.baseSpecies) ?? []), i.name]);
  }
  for (const i of list) i.megaForms = byBase.get(i.name) ?? [];
  allCache = list;
  return list;
}

/** Real ability slots including the hidden one, de-duplicated. */
export function allAbilitiesOf(info: SpeciesInfo): string[] {
  return Array.from(new Set([...info.abilities, ...(info.hiddenAbility ? [info.hiddenAbility] : [])]));
}

// ---------------------------------------------------------------- Moves ---

export interface MoveInfo {
  name: string;
  type: string;
  category: "Physical" | "Special" | "Status";
  basePower: number;
  accuracy: number | true;
  pp: number;
  priority: number;
  target: string;
  description: string;
}

const moveCache = new Map<string, MoveInfo | null>();

export function getMoveInfo(name: string): MoveInfo | null {
  if (moveCache.has(name)) return moveCache.get(name)!;
  // Some moves Champions allows are hidden ("Past") in the Gen 9 dex: fall
  // back to the raw dex for those (see RESTORED_MOVES in corrections.ts).
  const gm = gen.moves.get(norm(name) as never);
  const raw = gm && (gm as { exists?: boolean }).exists !== false ? gm : Dex.moves.get(name);
  const m = raw as
    | {
        name: string;
        type: string;
        category: "Physical" | "Special" | "Status";
        basePower: number;
        accuracy: number | true;
        pp: number;
        priority: number;
        target: string;
        exists?: boolean;
      }
    | undefined;
  if (!m || m.exists === false) {
    moveCache.set(name, null);
    return null;
  }
  const info: MoveInfo = {
    name: m.name,
    type: m.type,
    category: m.category,
    basePower: m.basePower,
    accuracy: m.accuracy,
    pp: m.pp,
    priority: m.priority,
    target: m.target,
    description: getMoveDescription(m.name),
  };
  moveCache.set(name, info);
  return info;
}

export const ALL_MOVE_NAMES: string[] = MOVE_NAMES;

// ------------------------------------------------------------ Abilities ---

export interface AbilityEntry {
  name: string;
  description: string;
  /** Species (incl. Megas) that can have it. */
  species: string[];
}

let abilityIndex: AbilityEntry[] | null = null;

export function getAbilityIndex(): AbilityEntry[] {
  if (abilityIndex) return abilityIndex;
  const map = new Map<string, string[]>();
  for (const info of getAllSpecies()) {
    for (const a of allAbilitiesOf(info)) {
      map.set(a, [...(map.get(a) ?? []), info.name]);
    }
  }
  abilityIndex = Array.from(map.entries())
    .map(([name, species]) => ({ name, description: getAbilityDescription(name), species }))
    .sort((a, b) => a.name.localeCompare(b.name));
  return abilityIndex;
}

// ---------------------------------------------------------------- Items ---

export interface ItemEntry {
  name: string;
  category: ItemCategory;
  description: string;
  /** For Mega Stones: the species it Mega-Evolves. */
  megaSpecies?: string;
}

let itemIndex: ItemEntry[] | null = null;

export function getItemIndex(): ItemEntry[] {
  if (itemIndex) return itemIndex;
  const stones = new Map<string, string>();
  for (const s of [...MEGA_STONES, ...NEW_MEGA_STONES]) stones.set(s.item, s.species);
  itemIndex = [...CHAMPIONS_ITEM_NAMES]
    .sort((a, b) => a.localeCompare(b))
    .map((name) => ({
      name,
      category: getItemCategory(name),
      description: getItemDescription(name),
      megaSpecies: stones.get(name),
    }));
  return itemIndex;
}

// ------------------------------------------------------------ Learnsets ---

export interface LearnsetIndex {
  bySpecies: Map<string, Set<string>>;
  byMove: Map<string, string[]>;
}

let learnsetPromise: Promise<LearnsetIndex> | null = null;

/** Loads (once) every species' legal Champions movepool in parallel and builds
 * the reverse move → species index used by the move pages and the search. */
export function loadLearnsetIndex(): Promise<LearnsetIndex> {
  if (!learnsetPromise) {
    learnsetPromise = (async () => {
      const species = getAllSpecies();
      const sets = await Promise.all(species.map((s) => getChampionsMoveset(s.name)));
      const bySpecies = new Map<string, Set<string>>();
      const byMove = new Map<string, string[]>();
      species.forEach((s, i) => {
        bySpecies.set(s.name, sets[i]);
        for (const mv of sets[i]) byMove.set(mv, [...(byMove.get(mv) ?? []), s.name]);
      });
      return { bySpecies, byMove };
    })();
  }
  return learnsetPromise;
}

/** Attacking types a species can hit super effectively with a learnable
 * damaging move (any move with base power >= `minPower`). */
export function coverageTypesOf(moves: Iterable<string>, minPower = 40): Set<string> {
  const types = new Set<string>();
  for (const mv of moves) {
    const info = getMoveInfo(mv);
    if (info && info.category !== "Status" && info.basePower >= minPower) types.add(info.type);
  }
  return types;
}

/** The 18 real attacking/defending types (no Stellar). */
export const REAL_TYPES: string[] = TYPE_NAMES.filter((t) => t !== "Stellar" && t !== "???");
