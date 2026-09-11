import { calculate, Pokemon, Move, Field } from "@smogon/calc";
import { champGen } from "./champions/megaSpecies";
import type { FieldState, PokemonState } from "./types";

export interface MoveResult {
  move: string;
  description: string;
  range: [number, number] | null;
  percent: [number, number] | null;
  koText: string;
  rolls: number[] | null;
  multihit: boolean;
  hitBreakdown: [number, number][] | null;
  error?: string;
}

export function buildPokemon(state: PokemonState) {
  return new Pokemon(champGen, state.species, {
    level: state.level,
    item: state.item || undefined,
    ability: state.ability || undefined,
    nature: state.nature,
    teraType: state.useTera && state.teraType ? (state.teraType as never) : undefined,
    status: (state.status || "") as never,
    abilityOn: state.abilityOn,
    alliesFainted: state.alliesFainted || undefined,
    evs: state.evs,
    ivs: state.ivs,
    boosts: state.boosts,
  });
}

function buildField(field: FieldState) {
  return new Field({
    gameType: field.gameType,
    weather: (field.weather || undefined) as never,
    terrain: (field.terrain || undefined) as never,
    isGravity: field.isGravity,
    isMagicRoom: field.isMagicRoom,
    isWonderRoom: field.isWonderRoom,
    isBeadsOfRuin: field.isBeadsOfRuin,
    isSwordOfRuin: field.isSwordOfRuin,
    isTabletsOfRuin: field.isTabletsOfRuin,
    isVesselOfRuin: field.isVesselOfRuin,
    attackerSide: field.attackerSide,
    defenderSide: field.defenderSide,
  });
}

/** Actual in-battle stats (base + EV/IV/nature/level/boosts applied). */
export function computeStats(state: PokemonState) {
  return buildPokemon(state).stats;
}

export function computeMoveResults(
  attacker: PokemonState,
  defender: PokemonState,
  field: FieldState,
  moveList?: string[]
): MoveResult[] {
  const results: MoveResult[] = [];
  const atk = buildPokemon(attacker);
  const def = buildPokemon(defender);
  const f = buildField(field);
  const maxHP = def.maxHP();
  const moves = moveList ?? attacker.moves;

  const targetOverride =
    field.spreadOverride === "spread"
      ? "allAdjacentFoes"
      : field.spreadOverride === "single"
        ? "normal"
        : undefined;

  for (let i = 0; i < moves.length; i++) {
    const moveName = moves[i];
    if (!moveName) continue;
    try {
      const move = new Move(champGen, moveName, {
        isCrit: !!attacker.critMoves[i],
        overrides: targetOverride ? ({ target: targetOverride } as never) : undefined,
      });
      const result = calculate(champGen, atk.clone(), def.clone(), move, f.clone());
      const range = result.range();
      const percent: [number, number] = [
        Math.round((range[0] / maxHP) * 1000) / 10,
        Math.round((range[1] / maxHP) * 1000) / 10,
      ];
      const flatRolls =
        Array.isArray(result.damage) && typeof result.damage[0] === "number"
          ? (result.damage as number[])
          : null;
      const isNestedHits =
        !flatRolls && Array.isArray(result.damage) && Array.isArray(result.damage[0]);
      const hitBreakdown: [number, number][] | null = isNestedHits
        ? (result.damage as number[][]).map((hit) => [Math.min(...hit), Math.max(...hit)])
        : null;
      results.push({
        move: moveName,
        description: result.desc(),
        range,
        percent,
        koText: result.kochance().text,
        rolls: flatRolls,
        multihit: isNestedHits,
        hitBreakdown,
      });
    } catch (err) {
      results.push({
        move: moveName,
        description: "",
        range: null,
        percent: null,
        koText: "",
        rolls: null,
        multihit: false,
        hitBreakdown: null,
        error: err instanceof Error ? err.message : "Calcul impossible",
      });
    }
  }

  return results;
}