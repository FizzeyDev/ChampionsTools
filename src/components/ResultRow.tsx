"use client";

import { useMemo } from "react";
import { typeIconUrl, moveInfo } from "@/lib/sprites";
import { minSpToSurvive, minSpToOhko } from "@/lib/features/reverseCalc";
import { useLocale } from "@/lib/i18n/LocaleContext";
import type { MoveResult } from "@/lib/calcEngine";
import type { PokemonState, FieldState } from "@/lib/types";

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
  const { t } = useLocale();
  const { type, category } = moveInfo(result.move);
  const icon = typeIconUrl(type);

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
        <span>{result.move}</span>
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

      {result.rolls && (
        <div className="mt-2">
          <p className="eyebrow mb-1">{t("result.allRolls", { count: result.rolls.length })}</p>
          <p className="tabular flex flex-wrap gap-1.5 text-[11px]" style={{ color: "var(--color-ink-dim)" }}>
            {(() => {
              const map = new Map<number, number>();
              for (const r of result.rolls) map.set(r, (map.get(r) ?? 0) + 1);
              return [...map.entries()]
                .sort((a, b) => a[0] - b[0])
                .map(([value, count]) => (
                  <span
                    key={value}
                    className="rounded-[6px] px-1.5 py-0.5"
                    style={{ background: "var(--color-panel-strong)" }}
                    title={`${count}/16`}
                  >
                    {value}
                    {count > 1 && <span style={{ opacity: 0.6 }}>×{count}</span>}
                  </span>
                ));
            })()}
          </p>
        </div>
      )}

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
        <div className="mt-2 grid grid-cols-2 gap-2 border-t pt-2" style={{ borderColor: "var(--color-line)" }}>
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