"use client";

import { useMemo, useState } from "react";
import { computeStats, swapSides } from "@/lib/calc/calcEngine";
import {
  findKoSpreads,
  findSpeedSpread,
  findSurviveSpreads,
  statsForMove,
  type NatureColumn,
} from "@/lib/features/spreadOptimizer";
import { spToEv } from "@/lib/champions/statPoints";
import { toFrench, toFrenchNature } from "@/lib/champions/gameTranslations";
import { useLocale } from "@/lib/i18n/LocaleContext";
import type { FieldState, PokemonState } from "@/lib/calc/types";
import Seg from "../ui/Seg";
import PokemonCard from "./PokemonCard";

type Goal = "survive" | "ko" | "speed";
type Dir = "forward" | "backward";

const THRESHOLDS = [1, 15 / 16, 0.5, 1 / 16];

interface Props {
  attacker: PokemonState;
  defender: PokemonState;
  field: FieldState;
  onChangeAttacker: (p: PokemonState) => void;
  onChangeDefender: (p: PokemonState) => void;
}

function NatureTable({
  cols,
  stat,
  apply,
  natName,
}: {
  cols: NatureColumn[];
  stat: "atk" | "spa" | "spe";
  apply: (c: NatureColumn) => void;
  natName: (n: string) => string;
}) {
  const { t } = useLocale();
  return (
    <div className="grid gap-2 sm:grid-cols-3">
      {cols.map((c) => (
        <div key={c.nature} className="rounded-[10px] p-3" style={{ background: "var(--color-panel-soft)", border: "1px solid var(--color-line)" }}>
          <p className="eyebrow">{natName(c.nature)}</p>
          {c.minSp === null ? (
            <p className="mt-1 text-sm font-bold" style={{ color: "var(--color-danger)" }}>
              {t("opt.impossible")}
            </p>
          ) : (
            <>
              <p className="tabular mt-1 text-2xl font-extrabold" style={{ color: "var(--color-league)" }}>
                {c.minSp} <span className="text-xs font-bold">SP {t(`stat.${stat}`)}</span>
              </p>
              <p className="tabular text-xs" style={{ color: "var(--color-ink-dim)" }}>
                {c.detail}
              </p>
              {c.minSp === 0 && (
                <p className="text-[11px] font-bold" style={{ color: "var(--color-success)" }}>
                  {t("opt.zeroNote")}
                </p>
              )}
              <button type="button" className="pill-btn mt-2" onClick={() => apply(c)}>
                {t("opt.apply")}
              </button>
            </>
          )}
        </div>
      ))}
    </div>
  );
}

