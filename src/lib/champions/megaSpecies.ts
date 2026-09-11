import { Generations } from "@pkmn/data";
import { Dex } from "@pkmn/dex";

// This module builds its own Generations instance (instead of importing
// from ../gen) to avoid a circular import, since gen.ts also needs
// MEGA_SPECIES_NAMES from this file.
const gens = new Generations(Dex);
const gen9 = gens.get(9);

// Champions reintroduces Mega Evolution with 75 Mega Stones (see items.ts).
// Stats below are sourced two ways:
//  - Classic Gen 6/7 Megas: pulled straight from @pkmn/dex (gen 7) — these
//    never change between games.
//  - Champions-exclusive Megas (first seen in Pokémon Legends: Z-A): manually
//    verified against Serebii's Champions stat rankings
//    (serebii.net/pokedex-champions/stat/*.shtml), not assumed or guessed.
// Still pending (confirmed ability/type from the Champions ability table,
// stats not yet verified): Victreebel, Clefable, Meganium, Feraligatr,
// Skarmory, Chimecho, Staraptor, Emboar, Scolipede, Scrafty, Eelektross,
// Golurk, Chesnaught, Crabominable, Drampa, Falinks, Scovillain. There's also
// a newer Reg M-C update adding Mega Salamence, Mega Golisopod, Mega
// Baxcalibur and ~20 new base Pokémon (Rillaboom, Mabosstiff, Indeedee...)
// not yet reflected in champions/pokedex.ts or items.ts — a separate task.

interface MegaDef {
  name: string; // display name in the species picker
  baseSpeciesName: string; // must match a gen 9 species name exactly
  types: string[];
  baseStats: { hp: number; atk: number; def: number; spa: number; spd: number; spe: number };
  ability: string;
}

const gen7 = gens.get(7);

// @pkmn/data's Generations wrapper hides species tagged "Past" for a given
// gen (e.g. Beedrill, Alakazam, Absol aren't in SV's own regional dex), even
// though Champions supports them. Fall back to the raw (unfiltered) Dex for
// those so every Champions-legal species still resolves correctly.
function resolveSpecies(name: string) {
  const id = name.toLowerCase().replace(/[^a-z0-9]/g, "");
  return gen9.species.get(id as never) ?? Dex.species.get(id);
}

function classicMega(baseSpeciesName: string, forme = "Mega"): MegaDef | null {
  const id = (baseSpeciesName + forme).toLowerCase().replace(/[^a-z0-9]/g, "");
  const s = gen7.species.get(id as never) ?? Dex.forGen(7).species.get(id);
  if (!s || !s.exists) return null;
  return {
    name: `${baseSpeciesName}-Mega`,
    baseSpeciesName,
    types: [...s.types],
    baseStats: { ...s.baseStats },
    ability: s.abilities?.[0] ?? "",
  };
}

const CLASSIC_MEGA_BASE_SPECIES = [
  "Abomasnow",
  "Absol",
  "Aerodactyl",
  "Aggron",
  "Alakazam",
  "Altaria",
  "Ampharos",
  "Audino",
  "Banette",
  "Beedrill",
  "Blastoise",
  "Blaziken",
  "Camerupt",
  "Gallade",
  "Gardevoir",
  "Gengar",
  "Glalie",
  "Gyarados",
  "Heracross",
  "Houndoom",
  "Kangaskhan",
  "Lopunny",
  "Manectric",
  "Mawile",
  "Medicham",
  "Metagross",
  "Pidgeot",
  "Pinsir",
  "Sableye",
  "Sceptile",
  "Scizor",
  "Sharpedo",
  "Slowbro",
  "Steelix",
  "Swampert",
  "Tyranitar",
  "Venusaur",
  "Lucario",
  "Garchomp",
];

const megaDefs: MegaDef[] = [];

for (const species of CLASSIC_MEGA_BASE_SPECIES) {
  const def = classicMega(species);
  if (def) megaDefs.push(def);
}

// Charizard has two Mega forms.
const charX = classicMega("Charizard", "MegaX");
const charY = classicMega("Charizard", "MegaY");
if (charX) megaDefs.push({ ...charX, name: "Charizard-Mega-X" });
if (charY) megaDefs.push({ ...charY, name: "Charizard-Mega-Y" });

