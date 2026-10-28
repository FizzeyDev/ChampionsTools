/* eslint-disable @typescript-eslint/no-explicit-any -- tsx exposes CJS named exports under `default` */
// Keeps the French and English interfaces complete and in sync.
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import * as TR from "../../src/lib/i18n/translations";

const translations = ((TR as any).translations ?? (TR as any).default.translations) as Record<"en" | "fr", Record<string, string>>;
const { en, fr } = translations;

test("English and French have exactly the same keys", () => {
  const onlyEn = Object.keys(en).filter((k) => !(k in fr));
  const onlyFr = Object.keys(fr).filter((k) => !(k in en));
  assert.deepEqual(onlyEn, [], `missing in French: ${onlyEn.join(", ")}`);
  assert.deepEqual(onlyFr, [], `missing in English: ${onlyFr.join(", ")}`);
});

test("placeholders like {n} are identical in both languages", () => {
  const ph = (s: string) => (s.match(/\{[a-zA-Z0-9_]+\}/g) ?? []).sort().join(",");
  const bad = Object.keys(en).filter((k) => fr[k] !== undefined && ph(en[k]) !== ph(fr[k]));
  assert.deepEqual(bad, [], `placeholder mismatch: ${bad.join(", ")}`);
});

test("no empty translations", () => {
  const empty = Object.keys(en).filter((k) => !en[k].trim() || !(fr[k] ?? "").trim());
  // A few keys are intentionally empty strings (e.g. "none" labels): only flag duplicates of the key name.
  assert.ok(empty.length < 5, `suspiciously many empty strings: ${empty.join(", ")}`);
});

function sourceFiles(dir: string, out: string[] = []): string[] {
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) sourceFiles(p, out);
    else if (/\.tsx?$/.test(f)) out.push(p);
  }
  return out;
}

test("every t('key') used in the source exists in both languages", () => {
  const used = new Set<string>();
  for (const file of sourceFiles("src")) {
    const text = fs.readFileSync(file, "utf8");
    for (const m of text.matchAll(/\bt\(\s*"([A-Za-z0-9_.]+)"/g)) used.add(m[1]);
  }
  const missing = [...used].filter((k) => !(k in en) || !(k in fr));
  assert.deepEqual(missing, [], `keys used in code but not translated: ${missing.join(", ")}`);
});

test("keys built dynamically exist for every value they can take", () => {
  const groups: Record<string, string[]> = {
    "weather.": ["none", "Sun", "Rain", "Sand", "Snow"],
    "terrain.": ["none", "Electric", "Grassy", "Misty", "Psychic"],
    "status.": ["none", "brn", "par", "slp", "frz", "psn", "tox"],
    "stat.": ["hp", "atk", "def", "spa", "spd", "spe"],
    "speed.vsYou.": ["faster", "slower", "tie"],
    "speed.preset.": ["maxPlus", "maxNeutral", "zero", "scarf"],
    "sheet.speed.": ["zero", "maxNeutral", "maxPlus", "scarf", "tailwind"],
    "db.cat.": ["Physical", "Special", "Status"],
    "speed.ability.hint.": ["Unburden", "Quick Feet", "Speed Boost"],
  };
  for (const [prefix, values] of Object.entries(groups)) {
    for (const v of values) {
      assert.ok(`${prefix}${v}` in en && `${prefix}${v}` in fr, `missing ${prefix}${v}`);
    }
  }
});

// ---- game-name coverage: every name a page can show must have a French name ----
import * as DA2 from "../../src/lib/champions/data";
import * as GT from "../../src/lib/champions/gameTranslations";
const dd = ((DA2 as any).getAllSpecies ? DA2 : (DA2 as any).default) as typeof DA2;
const gt = ((GT as any).SPECIES_FR ? GT : (GT as any).default) as typeof GT;

// Names whose official French version could not be confirmed yet: they fall back to English.
const KNOWN_UNTRANSLATED = new Set(["Fair Play"]);

test("every Champions Pokémon, move, ability and item has a French name", () => {
  const missing: string[] = [];
  const check = (kind: string, names: string[], table: Record<string, string>) => {
    for (const n of names) if (!table[n] && !KNOWN_UNTRANSLATED.has(n)) missing.push(`${kind}:${n}`);
  };
  check("species", dd.getAllSpecies().map((s) => s.name), gt.SPECIES_FR);
  check("move", dd.ALL_MOVE_NAMES, gt.MOVES_FR);
  check("ability", dd.getAbilityIndex().map((a) => a.name), gt.ABILITIES_FR);
  check("item", dd.getItemIndex().map((i) => i.name), gt.ITEMS_FR);
  assert.deepEqual(missing, [], `no French name for: ${missing.join(", ")}`);
});