export default function OptimizerView({ attacker, defender, field, onChangeAttacker, onChangeDefender }: Props) {
  const { t, locale } = useLocale();
  const [goal, setGoal] = useState<Goal>("survive");
  const [dir, setDir] = useState<Dir>("forward");
  const [moveIdx, setMoveIdx] = useState(0);
  const [crit, setCrit] = useState(false);
  const [fraction, setFraction] = useState(1);

  const forward = dir === "forward";
  const src = forward ? attacker : defender;
  const tgt = forward ? defender : attacker;
  const setSrc = forward ? onChangeAttacker : onChangeDefender;
  const setTgt = forward ? onChangeDefender : onChangeAttacker;
  // The field as seen by whoever is attacking in the chosen direction.
  const f = useMemo(() => (forward ? field : swapSides(field)), [forward, field]);

  const moves = src.moves.filter(Boolean);
  const move = moves[Math.min(moveIdx, Math.max(moves.length - 1, 0))] ?? "";
  const moveName = (m: string) => (locale === "fr" ? toFrench("move", m) : m);
  const natName = (n: string) => (locale === "fr" ? toFrenchNature(n) : n);
  const dmgMove = !!move && !!statsForMove(move);

  const survive = useMemo(
    () => (goal === "survive" && dmgMove ? findSurviveSpreads(src, tgt, f, move, fraction, crit) : null),
    [goal, dmgMove, src, tgt, f, move, fraction, crit]
  );
  const ko = useMemo(
    () => (goal === "ko" && dmgMove ? findKoSpreads(src, tgt, f, move, fraction, crit) : null),
    [goal, dmgMove, src, tgt, f, move, fraction, crit]
  );
  const targetSpeed = useMemo(() => computeStats(tgt, f, "defenderSide").spe, [tgt, f]);
  const speed = useMemo(() => (goal === "speed" ? findSpeedSpread(src, f, targetSpeed) : null), [goal, src, f, targetSpeed]);

  const pct = (x: number) => `${Math.round(x * 1000) / 10}%`;
  const label = (p: PokemonState) => (locale === "fr" ? toFrench("species", p.species) : p.species) || "?";

  return (
    <div className="flex flex-col gap-4">
      <div className="card-shell p-4">
        <h2 className="heading text-xl" style={{ color: "var(--color-ink-bright)" }}>
          {t("opt.title")}
        </h2>
        <p className="text-xs" style={{ color: "var(--color-ink-dim)" }}>
          {t("opt.subtitle")}
        </p>
        <p className="mt-1 text-xs font-bold" style={{ color: "var(--color-ink-soft)" }}>
          {t("opt.editHint")}
        </p>

        <div className="mt-4 flex flex-wrap items-end gap-4">
          <div className="flex flex-col gap-1">
            <span className="eyebrow">{t("opt.goal")}</span>
            <Seg
              value={goal}
              onChange={setGoal}
              options={[
                { value: "survive" as Goal, label: t("opt.goal.survive") },
                { value: "ko" as Goal, label: t("opt.goal.ko") },
                { value: "speed" as Goal, label: t("opt.goal.speed") },
              ]}
            />
          </div>
          <div className="flex flex-col gap-1">
            <span className="eyebrow">{t("opt.direction")}</span>
            <Seg
              accent="var(--color-brick)"
              value={dir}
              onChange={setDir}
              options={[
                { value: "forward" as Dir, label: `${label(attacker)} → ${label(defender)}` },
                { value: "backward" as Dir, label: `${label(defender)} → ${label(attacker)}` },
              ]}
            />
          </div>
          {goal !== "speed" && (
            <>
              <label className="flex flex-col gap-1">
                <span className="eyebrow">{t("opt.move")}</span>
                <select value={moveIdx} onChange={(e) => setMoveIdx(Number(e.target.value))} className="field-input px-2 py-1.5 text-sm">
                  {moves.map((m, i) => (
                    <option key={m + i} value={i}>
                      {moveName(m)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1">
                <span className="eyebrow">{goal === "survive" ? t("opt.rate.survive") : t("opt.rate.ko")}</span>
                <select value={fraction} onChange={(e) => setFraction(Number(e.target.value))} className="field-input px-2 py-1.5 text-sm">
                  {THRESHOLDS.map((x) => (
                    <option key={x} value={x}>
                      {x === 1 ? t("opt.rate.always") : x === 1 / 16 ? t("opt.rate.any") : pct(x)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex items-center gap-2 pb-1.5 text-sm" style={{ color: "var(--color-ink-soft)" }}>
                <input type="checkbox" className="field-checkbox" checked={crit} onChange={(e) => setCrit(e.target.checked)} />
                {t("card.crit")}
              </label>
            </>
          )}
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2 2xl:grid-cols-[minmax(0,0.85fr)_minmax(0,1fr)_minmax(0,0.85fr)]">
        <div className="order-2 min-w-0 2xl:order-1">
          <PokemonCard role="attacker" accent="league" state={attacker} onChange={onChangeAttacker} field={field} sideKey="attackerSide" />
        </div>
        <div className="order-1 flex min-w-0 flex-col gap-4 lg:col-span-2 2xl:order-2 2xl:col-span-1">
        {goal !== "speed" && moves.length === 0 && (
          <p className="text-sm" style={{ color: "var(--color-ink-dim)" }}>
            {t("result.needMove")}
          </p>
        )}
        {goal !== "speed" && moves.length > 0 && !dmgMove && (
          <p className="text-sm" style={{ color: "var(--color-ink-dim)" }}>
            {t("opt.statusMove")}
          </p>
        )}

        {goal === "survive" && survive && (
          <div className="card-shell p-4">
            <h3 className="eyebrow mb-1">
              {label(tgt)} {t("opt.survives")} {moveName(move)} ({label(src)})
            </h3>
            <p className="mb-3 text-[11px]" style={{ color: "var(--color-ink-dim)" }}>
              {t("opt.budget").replace("{n}", String(survive.budget))}
            </p>
            {survive.options.length > 0 && (() => {
              const best = survive.options.reduce((a, b) => (b.total < a.total ? b : a));
              return (
                <p className="mb-3 rounded-[8px] px-3 py-2 text-sm font-bold" style={{ background: "var(--color-panel-soft)", color: "var(--color-success)" }}>
                  {best.total === 0
                    ? t("opt.alreadyOk").replace("{p}", String(best.maxPercent))
                    : t("opt.cheapest")
                        .replace("{hp}", String(best.hpSp))
                        .replace("{def}", String(best.defSp))
                        .replace("{stat}", t(`stat.${survive.defStat}`))
                        .replace("{total}", String(best.total))
                        .replace("{p}", String(best.maxPercent))}
                </p>
              );
            })()}
            {survive.options.length === 0 ? (
              <p className="text-sm font-bold" style={{ color: "var(--color-danger)" }}>
                {t("opt.impossible")}
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="tabular w-full text-sm">
                  <thead>
                    <tr className="text-left">
                      <th className="eyebrow pb-1">{t("stat.hp")} SP</th>
                      <th className="eyebrow pb-1">{t(`stat.${survive.defStat}`)} SP</th>
                      <th className="eyebrow pb-1">{t("opt.total")}</th>
                      <th className="eyebrow pb-1">{t("opt.maxDamage")}</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {survive.options.map((o) => (
                      <tr key={`${o.hpSp}-${o.defSp}`} className="border-t" style={{ borderColor: "var(--color-line)" }}>
                        <td className="py-1.5 font-bold">{o.hpSp}</td>
                        <td className="py-1.5 font-bold">{o.defSp}</td>
                        <td className="py-1.5">{o.total}</td>
                        <td className="py-1.5">{o.maxPercent}%</td>
                        <td className="py-1.5 text-right">
                          <button
                            type="button"
                            className="pill-btn"
                            onClick={() => setTgt({ ...tgt, evs: { ...tgt.evs, hp: spToEv(o.hpSp), [survive.defStat]: spToEv(o.defSp) } })}
                          >
                            {t("opt.apply")}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {goal === "ko" && ko && (
          <div className="card-shell p-4">
            <h3 className="eyebrow mb-3">
              {label(src)} {t("opt.kos")} {label(tgt)} ({moveName(move)})
            </h3>
            <NatureTable
              natName={natName}
              cols={ko.columns}
              stat={ko.atkStat}
              apply={(c) => setSrc({ ...src, nature: c.nature, evs: { ...src.evs, [ko.atkStat]: spToEv(c.minSp!) } })}
            />
          </div>
        )}

        {goal === "speed" && speed && (
          <div className="card-shell p-4">
            <h3 className="eyebrow mb-1">
              {label(src)} {t("opt.outspeeds")} {label(tgt)}
            </h3>
            <p className="mb-3 text-[11px]" style={{ color: "var(--color-ink-dim)" }}>
              {t("opt.targetSpeed").replace("{n}", String(targetSpeed))}
            </p>
            <NatureTable natName={natName} cols={speed} stat="spe" apply={(c) => setSrc({ ...src, nature: c.nature, evs: { ...src.evs, spe: spToEv(c.minSp!) } })} />
          </div>
        )}

        </div>
        <div className="order-3 min-w-0">
          <PokemonCard role="defender" accent="brick" state={defender} onChange={onChangeDefender} field={field} sideKey="defenderSide" />
        </div>
      </div>

      <p className="text-center text-[11px]" style={{ color: "var(--color-ink-dim)" }}>
        {t("opt.disclaimer")}
      </p>
    </div>
  );
}
