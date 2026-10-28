"use client";

import { useEffect, useState } from "react";
import IconSearchSelect from "../ui/IconSearchSelect";
import TypeBadge from "../ui/TypeBadge";
import { ABILITY_NAMES, ITEM_NAMES, MOVE_NAMES, SPECIES_NAMES, STAT_KEYS } from "@/lib/calc/gen";
import {
  itemSpriteUrl,
  moveInfo,
  pokemonSpriteUrl,
  speciesTypes,
  typeIconUrl,
} from "@/lib/app/sprites";
import { getChampionsMoveset } from "@/lib/champions/moveset";
import { getSpeciesAbilities } from "@/lib/features/speciesAbilities";
import { getAbilityDescription, getItemDescription } from "@/lib/champions/descriptions";
import { getMetaSet } from "@/lib/champions/metaSets";
import { getBaseStats } from "@/lib/champions/baseStats";
import { computeStats } from "@/lib/calc/calcEngine";
import { typeGradient } from "@/lib/app/typeColors";
import { toFrench } from "@/lib/champions/gameTranslations";
import { getSavedPokemons } from "@/lib/features/savedPokemon";
import { STAT_POINT_CAP, STAT_POINT_BUDGET, evToSp, spToEv } from "@/lib/champions/statPoints";
import { useLocale } from "@/lib/i18n/LocaleContext";
import { defaultPokemon } from "@/lib/calc/types";
import type { PokemonState } from "@/lib/calc/types";

interface TeamSlotCardProps {
  index: number;
  state: PokemonState;
  onChange: (next: PokemonState) => void;
  onClear: () => void;
}

const STAT_LABEL: Record<(typeof STAT_KEYS)[number], string> = {
  hp: "HP",
  atk: "Atk",
  def: "Def",
  spa: "SpA",
  spd: "SpD",
  spe: "Spe",
};

