// Manual corrections layered on top of @pkmn/dex's bundled learnset data.
//
// The upstream data is great but not perfect: some well-documented movepool
// entries are simply missing (e.g. its Kingambit entry has no Sucker Punch at
// all), and a handful of moves that exist in the dex aren't usable in
// Pokémon Champions. Rather than silently trusting the library, every known
// deviation lives in this one reviewable file, keyed by the species' BASE
// name (Mega forms use their base species' movepool).
//
// How to add one: confirm the move on a second source (Serebii's Champions
// Pokédex, in-game), add it here with a short comment saying where it was
// verified, and run `npm run test:data` - the data tests make sure the move
// and species names are spelled exactly like the dex.

/** Moves a species can really use in Champions but that the dex data lacks. */
export const EXTRA_MOVES: Record<string, string[]> = {
  // Verified: Kingambit learns Sucker Punch (its signature set move) - the
  // bundled dex learnset has no entry for it at all.
  Kingambit: ["Sucker Punch"],
  // Verified: Aegislash's signature set uses King's Shield in Champions, but
  // the move is hidden from the Gen 9 dex ("Past"), see RESTORED_MOVES below.
  Aegislash: ["King's Shield"],
};

/** Moves present in the dex learnset that Champions does NOT allow. */
export const REMOVED_MOVES: Record<string, string[]> = {};

/** Moves that are usable in Champions but flagged "Past" (hidden) in the
 * Gen 9 dex, so they would otherwise never show up in any move picker or
 * search. They are looked up in the raw, unfiltered dex instead. */
export const RESTORED_MOVES: string[] = ["King's Shield"];
