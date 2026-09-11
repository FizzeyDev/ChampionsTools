import type { StatKey } from "./gen";

export type StatsTable = Record<StatKey, number>;

export interface PokemonState {
  species: string;
  level: number;
  item: string;
  itemLocked: boolean;
  ability: string;
  nature: string;
  teraType: string;
  useTera: boolean;
  status: string;
  abilityOn: boolean;
  alliesFainted: number;
  evs: StatsTable;
  ivs: StatsTable;
  boosts: StatsTable;
  moves: string[];
  critMoves: boolean[];
}

export interface SideState {
  isReflect: boolean;
  isLightScreen: boolean;
  isAuroraVeil: boolean;
  isProtected: boolean;
  isSeeded: boolean;
  isSaltCured: boolean;
  isForesight: boolean;
  isTailwind: boolean;
  isHelpingHand: boolean;
  isFriendGuard: boolean;
  isSR: boolean;
  spikes: number;
}

export interface FieldState {
  gameType: "Singles" | "Doubles";
  weather: string;
  terrain: string;
  isGravity: boolean;
  isMagicRoom: boolean;
  isWonderRoom: boolean;
  isBeadsOfRuin: boolean;
  isSwordOfRuin: boolean;
  isTabletsOfRuin: boolean;
  isVesselOfRuin: boolean;
  spreadOverride: "auto" | "single" | "spread";
  attackerSide: SideState;
  defenderSide: SideState;
}

export function defaultStats(value: number): StatsTable {
  return { hp: value, atk: value, def: value, spa: value, spd: value, spe: value };
}

export function defaultPokemon(species: string, moves: string[] = []): PokemonState {
  return {
    species,
    level: 50,
    item: "",
    itemLocked: false,
    ability: "",
    nature: "Hardy",
    teraType: "",
    useTera: false,
    status: "",
    abilityOn: false,
    alliesFainted: 0,
    evs: defaultStats(0),
    ivs: defaultStats(31),
    boosts: defaultStats(0),
    moves: [moves[0] ?? "", moves[1] ?? "", moves[2] ?? "", moves[3] ?? ""],
    critMoves: [false, false, false, false],
  };
}

export function defaultField(): FieldState {
  const defaultSide = (): SideState => ({
    isReflect: false,
    isLightScreen: false,
    isAuroraVeil: false,
    isProtected: false,
    isSeeded: false,
    isSaltCured: false,
    isForesight: false,
    isTailwind: false,
    isHelpingHand: false,
    isFriendGuard: false,
    isSR: false,
    spikes: 0,
  });
  return {
    gameType: "Doubles",
    weather: "",
    terrain: "",
    isGravity: false,
    isMagicRoom: false,
    isWonderRoom: false,
    isBeadsOfRuin: false,
    isSwordOfRuin: false,
    isTabletsOfRuin: false,
    isVesselOfRuin: false,
    spreadOverride: "auto",
    attackerSide: defaultSide(),
    defenderSide: defaultSide(),
  };
}