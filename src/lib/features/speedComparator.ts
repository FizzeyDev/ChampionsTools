import { getFinalSpeed } from "@smogon/calc/dist/mechanics/util";
import { buildPokemon, buildField } from "../calcEngine";
import { champGen, MEGA_SPECIES_NAMES } from "../champions/megaSpecies";
import { spToEv } from "../champions/statPoints";
import { SPECIES_NAMES } from "../gen";
import { defaultField, defaultStats, type PokemonState } from "../types";

const MEGA_SET = new Set(MEGA_SPECIES_NAMES);

export function isMegaSpecies(species: string): boolean {
  return MEGA_SET.has(species);
}

export interface SpeedRowConfig {
  species: string;
  /** Speed Stat Points, 0-32. */
  sp: number;
  /** Speed stat stage, -6 to +6. */
  stage: number;
  /** A Speed-boosting or -hindering nature, or neutral. */
  natureMod: "boost" | "hinder" | "neutral";
  /** Megas can't hold Choice Scarf in-game (they're locked to their Mega
   * Stone) — the UI disables this toggle for them, and computeRowSpeed
   * ignores it defensively either way. */
  scarf: boolean;
  tailwind: boolean;
}

export function defaultRowConfig(species: string): SpeedRowConfig {
  return { species, sp: 0, stage: 0, natureMod: "neutral", scarf: false, tailwind: false };
}

let baseSpeedCache: { species: string; base: number }[] | null = null;

/** Every selectable species with its base Speed stat, computed once. */
export function getAllBaseSpeeds(): { species: string; base: number }[] {
  if (baseSpeedCache) return baseSpeedCache;
  const out: { species: string; base: number }[] = [];
  for (const species of SPECIES_NAMES) {
    const id = species.toLowerCase().replace(/[^a-z0-9]/g, "");
    const s = champGen.species.get(id) as { baseStats?: { spe: number } } | undefined;
    if (s?.baseStats) out.push({ species, base: s.baseStats.spe });
  }
  baseSpeedCache = out;
  return out;
}

export function baseSpeedOf(species: string): number {
  const id = species.toLowerCase().replace(/[^a-z0-9]/g, "");
  const s = champGen.species.get(id) as { baseStats?: { spe: number } } | undefined;
  return s?.baseStats?.spe ?? 0;
}

/** The `count` species with the highest base Speed, excluding `exclude`. */
export function getFastestSpecies(count: number, exclude?: string): string[] {
  return getAllBaseSpeeds()
    .filter((e) => e.species !== exclude)
    .sort((a, b) => b.base - a.base)
    .slice(0, count)
    .map((e) => e.species);
}

/**
 * The `count` species whose base Speed is closest to `species`, split as
 * evenly as possible between faster and slower — half above, half below,
 * with any shortfall on one side backfilled from the other (e.g. only 2
 * faster exist -> those 2 plus the 8 next-closest slower ones).
 */
export function getClosestSpecies(species: string, count: number): string[] {
  const target = baseSpeedOf(species);
  const all = getAllBaseSpeeds().filter((e) => e.species !== species);

  const faster = all.filter((e) => e.base >= target).sort((a, b) => a.base - b.base); // ascending: closest first
  const slower = all.filter((e) => e.base < target).sort((a, b) => b.base - a.base); // descending: closest first

  const half = Math.ceil(count / 2);
  const takeFasterInitial = Math.min(half, faster.length);
  const takeSlowerInitial = Math.min(count - takeFasterInitial, slower.length);
  // Backfill any shortfall from the other side.
  const takeFaster = Math.min(faster.length, count - takeSlowerInitial);
  const takeSlower = Math.min(slower.length, count - takeFaster);

  const picked = [...faster.slice(0, takeFaster), ...slower.slice(0, takeSlower)];
  return picked.map((e) => e.species);
}

/** Builds a minimal PokemonState for a comparator row and returns its true
 * final Speed (item, nature, stage, Tailwind all applied) via the same
 * getFinalSpeed() the real damage calc uses. */
export function computeRowSpeed(config: SpeedRowConfig): number {
  const scarfApplies = config.scarf && !isMegaSpecies(config.species);
  const state: PokemonState = {
    species: config.species,
    level: 50,
    item: scarfApplies ? "Choice Scarf" : "",
    itemLocked: false,
    ability: "",
    nature: config.natureMod === "boost" ? "Timid" : config.natureMod === "hinder" ? "Brave" : "Hardy",
    teraType: "",
    useTera: false,
    status: "",
    abilityOn: false,
    alliesFainted: 0,
    evs: { ...defaultStats(0), spe: spToEv(config.sp) },
    ivs: defaultStats(31),
    boosts: { ...defaultStats(0), spe: Math.max(-6, Math.min(6, config.stage)) },
    moves: ["", "", "", ""],
    critMoves: [false, false, false, false],
  };

  const pokemon = buildPokemon(state);
  const baseField = defaultField();
  const field = buildField({
    ...baseField,
    attackerSide: { ...baseField.attackerSide, isTailwind: config.tailwind },
  });
  return getFinalSpeed(champGen, pokemon, field, field.attackerSide);
}