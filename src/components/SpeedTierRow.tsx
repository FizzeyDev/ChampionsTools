"use client";

import { useState } from "react";
import { pokemonSpriteUrl } from "@/lib/sprites";
import { useLocale } from "@/lib/i18n/LocaleContext";
import { STAT_POINT_CAP } from "@/lib/champions/statPoints";
import { isMegaSpecies, type SpeedRowConfig } from "@/lib/features/speedComparator";

interface SpeedTierRowProps {
  config: SpeedRowConfig;
  baseSpeed: number;
  finalSpeed: number;
  accent: "league" | "brick" | "neutral";
  onChange: (next: SpeedRowConfig) => void;
  onRemove?: () => void;
}

export default function SpeedTierRow({ config, baseSpeed, finalSpeed, accent, onChange, onRemove }: SpeedTierRowProps) {
  const { t } = useLocale();
  const [expanded, setExpanded] = useState(false);
  const art = pokemonSpriteUrl(config.species, true);
  const accentVar =
    accent === "league" ? "var(--color-league)" : accent === "brick" ? "var(--color-brick)" : "var(--color-ink-dim)";
  const megaLocked = isMegaSpecies(config.species);
  const hasActiveMods = config.stage !== 0 || config.natureMod !== "neutral" || config.scarf || config.tailwind;

  const update = (patch: Partial<SpeedRowConfig>) => onChange({ ...config, ...patch });

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
          <p className="truncate text-sm font-bold" style={{ color: "var(--color-ink-bright)" }} title={config.species}>
            {config.species}
          </p>
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
            value={config.sp}
            onChange={(e) => update({ sp: Number(e.target.value) })}
            className="flex-1"
          />
          <span className="tabular w-6 shrink-0 text-right text-[10px]" style={{ color: "var(--color-ink-dim)" }}>
            {config.sp}
          </span>
        </div>

        <div className="text-right">
          <p className="tabular text-lg font-extrabold leading-none" style={{ color: accentVar }}>
            {finalSpeed}
          </p>
          <p className="text-[9px]" style={{ color: "var(--color-ink-dim)" }}>
            {t("speed.total")}
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

      {expanded && (
        <div
          className="mt-2 flex flex-wrap items-center gap-2 border-t pt-2"
          style={{ borderColor: "var(--color-line)" }}
        >
          <select
            value={config.stage}
            onChange={(e) => update({ stage: Number(e.target.value) })}
            className="field-input px-1 py-0.5 text-[11px]"
            title={t("speed.stage")}
          >
            {Array.from({ length: 13 }, (_, i) => i - 6).map((v) => (
              <option key={v} value={v}>
                {v > 0 ? `+${v}` : v}
              </option>
            ))}
          </select>

          <div
            className="flex overflow-hidden rounded-[6px]"
            style={{ border: "1px solid var(--color-line-strong)" }}
            title={t("speed.nature")}
          >
            {(["hinder", "neutral", "boost"] as const).map((mod) => (
              <button
                key={mod}
                type="button"
                onClick={() => update({ natureMod: mod })}
                className="px-1.5 py-0.5 text-[11px] font-bold"
                style={{
                  background: config.natureMod === mod ? "var(--color-violet)" : "transparent",
                  color: config.natureMod === mod ? "var(--color-paper)" : "var(--color-ink-dim)",
                }}
              >
                {mod === "hinder" ? "−Vit" : mod === "boost" ? "+Vit" : "•"}
              </button>
            ))}
          </div>

          <button
            type="button"
            disabled={megaLocked}
            onClick={() => update({ scarf: !config.scarf })}
            title={megaLocked ? t("speed.scarfDisabledMega") : t("speed.scarf")}
            className="rounded-[6px] px-1.5 py-0.5 text-[10px] font-bold"
            style={{
              background: config.scarf && !megaLocked ? "var(--color-amber)" : "var(--color-panel-strong)",
              color: config.scarf && !megaLocked ? "var(--color-paper)" : "var(--color-ink-dim)",
              opacity: megaLocked ? 0.4 : 1,
              cursor: megaLocked ? "not-allowed" : "pointer",
            }}
          >
            {t("speed.scarfShort")}
          </button>

          <button
            type="button"
            onClick={() => update({ tailwind: !config.tailwind })}
            title={t("field.tailwind")}
            className="rounded-[6px] px-1.5 py-0.5 text-[10px] font-bold"
            style={{
              background: config.tailwind ? "var(--color-league)" : "var(--color-panel-strong)",
              color: config.tailwind ? "var(--color-paper)" : "var(--color-ink-dim)",
            }}
          >
            {t("speed.tailwindShort")}
          </button>
        </div>
      )}
    </div>
  );
}