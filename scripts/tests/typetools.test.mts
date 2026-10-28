/* eslint-disable @typescript-eslint/no-explicit-any -- tsx exposes CJS named exports under `default` */
import test from "node:test";
import assert from "node:assert/strict";
import * as TT from "../../src/lib/champions/typeTools";
import * as PS from "../../src/lib/champions/pokedexSearch";
import * as DA from "../../src/lib/champions/data";

// tsx exposes CJS modules under `default` for named imports in .mts files.
const typeTools = ((TT as any).defensiveGroups ? TT : (TT as any).default) as typeof TT;
const search = ((PS as any).runSearch ? PS : (PS as any).default) as typeof PS;
const data = ((DA as any).getAllSpecies ? DA : (DA as any).default) as typeof DA;

test("Fire/Flying defensive table", () => {
  const groups = typeTools.defensiveGroups(["Fire", "Flying"]);
  const of = (m: number) => groups.find((g) => g.mult === m)?.types ?? [];
  assert.deepEqual(of(4), ["Rock"]);
  assert.ok(of(0).includes("Ground"));
  assert.ok(of(0.25).includes("Bug") || of(0.25).includes("Grass"));
});

test("coverage grid: Fire/Ground/Ice", () => {
  const grid = typeTools.coverageGrid(["Fire", "Ground", "Ice"]);
  const cls = (t: string) => grid.find((g) => g.defender === t)!.cls;
  assert.equal(cls("Steel"), "super");
  assert.equal(cls("Dragon"), "super");
  assert.equal(cls("Water"), "neutral");
});

test("fill suggestions never repeat selected types and are sorted", () => {
  const atk = ["Fire", "Ground", "Ice"];
  const un = typeTools.uncoveredSpecies(atk);
  const sug = typeTools.fillSuggestions(atk, un);
  assert.ok(sug.every((s) => !atk.includes(s.type)));
  for (let i = 1; i < sug.length; i++) assert.ok(sug[i - 1].newlyCovered >= sug[i].newlyCovered);
  // every uncovered species really is not hit super effectively
  assert.ok(un.every((s) => atk.every((a) => (s.chart[a] ?? 1) < 2)));
});

test("species with exact dual typing", () => {
  const list = typeTools.speciesWithTyping(["Fire", "Flying"], true);
  assert.ok(list.length > 0);
  assert.ok(list.every((s) => s.types.length === 2 && s.types.includes("Fire") && s.types.includes("Flying")));
});

test("search: filters combine and give reasons", () => {
  const f = { ...search.defaultFilters(), types: ["Dragon", "Ground"], typeMode: "exact" as const };
  const res = search.runSearch(f, null);
  assert.ok(res.some((r) => r.info.name === "Garchomp"));
  assert.ok(res.every((r) => r.reasons.some((x) => x.kind === "type")));
  const fast = { ...search.defaultFilters(), speedMin: 120 };
  assert.ok(search.runSearch(fast, null).every((r) => r.info.baseStats.spe >= 120));
});

test("search filters survive a share-link round trip", () => {
  const f = { ...search.defaultFilters(), types: ["Fire"], moves: ["Fake Out"], moveMode: "or" as const, speedMin: 90 };
  const back = search.decodeFilters(search.encodeFilters(f));
  assert.deepEqual(back, f);
  assert.equal(search.decodeFilters("not-base64!!"), null);
});

test("search by move uses the legal learnset index", async () => {
  const idx = await data.loadLearnsetIndex();
  const f = { ...search.defaultFilters(), moves: ["Sucker Punch"] };
  const res = search.runSearch(f, idx);
  assert.ok(res.some((r) => r.info.name === "Kingambit"));
});

test("resistantSpecies: everything listed resists every chosen type, immune implies zero damage", () => {
  const types = ["Fire", "Ground", "Ice"];
  const { resist, immune } = typeTools.resistantSpecies(types);
  for (const s of [...resist, ...immune]) for (const a of types) assert.ok((s.chart[a] ?? 1) <= 0.5, `${s.name} vs ${a}`);
  for (const s of immune) for (const a of types) assert.equal(s.chart[a], 0);
  assert.equal(typeTools.resistantSpecies([]).resist.length, 0);
});
