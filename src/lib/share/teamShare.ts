// Shareable team links: the whole team travels in the URL hash (#team=...),
// so there is no server and nothing to host. Only the fields that define a
// build are stored (species, item, ability, nature, Stat Points, moves),
// which keeps the link short enough to paste anywhere.

import { getSpeciesInfo } from "../champions/data";
import { evToSp, spToEv } from "../champions/statPoints";
import { NATURE_NAMES, STAT_KEYS } from "../calc/gen";
import { defaultPokemon, type PokemonState } from "../calc/types";

interface CompactMember {
  s: string;
  i?: string;
  a?: string;
  n?: string;
  t?: string;
  sp?: number[];
  m?: string[];
}

const clip = (v: unknown, max = 48): string => (typeof v === "string" ? v.slice(0, max) : "");

export function encodeTeam(team: PokemonState[]): string {
  const compact: CompactMember[] = team
    .filter((p) => p.species)
    .map((p) => ({
      s: p.species,
      i: p.item || undefined,
      a: p.ability || undefined,
      n: p.nature !== "Hardy" ? p.nature : undefined,
      t: p.useTera && p.teraType ? p.teraType : undefined,
      sp: STAT_KEYS.some((k) => p.evs[k]) ? STAT_KEYS.map((k) => evToSp(p.evs[k])) : undefined,
      m: p.moves.filter(Boolean),
    }));
  const json = JSON.stringify(compact);
  return btoa(encodeURIComponent(json).replace(/%([0-9A-F]{2})/g, (_, h) => String.fromCharCode(parseInt(h, 16))));
}

/** Returns up to 6 valid Pokémon, or null when the link is unreadable. */
export function decodeTeam(encoded: string): PokemonState[] | null {
  try {
    const binary = atob(encoded);
    const percent = binary
      .split("")
      .map((c) => "%" + c.charCodeAt(0).toString(16).padStart(2, "0"))
      .join("");
    const parsed: unknown = JSON.parse(decodeURIComponent(percent));
    if (!Array.isArray(parsed)) return null;
    const out: PokemonState[] = [];
    for (const raw of parsed.slice(0, 6) as CompactMember[]) {
      const species = clip(raw?.s);
      if (!species || !getSpeciesInfo(species)) continue;
      const moves = Array.isArray(raw.m) ? raw.m.slice(0, 4).map((m) => clip(m)) : [];
      const p = defaultPokemon(species, moves);
      p.item = clip(raw.i);
      p.ability = clip(raw.a);
      p.nature = NATURE_NAMES.includes(clip(raw.n)) ? clip(raw.n) : "Hardy";
      if (raw.t) {
        p.useTera = true;
        p.teraType = clip(raw.t);
      }
      if (Array.isArray(raw.sp)) {
        STAT_KEYS.forEach((k, idx) => {
          const sp = Math.max(0, Math.min(32, Math.floor(Number(raw.sp![idx]) || 0)));
          p.evs[k] = spToEv(sp);
        });
      }
      out.push(p);
    }
    return out.length > 0 ? out : null;
  } catch {
    return null;
  }
}

export function buildTeamUrl(team: PokemonState[]): string {
  const url = new URL(window.location.href);
  url.hash = `team=${encodeTeam(team)}`;
  return url.toString();
}

export function readTeamFromLocation(): PokemonState[] | null {
  if (typeof window === "undefined") return null;
  const enc = new URLSearchParams(window.location.hash.replace(/^#/, "")).get("team");
  return enc ? decodeTeam(enc) : null;
}
