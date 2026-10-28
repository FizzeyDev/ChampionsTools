"use client";

import { createContext, useContext } from "react";

export type View =
  | "calculator"
  | "teamCoverage"
  | "changelog"
  | "pokedex"
  | "search"
  | "database"
  | "types"
  | "optimizer"
  | "settings";

export type DbTab = "moves" | "abilities" | "items";

export interface NavValue {
  /** Species whose detail sheet is open (null = closed). */
  sheetSpecies: string | null;
  openSpecies: (species: string) => void;
  closeSheet: () => void;
  goView: (view: View) => void;
  /** Jump to the Moves/Abilities/Items database with one entry selected. */
  openDatabase: (tab: DbTab, name: string) => void;
  /** The pending database selection (consumed by DatabaseView). */
  dbTarget: { tab: DbTab; name: string } | null;
}

const noop = () => {};

export const NavContext = createContext<NavValue>({
  sheetSpecies: null,
  openSpecies: noop,
  closeSheet: noop,
  goView: noop,
  openDatabase: noop,
  dbTarget: null,
});

export function useNav(): NavValue {
  return useContext(NavContext);
}
