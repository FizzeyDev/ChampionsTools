"use client";

import { useEffect, useMemo, useState } from "react";
import { pokemonSpriteUrl } from "@/lib/app/sprites";
import { useLocale } from "@/lib/i18n/LocaleContext";
import { STAT_KEYS, type StatKey } from "@/lib/calc/gen";
import { getMoveInfo, getSpeciesInfo, allAbilitiesOf } from "@/lib/champions/data";
import { getChampionsMoveset } from "@/lib/champions/moveset";
import { getMetaSet } from "@/lib/champions/metaSets";
import { toFrenchNature } from "@/lib/champions/gameTranslations";
import {
  defaultGlobal,
  defaultRowConfig,
  getClosestSpecies,
  isMegaSpecies,
  speedOf,
  baseSpeedOf,
} from "@/lib/features/speedComparator";
import { useNav } from "@/lib/app/nav";
import TypeBadge from "../ui/TypeBadge";
import TypeChart from "../ui/TypeChart";
import NameLink, { useDisplayName } from "../ui/NameLink";

const STAT_COLOR: Record<StatKey, string> = {
  hp: "#4caf50",
  atk: "#ff9800",
  def: "#ffd740",
  spa: "#4fc3f7",
  spd: "#7ac74c",
  spe: "#f95587",
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-[10px] p-3" style={{ background: "var(--color-panel-soft)", border: "1px solid var(--color-line)" }}>
      <h3 className="eyebrow mb-2">{title}</h3>
      {children}
    </section>
  );
}

/** Speed values a player actually cares about, computed with the same engine
 * as the Speed Tiers page. */
function speedBenchmarks(species: string) {
  const g = defaultGlobal();
  const mk = (sp: number, natureMod: "boost" | "neutral" | "hinder", extra: Record<string, unknown> = {}) =>
    speedOf({ ...defaultRowConfig(species), sp, natureMod, ...extra }, "opp", g);
  const rows: { id: string; value: number }[] = [
    { id: "zero", value: mk(0, "neutral") },
    { id: "maxNeutral", value: mk(32, "neutral") },
    { id: "maxPlus", value: mk(32, "boost") },
  ];
  if (!isMegaSpecies(species)) rows.push({ id: "scarf", value: mk(32, "boost", { scarf: true }) });
  rows.push({ id: "tailwind", value: mk(32, "boost", { tailwind: true }) });
  return rows;
}

