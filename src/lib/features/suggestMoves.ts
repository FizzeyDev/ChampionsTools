import { gen } from "../calc/gen";
import { champGen } from "../champions/megaSpecies";

/** Status moves valuable enough to suggest even though they deal no direct
 * damage (hazards, setup, recovery, common utility). Everything else in
 * the Status category gets a low baseline score so it only gets suggested
 * when nothing better is available. This is a computed heuristic based on
 * the move's own data (power/type/category/priority) plus this curated
 * "generically strong" list - NOT sourced real usage data the way
 * src/lib/champions/metaSets.ts is. It only kicks in as a fallback for
 * species that don't have a real curated set. */
const STRONG_STATUS = new Set([
  "Stealth Rock",
  "Spikes",
  "Toxic Spikes",
  "Sticky Web",
  "Protect",
  "Detect",
  "Substitute",
  "Swords Dance",
  "Nasty Plot",
  "Calm Mind",
  "Dragon Dance",
  "Quiver Dance",
  "Bulk Up",
  "Shell Smash",
  "Recover",
  "Roost",
  "Slack Off",
  "Soft-Boiled",
  "Milk Drink",
  "Synthesis",
  "Moonlight",
  "Morning Sun",
  "Strength Sap",
  "Wish",
  "Toxic",
  "Will-O-Wisp",
  "Thunder Wave",
  "Taunt",
  "Encore",
  "Defog",
  "Rapid Spin",
  "Trick Room",
  "Tailwind",
  "Spore",
  "Sleep Powder",
  "Leech Seed",
  "Court Change",
  "Haze",
  "Aromatherapy",
  "Heal Bell",
]);

function scoreMove(moveName: string, stabTypes: Set<string>, betterStat: "atk" | "spa" | "even"): number {
  const m = gen.moves.get(moveName as never);
  if (!m) return -1;
  if (m.category === "Status") {
    return STRONG_STATUS.has(m.name) ? 60 : 5;
  }
  // Skarmory-with-Focus-Punch-in-the-suggested-set problems: a move that
  // reads as huge base power in a vacuum but is actually a liability
  // (must recharge next turn, self-KOs, only works if not hit first) gets
  // discounted hard rather than dominating on raw power alone.
  let situational = 1;
  if (m.flags?.recharge) situational = 0.15;
  else if (m.selfdestruct) situational = 0.2;
  else if (m.flags?.failmefirst) situational = 0.3;
  else if (m.flags?.charge) situational = 0.5;

  // A physical move on a special attacker (or vice versa) isn't something
  // that species would actually run - discount unless the two offensive
  // stats are close.
  let categoryFit = 1;
  if (betterStat === "atk" && m.category === "Special") categoryFit = 0.35;
  else if (betterStat === "spa" && m.category === "Physical") categoryFit = 0.35;

  const stab = stabTypes.has(m.type) ? 1.5 : 1;
  const acc = typeof m.accuracy === "number" ? m.accuracy / 100 : 1;
  let score = (m.basePower || 0) * stab * acc * situational * categoryFit;
  if (m.priority > 0) score += 15;
  if (m.multihit) score *= 1.25;
  return score;
}

/** Picks the `count` most generically useful moves from a species' real
 * movepool - STAB damage and a short list of staple utility/setup/hazard
 * moves outrank everything else. Used as the fallback autofill for species
 * without a curated real competitive set (metaSets.ts); those always take
 * priority over this heuristic when they exist. */
export function suggestMoves(species: string, learnedMoves: Iterable<string>, count = 4): string[] {
  const speciesData = champGen.species.get(species as never) as
    | { types?: string[]; baseStats?: { atk: number; spa: number } }
    | undefined;
  const stabTypes = new Set(speciesData?.types ?? []);
  const atk = speciesData?.baseStats?.atk ?? 0;
  const spa = speciesData?.baseStats?.spa ?? 0;
  const betterStat: "atk" | "spa" | "even" = Math.abs(atk - spa) < 15 ? "even" : atk > spa ? "atk" : "spa";

  return [...learnedMoves]
    .map((name) => ({ name, score: scoreMove(name, stabTypes, betterStat) }))
    .filter((m) => m.score >= 0)
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name))
    .slice(0, count)
    .map((m) => m.name);
}