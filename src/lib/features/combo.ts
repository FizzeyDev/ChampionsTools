// "Does it survive two hits in the same turn?" - exact roll-by-roll maths.
//
// Every damaging hit in Gen 9 has 16 equally likely damage rolls. Stacking N
// hits means the total is the sum of N independent rolls, so the chance of a
// KO is exactly P(sum >= HP). We build that distribution by convolution
// instead of guessing from min/max, which is what makes "~34% to KO" honest.

export interface ComboHit {
  /** Damage of each possible roll (16 values, or an interpolated spread for multi-hit moves). */
  rolls: number[];
}

export interface ComboSummary {
  minDamage: number;
  maxDamage: number;
  /** Probability (0–1) that the stacked damage is >= the target's HP. */
  koChance: number;
  guaranteedKo: boolean;
  survivesAlways: boolean;
}

/** 16 plausible rolls from a [min,max] range, for moves whose per-roll array is not exposed (multi-hit). */
export function rollsFromRange(min: number, max: number): number[] {
  return Array.from({ length: 16 }, (_, i) => Math.round(min + ((max - min) * i) / 15));
}

export function summarizeCombo(hits: ComboHit[], hp: number): ComboSummary {
  if (hits.length === 0 || hp <= 0) {
    return { minDamage: 0, maxDamage: 0, koChance: 0, guaranteedKo: false, survivesAlways: true };
  }
  // sum -> probability
  let dist = new Map<number, number>([[0, 1]]);
  for (const h of hits) {
    const next = new Map<number, number>();
    const p = 1 / h.rolls.length;
    for (const [sum, prob] of dist) {
      for (const r of h.rolls) {
        // Anything already >= HP is a KO whatever follows: cap to keep the map small.
        const s = Math.min(sum + r, hp);
        next.set(s, (next.get(s) ?? 0) + prob * p);
      }
    }
    dist = next;
  }
  let ko = 0;
  for (const [sum, prob] of dist) if (sum >= hp) ko += prob;
  const minDamage = hits.reduce((a, h) => a + Math.min(...h.rolls), 0);
  const maxDamage = hits.reduce((a, h) => a + Math.max(...h.rolls), 0);
  return {
    minDamage,
    maxDamage,
    koChance: Math.min(1, ko),
    guaranteedKo: minDamage >= hp,
    survivesAlways: maxDamage < hp,
  };
}
