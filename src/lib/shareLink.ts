import type { FieldState, PokemonState } from "./types";

export interface SharedState {
  attacker: PokemonState;
  defender: PokemonState;
  field: FieldState;
}

export function encodeState(state: SharedState): string {
  const json = JSON.stringify(state);
  // btoa needs a binary string; escape/encodeURIComponent handles unicode.
  return btoa(encodeURIComponent(json).replace(/%([0-9A-F]{2})/g, (_, p) => String.fromCharCode(parseInt(p, 16))));
}

export function decodeState(encoded: string): SharedState | null {
  try {
    const binary = atob(encoded);
    const percent = binary
      .split("")
      .map((c) => "%" + c.charCodeAt(0).toString(16).padStart(2, "0"))
      .join("");
    const json = decodeURIComponent(percent);
    const parsed = JSON.parse(json);
    if (!parsed || !parsed.attacker || !parsed.defender || !parsed.field) return null;
    return parsed as SharedState;
  } catch {
    return null;
  }
}

export function buildShareUrl(state: SharedState): string {
  const encoded = encodeState(state);
  const url = new URL(window.location.href);
  url.hash = `state=${encoded}`;
  return url.toString();
}

export function readStateFromLocation(): SharedState | null {
  if (typeof window === "undefined") return null;
  const hash = window.location.hash.replace(/^#/, "");
  const params = new URLSearchParams(hash);
  const encoded = params.get("state");
  if (!encoded) return null;
  return decodeState(encoded);
}