// The exact roster currently obtainable in Pokémon Champions (per the game's
// own in-app Pokédex, cross-checked via Serebii's Champions Pokédex index).
// Champions launched with 187 species and has grown via updates since —
// 208 at one point, and this list also includes the newer Reg M-C addition
// (~22 more species: Salamence, Golisopod, Baxcalibur, Rillaboom...). If the
// game adds more, just append the species name here (it must match
// @pkmn/dex's naming exactly, e.g. "Mr. Rime", "Kommo-o").

const CHAMPIONS_POKEDEX_RAW: string[] = [
  // Kanto
  "Venusaur", "Charizard", "Blastoise", "Beedrill", "Pidgeot", "Arbok", "Pikachu", "Raichu",
  "Clefable", "Ninetales", "Vileplume", "Arcanine", "Alakazam", "Machamp", "Victreebel",
  "Slowbro", "Gengar", "Kangaskhan", "Starmie", "Pinsir", "Tauros", "Gyarados", "Ditto",
  "Vaporeon", "Jolteon", "Flareon", "Aerodactyl", "Snorlax", "Dragonite",
  // Johto
  "Meganium", "Typhlosion", "Feraligatr", "Ariados", "Ampharos", "Azumarill", "Politoed",
  "Espeon", "Umbreon", "Slowking", "Forretress", "Steelix", "Qwilfish", "Scizor", "Heracross",
  "Skarmory", "Houndoom", "Tyranitar",
  // Hoenn
  "Sceptile", "Blaziken", "Swampert", "Pelipper", "Gardevoir", "Sableye", "Mawile", "Aggron",
  "Medicham", "Manectric", "Sharpedo", "Camerupt", "Torkoal", "Altaria", "Milotic", "Castform",
  "Banette", "Chimecho", "Absol", "Glalie", "Metagross",
  // Sinnoh
  "Torterra", "Infernape", "Empoleon", "Staraptor", "Luxray", "Roserade", "Rampardos",
  "Bastiodon", "Lopunny", "Spiritomb", "Garchomp", "Lucario", "Hippowdon", "Toxicroak",
  "Abomasnow", "Weavile", "Rhyperior", "Leafeon", "Glaceon", "Gliscor", "Mamoswine", "Gallade",
  "Froslass", "Rotom", "Rotom-Wash",
  // Unova
  "Serperior", "Emboar", "Samurott", "Watchog", "Liepard", "Simisage", "Simisear", "Simipour",
  "Musharna", "Excadrill", "Audino", "Conkeldurr", "Scolipede", "Whimsicott", "Krookodile",
  "Scrafty", "Cofagrigus", "Garbodor", "Zoroark", "Reuniclus", "Vanilluxe", "Emolga",
  "Eelektross", "Chandelure", "Beartic", "Stunfisk", "Golurk", "Hydreigon", "Volcarona",
  // Kalos
  "Chesnaught", "Delphox", "Greninja", "Diggersby", "Talonflame", "Vivillon", "Pyroar",
  "Floette", "Florges", "Pangoro", "Furfrou", "Meowstic", "Aegislash", "Aromatisse",
  "Slurpuff", "Malamar", "Barbaracle", "Dragalge", "Clawitzer", "Heliolisk", "Tyrantrum",
  "Aurorus", "Sylveon", "Hawlucha", "Dedenne", "Goodra", "Klefki", "Trevenant", "Gourgeist",
  "Avalugg", "Noivern",
  // Alola
  "Decidueye", "Incineroar", "Primarina", "Toucannon", "Crabominable", "Lycanroc", "Toxapex",
  "Mudsdale", "Araquanid", "Salazzle", "Tsareena", "Oranguru", "Passimian", "Mimikyu",
  "Drampa", "Kommo-o",
  // Galar / Hisui
  "Corviknight", "Flapple", "Appletun", "Sandaconda", "Polteageist", "Hatterene",
  "Grimmsnarl", "Mr. Rime", "Runerigus", "Alcremie", "Falinks", "Morpeko", "Dragapult",
  "Wyrdeer", "Kleavor", "Basculegion", "Sneasler", "Overqwil",
  // Paldea
  "Meowscarada", "Skeledirge", "Quaquaval", "Maushold", "Garganacl", "Armarouge", "Ceruledge",
  "Bellibolt", "Scovillain", "Espathra", "Tinkaton", "Palafin", "Orthworm", "Glimmora",
  "Houndstone", "Annihilape", "Farigiraf", "Kingambit", "Gholdengo", "Sinistcha", "Archaludon",
  "Hydrapple",
  // Reg M-C update (newer)
  "Salamence", "Golisopod", "Baxcalibur", "Rillaboom", "Mabosstiff", "Persian", "Persian-Alola",
  "Samurott-Hisui", "Inteleon", "Cinderace", "Arboliva", "Sirfetch'd", "Toxtricity", "Gogoat",
  "Indeedee", "Indeedee-F", "Pawmot",
  // Found via Pikalytics' live usage feed — legitimate, played forms missing from our list
  "Floette-Eternal", "Arcanine-Hisui", "Ninetales-Alola", "Lycanroc-Dusk", "Lycanroc-Midnight",
  "Zoroark-Hisui", "Rotom-Heat", "Rotom-Mow", "Rotom-Frost", "Typhlosion-Hisui", "Decidueye-Hisui",
  "Slowking-Galar", "Slowbro-Galar", "Goodra-Hisui", "Tauros-Paldea-Aqua", "Tauros-Paldea-Blaze",
  "Basculegion-F", "Raichu-Alola", "Meowstic-F", "Avalugg-Hisui",
  // Found via a manual cross-check against Serebii's Champions Pokédex
  "Wigglytuff", "Farfetch'd", "Mr. Mime", "Swalot", "Thievul", "Grapploct",
  "Perrserker", "Pincurchin", "Stunfisk-Galar",
];

// Safety net: dedupe in case a future edit accidentally re-adds a species
// that's already listed elsewhere (this caused a real "duplicate Samurott"
// bug — see the entry above).
export const CHAMPIONS_POKEDEX = Array.from(new Set(CHAMPIONS_POKEDEX_RAW));