"use client";

import { TERRAIN_VALUES, WEATHER_VALUES } from "@/lib/gen";
import { useLocale } from "@/lib/i18n/LocaleContext";
import type { FieldState, SideState } from "@/lib/types";

interface FieldBarProps {
  state: FieldState;
  onChange: (next: FieldState) => void;
}

function SideControls({
  side,
  onChange,
  accent,
  title,
}: {
  side: SideState;
  onChange: (next: SideState) => void;
  accent: string;
  title: string;
}) {
  const { t } = useLocale();
  const set = <K extends keyof SideState>(key: K, value: SideState[K]) =>
    onChange({ ...side, [key]: value });

  const toggle = (key: keyof SideState, label: string) => (
    <label className="flex items-center gap-1.5 text-xs" style={{ color: "var(--color-ink-soft)" }}>
      <input
        type="checkbox"
        checked={side[key] as boolean}
        onChange={(e) => set(key, e.target.checked as never)}
        className="field-checkbox"
      />
      {label}
    </label>
  );

  return (
    <div
      className="rounded-[10px] p-2.5"
      style={{
        background: "var(--color-panel-soft)",
        border: `1px solid ${accent}55`,
        ["--checkbox-accent" as string]: accent,
      }}
    >
      <p className="eyebrow mb-2" style={{ color: accent }}>
        {title}
      </p>
      <div className="flex flex-col gap-1">
        {toggle("isSR", t("field.stealthRock"))}
        <label className="flex items-center justify-between gap-2 text-xs" style={{ color: "var(--color-ink-soft)" }}>
          <span>{t("field.spikes")}</span>
          <select
            value={side.spikes}
            onChange={(e) => set("spikes", Number(e.target.value) as never)}
            className="field-input px-1.5 py-0.5 text-xs"
          >
            {[0, 1, 2, 3].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
        {toggle("isReflect", t("field.reflect"))}
        {toggle("isLightScreen", t("field.lightScreen"))}
        {toggle("isAuroraVeil", t("field.auroraVeil"))}
        {toggle("isProtected", t("field.protected"))}
        {toggle("isSeeded", t("field.leechSeed"))}
        {toggle("isSaltCured", t("field.saltCure"))}
        {toggle("isForesight", t("field.foresight"))}
        {toggle("isTailwind", t("field.tailwind"))}
        {toggle("isHelpingHand", t("field.helpingHand"))}
        {toggle("isFriendGuard", t("field.friendGuard"))}
      </div>
    </div>
  );
}

export default function FieldBar({ state, onChange }: FieldBarProps) {
  const { t } = useLocale();
  const update = <K extends keyof FieldState>(key: K, value: FieldState[K]) =>
    onChange({ ...state, [key]: value });

  return (
    <section
      className="card-shell p-4"
      style={{
        borderColor: "rgba(159,83,236,0.35)",
        boxShadow: "var(--shadow-md), 0 0 32px var(--color-violet-glow)",
        ["--checkbox-accent" as string]: "var(--color-violet)",
      }}
    >
      <h2
        className="heading mb-3 border-b pb-3 text-lg"
        style={{ borderColor: "var(--color-line)", color: "var(--color-violet)", textShadow: "0 0 20px var(--color-violet-glow)" }}
      >
        {t("field.title")}
      </h2>

      <div className="flex flex-col gap-3">
        <label className="flex flex-col gap-1 text-sm">
          <span className="eyebrow">{t("field.format")}</span>
          <select
            value={state.gameType}
            onChange={(e) => update("gameType", e.target.value as FieldState["gameType"])}
            className="field-input px-3 py-2"
          >
            <option value="Singles">{t("field.singles")}</option>
            <option value="Doubles">{t("field.doubles")}</option>
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="eyebrow">{t("field.weather")}</span>
          <select
            value={state.weather}
            onChange={(e) => update("weather", e.target.value)}
            className="field-input px-3 py-2"
          >
            {WEATHER_VALUES.map((w) => (
              <option key={w} value={w}>
                {t(`weather.${w || "none"}`)}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="eyebrow">{t("field.terrain")}</span>
          <select
            value={state.terrain}
            onChange={(e) => update("terrain", e.target.value)}
            className="field-input px-3 py-2"
          >
            {TERRAIN_VALUES.map((ter) => (
              <option key={ter} value={ter}>
                {t(`terrain.${ter || "none"}`)}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="eyebrow">{t("field.targetOverride")}</span>
          <select
            value={state.spreadOverride}
            onChange={(e) =>
              update("spreadOverride", e.target.value as typeof state.spreadOverride)
            }
            className="field-input px-3 py-2"
          >
            <option value="auto">{t("field.targetAuto")}</option>
            <option value="single">{t("field.targetSingle")}</option>
            <option value="spread">{t("field.targetSpread")}</option>
          </select>
        </label>

        <div className="grid grid-cols-3 gap-x-2 gap-y-1.5">
          <label className="flex items-center gap-1.5 text-xs" style={{ color: "var(--color-ink-soft)" }}>
            <input type="checkbox" checked={state.isGravity} onChange={(e) => update("isGravity", e.target.checked)} className="field-checkbox" />
            {t("field.gravity")}
          </label>
          <label className="flex items-center gap-1.5 text-xs" style={{ color: "var(--color-ink-soft)" }}>
            <input
              type="checkbox"
              checked={state.isMagicRoom}
              onChange={(e) => update("isMagicRoom", e.target.checked)}
              className="field-checkbox"
            />
            {t("field.magicRoom")}
          </label>
          <label className="flex items-center gap-1.5 text-xs" style={{ color: "var(--color-ink-soft)" }}>
            <input
              type="checkbox"
              checked={state.isWonderRoom}
              onChange={(e) => update("isWonderRoom", e.target.checked)}
              className="field-checkbox"
            />
            {t("field.wonderRoom")}
          </label>
        </div>
      </div>

      <div className="mt-4 border-t pt-3" style={{ borderColor: "var(--color-line)" }}>
        <p className="eyebrow mb-1.5">{t("field.ruinTitle")}</p>
        <div className="flex flex-col gap-1.5">
          <label className="flex items-center gap-1.5 text-sm" style={{ color: "var(--color-ink-soft)" }}>
            <input
              type="checkbox"
              checked={state.isBeadsOfRuin}
              onChange={(e) => update("isBeadsOfRuin", e.target.checked)}
              className="field-checkbox"
            />
            {t("field.beadsOfRuin")}
          </label>
          <label className="flex items-center gap-1.5 text-sm" style={{ color: "var(--color-ink-soft)" }}>
            <input
              type="checkbox"
              checked={state.isSwordOfRuin}
              onChange={(e) => update("isSwordOfRuin", e.target.checked)}
              className="field-checkbox"
            />
            {t("field.swordOfRuin")}
          </label>
          <label className="flex items-center gap-1.5 text-sm" style={{ color: "var(--color-ink-soft)" }}>
            <input
              type="checkbox"
              checked={state.isTabletsOfRuin}
              onChange={(e) => update("isTabletsOfRuin", e.target.checked)}
              className="field-checkbox"
            />
            {t("field.tabletsOfRuin")}
          </label>
          <label className="flex items-center gap-1.5 text-sm" style={{ color: "var(--color-ink-soft)" }}>
            <input
              type="checkbox"
              checked={state.isVesselOfRuin}
              onChange={(e) => update("isVesselOfRuin", e.target.checked)}
              className="field-checkbox"
            />
            {t("field.vesselOfRuin")}
          </label>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 border-t pt-3" style={{ borderColor: "var(--color-line)" }}>
        <SideControls
          side={state.attackerSide}
          onChange={(s) => update("attackerSide", s)}
          accent="var(--color-league)"
          title={t("card.attacker")}
        />
        <SideControls
          side={state.defenderSide}
          onChange={(s) => update("defenderSide", s)}
          accent="var(--color-brick)"
          title={t("card.defender")}
        />
      </div>
    </section>
  );
}