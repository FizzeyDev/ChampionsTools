"use client";

import { TERRAIN_VALUES, WEATHER_VALUES } from "@/lib/calc/gen";
import { useLocale } from "@/lib/i18n/LocaleContext";
import { SPREAD_PRESETS, type Scope, type SpeedGlobal } from "@/lib/features/speedComparator";
import { STAT_POINT_CAP } from "@/lib/champions/statPoints";
import Seg from "../ui/Seg";

interface Props {
  value: SpeedGlobal;
  onChange: (next: SpeedGlobal) => void;
  onResetAll: () => void;
}

function ScopePicker({ value, onChange }: { value: Scope; onChange: (s: Scope) => void }) {
  const { t } = useLocale();
  return (
    <div className="flex items-center gap-2">
      <span className="eyebrow">{t("speed.scope.label")}</span>
      <Seg
        small
        value={value}
        onChange={onChange}
        options={[
          { value: "all" as Scope, label: t("speed.scope.all") },
          { value: "mine" as Scope, label: t("speed.scope.mine") },
          { value: "opp" as Scope, label: t("speed.scope.opp") },
        ]}
      />
    </div>
  );
}

export default function SpeedGlobalPanels({ value, onChange, onResetAll }: Props) {
  const { t } = useLocale();
  const set = (patch: Partial<SpeedGlobal>) => onChange({ ...value, ...patch });
  const setSpread = (patch: Partial<SpeedGlobal["spread"]>) =>
    onChange({ ...value, spread: { ...value.spread, ...patch } });

  const triOptions = [
    { value: null as boolean | null, label: t("speed.unset") },
    { value: true as boolean | null, label: t("speed.on") },
    { value: false as boolean | null, label: t("speed.off") },
  ];

  return (
    <div className="grid gap-3 lg:grid-cols-2">
      {/* ------------------------------------------------ global context */}
      <div className="rounded-[10px] p-3" style={{ background: "var(--color-panel-soft)", border: "1px solid rgba(159,83,236,0.35)" }}>
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <p className="eyebrow" style={{ color: "var(--color-violet)" }}>
            {t("speed.context.title")}
          </p>
          <ScopePicker value={value.contextScope} onChange={(contextScope) => set({ contextScope })} />
        </div>
        <p className="mb-2 text-[11px]" style={{ color: "var(--color-ink-dim)" }}>
          {t("speed.context.hint")}
        </p>
        <div className="flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1">
            <span className="eyebrow">{t("speed.weather")}</span>
            <select
              value={value.weather}
              onChange={(e) => set({ weather: e.target.value })}
              className="field-input px-2 py-1.5 text-sm"
            >
              {WEATHER_VALUES.map((w) => (
                <option key={w} value={w}>
                  {t(`weather.${w || "none"}`)}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="eyebrow">{t("speed.terrain")}</span>
            <select
              value={value.terrain}
              onChange={(e) => set({ terrain: e.target.value })}
              className="field-input px-2 py-1.5 text-sm"
            >
              {TERRAIN_VALUES.map((ter) => (
                <option key={ter} value={ter}>
                  {t(`terrain.${ter || "none"}`)}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            onClick={() => set({ tailwind: !value.tailwind })}
            className="pill-btn"
            style={
              value.tailwind
                ? { color: "var(--color-paper)", background: "var(--color-league)", borderColor: "var(--color-league)" }
                : undefined
            }
          >
            {t("field.tailwind")}
          </button>
          <button
            type="button"
            onClick={() => set({ trickRoom: !value.trickRoom })}
            className="pill-btn"
            style={
              value.trickRoom
                ? { color: "var(--color-paper)", background: "var(--color-violet)", borderColor: "var(--color-violet)" }
                : undefined
            }
          >
            {t("speed.trickRoom")}
          </button>
        </div>
      </div>

      {/* ----------------------------------------------- reference spread */}
      <div className="rounded-[10px] p-3" style={{ background: "var(--color-panel-soft)", border: "1px solid rgba(255,157,0,0.35)" }}>
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <p className="eyebrow" style={{ color: "var(--color-brick)" }}>
            {t("speed.spread.title")}
          </p>
          <ScopePicker value={value.spreadScope} onChange={(spreadScope) => set({ spreadScope })} />
        </div>
        <p className="mb-2 text-[11px]" style={{ color: "var(--color-ink-dim)" }}>
          {t("speed.spread.hint")}
        </p>

        <div className="mb-2 flex flex-wrap items-center gap-1.5">
          <span className="eyebrow">{t("speed.preset.label")}</span>
          {SPREAD_PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => onChange({ ...value, spread: { ...p.spread } })}
              className="rounded-[6px] px-2 py-1 text-[0.65rem] font-bold"
              style={{ background: "var(--color-panel-strong)", color: "var(--color-ink-soft)" }}
            >
              {t(`speed.preset.${p.id}`)}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1">
            <span className="eyebrow">{t("speed.spread.sp")}</span>
            <select
              value={value.spread.sp === null ? "" : String(value.spread.sp)}
              onChange={(e) => setSpread({ sp: e.target.value === "" ? null : Number(e.target.value) })}
              className="field-input px-2 py-1.5 text-sm"
            >
              <option value="">{t("speed.unset")}</option>
              {Array.from({ length: STAT_POINT_CAP + 1 }, (_, i) => (
                <option key={i} value={i}>
                  {i}
                </option>
              ))}
            </select>
          </label>

          <div className="flex flex-col gap-1">
            <span className="eyebrow">{t("speed.spread.nature")}</span>
            <Seg
              small
              accent="var(--color-brick)"
              value={value.spread.natureMod ?? "unset"}
              onChange={(v) => setSpread({ natureMod: v === "unset" ? null : v })}
              options={[
                { value: "unset" as const, label: t("speed.unset") },
                { value: "hinder" as const, label: t("speed.nat.hinder") },
                { value: "neutral" as const, label: "•" },
                { value: "boost" as const, label: t("speed.nat.boost") },
              ]}
            />
          </div>

          <label className="flex flex-col gap-1">
            <span className="eyebrow">{t("speed.spread.stage")}</span>
            <select
              value={value.spread.stage === null ? "" : String(value.spread.stage)}
              onChange={(e) => setSpread({ stage: e.target.value === "" ? null : Number(e.target.value) })}
              className="field-input px-2 py-1.5 text-sm"
            >
              <option value="">{t("speed.unset")}</option>
              {Array.from({ length: 13 }, (_, i) => i - 6).map((v) => (
                <option key={v} value={v}>
                  {v > 0 ? `+${v}` : v}
                </option>
              ))}
            </select>
          </label>

          <div className="flex flex-col gap-1">
            <span className="eyebrow">{t("speed.spread.scarf")}</span>
            <Seg small accent="var(--color-brick)" value={value.spread.scarf} onChange={(scarf) => setSpread({ scarf })} options={triOptions} />
          </div>

          <div className="flex flex-col gap-1">
            <span className="eyebrow">{t("speed.spread.paralysis")}</span>
            <Seg
              small
              accent="var(--color-brick)"
              value={value.spread.paralysis}
              onChange={(paralysis) => setSpread({ paralysis })}
              options={triOptions}
            />
          </div>
        </div>
      </div>

      <div className="lg:col-span-2">
        <button type="button" onClick={onResetAll} className="pill-btn" style={{ color: "var(--color-danger)" }}>
          ↺ {t("speed.resetAll")}
        </button>
      </div>
    </div>
  );
}
