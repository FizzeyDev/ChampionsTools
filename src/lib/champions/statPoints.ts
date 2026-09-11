// Pokémon Champions replaces the classic 0-252 EV system with Stat Points:
// a budget of 66 points shared across the 6 stats, 32 points max per stat.
// The official EV conversion is 4 EV for the first point, then +8 EV per
// additional point (so 32 points = 4 + 8*31 = 252 EV, matching the old cap).

export const STAT_POINT_CAP = 32;
export const STAT_POINT_BUDGET = 66;

export function spToEv(sp: number): number {
  const clamped = Math.max(0, Math.min(STAT_POINT_CAP, Math.round(sp)));
  if (clamped <= 0) return 0;
  return Math.min(252, 4 + 8 * (clamped - 1));
}

// Best-effort inverse, used to show a sensible SP value for EVs that were
// set some other way (e.g. an imported Showdown set using raw EVs).
export function evToSp(ev: number): number {
  const clamped = Math.max(0, Math.min(252, Math.round(ev)));
  if (clamped <= 0) return 0;
  return Math.min(STAT_POINT_CAP, Math.ceil((clamped - 4) / 8) + 1);
}