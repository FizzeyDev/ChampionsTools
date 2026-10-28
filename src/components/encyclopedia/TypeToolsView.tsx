"use client";

import { useMemo, useState } from "react";
import { ALL_MOVE_NAMES, getMoveInfo } from "@/lib/champions/data";
import {
  coverageGrid,
  defensiveGroups,
  fillSuggestions,
  speciesWithTyping,
  uncoveredSpecies,
  resistantSpecies,
} from "@/lib/champions/typeTools";
import { useLocale } from "@/lib/i18n/LocaleContext";
import TypeBadge from "../ui/TypeBadge";
import TypeChips from "../ui/TypeChips";
import NameLink from "../ui/NameLink";
import SpeciesGrid from "./SpeciesGrid";
import Seg from "../ui/Seg";

type Tab = "defense" | "coverage";

const MULT_COLOR: Record<string, string> = {
  "4": "var(--color-danger)",
  "2": "var(--color-amber)",
  "1": "var(--color-ink-dim)",
  "0.5": "var(--color-success)",
  "0.25": "var(--color-league)",
  "0": "var(--color-ink-dim)",
};

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="card-shell p-4">
      <h3 className="eyebrow mb-3">{title}</h3>
      {children}
    </section>
  );
}

function DefenseTab() {
  const { t } = useLocale();
  const [types, setTypes] = useState<string[]>(["Fire", "Flying"]);
  const [exact, setExact] = useState(true);
  const groups = useMemo(() => defensiveGroups(types), [types]);
  const holders = useMemo(() => speciesWithTyping(types, exact), [types, exact]);

  return (
    <div className="flex flex-col gap-4">
      <Card title={t("typeTools.pickDefense")}>
        <TypeChips value={types} onChange={setTypes} max={2} />
        {types.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {types.map((ty) => (
              <TypeBadge key={ty} type={ty} size="lg" />
            ))}
          </div>
        )}
      </Card>

      {types.length > 0 && (
        <>
          <Card title={t("typeTools.defenseTable")}>
            <div className="flex flex-col gap-2">
              {groups.map((g) => (
                <div key={g.mult} className="flex flex-wrap items-center gap-1.5">
                  <span className="tabular w-12 shrink-0 text-sm font-extrabold" style={{ color: MULT_COLOR[String(g.mult)] }}>
                    ×{g.mult}
                  </span>
                  {g.types.map((ty) => (
                    <TypeBadge key={ty} type={ty} size="sm" />
                  ))}
                </div>
              ))}
            </div>
          </Card>

          <Card title={`${t("typeTools.holders")} (${holders.length})`}>
            {types.length === 2 && (
              <div className="mb-3">
                <Seg
                  small
                  value={exact}
                  onChange={setExact}
                  options={[
                    { value: true, label: t("typeTools.exactTyping") },
                    { value: false, label: t("typeTools.includesTypes") },
                  ]}
                />
              </div>
            )}
            {holders.length === 0 ? (
              <p className="text-sm" style={{ color: "var(--color-ink-dim)" }}>
                {t("typeTools.noneHold")}
              </p>
            ) : (
              <SpeciesGrid names={holders.map((h) => h.name)} />
            )}
          </Card>
        </>
      )}
    </div>
  );
}

