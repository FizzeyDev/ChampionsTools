"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ALL_MOVE_NAMES,
  getAbilityIndex,
  loadLearnsetIndex,
  type LearnsetIndex,
} from "@/lib/champions/data";
import {
  decodeFilters,
  defaultFilters,
  encodeFilters,
  hasActiveFilters,
  needsLearnsets,
  runSearch,
  STAT_LABEL,
  type MegaMode,
  type MoveMode,
  type Reason,
  type SearchFilters,
  type TypeMode,
} from "@/lib/champions/pokedexSearch";
import { STAT_KEYS } from "@/lib/calc/gen";
import { pokemonSpriteUrl } from "@/lib/app/sprites";
import { useLocale } from "@/lib/i18n/LocaleContext";
import { toFrenchType } from "@/lib/champions/gameTranslations";
import TypeBadge from "../ui/TypeBadge";
import TypeChips from "../ui/TypeChips";
import ChipPicker from "../ui/ChipPicker";
import Seg from "../ui/Seg";
import NameLink, { useDisplayName } from "../ui/NameLink";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="eyebrow">{label}</span>
      {children}
    </div>
  );
}

function NumberBox({ value, onChange, max = 255, width = "4.5rem" }: { value: number; onChange: (n: number) => void; max?: number; width?: string }) {
  return (
    <input
      type="number"
      min={0}
      max={max}
      value={value || ""}
      placeholder="0"
      onChange={(e) => onChange(Math.max(0, Math.min(max, Number(e.target.value) || 0)))}
      className="field-input px-2 py-1 text-sm"
      style={{ width }}
    />
  );
}

