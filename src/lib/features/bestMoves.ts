import { getChampionsMoveset } from "../champions/moveset";
import { computeMoveResults, type MoveResult } from "../calcEngine";
import type { PokemonState, FieldState } from "../types";

/**
 * Computes damage for every move in the attacker's real movepool (not just
 * its 4 selected moves) against the defender, sorted by highest damage %
 * first. Moves that fail to calculate (e.g. status moves with no damage)
 * are dropped.
 */
export async function computeBestMoves(
  attacker: PokemonState,
  defender: PokemonState,
  field: FieldState
): Promise<MoveResult[]> {
  const movepool = await getChampionsMoveset(attacker.species);
  const moveList = [...movepool].sort((a, b) => a.localeCompare(b));
  const results = computeMoveResults(attacker, defender, field, moveList);
  return results
    .filter((r) => !r.error && r.percent)
    .sort((a, b) => (b.percent?.[1] ?? 0) - (a.percent?.[1] ?? 0));
}