# Champions Calc

A damage calculator for **Pokémon Champions**, built on Smogon's official
calculation engine (`@smogon/calc`) with a full Champions-specific data and
UI layer on top of it.

**Live site: [fizzeydev.github.io/ChampionsTools](https://fizzeydev.github.io/ChampionsTools/)**

## Getting started

```bash
npm install
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000).

## Stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript** — 100% client-side, no backend
- **Tailwind CSS v4** for styling
- **[@smogon/calc](https://github.com/smogon/damage-calc)** — the actual damage calculation engine (see Credits)
- **[@pkmn/dex](https://github.com/pkmn/ps) / @pkmn/data** — Gen 9 species/move/ability/nature data, used as the base layer Champions data is built on top of

## Modes

- **1 vs 1** — the classic calculator: two Pokémon, damage both ways
- **1 vs All** — one Pokémon against a full team (paste a Showdown-format team or build it manually)
- **All vs 1** — a full team against one Pokémon
- **All vs All** — two full teams, a clickable matchup matrix showing each attacker's best move against each defender, color-coded by damage tier
- **Best Moves** — pick two Pokémon (with real EVs, boosts, item, nature) and see every move in their **entire real movepool** ranked by damage, not just 4 hand-picked moves. Ability is restricted to the Pokémon's actual abilities in this mode; item stays free.
- **Speed Tiers** — compare a Pokémon's Speed against the 5/10/20 closest (or fastest overall) other Pokémon in the dex, with per-entry Stat Points, stage, nature (+/-Speed), Choice Scarf, and Tailwind toggles, plus a Trick Room view that flips the sort order. Choice Scarf is automatically disabled for Megas, since they can't hold anything but their Mega Stone.

Team-mode rosters (1 vs All / All vs 1 / All vs All) are capped to **3 Pokémon in Singles, 4 in Doubles** — Champions matches are never 6v6, even though you build a roster of 6 beforehand. The cap follows the Format selector in the Field panel automatically.

## What's Champions-specific here

This isn't a reskinned Gen 9 VGC calculator — most of the data was individually
verified against Serebii's Champions Pokédex and item pages rather than
assumed from the base Gen 9 dex.

### Pokédex

Only the Pokémon actually obtainable in Champions are selectable —
`src/lib/champions/pokedex.ts` holds the exact roster, cross-checked against
the game's own Pokédex listing rather than the full ~1000-species national
dex. Two "Past"-tagged data-layer bugs were found and fixed along the way:
`@pkmn/dex` silently drops dozens of species (Absol, Alakazam, Beedrill...)
and every Mega Stone item from its Gen 9-filtered views since they're not
part of Scarlet/Violet's own regional dex — both now fall back to the raw,
unfiltered dex so they resolve correctly everywhere (species lookups,
sprites, movesets, and — critically — the damage calc itself, which would
otherwise throw on any Mega holding its own stone).

### Stat Points, not EVs

Champions replaces EVs with a **Stat Points** system: 0–32 per stat, 66-point
budget, official conversion formula (`4 + 8×(SP-1)`). IVs are fixed at 31
across the board — there's no breeding or Hyper Training in Champions, so the
IV field doesn't exist in the UI at all. See `src/lib/champions/statPoints.ts`.

### Items — exact pool, categorized

`src/lib/champions/items.ts` holds Champions' real item pool (166 items —
matches the officially-cited "166 authorized held items" figure), not the
larger modern VGC pool. Items are split into Hold Items / Mega Stones /
Berries, with a finer set of quick-filter tabs (Recovery / Power Boost /
Stat Boost / Effect Extend / Mega Stones / Berries) in the picker, matching
the game's own item menu categories.

### Mega Evolution

All official Mega Stones (`serebii.net/pokemonchampions/items.shtml`) have a
matching implementation in `src/lib/champions/megaSpecies.ts` — both the
classic Gen 6/7 Megas (stats pulled straight from `@pkmn/dex`, since those
never change) and the newer Champions-exclusive ones introduced with
Pokémon Legends: Z-A, verified stat-by-stat against Serebii's Champions stat
rankings rather than guessed.

A few species (Absol, Garchomp, Lucario) have **two** separate Mega forms —
a classic one and a new "Z" variant — each with its own distinct stone,
stats, and ability. Selecting a Mega in the species picker auto-equips its
exact stone and locks the item field (you can't accidentally hold the wrong
stone); the ability field stays editable on purpose, since people like
testing off-meta abilities on Megas.

### Auto-fill on species select

Picking a species fills in its item/ability/nature/Stat Points/moveset from
a **real competitive set** when one exists for it (`src/lib/champions/metaSets.ts`
— curated from Pikalytics' live Champions usage stats and real tournament
results, not guessed), so meta-relevant Pokémon start from something
actually playable rather than a blank slate. For the many Pokémon that
aren't part of the competitive meta, it falls back to their first real
ability and the first four moves (alphabetically) from their actual
Gen 9/Champions-era movepool instead of leaving everything empty. Either
way, the ability and move pickers also show the Pokémon's real options
highlighted at the top of the list, separate from the full 300+/900+ option
lists, and species with a curated real set are marked with a small star in
the picker.

### Field mechanics

Hazards (Stealth Rock, Spikes), screens, Leech Seed, Salt Cure, Foresight,
Magic Room / Wonder Room, all four Ruin abilities, and the usual crit /
ability-triggered / allies-fainted toggles — modeled symmetrically on both
sides of the field (either Pokémon can be the one behind Stealth Rock),
matching how Smogon's own calculator treats it. Checking "ability triggered"
for a weather/terrain-setting ability (Drought, Drizzle, Electric Surge...)
auto-turns on the matching Field weather/terrain — but only if nothing else
has already set a different one, and unchecking it only reverts the field
if it still matches exactly what that ability would have set, so it never
clobbers an unrelated setup (`src/lib/features/abilityFieldSync.ts`).

### Minimum-investment reverse calc

Select any damaging move's result to see two extra lines: the minimum Stat
Points the defender needs in Def/SpD to guarantee surviving that exact hit,
and the minimum Stat Points the attacker needs in Atk/SpA to guarantee the
OHKO — everything else on both sides held fixed. See
`src/lib/features/reverseCalc.ts`.

### French translation & bilingual search

The whole interface, plus every Pokémon/move/item/ability/nature/type name,
has an official French translation — sourced in bulk from PokeAPI's own
localization data rather than typed by hand. Search works in either language
regardless of the site's current UI language (typing "Sarmurai" finds
Golisopod even in the English interface, accents optional), so you don't
need to know which language a name is in to find it. The handful of
Champions-exclusive Mega forms and stones that never existed in any
released, localized game don't have an official translation to source —
those follow the same naming pattern every real Mega uses ("Méga-Dracaufeu
X" → "Méga-[name] [suffix]"), clearly marked as best-effort in
`src/lib/champions/gameTranslations.ts` rather than presented as verified.

## Other features

- **EN / FR** interface, switchable at any time, persisted locally
- **Save Pokémon builds** to the browser (name them, recall them later, assign to either side) — `src/lib/features/savedPokemon.ts`
- **Import/export** single sets or full teams in Showdown's plain-text format
- **Shareable links** — the whole battle state round-trips through a URL
- A free-text notes panel (bottom of the Field column) for scratch strategy notes, saved to the browser as you type
- Type effectiveness chart per Pokémon (×4 down to ×0)
- Per-hit damage breakdown on multi-hit moves (Smogon's own calculator only shows the combined range)
- Custom-styled checkboxes and search inputs that open the mobile keyboard properly (plain `<input>`, no custom widget)

## Sprites

Pokémon and item artwork comes from the
[PokeAPI sprites repo](https://github.com/PokeAPI/sprites). Two wrinkles,
both handled in `src/lib/features/spriteOverrides.ts`:

- **Mega forms and a few regional forms** share their base species' national
  dex number, which would otherwise point at the wrong artwork. Each Mega's
  actual unique PokeAPI id was looked up individually via the
  `pokemon-species` → `varieties` API rather than guessed.
- **Champions-exclusive items** (most Mega Stones, a couple of newer hold
  items) have no artwork in PokeAPI at all yet, since they never existed in
  a mainline game before. For those, the app first checks
  `public/custom-sprites/items/<kebab-case-name>.png` before falling back to
  the CDN — drop a PNG there with the right filename and it's picked up
  automatically, no code changes needed. The exact list of expected
  filenames lives in that folder's own README.

## What's intentionally out of scope

- **Terastallization** — present in the game files but disabled under the
  current ruleset (Reg M-A/M-C). The toggle stays in the UI in case a future
  regulation re-enables it.
- **Multi-generation support** — Gen 9 only, since that's what Champions is
  built on. No RBY-through-SV era selector.
- A handful of Mega abilities/stats that don't have a confirmed source yet
  remain unverified best-effort placeholders — check the comments at the top
  of `megaSpecies.ts` for the current list. Mega Scovillain in particular
  still has no sourced stats at all.
- Most curated meta sets (`metaSets.ts`) have sourced item/ability/nature/
  moves but a role-based default Stat Point spread rather than the exact
  usage-leading numbers — each entry's `spConfirmed` flag says which is
  which.

## Adding new data

The game gets updated periodically (new regulations add Pokémon, Megas, and
items). To add something new:

- **A Pokémon**: add its exact name to `CHAMPIONS_POKEDEX_RAW` in
  `src/lib/champions/pokedex.ts` (must match `@pkmn/dex`'s naming, e.g.
  `"Mr. Rime"`, `"Kommo-o"`). The array is deduped automatically, so a
  duplicate entry won't break anything, just don't rely on that.
- **A Mega**: push a new entry onto `megaDefs` in
  `src/lib/champions/megaSpecies.ts` — species name, types, base stats
  (not level-50 calculated stats), and ability. Source stats from
  `serebii.net/pokedex-champions/<name>/` or the stat-ranking pages under
  `serebii.net/pokedex-champions/stat/`. Nothing else needs touching —
  sprites, the type chart, movesets, and the calc engine all pick it up
  automatically.
- **An item**: add it to the right array in `src/lib/champions/items.ts`
  (`HOLD_ITEMS`, `MEGA_STONES`/`NEW_MEGA_STONES`, or `BERRIES`). If its
  sprite 404s, add its kebab-case name to `MISSING_ITEM_SPRITES` in
  `src/lib/features/spriteOverrides.ts` and drop a PNG in
  `public/custom-sprites/items/`.
- **A meta set**: add an entry to `META_SETS` in `src/lib/champions/metaSets.ts`
  with the item/ability/nature/moves and, if you have the exact numbers, the
  Stat Point spread (set `spConfirmed: true` only when the spread itself is
  sourced, not guessed).
- **A translation**: `src/lib/champions/gameTranslations.ts` is generated in
  bulk from PokeAPI's CSV data rather than edited by hand — if a name is
  missing or wrong, it's usually faster to re-run the extraction than to
  patch one entry.

## Project structure

```
src/
  lib/
    gen.ts                     # Gen 9 generation instance, sorted option lists
    types.ts                   # Pokémon/Field state shapes, defaults
    calcEngine.ts               # builds Pokemon/Move/Field, runs the calc
    natures.ts                   # nature stat boost/drop table
    sprites.ts                    # sprite URL helpers (species, items, types)
    typeChart.ts                   # weakness/resistance computation
    shareLink.ts                    # encode/decode state into a URL
    showdownSet.ts                   # Showdown set/team import & export
    champions/                        # Champions-specific game data
      items.ts                          # exact item pool, categorized
      itemCategories.ts                   # item menu-tab categorization
      megaSpecies.ts                        # Mega Evolution data layer
      pokedex.ts                             # exact obtainable species list
      statPoints.ts                            # Stat Points <-> EV conversion
      baseStats.ts                              # base stat lookups
      moveset.ts                                 # real Gen 9 movepool lookups
      metaSets.ts                                 # curated real competitive sets
      descriptions.ts                              # official move/ability/item text
      gameTranslations.ts                           # EN<->FR name data + bilingual search
    features/                                    # reusable app-level tools
      savedPokemon.ts                              # localStorage save/load
      notes.ts                                       # scratchpad persistence
      speciesAbilities.ts                             # real-ability lookups
      megaStoneLookup.ts                               # Mega -> exact stone
      autofillSpecies.ts                                # species-select autofill
      bestMoves.ts                                       # full-movepool damage scan
      reverseCalc.ts                                      # min-investment calc
      speedComparator.ts                                   # Speed Tiers logic
      abilityFieldSync.ts                                   # weather/terrain auto-sync
      spriteOverrides.ts                                     # sprite ID/alias fixes
  components/
    IconSearchSelect.tsx        # searchable combobox (icons, groups, highlighting, bilingual search)
    StatRow.tsx                  # one stat's SP slider + base/total readout
    PokemonCard.tsx                # attacker/defender panel
    TeamRoster.tsx                  # team import + roster editor
    AllVsAllMatrix.tsx               # team-vs-team matchup grid
    SpeedComparator.tsx               # Speed Tiers panel
    SpeedTierRow.tsx                   # one Speed Tiers comparison row
    FieldBar.tsx                        # weather/terrain/hazards/screens/Ruin
    NotesPanel.tsx                        # inline scratchpad
    ResultPanel.tsx                        # move list + click-to-expand detail
    ResultRow.tsx                           # Showdown-style result line + rolls + reverse calc
    TypeChart.tsx                            # weakness/resistance display
    SavedPokemonModal.tsx                      # saved-builds browser
  app/
    page.tsx                                    # assembles everything, mode switching
    layout.tsx                                   # locale provider, page shell
  i18n/
    translations.ts                               # EN/FR UI strings
    LocaleContext.tsx                              # locale state + t() hook
```

## Credits

The actual damage math — every stat formula, ability interaction, item
effect, and field mechanic — comes from
**[Smogon's `@smogon/calc`](https://github.com/smogon/damage-calc)**
(MIT licensed), the same engine behind Smogon's own online damage
calculator. This project only adds the Champions-specific data layer and UI
on top of it; none of the underlying battle mechanics were reimplemented
from scratch. Species/move/ability/nature data comes from
[`@pkmn/dex`](https://github.com/pkmn/ps) (also MIT); French name
translations are sourced in bulk from [PokeAPI](https://pokeapi.co)'s own
localization data; sprite artwork from the
[PokeAPI sprites repo](https://github.com/PokeAPI/sprites); curated
competitive sets from [Pikalytics](https://www.pikalytics.com)' Champions
usage statistics. This project is a fan-made tool, not affiliated with
Smogon, PokeAPI, Pikalytics, Game Freak, Nintendo, or The Pokémon Company.