"use client";

import { useEffect, useMemo, useState } from "react";
import IconSearchSelect from "../ui/IconSearchSelect";
import SpeedTierRow from "./SpeedTierRow";
import SpeedGlobalPanels from "./SpeedGlobalPanels";
import Seg from "../ui/Seg";
import { pokemonSpriteUrl } from "@/lib/app/sprites";
import { useLocale } from "@/lib/i18n/LocaleContext";
import { SPECIES_NAMES } from "@/lib/calc/gen";
import { loadTeam } from "@/lib/features/savedTeam";
import { useNav } from "@/lib/app/nav";
import {
  baseSpeedOf,
  computeRowSpeed,
  defaultGlobal,
  defaultRowConfig,
  getClosestSpecies,
  getFastestSpecies,
  resolveRow,
  rowFromPokemon,
  type Side,
  type SpeedGlobal,
  type SpeedRowConfig,
} from "@/lib/features/speedComparator";

type Mode = "fastest" | "closest";

interface Entry {
  key: string;
  species: string;
  side: Side;
  /** auto = suggested by mode/count, manual = added by hand, team = imported. */
  kind: "auto" | "manual" | "team";
}

const keyOf = (side: Side, species: string) => `${side}:${species}`;

export default function SpeedComparator() {
  const { t } = useLocale();
  const { openSpecies } = useNav();
  const [reference, setReference] = useState("Garchomp");
  const [mode, setMode] = useState<Mode>("closest");
  const [count, setCount] = useState(5);
  const [addSpecies, setAddSpecies] = useState("");
  const [teamMsg, setTeamMsg] = useState(false);

  const [global, setGlobal] = useState<SpeedGlobal>(() => defaultGlobal());
  const [refConfig, setRefConfig] = useState<SpeedRowConfig>(() => defaultRowConfig("Garchomp"));
  const [configs, setConfigs] = useState<Record<string, SpeedRowConfig>>({});
  const [manual, setManual] = useState<Entry[]>([]);
  const [team, setTeam] = useState<Entry[]>([]);

  const handleReferenceChange = (species: string) => {
    setReference(species);
    setRefConfig((c) => ({ ...c, species }));
  };

  const autoEntries = useMemo<Entry[]>(() => {
    const list = mode === "fastest" ? getFastestSpecies(count, reference) : getClosestSpecies(reference, count);
    return list.map((species) => ({ key: keyOf("opp", species), species, side: "opp" as Side, kind: "auto" as const }));
  }, [mode, count, reference]);

  const entries = useMemo<Entry[]>(() => {
    const seen = new Set<string>();
    const out: Entry[] = [];
    for (const e of [...team, ...manual, ...autoEntries]) {
      if (seen.has(e.key)) continue;
      if (e.side === "opp" && e.species === reference && e.kind === "auto") continue;
      seen.add(e.key);
      out.push(e);
    }
    return out;
  }, [team, manual, autoEntries, reference]);

  const getConfig = (e: Entry): SpeedConfig => configs[e.key] ?? defaultRowConfig(e.species);
  const setConfig = (key: string, next: SpeedRowConfig) => setConfigs((prev) => ({ ...prev, [key]: next }));

  const speedOfEntry = (e: Entry) => computeRowSpeed(resolveRow(getConfig(e), e.side, global));
  const refResolved = resolveRow(refConfig, "mine", global);
  const refSpeed = computeRowSpeed(refResolved);

  // Row ORDER is only recomputed on deliberate actions (set of rows, global
  // panel, Trick Room, "Update order") - never while a slider is dragged,
  // otherwise the row you are editing would jump around under your cursor.
  const [order, setOrder] = useState<string[]>([]);
  const sortNow = () => {
    setOrder(
      [...entries]
        .sort((a, b) => (global.trickRoom ? speedOfEntry(a) - speedOfEntry(b) : speedOfEntry(b) - speedOfEntry(a)))
        .map((e) => e.key)
    );
  };
  useEffect(() => {
    sortNow();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entries, global]);

  const rows = order
    .map((k) => entries.find((e) => e.key === k))
    .filter((e): e is Entry => !!e)
    .map((e) => {
      const config = getConfig(e);
      const resolved = resolveRow(config, e.side, global);
      return { entry: e, config, resolved, speed: computeRowSpeed(resolved) };
    });

  const versusOf = (speed: number): "faster" | "slower" | "tie" => {
    if (speed === refSpeed) return "tie";
    const beforeYou = global.trickRoom ? speed < refSpeed : speed > refSpeed;
    return beforeYou ? "faster" : "slower";
  };

  const fasterCount = rows.filter((r) => versusOf(r.speed) === "faster").length;
  // Where the "You" marker goes in the (already sorted) list.
  const youIndex = rows.findIndex((r) =>
    global.trickRoom ? r.speed > refSpeed : r.speed < refSpeed
  );
  const markerAt = youIndex === -1 ? rows.length : youIndex;

  const importTeam = () => {
    const members = loadTeam().filter((p) => p.species);
    if (members.length === 0) {
      setTeamMsg(true);
      return;
    }
    setTeamMsg(false);
    const next: Entry[] = [];
    const cfgs: Record<string, SpeedRowConfig> = {};
    for (const p of members) {
      const key = keyOf("mine", p.species);
      next.push({ key, species: p.species, side: "mine", kind: "team" });
      cfgs[key] = rowFromPokemon(p);
    }
    setTeam(next);
    setConfigs((prev) => ({ ...prev, ...cfgs }));
  };

  const addEntry = (species: string, side: Side) => {
    if (!species) return;
    const key = keyOf(side, species);
    setManual((prev) => (prev.some((e) => e.key === key) ? prev : [...prev, { key, species, side, kind: "manual" }]));
  };

  const removeEntry = (e: Entry) => {
    if (e.kind === "team") setTeam((prev) => prev.filter((x) => x.key !== e.key));
    else setManual((prev) => prev.filter((x) => x.key !== e.key));
  };

  const resetAll = () => {
    setGlobal(defaultGlobal());
    setConfigs((prev) => {
      const next: Record<string, SpeedRowConfig> = {};
      for (const [k, c] of Object.entries(prev)) next[k] = { ...c, overrides: {} };
      return next;
    });
    setRefConfig((c) => ({ ...c, overrides: {} }));
  };

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
            <Seg
              value={mode}
              onChange={setMode}
              options={[
                { value: "closest" as Mode, label: t("speed.mode.closest") },
                { value: "fastest" as Mode, label: t("speed.mode.fastest") },
              ]}
            />
          </div>

          <div className="flex flex-col gap-1">
            <span className="eyebrow">{t("speed.count")}</span>
            <Seg
              accent="var(--color-league)"
              value={count}
              onChange={setCount}
              options={[5, 10, 20].map((c) => ({ value: c, label: String(c) }))}
            />
          </div>

          <button type="button" onClick={importTeam} className="pill-btn">
            {t("speed.importTeam")}
          </button>

          <button
            type="button"
            onClick={sortNow}
            className="pill-btn"
            title={t("speed.updateOrderHint")}
            style={{ color: "var(--color-amber)", borderColor: "rgba(255,215,64,0.4)", background: "var(--color-amber-soft)" }}
          >
            🔄 {t("speed.updateOrder")}
          </button>
        </div>

        {teamMsg && (
          <p className="mb-2 text-[11px]" style={{ color: "var(--color-amber)" }}>
            {t("speed.importTeamEmpty")}
          </p>
        )}

        <SpeedGlobalPanels value={global} onChange={setGlobal} onResetAll={resetAll} />

        {global.trickRoom && (
          <p className="mt-2 text-[11px]" style={{ color: "var(--color-ink-dim)" }}>
            {t("speed.trickRoomNote")}
          </p>
        )}

        <div className="mt-3 flex flex-wrap items-end gap-2 border-t pt-3" style={{ borderColor: "var(--color-line)" }}>
          <div className="min-w-[12rem] flex-1">
            <IconSearchSelect
              label={t("speed.addManual")}
              value={addSpecies}
              options={SPECIES_NAMES}
              placeholder="-"
              iconUrl={(v) => pokemonSpriteUrl(v, true)}
              translateKind="species"
              onChange={setAddSpecies}
            />
          </div>
          <button type="button" className="pill-btn" disabled={!addSpecies} onClick={() => { addEntry(addSpecies, "opp"); setAddSpecies(""); }}>
            + {t("speed.addOpp")}
          </button>
          <button type="button" className="pill-btn" disabled={!addSpecies} onClick={() => { addEntry(addSpecies, "mine"); setAddSpecies(""); }}>
            + {t("speed.addMine")}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[400px_1fr]">
        <div className="lg:sticky lg:top-20 lg:self-start">
          <p className="eyebrow mb-1.5" style={{ color: "var(--color-league)" }}>
            {t("speed.yourPokemon")}
          </p>
          <SpeedTierRow
            config={refConfig}
            resolved={refResolved}
            baseSpeed={baseSpeedOf(reference)}
            finalSpeed={refSpeed}
            accent="league"
            mine
            onChange={setRefConfig}
            onOpenSheet={openSpecies}
          />
          <p className="mt-2 text-xs font-bold" style={{ color: "var(--color-ink-soft)" }}>
            {t("speed.summary").replace("{n}", String(fasterCount)).replace("{total}", String(rows.length))}
          </p>
        </div>

        <div className="flex flex-col gap-2 lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto lg:pr-1">
          {rows.map(({ entry, config, resolved, speed }, i) => (
            <div key={entry.key} className="flex flex-col gap-2">
              {i === markerAt && <YouMarker speed={refSpeed} label={t("speed.youAreHere")} />}
              <SpeedTierRow
                config={config}
                resolved={resolved}
                baseSpeed={baseSpeedOf(entry.species)}
                finalSpeed={speed}
                accent={entry.side === "mine" ? "league" : entry.kind === "manual" ? "brick" : "neutral"}
                versus={versusOf(speed)}
                mine={entry.side === "mine"}
                onChange={(next) => setConfig(entry.key, next)}
                onRemove={entry.kind === "auto" ? undefined : () => removeEntry(entry)}
                onOpenSheet={openSpecies}
              />
            </div>
          ))}
          {markerAt === rows.length && <YouMarker speed={refSpeed} label={t("speed.youAreHere")} />}
        </div>
      </div>
    </div>
  );
}

type SpeedConfig = SpeedRowConfig;

function YouMarker({ speed, label }: { speed: number; label: string }) {
  return (
    <div
      className="flex items-center gap-2 rounded-[8px] px-3 py-1.5 text-xs font-extrabold uppercase tracking-wide"
      style={{ background: "var(--color-league-soft)", color: "var(--color-league)", border: "1px dashed var(--color-league)" }}
    >
      <span>▶ {label}</span>
      <span className="tabular">{speed}</span>
    </div>
  );
}
