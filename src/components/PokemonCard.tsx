"use client";

import { useEffect, useState } from "react";
import {
  ABILITY_NAMES,
  ITEM_NAMES,
  MOVE_NAMES,
  NATURE_NAMES,
  SPECIES_NAMES,
  STATUS_VALUES,
  STAT_KEYS,
  TYPE_NAMES,
} from "@/lib/gen";
import { itemSpriteUrl, moveInfo, pokemonSpriteUrl, speciesTypes, typeIconUrl } from "@/lib/sprites";
import { exportShowdownSet, parseShowdownSet } from "@/lib/showdownSet";
import { savePokemon } from "@/lib/features/savedPokemon";
import { STAT_POINT_BUDGET, evToSp } from "@/lib/champions/statPoints";
import { computeStats } from "@/lib/calcEngine";
import { getBaseStats } from "@/lib/champions/baseStats";
import { getSpeciesAbilities } from "@/lib/features/speciesAbilities";
import { getChampionsMoveset } from "@/lib/champions/moveset";
import { autofillForSpecies } from "@/lib/features/autofillSpecies";
import { getMetaSet } from "@/lib/champions/metaSets";
import { getMoveDescription, getAbilityDescription, getItemDescription } from "@/lib/champions/descriptions";
import { getItemCategory, ITEM_CATEGORY_ORDER, type ItemCategory } from "@/lib/champions/itemCategories";
import { HOLD_ITEMS, MEGA_STONES, NEW_MEGA_STONES, BERRIES } from "@/lib/champions/items";
import { NATURE_EFFECTS, natureStatAbbr } from "@/lib/natures";
import { useLocale } from "@/lib/i18n/LocaleContext";
import type { PokemonState } from "@/lib/types";
import IconSearchSelect from "./IconSearchSelect";
import StatRow from "./StatRow";
import TypeChart from "./TypeChart";

const ITEM_CATEGORY_OF = (() => {
  const map = new Map<string, "hold" | "mega" | "berry">();
  for (const i of HOLD_ITEMS) map.set(i, "hold");
  for (const m of [...MEGA_STONES, ...NEW_MEGA_STONES]) map.set(m.item, "mega");
  for (const b of BERRIES) map.set(b, "berry");
  return (item: string) => map.get(item) ?? "hold";
})();

interface PokemonCardProps {
  role: "attacker" | "defender";
  accent: "league" | "brick";
  state: PokemonState;
  onChange: (next: PokemonState) => void;
  showMoves?: boolean;
  restrictAbilityToReal?: boolean;
}

