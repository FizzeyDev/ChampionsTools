import { getFinalSpeed } from "@smogon/calc/dist/mechanics/util";
import { buildPokemon, buildField } from "../calcEngine";
import { champGen } from "../champions/megaSpecies";
import type { FieldState, PokemonState } from "../types";

/**
 * True final Speed — unlike computeStats().spe (raw stat only), this runs
 * @smogon/calc's own getFinalSpeed(), which also applies held item (Choice
 * Scarf, Iron Ball), ability (Chlorophyll, Swift Swim, Unburden...), status
 * (paralysis), and Tailwind. Everything the Pokémon is already configured
 * with (item/ability/nature/status) is respected as-is; `tailwind` lets the
 * comparator show a quick "what if" toggle without touching the real field
 * state elsewhere in the app.
 */
export function computeFinalSpeed(state: PokemonState, field: FieldState, tailwind: boolean): number {
  const pokemon = buildPokemon(state);
  const f = buildField({
    ...field,
    attackerSide: { ...field.attackerSide, isTailwind: tailwind },
  });
  return getFinalSpeed(champGen, pokemon, f, f.attackerSide);
}