// Lucario has two distinct Megas in Champions: the classic ORAS one
// (Adaptability, pulled automatically above as "Lucario-Mega") and a new
// "Z" variant with a different ability AND a completely different stat
// spread — verified against Serebii's Champions stat rankings, not just an
// ability swap.
megaDefs.push({
  name: "Mega Lucario Z",
  baseSpeciesName: "Lucario",
  types: ["Fighting", "Steel"],
  baseStats: { hp: 70, atk: 100, def: 70, spa: 164, spd: 70, spe: 151 },
  ability: "Aura Guard",
});

// Brand-new Champions Megas with stats verified against Serebii's Champions
// stat rankings (serebii.net/pokedex-champions/stat/*.shtml), not assumed.
megaDefs.push({
  name: "Mega Dragonite",
  baseSpeciesName: "Dragonite",
  types: ["Dragon", "Flying"],
  baseStats: { hp: 91, atk: 124, def: 115, spa: 145, spd: 125, spe: 100 },
  ability: "Multiscale",
});
megaDefs.push({
  name: "Mega Garchomp Z",
  baseSpeciesName: "Garchomp",
  types: ["Dragon"],
  baseStats: { hp: 108, atk: 130, def: 85, spa: 141, spd: 85, spe: 151 },
  ability: "Levitate",
});
megaDefs.push({
  name: "Mega Absol Z",
  baseSpeciesName: "Absol",
  types: ["Dark", "Ghost"],
  baseStats: { hp: 65, atk: 154, def: 60, spa: 75, spd: 60, spe: 151 },
  ability: "Sharpness",
});
megaDefs.push({
  name: "Mega Delphox",
  baseSpeciesName: "Delphox",
  types: ["Fire", "Psychic"],
  baseStats: { hp: 75, atk: 69, def: 72, spa: 159, spd: 125, spe: 134 },
  ability: "Levitate",
});
megaDefs.push({
  name: "Mega Meowstic",
  baseSpeciesName: "Meowstic",
  types: ["Psychic"],
  baseStats: { hp: 74, atk: 48, def: 76, spa: 143, spd: 101, spe: 124 },
  ability: "Trace",
});
megaDefs.push({
  name: "Mega Starmie",
  baseSpeciesName: "Starmie",
  types: ["Water", "Psychic"],
  baseStats: { hp: 60, atk: 100, def: 105, spa: 130, spd: 105, spe: 120 },
  ability: "Huge Power",
});
megaDefs.push({
  name: "Mega Froslass",
  baseSpeciesName: "Froslass",
  types: ["Ice", "Ghost"],
  baseStats: { hp: 70, atk: 80, def: 70, spa: 140, spd: 100, spe: 120 },
  ability: "Snow Warning",
});
megaDefs.push({
  name: "Mega Pyroar",
  baseSpeciesName: "Pyroar",
  types: ["Fire", "Normal"],
  baseStats: { hp: 86, atk: 88, def: 92, spa: 129, spd: 86, spe: 126 },
  ability: "Fire Mane",
});
megaDefs.push({
  name: "Mega Raichu X",
  baseSpeciesName: "Raichu",
  types: ["Electric"],
  baseStats: { hp: 60, atk: 135, def: 95, spa: 90, spd: 95, spe: 110 },
  ability: "Electric Surge",
});
megaDefs.push({
  name: "Mega Raichu Y",
  baseSpeciesName: "Raichu",
  types: ["Electric"],
  baseStats: { hp: 60, atk: 100, def: 55, spa: 160, spd: 80, spe: 130 },
  ability: "No Guard",
});
megaDefs.push({
  name: "Mega Greninja",
  baseSpeciesName: "Greninja",
  types: ["Water", "Dark"],
  baseStats: { hp: 72, atk: 125, def: 77, spa: 133, spd: 81, spe: 142 },
  ability: "Protean",
});
megaDefs.push({
  name: "Mega Hawlucha",
  baseSpeciesName: "Hawlucha",
  types: ["Fighting", "Flying"],
  baseStats: { hp: 78, atk: 137, def: 100, spa: 74, spd: 93, spe: 118 },
  ability: "No Guard",
});
megaDefs.push({
  name: "Mega Glimmora",
  baseSpeciesName: "Glimmora",
  types: ["Rock", "Poison"],
  baseStats: { hp: 83, atk: 90, def: 105, spa: 150, spd: 96, spe: 101 },
  ability: "Adaptability",
});
megaDefs.push({
  name: "Mega Barbaracle",
  baseSpeciesName: "Barbaracle",
  types: ["Rock", "Fighting"],
  baseStats: { hp: 72, atk: 140, def: 130, spa: 64, spd: 106, spe: 88 },
  ability: "Tough Claws",
});
megaDefs.push({
  name: "Mega Malamar",
  baseSpeciesName: "Malamar",
  types: ["Dark", "Psychic"],
  baseStats: { hp: 86, atk: 102, def: 88, spa: 98, spd: 120, spe: 88 },
  ability: "Contrary",
});
megaDefs.push({
  name: "Mega Chandelure",
  baseSpeciesName: "Chandelure",
  types: ["Ghost", "Fire"],
  baseStats: { hp: 60, atk: 75, def: 110, spa: 175, spd: 110, spe: 90 },
  ability: "Infiltrator",
});
megaDefs.push({
  name: "Mega Excadrill",
  baseSpeciesName: "Excadrill",
  types: ["Ground", "Steel"],
  baseStats: { hp: 110, atk: 165, def: 100, spa: 65, spd: 65, spe: 103 },
  ability: "Piercing Drill",
});
megaDefs.push({
  name: "Mega Meganium",
  baseSpeciesName: "Meganium",
  types: ["Grass", "Fairy"],
  baseStats: { hp: 80, atk: 92, def: 115, spa: 143, spd: 115, spe: 80 },
  ability: "Mega Sol",
});
megaDefs.push({
  name: "Mega Feraligatr",
  baseSpeciesName: "Feraligatr",
  types: ["Water", "Dragon"],
  baseStats: { hp: 85, atk: 160, def: 125, spa: 89, spd: 93, spe: 78 },
  ability: "Dragonize",
});
megaDefs.push({
  name: "Mega Skarmory",
  baseSpeciesName: "Skarmory",
  types: ["Steel", "Flying"],
  baseStats: { hp: 65, atk: 140, def: 110, spa: 40, spd: 100, spe: 110 },
  ability: "Stalwart",
});
megaDefs.push({
  name: "Mega Chimecho",
  baseSpeciesName: "Chimecho",
  types: ["Psychic", "Steel"],
  baseStats: { hp: 75, atk: 50, def: 110, spa: 135, spd: 120, spe: 65 },
  ability: "Levitate",
});
megaDefs.push({
  name: "Mega Staraptor",
  baseSpeciesName: "Staraptor",
  types: ["Fighting", "Flying"],
  baseStats: { hp: 85, atk: 140, def: 100, spa: 60, spd: 90, spe: 110 },
  ability: "Contrary",
});
megaDefs.push({
  name: "Mega Emboar",
  baseSpeciesName: "Emboar",
  types: ["Fire", "Fighting"],
  baseStats: { hp: 110, atk: 148, def: 75, spa: 110, spd: 110, spe: 75 },
  ability: "Mold Breaker",
});
megaDefs.push({
  name: "Mega Scolipede",
  baseSpeciesName: "Scolipede",
  types: ["Bug", "Poison"],
  baseStats: { hp: 60, atk: 140, def: 149, spa: 75, spd: 99, spe: 62 },
  ability: "Shell Armor",
});
megaDefs.push({
  name: "Mega Scrafty",
  baseSpeciesName: "Scrafty",
  types: ["Dark", "Fighting"],
  baseStats: { hp: 65, atk: 130, def: 135, spa: 55, spd: 135, spe: 68 },
  ability: "Intimidate",
});
megaDefs.push({
  name: "Mega Eelektross",
  baseSpeciesName: "Eelektross",
  types: ["Electric"],
  baseStats: { hp: 85, atk: 145, def: 80, spa: 135, spd: 90, spe: 80 },
  ability: "Eelevate",
});
megaDefs.push({
  name: "Mega Golurk",
  baseSpeciesName: "Golurk",
  types: ["Ground", "Ghost"],
  baseStats: { hp: 89, atk: 159, def: 105, spa: 70, spd: 105, spe: 55 },
  ability: "Unseen Fist",
});
megaDefs.push({
  name: "Mega Chesnaught",
  baseSpeciesName: "Chesnaught",
  types: ["Grass", "Fighting"],
  baseStats: { hp: 88, atk: 137, def: 172, spa: 74, spd: 115, spe: 44 },
  ability: "Bulletproof",
});
megaDefs.push({
  name: "Mega Crabominable",
  baseSpeciesName: "Crabominable",
  types: ["Fighting", "Ice"],
  baseStats: { hp: 97, atk: 157, def: 122, spa: 62, spd: 107, spe: 33 },
  ability: "Iron Fist",
});
megaDefs.push({
  name: "Mega Drampa",
  baseSpeciesName: "Drampa",
  types: ["Normal", "Dragon"],
  baseStats: { hp: 78, atk: 85, def: 110, spa: 160, spd: 116, spe: 36 },
  ability: "Berserk",
});
megaDefs.push({
  name: "Mega Falinks",
  baseSpeciesName: "Falinks",
  types: ["Fighting"],
  baseStats: { hp: 65, atk: 135, def: 135, spa: 70, spd: 65, spe: 100 },
  ability: "Defiant",
});
megaDefs.push({
  name: "Mega Victreebel",
  baseSpeciesName: "Victreebel",
  types: ["Grass", "Poison"],
  baseStats: { hp: 80, atk: 125, def: 85, spa: 135, spd: 95, spe: 70 },
  ability: "Fair Play",
});
megaDefs.push({
  name: "Mega Clefable",
  baseSpeciesName: "Clefable",
  types: ["Fairy", "Flying"],
  baseStats: { hp: 95, atk: 80, def: 93, spa: 135, spd: 110, spe: 70 },
  ability: "Magic Guard",
});

