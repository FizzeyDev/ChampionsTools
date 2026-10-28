"use client";

import { TERRAIN_VALUES, WEATHER_VALUES } from "@/lib/calc/gen";
import { useLocale } from "@/lib/i18n/LocaleContext";
import NotesPanel from "./NotesPanel";
import type { FieldState, SideState } from "@/lib/calc/types";

interface FieldBarProps {
  state: FieldState;
  onChange: (next: FieldState) => void;
}

type BoolSideKey = {
  [K in keyof SideState]: SideState[K] extends boolean ? K : never;
}[keyof SideState];

/** A titled group of controls, so the long list of options reads as a few
 * small, labelled families instead of one wall of checkboxes. */
function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <p className="text-[0.6rem] font-bold uppercase tracking-[0.12em]" style={{ color: "var(--color-ink-dim)" }}>
        {title}
      </p>
      {children}
    </div>
  );
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

  const toggle = (key: BoolSideKey, label: string) => (
    <label key={key} className="flex items-center gap-1.5 text-xs" style={{ color: "var(--color-ink-soft)" }}>
      <input
        type="checkbox"
        checked={!!side[key]}
        onChange={(e) => set(key, e.target.checked as never)}
        className="field-checkbox"
      />
      {label}
    </label>
  );

  return (
    <div
      className="flex flex-col gap-3 rounded-[10px] p-2.5"
      style={{
        background: "var(--color-panel-soft)",
        border: `1px solid ${accent}55`,
        ["--checkbox-accent" as string]: accent,
      }}
    >
      <p className="eyebrow" style={{ color: accent }}>
        {title}
      </p>

      <Group title={t("field.group.support")}>
        {toggle("isHelpingHand", t("field.helpingHand"))}
        {toggle("isBattery", t("field.battery"))}
        {toggle("isPowerSpot", t("field.powerSpot"))}
        {toggle("isSteelySpirit", t("field.steelySpirit"))}
        {toggle("isFlowerGift", t("field.flowerGift"))}
        {toggle("isFriendGuard", t("field.friendGuard"))}
        {toggle("isTailwind", t("field.tailwind"))}
      </Group>

      <Group title={t("field.group.screens")}>
        {toggle("isReflect", t("field.reflect"))}
        {toggle("isLightScreen", t("field.lightScreen"))}
        {toggle("isAuroraVeil", t("field.auroraVeil"))}
        {toggle("isProtected", t("field.protected"))}
      </Group>

      <Group title={t("field.group.hazards")}>
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
      </Group>

      <Group title={t("field.group.afflictions")}>
        {toggle("isSeeded", t("field.leechSeed"))}
        {toggle("isSaltCured", t("field.saltCure"))}
        {toggle("isForesight", t("field.foresight"))}
      </Group>
    </div>
  );
}

export default function FieldBar({ state, onChange }: FieldBarProps) {
  const { t } = useLocale();
  const update = <K extends keyof FieldState>(key: K, value: FieldState[K]) =>
    onChange({ ...state, [key]: value });

  const flag = (key: "isGravity" | "isMagicRoom" | "isWonderRoom" | "isBeadsOfRuin" | "isSwordOfRuin" | "isTabletsOfRuin" | "isVesselOfRuin", label: string) => (
    <label key={key} className="flex items-center gap-1.5 text-xs" style={{ color: "var(--color-ink-soft)" }}>
      <input type="checkbox" checked={state[key]} onChange={(e) => update(key, e.target.checked)} className="field-checkbox" />
      {label}
    </label>
  );

  const ruinCount = [state.isBeadsOfRuin, state.isSwordOfRuin, state.isTabletsOfRuin, state.isVesselOfRuin].filter(Boolean).length;

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

      <div className="grid grid-cols-2 gap-3">
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
          <span className="eyebrow">{t("field.targetOverride")}</span>
          <select
            value={state.spreadOverride}
            onChange={(e) => update("spreadOverride", e.target.value as typeof state.spreadOverride)}
            className="field-input px-3 py-2"
          >
            <option value="auto">{t("field.targetAuto")}</option>
            <option value="single">{t("field.targetSingle")}</option>
            <option value="spread">{t("field.targetSpread")}</option>
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="eyebrow">{t("field.weather")}</span>
          <select value={state.weather} onChange={(e) => update("weather", e.target.value)} className="field-input px-3 py-2">
            {WEATHER_VALUES.map((w) => (
              <option key={w} value={w}>
                {t(`weather.${w || "none"}`)}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="eyebrow">{t("field.terrain")}</span>
          <select value={state.terrain} onChange={(e) => update("terrain", e.target.value)} className="field-input px-3 py-2">
            {TERRAIN_VALUES.map((ter) => (
              <option key={ter} value={ter}>
                {t(`terrain.${ter || "none"}`)}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 border-t pt-3" style={{ borderColor: "var(--color-line)" }}>
        {flag("isGravity", t("field.gravity"))}
        {flag("isMagicRoom", t("field.magicRoom"))}
        {flag("isWonderRoom", t("field.wonderRoom"))}
      </div>

      <details className="mt-3 border-t pt-3" style={{ borderColor: "var(--color-line)" }} open={ruinCount > 0}>
        <summary className="eyebrow cursor-pointer select-none">
          {t("field.ruinTitle")}
          {ruinCount > 0 && ` · ${ruinCount}`}
        </summary>
        <div className="mt-2 grid grid-cols-2 gap-1.5">
          {flag("isBeadsOfRuin", t("field.beadsOfRuin"))}
          {flag("isSwordOfRuin", t("field.swordOfRuin"))}
          {flag("isTabletsOfRuin", t("field.tabletsOfRuin"))}
          {flag("isVesselOfRuin", t("field.vesselOfRuin"))}
        </div>
      </details>

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

      <NotesPanel />
    </section>
  );
}
