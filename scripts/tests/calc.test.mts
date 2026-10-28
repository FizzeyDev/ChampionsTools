/* eslint-disable @typescript-eslint/no-explicit-any -- tsx exposes CJS named exports under `default` */
// Regression tests for the damage and speed formulas the whole site relies on.
import test from "node:test";
import assert from "node:assert/strict";
import { computeMoveResults, computeStats } from "../../src/lib/calc/calcEngine";
import { spToEv, evToSp } from "../../src/lib/champions/statPoints";
import { defaultField, defaultPokemon } from "../../src/lib/calc/types";

test("Stat Points <-> EV conversion matches the game's formula", () => {
  assert.equal(spToEv(0), 0);
  assert.equal(spToEv(1), 4);
  assert.equal(spToEv(2), 12);
  assert.equal(spToEv(32), 252);
  for (let sp = 0; sp <= 32; sp++) assert.equal(evToSp(spToEv(sp)), sp);
});

test("level-50 stat formula (Garchomp, 32 SP Atk, Adamant)", () => {
  const p = defaultPokemon("Garchomp");
  p.nature = "Adamant";
  p.evs.atk = spToEv(32);
  // floor((floor((2*130+31+63)*50/100)+5)*1.1) = floor(182*1.1) = 200
  assert.equal(computeStats(p).atk, 200);
  assert.equal(computeStats(defaultPokemon("Garchomp")).hp, 183); // 108 base, 0 SP: floor((216+31)*0.5)+60 = 183
});

test("a STAB super-effective move lands in a sane range and is deterministic", () => {
  const atk = defaultPokemon("Garchomp", ["Earthquake"]);
  atk.nature = "Adamant";
  atk.evs.atk = spToEv(32);
  const def = defaultPokemon("Heatran");
  const a = computeMoveResults(atk, def, defaultField());
  const b = computeMoveResults(atk, def, defaultField());
  assert.deepEqual(a, b);
  assert.ok(a[0].percent && a[0].percent[1] > 50, "Earthquake on Heatran should be heavy");
});

test("spread moves are reduced in Doubles", () => {
  const atk = defaultPokemon("Garchomp", ["Earthquake"]);
  const def = defaultPokemon("Heatran");
  const field = defaultField();
  const auto = computeMoveResults(atk, def, { ...field, spreadOverride: "spread" })[0].range![1];
  const single = computeMoveResults(atk, def, { ...field, spreadOverride: "single" })[0].range![1];
  assert.ok(auto < single, "spread damage must be lower than single-target damage");
});

// ---------------------------------------------------------------- combo ----
import * as COMBO from "../../src/lib/features/combo";
const combo = ((COMBO as any).summarizeCombo ? COMBO : (COMBO as any).default) as typeof COMBO;

test("combo: two hits, exact KO probability", () => {
  // Two hits of rolls {40,60} each vs 100 HP: sums 80,100,100,120 -> 3/4 KO.
  const hit = { rolls: [40, 60] };
  const r = combo.summarizeCombo([hit, hit], 100);
  assert.equal(r.koChance, 0.75);
  assert.equal(r.minDamage, 80);
  assert.equal(r.maxDamage, 120);
  assert.equal(r.guaranteedKo, false);
  assert.equal(r.survivesAlways, false);
});

test("combo: guaranteed and impossible cases", () => {
  assert.equal(combo.summarizeCombo([{ rolls: [60, 70] }, { rolls: [50, 55] }], 100).guaranteedKo, true);
  assert.equal(combo.summarizeCombo([{ rolls: [10, 20] }, { rolls: [10, 20] }], 100).survivesAlways, true);
  assert.equal(combo.summarizeCombo([], 100).koChance, 0);
});

test("combo: rollsFromRange keeps bounds", () => {
  const r = combo.rollsFromRange(30, 90);
  assert.equal(r.length, 16);
  assert.equal(r[0], 30);
  assert.equal(r[15], 90);
});

// ------------------------------------------------------- sides & partners ---
import * as CE from "../../src/lib/calc/calcEngine";
const ce = ((CE as any).swapSides ? CE : (CE as any).default) as typeof CE;

function strikers() {
  const a = defaultPokemon("Garchomp", ["Earthquake"]);
  a.ability = "Rough Skin";
  a.evs.atk = 252;
  const d = defaultPokemon("Heatran", ["Flash Cannon"]);
  d.ability = "Flash Fire";
  d.evs.spa = 252;
  return { a, d };
}

