"use client";

import { useNav } from "@/lib/app/nav";
import { useLocale } from "@/lib/i18n/LocaleContext";
import { toFrench } from "@/lib/champions/gameTranslations";

export type NameKind = "species" | "move" | "ability" | "item";

/** The display name of a game entity in the current UI language. */
export function useDisplayName() {
  const { locale } = useLocale();
  return (kind: NameKind, name: string) => (locale === "fr" ? toFrench(kind, name) : name);
}

/** A clickable game name: Pokémon open their sheet, moves/abilities/items open
 * their entry in the database. Used everywhere so the whole site cross-links. */
export default function NameLink({
  kind,
  name,
  className = "",
  title,
}: {
  kind: NameKind;
  name: string;
  className?: string;
  title?: string;
}) {
  const nav = useNav();
  const display = useDisplayName();
  const go = () => {
    if (kind === "species") nav.openSpecies(name);
    else nav.openDatabase(kind === "move" ? "moves" : kind === "ability" ? "abilities" : "items", name);
  };
  return (
    <button
      type="button"
      onClick={go}
      title={title ?? name}
      className={`text-left font-semibold hover:underline ${className}`}
      style={{ color: "var(--color-ink-bright)" }}
    >
      {display(kind, name)}
    </button>
  );
}
