// Data integrity tests: run with `npm run test:data` (or `npm test`).
import test from "node:test";
import assert from "node:assert/strict";
import { META_SETS } from "../../src/lib/champions/metaSets";
import { getChampionsMoveset } from "../../src/lib/champions/moveset";
import { EXTRA_MOVES, REMOVED_MOVES } from "../../src/lib/champions/corrections";
import { getAllSpecies, getMoveInfo, getSpeciesInfo, allAbilitiesOf } from "../../src/lib/champions/data";
import { SPECIES_NAMES } from "../../src/lib/calc/gen";
import { CHAMPIONS_ITEM_NAMES, MEGA_STONES, NEW_MEGA_STONES } from "../../src/lib/champions/items";
import { getMegaStoneItem } from "../../src/lib/features/megaStoneLookup";

// Sourced sets kept on purpose for a species not yet defined in the app.
const DORMANT_SETS = new Set(["Scovillain-Mega"]);
const ALL_ITEMS = new Set([
  ...CHAMPIONS_ITEM_NAMES,
  ...MEGA_STONES.map((s) => s.item),
  ...NEW_MEGA_STONES.map((s) => s.item),
]);

test("every selectable species resolves with types and base stats", () => {
  for (const name of SPECIES_NAMES) {
    const info = getSpeciesInfo(name);
    assert.ok(info, `${name} does not resolve`);
    assert.ok(info.types.length >= 1 && info.types.length <= 2, `${name} types`);
    assert.ok(info.bst > 0, `${name} has no base stats`);
  }
});

test("Mega forms point at a real base species", () => {
  for (const s of getAllSpecies().filter((x) => x.isMega)) {
    assert.ok(getSpeciesInfo(s.baseSpecies), `${s.name} -> unknown base ${s.baseSpecies}`);
  }
});

test("corrections reference real species and real moves", () => {
  for (const table of [EXTRA_MOVES, REMOVED_MOVES]) {
    for (const [species, moves] of Object.entries(table)) {
      assert.ok(getSpeciesInfo(species), `corrections: unknown species ${species}`);
      for (const m of moves) assert.ok(getMoveInfo(m), `corrections: unknown move ${m}`);
    }
  }
});

test("curated meta sets only use legal species, moves, abilities and items", async () => {
  for (const [species, set] of Object.entries(META_SETS)) {
    if (DORMANT_SETS.has(species)) continue;
    const info = getSpeciesInfo(species);
    assert.ok(info, `meta set for unknown species ${species}`);
    const legal = await getChampionsMoveset(species);
    for (const mv of set.moves.filter(Boolean)) {
      assert.ok(getMoveInfo(mv), `${species}: "${mv}" is not a real move`);
      assert.ok(legal.has(mv), `${species}: "${mv}" is not in its Champions movepool`);
    }
    assert.ok(allAbilitiesOf(info).includes(set.ability), `${species}: ability "${set.ability}" not available`);
    if (set.item && !getMegaStoneItem(species)) {
      assert.ok(ALL_ITEMS.has(set.item), `${species}: unknown item "${set.item}"`);
    }
    const total = Object.values(set.sp).reduce((a, b) => a + (b ?? 0), 0);
    assert.ok(total <= 66, `${species}: ${total} Stat Points exceeds the 66 budget`);
    for (const v of Object.values(set.sp)) assert.ok((v ?? 0) <= 32, `${species}: a stat exceeds 32 SP`);
  }
});

test("Kingambit keeps Sucker Punch despite the upstream data gap", async () => {
  const moves = await getChampionsMoveset("Kingambit");
  assert.ok(moves.has("Sucker Punch"));
});

test("unknown species names are rejected, real ones accepted", () => {
  assert.equal(getSpeciesInfo("NotAPokemon"), null);
  assert.equal(getSpeciesInfo(""), null);
  assert.equal(getSpeciesInfo("Garchomp")?.name, "Garchomp");
  assert.equal(getSpeciesInfo("Garchomp-Mega")?.isMega, true);
});