// Reg M-C additions (newer update). Stats verified against Serebii's
// Champions stat rankings; Golisopod's exact ability wasn't visible in the
// fetched data and is a best-effort placeholder pending verification.
megaDefs.push({
  name: "Mega Salamence",
  baseSpeciesName: "Salamence",
  types: ["Dragon", "Flying"],
  baseStats: { hp: 95, atk: 145, def: 130, spa: 120, spd: 90, spe: 120 },
  ability: "Aerilate",
});
megaDefs.push({
  name: "Mega Baxcalibur",
  baseSpeciesName: "Baxcalibur",
  types: ["Dragon", "Ice"],
  baseStats: { hp: 115, atk: 175, def: 117, spa: 105, spd: 101, spe: 87 },
  ability: "Thermal Exchange",
});
megaDefs.push({
  name: "Mega Golisopod",
  baseSpeciesName: "Golisopod",
  types: ["Bug", "Steel"],
  baseStats: { hp: 75, atk: 150, def: 175, spa: 70, spd: 120, spe: 40 },
  ability: "Emergency Exit", // unverified — base ability used as placeholder
});

export const MEGA_SPECIES_NAMES = megaDefs.map((m) => m.name);

const megaById = new Map(megaDefs.map((m) => [m.name.toLowerCase().replace(/[^a-z0-9]/g, ""), m]));

