"use client";

import { useMemo, useState } from "react";
import { typeIconUrl, moveInfo } from "@/lib/sprites";
import { minSpToSurvive, minSpToOhko } from "@/lib/features/reverseCalc";
import { toFrench } from "@/lib/champions/gameTranslations";
import { useLocale } from "@/lib/i18n/LocaleContext";
import type { MoveResult } from "@/lib/calcEngine";
import type { PokemonState, FieldState } from "@/lib/types";

type RollTier = "min" | "mid" | "max";

const TIER_COLOR: Record<RollTier, string> = {
  min: "var(--color-success)",
  mid: "var(--color-amber)",
  max: "var(--color-danger)",
};

function koColor(text: string): string {
  if (/guaranteed/i.test(text)) return "var(--color-danger)";
  if (/possible/i.test(text)) return "var(--color-amber)";
  return "var(--color-ink-dim)";
}

const STAT_LABEL: Record<string, string> = {
  def: "Def",
  spd: "SpD",
  atk: "Atk",
  spa: "SpA",
};

interface ResultRowProps {
  result: MoveResult;
  /** When all three are provided, shows the minimum-investment reverse calc
   * (SP needed to survive / to guarantee the OHKO) below the roll detail. */
  attacker?: PokemonState;
  defender?: PokemonState;
  field?: FieldState;
}

