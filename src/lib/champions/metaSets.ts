import type { StatKey } from "../gen";

export interface MetaSet {
  item: string;
  ability: string;
  nature: string;
  /** Stat Points (0-32 each), only the invested stats need to be listed. */
  sp: Partial<Record<StatKey, number>>;
  moves: string[];
  source: string;
  /** False when the exact Stat Point spread wasn't confirmed at the source
   * and a sensible default was used instead — item/ability/nature/moves are
   * still real, sourced data either way. */
  spConfirmed: boolean;
}

// Curated from real Regulation M-A/M-B/M-C usage data — mainly Pikalytics
// (aggregated usage stats across thousands of ranked battles, the closest
// Champions equivalent to Smogon's own usage stats), cross-checked against
// MetaVGC tournament team pages and Game8 for exact Stat Point spreads
// where Pikalytics' own top-usage spread wasn't fetched. Only covers
// Pokémon that actually see competitive play; the vast majority of the
// Champions Pokédex simply isn't used at this level, so there's nothing
// "meta" to source for them (they keep the generic real-ability + first-4
// -moves autofill instead). This list grows over time — see each entry's
// `source` comment to add more or double check one.
export const META_SETS: Record<string, MetaSet> = {
  // --- Pikalytics usage stats, Champions VGC 2026 Reg M-A (pikalytics.com/pokedex/gen9championsvgc2026regma) ---
  // Top-4 moves/item/ability by usage %, unless noted otherwise.
  Kingambit: {
    item: "Chople Berry",
    ability: "Defiant",
    nature: "Adamant",
    sp: { hp: 32, atk: 32, def: 2 },
    moves: ["Sucker Punch", "Kowtow Cleave", "Protect", "Low Kick"],
    source: "Pikalytics usage stats — top SP spread (Adamant 32/32/0/0/2/0, 6.5% of sets) confirmed",
    spConfirmed: true,
  },
  Garchomp: {
    item: "Choice Scarf",
    ability: "Rough Skin",
    nature: "Adamant",
    sp: { hp: 32, atk: 20, def: 1, spd: 1, spe: 12 },
    moves: ["Earthquake", "Dragon Claw", "Rock Slide", "Protect"],
    source: "Pikalytics usage stats; SP spread from Game8 Movesets and Best Builds",
    spConfirmed: true,
  },
  "Charizard-Mega-Y": {
    item: "Charizardite Y",
    ability: "Drought",
    nature: "Timid",
    sp: { hp: 2, spa: 32, spe: 32 },
    moves: ["Heat Wave", "Protect", "Solar Beam", "Weather Ball"],
    source: "Pikalytics usage stats (item is fixed by the Mega stone); SP is a sensible special-sweeper default",
    spConfirmed: false,
  },
  Sneasler: {
    item: "White Herb",
    ability: "Unburden",
    nature: "Jolly",
    sp: { hp: 2, atk: 32, spe: 32 },
    moves: ["Close Combat", "Dire Claw", "Fake Out", "Protect"],
    source: "Pikalytics usage stats; SP is a sensible sweeper default",
    spConfirmed: false,
  },
  Incineroar: {
    item: "Sitrus Berry",
    ability: "Intimidate",
    nature: "Impish",
    sp: { hp: 20, def: 24, spd: 20 },
    moves: ["Fake Out", "Parting Shot", "Flare Blitz", "Throat Chop"],
    source: "Pikalytics usage stats; SP is a sensible bulky-support default",
    spConfirmed: false,
  },
  "Floette-Mega": {
    item: "Floettite",
    ability: "Fairy Aura",
    nature: "Timid",
    sp: { hp: 2, spa: 32, spe: 32 },
    moves: ["Protect", "Dazzling Gleam", "Moonblast", "Light of Ruin"],
    source: "Pikalytics usage stats; SP is a sensible special-sweeper default",
    spConfirmed: false,
  },
  Sinistcha: {
    item: "Kasib Berry",
    ability: "Hospitality",
    nature: "Calm",
    sp: { hp: 32, def: 12, spd: 22 },
    moves: ["Matcha Gotcha", "Rage Powder", "Trick Room", "Life Dew"],
    source: "Pikalytics usage stats; SP is a sensible bulky-support default",
    spConfirmed: false,
  },
  Sylveon: {
    item: "Fairy Feather",
    ability: "Pixilate",
    nature: "Modest",
    sp: { hp: 4, spa: 32, spe: 30 },
    moves: ["Hyper Voice", "Quick Attack", "Protect", "Hyper Beam"],
    source: "Pikalytics usage stats; SP is a sensible special-attacker default",
    spConfirmed: false,
  },
  Whimsicott: {
    item: "Focus Sash",
    ability: "Prankster",
    nature: "Timid",
    sp: { hp: 4, spa: 30, spe: 32 },
    moves: ["Tailwind", "Moonblast", "Encore", "Protect"],
    source: "Pikalytics usage stats; SP is a sensible speed-support default",
    spConfirmed: false,
  },
  Archaludon: {
    item: "Leftovers",
    ability: "Stamina",
    nature: "Sassy",
    sp: { hp: 32, def: 1, spa: 2, spd: 20, spe: 11 },
    moves: ["Flash Cannon", "Protect", "Electro Shot", "Dragon Pulse"],
    source: "Pikalytics usage stats (item); SP spread from a 1st-place MetaVGC tournament team",
    spConfirmed: true,
  },
  Farigiraf: {
    item: "Sitrus Berry",
    ability: "Armor Tail",
    nature: "Sassy",
    sp: { hp: 32, def: 12, spd: 22 },
    moves: ["Trick Room", "Psychic", "Helping Hand", "Protect"],
    source: "Pikalytics usage stats; SP is a sensible slow-support default (fits Trick Room)",
    spConfirmed: false,
  },
  "Aerodactyl-Mega": {
    item: "Aerodactylite",
    ability: "Tough Claws",
    nature: "Jolly",
    sp: { hp: 4, atk: 30, spe: 32 },
    moves: ["Rock Slide", "Dual Wingbeat", "Tailwind", "Protect"],
    source: "Pikalytics usage stats; SP is a sensible fast-attacker default",
    spConfirmed: false,
  },
  Pelipper: {
    item: "Sitrus Berry",
    ability: "Drizzle",
    nature: "Modest",
    sp: { hp: 31, def: 1, spa: 5, spd: 18, spe: 11 },
    moves: ["Hurricane", "Weather Ball", "Tailwind", "Wide Guard"],
    source: "Pikalytics usage stats (moves/item); SP spread from a 1st-place MetaVGC tournament team",
    spConfirmed: true,
  },
  Sableye: {
    item: "Roseli Berry",
    ability: "Prankster",
    nature: "Calm",
    sp: { hp: 32, def: 12, spd: 22 },
    moves: ["Light Screen", "Rain Dance", "Encore", "Reflect"],
    source: "Pikalytics usage stats; SP is a sensible bulky-support default",
    spConfirmed: false,
  },
  "Dragonite-Mega": {
    item: "Dragoninite",
    ability: "Multiscale",
    nature: "Timid",
    sp: { hp: 4, spa: 30, spe: 32 },
    moves: ["Tailwind", "Dragon Pulse", "Protect", "Hurricane"],
    source: "Pikalytics usage stats; SP is a sensible special-sweeper default",
    spConfirmed: false,
  },
  Maushold: {
    item: "Chople Berry",
    ability: "Friend Guard",
    nature: "Jolly",
    sp: { hp: 4, atk: 30, spe: 32 },
    moves: ["Follow Me", "Protect", "Super Fang", "Feint"],
    source: "Pikalytics usage stats; SP is a sensible support default",
    spConfirmed: false,
  },
  Aegislash: {
    item: "Spell Tag",
    ability: "Stance Change",
    nature: "Quiet",
    sp: { hp: 4, atk: 28, spa: 28, spe: 6 },
    moves: ["Shadow Sneak", "Poltergeist", "King's Shield", "Iron Head"],
    source: "Pikalytics usage stats; SP is a sensible mixed-attacker default",
    spConfirmed: false,
  },
  "Blastoise-Mega": {
    item: "Blastoisinite",
    ability: "Mega Launcher",
    nature: "Modest",
    sp: { hp: 4, spa: 32, spe: 30 },
    moves: ["Water Spout", "Dark Pulse", "Fake Out", "Aura Sphere"],
    source: "Pikalytics usage stats; SP is a sensible special-attacker default",
    spConfirmed: false,
  },
  "Rotom-Wash": {
    item: "Sitrus Berry",
    ability: "Levitate",
    nature: "Bold",
    sp: { hp: 32, def: 22, spe: 12 },
    moves: ["Hydro Pump", "Will-O-Wisp", "Thunderbolt", "Protect"],
    source: "Pikalytics usage stats; SP is a sensible bulky-support default",
    spConfirmed: false,
  },
  Glimmora: {
    item: "Focus Sash",
    ability: "Toxic Debris",
    nature: "Timid",
    sp: { hp: 4, spa: 30, spe: 32 },
    moves: ["Sludge Bomb", "Power Gem", "Earth Power", "Spiky Shield"],
    source: "Pikalytics usage stats; SP is a sensible special-attacker default",
    spConfirmed: false,
  },
  Aerodactyl: {
    item: "Focus Sash",
    ability: "Unnerve",
    nature: "Jolly",
    sp: { hp: 4, atk: 30, spe: 32 },
    moves: ["Rock Slide", "Tailwind", "Protect", "Dual Wingbeat"],
    source: "Pikalytics usage stats; SP is a sensible fast-attacker default",
    spConfirmed: false,
  },
  Talonflame: {
    item: "Sharp Beak",
    ability: "Gale Wings",
    nature: "Jolly",
    sp: { hp: 4, atk: 30, spe: 32 },
    moves: ["Tailwind", "Protect", "Flare Blitz", "Brave Bird"],
    source: "Pikalytics usage stats; SP is a sensible fast-attacker default",
    spConfirmed: false,
  },
  "Froslass-Mega": {
    item: "Froslassite",
    ability: "Snow Warning",
    nature: "Timid",
    sp: { hp: 4, spa: 30, spe: 32 },
    moves: ["Blizzard", "Protect", "Shadow Ball", "Aurora Veil"],
    source: "Pikalytics usage stats; SP is a sensible special-sweeper default",
    spConfirmed: false,
  },
  "Scovillain-Mega": {
    item: "Scovillainite",
    ability: "Spicy Spray",
    nature: "Modest",
    sp: { hp: 4, spa: 30, spe: 32 },
    moves: ["Rage Powder", "Protect", "Overheat", "Leech Seed"],
    source: "Pikalytics usage stats; SP is a sensible special-attacker default",
    spConfirmed: false,
  },
  Basculegion: {
    item: "Choice Scarf",
    ability: "Adaptability",
    nature: "Adamant",
    sp: { hp: 4, atk: 30, spe: 32 },
    moves: ["Last Respects", "Aqua Jet", "Wave Crash", "Protect"],
    source: "Pikalytics usage stats; SP is a sensible sweeper default",
    spConfirmed: false,
  },

  // --- MetaVGC tournament team (Forblaze, 1st — SNT Reg M-C Tour #1) — exact SP confirmed ---
  "Mega Golisopod": {
    item: "Golisopite",
    ability: "Tough Claws",
    nature: "Adamant",
    sp: { hp: 32, atk: 32, def: 2 },
    moves: ["Protect", "Swords Dance", "Iron Head", "Brick Break"],
    source: "Forblaze, 1st — SNT Reg M-C Tour #1 (MetaVGC)",
    spConfirmed: true,
  },
  "Indeedee-F": {
    item: "Colbur Berry",
    ability: "Psychic Surge",
    nature: "Bold",
    sp: { hp: 32, atk: 2, def: 32 },
    moves: ["Follow Me", "Psychic", "Protect", "Trick Room"],
    source: "Forblaze, 1st — SNT Reg M-C Tour #1 (MetaVGC)",
    spConfirmed: true,
  },
  Toxapex: {
    item: "Leftovers",
    ability: "Regenerator",
    nature: "Calm",
    sp: { hp: 32, def: 18, spd: 16 },
    moves: ["Toxic", "Baneful Bunker", "Infestation", "Wide Guard"],
    source: "Forblaze, 1st — SNT Reg M-C Tour #1 (MetaVGC)",
    spConfirmed: true,
  },
  "Swampert-Mega": {
    item: "Swampertite",
    ability: "Swift Swim",
    nature: "Adamant",
    sp: { hp: 25, atk: 26, spe: 15 },
    moves: ["Earthquake", "Wave Crash", "Rock Slide", "Protect"],
    source: "Forblaze, 1st — SNT Reg M-C Tour #1 (MetaVGC)",
    spConfirmed: true,
  },

  // --- Zemar12, 1st place ("Champion"), VGC UmbreNews 08.09.2026 #31 (Pokémon-Zone/MetaVGC) ---
  Chesnaught: {
    item: "Leftovers",
    ability: "Bulletproof",
    nature: "Impish",
    sp: { hp: 20, def: 24, spd: 20 },
    moves: ["Body Press", "Wood Hammer", "Wide Guard", "Spiky Shield"],
    source: "Zemar12, 1st — VGC UmbreNews 08.09.2026 #31 (Pokémon-Zone); SP is a sensible bulky default",
    spConfirmed: false,
  },
  "Gardevoir-Mega": {
    item: "Gardevoirite",
    ability: "Pixilate",
    nature: "Timid",
    sp: { hp: 2, spa: 32, spe: 32 },
    moves: ["Protect", "Hyper Voice", "Trick Room", "Moonblast"],
    source: "MetaVGC most-common-build aggregate for Gardevoir (Timid 2/0/0/32/0/32)",
    spConfirmed: true,
  },

  // --- MetaVGC per-Pokémon "most common build" aggregate — exact SP confirmed ---
  "Mega Chesnaught": {
    item: "Chesnaughtite",
    ability: "Bulletproof",
    nature: "Careful",
    sp: { hp: 32, def: 2, spd: 32 },
    moves: ["Spiky Shield", "Body Press", "Wood Hammer", "Wide Guard"],
    source: "MetaVGC most-common-build aggregate for Chesnaught Mega (Careful 32/0/2/0/32/0)",
    spConfirmed: true,
  },
  "Mega Floette": {
    item: "Floettite",
    ability: "Fairy Aura",
    nature: "Timid",
    sp: { hp: 2, spa: 32, spe: 32 },
    moves: ["Protect", "Moonblast", "Dazzling Gleam", "Calm Mind"],
    source: "Pikalytics usage stats for Mega Floette; SP is a sensible special-sweeper default",
    spConfirmed: false,
  },
};

export function getMetaSet(species: string): MetaSet | null {
  return META_SETS[species] ?? null;
}