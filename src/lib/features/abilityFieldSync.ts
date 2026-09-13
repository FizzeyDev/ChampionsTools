import type { FieldState, PokemonState } from "../types";

const WEATHER_ABILITIES: Record<string, string> = {
  Drought: "Sun",
  Drizzle: "Rain",
  "Sand Stream": "Sand",
  "Snow Warning": "Snow",
};

const TERRAIN_ABILITIES: Record<string, string> = {
  "Electric Surge": "Electric",
  "Grassy Surge": "Grassy",
  "Misty Surge": "Misty",
  "Psychic Surge": "Psychic",
};

/**
 * When "ability triggered" is checked on a Pokémon whose ability sets the
 * weather or terrain (Drought, Drizzle, Electric Surge...), this returns
 * the Field patch that turns that weather/terrain on — but only if the
 * field doesn't already have a different one set, so it never clobbers an
 * intentional setup from another Pokémon or a manual choice. Unchecking it
 * reverts the field, but only if it still matches exactly what this
 * ability would have set (same safety net in reverse). Returns null when
 * there's nothing to sync (wrong ability, no relevant toggle change, or a
 * conflicting field state that should be left alone).
 */
export function syncFieldForAbilityToggle(
  prevAbilityOn: boolean,
  next: PokemonState,
  field: FieldState
): Partial<FieldState> | null {
  const turnedOn = !prevAbilityOn && next.abilityOn;
  const turnedOff = prevAbilityOn && !next.abilityOn;
  if (!turnedOn && !turnedOff) return null;

  const weatherValue = WEATHER_ABILITIES[next.ability];
  if (weatherValue) {
    if (turnedOn && field.weather === "") return { weather: weatherValue };
    if (turnedOff && field.weather === weatherValue) return { weather: "" };
    return null;
  }

  const terrainValue = TERRAIN_ABILITIES[next.ability];
  if (terrainValue) {
    if (turnedOn && field.terrain === "") return { terrain: terrainValue };
    if (turnedOff && field.terrain === terrainValue) return { terrain: "" };
    return null;
  }

  return null;
}