export default function TeamSlotCard({ index, state, onChange, onClear }: TeamSlotCardProps) {
  const { t, locale } = useLocale();
  const [moveset, setMoveset] = useState<Set<string>>(new Set());
  const [savedList, setSavedList] = useState<ReturnType<typeof getSavedPokemons>>([]);

  useEffect(() => {
    setSavedList(getSavedPokemons());
  }, []);

  useEffect(() => {
    let cancelled = false;
    if (!state.species) {
      setMoveset(new Set());
      return;
    }
    getChampionsMoveset(state.species).then((m) => {
      if (!cancelled) setMoveset(m);
    });
    return () => {
      cancelled = true;
    };
  }, [state.species]);

  const update = <K extends keyof PokemonState>(key: K, value: PokemonState[K]) =>
    onChange({ ...state, [key]: value });

  const updateMove = (i: number, value: string) => {
    const moves = [...state.moves];
    moves[i] = value;
    onChange({ ...state, moves });
  };

  const setSp = (key: (typeof STAT_KEYS)[number], value: number) => {
    const clamped = Math.max(0, Math.min(STAT_POINT_CAP, value));
    onChange({ ...state, evs: { ...state.evs, [key]: spToEv(clamped) } });
  };

  const totalSp = STAT_KEYS.reduce((sum, key) => sum + evToSp(state.evs[key]), 0);
  const realAbilities = getSpeciesAbilities(state.species);
  const types = speciesTypes(state.species);
  const artwork = pokemonSpriteUrl(state.species);
  const baseStats = getBaseStats(state.species);
  let computedStats: Record<string, number> = { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 };
  try {
    computedStats = computeStats(state);
  } catch {
    // leave zeros - species not resolvable yet
  }
  const moveIcon = (v: string) => typeIconUrl(moveInfo(v).type);
  const moveSubtitle = (v: string) => {
    const info = moveInfo(v);
    return info.type ? `${info.type} · ${info.category} · ${info.bp ?? 0} BP` : undefined;
  };

  if (!state.species) {
    return (
      <div
        className="card-shell flex min-h-[9rem] flex-col items-center justify-center gap-2 p-4"
        style={{ borderStyle: "dashed" }}
      >
        <span className="eyebrow">{t("teamCov.slot", { n: String(index + 1) })}</span>
        <div className="w-full max-w-[220px]">
          <IconSearchSelect
            label={t("card.pokemon")}
            value=""
            options={SPECIES_NAMES}
            allowEmpty={false}
            iconUrl={(v) => pokemonSpriteUrl(v, true)}
            isMarked={(v) => !!getMetaSet(v)}
            markedTitle={t("card.hasMetaSet")}
            translateKind="species"
            placeholder={t("teamCov.addPlaceholder")}
            onChange={(v) => onChange({ ...defaultPokemon(v), level: state.level })}
            extraGroup={
              savedList.length
                ? {
                    heading: t("saved.searchHeading"),
                    items: savedList.map((entry) => ({
                      id: entry.id,
                      label: entry.name,
                      subtitle: locale === "fr" ? toFrench("species", entry.state.species) : entry.state.species,
                      icon: pokemonSpriteUrl(entry.state.species, true),
                    })),
                    onSelect: (id) => {
                      const found = savedList.find((e) => e.id === id);
                      if (found) onChange(JSON.parse(JSON.stringify(found.state)));
                    },
                  }
                : undefined
            }
          />
        </div>
      </div>
    );
  }

  return (
    <div
      className="card-shell overflow-hidden p-3.5"
      style={{ background: `${typeGradient(types)}, var(--color-panel)` }}
    >
      <div className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_1px_9.5rem]">
        {/* Left column: header + item/ability + stats */}
        <div className="flex min-w-0 flex-col gap-2.5">
          <div className="flex items-start gap-2.5">
            {artwork && <img src={artwork} alt="" className="h-12 w-12 shrink-0 object-contain" />}
            <div className="min-w-0 flex-1">
              <IconSearchSelect
                label={t("card.pokemon")}
                value={state.species}
                options={SPECIES_NAMES}
                allowEmpty={false}
                iconUrl={(v) => pokemonSpriteUrl(v, true)}
                isMarked={(v) => !!getMetaSet(v)}
                markedTitle={t("card.hasMetaSet")}
                translateKind="species"
                onChange={(v) => onChange({ ...defaultPokemon(v), level: state.level })}
              />
              {types.length > 0 && (
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {types.map((ty) => (
                    <TypeBadge key={ty} type={ty} size="sm" />
                  ))}
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={onClear}
              className="shrink-0 rounded-full px-1.5 py-0.5 text-xs"
              style={{ color: "var(--color-ink-dim)", border: "1px solid var(--color-line-strong)" }}
              title={t("teamCov.clearSlot")}
            >
              ×
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <IconSearchSelect
              label={t("card.item")}
              value={state.item}
              options={ITEM_NAMES}
              placeholder="-"
              iconUrl={itemSpriteUrl}
              subtitle={(v) => getItemDescription(v) || undefined}
              translateKind="item"
              onChange={(v) => update("item", v)}
            />
            <IconSearchSelect
              label={t("card.ability")}
              value={state.ability}
              options={realAbilities.length ? realAbilities : ABILITY_NAMES}
              placeholder="-"
              isPreferred={(v) => realAbilities.includes(v)}
              subtitle={(v) => getAbilityDescription(v) || undefined}
              translateKind="ability"
              onChange={(v) => update("ability", v)}
            />
          </div>

          <div className="rounded-[10px] p-2" style={{ background: "rgba(0,0,0,0.18)", border: "1px solid var(--color-line)" }}>
            <p className="eyebrow mb-1.5 flex items-center justify-between">
              <span>{t("teamCov.statPoints")}</span>
              <span className="tabular" style={{ color: "var(--color-ink-dim)" }}>
                {totalSp}/{STAT_POINT_BUDGET}
              </span>
            </p>
            <div className="grid grid-cols-3 gap-x-2 gap-y-1.5 sm:grid-cols-6">
              {STAT_KEYS.map((key) => (
                <div key={key} className="flex flex-col items-center gap-0.5">
                  <span className="text-[0.62rem] font-bold" style={{ color: "var(--color-ink-soft)" }}>
                    {STAT_LABEL[key]}
                  </span>
                  <span className="tabular text-[0.68rem]" style={{ color: "var(--color-ink-dim)" }}>
                    {baseStats?.[key] ?? "-"}
                  </span>
                  <input
                    type="number"
                    min={0}
                    max={STAT_POINT_CAP}
                    value={evToSp(state.evs[key])}
                    onChange={(e) => setSp(key, Number(e.target.value) || 0)}
                    className="field-input tabular w-full px-1 py-0.5 text-center text-xs"
                  />
                  <span className="tabular text-[0.68rem] font-bold" style={{ color: "var(--color-ink-bright)" }}>
                    {computedStats[key] ?? "-"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="hidden md:block" style={{ background: "var(--color-line)" }} />

        {/* Right column: moves */}
        <div className="flex flex-col gap-1.5">
          <p className="eyebrow">{t("card.moves")}</p>
          {[0, 1, 2, 3].map((i) => (
            <IconSearchSelect
              key={i}
              label={t("card.move", { n: String(i + 1) })}
              value={state.moves[i] ?? ""}
              options={MOVE_NAMES}
              placeholder="-"
              iconUrl={moveIcon}
              subtitle={moveSubtitle}
              isPreferred={(v) => moveset.has(v)}
              translateKind="move"
              onChange={(v) => updateMove(i, v)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}