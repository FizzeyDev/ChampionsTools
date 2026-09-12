"use client";

import { useState } from "react";
import PokemonCard from "./PokemonCard";
import { pokemonSpriteUrl } from "@/lib/sprites";
import { parseShowdownTeam } from "@/lib/showdownSet";
import { useLocale } from "@/lib/i18n/LocaleContext";
import { defaultPokemon } from "@/lib/types";
import { autofillForSpecies } from "@/lib/features/autofillSpecies";
import type { PokemonState } from "@/lib/types";

interface TeamRosterProps {
  team: PokemonState[];
  onChange: (team: PokemonState[]) => void;
  accent: "league" | "brick";
  /** Max team size — 3 for Singles, 4 for Doubles (Champions battle team size, not the 6-Pokémon roster you build from). */
  maxSize: number;
}

export default function TeamRoster({ team, onChange, accent, maxSize }: TeamRosterProps) {
  const { t } = useLocale();
  const [activeIndex, setActiveIndex] = useState(0);
  const [showImport, setShowImport] = useState(team.length === 0);
  const [teamText, setTeamText] = useState("");
  const [importError, setImportError] = useState("");

  const accentVar = accent === "league" ? "var(--color-league)" : "var(--color-brick)";

  const importTeam = () => {
    const parsed = parseShowdownTeam(teamText, maxSize);
    if (parsed.length === 0) {
      setImportError(t("team.importError"));
      return;
    }
    onChange(parsed);
    setActiveIndex(0);
    setShowImport(false);
    setImportError("");
    setTeamText("");
  };

  const addSlot = async () => {
    if (team.length >= maxSize) return;
    const newMember = await autofillForSpecies(defaultPokemon("Abomasnow"), "Abomasnow");
    onChange([...team, newMember]);
    setActiveIndex(team.length);
  };

  const removeSlot = (i: number) => {
    const next = team.filter((_, idx) => idx !== i);
    onChange(next);
    setActiveIndex(Math.max(0, Math.min(activeIndex, next.length - 1)));
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="eyebrow">{t("team.roster")}</p>
        <button type="button" onClick={() => setShowImport((s) => !s)} className="pill-btn text-[0.68rem]">
          {t("team.importTeam")}
        </button>
      </div>

      {showImport && (
        <div
          className="rounded-[10px] p-2.5"
          style={{ background: "var(--color-panel-soft)", border: "1px solid var(--color-line-strong)" }}
        >
          <textarea
            value={teamText}
            onChange={(e) => setTeamText(e.target.value)}
            placeholder={t("team.importPlaceholder")}
            rows={8}
            className="field-input tabular w-full p-2 text-xs"
          />
          <div className="mt-2 flex items-center gap-2">
            <button
              type="button"
              onClick={importTeam}
              className="pill-btn"
              style={{ color: "var(--color-paper)", background: accentVar, borderColor: accentVar }}
            >
              {t("card.import")}
            </button>
            {importError && (
              <span className="text-xs" style={{ color: "var(--color-danger)" }}>
                {importError}
              </span>
            )}
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {team.map((p, i) => {
          const art = pokemonSpriteUrl(p.species, true);
          return (
            <button
              key={i}
              type="button"
              onClick={() => setActiveIndex(i)}
              className="group relative flex flex-col items-center gap-0.5 rounded-[8px] p-1.5"
              style={{
                background: i === activeIndex ? "var(--color-panel-strong)" : "transparent",
                border: `1px solid ${i === activeIndex ? accentVar : "var(--color-line)"}`,
              }}
            >
              {art && <img src={art} alt="" className="h-9 w-9 object-contain" />}
              <span className="max-w-[3.5rem] truncate text-[0.6rem]" style={{ color: "var(--color-ink-soft)" }}>
                {p.species || "—"}
              </span>
              <span
                role="button"
                tabIndex={-1}
                onClick={(e) => {
                  e.stopPropagation();
                  removeSlot(i);
                }}
                className="absolute -right-1 -top-1 hidden h-4 w-4 items-center justify-center rounded-full text-[0.6rem] group-hover:flex"
                style={{ background: "var(--color-danger)", color: "var(--color-paper)" }}
              >
                ×
              </span>
            </button>
          );
        })}
        {team.length < maxSize && (
          <button
            type="button"
            onClick={addSlot}
            className="flex h-[3.6rem] w-[3.6rem] items-center justify-center rounded-[8px] text-lg"
            style={{ border: "1px dashed var(--color-line-strong)", color: "var(--color-ink-dim)" }}
          >
            +
          </button>
        )}
      </div>

      {team[activeIndex] && (
        <PokemonCard
          role={accent === "league" ? "attacker" : "defender"}
          accent={accent}
          state={team[activeIndex]}
          onChange={(next) => {
            const copy = [...team];
            copy[activeIndex] = next;
            onChange(copy);
          }}
        />
      )}
    </div>
  );
}