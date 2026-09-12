"use client";

import { useMemo, useState } from "react";
import { computeMoveResults } from "@/lib/calcEngine";
import ResultPanel from "./ResultPanel";
import { pokemonSpriteUrl } from "@/lib/sprites";
import { useLocale } from "@/lib/i18n/LocaleContext";
import type { FieldState, PokemonState } from "@/lib/types";

interface AllVsAllMatrixProps {
  teamA: PokemonState[];
  teamB: PokemonState[];
  field: FieldState;
}

function maxPercent(attacker: PokemonState, defender: PokemonState, field: FieldState): number | null {
  const results = computeMoveResults(attacker, defender, field);
  const valid = results.filter((r) => !r.error && r.percent);
  if (valid.length === 0) return null;
  return Math.max(...valid.map((r) => r.percent![1]));
}

function cellStyle(pct: number | null): { background: string; color: string } {
  if (pct === null) return { background: "var(--color-panel-strong)", color: "var(--color-ink-dim)" };
  if (pct >= 100) return { background: "var(--color-danger)", color: "var(--color-paper)" };
  if (pct >= 50) return { background: "var(--color-amber)", color: "var(--color-paper)" };
  return { background: "var(--color-success)", color: "var(--color-paper)" };
}

export default function AllVsAllMatrix({ teamA, teamB, field }: AllVsAllMatrixProps) {
  const { t } = useLocale();
  const [selected, setSelected] = useState<{ a: number; b: number } | null>(null);

  const grid = useMemo(() => {
    return teamA.map((a) => teamB.map((b) => maxPercent(a, b, field)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamA, teamB, field]);

  if (teamA.length === 0 || teamB.length === 0) {
    return <p className="text-sm text-ink-dim">{t("allvall.needBothTeams")}</p>;
  }

  const sel = selected && teamA[selected.a] && teamB[selected.b] ? selected : null;

  return (
    <div className="flex flex-col gap-4">
      <div className="overflow-x-auto">
        <table style={{ borderSpacing: "4px", borderCollapse: "separate" }}>
          <thead>
            <tr>
              <th className="w-10"></th>
              {teamB.map((d, j) => {
                const art = pokemonSpriteUrl(d.species, true);
                return (
                  <th key={j} className="p-0.5">
                    {art && <img src={art} alt="" title={d.species} className="mx-auto h-8 w-8 object-contain" />}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {teamA.map((a, i) => {
              const artA = pokemonSpriteUrl(a.species, true);
              return (
                <tr key={i}>
                  <td className="p-0.5">
                    {artA && <img src={artA} alt="" title={a.species} className="h-8 w-8 object-contain" />}
                  </td>
                  {teamB.map((_, j) => {
                    const pct = grid[i][j];
                    const isSel = sel?.a === i && sel?.b === j;
                    const style = cellStyle(pct);
                    return (
                      <td key={j}>
                        <button
                          type="button"
                          onClick={() => setSelected({ a: i, b: j })}
                          className="flex h-9 w-12 items-center justify-center rounded-[6px] text-[0.68rem] font-bold transition"
                          style={{
                            ...style,
                            outline: isSel ? "2px solid var(--color-violet)" : "none",
                            outlineOffset: "1px",
                          }}
                        >
                          {pct === null ? "—" : `${Math.round(pct)}%`}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {sel && (
        <ResultPanel
          title={`${teamA[sel.a].species} → ${teamB[sel.b].species}`}
          accent="league"
          results={computeMoveResults(teamA[sel.a], teamB[sel.b], field)}
          critMoves={teamA[sel.a].critMoves}
          attacker={teamA[sel.a]}
          defender={teamB[sel.b]}
          field={field}
        />
      )}
    </div>
  );
}