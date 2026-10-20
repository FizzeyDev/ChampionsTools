import { META_SETS } from "../src/lib/champions/metaSets";
import { getChampionsMoveset } from "../src/lib/champions/moveset";
import { SPECIES_NAMES } from "../src/lib/gen";
import { getMegaStoneItem } from "../src/lib/features/megaStoneLookup";
import { getSpeciesAbilities } from "../src/lib/features/speciesAbilities";
import { HOLD_ITEMS, MEGA_STONES, NEW_MEGA_STONES, BERRIES } from "../src/lib/champions/items";

const ALL_ITEMS = new Set([...HOLD_ITEMS, ...MEGA_STONES.map(s=>s.item), ...NEW_MEGA_STONES.map(s=>s.item), ...BERRIES]);

let problems = 0;
let checked = 0;

async function main() {
  const speciesList = Object.keys(META_SETS);
  for (const species of speciesList) {
    checked++;
    const set = META_SETS[species];
    if (!SPECIES_NAMES.includes(species)) {
      console.log(`[MISSING FROM POKEDEX] ${species} has a meta set but isn't in SPECIES_NAMES`);
      problems++;
    }
    const moveset = await getChampionsMoveset(species);
    for (const mv of set.moves) {
      if (!mv) continue;
      if (!moveset.has(mv)) {
        console.log(`[ILLEGAL MOVE] ${species}: "${mv}" is not in its learnset (${moveset.size} moves known)`);
        problems++;
      }
    }
    // ability check (loose - some entries might have event/hidden slight mismatches)
    const realAbilities = getSpeciesAbilities(species);
    if (realAbilities.length && !realAbilities.includes(set.ability)) {
      console.log(`[ABILITY MISMATCH] ${species}: "${set.ability}" not in real ability slots [${realAbilities.join(", ")}]`);
      problems++;
    }
    // item sanity (not exhaustive, items.ts list may be incomplete on purpose)
    if (set.item && !ALL_ITEMS.has(set.item) && !getMegaStoneItem(species)) {
      console.log(`[UNKNOWN ITEM] ${species}: "${set.item}" not found in HOLD_ITEMS/MEGA_STONES/BERRIES list`);
    }
  }
  console.log(`\nChecked ${checked} meta sets, found ${problems} problems.`);
}
main();
