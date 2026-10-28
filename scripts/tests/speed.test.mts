import test from "node:test";
import assert from "node:assert/strict";
import { computeRowSpeed, defaultRowConfig, resolveRow, defaultGlobal } from "../../src/lib/features/speedComparator";

const ctx = (patch = {}) => ({ ...defaultGlobal(), ...patch });

test("plain speed: Garchomp 32 SP Jolly", () => {
  const cfg = { ...defaultRowConfig("Garchomp"), sp: 32, natureMod: "boost" as const };
  assert.equal(computeRowSpeed(resolveRow(cfg, "opp", ctx())), 169);
});

test("Choice Scarf is x1.5, Tailwind is x2", () => {
  const base = { ...defaultRowConfig("Garchomp"), sp: 32, natureMod: "boost" as const };
  assert.equal(computeRowSpeed(resolveRow({ ...base, scarf: true }, "opp", ctx())), Math.floor(169 * 1.5));
  assert.equal(computeRowSpeed(resolveRow({ ...base, tailwind: true }, "opp", ctx())), 338);
});

test("weather speed abilities double speed only in their weather (auto)", () => {
  const cfg = { ...defaultRowConfig("Basculegion"), sp: 32 };
  const dry = computeRowSpeed(resolveRow(cfg, "opp", ctx()));
  const rain = computeRowSpeed(resolveRow(cfg, "opp", ctx({ weather: "Rain" })));
  const sun = computeRowSpeed(resolveRow(cfg, "opp", ctx({ weather: "Sun" })));
  assert.equal(rain, dry * 2);
  assert.equal(sun, dry);
});

test("Slush Rush (Chasse-Neige) doubles speed in Snow", () => {
  const cfg = { ...defaultRowConfig("Beartic"), sp: 0 };
  const dry = computeRowSpeed(resolveRow(cfg, "opp", ctx()));
  assert.equal(computeRowSpeed(resolveRow(cfg, "opp", ctx({ weather: "Snow" }))), dry * 2);
});

test("global scope: context applies only to the chosen side", () => {
  const cfg = { ...defaultRowConfig("Garchomp"), sp: 32 };
  const only = ctx({ tailwind: true, contextScope: "opp" as const });
  assert.equal(computeRowSpeed(resolveRow(cfg, "mine", only)), computeRowSpeed(resolveRow(cfg, "mine", ctx())));
  assert.equal(computeRowSpeed(resolveRow(cfg, "opp", only)), computeRowSpeed(resolveRow(cfg, "opp", ctx())) * 2);
});

test("global reference spread applies unless the row overrides that field", () => {
  const spread = ctx({ spreadScope: "all" as const, spread: { sp: 32, natureMod: "boost" as const, stage: null, scarf: null, paralysis: null } });
  const plain = defaultRowConfig("Garchomp");
  assert.equal(computeRowSpeed(resolveRow(plain, "opp", spread)), 169);
  const edited = { ...plain, sp: 0, overrides: { sp: true } };
  assert.ok(computeRowSpeed(resolveRow(edited, "opp", spread)) < 169);
});
