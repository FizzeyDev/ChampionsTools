import { ABILITY_NAMES, MOVE_NAMES, NATURE_NAMES, SPECIES_NAMES, STAT_KEYS } from "./gen";
import { defaultPokemon } from "./types";
import type { PokemonState, StatsTable } from "./types";

const STAT_ALIASES: Record<string, keyof StatsTable> = {
  hp: "hp",
  atk: "atk",
  def: "def",
  spa: "spa",
  spd: "spd",
  spe: "spe",
};

function findByLoose(name: string, options: readonly string[]): string | null {
  const norm = name.trim().toLowerCase();
  const exact = options.find((o) => o.toLowerCase() === norm);
  if (exact) return exact;
  return null;
}

function parseStatLine(line: string): Partial<StatsTable> {
  const out: Partial<StatsTable> = {};
  const parts = line.split("/");
  for (const part of parts) {
    const m = part.trim().match(/^(\d+)\s+([A-Za-z]+)$/);
    if (!m) continue;
    const value = Number(m[1]);
    const key = STAT_ALIASES[m[2].toLowerCase()];
    if (key) out[key] = value;
  }
  return out;
}

/**
 * Parses a Pokémon Showdown-style exported set:
 *
 *   Charizard @ Choice Specs
 *   Ability: Blaze
 *   Level: 50
 *   Tera Type: Fire
 *   EVs: 252 SpA / 4 SpD / 252 Spe
 *   Timid Nature
 *   - Flamethrower
 *   - Air Slash
 *   - Solar Beam
 *   - Focus Blast
 *
 * Returns null if the first line doesn't resolve to a known species.
 */
export function parseShowdownSet(text: string): PokemonState | null {
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length === 0) return null;

  const firstLine = lines[0];
  const atMatch = firstLine.match(/^(.+?)\s*@\s*(.+)$/);
  const speciesRaw = (atMatch ? atMatch[1] : firstLine).replace(/\s*\([MF]\)\s*$/, "").trim();
  const itemRaw = atMatch ? atMatch[2].trim() : "";

  const species = findByLoose(speciesRaw, SPECIES_NAMES);
  if (!species) return null;

  const state = defaultPokemon(species);
  if (itemRaw) {
    // Item pool is intentionally curated (see champions/items.ts); if the
    // pasted item isn't in it, we still keep the text so it's visible.
    state.item = itemRaw;
  }

  const moves: string[] = [];
  for (const line of lines.slice(1)) {
    if (/^ability\s*:/i.test(line)) {
      const found = findByLoose(line.split(":")[1], ABILITY_NAMES);
      if (found) state.ability = found;
    } else if (/^level\s*:/i.test(line)) {
      const n = Number(line.split(":")[1]);
      if (!isNaN(n)) state.level = Math.max(1, Math.min(100, n));
    } else if (/^tera type\s*:/i.test(line)) {
      const t = line.split(":")[1]?.trim();
      if (t) {
        state.teraType = t;
        state.useTera = true;
      }
    } else if (/^evs\s*:/i.test(line)) {
      Object.assign(state.evs, parseStatLine(line.split(":")[1]));
    } else if (/^ivs\s*:/i.test(line)) {
      // Champions fixes IVs at 31 for every stat — imported IV lines are
      // intentionally ignored rather than producing an inaccurate state.
    } else if (/nature$/i.test(line)) {
      const natureName = line.replace(/nature$/i, "").trim();
      const found = findByLoose(natureName, NATURE_NAMES);
      if (found) state.nature = found;
    } else if (/^shiny\s*:/i.test(line) || /^gender\s*:/i.test(line) || /^happiness\s*:/i.test(line)) {
      // not modeled, ignore
    } else if (line.startsWith("-")) {
      const moveName = findByLoose(line.replace(/^-\s*/, ""), MOVE_NAMES);
      if (moveName && moves.length < 4) moves.push(moveName);
    }
  }

  state.moves = [moves[0] ?? "", moves[1] ?? "", moves[2] ?? "", moves[3] ?? ""];
  return state;
}

const STAT_EXPORT_LABELS: Record<string, string> = {  hp: "HP",
  atk: "Atk",
  def: "Def",
  spa: "SpA",
  spd: "SpD",
  spe: "Spe",
};

export function exportShowdownSet(state: PokemonState): string {
  const lines: string[] = [];
  lines.push(state.item ? `${state.species} @ ${state.item}` : state.species);
  if (state.ability) lines.push(`Ability: ${state.ability}`);
  if (state.level !== 100) lines.push(`Level: ${state.level}`);
  if (state.useTera && state.teraType) lines.push(`Tera Type: ${state.teraType}`);
  const evParts = STAT_KEYS.filter((k) => state.evs[k] > 0).map(
    (k) => `${state.evs[k]} ${STAT_EXPORT_LABELS[k]}`
  );
  if (evParts.length) lines.push(`EVs: ${evParts.join(" / ")}`);
  const ivParts = STAT_KEYS.filter((k) => state.ivs[k] !== 31).map(
    (k) => `${state.ivs[k]} ${STAT_EXPORT_LABELS[k]}`
  );
  if (ivParts.length) lines.push(`IVs: ${ivParts.join(" / ")}`);
  lines.push(`${state.nature} Nature`);
  for (const m of state.moves) {
    if (m) lines.push(`- ${m}`);
  }
  return lines.join("\n");
}

/**
 * Parses a full Showdown-exported team: multiple sets separated by one or
 * more blank lines. Sets whose first line doesn't resolve to a known
 * species are silently skipped. Returns up to 6 Pokémon.
 */
export function parseShowdownTeam(text: string, max = 6): PokemonState[] {
  const chunks = text
    .split(/\n\s*\n/)
    .map((c) => c.trim())
    .filter(Boolean);
  const team: PokemonState[] = [];
  for (const chunk of chunks) {
    const parsed = parseShowdownSet(chunk);
    if (parsed) team.push(parsed);
    if (team.length >= max) break;
  }
  return team;
}

export function exportShowdownTeam(team: PokemonState[]): string {
  return team.map(exportShowdownSet).join("\n\n");
}