export default function PokemonSheet() {
  const { sheetSpecies, closeSheet, openSpecies } = useNav();
  const { t, locale } = useLocale();
  const display = useDisplayName();
  const [moves, setMoves] = useState<Set<string> | null>(null);
  const [moveFilter, setMoveFilter] = useState("");

  const info = sheetSpecies ? getSpeciesInfo(sheetSpecies) : null;

  useEffect(() => {
    if (!sheetSpecies) return;
    let alive = true;
    setMoves(null);
    setMoveFilter("");
    getChampionsMoveset(sheetSpecies).then((s) => alive && setMoves(s));
    return () => {
      alive = false;
    };
  }, [sheetSpecies]);

  useEffect(() => {
    if (!sheetSpecies) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && closeSheet();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [sheetSpecies, closeSheet]);

  const moveRows = useMemo(() => {
    if (!moves) return [];
    return Array.from(moves)
      .map((m) => getMoveInfo(m))
      .filter((m): m is NonNullable<typeof m> => !!m)
      .sort((a, b) => a.type.localeCompare(b.type) || b.basePower - a.basePower || a.name.localeCompare(b.name));
  }, [moves]);

  if (!sheetSpecies || !info) return null;

  const meta = getMetaSet(info.name);
  const art = pokemonSpriteUrl(info.name);
  const benchmarks = speedBenchmarks(info.name);
  const neighbors = getClosestSpecies(info.name, 6);
  const q = moveFilter.trim().toLowerCase();
  const shownMoves = q ? moveRows.filter((m) => m.name.toLowerCase().includes(q)) : moveRows;

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-black/70 p-3 sm:p-8" onClick={closeSheet}>
      <div
        className="card-shell w-full max-w-3xl p-4 sm:p-5"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label={info.name}
      >
        <div className="mb-3 flex items-start gap-3">
          {art && <img src={art} alt="" className="h-20 w-20 shrink-0 object-contain" />}
          <div className="min-w-0 flex-1">
            <p className="tabular text-xs" style={{ color: "var(--color-ink-dim)" }}>
              #{info.num} · BST {info.bst}
            </p>
            <h2 className="heading text-2xl" style={{ color: "var(--color-ink-bright)" }}>
              {display("species", info.name)}
            </h2>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {info.types.map((ty) => (
                <TypeBadge key={ty} type={ty} />
              ))}
            </div>
          </div>
          <button type="button" onClick={closeSheet} className="pill-btn" aria-label={t("sheet.close")}>
            ✕
          </button>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <Section title={t("sheet.baseStats")}>
            <div className="flex flex-col gap-1.5">
              {STAT_KEYS.map((k) => (
                <div key={k} className="flex items-center gap-2 text-xs">
                  <span className="w-16 shrink-0" style={{ color: "var(--color-ink-soft)" }}>
                    {t(`stat.${k}`)}
                  </span>
                  <span className="tabular w-8 shrink-0 text-right font-bold">{info.baseStats[k]}</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full" style={{ background: "var(--color-panel-strong)" }}>
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${Math.min(100, (info.baseStats[k] / 200) * 100)}%`, background: STAT_COLOR[k] }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Section>

          <Section title={t("sheet.abilities")}>
            <ul className="flex flex-col gap-1 text-sm">
              {allAbilitiesOf(info).map((a) => (
                <li key={a} className="flex items-center gap-2">
                  <NameLink kind="ability" name={a} />
                  {a === info.hiddenAbility && (
                    <span className="rounded-[5px] px-1 py-px text-[0.55rem] font-bold uppercase" style={{ background: "var(--color-violet-soft)", color: "var(--color-violet)" }}>
                      {t("sheet.hidden")}
                    </span>
                  )}
                </li>
              ))}
            </ul>
            {(info.megaForms.length > 0 || info.isMega) && (
              <div className="mt-3 border-t pt-2" style={{ borderColor: "var(--color-line)" }}>
                <p className="eyebrow mb-1">{info.isMega ? t("sheet.baseForm") : t("sheet.megaForms")}</p>
                <div className="flex flex-wrap gap-2">
                  {(info.isMega ? [info.baseSpecies] : info.megaForms).map((n) => (
                    <button key={n} type="button" className="pill-btn" onClick={() => openSpecies(n)}>
                      {n}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </Section>

          <Section title={t("sheet.matchups")}>
            <TypeChart types={info.types} />
          </Section>

          <Section title={t("sheet.speed")}>
            <ul className="flex flex-col gap-1 text-sm">
              {benchmarks.map((b) => (
                <li key={b.id} className="flex items-center justify-between">
                  <span style={{ color: "var(--color-ink-soft)" }}>{t(`sheet.speed.${b.id}`)}</span>
                  <span className="tabular font-bold">{b.value}</span>
                </li>
              ))}
            </ul>
            <p className="eyebrow mb-1 mt-3">{t("sheet.speedNeighbors")}</p>
            <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs">
              {neighbors.map((n) => (
                <span key={n}>
                  <NameLink kind="species" name={n} /> <span className="tabular" style={{ color: "var(--color-ink-dim)" }}>{baseSpeedOf(n)}</span>
                </span>
              ))}
            </div>
          </Section>
        </div>

        {meta && (
          <div className="mt-3">
            <Section title={t("sheet.metaSet")}>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                <span>
                  <span className="eyebrow mr-1">{t("card.item")}</span>
                  <NameLink kind="item" name={meta.item} />
                </span>
                <span>
                  <span className="eyebrow mr-1">{t("card.ability")}</span>
                  <NameLink kind="ability" name={meta.ability} />
                </span>
                <span>
                  <span className="eyebrow mr-1">{t("card.nature")}</span>
                  {locale === "fr" ? toFrenchNature(meta.nature) : meta.nature}
                </span>
              </div>
              <p className="tabular mt-1 text-xs" style={{ color: "var(--color-ink-soft)" }}>
                SP:{" "}
                {STAT_KEYS.filter((k) => meta.sp[k]).map((k) => `${meta.sp[k]} ${t(`stat.${k}`)}`).join(" / ") || "-"}
                {!meta.spConfirmed && ` (${t("sheet.spEstimated")})`}
              </p>
              <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-sm">
                {meta.moves.map((m) => (
                  <NameLink key={m} kind="move" name={m} />
                ))}
              </div>
              <details className="mt-2 text-[11px]" style={{ color: "var(--color-ink-dim)" }}>
                <summary className="cursor-pointer">{t("sheet.source")}</summary>
                <p className="mt-1">{meta.source}</p>
              </details>
            </Section>
          </div>
        )}

        <div className="mt-3">
          <Section title={`${t("sheet.learnset")}${moves ? ` (${moveRows.length})` : ""}`}>
            <input
              value={moveFilter}
              onChange={(e) => setMoveFilter(e.target.value)}
              placeholder={t("sheet.filterMoves")}
              className="field-input mb-2 w-full px-2 py-1.5 text-sm"
            />
            {!moves ? (
              <p className="text-xs" style={{ color: "var(--color-ink-dim)" }}>
                {t("common.loading")}
              </p>
            ) : (
              <div className="grid max-h-72 grid-cols-1 gap-1 overflow-y-auto sm:grid-cols-2">
                {shownMoves.map((m) => (
                  <div key={m.name} className="flex items-center gap-2 text-xs">
                    <TypeBadge type={m.type} size="sm" />
                    <NameLink kind="move" name={m.name} className="truncate" />
                    <span className="tabular ml-auto shrink-0" style={{ color: "var(--color-ink-dim)" }}>
                      {m.category === "Status" ? t("db.status") : m.basePower || "-"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Section>
        </div>
      </div>
    </div>
  );
}
