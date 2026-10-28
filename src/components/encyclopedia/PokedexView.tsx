"use client";

import { useMemo, useState } from "react";
import { getAllSpecies, type SpeciesInfo } from "@/lib/champions/data";
import { matchesBilingual } from "@/lib/champions/gameTranslations";
import { STAT_KEYS, type StatKey } from "@/lib/calc/gen";
import { pokemonSpriteUrl } from "@/lib/app/sprites";
import { useLocale } from "@/lib/i18n/LocaleContext";
import { useNav } from "@/lib/app/nav";
import TypeBadge from "../ui/TypeBadge";
import TypeChips from "../ui/TypeChips";
import { useDisplayName } from "../ui/NameLink";

type SortKey = "num" | "name" | "bst" | StatKey;
const PAGE = 48;

export default function PokedexView() {
  const { t } = useLocale();
  const { openSpecies, goView } = useNav();
  const display = useDisplayName();
  const [text, setText] = useState("");
  const [types, setTypes] = useState<string[]>([]);
  const [sort, setSort] = useState<SortKey>("num");
  const [hideMegas, setHideMegas] = useState(false);
  const [shown, setShown] = useState(PAGE);

  const list = useMemo(() => {
    const all = getAllSpecies().filter(
      (s) =>
        (!hideMegas || !s.isMega) &&
        matchesBilingual("species", s.name, text) &&
        types.every((ty) => s.types.includes(ty))
    );
    const val = (s: SpeciesInfo) => (sort === "num" ? s.num : sort === "bst" ? s.bst : sort === "name" ? 0 : s.baseStats[sort]);
    return all.sort((a, b) =>
      sort === "name"
        ? display("species", a.name).localeCompare(display("species", b.name))
        : sort === "num"
          ? val(a) - val(b) || a.name.localeCompare(b.name)
          : val(b) - val(a) || a.name.localeCompare(b.name)
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, types, sort, hideMegas]);

  const reset = () => setShown(PAGE);

  return (
    <div className="flex flex-col gap-4">
      <div className="card-shell p-4">
        <div className="mb-1 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="heading text-xl" style={{ color: "var(--color-ink-bright)" }}>
              {t("pokedex.title")}
            </h2>
            <p className="text-xs" style={{ color: "var(--color-ink-dim)" }}>
              {t("pokedex.subtitle")}
            </p>
          </div>
          <button type="button" className="pill-btn" onClick={() => goView("search")}>
            🔎 {t("pokedex.toSearch")}
          </button>
        </div>

        <div className="mt-3 flex flex-wrap items-end gap-3">
          <label className="flex min-w-[12rem] flex-1 flex-col gap-1">
            <span className="eyebrow">{t("pokedex.name")}</span>
            <input
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                reset();
              }}
              placeholder={t("pokedex.namePlaceholder")}
              className="field-input px-2 py-1.5 text-sm"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="eyebrow">{t("pokedex.sort")}</span>
            <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)} className="field-input px-2 py-1.5 text-sm">
              <option value="num">{t("pokedex.sort.num")}</option>
              <option value="name">{t("pokedex.sort.name")}</option>
              <option value="bst">BST</option>
              {STAT_KEYS.map((k) => (
                <option key={k} value={k}>
                  {t(`stat.${k}`)}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2 pb-1.5 text-sm" style={{ color: "var(--color-ink-soft)" }}>
            <input type="checkbox" className="field-checkbox" checked={hideMegas} onChange={(e) => setHideMegas(e.target.checked)} />
            {t("pokedex.hideMegas")}
          </label>
        </div>
        <div className="mt-3">
          <TypeChips
            value={types}
            onChange={(v) => {
              setTypes(v);
              reset();
            }}
            max={2}
          />
        </div>
        <p className="mt-3 text-xs" style={{ color: "var(--color-ink-dim)" }}>
          {t("pokedex.count").replace("{n}", String(list.length))}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {list.slice(0, shown).map((s) => {
          const art = pokemonSpriteUrl(s.name, true);
          return (
            <button
              key={s.name}
              type="button"
              onClick={() => openSpecies(s.name)}
              className="card-shell flex items-center gap-3 p-3 text-left transition-transform hover:-translate-y-0.5"
            >
              {art && <img src={art} alt="" className="h-14 w-14 shrink-0 object-contain" />}
              <div className="min-w-0 flex-1">
                <p className="tabular text-[10px]" style={{ color: "var(--color-ink-dim)" }}>
                  #{s.num}
                  {s.isMega && " · Mega"}
                </p>
                <p className="truncate text-sm font-bold" style={{ color: "var(--color-ink-bright)" }}>
                  {display("species", s.name)}
                </p>
                <div className="mt-1 flex flex-wrap gap-1">
                  {s.types.map((ty) => (
                    <TypeBadge key={ty} type={ty} size="sm" />
                  ))}
                </div>
              </div>
              <div className="tabular shrink-0 text-right text-[10px]" style={{ color: "var(--color-ink-soft)" }}>
                <p className="text-sm font-extrabold" style={{ color: "var(--color-league)" }}>
                  {s.bst}
                </p>
                <p>
                  {t("stat.spe")} {s.baseStats.spe}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {shown < list.length && (
        <div className="text-center">
          <button type="button" className="pill-btn" onClick={() => setShown((n) => n + PAGE)}>
            {t("pokedex.showMore")} ({list.length - shown})
          </button>
        </div>
      )}
      {list.length === 0 && (
        <p className="text-center text-sm" style={{ color: "var(--color-ink-dim)" }}>
          {t("search.noResult")}
        </p>
      )}
    </div>
  );
}
