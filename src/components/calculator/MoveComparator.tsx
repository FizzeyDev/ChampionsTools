"use client";

import { useMemo, useState } from "react";
import PokemonCard from "./PokemonCard";
import FieldBar from "./FieldBar";
import IconSearchSelect from "../ui/IconSearchSelect";
import { moveInfo, pokemonSpriteUrl, typeIconUrl } from "@/lib/app/sprites";
import { useLocale } from "@/lib/i18n/LocaleContext";
import { MOVE_NAMES, STAT_KEYS } from "@/lib/calc/gen";
import { STAT_POINT_CAP } from "@/lib/champions/statPoints";
import { defaultField, defaultPokemon } from "@/lib/calc/types";
import type { StatsTable } from "@/lib/calc/types";
import {
  compareMoves,
  pickPool,
  sortEntries,
  summarize,
  type MoveCompareEntry,
} from "@/lib/features/moveComparator";

const COUNT_OPTIONS = [10, 20, 30];

function koColor(text: "none" | "possible" | "guaranteed"): string {
  if (text === "guaranteed") return "var(--color-danger)";
  if (text === "possible") return "var(--color-amber)";
  return "var(--color-ink-dim)";
}

export default function MoveComparator() {
  const { t } = useLocale();

  const [attacker, setAttacker] = useState<ReturnType<typeof defaultPokemon>>(() =>
    defaultPokemon("Garchomp")
  );
  const [move1, setMove1] = useState("");
  const [move2, setMove2] = useState("");
  const [field, setField] = useState(defaultField);
  const [defenderSp, setDefenderSp] = useState<Partial<StatsTable>>({});
  const [count, setCount] = useState(10);
  const [hidden, setHidden] = useState<string[]>([]);
  const [showFieldBar, setShowFieldBar] = useState(false);

  const hiddenSet = useMemo(() => new Set(hidden), [hidden]);

  const pool = useMemo(
    () => pickPool(count, attacker.species, hiddenSet),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [count, attacker.species, hiddenSet]
  );

  const entries = useMemo(() => {
    if (!move1 && !move2) return [];
    return compareMoves(attacker, move1, move2, field, defenderSp, pool);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attacker, move1, move2, field, defenderSp, pool]);

  const sorted = useMemo(() => sortEntries(entries), [entries]);
  const summary = useMemo(() => summarize(entries), [entries]);

  const swapMoves = () => {
    setMove1(move2);
    setMove2(move1);
  };

  const setSp = (key: (typeof STAT_KEYS)[number], value: number) => {
    const clamped = Math.max(0, Math.min(STAT_POINT_CAP, value));
    setDefenderSp((prev) => ({ ...prev, [key]: clamped }));
  };

  const hideSpecies = (species: string) => setHidden((prev) => [...prev, species]);
  const unhideAll = () => setHidden([]);

  const moveIcon = (v: string) => typeIconUrl(moveInfo(v).type);
  const moveSubtitle = (v: string) => {
    const info = moveInfo(v);
    return info.type ? `${info.type} · ${info.category} · ${info.bp ?? 0} BP` : undefined;
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="card-shell p-4">
        <p className="eyebrow mb-2" style={{ color: "var(--color-violet)" }}>
          {t("moveCmp.attacker")}
        </p>
        <PokemonCard role="attacker" accent="league" state={attacker} onChange={setAttacker} showMoves={false} />

        <div className="mt-4 grid grid-cols-1 items-end gap-2 border-t pt-3 sm:grid-cols-[1fr_auto_1fr]" style={{ borderColor: "var(--color-line)" }}>
          <IconSearchSelect
            label={t("moveCmp.move1")}
            value={move1}
            options={MOVE_NAMES}
            placeholder="-"
            iconUrl={moveIcon}
            subtitle={moveSubtitle}
            onChange={setMove1}
          />
          <button
            type="button"
            onClick={swapMoves}
            className="pill-btn mx-auto"
            title={t("moveCmp.swap")}
            style={{ color: "var(--color-violet)", borderColor: "rgba(159,83,236,0.4)", background: "var(--color-violet-soft)" }}
          >
            ⇄
          </button>
          <IconSearchSelect
            label={t("moveCmp.move2")}
            value={move2}
            options={MOVE_NAMES}
            placeholder="-"
            iconUrl={moveIcon}
            subtitle={moveSubtitle}
            onChange={setMove2}
          />
        </div>
      </div>

      <div className="card-shell p-4">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <p className="eyebrow" style={{ color: "var(--color-amber)" }}>
            {t("moveCmp.bulkSp")}
          </p>
          <button type="button" onClick={() => setShowFieldBar((s) => !s)} className="pill-btn text-[0.68rem]">
            {showFieldBar ? t("moveCmp.hideField") : t("moveCmp.showField")}
          </button>
        </div>
        <p className="mb-2 text-[11px]" style={{ color: "var(--color-ink-dim)" }}>
          {t("moveCmp.bulkSpHint")}
        </p>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
          {STAT_KEYS.map((key) => (
            <label key={key} className="flex flex-col gap-1 text-xs">
              <span style={{ color: "var(--color-ink-soft)" }}>{t(`stat.${key}`)}</span>
              <input
                type="number"
                min={0}
                max={STAT_POINT_CAP}
                value={defenderSp[key] ?? 0}
                onChange={(e) => setSp(key, Number(e.target.value) || 0)}
                className="field-input tabular px-1.5 py-1 text-right text-xs"
              />
            </label>
          ))}
        </div>
      </div>

      {showFieldBar && (
        <div className="card-shell p-4">
          <FieldBar state={field} onChange={setField} />
        </div>
      )}

      <div className="card-shell p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-col gap-1">
            <span className="eyebrow">{t("moveCmp.count")}</span>
            <div className="flex overflow-hidden rounded-full" style={{ border: "1px solid var(--color-line-strong)" }}>
              {COUNT_OPTIONS.map((c) => (
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
          {hidden.length > 0 && (
            <button type="button" onClick={unhideAll} className="pill-btn text-[0.68rem]">
              {t("moveCmp.unhideAll")} ({hidden.length})
            </button>
          )}
        </div>

        {(move1 || move2) && summary.total > 0 && (
          <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <div className="rounded-md p-2 text-center" style={{ background: "var(--color-league-soft)" }}>
              <p className="tabular text-lg font-bold" style={{ color: "var(--color-league)" }}>
                {summary.move1Kills}
              </p>
              <p className="text-[10px]" style={{ color: "var(--color-ink-dim)" }}>
                {t("moveCmp.move1")} {t("moveCmp.kos")}
              </p>
            </div>
            <div className="rounded-md p-2 text-center" style={{ background: "var(--color-brick-soft)" }}>
              <p className="tabular text-lg font-bold" style={{ color: "var(--color-brick)" }}>
                {summary.move2Kills}
              </p>
              <p className="text-[10px]" style={{ color: "var(--color-ink-dim)" }}>
                {t("moveCmp.move2")} {t("moveCmp.kos")}
              </p>
            </div>
            <div className="rounded-md p-2 text-center" style={{ background: "var(--color-panel-soft)" }}>
              <p className="tabular text-lg font-bold" style={{ color: "var(--color-ink-bright)" }}>
                {summary.move1Stronger} / {summary.move2Stronger}
              </p>
              <p className="text-[10px]" style={{ color: "var(--color-ink-dim)" }}>
                {t("moveCmp.strongerTally")}
              </p>
            </div>
            <div className="rounded-md p-2 text-center" style={{ background: "var(--color-panel-soft)" }}>
              <p className="tabular text-lg font-bold" style={{ color: "var(--color-ink-bright)" }}>
                {summary.total}
              </p>
              <p className="text-[10px]" style={{ color: "var(--color-ink-dim)" }}>
                {t("moveCmp.total")}
              </p>
            </div>
          </div>
        )}

        {!move1 && !move2 && (
          <p className="text-sm" style={{ color: "var(--color-ink-dim)" }}>
            {t("moveCmp.selectHint")}
          </p>
        )}

        <div className="flex flex-col gap-1.5">
          {sorted.map((entry) => (
            <MoveCompareRow key={entry.species} entry={entry} onHide={() => hideSpecies(entry.species)} />
          ))}
        </div>
      </div>
    </div>
  );
}

function MoveCompareRow({ entry, onHide }: { entry: MoveCompareEntry; onHide: () => void }) {
  const { t } = useLocale();
  const sprite = pokemonSpriteUrl(entry.species, true);
  const accent =
    entry.category === "move1"
      ? "var(--color-league)"
      : entry.category === "move2"
        ? "var(--color-brick)"
        : "var(--color-ink-dim)";

  const renderSide = (percent: [number, number] | null, ko: MoveCompareEntry["ko1"]) => {
    if (!percent) {
      return <span className="text-xs italic" style={{ color: "var(--color-ink-dim)" }}>{t("result.notCalculable")}</span>;
    }
    return (
      <div className="flex flex-col">
        <span className="tabular text-xs" style={{ color: "var(--color-ink-bright)" }}>
          {percent[0]}–{percent[1]}%
        </span>
        <span className="text-[10px] font-semibold" style={{ color: koColor(ko) }}>
          {t(`moveCmp.ko.${ko}`)}
        </span>
      </div>
    );
  };

  return (
    <div
      className="grid items-center gap-2 rounded-md px-2 py-1.5"
      style={{ gridTemplateColumns: "1.6rem 1fr 5.5rem 5.5rem auto", background: "var(--color-panel-soft)", borderLeft: `3px solid ${accent}` }}
    >
      {sprite ? (
        <img src={sprite} alt="" className="h-6 w-6 object-contain" onError={(e) => ((e.target as HTMLImageElement).style.visibility = "hidden")} />
      ) : (
        <span />
      )}
      <span className="truncate text-xs font-semibold" style={{ color: "var(--color-ink-bright)" }}>
        {entry.species}
      </span>
      {renderSide(entry.percent1, entry.ko1)}
      {renderSide(entry.percent2, entry.ko2)}
      <button
        type="button"
        onClick={onHide}
        title={t("moveCmp.hide")}
        className="justify-self-end rounded-full px-2 py-0.5 text-[10px]"
        style={{ border: "1px solid var(--color-line-strong)", color: "var(--color-ink-dim)" }}
      >
        {t("moveCmp.hide")}
      </button>
    </div>
  );
}