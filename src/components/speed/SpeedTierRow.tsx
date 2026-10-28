"use client";

import { useState } from "react";
import { pokemonSpriteUrl } from "@/lib/app/sprites";
import { useLocale } from "@/lib/i18n/LocaleContext";
import { STAT_POINT_CAP } from "@/lib/champions/statPoints";
import {
  SPEED_ABILITIES,
  isMegaSpecies,
  speedAbilitiesOf,
  type OverrideKey,
  type ResolvedRow,
  type SpeedRowConfig,
} from "@/lib/features/speedComparator";
import { toFrench } from "@/lib/champions/gameTranslations";
import Seg from "../ui/Seg";

interface SpeedTierRowProps {
  config: SpeedRowConfig;
  /** The row as it actually applies after the global panels are merged in. */
  resolved: ResolvedRow;
  baseSpeed: number;
  finalSpeed: number;
  accent: "league" | "brick" | "neutral";
  /** How this row compares to the reference Pokémon. */
  versus?: "faster" | "slower" | "tie";
  mine?: boolean;
  onChange: (next: SpeedRowConfig) => void;
  onRemove?: () => void;
  onOpenSheet?: (species: string) => void;
}

export default function SpeedTierRow({
  config,
  resolved,
  baseSpeed,
  finalSpeed,
  accent,
  versus,
  mine,
  onChange,
  onRemove,
  onOpenSheet,
}: SpeedTierRowProps) {
  const { t, locale } = useLocale();
  const [expanded, setExpanded] = useState(false);
  const art = pokemonSpriteUrl(config.species, true);
  const accentVar =
    accent === "league" ? "var(--color-league)" : accent === "brick" ? "var(--color-brick)" : "var(--color-ink-dim)";
  const megaLocked = isMegaSpecies(config.species);
  const ownAbilities = speedAbilitiesOf(config.species);
  const hasOverrides = Object.values(config.overrides).some(Boolean);
  const hasActiveMods =
    resolved.stage !== 0 ||
    resolved.natureMod !== "neutral" ||
    resolved.scarf ||
    resolved.tailwind ||
    resolved.paralysis ||
    resolved.ability !== "";

  const update = (patch: Partial<SpeedRowConfig>, keys: OverrideKey[] = []) => {
    const overrides = { ...config.overrides };
    for (const k of keys) overrides[k] = true;
    onChange({ ...config, ...patch, overrides });
  };

  const abilityKind = resolved.ability ? SPEED_ABILITIES[resolved.ability] : undefined;
  const localAbility = (a: string) => (locale === "fr" ? toFrench("ability", a) : a);
  const versusColor =
    versus === "faster" ? "var(--color-danger)" : versus === "slower" ? "var(--color-success)" : "var(--color-amber)";
  const versusIcon = versus === "faster" ? "▲" : versus === "slower" ? "▼" : "＝";

  return (
    <div
      className="rounded-[10px] p-2.5"
      style={{
        background: "var(--color-panel-soft)",
        border: `1px solid ${accent === "neutral" ? "var(--color-line)" : accentVar}`,
      }}
    >
      <div className="flex items-center gap-2">
        {art && <img src={art} alt="" className="h-9 w-9 shrink-0 object-contain" />}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => onOpenSheet?.(config.species)}
              className="truncate text-left text-sm font-bold hover:underline"
              style={{ color: "var(--color-ink-bright)" }}
              title={config.species}
            >
              {locale === "fr" ? toFrench("species", config.species) : config.species}
            </button>
            {mine && (
              <span
                className="rounded-[5px] px-1 py-px text-[0.55rem] font-bold uppercase"
                style={{ background: "var(--color-league-soft)", color: "var(--color-league)" }}
              >
                {t("speed.mine")}
              </span>
            )}
          </div>
          <p className="tabular text-[10px]" style={{ color: "var(--color-ink-dim)" }}>
            {t("speed.base")} {baseSpeed}
          </p>
        </div>

        <div className="flex flex-1 items-center gap-1.5" style={{ maxWidth: "9rem" }}>
          <input
            type="range"
            min={0}
            max={STAT_POINT_CAP}
            step={1}
            value={resolved.sp}
            onChange={(e) => update({ sp: Number(e.target.value) }, ["sp"])}
            className="flex-1"
            aria-label={t("speed.spread.sp")}
          />
          <span className="tabular w-6 shrink-0 text-right text-[10px]" style={{ color: "var(--color-ink-dim)" }}>
            {resolved.sp}
          </span>
        </div>

        <div className="text-right">
          <p className="tabular text-lg font-extrabold leading-none" style={{ color: accentVar }}>
            {finalSpeed}
          </p>
          <p className="text-[9px]" style={{ color: "var(--color-ink-dim)" }}>
            {versus ? (
              <span style={{ color: versusColor }} title={t(`speed.vsYou.${versus}`)}>
                {versusIcon} {t(`speed.vsYou.${versus}`)}
              </span>
            ) : (
              t("speed.total")
            )}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="shrink-0 rounded-[6px] px-1.5 py-1 text-xs"
          style={{
            color: hasActiveMods ? "var(--color-amber)" : "var(--color-ink-dim)",
            background: expanded ? "var(--color-panel-strong)" : "transparent",
          }}
          title={t("speed.expand")}
        >
          {hasActiveMods && !expanded ? "●" : expanded ? "▴" : "▾"}
        </button>

        {onRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="shrink-0 rounded-[6px] px-1.5 py-1 text-xs"
            style={{ color: "var(--color-ink-dim)" }}
            title={t("speed.remove")}
          >
            ✕
          </button>
        )}
      </div>

      {(resolved.badges.length > 0 || hasOverrides) && (
        <div className="mt-1.5 flex flex-wrap items-center gap-1">
          {resolved.badges.map((b) => (
            <span
              key={b.id}
              title={b.origin === "global" ? t("speed.fromGlobal") : t("speed.ability")}
              className="rounded-[5px] px-1.5 py-px text-[0.6rem] font-bold"
              style={
                b.origin === "global"
                  ? { background: "var(--color-violet-soft)", color: "var(--color-violet)" }
                  : { background: "var(--color-amber-soft)", color: "var(--color-amber)" }
              }
            >
              {b.origin === "ability"
                ? `${localAbility(b.text)}${resolved.abilitySource === "auto" ? ` · ${t("speed.ability.autoTag")}` : ""}`
                : b.text}
            </span>
          ))}
          {hasOverrides && (
            <button
              type="button"
              onClick={() => onChange({ ...config, overrides: {} })}
              className="rounded-[5px] px-1.5 py-px text-[0.6rem] font-bold"
              style={{ background: "var(--color-panel-strong)", color: "var(--color-ink-soft)" }}
              title={t("speed.resetRow")}
            >
              ↺
            </button>
          )}
        </div>
      )}

      {expanded && (
        <div
          className="mt-2 flex flex-wrap items-center gap-2 border-t pt-2"
          style={{ borderColor: "var(--color-line)" }}
        >
          <select
            value={resolved.stage}
            onChange={(e) => update({ stage: Number(e.target.value) }, ["stage"])}
            className="field-input px-1 py-0.5 text-[11px]"
            title={t("speed.stage")}
          >
            {Array.from({ length: 13 }, (_, i) => i - 6).map((v) => (
              <option key={v} value={v}>
                {v > 0 ? `+${v}` : v}
              </option>
            ))}
          </select>

          <Seg
            small
            value={resolved.natureMod}
            onChange={(natureMod) => update({ natureMod }, ["natureMod"])}
            options={[
              { value: "hinder" as const, label: "−Vit" },
              { value: "neutral" as const, label: "•" },
              { value: "boost" as const, label: "+Vit" },
            ]}
          />

          <button
            type="button"
            disabled={megaLocked}
            onClick={() => update({ scarf: !resolved.scarf }, ["scarf"])}
            title={megaLocked ? t("speed.scarfDisabledMega") : t("speed.scarf")}
            className="rounded-[6px] px-1.5 py-0.5 text-[10px] font-bold"
            style={{
              background: resolved.scarf && !megaLocked ? "var(--color-amber)" : "var(--color-panel-strong)",
              color: resolved.scarf && !megaLocked ? "var(--color-paper)" : "var(--color-ink-dim)",
              opacity: megaLocked ? 0.4 : 1,
              cursor: megaLocked ? "not-allowed" : "pointer",
            }}
          >
            {t("speed.scarfShort")}
          </button>

          <button
            type="button"
            onClick={() => update({ tailwind: !resolved.tailwind }, ["tailwind"])}
            title={t("field.tailwind")}
            className="rounded-[6px] px-1.5 py-0.5 text-[10px] font-bold"
            style={{
              background: resolved.tailwind ? "var(--color-league)" : "var(--color-panel-strong)",
              color: resolved.tailwind ? "var(--color-paper)" : "var(--color-ink-dim)",
            }}
          >
            {t("speed.tailwindShort")}
          </button>

          <button
            type="button"
            onClick={() => update({ paralysis: !resolved.paralysis }, ["paralysis"])}
            title={t("speed.paralysis")}
            className="rounded-[6px] px-1.5 py-0.5 text-[10px] font-bold"
            style={{
              background: resolved.paralysis ? "var(--color-amber)" : "var(--color-panel-strong)",
              color: resolved.paralysis ? "var(--color-paper)" : "var(--color-ink-dim)",
            }}
          >
            {t("speed.paraShort")}
          </button>

          <div className="flex w-full flex-wrap items-center gap-2">
            <span className="eyebrow">{t("speed.ability")}</span>
            {ownAbilities.length === 0 ? (
              <span className="text-[11px] italic" style={{ color: "var(--color-ink-dim)" }}>
                {t("speed.ability.noSpeedAbility")}
              </span>
            ) : (
              <>
                <select
                  value={config.abilityChoice}
                  onChange={(e) => onChange({ ...config, abilityChoice: e.target.value })}
                  className="field-input px-1 py-0.5 text-[11px]"
                >
                  <option value="auto">{t("speed.ability.auto")}</option>
                  <option value="none">{t("speed.ability.none")}</option>
                  {ownAbilities.map((a) => (
                    <option key={a} value={a}>
                      {localAbility(a)}
                    </option>
                  ))}
                </select>
                {abilityKind === "manual" && (
                  <label className="flex items-center gap-1.5 text-[11px]" style={{ color: "var(--color-ink-soft)" }}>
                    <input
                      type="checkbox"
                      checked={config.abilityOn}
                      onChange={(e) => onChange({ ...config, abilityOn: e.target.checked })}
                      className="field-checkbox"
                    />
                    {t(`speed.ability.hint.${resolved.ability}`)}
                  </label>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
