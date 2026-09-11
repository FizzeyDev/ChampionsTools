import { getSpeciesAbilities } from "./speciesAbilities";
import { getChampionsMoveset } from "../champions/moveset";
import { getMegaStoneItem } from "./megaStoneLookup";
import type { PokemonState } from "../types";

/**
 * Returns the given state with species, ability, held item (+ lock for
 * Megas) and the first 4 moves of the real moveset filled in. Used both
 * when the user picks a species in the UI and to build sensible default
 * Pokémon on first load.
 */
export async function autofillForSpecies(
  base: PokemonState,
  newSpecies: string
): Promise<PokemonState> {
  const abilities = getSpeciesAbilities(newSpecies);
  const stoneItem = getMegaStoneItem(newSpecies);
  const learnedMoves = await getChampionsMoveset(newSpecies);
  const firstFour = [...learnedMoves].sort((a, b) => a.localeCompare(b)).slice(0, 4);

  return {
    ...base,
    species: newSpecies,
    ability: abilities[0] ?? base.ability,
    item: stoneItem ?? base.item,
    itemLocked: !!stoneItem,
    moves: [firstFour[0] ?? "", firstFour[1] ?? "", firstFour[2] ?? "", firstFour[3] ?? ""],
    critMoves: [false, false, false, false],
  };
}