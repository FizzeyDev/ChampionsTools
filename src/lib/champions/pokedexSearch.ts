// Pure search logic for the advanced Pokémon search. No React in here so it
// can be unit-tested. Every result carries the *reasons* it matched, which the
// UI shows as chips ("learns Fake Out", "Spe 135 ≥ 120"…), so the user never
// has to wonder why a Pokémon is in the list.

import { matchesBilingual } from "./gameTranslations";
import {
  allAbilitiesOf,
  coverageTypesOf,
  getAllSpecies,
  type LearnsetIndex,
  type SpeciesInfo,
} from "./data";
import type { StatKey } from "../calc/gen";

export type TypeMode = "any" | "all" | "exact";
export type MoveMode = "and" | "or";
export type MegaMode = "any" | "isMega" | "hasMega" | "noMega";

export interface SearchFilters {
  text: string;
  types: string[];
  /** any = has at least one of the types, all = has every selected type,
   * exact = has exactly the selected types (and no other). */
  typeMode: TypeMode;
  abilities: string[];
  moves: string[];
  moveMode: MoveMode;
  mega: MegaMode;
  minStats: Partial<Record<StatKey, number>>;
  minBst: number;
  /** Base Speed range (0 = no bound / 999 = no bound). */
  speedMin: number;
  speedMax: number;
  /** Types the Pokémon can hit with a learnable damaging move. */
  coverage: string[];
  /** Types the Pokémon resists (or is immune to). */
  resists: string[];
  /** Hide Mega forms from the results altogether. */
  hideMegas: boolean;
}

export function defaultFilters(): SearchFilters {
  return {
    text: "",
    types: [],
    typeMode: "all",
    abilities: [],
    moves: [],
    moveMode: "and",
    mega: "any",
    minStats: {},
    minBst: 0,
    speedMin: 0,
    speedMax: 999,
    coverage: [],
    resists: [],
    hideMegas: false,
  };
}

export function hasActiveFilters(f: SearchFilters): boolean {
  const d = defaultFilters();
  return (
    f.text.trim() !== "" ||
    f.types.length > 0 ||
    f.abilities.length > 0 ||
    f.moves.length > 0 ||
    f.mega !== d.mega ||
    Object.values(f.minStats).some((v) => (v ?? 0) > 0) ||
    f.minBst > 0 ||
    f.speedMin > 0 ||
    f.speedMax < 999 ||
    f.coverage.length > 0 ||
    f.resists.length > 0 ||
    f.hideMegas
  );
}

/** Does this search need the (async) learnset index? */
export function needsLearnsets(f: SearchFilters): boolean {
  return f.moves.length > 0 || f.coverage.length > 0;
}

export type ReasonKind = "type" | "ability" | "move" | "mega" | "stat" | "coverage" | "resist";

export interface Reason {
  kind: ReasonKind;
  /** Raw (English) values; the UI translates/links them. */
  values: string[];
  /** Extra text for stat/mega reasons, e.g. "Spe 135". */
  text?: string;
}

export interface SearchResult {
  info: SpeciesInfo;
  reasons: Reason[];
}

export const STAT_LABEL: Record<StatKey, string> = {
  hp: "HP",
  atk: "Atk",
  def: "Def",
  spa: "SpA",
  spd: "SpD",
  spe: "Spe",
};

/** Runs the search. `learnsets` may be null while it is still loading: filters
 * that need it are then skipped by the caller (see needsLearnsets). */
