import { TYPE_NAMES } from "../calc/gen";
import { computeTypeChart } from "../calc/typeChart";
import { speciesTypes, moveInfo } from "../app/sprites";
import { computeStats } from "../calc/calcEngine";
import { META_SETS } from "../champions/metaSets";
import type { PokemonState } from "../calc/types";

export type WeaknessLabel = "veryWeak" | "weak" | "resist" | "veryResist";

export interface TeamTypeEntry {
  type: string;
  /** Average log2(multiplier) across the team's filled slots, weighted by
   * bulk (a frailer member weighing a shared weakness more heavily than a
   * tanky one). Positive = net weak, negative = net resistant. */
  severity: number;
  label: WeaknessLabel;
}

export interface CoverageRecommendation {
  type: string;
  /** Higher = better pick to patch the team's current weaknesses. */
  score: number;
}

export interface ThreatEntry {
  species: string;
  score: number;
}

export interface TeamAnalysis {
  filledCount: number;
  weaknesses: TeamTypeEntry[]; // only non-neutral entries, sorted by |severity| desc
  recommendations: CoverageRecommendation[];
  threatsToTeam: ThreatEntry[]; // meta Pokémon strong against the team
  teamThreatens: ThreatEntry[]; // meta Pokémon weak to the team
  /** The attacking types the team's current moves (or, for empty slots,
   * species types as a stand-in) actually cover - this is the one part of
   * the analysis that reacts to the moves you pick. Note: the "weaknesses"
   * above are purely about the team's own defensive typing and never
   * change based on moves - that's by design, not a bug. */
  offensiveCoverage: string[];
}

const RESIST_VALUE: Record<number, number> = {
  0: 2.5,
  0.25: 2,
  0.5: 1,
  1: 0,
  2: -1.5,
  4: -2.5,
};

function bulkOf(member: PokemonState): number {
  try {
    const stats = computeStats(member);
    return Math.sqrt(stats.hp * ((stats.def + stats.spd) / 2));
  } catch {
    return 100;
  }
}

/** The attacking types this member brings to the team's offense: real move
 * types when moves are set (damaging moves only), otherwise its own species
 * types as a stand-in for presumed STAB coverage. */
function offensiveTypesOf(member: PokemonState): string[] {
  const dmgMoveTypes = member.moves
    .filter(Boolean)
    .map((m) => moveInfo(m))
    .filter((m) => m.category && m.category !== "Status" && (m.bp ?? 0) > 0)
    .map((m) => m.type)
    .filter((t): t is string => !!t);
  if (dmgMoveTypes.length > 0) return [...new Set(dmgMoveTypes)];
  return speciesTypes(member.species);
}

export function analyzeTeam(team: PokemonState[], includeThreats: boolean): TeamAnalysis {
  const filled = team.filter((m) => m.species);
  if (filled.length === 0) {
    return {
      filledCount: 0,
      weaknesses: [],
      recommendations: [],
      threatsToTeam: [],
      teamThreatens: [],
      offensiveCoverage: [],
    };
  }

  const offensiveCoverage = [...new Set(filled.flatMap(offensiveTypesOf))].sort();

  const bulks = filled.map(bulkOf);
  const avgBulk = bulks.reduce((a, b) => a + b, 0) / bulks.length || 1;
  const weights = bulks.map((b) => Math.max(0.5, Math.min(2, avgBulk / Math.max(1, b))));

  const severityByType: Record<string, number> = {};
  for (const type of TYPE_NAMES) {
    let sum = 0;
    filled.forEach((member, i) => {
      const chart = computeTypeChart(speciesTypes(member.species));
      const mult = chart[type] ?? 1;
      const sev = mult > 0 ? Math.log2(mult) : -3;
      sum += sev * weights[i];
    });
    severityByType[type] = sum / filled.length;
  }

  const weaknesses: TeamTypeEntry[] = TYPE_NAMES.map((type) => {
    const severity = severityByType[type];
    let label: WeaknessLabel | null = null;
    if (severity >= 1.3) label = "veryWeak";
    else if (severity >= 0.5) label = "weak";
    else if (severity <= -1.3) label = "veryResist";
    else if (severity <= -0.5) label = "resist";
    return label ? ({ type, severity, label } as TeamTypeEntry) : null;
  })
    .filter((e): e is TeamTypeEntry => e !== null)
    .sort((a, b) => Math.abs(b.severity) - Math.abs(a.severity));

  const trueWeaknesses = weaknesses.filter((w) => w.label === "weak" || w.label === "veryWeak");
  const recommendations: CoverageRecommendation[] = TYPE_NAMES.map((candidate) => {
    const score = trueWeaknesses.reduce((acc, w) => {
      const mult = computeTypeChart([candidate])[w.type] ?? 1;
      const resistValue = RESIST_VALUE[mult] ?? 0;
      return acc + resistValue * w.severity;
    }, 0);
    return { type: candidate, score };
  })
    .filter((r) => r.score > 0.3)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4);

  let threatsToTeam: ThreatEntry[] = [];
  let teamThreatens: ThreatEntry[] = [];

  if (includeThreats) {
    const coverage = new Set(offensiveCoverage);
    const ourChartByMember = filled.map((m) => computeTypeChart(speciesTypes(m.species)));

    const pool = Object.keys(META_SETS);
    const threatensRaw: ThreatEntry[] = [];
    const threatenedRaw: ThreatEntry[] = [];

    for (const species of pool) {
      if (filled.some((m) => m.species === species)) continue;
      const defTypes = speciesTypes(species);
      if (defTypes.length === 0) continue;
      const theirChart = computeTypeChart(defTypes);

      // How hard WE hit them: best multiplier across our coverage types.
      let ourBest = 0;
      for (const t of coverage) ourBest = Math.max(ourBest, theirChart[t] ?? 1);
      if (ourBest >= 2) threatensRaw.push({ species, score: ourBest });

      // How hard THEY hit our frailest matchup: best multiplier their own
      // (species-type/STAB) offense gets against any of our members.
      let theirBest = 0;
      for (const offType of defTypes) {
        for (const chart of ourChartByMember) theirBest = Math.max(theirBest, chart[offType] ?? 1);
      }
      if (theirBest >= 2) threatenedRaw.push({ species, score: theirBest });
    }

    teamThreatens = threatensRaw.sort((a, b) => b.score - a.score).slice(0, 8);
    threatsToTeam = threatenedRaw.sort((a, b) => b.score - a.score).slice(0, 8);
  }

  return { filledCount: filled.length, weaknesses, recommendations, threatsToTeam, teamThreatens, offensiveCoverage };
}