export default function ResultRow({ result, attacker, defender, field }: ResultRowProps) {
  const { t, locale } = useLocale();
  const { type, category } = moveInfo(result.move);
  const icon = typeIconUrl(type);
  const [activeTiers, setActiveTiers] = useState<Set<RollTier>>(new Set());

  const toggleTier = (tier: RollTier) => {
    setActiveTiers((prev) => {
      const next = new Set(prev);
      if (next.has(tier)) next.delete(tier);
      else next.add(tier);
      return next;
    });
  };

  const reverseCalc = useMemo(() => {
    if (!attacker || !defender || !field || !result.range || result.error) return null;
    if (category !== "Physical" && category !== "Special") return null;
    const defStat = category === "Physical" ? "def" : "spd";
    const atkStat = category === "Physical" ? "atk" : "spa";
    return {
      survive: minSpToSurvive(attacker, defender, field, result.move, defStat),
      ohko: minSpToOhko(attacker, defender, field, result.move, atkStat),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attacker, defender, field, result.move, result.range, result.error, category]);

  if (result.error) {
    return (
      <div
        className="flex items-center justify-between rounded-[10px] px-3 py-2 text-sm"
        style={{ background: "var(--color-panel-soft)", color: "var(--color-ink-dim)" }}
      >
        <span>{locale === "fr" ? toFrench("move", result.move) : result.move}</span>
        <span className="text-xs italic">{t("result.notCalculable")}</span>
      </div>
    );
  }
  if (!result.range || !result.percent) return null;

  const [min, max] = result.percent;
  const barMax = Math.min(100, max);
  const barMin = Math.min(barMax, min);

  return (
    <div
      className="rounded-[10px] p-3"
      style={{ background: "var(--color-panel-soft)", border: "1px solid var(--color-line)" }}
    >
      {/* Showdown-style damage line, e.g. "252+ Atk Absol Life Orb Sucker Punch
          vs. 252 HP / 0 Def Chansey: 99-117 (14.1 - 16.6%) -- possible 7HKO" */}
      <div className="flex items-start gap-1.5">
        {icon && <img src={icon} alt="" className="mt-0.5 h-5 w-5 shrink-0 object-contain" />}
        <p className="tabular text-sm leading-snug" style={{ color: "var(--color-ink-bright)" }}>
          {result.description}
        </p>
      </div>

      <div
        className="relative mt-2 h-2 w-full overflow-hidden rounded-full"
        style={{ background: "var(--color-panel-strong)" }}
      >
        <div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{ width: `${barMax}%`, background: "var(--color-league-soft)" }}
        />
        <div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{
            width: `${barMin}%`,
            background: "var(--color-league)",
            boxShadow: "0 0 8px var(--color-league-glow)",
          }}
        />
      </div>

      <p className="mt-1.5 text-xs font-semibold" style={{ color: koColor(result.koText) }}>
        {result.koText}
      </p>

      {result.rolls && result.rolls.length > 0 && (() => {
        const sorted = [...result.rolls].sort((a, b) => a - b);
        const minValue = sorted[0];
        const maxValue = sorted[sorted.length - 1];
        const midValue = sorted[Math.floor(sorted.length / 2)];
        const tierValue: Record<RollTier, number> = { min: minValue, mid: midValue, max: maxValue };

        return (
          <div className="mt-2">
            <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
              <p className="eyebrow">{t("result.allRolls", { count: result.rolls.length })}</p>
              <span className="flex gap-1">
                {(["min", "mid", "max"] as RollTier[]).map((tier) => {
                  const isActive = activeTiers.has(tier);
                  return (
                    <button
                      key={tier}
                      type="button"
                      onClick={() => toggleTier(tier)}
                      className="tabular rounded-[6px] px-1.5 py-0.5 text-[0.62rem] font-bold transition"
                      style={{
                        background: isActive ? TIER_COLOR[tier] : "var(--color-panel-strong)",
                        color: isActive ? "var(--color-paper)" : "var(--color-ink-dim)",
                        border: `1px solid ${isActive ? TIER_COLOR[tier] : "var(--color-line-strong)"}`,
                      }}
                    >
                      {t(`result.roll.${tier}`)} {tierValue[tier]}
                    </button>
                  );
                })}
              </span>
            </div>
            <p className="tabular flex flex-wrap gap-1.5 text-[11px]" style={{ color: "var(--color-ink-dim)" }}>
              {sorted.map((value, i) => {
                const matchedTier = (["min", "mid", "max"] as RollTier[]).find(
                  (tier) => activeTiers.has(tier) && tierValue[tier] === value
                );
                return (
                  <span
                    key={i}
                    className="rounded-[6px] px-1.5 py-0.5"
                    style={
                      matchedTier
                        ? { background: TIER_COLOR[matchedTier], color: "var(--color-paper)", fontWeight: 700 }
                        : { background: "var(--color-panel-strong)" }
                    }
                  >
                    {value}
                  </span>
                );
              })}
            </p>
          </div>
        );
      })()}

      {result.multihit && (
        <div className="mt-2">
          <p className="eyebrow mb-1">{t("result.hitDetail")}</p>
          <div className="flex flex-wrap gap-1.5 text-[11px]" style={{ color: "var(--color-ink-dim)" }}>
            {result.hitBreakdown ? (
              result.hitBreakdown.map((hit, i) => (
                <span key={i} className="rounded-[6px] px-1.5 py-0.5" style={{ background: "var(--color-panel-strong)" }}>
                  {t("result.hit", { n: i + 1 })} : {hit[0]}–{hit[1]}
                </span>
              ))
            ) : (
              <span className="italic">{t("result.hitDetailUnavailable")}</span>
            )}
          </div>
        </div>
      )}

      {reverseCalc && (
        <div className="mt-2 grid grid-cols-1 gap-2 border-t pt-2 sm:grid-cols-2" style={{ borderColor: "var(--color-line)" }}>
          <div>
            <p className="eyebrow mb-0.5" style={{ color: "var(--color-brick)" }}>
              {t("reverse.survive")}
            </p>
            <p className="tabular text-xs" style={{ color: "var(--color-ink)" }}>
              {reverseCalc.survive.minSp === null
                ? t("reverse.impossible")
                : reverseCalc.survive.minSp === 0
                  ? t("reverse.alreadySafe")
                  : t("reverse.spNeeded", { sp: reverseCalc.survive.minSp, stat: STAT_LABEL[reverseCalc.survive.statKey] })}
            </p>
          </div>
          <div>
            <p className="eyebrow mb-0.5" style={{ color: "var(--color-league)" }}>
              {t("reverse.ohko")}
            </p>
            <p className="tabular text-xs" style={{ color: "var(--color-ink)" }}>
              {reverseCalc.ohko.minSp === null
                ? t("reverse.impossible")
                : reverseCalc.ohko.minSp === 0
                  ? t("reverse.alreadyGuaranteed")
                  : t("reverse.spNeeded", { sp: reverseCalc.ohko.minSp, stat: STAT_LABEL[reverseCalc.ohko.statKey] })}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}