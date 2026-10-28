import { getFinalSpeed } from "@smogon/calc/dist/mechanics/util";
import { buildPokemon, buildField } from "../calc/calcEngine";
import { champGen, MEGA_SPECIES_NAMES } from "../champions/megaSpecies";
import { spToEv, evToSp } from "../champions/statPoints";
import { SPECIES_NAMES } from "../calc/gen";
import { NATURE_EFFECTS } from "../calc/natures";
import { getSpeciesAbilities } from "./speciesAbilities";
import { defaultField, defaultStats, type PokemonState } from "../calc/types";

const MEGA_SET = new Set(MEGA_SPECIES_NAMES);

export function isMegaSpecies(species: string): boolean {
  return MEGA_SET.has(species);
}

// ------------------------------------------------------------------ types ---

/** Which side of the speed list a row belongs to. */
export type Side = "mine" | "opp";
/** Who a global effect applies to. */
export type Scope = "all" | "mine" | "opp";
export type NatureMod = "boost" | "hinder" | "neutral";
/** Row fields that can be edited individually and then stop following the
 * global setting. */
export type OverrideKey = "sp" | "stage" | "natureMod" | "scarf" | "tailwind" | "paralysis";

export interface SpeedRowConfig {
  species: string;
  /** Speed Stat Points, 0-32. */
  sp: number;
  /** Speed stat stage, -6 to +6. */
  stage: number;
  /** A Speed-boosting or -hindering nature, or neutral. */
  natureMod: NatureMod;
  /** Megas can't hold Choice Scarf in-game (they're locked to their Mega
   * Stone) - the UI disables this toggle for them, and resolveRow ignores it
   * defensively either way. */
  scarf: boolean;
  tailwind: boolean;
  paralysis: boolean;
  /** "auto" = use the Pokémon's own speed ability whenever the current
   * weather/terrain triggers it; "none" = ignore abilities; otherwise the
   * exact ability name to assume. */
  abilityChoice: string;
  /** Manual-trigger abilities: Unburden (item consumed), Quick Feet (has a
   * status), Speed Boost (one turn passed, +1 stage). */
  abilityOn: boolean;
  /** Fields the user edited on this row: they ignore the global setting. */
  overrides: Partial<Record<OverrideKey, boolean>>;
}

export function defaultRowConfig(species: string): SpeedRowConfig {
  return {
    species,
    sp: 0,
    stage: 0,
    natureMod: "neutral",
    scarf: false,
    tailwind: false,
    paralysis: false,
    abilityChoice: "auto",
    abilityOn: false,
    overrides: {},
  };
}

/** Effects that apply to a whole group at once. `null` = "not set". */
export interface SpeedGlobal {
  contextScope: Scope;
  weather: string;
  terrain: string;
  tailwind: boolean;
  trickRoom: boolean;
  spreadScope: Scope;
  spread: {
    sp: number | null;
    natureMod: NatureMod | null;
    stage: number | null;
    scarf: boolean | null;
    paralysis: boolean | null;
  };
}

export function defaultGlobal(): SpeedGlobal {
  return {
    contextScope: "all",
    weather: "",
    terrain: "",
    tailwind: false,
    trickRoom: false,
    spreadScope: "all",
    spread: { sp: null, natureMod: null, stage: null, scarf: null, paralysis: null },
  };
}

export function globalHasEffects(g: SpeedGlobal): boolean {
  return (
    !!g.weather ||
    !!g.terrain ||
    g.tailwind ||
    g.trickRoom ||
    Object.values(g.spread).some((v) => v !== null)
  );
}

// -------------------------------------------------------- speed abilities ---

/** Abilities that change a Pokémon's Speed, with how they are triggered. */
export const SPEED_ABILITIES: Record<string, "weather" | "terrain" | "manual"> = {
  Chlorophyll: "weather",
  "Swift Swim": "weather",
  "Sand Rush": "weather",
  "Slush Rush": "weather",
  "Surge Surfer": "terrain",
  Unburden: "manual",
  "Quick Feet": "manual",
  "Speed Boost": "manual",
};