export function runSearch(f: SearchFilters, learnsets: LearnsetIndex | null): SearchResult[] {
  const out: SearchResult[] = [];

  for (const info of getAllSpecies()) {
    if (f.hideMegas && info.isMega) continue;
    const reasons: Reason[] = [];

    // --- name
    if (f.text.trim() && !matchesBilingual("species", info.name, f.text)) continue;

    // --- types
    if (f.types.length > 0) {
      const has = f.types.filter((t) => info.types.includes(t));
      let ok = false;
      if (f.typeMode === "any") ok = has.length > 0;
      else if (f.typeMode === "all") ok = has.length === f.types.length;
      else ok = has.length === f.types.length && info.types.length === f.types.length;
      if (!ok) continue;
      reasons.push({ kind: "type", values: has });
    }

    // --- abilities
    if (f.abilities.length > 0) {
      const mine = allAbilitiesOf(info);
      const hit = f.abilities.filter((a) => mine.includes(a));
      if (hit.length === 0) continue;
      reasons.push({ kind: "ability", values: hit });
    }

    // --- Mega
    if (f.mega !== "any") {
      const ok =
        f.mega === "isMega"
          ? info.isMega
          : f.mega === "hasMega"
            ? info.megaForms.length > 0
            : !info.isMega && info.megaForms.length === 0;
      if (!ok) continue;
      if (f.mega !== "noMega") {
        reasons.push({
          kind: "mega",
          values: f.mega === "hasMega" ? info.megaForms : [info.name],
        });
      }
    }

    // --- stats
    let statOk = true;
    for (const [k, min] of Object.entries(f.minStats) as [StatKey, number | undefined][]) {
      if (!min) continue;
      if (info.baseStats[k] < min) {
        statOk = false;
        break;
      }
      reasons.push({ kind: "stat", values: [], text: `${STAT_LABEL[k]} ${info.baseStats[k]} ≥ ${min}` });
    }
    if (!statOk) continue;
    if (f.minBst > 0) {
      if (info.bst < f.minBst) continue;
      reasons.push({ kind: "stat", values: [], text: `BST ${info.bst} ≥ ${f.minBst}` });
    }
    if (f.speedMin > 0 || f.speedMax < 999) {
      const spe = info.baseStats.spe;
      if (spe < f.speedMin || spe > f.speedMax) continue;
      reasons.push({ kind: "stat", values: [], text: `Spe ${spe}` });
    }

    // --- resistances
    if (f.resists.length > 0) {
      if (!f.resists.every((t) => (info.chart[t] ?? 1) < 1)) continue;
      reasons.push({ kind: "resist", values: f.resists });
    }

    // --- moves / coverage (need the learnset index)
    if (f.moves.length > 0 && learnsets) {
      const pool = learnsets.bySpecies.get(info.name);
      const known = pool ? f.moves.filter((m) => pool.has(m)) : [];
      const ok = f.moveMode === "and" ? known.length === f.moves.length : known.length > 0;
      if (!ok) continue;
      reasons.push({ kind: "move", values: known });
    }
    if (f.coverage.length > 0 && learnsets) {
      const pool = learnsets.bySpecies.get(info.name);
      const types = pool ? coverageTypesOf(pool) : new Set<string>();
      if (!f.coverage.every((t) => types.has(t))) continue;
      reasons.push({ kind: "coverage", values: f.coverage });
    }

    out.push({ info, reasons });
  }
  return out;
}

// ------------------------------------------------------------ share link ---

/** Only non-default fields are written, so links stay short. */
export function encodeFilters(f: SearchFilters): string {
  const d = defaultFilters();
  const compact: Record<string, unknown> = {};
  (Object.keys(f) as (keyof SearchFilters)[]).forEach((k) => {
    if (JSON.stringify(f[k]) !== JSON.stringify(d[k])) compact[k] = f[k];
  });
  const json = JSON.stringify(compact);
  return btoa(encodeURIComponent(json).replace(/%([0-9A-F]{2})/g, (_, p) => String.fromCharCode(parseInt(p, 16))));
}

export function decodeFilters(encoded: string): SearchFilters | null {
  try {
    const binary = atob(encoded);
    const percent = binary
      .split("")
      .map((c) => "%" + c.charCodeAt(0).toString(16).padStart(2, "0"))
      .join("");
    const parsed = JSON.parse(decodeURIComponent(percent)) as Partial<SearchFilters>;
    if (!parsed || typeof parsed !== "object") return null;
    const merged = { ...defaultFilters(), ...parsed };
    // Defensive: reject malformed arrays so a hand-edited link can't crash the page.
    for (const k of ["types", "abilities", "moves", "coverage", "resists"] as const) {
      if (!Array.isArray(merged[k]) || merged[k].some((x) => typeof x !== "string")) return null;
    }
    return merged;
  } catch {
    return null;
  }
}
