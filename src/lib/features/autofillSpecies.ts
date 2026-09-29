import { getSpeciesAbilities } from "./speciesAbilities";
import { getChampionsMoveset } from "../champions/moveset";
import { getMegaStoneItem } from "./megaStoneLookup";
import { getMetaSet } from "../champions/metaSets";
import { spToEv } from "../champions/statPoints";
import { suggestMoves } from "./suggestMoves";
import { defaultStats } from "../types";
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
 *
 * EVs/Stat Points and stat stages are always reset on a species switch
 * (falling back to a flat 0-SP spread and neutral nature when no curated
 * set exists) rather than carried over from `base`. Otherwise a previous
 * species' spread silently survives onto the new one — invisible unless
 * you go check the stat page, and confusing when it does ("the spreads
 * get mixed between two Pokémon").
 */
export async function autofillForSpecies(
  base: PokemonState,
  newSpecies: string
): Promise<PokemonState> {
  const stoneItem = getMegaStoneItem(newSpecies);
  const metaSet = getMetaSet(newSpecies);
  const resetBoosts = defaultStats(0);

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
      boosts: resetBoosts,
      moves: [metaSet.moves[0] ?? "", metaSet.moves[1] ?? "", metaSet.moves[2] ?? "", metaSet.moves[3] ?? ""],
      critMoves: [false, false, false, false],
    };
  }

  const abilities = getSpeciesAbilities(newSpecies);
  const learnedMoves = await getChampionsMoveset(newSpecies);
  // No real sourced set for this species — suggest the 4 generically most
  // useful moves from its real movepool (STAB damage + staple setup/hazard/
  // recovery moves) rather than picking arbitrarily. Still just a computed
  // guess, not sourced usage data — see suggestMoves.ts.
  const picked = suggestMoves(newSpecies, learnedMoves, 4);

  return {
    ...base,
    species: newSpecies,
    ability: abilities[0] ?? base.ability,
    nature: "Hardy",
    item: stoneItem ?? base.item,
    itemLocked: !!stoneItem,
    evs: defaultStats(0),
    boosts: resetBoosts,
    moves: [picked[0] ?? "", picked[1] ?? "", picked[2] ?? "", picked[3] ?? ""],
    critMoves: [false, false, false, false],
  };
}