test("partner boosts: Helping Hand and Power Spot raise damage", () => {
  const { a, d } = strikers();
  const base = computeMoveResults(a, d, defaultField())[0].range![1];
  const hh = defaultField();
  hh.attackerSide.isHelpingHand = true;
  assert.ok(computeMoveResults(a, d, hh)[0].range![1] > base);
  const ps = defaultField();
  ps.attackerSide.isPowerSpot = true;
  assert.ok(computeMoveResults(a, d, ps)[0].range![1] > base);
});

test("Battery boosts special moves only", () => {
  const { a, d } = strikers();
  const f = defaultField();
  const physBase = computeMoveResults(a, d, f)[0].range![1];
  const spBase = computeMoveResults(d, a, f)[0].range![1];
  f.attackerSide.isBattery = true;
  assert.equal(computeMoveResults(a, d, f)[0].range![1], physBase);
  assert.ok(computeMoveResults(d, a, f)[0].range![1] > spBase);
});

test("swapSides: a defender-side Helping Hand boosts the defender's own attack", () => {
  const { a, d } = strikers();
  const f = defaultField();
  const plain = computeMoveResults(d, a, ce.swapSides(f))[0].range![1];
  f.defenderSide.isHelpingHand = true; // ticked under the DEFENDER card
  assert.ok(computeMoveResults(d, a, ce.swapSides(f))[0].range![1] > plain);
  // ...and it must not boost the attacker's move
  assert.equal(computeMoveResults(a, d, f)[0].range![1], computeMoveResults(a, d, defaultField())[0].range![1]);
});

// ------------------------------------------------------------- optimizer ---
import * as OPT from "../../src/lib/features/spreadOptimizer";
import { spToEv as spToEv2 } from "../../src/lib/champions/statPoints";
const opt = ((OPT as any).findSurviveSpreads ? OPT : (OPT as any).default) as typeof OPT;

test("optimizer: survive options really survive, and are minimal", () => {
  const { a } = strikers();
  a.moves = ["Earthquake", "", "", ""];
  a.nature = "Adamant";
  const def = defaultPokemon("Alakazam");
  const field = defaultField();
  const res = opt.findSurviveSpreads(a, def, field, "Earthquake", 1)!;
  assert.ok(res.options.length >= 2, "expects a real HP/Def trade-off");
  assert.ok(res.options.every((o) => o.total > 0));
  for (const o of res.options) {
    const test = { ...def, evs: { ...def.evs, hp: spToEv2(o.hpSp), def: spToEv2(o.defSp) } };
    const r = computeMoveResults(a, test, field, ["Earthquake"])[0];
    assert.ok(r.range![1] < computeStats(test).hp, `option ${o.hpSp}/${o.defSp} must survive`);
    // one point less Def must NOT survive (otherwise it wasn't minimal)
    if (o.defSp > 0) {
      const worse = { ...def, evs: { ...def.evs, hp: spToEv2(o.hpSp), def: spToEv2(o.defSp - 1) } };
      const rw = computeMoveResults(a, worse, field, ["Earthquake"])[0];
      assert.ok(rw.range![1] >= computeStats(worse).hp, "one less Def point should fail");
    }
  }
  assert.equal(res.defStat, "def");
});

test("optimizer: KO and speed searches are consistent with the calc", () => {
  const { a } = strikers();
  const def = defaultPokemon("Heatran");
  const ko = opt.findKoSpreads(a, def, defaultField(), "Earthquake", 0.5)!;
  const col = ko.columns.find((c) => c.minSp !== null);
  assert.ok(col, "some nature should reach a 50% KO");
  const test = { ...a, nature: col!.nature, evs: { ...a.evs, atk: spToEv2(col!.minSp!) } };
  const rolls = computeMoveResults(test, def, defaultField(), ["Earthquake"])[0].rolls!;
  assert.ok(rolls.filter((r) => r >= computeStats(def).hp).length / rolls.length >= 0.5);

  const me = defaultPokemon("Garchomp");
  const target = 150;
  for (const c of opt.findSpeedSpread(me, defaultField(), target)) {
    if (c.minSp === null) continue;
    const t = { ...me, nature: c.nature, evs: { ...me.evs, spe: spToEv2(c.minSp) } };
    assert.ok(computeStats(t, defaultField(), "attackerSide").spe > target);
    if (c.minSp > 0) {
      const t2 = { ...t, evs: { ...t.evs, spe: spToEv2(c.minSp - 1) } };
      assert.ok(computeStats(t2, defaultField(), "attackerSide").spe <= target);
    }
  }
});
