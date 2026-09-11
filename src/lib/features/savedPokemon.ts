import type { PokemonState } from "../types";

const STORAGE_KEY = "champcalc.savedPokemon";

export interface SavedPokemon {
  id: string;
  name: string;
  state: PokemonState;
  savedAt: number;
}

function readAll(): SavedPokemon[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAll(entries: SavedPokemon[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // storage full or unavailable — silently ignore
  }
}

export function getSavedPokemons(): SavedPokemon[] {
  return readAll().sort((a, b) => b.savedAt - a.savedAt);
}

export function savePokemon(name: string, state: PokemonState): SavedPokemon {
  const entries = readAll();
  const entry: SavedPokemon = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: name.trim() || state.species,
    // Deep-clone so later edits to the live state don't mutate the save.
    state: JSON.parse(JSON.stringify(state)),
    savedAt: Date.now(),
  };
  entries.push(entry);
  writeAll(entries);
  return entry;
}

export function deleteSavedPokemon(id: string) {
  writeAll(readAll().filter((e) => e.id !== id));
}

export function renameSavedPokemon(id: string, name: string) {
  const entries = readAll();
  const entry = entries.find((e) => e.id === id);
  if (entry) entry.name = name.trim() || entry.name;
  writeAll(entries);
}