function CoverageTab() {
  const { t } = useLocale();
  const [atk, setAtk] = useState<string[]>(["Fire", "Ground", "Ice"]);
  const [focus, setFocus] = useState<string>("");

  const grid = useMemo(() => coverageGrid(atk), [atk]);
  const uncovered = useMemo(() => uncoveredSpecies(atk), [atk]);
  const resisters = useMemo(() => resistantSpecies(atk), [atk]);
  const suggestions = useMemo(() => fillSuggestions(atk, uncovered), [atk, uncovered]);
  const focusMoves = useMemo(() => {
    if (!focus) return [];
    return ALL_MOVE_NAMES.map((n) => getMoveInfo(n))
      .filter((m): m is NonNullable<typeof m> => !!m && m.type === focus && m.category !== "Status" && m.basePower >= 60)
      .sort((a, b) => b.basePower - a.basePower)
      .slice(0, 24);
  }, [focus]);
  const focusSpecies = useMemo(
    () => (focus ? uncovered.filter((s) => (s.chart[focus] ?? 1) >= 2).map((s) => s.name) : []),
    [focus, uncovered]
  );

  const groups: { cls: string; label: string; color: string }[] = [
    { cls: "super", label: t("typeTools.cov.super"), color: "var(--color-success)" },
    { cls: "neutral", label: t("typeTools.cov.neutral"), color: "var(--color-ink-soft)" },
    { cls: "resisted", label: t("typeTools.cov.resisted"), color: "var(--color-amber)" },
    { cls: "immune", label: t("typeTools.cov.immune"), color: "var(--color-danger)" },
  ];

  return (
    <div className="flex flex-col gap-4">
      <Card title={t("typeTools.pickCoverage")}>
        <TypeChips value={atk} onChange={setAtk} max={4} />
        <p className="mt-2 text-[11px]" style={{ color: "var(--color-ink-dim)" }}>
          {t("typeTools.coverageHint")}
        </p>
      </Card>

      {atk.length > 0 && (
        <>
          <Card title={t("typeTools.coverageByType")}>
            <div className="flex flex-col gap-2">
              {groups.map((g) => {
                const items = grid.filter((c) => c.cls === g.cls);
                if (items.length === 0) return null;
                return (
                  <div key={g.cls} className="flex flex-wrap items-center gap-1.5">
                    <span className="w-36 shrink-0 text-xs font-bold" style={{ color: g.color }}>
                      {g.label} ({items.length})
                    </span>
                    {items.map((c) => (
                      <TypeBadge key={c.defender} type={c.defender} size="sm" />
                    ))}
                  </div>
                );
              })}
            </div>
          </Card>

          <Card title={`${t("typeTools.gaps")} (${uncovered.length})`}>
            {uncovered.length === 0 ? (
              <p className="text-sm font-bold" style={{ color: "var(--color-success)" }}>
                {t("typeTools.noGap")}
              </p>
            ) : (
              <>
                <p className="mb-2 text-xs" style={{ color: "var(--color-ink-dim)" }}>
                  {t("typeTools.gapsHint")}
                </p>
                <SpeciesGrid names={uncovered.map((s) => s.name)} limit={40} />
              </>
            )}
          </Card>

          <Card title={`${t("typeTools.resist")} (${resisters.resist.length + resisters.immune.length})`}>
            {resisters.resist.length + resisters.immune.length === 0 ? (
              <p className="text-sm font-bold" style={{ color: "var(--color-success)" }}>
                {t("typeTools.noResist")}
              </p>
            ) : (
              <>
                <p className="mb-2 text-xs" style={{ color: "var(--color-ink-dim)" }}>
                  {t("typeTools.resistHint")}
                </p>
                {resisters.immune.length > 0 && (
                  <>
                    <p className="eyebrow mb-1.5" style={{ color: "var(--color-danger)" }}>
                      {t("typeTools.immuneAll")} ({resisters.immune.length})
                    </p>
                    <div className="mb-3">
                      <SpeciesGrid names={resisters.immune.map((s) => s.name)} limit={40} />
                    </div>
                  </>
                )}
                {resisters.resist.length > 0 && (
                  <>
                    <p className="eyebrow mb-1.5" style={{ color: "var(--color-amber)" }}>
                      {t("typeTools.resistAll")} ({resisters.resist.length})
                    </p>
                    <SpeciesGrid names={resisters.resist.map((s) => s.name)} limit={40} />
                  </>
                )}
              </>
            )}
          </Card>

          {suggestions.length > 0 && (
            <Card title={t("typeTools.fill")}>
              <p className="mb-2 text-xs" style={{ color: "var(--color-ink-dim)" }}>
                {t("typeTools.fillHint")}
              </p>
              <div className="flex flex-wrap gap-2">
                {suggestions.slice(0, 8).map((s) => (
                  <button
                    key={s.type}
                    type="button"
                    onClick={() => setFocus(focus === s.type ? "" : s.type)}
                    className="inline-flex items-center gap-1.5 rounded-[8px] p-1"
                    style={{
                      background: focus === s.type ? "var(--color-panel-strong)" : "transparent",
                      border: `1px solid ${focus === s.type ? "var(--color-line-strong)" : "transparent"}`,
                    }}
                  >
                    <TypeBadge type={s.type} />
                    <span className="tabular text-xs font-bold" style={{ color: "var(--color-success)" }}>
                      +{s.newlyCovered}
                    </span>
                  </button>
                ))}
              </div>

              {focus && (
                <div className="mt-4 grid gap-4 lg:grid-cols-2">
                  <div>
                    <p className="eyebrow mb-1.5">{t("typeTools.movesOfType")}</p>
                    <div className="flex flex-wrap gap-x-3 gap-y-1 text-sm">
                      {focusMoves.map((m) => (
                        <span key={m.name}>
                          <NameLink kind="move" name={m.name} />{" "}
                          <span className="tabular text-[10px]" style={{ color: "var(--color-ink-dim)" }}>
                            {m.basePower}
                          </span>
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="eyebrow mb-1.5">
                      {t("typeTools.newlyHit")} ({focusSpecies.length})
                    </p>
                    <SpeciesGrid names={focusSpecies} limit={24} />
                  </div>
                </div>
              )}
            </Card>
          )}
        </>
      )}
    </div>
  );
}

export default function TypeToolsView() {
  const { t } = useLocale();
  const [tab, setTab] = useState<Tab>("defense");
  return (
    <div className="flex flex-col gap-4">
      <div className="card-shell flex flex-wrap items-end justify-between gap-3 p-4">
        <div>
          <h2 className="heading text-xl" style={{ color: "var(--color-ink-bright)" }}>
            {t("typeTools.title")}
          </h2>
          <p className="text-xs" style={{ color: "var(--color-ink-dim)" }}>
            {t("typeTools.subtitle")}
          </p>
        </div>
        <Seg
          value={tab}
          onChange={setTab}
          options={[
            { value: "defense" as Tab, label: t("typeTools.tab.defense") },
            { value: "coverage" as Tab, label: t("typeTools.tab.coverage") },
          ]}
        />
      </div>
      {tab === "defense" ? <DefenseTab /> : <CoverageTab />}
    </div>
  );
}