export default function SearchView() {
  const { t, locale } = useLocale();
  const display = useDisplayName();
  const [f, setF] = useState<SearchFilters>(() => defaultFilters());
  const [learnsets, setLearnsets] = useState<LearnsetIndex | null>(null);
  const [copied, setCopied] = useState(false);
  const [shown, setShown] = useState(60);
  const [booted, setBooted] = useState(false);

  // Restore a shared search from the URL (#search=...).
  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const enc = params.get("search");
    if (enc) {
      const parsed = decodeFilters(enc);
      if (parsed) setF(parsed);
    }
    setBooted(true);
  }, []);

  const wantsLearnsets = needsLearnsets(f);
  useEffect(() => {
    if (!wantsLearnsets || learnsets) return;
    let alive = true;
    loadLearnsetIndex().then((i) => alive && setLearnsets(i));
    return () => {
      alive = false;
    };
  }, [wantsLearnsets, learnsets]);

  const loading = wantsLearnsets && !learnsets;
  const results = useMemo(() => (loading ? [] : runSearch(f, learnsets)), [f, learnsets, loading]);
  useEffect(() => setShown(60), [f]);

  const set = (patch: Partial<SearchFilters>) => setF((prev) => ({ ...prev, ...patch }));
  const abilityOptions = useMemo(() => getAbilityIndex().map((a) => a.name), []);

  const copyLink = async () => {
    const url = new URL(window.location.href);
    url.hash = `search=${encodeFilters(f)}`;
    try {
      await navigator.clipboard.writeText(url.toString());
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt(locale === "fr" ? "Copie ce lien :" : "Copy this link:", url.toString());
    }
  };

  const renderReason = (r: Reason, i: number) => {
    const chip = (key: string, node: React.ReactNode, color: string, bg: string) => (
      <span key={key} className="inline-flex items-center gap-1 rounded-[5px] px-1.5 py-px text-[0.65rem] font-bold" style={{ background: bg, color }}>
        {node}
      </span>
    );
    switch (r.kind) {
      case "type":
        return chip(`r${i}`, r.values.map((v) => (locale === "fr" ? toFrenchType(v) : v)).join(" / "), "var(--color-league)", "var(--color-league-soft)");
      case "ability":
        return chip(`r${i}`, <>{t("search.why.ability")} {r.values.map((v) => display("ability", v)).join(", ")}</>, "var(--color-amber)", "var(--color-amber-soft)");
      case "move":
        return chip(`r${i}`, <>{t("search.why.move")} {r.values.map((v) => display("move", v)).join(", ")}</>, "var(--color-violet)", "var(--color-violet-soft)");
      case "mega":
        return chip(`r${i}`, <>Mega {r.values.length ? `(${r.values.length})` : ""}</>, "var(--color-brick)", "rgba(255,157,0,0.12)");
      case "coverage":
        return chip(`r${i}`, <>{t("search.why.coverage")} {r.values.map((v) => (locale === "fr" ? toFrenchType(v) : v)).join(", ")}</>, "var(--color-success)", "rgba(76,175,80,0.12)");
      case "resist":
        return chip(`r${i}`, <>{t("search.why.resist")} {r.values.map((v) => (locale === "fr" ? toFrenchType(v) : v)).join(", ")}</>, "var(--color-success)", "rgba(76,175,80,0.12)");
      default:
        return chip(`r${i}`, r.text, "var(--color-ink-soft)", "var(--color-panel-strong)");
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="card-shell p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="heading text-xl" style={{ color: "var(--color-ink-bright)" }}>
              {t("search.title")}
            </h2>
            <p className="text-xs" style={{ color: "var(--color-ink-dim)" }}>
              {t("search.subtitle")}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={copyLink}
              disabled={!hasActiveFilters(f)}
              className="pill-btn"
              style={{ color: "var(--color-violet)", borderColor: "rgba(159,83,236,0.4)", background: "var(--color-violet-soft)" }}
            >
              🔗 {copied ? t("app.linkCopied") : t("search.copyLink")}
            </button>
            <button type="button" className="pill-btn" onClick={() => setF(defaultFilters())}>
              ↺ {t("search.reset")}
            </button>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Field label={t("pokedex.name")}>
            <input value={f.text} onChange={(e) => set({ text: e.target.value })} placeholder={t("pokedex.namePlaceholder")} className="field-input px-2 py-1.5 text-sm" />
          </Field>

          <Field label={t("search.mega")}>
            <Seg
              value={f.mega}
              onChange={(mega) => set({ mega })}
              options={[
                { value: "any" as MegaMode, label: t("search.mega.any") },
                { value: "hasMega" as MegaMode, label: t("search.mega.has") },
                { value: "isMega" as MegaMode, label: t("search.mega.is") },
                { value: "noMega" as MegaMode, label: t("search.mega.no") },
              ]}
            />
          </Field>

          <div className="lg:col-span-2">
            <Field label={t("search.types")}>
              <div className="flex flex-wrap items-center gap-3">
                <Seg
                  small
                  value={f.typeMode}
                  onChange={(typeMode) => set({ typeMode })}
                  options={[
                    { value: "any" as TypeMode, label: t("search.typeMode.any"), title: t("search.typeMode.anyHint") },
                    { value: "all" as TypeMode, label: t("search.typeMode.all"), title: t("search.typeMode.allHint") },
                    { value: "exact" as TypeMode, label: t("search.typeMode.exact"), title: t("search.typeMode.exactHint") },
                  ]}
                />
              </div>
              <TypeChips value={f.types} onChange={(types) => set({ types })} />
            </Field>
          </div>

          <ChipPicker label={t("search.abilities")} kind="ability" options={abilityOptions} value={f.abilities} onChange={(abilities) => set({ abilities })} />

          <div className="flex flex-col gap-1.5">
            <ChipPicker label={t("search.moves")} kind="move" options={ALL_MOVE_NAMES} value={f.moves} onChange={(moves) => set({ moves })} />
            {f.moves.length > 1 && (
              <Seg
                small
                accent="var(--color-brick)"
                value={f.moveMode}
                onChange={(moveMode) => set({ moveMode })}
                options={[
                  { value: "and" as MoveMode, label: t("search.moveMode.and") },
                  { value: "or" as MoveMode, label: t("search.moveMode.or") },
                ]}
              />
            )}
          </div>

          <div className="lg:col-span-2">
            <Field label={t("search.coverage")}>
              <p className="text-[11px]" style={{ color: "var(--color-ink-dim)" }}>
                {t("search.coverageHint")}
              </p>
              <TypeChips value={f.coverage} onChange={(coverage) => set({ coverage })} />
            </Field>
          </div>

          <div className="lg:col-span-2">
            <Field label={t("search.resists")}>
              <TypeChips value={f.resists} onChange={(resists) => set({ resists })} />
            </Field>
          </div>

          <div className="lg:col-span-2">
            <Field label={t("search.minStats")}>
              <div className="flex flex-wrap items-center gap-3">
                {STAT_KEYS.map((k) => (
                  <label key={k} className="flex items-center gap-1.5 text-xs" style={{ color: "var(--color-ink-soft)" }}>
                    {STAT_LABEL[k]}
                    <NumberBox value={f.minStats[k] ?? 0} onChange={(n) => set({ minStats: { ...f.minStats, [k]: n } })} />
                  </label>
                ))}
                <label className="flex items-center gap-1.5 text-xs" style={{ color: "var(--color-ink-soft)" }}>
                  BST
                  <NumberBox value={f.minBst} max={800} width="5rem" onChange={(minBst) => set({ minBst })} />
                </label>
              </div>
            </Field>
          </div>

          <Field label={t("search.speedRange")}>
            <div className="flex items-center gap-2 text-xs" style={{ color: "var(--color-ink-soft)" }}>
              <NumberBox value={f.speedMin} onChange={(speedMin) => set({ speedMin })} />
              <span>→</span>
              <input
                type="number"
                min={0}
                max={255}
                value={f.speedMax >= 999 ? "" : f.speedMax}
                placeholder="∞"
                onChange={(e) => set({ speedMax: e.target.value === "" ? 999 : Math.max(0, Math.min(255, Number(e.target.value))) })}
                className="field-input px-2 py-1 text-sm"
                style={{ width: "4.5rem" }}
              />
              <span>{t("search.baseSpeed")}</span>
            </div>
          </Field>

          <label className="flex items-center gap-2 self-end pb-1 text-sm" style={{ color: "var(--color-ink-soft)" }}>
            <input type="checkbox" className="field-checkbox" checked={f.hideMegas} onChange={(e) => set({ hideMegas: e.target.checked })} />
            {t("pokedex.hideMegas")}
          </label>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-bold" style={{ color: "var(--color-ink-soft)" }}>
          {loading ? t("common.loading") : t("search.count").replace("{n}", String(results.length))}
        </p>
        {!booted && <span />}
      </div>

      <div className="flex flex-col gap-2">
        {results.slice(0, shown).map(({ info, reasons }) => {
          const art = pokemonSpriteUrl(info.name, true);
          return (
            <div key={info.name} className="card-shell flex flex-wrap items-center gap-3 p-2.5">
              {art && <img src={art} alt="" className="h-11 w-11 shrink-0 object-contain" />}
              <div className="min-w-[10rem] flex-1">
                <NameLink kind="species" name={info.name} className="text-sm" />
                <div className="mt-0.5 flex flex-wrap gap-1">
                  {info.types.map((ty) => (
                    <TypeBadge key={ty} type={ty} size="sm" />
                  ))}
                </div>
              </div>
              <div className="flex flex-1 flex-wrap gap-1">{reasons.map(renderReason)}</div>
              <div className="tabular shrink-0 text-right text-[11px]" style={{ color: "var(--color-ink-soft)" }}>
                <p>BST {info.bst}</p>
                <p>
                  {STAT_LABEL.spe} {info.baseStats.spe}
                </p>
              </div>
            </div>
          );
        })}
        {!loading && results.length === 0 && (
          <p className="text-center text-sm" style={{ color: "var(--color-ink-dim)" }}>
            {t("search.noResult")}
          </p>
        )}
        {shown < results.length && (
          <div className="text-center">
            <button type="button" className="pill-btn" onClick={() => setShown((n) => n + 60)}>
              {t("pokedex.showMore")} ({results.length - shown})
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
