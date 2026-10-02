"use client";

import { useEffect, useMemo, useState } from "react";
import PokemonCard from "@/components/PokemonCard";
import FieldBar from "@/components/FieldBar";
import ResultPanel from "@/components/ResultPanel";
import TeamRoster from "@/components/TeamRoster";
import AllVsAllMatrix from "@/components/AllVsAllMatrix";
import SpeedComparator from "@/components/SpeedComparator";
import MoveComparator from "@/components/MoveComparator";
import SavedPokemonModal from "@/components/SavedPokemonModal";
import TeamCoverage from "@/components/TeamCoverage";
import ChangelogPage from "@/components/ChangelogPage";
import Sidebar, { type Mode, type View } from "@/components/Sidebar";
import { computeMoveResults, type MoveResult } from "@/lib/calcEngine";
import { computeBestMoves } from "@/lib/features/bestMoves";
import { defaultField, defaultPokemon } from "@/lib/types";
import { autofillForSpecies } from "@/lib/features/autofillSpecies";
import { buildShareUrl, readStateFromLocation } from "@/lib/shareLink";
import { useLocale } from "@/lib/i18n/LocaleContext";
import type { PokemonState } from "@/lib/types";

export default function Home() {
  const { locale, t } = useLocale();

  const [view, setView] = useState<View>("calculator");
  const [mode, setMode] = useState<Mode>("1v1");
  const [attacker, setAttacker] = useState(() => defaultPokemon("Abomasnow"));
  const [defender, setDefender] = useState(() => defaultPokemon("Abomasnow"));
  const [team, setTeam] = useState<PokemonState[]>([]);
  const [teamB, setTeamB] = useState<PokemonState[]>([]);
  const [field, setField] = useState(defaultField);
  const [copied, setCopied] = useState(false);
  const [showSaved, setShowSaved] = useState(false);
  const [bestForward, setBestForward] = useState<MoveResult[]>([]);
  const [bestBackward, setBestBackward] = useState<MoveResult[]>([]);
  const [bestLoading, setBestLoading] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    try {
      setSidebarCollapsed(window.localStorage.getItem("champcalc.sidebarCollapsed") === "1");
    } catch {
      // ignore
    }
  }, []);

  const toggleSidebar = () => {
    setSidebarCollapsed((c) => {
      const next = !c;
      try {
        window.localStorage.setItem("champcalc.sidebarCollapsed", next ? "1" : "0");
      } catch {
        // ignore
      }
      return next;
    });
  };

  // Champions matches are 3v3 (Singles) or 4v4 (Doubles) — never 6v6, even
  // though you build a roster of 6 beforehand. Team-mode rosters are capped
  // to the active battle size, and trimmed automatically if the format
  // switches to a smaller one.
  const maxTeamSize = field.gameType === "Singles" ? 3 : 4;
  useEffect(() => {
    setTeam((t) => (t.length > maxTeamSize ? t.slice(0, maxTeamSize) : t));
    setTeamB((t) => (t.length > maxTeamSize ? t.slice(0, maxTeamSize) : t));
  }, [maxTeamSize]);

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
      <Sidebar
        view={view}
        mode={mode}
        onSelectMode={setMode}
        onSelectView={setView}
        collapsed={sidebarCollapsed}
        onToggleCollapsed={toggleSidebar}
        mobileOpen={mobileNavOpen}
        onOpenMobile={() => setMobileNavOpen(true)}
        onCloseMobile={() => setMobileNavOpen(false)}
      />

      <div
        className={`transition-[margin] duration-200 ${sidebarCollapsed ? "sm:ml-[4.25rem]" : "sm:ml-[15.5rem]"}`}
      >
        <header
          className="sticky top-0 z-20 w-full"
          style={{
            background: "linear-gradient(180deg, var(--color-panel-soft) 0%, var(--color-panel) 100%)",
            borderBottom: "1px solid var(--color-line)",
          }}
        >
          <div className="flex flex-wrap items-center gap-2 px-3 py-2.5 pl-14 sm:px-5 sm:pl-5">
            <div className="min-w-0">
              <h1
                className="heading truncate text-base sm:text-xl"
                style={{ color: "var(--color-ink-bright)", textShadow: "0 0 30px var(--color-league-glow)" }}
              >
                {t("app.title")}
              </h1>
              <p className="hidden truncate text-xs text-ink-dim sm:block">{t("app.subtitle")}</p>
            </div>
            {view === "calculator" && (
              <div className="ml-auto flex flex-wrap items-center gap-2">
                <button
                  onClick={share}
                  className="pill-btn"
                  style={{ color: "var(--color-violet)", borderColor: "rgba(159,83,236,0.4)", background: "var(--color-violet-soft)" }}
                >
                  🔗 {copied ? t("app.linkCopied") : t("calc.copyLink")}
                </button>
                <button
                  onClick={() => setShowSaved(true)}
                  className="pill-btn"
                  style={{ color: "var(--color-amber)", borderColor: "rgba(255,215,64,0.4)", background: "var(--color-amber-soft)" }}
                >
                  ★ {t("calc.saved")}
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
            )}
          </div>
        </header>

        <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-5 px-4 py-6 sm:px-6">
        {view === "teamCoverage" && <TeamCoverage />}

        {view === "changelog" && <ChangelogPage />}

        {view === "calculator" && (
          <>
        {mode === "1v1" && (
          <>
            <div className="grid grid-cols-2 gap-2 sm:gap-5">
              <ResultPanel
                title={`${attacker.species || t("card.attacker")} → ${defender.species || t("card.defender")}`}
                accent="league"
                results={forwardResults}
                critMoves={attacker.critMoves}
                onToggleCrit={(i) => toggleCrit(setAttacker, attacker, i)}
                attacker={attacker}
                defender={defender}
                field={field}
              />
              <ResultPanel
                title={`${defender.species || t("card.defender")} → ${attacker.species || t("card.attacker")}`}
                accent="brick"
                results={backwardResults}
                critMoves={defender.critMoves}
                onToggleCrit={(i) => toggleCrit(setDefender, defender, i)}
                attacker={defender}
                defender={attacker}
                field={field}
              />
            </div>
            <div className="grid gap-5 xl:grid-cols-[0.85fr_560px_0.85fr]">
              <PokemonCard
                role="attacker"
                accent="league"
                state={attacker}
                onChange={setAttacker}
                field={field}
                sideKey="attackerSide"
              />
              <FieldBar state={field} onChange={setField} />
              <PokemonCard
                role="defender"
                accent="brick"
                state={defender}
                onChange={setDefender}
                field={field}
                sideKey="defenderSide"
              />
            </div>
          </>
        )}

        {mode === "1vAll" && (
          <>
            <div className="grid grid-cols-2 gap-2 sm:gap-4 xl:grid-cols-3">
              {team.map((member, i) => (
                <ResultPanel
                  key={i}
                  title={`${attacker.species || t("card.attacker")} → ${member.species || "?"}`}
                  accent="league"
                  results={computeMoveResults(attacker, member, field)}
                  critMoves={attacker.critMoves}
                  onToggleCrit={(mi) => toggleCrit(setAttacker, attacker, mi)}
                  attacker={attacker}
                  defender={member}
                  field={field}
                />
              ))}
              {team.length === 0 && (
                <p className="text-sm text-ink-dim">{t("team.importPlaceholder")}</p>
              )}
            </div>
            <div className="grid gap-5 xl:grid-cols-[0.85fr_560px_0.85fr]">
              <PokemonCard
                role="attacker"
                accent="league"
                state={attacker}
                onChange={setAttacker}
                field={field}
                sideKey="attackerSide"
              />
              <FieldBar state={field} onChange={setField} />
              <TeamRoster team={team} onChange={setTeam} accent="brick" maxSize={maxTeamSize} />
            </div>
          </>
        )}

        {mode === "Allv1" && (
          <>
            <div className="grid grid-cols-2 gap-2 sm:gap-4 xl:grid-cols-3">
              {team.map((member, i) => (
                <ResultPanel
                  key={i}
                  title={`${member.species || "?"} → ${defender.species || t("card.defender")}`}
                  accent="brick"
                  results={computeMoveResults(member, defender, field)}
                  critMoves={member.critMoves}
                  onToggleCrit={(mi) => toggleTeamCrit(i, mi)}
                  attacker={member}
                  defender={defender}
                  field={field}
                />
              ))}
              {team.length === 0 && (
                <p className="text-sm text-ink-dim">{t("team.importPlaceholder")}</p>
              )}
            </div>
            <div className="grid gap-5 xl:grid-cols-[0.85fr_560px_0.85fr]">
              <TeamRoster team={team} onChange={setTeam} accent="league" maxSize={maxTeamSize} />
              <FieldBar state={field} onChange={setField} />
              <PokemonCard
                role="defender"
                accent="brick"
                state={defender}
                onChange={setDefender}
                field={field}
                sideKey="defenderSide"
              />
            </div>
          </>
        )}

        {mode === "AllvAll" && (
          <>
            <div className="card-shell p-4">
              <AllVsAllMatrix teamA={team} teamB={teamB} field={field} />
            </div>
            <div className="grid gap-5 xl:grid-cols-[1fr_560px_1fr]">
              <TeamRoster team={team} onChange={setTeam} accent="league" maxSize={maxTeamSize} />
              <FieldBar state={field} onChange={setField} />
              <TeamRoster team={teamB} onChange={setTeamB} accent="brick" maxSize={maxTeamSize} />
            </div>
          </>
        )}

        {mode === "speedTiers" && <SpeedComparator />}

        {mode === "moveComparator" && <MoveComparator />}

        {mode === "bestMoves" && (
          <>
            <div className="grid grid-cols-2 gap-2 sm:gap-5">
              <ResultPanel
                title={`${attacker.species || t("card.attacker")} → ${defender.species || t("card.defender")}${bestLoading ? "…" : ""}`}
                accent="league"
                results={bestForward}
                configurableLimit
                attacker={attacker}
                defender={defender}
                field={field}
              />
              <ResultPanel
                title={`${defender.species || t("card.defender")} → ${attacker.species || t("card.attacker")}${bestLoading ? "…" : ""}`}
                accent="brick"
                results={bestBackward}
                configurableLimit
                attacker={defender}
                defender={attacker}
                field={field}
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
                field={field}
                sideKey="attackerSide"
              />
              <FieldBar state={field} onChange={setField} />
              <PokemonCard
                role="defender"
                accent="brick"
                state={defender}
                onChange={setDefender}
                showMoves={false}
                restrictAbilityToReal
                field={field}
                sideKey="defenderSide"
              />
            </div>
          </>
        )}
          </>
        )}

        <footer className="flex flex-col items-center gap-1 pb-6 pt-2 text-center text-xs text-ink-dim sm:text-sm">
          <p className="max-w-2xl">{t("app.footer")}</p>
        </footer>
        </div>
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