function toSpecie(def: MegaDef) {
  const base = resolveSpecies(def.baseSpeciesName);
  return {
    exists: true,
    id: def.name.toLowerCase().replace(/[^a-z0-9]/g, ""),
    name: def.name,
    num: base?.num,
    kind: "Species" as const,
    types: def.types,
    baseStats: def.baseStats,
    weightkg: base?.weightkg ?? 0,
    gender: base?.gender,
    baseSpecies: def.baseSpeciesName,
    abilities: { 0: def.ability },
  };
}

// A Generation-shaped object (per @smogon/calc's data interface) that adds
// the Mega species on top of the normal gen 9 dex. Passed to Pokemon/Move
// wherever the app used to pass the raw gen9 object.
export const champGen = {
  num: gen9.num,
  abilities: gen9.abilities,
  // Mega Stones (and a few other Champions items) are tagged "Past" by
  // @pkmn/dex since they're not part of SV's own standard item pool, so
  // gen9.items filters them out — same root cause as the "Past" species
  // issue. Falling back to the raw, unfiltered Dex recovers them with their
  // correct .megaStone mapping intact, which @smogon/calc's damage-calc
  // internals read directly (a missing entry there crashes the calc, not
  // just cosmetic like the sprite bug).
  items: {
    get(id: string) {
      return gen9.items.get(id as never) ?? Dex.items.get(id);
    },
    [Symbol.iterator]() {
      return gen9.items[Symbol.iterator]();
    },
  },
  moves: gen9.moves,
  types: gen9.types,
  natures: gen9.natures,
  species: {
    get(id: string): any {
      const normalized = id.toLowerCase().replace(/[^a-z0-9]/g, "");
      const mega = megaById.get(normalized);
      if (mega) return toSpecie(mega);
      return gen9.species.get(id as never) ?? Dex.species.get(id);
    },
    [Symbol.iterator]() {
      return gen9.species[Symbol.iterator]();
    },
  },
};