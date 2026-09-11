"use client";

import { useEffect, useMemo, useState } from "react";
import PokemonCard from "@/components/PokemonCard";
import FieldBar from "@/components/FieldBar";
import ResultPanel from "@/components/ResultPanel";
import TeamRoster from "@/components/TeamRoster";
import SavedPokemonModal from "@/components/SavedPokemonModal";
import { computeMoveResults, type MoveResult } from "@/lib/calcEngine";
import { computeBestMoves } from "@/lib/features/bestMoves";
import { defaultField, defaultPokemon } from "@/lib/types";
import { autofillForSpecies } from "@/lib/features/autofillSpecies";
import { buildShareUrl, readStateFromLocation } from "@/lib/shareLink";
import { useLocale } from "@/lib/i18n/LocaleContext";
import { LOCALES } from "@/lib/i18n/translations";
import type { PokemonState } from "@/lib/types";

type Mode = "1v1" | "1vAll" | "Allv1" | "bestMoves";

export default function Home() {
  const { locale, setLocale, t } = useLocale();

  const [mode, setMode] = useState<Mode>("1v1");
  const [attacker, setAttacker] = useState(() => defaultPokemon("Abomasnow"));
  const [defender, setDefender] = useState(() => defaultPokemon("Abomasnow"));
  const [team, setTeam] = useState<PokemonState[]>([]);
  const [field, setField] = useState(defaultField);
  const [copied, setCopied] = useState(false);
  const [showSaved, setShowSaved] = useState(false);
  const [bestForward, setBestForward] = useState<MoveResult[]>([]);
  const [bestBackward, setBestBackward] = useState<MoveResult[]>([]);
  const [bestLoading, setBestLoading] = useState(false);

  useEffect(() => {
    const shared = readStateFromLocation();
    if (shared) {
      setAttacker(shared.attacker);
      setDefender(shared.defender);
      setField(shared.field);
    } else {
      // First load with no shared link: give the default Abomasnow pair a
      // real ability + moveset instead of sitting there empty.
      autofillForSpecies(defaultPokemon("Abomasnow"), "Abomasnow").then(setAttacker);
      autofillForSpecies(defaultPokemon("Abomasnow"), "Abomasnow").then(setDefender);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const forwardResults = useMemo(
    () => computeMoveResults(attacker, defender, field),
    [attacker, defender, field]
  );
  const backwardResults = useMemo(
    () => computeMoveResults(defender, attacker, field),
    [attacker, defender, field]
  );

  useEffect(() => {
    if (mode !== "bestMoves") return;
    let cancelled = false;
    setBestLoading(true);
    Promise.all([
      computeBestMoves(attacker, defender, field),
      computeBestMoves(defender, attacker, field),
    ]).then(([fwd, bwd]) => {
      if (cancelled) return;
      setBestForward(fwd);
      setBestBackward(bwd);
      setBestLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [mode, attacker, defender, field]);

  const swap = () => {
    setAttacker(defender);
    setDefender(attacker);
  };

  const toggleCrit = (
    setter: (next: PokemonState) => void,
    source: PokemonState,
    i: number
  ) => {
    const critMoves = [...source.critMoves];
    critMoves[i] = !critMoves[i];
    setter({ ...source, critMoves });
  };

  const toggleTeamCrit = (memberIndex: number, moveIndex: number) => {
    const next = [...team];
    const member = next[memberIndex];
    if (!member) return;
    const critMoves = [...member.critMoves];
    critMoves[moveIndex] = !critMoves[moveIndex];
    next[memberIndex] = { ...member, critMoves };
    setTeam(next);
  };

  const share = async () => {
    const url = buildShareUrl({ attacker, defender, field });
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt(locale === "fr" ? "Copie ce lien :" : "Copy this link:", url);
    }
  };

  return (
    <div className="min-h-screen">
      <header
        className="sticky top-0 z-30 flex flex-wrap items-center justify-between gap-3 px-5 py-4"
        style={{
          background: "linear-gradient(180deg, var(--color-panel-soft) 0%, var(--color-panel) 100%)",
          borderBottom: "1px solid var(--color-line)",
          boxShadow: "var(--shadow-md)",
        }}
      >
        <div>
          <h1
            className="heading text-2xl"
            style={{ color: "var(--color-ink-bright)", textShadow: "0 0 30px var(--color-league-glow)" }}
          >
            {t("app.title")}
          </h1>
          <p className="text-xs text-ink-dim">{t("app.subtitle")}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex overflow-hidden rounded-full" style={{ border: "1px solid var(--color-line-strong)" }}>
            {(["1v1", "1vAll", "Allv1", "bestMoves"] as Mode[]).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className="px-2.5 py-1.5 text-[0.68rem] font-bold uppercase tracking-wide transition"
                style={{
                  background: mode === m ? "var(--color-violet)" : "var(--color-panel-soft)",
                  color: mode === m ? "var(--color-paper)" : "var(--color-ink-soft)",
                }}
              >
                {t(`team.mode.${m}`)}
              </button>
            ))}
          </div>
          <div className="flex overflow-hidden rounded-full" style={{ border: "1px solid var(--color-line-strong)" }}>
            {LOCALES.map((l) => (
              <button
                key={l}
                onClick={() => setLocale(l)}
                className="px-2.5 py-1.5 text-[0.7rem] font-bold uppercase tracking-wide transition"
                style={{
                  background: locale === l ? "var(--color-league)" : "var(--color-panel-soft)",
                  color: locale === l ? "var(--color-paper)" : "var(--color-ink-soft)",
                }}
              >
                {l}
              </button>
            ))}
          </div>
          <button onClick={share} className="pill-btn" style={{ color: "var(--color-violet)", borderColor: "rgba(159,83,236,0.4)", background: "var(--color-violet-soft)" }}>
            🔗 {copied ? t("app.linkCopied") : t("app.copyLink")}
          </button>
          <button
            onClick={() => setShowSaved(true)}
            className="pill-btn"
            style={{ color: "var(--color-amber)", borderColor: "rgba(255,215,64,0.4)", background: "var(--color-amber-soft)" }}
          >
            ★ {t("saved.viewButton")}
          </button>
          {(mode === "1v1" || mode === "bestMoves") && (
            <button
              onClick={swap}
              className="pill-btn"
              style={{ color: "var(--color-league)", borderColor: "rgba(79,195,247,0.4)", background: "var(--color-league-soft)" }}
            >
              ⇄ {t("app.swap")}
            </button>
          )}
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-5 px-4 py-6 sm:px-6">
        {mode === "1v1" && (
          <>
            <div className="grid gap-5 lg:grid-cols-2">
              <ResultPanel
                title={`${attacker.species || t("card.attacker")} → ${defender.species || t("card.defender")}`}
                accent="league"
                results={forwardResults}
                critMoves={attacker.critMoves}
                onToggleCrit={(i) => toggleCrit(setAttacker, attacker, i)}
              />
              <ResultPanel
                title={`${defender.species || t("card.defender")} → ${attacker.species || t("card.attacker")}`}
                accent="brick"
                results={backwardResults}
                critMoves={defender.critMoves}
                onToggleCrit={(i) => toggleCrit(setDefender, defender, i)}
              />
            </div>
            <div className="grid gap-5 xl:grid-cols-[0.85fr_560px_0.85fr]">
              <PokemonCard role="attacker" accent="league" state={attacker} onChange={setAttacker} />
              <FieldBar state={field} onChange={setField} />
              <PokemonCard role="defender" accent="brick" state={defender} onChange={setDefender} />
            </div>
          </>
        )}

        {mode === "1vAll" && (
          <>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {team.map((member, i) => (
                <ResultPanel
                  key={i}
                  title={`${attacker.species || t("card.attacker")} → ${member.species || "?"}`}
                  accent="league"
                  results={computeMoveResults(attacker, member, field)}
                  critMoves={attacker.critMoves}
                  onToggleCrit={(mi) => toggleCrit(setAttacker, attacker, mi)}
                />
              ))}
              {team.length === 0 && (
                <p className="text-sm text-ink-dim">{t("team.importPlaceholder")}</p>
              )}
            </div>
            <div className="grid gap-5 xl:grid-cols-[0.85fr_560px_0.85fr]">
              <PokemonCard role="attacker" accent="league" state={attacker} onChange={setAttacker} />
              <FieldBar state={field} onChange={setField} />
              <TeamRoster team={team} onChange={setTeam} accent="brick" />
            </div>
          </>
        )}

        {mode === "Allv1" && (
          <>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {team.map((member, i) => (
                <ResultPanel
                  key={i}
                  title={`${member.species || "?"} → ${defender.species || t("card.defender")}`}
                  accent="brick"
                  results={computeMoveResults(member, defender, field)}
                  critMoves={member.critMoves}
                  onToggleCrit={(mi) => toggleTeamCrit(i, mi)}
                />
              ))}
              {team.length === 0 && (
                <p className="text-sm text-ink-dim">{t("team.importPlaceholder")}</p>
              )}
            </div>
            <div className="grid gap-5 xl:grid-cols-[0.85fr_560px_0.85fr]">
              <TeamRoster team={team} onChange={setTeam} accent="league" />
              <FieldBar state={field} onChange={setField} />
              <PokemonCard role="defender" accent="brick" state={defender} onChange={setDefender} />
            </div>
          </>
        )}

        {mode === "bestMoves" && (
          <>
            <div className="grid gap-5 lg:grid-cols-2">
              <ResultPanel
                title={`${attacker.species || t("card.attacker")} → ${defender.species || t("card.defender")}${bestLoading ? "…" : ""}`}
                accent="league"
                results={bestForward}
                configurableLimit
              />
              <ResultPanel
                title={`${defender.species || t("card.defender")} → ${attacker.species || t("card.attacker")}${bestLoading ? "…" : ""}`}
                accent="brick"
                results={bestBackward}
                configurableLimit
              />
            </div>
            <div className="grid gap-5 xl:grid-cols-[0.85fr_560px_0.85fr]">
              <PokemonCard
                role="attacker"
                accent="league"
                state={attacker}
                onChange={setAttacker}
                showMoves={false}
                restrictAbilityToReal
              />
              <FieldBar state={field} onChange={setField} />
              <PokemonCard
                role="defender"
                accent="brick"
                state={defender}
                onChange={setDefender}
                showMoves={false}
                restrictAbilityToReal
              />
            </div>
          </>
        )}

        <footer className="pb-4 text-center text-[11px] text-ink-dim">{t("app.footer")}</footer>
      </div>

      <SavedPokemonModal
        open={showSaved}
        onClose={() => setShowSaved(false)}
        onAssign={(pkm, role) => {
          if (role === "attacker") setAttacker(pkm);
          else setDefender(pkm);
        }}
      />
    </div>
  );
}