export default function PokemonCard({
  role,
  accent,
  state,
  onChange,
  showMoves = true,
  restrictAbilityToReal = false,
}: PokemonCardProps) {
  const { t } = useLocale();
  const [showChart, setShowChart] = useState(false);
  const [showSet, setShowSet] = useState(false);
  const [setText, setSetText] = useState("");
  const [setError, setSetError] = useState("");
  const [showSavePrompt, setShowSavePrompt] = useState(false);
  const [saveName, setSaveName] = useState("");
  const [savedFlash, setSavedFlash] = useState(false);
  const [moveset, setMoveset] = useState<Set<string>>(new Set());
  const [itemFilter, setItemFilter] = useState<ItemCategory | "all">("all");

  useEffect(() => {
    let cancelled = false;
    getChampionsMoveset(state.species).then((m) => {
      if (!cancelled) setMoveset(m);
    });
    return () => {
      cancelled = true;
    };
  }, [state.species]);

  const realAbilities = getSpeciesAbilities(state.species);
  const itemGroupOf = (item: string) => t(`group.${ITEM_CATEGORY_OF(item)}`);
  const itemGroupOrder = [t("group.hold"), t("group.mega"), t("group.berry")];
  const filteredItemNames =
    itemFilter === "all" ? ITEM_NAMES : ITEM_NAMES.filter((i) => getItemCategory(i) === itemFilter);

  const accentVar = accent === "league" ? "var(--color-league)" : "var(--color-brick)";
  const accentGlowVar = accent === "league" ? "var(--color-league-glow)" : "var(--color-brick-glow)";
  const accentBorderRgba = accent === "league" ? "rgba(79,195,247,0.35)" : "rgba(255,157,0,0.35)";

  const update = <K extends keyof PokemonState>(key: K, value: PokemonState[K]) =>
    onChange({ ...state, [key]: value });

  /** Auto-fills ability, moves and (for Megas) held item when the species changes. */
  const handleSpeciesChange = async (newSpecies: string) => {
    onChange(await autofillForSpecies(state, newSpecies));
  };

  const artwork = pokemonSpriteUrl(state.species);
  const types = speciesTypes(state.species);
  const totalSp = STAT_KEYS.reduce((sum, key) => sum + evToSp(state.evs[key]), 0);
  let stats: Record<string, number>;
  try {
    stats = computeStats(state);
  } catch {
    stats = { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 };
  }
  const baseStats = getBaseStats(state.species);

  const natureSubtitle = (natureName: string) => {
    const effect = NATURE_EFFECTS[natureName];
    if (!effect || (!effect.plus && !effect.minus)) {
      return <span style={{ color: "var(--color-ink-dim)" }}>{t("card.natureNeutral")}</span>;
    }
    return (
      <span className="flex items-center gap-1.5">
        {effect.plus && (
          <span style={{ color: "var(--color-success)" }}>+{natureStatAbbr(effect.plus)}</span>
        )}
        {effect.minus && (
          <span style={{ color: "var(--color-danger)" }}>-{natureStatAbbr(effect.minus)}</span>
        )}
      </span>
    );
  };

  const importSet = () => {
    const parsed = parseShowdownSet(setText);
    if (!parsed) {
      setSetError(t("card.importError"));
      return;
    }
    onChange(parsed);
    setSetError("");
    setShowSet(false);
    setSetText("");
  };

  const copyExport = async () => {
    try {
      await navigator.clipboard.writeText(exportShowdownSet(state));
    } catch {
      // clipboard may be unavailable — silently ignore
    }
  };

  const confirmSave = () => {
    savePokemon(saveName || state.species, state);
    setShowSavePrompt(false);
    setSaveName("");
    setSavedFlash(true);
    window.setTimeout(() => setSavedFlash(false), 1500);
  };

  return (
    <section
      className="card-shell p-4"
      style={{ borderColor: accentBorderRgba, boxShadow: `var(--shadow-md), 0 0 32px ${accentGlowVar}` }}
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b pb-3" style={{ borderColor: "var(--color-line)" }}>
        <h2 className="heading text-lg" style={{ color: accentVar, textShadow: `0 0 20px ${accentGlowVar}` }}>
          {t(role === "attacker" ? "card.attacker" : "card.defender")}
        </h2>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => setShowSet((s) => !s)} className="pill-btn text-[0.68rem]">
            {t("card.importSet")}
          </button>
          <button type="button" onClick={copyExport} className="pill-btn text-[0.68rem]">
            {t("card.copySet")}
          </button>
          <button
            type="button"
            onClick={() => {
              setSaveName(state.species);
              setShowSavePrompt((s) => !s);
            }}
            className="pill-btn text-[0.68rem]"
          >
            {savedFlash ? `✓ ${t("saved.savedFlash")}` : t("saved.save")}
          </button>
          <span className="tabular eyebrow" style={{ color: "var(--color-ink-dim)" }}>
            {t("card.level")} {state.level}
          </span>
        </div>
      </div>

      {showSavePrompt && (
        <div
          className="mb-3 flex items-center gap-2 rounded-[10px] p-2.5"
          style={{ background: "var(--color-panel-soft)", border: "1px solid var(--color-line-strong)" }}
        >
          <input
            type="text"
            value={saveName}
            onChange={(e) => setSaveName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && confirmSave()}
            placeholder={t("saved.namePlaceholder")}
            className="field-input flex-1 px-3 py-1.5 text-sm"
            autoFocus
          />
          <button
            type="button"
            onClick={confirmSave}
            className="pill-btn"
            style={{ color: "var(--color-paper)", background: accentVar, borderColor: accentVar }}
          >
            {t("saved.confirm")}
          </button>
        </div>
      )}

      {showSet && (
        <div
          className="mb-3 rounded-[10px] p-2.5"
          style={{ background: "var(--color-panel-soft)", border: "1px solid var(--color-line-strong)" }}
        >
          <textarea
            value={setText}
            onChange={(e) => setSetText(e.target.value)}
            placeholder={t("card.importPlaceholder", { species: state.species || "Charizard" })}
            rows={5}
            className="field-input tabular w-full p-2 text-xs"
          />
          <div className="mt-2 flex items-center gap-2">
            <button
              type="button"
              onClick={importSet}
              className="pill-btn"
              style={{ color: "var(--color-paper)", background: accentVar, borderColor: accentVar }}
            >
              {t("card.import")}
            </button>
            {setError && <span className="text-xs" style={{ color: "var(--color-danger)" }}>{setError}</span>}
          </div>
        </div>
      )}

      <div className="mb-3 flex items-center gap-3">
        {artwork && (
          <img
            src={artwork}
            alt=""
            className="h-16 w-16 shrink-0 object-contain"
            style={{ filter: `drop-shadow(0 0 10px ${accentGlowVar})` }}
            onError={(e) => ((e.target as HTMLImageElement).style.visibility = "hidden")}
          />
        )}
        <div className="flex-1">
          <IconSearchSelect
            label={t("card.pokemon")}
            value={state.species}
            options={SPECIES_NAMES}
            allowEmpty={false}
            iconUrl={(v) => pokemonSpriteUrl(v, true)}
            isMarked={(v) => !!getMetaSet(v)}
            markedTitle={t("card.hasMetaSet")}
            onChange={handleSpeciesChange}
          />
          {types.length > 0 && (
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
              {types.map((ty) => (
                <span
                  key={ty}
                  className="flex items-center gap-1 rounded-[6px] px-1.5 py-0.5 text-xs"
                  style={{ background: "var(--color-panel-strong)", border: "1px solid var(--color-line)" }}
                >
                  {typeIconUrl(ty) && (
                    <img src={typeIconUrl(ty)!} alt="" className="h-4 w-4 object-contain" />
                  )}
                  {ty}
                </span>
              ))}
              <button
                type="button"
                onClick={() => setShowChart((s) => !s)}
                className="text-[0.65rem] font-semibold underline decoration-dotted underline-offset-2"
                style={{ color: accentVar }}
              >
                {t("chart.title")}
              </button>
            </div>
          )}
          {showChart && <TypeChart types={types} />}
        </div>
      </div>

      {!state.itemLocked && (
        <div className="mb-2 flex flex-wrap gap-1">
          {(["all", ...ITEM_CATEGORY_ORDER] as const).map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setItemFilter(cat)}
              className="rounded-full px-2 py-0.5 text-[0.62rem] font-semibold transition"
              style={{
                background: itemFilter === cat ? accentVar : "var(--color-panel-strong)",
                color: itemFilter === cat ? "var(--color-paper)" : "var(--color-ink-dim)",
              }}
            >
              {t(`itemcat.${cat}`)}
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        {state.itemLocked ? (
          <div className="flex flex-col gap-1 text-sm">
            <span className="eyebrow">{t("card.item")}</span>
            <div
              className="field-input flex items-center gap-2 py-2 pl-2 pr-3"
              style={{ cursor: "not-allowed", opacity: 0.85 }}
              title={t("card.itemLocked")}
            >
              {itemSpriteUrl(state.item) && (
                <img src={itemSpriteUrl(state.item)!} alt="" className="h-6 w-6 shrink-0 object-contain" />
              )}
              <span className="flex-1 truncate">{state.item}</span>
              <span aria-hidden>🔒</span>
            </div>
          </div>
        ) : (
          <IconSearchSelect
            label={t("card.item")}
            value={state.item}
            options={filteredItemNames}
            placeholder="—"
            iconUrl={itemSpriteUrl}
            subtitle={(v) => getItemDescription(v) || undefined}
            valueTitle={getItemDescription(state.item)}
            groupOf={itemFilter === "all" ? itemGroupOf : undefined}
            groupOrder={itemFilter === "all" ? itemGroupOrder : undefined}
            onChange={(v) => update("item", v)}
          />
        )}
        <IconSearchSelect
          label={t("card.ability")}
          value={state.ability}
          options={restrictAbilityToReal && realAbilities.length ? realAbilities : ABILITY_NAMES}
          placeholder="—"
          isPreferred={(v) => realAbilities.includes(v)}
          subtitle={(v) => getAbilityDescription(v) || undefined}
          valueTitle={getAbilityDescription(state.ability)}
          onChange={(v) => update("ability", v)}
        />
        <div className="flex flex-col gap-1">
          <IconSearchSelect
            label={t("card.nature")}
            value={state.nature}
            options={NATURE_NAMES}
            allowEmpty={false}
            subtitle={natureSubtitle}
            onChange={(v) => update("nature", v)}
          />
          <div className="text-xs">{natureSubtitle(state.nature)}</div>
        </div>
        <label className="flex flex-col gap-1 text-sm">
          <span className="eyebrow">{t("card.levelLabel")}</span>
          <input
            type="number"
            min={1}
            max={100}
            value={state.level}
            onChange={(e) =>
              update("level", Math.max(1, Math.min(100, Number(e.target.value) || 1)))
            }
            className="field-input tabular px-3 py-2"
          />
        </label>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 border-t pt-3" style={{ borderColor: "var(--color-line)" }}>
        <label className="flex flex-col gap-1 text-sm">
          <span className="eyebrow">{t("card.status")}</span>
          <select
            value={state.status}
            onChange={(e) => update("status", e.target.value)}
            className="field-input px-3 py-2"
          >
            {STATUS_VALUES.map((s) => (
              <option key={s} value={s}>
                {t(`status.${s || "none"}`)}
              </option>
            ))}
          </select>
        </label>

        <div className="flex flex-col justify-end gap-2">
          <label className="flex items-center gap-2 text-sm" style={{ color: "var(--color-ink-soft)" }}>
            <input
              type="checkbox"
              checked={state.abilityOn}
              onChange={(e) => update("abilityOn", e.target.checked)}
              className="field-checkbox"
            />
            {t("card.abilityOn")}
          </label>
          <label className="flex items-center gap-2 text-sm" style={{ color: "var(--color-ink-soft)" }}>
            <input
              type="checkbox"
              checked={state.useTera}
              onChange={(e) => update("useTera", e.target.checked)}
              className="field-checkbox"
            />
            {t("card.tera")}
          </label>
          {state.useTera && (
            <select
              value={state.teraType}
              onChange={(e) => update("teraType", e.target.value)}
              className="field-input px-2 py-1.5 text-sm"
            >
              <option value="">{t("card.teraTypePlaceholder")}</option>
              {TYPE_NAMES.map((ty) => (
                <option key={ty} value={ty}>
                  {ty}
                </option>
              ))}
            </select>
          )}
        </div>

        <label className="flex flex-col gap-1 text-sm">
          <span className="eyebrow">{t("card.alliesFainted")}</span>
          <input
            type="number"
            min={0}
            max={5}
            value={state.alliesFainted}
            onChange={(e) =>
              update("alliesFainted", Math.max(0, Math.min(5, Number(e.target.value) || 0)))
            }
            className="field-input tabular px-3 py-2"
          />
        </label>
      </div>

      <div className="mt-4">
        <div
          className="grid gap-2 pb-1 text-[10px]"
          style={{ gridTemplateColumns: "3.2rem 2.4rem 1fr 3.2rem 3.4rem 3rem" }}
        >
          <span></span>
          <span className="eyebrow text-center">{t("card.statBase")}</span>
          <span className="eyebrow">{t("card.statPoints")}</span>
          <span></span>
          <span className="eyebrow">{t("card.stage")}</span>
          <span className="eyebrow text-right">{t("card.statTotal")}</span>
        </div>
        {STAT_KEYS.map((key) => (
          <StatRow
            key={key}
            label={t(`stat.${key}`)}
            base={baseStats[key]}
            ev={state.evs[key]}
            boost={state.boosts[key]}
            advanced
            total={stats[key]}
            showBoost={key !== "hp"}
            onEvChange={(v) => update("evs", { ...state.evs, [key]: v })}
            onBoostChange={(v) => update("boosts", { ...state.boosts, [key]: v })}
          />
        ))}
        <p
          className="tabular mt-1.5 text-[11px] font-semibold"
          style={{ color: totalSp > STAT_POINT_BUDGET ? "var(--color-danger)" : "var(--color-ink-dim)" }}
        >
          {t("card.statPoints")} : {totalSp} / {STAT_POINT_BUDGET}
          {totalSp > STAT_POINT_BUDGET && ` ${t("card.statPointsOver")}`}
        </p>
        <p className="mt-0.5 text-[10px]" style={{ color: "var(--color-ink-dim)" }}>
          {t("card.ivNote")}
        </p>
      </div>

      {showMoves && (
        <div className="mt-4 grid grid-cols-2 gap-2">
          {state.moves.map((m, i) => (
            <div key={i} className="flex flex-col gap-1">
              <IconSearchSelect
                label={t("card.move", { n: i + 1 })}
                value={m}
                options={MOVE_NAMES}
                placeholder="—"
                iconUrl={(v) => typeIconUrl(moveInfo(v).type)}
                subtitle={(v) => {
                  const info = moveInfo(v);
                  const desc = getMoveDescription(v);
                  if (!info.type) return undefined;
                  return (
                    <>
                      <span className="block">
                        {info.type} · {info.category} · BP {info.bp ?? 0}
                      </span>
                      {desc && <span className="block" style={{ opacity: 0.8 }}>{desc}</span>}
                    </>
                  );
                }}
                valueTitle={getMoveDescription(m)}
                isPreferred={(v) => moveset.has(v)}
                onChange={(v) => {
                  const moves = [...state.moves];
                  moves[i] = v;
                  update("moves", moves);
                }}
              />
              <label className="flex items-center gap-1.5 text-xs" style={{ color: "var(--color-ink-soft)" }}>
                <input
                  type="checkbox"
                  checked={state.critMoves[i] ?? false}
                  onChange={(e) => {
                    const critMoves = [...state.critMoves];
                    critMoves[i] = e.target.checked;
                    update("critMoves", critMoves);
                  }}
                  className="field-checkbox"
                />
                {t("card.crit")}
              </label>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}