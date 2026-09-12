import { getSpeciesAbilities } from "./speciesAbilities";
import { getChampionsMoveset } from "../champions/moveset";
import { getMegaStoneItem } from "./megaStoneLookup";
import { getMetaSet } from "../champions/metaSets";
import { spToEv } from "../champions/statPoints";
import type { PokemonState } from "../types";
import type { StatKey } from "../gen";

/**
 * Returns the given state with species, ability, held item (+ lock for
 * Megas) and moves filled in. When a curated real competitive set exists
 * for this species (src/lib/champions/metaSets.ts), that set's item,
 * ability, nature, Stat Points and moves are used instead of the generic
 * first-real-ability / first-4-moves fallback. Used both when the user
 * picks a species in the UI and to build sensible default Pokémon on first
 * load.
 */
export async function autofillForSpecies(
  base: PokemonState,
  newSpecies: string
): Promise<PokemonState> {
  const stoneItem = getMegaStoneItem(newSpecies);
  const metaSet = getMetaSet(newSpecies);

  if (metaSet) {
    const evs = { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 };
    (Object.keys(metaSet.sp) as StatKey[]).forEach((key) => {
      evs[key] = spToEv(metaSet.sp[key] ?? 0);
    });
    return {
      ...base,
      species: newSpecies,
      ability: metaSet.ability,
      nature: metaSet.nature,
      item: stoneItem ?? metaSet.item,
      itemLocked: !!stoneItem,
      evs,
      moves: [metaSet.moves[0] ?? "", metaSet.moves[1] ?? "", metaSet.moves[2] ?? "", metaSet.moves[3] ?? ""],
      critMoves: [false, false, false, false],
    };
  }

  const abilities = getSpeciesAbilities(newSpecies);
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