function abilityTriggered(ability: string, weather: string, terrain: string): boolean {
  switch (ability) {
    case "Chlorophyll":
      return weather === "Sun";
    case "Swift Swim":
      return weather === "Rain";
    case "Sand Rush":
      return weather === "Sand";
    case "Slush Rush":
      return weather === "Snow";
    case "Surge Surfer":
      return terrain === "Electric";
    default:
      return false;
  }
}

/** The Pokémon's real abilities that affect Speed (what the picker offers). */
export function speedAbilitiesOf(species: string): string[] {
  return getSpeciesAbilities(species).filter((a) => a in SPEED_ABILITIES);
}

// ---------------------------------------------------------------- resolve ---

export interface SpeedBadge {
  id: string;
  text: string;
  origin: "global" | "ability";
}

export interface ResolvedRow {
  species: string;
  sp: number;
  stage: number;
  natureMod: NatureMod;
  scarf: boolean;
  tailwind: boolean;
  paralysis: boolean;
  weather: string;
  terrain: string;
  /** The speed ability actually in effect ("" = none). */
  ability: string;
  abilityOn: boolean;
  abilitySource: "none" | "auto" | "manual";
  /** What is being applied from the global panels (shown as small tags). */
  badges: SpeedBadge[];
}

const inScope = (scope: Scope, side: Side) => scope === "all" || scope === side;

/** Merges a row's own settings with the global context/spread for its side. */
export function resolveRow(config: SpeedRowConfig, side: Side, g: SpeedGlobal): ResolvedRow {
  const badges: SpeedBadge[] = [];
  const ctx = inScope(g.contextScope, side);
  const spr = inScope(g.spreadScope, side);
  const ov = config.overrides;

  let sp = config.sp;
  let natureMod = config.natureMod;
  let stage = config.stage;
  let scarf = config.scarf;
  let paralysis = config.paralysis;
  let tailwind = config.tailwind;

  if (spr) {
    if (!ov.sp && g.spread.sp !== null) {
      sp = g.spread.sp;
      badges.push({ id: "sp", text: `${sp} SP`, origin: "global" });
    }
    if (!ov.natureMod && g.spread.natureMod !== null) {
      natureMod = g.spread.natureMod;
      badges.push({
        id: "nature",
        text: natureMod === "boost" ? "+Spe" : natureMod === "hinder" ? "−Spe" : "Spe •",
        origin: "global",
      });
    }
    if (!ov.stage && g.spread.stage !== null) {
      stage = g.spread.stage;
      badges.push({ id: "stage", text: stage > 0 ? `+${stage}` : String(stage), origin: "global" });
    }
    if (!ov.scarf && g.spread.scarf !== null) {
      scarf = g.spread.scarf;
      if (scarf) badges.push({ id: "scarf", text: "Scarf", origin: "global" });
    }
    if (!ov.paralysis && g.spread.paralysis !== null) {
      paralysis = g.spread.paralysis;
      if (paralysis) badges.push({ id: "par", text: "Par", origin: "global" });
    }
  }

  const weather = ctx ? g.weather : "";
  const terrain = ctx ? g.terrain : "";
  if (ctx && g.tailwind && !ov.tailwind) {
    tailwind = true;
    badges.push({ id: "tailwind", text: "Tailwind", origin: "global" });
  }
  if (weather) badges.push({ id: "weather", text: weather, origin: "global" });
  if (terrain) badges.push({ id: "terrain", text: terrain, origin: "global" });

  const mega = isMegaSpecies(config.species);
  if (mega) scarf = false;

  // Ability resolution
  const own = speedAbilitiesOf(config.species);
  let ability = "";
  let abilitySource: ResolvedRow["abilitySource"] = "none";
  if (config.abilityChoice === "auto") {
    const hit = own.find((a) => SPEED_ABILITIES[a] !== "manual" && abilityTriggered(a, weather, terrain));
    if (hit) {
      ability = hit;
      abilitySource = "auto";
    }
  } else if (config.abilityChoice !== "none") {
    ability = config.abilityChoice;
    abilitySource = "manual";
  }
  if (ability && abilitySource !== "none") {
    const kind = SPEED_ABILITIES[ability];
    const active = kind === "manual" ? config.abilityOn : abilityTriggered(ability, weather, terrain);
    if (active) badges.push({ id: "ability", text: ability, origin: "ability" });
  }

  return {
    species: config.species,
    sp,
    stage,
    natureMod,
    scarf,
    tailwind,
    paralysis,
    weather,
    terrain,
    ability,
    abilityOn: config.abilityOn,
    abilitySource,
    badges,
  };
}

