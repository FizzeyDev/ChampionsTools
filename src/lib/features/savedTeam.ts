import { defaultPokemon } from "../types";
import type { PokemonState } from "../types";

const STORAGE_KEY = "champcalc.teamCoverage";
export const TEAM_SIZE = 6;

export function emptyTeam(): PokemonState[] {
  return Array.from({ length: TEAM_SIZE }, () => defaultPokemon(""));
}

export function loadTeam(): PokemonState[] {
  if (typeof window === "undefined") return emptyTeam();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyTeam();
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return emptyTeam();
    const team = emptyTeam();
    for (let i = 0; i < TEAM_SIZE; i++) {
      if (parsed[i]) team[i] = { ...defaultPokemon(""), ...parsed[i] };
    }
    return team;
  } catch {
    return emptyTeam();
  }
}

export function saveTeam(team: PokemonState[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(team));
  } catch {
    // storage full or unavailable — silently ignore
  }
}

// --- Named saves: separate from the auto-saved "current working team"
// above, so the person can keep a few named rosters around (e.g. "Rain
// team", "Trick Room") and switch between them without losing work. ---

const NAMED_STORAGE_KEY = "champcalc.savedTeams";

export interface SavedTeam {
  id: string;
  name: string;
  team: PokemonState[];
  savedAt: number;
}

function readNamed(): SavedTeam[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(NAMED_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeNamed(entries: SavedTeam[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(NAMED_STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // storage full or unavailable — silently ignore
  }
}

export function getSavedTeams(): SavedTeam[] {
  return readNamed().sort((a, b) => b.savedAt - a.savedAt);
}

export function saveNamedTeam(name: string, team: PokemonState[]): SavedTeam {
  const entries = readNamed();
  const entry: SavedTeam = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: name.trim() || "Team",
    team: JSON.parse(JSON.stringify(team)),
    savedAt: Date.now(),
  };
  entries.push(entry);
  writeNamed(entries);
  return entry;
}

export function deleteSavedTeam(id: string) {
  writeNamed(readNamed().filter((e) => e.id !== id));
}