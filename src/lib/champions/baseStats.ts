import { champGen } from "./megaSpecies";
import type { StatsTable } from "../types";

const ZERO_STATS: StatsTable = { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 };

export function getBaseStats(species: string): StatsTable {
  if (!species) return ZERO_STATS;
  const id = species.toLowerCase().replace(/[^a-z0-9]/g, "");
  const s = champGen.species.get(id) as { baseStats?: StatsTable } | undefined;
  return s?.baseStats ?? ZERO_STATS;
}