// ----------------------------------------------------------- base speeds ---

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
 * evenly as possible between faster and slower - half above, half below,
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

// ------------------------------------------------------------ final speed ---

/** Builds a minimal PokemonState for a comparator row and returns its true
 * final Speed (item, nature, stage, Tailwind, weather/terrain abilities,
 * paralysis all applied) via the same getFinalSpeed() the real damage calc
 * uses. */
export function computeRowSpeed(row: ResolvedRow): number {
  const kind = row.ability ? SPEED_ABILITIES[row.ability] : undefined;
  const manualOn = kind === "manual" && row.abilityOn;
  const unburden = row.ability === "Unburden" && manualOn;
  // Speed Boost isn't modelled by the engine (it ramps up each turn): treat
  // "on" as one turn elapsed = +1 stage.
  const stageBonus = row.ability === "Speed Boost" && manualOn ? 1 : 0;
  // Quick Feet needs a status to matter; paralysis itself already is one.
  const status = row.paralysis ? "par" : row.ability === "Quick Feet" && manualOn ? "brn" : "";

  const state: PokemonState = {
    species: row.species,
    level: 50,
    item: row.scarf && !isMegaSpecies(row.species) && !unburden ? "Choice Scarf" : "",
    itemLocked: false,
    ability: row.ability,
    nature: row.natureMod === "boost" ? "Timid" : row.natureMod === "hinder" ? "Brave" : "Hardy",
    teraType: "",
    useTera: false,
    status,
    abilityOn: unburden,
    alliesFainted: 0,
    evs: { ...defaultStats(0), spe: spToEv(row.sp) },
    ivs: defaultStats(31),
    boosts: { ...defaultStats(0), spe: Math.max(-6, Math.min(6, row.stage + stageBonus)) },
    moves: ["", "", "", ""],
    critMoves: [false, false, false, false],
  };

  const pokemon = buildPokemon(state);
  const baseField = defaultField();
  const field = buildField({
    ...baseField,
    weather: row.weather,
    terrain: row.terrain,
    attackerSide: { ...baseField.attackerSide, isTailwind: row.tailwind },
  });
  return getFinalSpeed(champGen, pokemon, field, field.attackerSide);
}

/** Convenience: resolve + compute in one step. */
export function speedOf(config: SpeedRowConfig, side: Side, g: SpeedGlobal): number {
  return computeRowSpeed(resolveRow(config, side, g));
}

// ------------------------------------------------------------ team import ---

/** Turns a saved team member into a row that keeps their real build. */
export function rowFromPokemon(p: PokemonState): SpeedRowConfig {
  const eff = NATURE_EFFECTS[p.nature] ?? { plus: null, minus: null };
  const natureMod: NatureMod = eff.plus === "spe" ? "boost" : eff.minus === "spe" ? "hinder" : "neutral";
  const own = speedAbilitiesOf(p.species);
  return {
    ...defaultRowConfig(p.species),
    sp: evToSp(p.evs.spe),
    stage: p.boosts.spe ?? 0,
    natureMod,
    scarf: p.item === "Choice Scarf",
    paralysis: p.status === "par",
    abilityChoice: p.ability && own.includes(p.ability) ? p.ability : "auto",
    abilityOn: p.abilityOn,
    // The member's own build wins over any global "reference spread".
    overrides: { sp: true, stage: true, natureMod: true, scarf: true, paralysis: true },
  };
}

/** Quick presets for the global reference spread. */
export const SPREAD_PRESETS: { id: string; spread: SpeedGlobal["spread"] }[] = [
  { id: "maxPlus", spread: { sp: 32, natureMod: "boost", stage: null, scarf: null, paralysis: null } },
  { id: "maxNeutral", spread: { sp: 32, natureMod: "neutral", stage: null, scarf: null, paralysis: null } },
  { id: "zero", spread: { sp: 0, natureMod: "neutral", stage: null, scarf: null, paralysis: null } },
  { id: "scarf", spread: { sp: 32, natureMod: "boost", stage: null, scarf: true, paralysis: null } },
];
