"use client";

import { useState } from "react";
import ResultRow from "./ResultRow";
import { typeIconUrl, moveInfo } from "@/lib/sprites";
import { toFrench } from "@/lib/champions/gameTranslations";
import { useLocale } from "@/lib/i18n/LocaleContext";
import type { MoveResult } from "@/lib/calcEngine";
import type { PokemonState, FieldState } from "@/lib/types";

const LIMIT_OPTIONS = [5, 10, 20, 50] as const;

interface ResultPanelProps {
  title: string;
  accent: "league" | "brick";
  results: MoveResult[];
  critMoves?: boolean[];
  onToggleCrit?: (index: number) => void;
  /** When set, shows only the first N results with a count selector to
   * change how many are visible (defaults to 5). Meant for long lists like
   * a full movepool scan — leave unset for the normal 4-move panels. */
  configurableLimit?: boolean;
  /** Passed straight through to the active ResultRow so it can show the
   * minimum-investment reverse calc. Omit to hide that section. */
  attacker?: PokemonState;
  defender?: PokemonState;
  field?: FieldState;
}

export default function ResultPanel({
  title,
  accent,
  results,
  critMoves,
  onToggleCrit,
  configurableLimit = false,
  attacker,
  defender,
  field,
}: ResultPanelProps) {
  const { t, locale } = useLocale();
  const [selected, setSelected] = useState(0);
  const [limit, setLimit] = useState(5);
  const accentVar = accent === "league" ? "var(--color-league)" : "var(--color-brick)";
  const visibleResults = configurableLimit ? results.slice(0, limit) : results;
  const index = Math.min(selected, Math.max(visibleResults.length - 1, 0));
  const active = visibleResults[index] ?? null;

  return (
    <section className="card-shell p-4">
      <div className="mb-1 flex flex-wrap items-center justify-between gap-2 border-b pb-2">
        <h2 className="heading text-base" style={{ color: accentVar }}>
          {title}
        </h2>
        {configurableLimit && results.length > LIMIT_OPTIONS[0] && (
          <label className="flex items-center gap-1.5 text-[0.65rem]" style={{ color: "var(--color-ink-dim)" }}>
            {t("result.show")}
            <select
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
              className="field-input px-1.5 py-0.5 text-[0.65rem]"
            >
              {LIMIT_OPTIONS.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
              <option value={results.length}>{t("result.showAll")}</option>
            </select>
          </label>
        )}
      </div>
      <p className="eyebrow mb-2 mt-2">{t("result.selectHint")}</p>

      {visibleResults.length === 0 ? (
        <p className="text-sm text-ink-dim">{t("result.needMove")}</p>
      ) : (
        <div className="mb-3 flex flex-col gap-1.5">
          {visibleResults.map((r, i) => {
            const isActive = i === index;
            const isCrit = critMoves?.[i] ?? false;
            const icon = typeIconUrl(moveInfo(r.move).type);
            return (
              <div
                key={i}
                onClick={() => setSelected(i)}
                className="flex cursor-pointer items-center gap-2 rounded-[8px] px-3 py-2 text-sm font-semibold transition"
                style={{
                  background: isActive ? accentVar : "var(--color-panel-strong)",
                  color: isActive ? "var(--color-paper)" : "var(--color-ink)",
                  boxShadow: isActive ? `0 0 16px ${accent === "league" ? "var(--color-league-glow)" : "var(--color-brick-glow)"}` : "none",
                }}
              >
                {icon && <img src={icon} alt="" className="h-4 w-4 shrink-0 object-contain" />}
                <span className="flex-1 truncate text-left">{locale === "fr" ? toFrench("move", r.move) : r.move}</span>
                {onToggleCrit && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleCrit(i);
                    }}
                    title={t("card.crit")}
                    className="shrink-0 rounded-[6px] px-1.5 py-0.5 text-[0.65rem] font-bold transition"
                    style={{
                      background: isCrit
                        ? "var(--color-amber)"
                        : isActive
                          ? "rgba(0,0,0,0.15)"
                          : "var(--color-panel)",
                      color: isCrit ? "var(--color-paper)" : isActive ? "var(--color-paper)" : "var(--color-ink-dim)",
                      opacity: isCrit ? 1 : 0.7,
                    }}
                  >
                    CRIT
                  </button>
                )}
                <span className="tabular shrink-0">{r.percent ? `${r.percent[0]} – ${r.percent[1]}%` : "—"}</span>
              </div>
            );
          })}
        </div>
      )}

      {active && <ResultRow result={active} attacker={attacker} defender={defender} field={field} />}
    </section>
  );
}