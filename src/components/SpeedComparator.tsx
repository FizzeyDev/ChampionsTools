"use client";

import { useMemo, useState } from "react";
import IconSearchSelect from "./IconSearchSelect";
import SpeedTierRow from "./SpeedTierRow";
import { pokemonSpriteUrl } from "@/lib/sprites";
import { useLocale } from "@/lib/i18n/LocaleContext";
import { SPECIES_NAMES } from "@/lib/gen";
import {
  baseSpeedOf,
  computeRowSpeed,
  defaultRowConfig,
  getClosestSpecies,
  getFastestSpecies,
  type SpeedRowConfig,
} from "@/lib/features/speedComparator";

type Mode = "fastest" | "closest";

export default function SpeedComparator() {
  const { t } = useLocale();
  const [reference, setReference] = useState("Garchomp");
  const [mode, setMode] = useState<Mode>("closest");
  const [count, setCount] = useState(5);
  const [trickRoom, setTrickRoom] = useState(false);
  const [addSpecies, setAddSpecies] = useState("");

  const [refConfig, setRefConfig] = useState<SpeedRowConfig>(() => defaultRowConfig("Garchomp"));
  const [rowConfigs, setRowConfigs] = useState<Record<string, SpeedRowConfig>>({});
  const [manualExtra, setManualExtra] = useState<string[]>([]);

  // Keep the reference row's species in sync when the picker changes.
  const handleReferenceChange = (species: string) => {
    setReference(species);
    setRefConfig((c) => ({ ...c, species }));
  };

  const autoSpecies = useMemo(() => {
    return mode === "fastest" ? getFastestSpecies(count, reference) : getClosestSpecies(reference, count);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, count, reference]);

  const comparisonSpecies = useMemo(() => {
    return [...autoSpecies, ...manualExtra.filter((s) => s !== reference && !autoSpecies.includes(s))];
  }, [autoSpecies, manualExtra, reference]);

  const getConfig = (species: string): SpeedRowConfig => rowConfigs[species] ?? defaultRowConfig(species);
  const setConfig = (species: string, next: SpeedRowConfig) =>
    setRowConfigs((prev) => ({ ...prev, [species]: next }));

  const refSpeed = computeRowSpeed(refConfig);
  const rows = comparisonSpecies
    .map((species) => {
      const config = getConfig(species);
      return { species, config, speed: computeRowSpeed(config) };
    })
    .sort((a, b) => (trickRoom ? a.speed - b.speed : b.speed - a.speed));

  return (
    <div className="flex flex-col gap-4">
      <div className="card-shell p-4">
        <div className="mb-3 flex flex-wrap items-end gap-3">
          <div className="min-w-[12rem] flex-1">
            <IconSearchSelect
              label={t("speed.reference")}
              value={reference}
              options={SPECIES_NAMES}
              allowEmpty={false}
              iconUrl={(v) => pokemonSpriteUrl(v, true)}
              translateKind="species"
              onChange={handleReferenceChange}
            />
          </div>

          <div className="flex flex-col gap-1">
            <span className="eyebrow">{t("speed.mode")}</span>
            <div className="flex overflow-hidden rounded-full" style={{ border: "1px solid var(--color-line-strong)" }}>
              {(["closest", "fastest"] as Mode[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMode(m)}
                  className="px-2.5 py-1.5 text-[0.68rem] font-bold uppercase tracking-wide"
                  style={{
                    background: mode === m ? "var(--color-violet)" : "var(--color-panel-soft)",
                    color: mode === m ? "var(--color-paper)" : "var(--color-ink-soft)",
                  }}
                >
                  {t(`speed.mode.${m}`)}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <span className="eyebrow">{t("speed.count")}</span>
            <div className="flex overflow-hidden rounded-full" style={{ border: "1px solid var(--color-line-strong)" }}>
              {[5, 10, 20].map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCount(c)}
                  className="px-2.5 py-1.5 text-[0.68rem] font-bold"
                  style={{
                    background: count === c ? "var(--color-league)" : "var(--color-panel-soft)",
                    color: count === c ? "var(--color-paper)" : "var(--color-ink-soft)",
                  }}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={() => setTrickRoom((v) => !v)}
            className="pill-btn"
            style={
              trickRoom
                ? { color: "var(--color-paper)", background: "var(--color-violet)", borderColor: "var(--color-violet)" }
                : undefined
            }
          >
            {t("speed.trickRoom")}
          </button>
        </div>

        {trickRoom && (
          <p className="mb-2 text-[11px]" style={{ color: "var(--color-ink-dim)" }}>
            {t("speed.trickRoomNote")}
          </p>
        )}

        <div className="flex items-end gap-2 border-t pt-3" style={{ borderColor: "var(--color-line)" }}>
          <div className="min-w-[12rem] flex-1">
            <IconSearchSelect
              label={t("speed.addManual")}
              value={addSpecies}
              options={SPECIES_NAMES}
              placeholder="—"
              iconUrl={(v) => pokemonSpriteUrl(v, true)}
              translateKind="species"
              onChange={(v) => {
                if (v && v !== reference && !manualExtra.includes(v)) {
                  setManualExtra((prev) => [...prev, v]);
                }
                setAddSpecies("");
              }}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[400px_1fr]">
        <div className="lg:sticky lg:top-20 lg:self-start">
          <p className="eyebrow mb-1.5" style={{ color: "var(--color-league)" }}>
            {t("speed.yourPokemon")}
          </p>
          <SpeedTierRow
            config={refConfig}
            baseSpeed={baseSpeedOf(reference)}
            finalSpeed={refSpeed}
            accent="league"
            onChange={setRefConfig}
          />
        </div>

        <div className="flex flex-col gap-2 lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto lg:pr-1">
          {rows.map(({ species, config, speed }) => (
            <SpeedTierRow
              key={species}
              config={config}
              baseSpeed={baseSpeedOf(species)}
              finalSpeed={speed}
              accent={manualExtra.includes(species) ? "brick" : "neutral"}
              onChange={(next) => setConfig(species, next)}
              onRemove={
                manualExtra.includes(species)
                  ? () => setManualExtra((prev) => prev.filter((s) => s !== species))
                  : undefined
              }
            />
          ))}
        </div>
      </div>
    </div>
  );
}