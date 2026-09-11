// A handful of sprite fixes that can't be derived automatically:
//
// 1. Regional forms (Persian-Alola, Samurott-Hisui...) share their national
//    dex number with their base form, but the PokeAPI sprites repo stores
//    their official artwork under a *different*, form-specific numeric id.
//    Verified via PokeAPI/api-data's pokemon-species varieties list.
export const REGIONAL_ARTWORK_IDS: Record<string, number> = {
  "Persian-Alola": 10108,
  "Samurott-Hisui": 10236,
};

// 2. Items that genuinely don't exist yet in the PokeAPI sprites CDN —
//    mostly Champions-exclusive Mega Stones that never appeared in a
//    mainline game before, so no fan/official sprite has been catalogued
//    there. Verified by checking each URL directly (36 mega stones + Fairy
//    Feather returned 404 as of writing).
//
// For these, itemSpriteUrl() points at /custom-sprites/items/<kebab-name>.png
// instead of the CDN. Drop a same-named PNG into public/custom-sprites/items/
// and it'll be picked up automatically — no code change needed. Exact
// filenames (kebab-case, matching the item's display name):
export const MISSING_ITEM_SPRITES: string[] = [
  "fairy-feather",
  "barbaracite",
  "chandelurite",
  "chesnaughtite",
  "chimechite",
  "clefablite",
  "crabominite",
  "delphoxite",
  "dragalgite",
  "dragoninite",
  "drampanite",
  "eelektrossite",
  "emboarite",
  "excadrite",
  "falinksite",
  "feraligite",
  "floettite",
  "froslassite",
  "glimmoranite",
  "golurkite",
  "greninjite",
  "hawluchanite",
  "malamarite",
  "meganiumite",
  "meowsticite",
  "pyroarite",
  "raichunite-x",
  "raichunite-y",
  "scolipite",
  "scovillainite",
  "scraftinite",
  "skarmorite",
  "staraptite",
  "starminite",
  "victreebelite",
  "golisopite",
  "baxcalibrite",
  "absolite-z",
  "garchompite-z",
  "lucarionite-z",
];
// 4. Item name aliases — PokeAPI still uses an item's older/internal name
//    for its sprite file even after an in-game rename. Maps our display
//    name (kebab-case) to the sprite's actual kebab-case filename.
export const ITEM_SPRITE_ALIASES: Record<string, string> = {
  leek: "stick", // Farfetch'd's item was called "Stick" pre-Gen 8
};

// 3. Mega Evolution artwork/sprites — Mega forms share their base
//    species's national dex number in-game, so the generic num-based
//    lookup would show the wrong (base-form) artwork. PokeAPI catalogues
//    every Mega (including the Champions-exclusive ones) under its own
//    unique internal id via the pokemon-species "varieties" list —
//    verified directly against PokeAPI/api-data for all 78 Megas.
export const MEGA_ARTWORK_IDS: Record<string, number> = {
  "Abomasnow-Mega": 10060,
  "Absol-Mega": 10057,
  "Aerodactyl-Mega": 10042,
  "Aggron-Mega": 10053,
  "Alakazam-Mega": 10037,
  "Altaria-Mega": 10067,
  "Ampharos-Mega": 10045,
  "Audino-Mega": 10069,
  "Banette-Mega": 10056,
  "Beedrill-Mega": 10090,
  "Blastoise-Mega": 10036,
  "Blaziken-Mega": 10050,
  "Camerupt-Mega": 10087,
  "Charizard-Mega-X": 10034,
  "Charizard-Mega-Y": 10035,
  "Gallade-Mega": 10068,
  "Garchomp-Mega": 10058,
  "Gardevoir-Mega": 10051,
  "Gengar-Mega": 10038,
  "Glalie-Mega": 10074,
  "Gyarados-Mega": 10041,
  "Heracross-Mega": 10047,
  "Houndoom-Mega": 10048,
  "Kangaskhan-Mega": 10039,
  "Lopunny-Mega": 10088,
  "Lucario-Mega": 10059,
  "Manectric-Mega": 10055,
  "Mawile-Mega": 10052,
  "Medicham-Mega": 10054,
  "Mega Absol Z": 10307,
  "Mega Barbaracle": 10298,
  "Mega Baxcalibur": 10325,
  "Mega Chandelure": 10291,
  "Mega Chesnaught": 10292,
  "Mega Chimecho": 10306,
  "Mega Clefable": 10278,
  "Mega Crabominable": 10315,
  "Mega Delphox": 10293,
  "Mega Dragonite": 10281,
  "Mega Drampa": 10302,
  "Mega Eelektross": 10290,
  "Mega Emboar": 10286,
  "Mega Excadrill": 10287,
  "Mega Falinks": 10303,
  "Mega Feraligatr": 10283,
  "Mega Froslass": 10285,
  "Mega Garchomp Z": 10309,
  "Mega Glimmora": 10321,
  "Mega Golisopod": 10316,
  "Mega Golurk": 10313,
  "Mega Greninja": 10294,
  "Mega Hawlucha": 10300,
  "Mega Lucario Z": 10310,
  "Mega Malamar": 10297,
  "Mega Meganium": 10282,
  "Mega Meowstic": 10314,
  "Mega Pyroar": 10295,
  "Mega Raichu X": 10304,
  "Mega Raichu Y": 10305,
  "Mega Salamence": 10089,
  "Mega Scolipede": 10288,
  "Mega Scrafty": 10289,
  "Mega Skarmory": 10284,
  "Mega Staraptor": 10308,
  "Mega Starmie": 10280,
  "Mega Victreebel": 10279,
  "Mega Floette": 10296,
  "Mega Dragalge": 10299,
  "Mega Scovillain": 10320,
  "Metagross-Mega": 10076,
  "Pidgeot-Mega": 10073,
  "Pinsir-Mega": 10040,
  "Sableye-Mega": 10066,
  "Sceptile-Mega": 10065,
  "Scizor-Mega": 10046,
  "Sharpedo-Mega": 10070,
  "Slowbro-Mega": 10071,
  "Steelix-Mega": 10072,
  "Swampert-Mega": 10064,
  "Tyranitar-Mega": 10049,
  "Venusaur-Mega": 10033,
};