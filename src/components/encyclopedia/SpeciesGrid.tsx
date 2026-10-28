"use client";

import { useState } from "react";
import { pokemonSpriteUrl } from "@/lib/app/sprites";
import { useLocale } from "@/lib/i18n/LocaleContext";
import NameLink from "../ui/NameLink";

/** A grid of clickable Pokémon, each with its sprite. Shared by the database,
 * the type tools and anywhere a list of species is shown. */
export default function SpeciesGrid({
  names,
  limit = 60,
  empty,
  scroll = false,
}: {
  names: string[];
  limit?: number;
  empty?: string;
  /** Cap the height and scroll instead of paging with "show more". */
  scroll?: boolean;
}) {
  const { t } = useLocale();
  const [all, setAll] = useState(false);
  if (names.length === 0)
    return empty ? (
      <p className="text-xs" style={{ color: "var(--color-ink-dim)" }}>
        {empty}
      </p>
    ) : null;
  const list = scroll || all ? names : names.slice(0, limit);
  return (
    <>
      <div
        className={`grid grid-cols-2 gap-x-3 gap-y-1.5 sm:grid-cols-3 xl:grid-cols-4 ${scroll ? "max-h-96 overflow-y-auto pr-1" : ""}`}
      >
        {list.map((n) => {
          const art = pokemonSpriteUrl(n, true);
          return (
            <div key={n} className="flex items-center gap-1.5 text-sm">
              {art ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={art} alt="" loading="lazy" className="h-8 w-8 shrink-0 object-contain" />
              ) : (
                <span className="h-8 w-8 shrink-0" />
              )}
              <NameLink kind="species" name={n} className="truncate" />
            </div>
          );
        })}
      </div>
      {!scroll && names.length > limit && !all && (
        <button type="button" className="pill-btn mt-2" onClick={() => setAll(true)}>
          {t("pokedex.showMore")} ({names.length - limit})
        </button>
      )}
    </>
  );
}
