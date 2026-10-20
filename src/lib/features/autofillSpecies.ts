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
 * EVs/Stat Points, stat stages, held item, ability, Tera type/toggle and
 * status are all always reset on a species switch (falling back to a flat
 * 0-SP spread, no item/ability and a clean battle state when no curated set
 * exists) rather than carried over from `base`. Otherwise a previous
 * species' build silently survives onto the new one — invisible unless you
 * go check each field, and confusing when it does: an old held item, Tera
 * type or status condition staying active is exactly what was behind the
 * "Pokémon tank more or less than they should after switching around a
 * lot" bug report ("the spreads get mixed between two Pokémon").
 */
export async function autofillForSpecies(
  base: PokemonState,
  newSpecies: string
): Promise<PokemonState> {
  const stoneItem = getMegaStoneItem(newSpecies);
  const metaSet = getMetaSet(newSpecies);
  const resetBoosts = defaultStats(0);
  // Battle-state fields that belong to the Pokémon being tested, not to
  // whatever was being tested before it — reset on every switch.
  const resetBattleState = {
    teraType: "",
    useTera: false,
    status: "",
    abilityOn: false,
  };

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
      ...resetBattleState,
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
    // Same reasoning as the item reset below: an ability belongs to its own
    // species (Levitate, Intimidate...) and has no business surviving onto
    // an unrelated one just because the lookup came back empty.
    ability: abilities[0] ?? "",
    nature: "Hardy",
    // Reset the held item on every switch, same as EVs/boosts below — the
    // previous species' item (often a Mega Stone, Eviolite, Assault Vest...)
    // has no reason to carry over onto an unrelated Pokémon, and silently
    // keeping it equipped was the actual cause of the "Pokémon tank more or
    // less than they should after switching around a lot" bug report: an
    // old held item stayed equipped and invisibly changed the new Pokémon's
    // effective bulk/damage.
    item: stoneItem ?? "",
    itemLocked: !!stoneItem,
    evs: defaultStats(0),
    boosts: resetBoosts,
    ...resetBattleState,
    moves: [picked[0] ?? "", picked[1] ?? "", picked[2] ?? "", picked[3] ?? ""],
    critMoves: [false, false, false, false],
  };
}