"use client";

import { useEffect, useMemo, useState } from "react";
import PokemonCard from "@/components/calculator/PokemonCard";
import FieldBar from "@/components/calculator/FieldBar";
import ResultPanel from "@/components/calculator/ResultPanel";
import TeamRoster from "@/components/team/TeamRoster";
import AllVsAllMatrix from "@/components/calculator/AllVsAllMatrix";
import SpeedComparator from "@/components/speed/SpeedComparator";
import MoveComparator from "@/components/calculator/MoveComparator";
import SavedPokemonModal from "@/components/calculator/SavedPokemonModal";
import TeamCoverage from "@/components/team/TeamCoverage";
import ChangelogPage from "@/components/shell/ChangelogPage";
import PokedexView from "@/components/encyclopedia/PokedexView";
import SearchView from "@/components/encyclopedia/SearchView";
import DatabaseView from "@/components/encyclopedia/DatabaseView";
import TypeToolsView from "@/components/encyclopedia/TypeToolsView";
import OptimizerView from "@/components/calculator/OptimizerView";
import SettingsView from "@/components/shell/SettingsView";
import KeyboardShortcuts, { type GoTarget } from "@/components/shell/KeyboardShortcuts";
import PokemonSheet from "@/components/encyclopedia/PokemonSheet";
import Sidebar, { type Mode } from "@/components/shell/Sidebar";
import { NavContext, type DbTab, type NavValue, type View } from "@/lib/app/nav";
import { computeMoveResults, swapSides, type MoveResult } from "@/lib/calc/calcEngine";
import ComboTray, { type ComboEntry, type Slot } from "@/components/calculator/ComboTray";
import { computeBestMoves } from "@/lib/features/bestMoves";
import { defaultField, defaultPokemon } from "@/lib/calc/types";
import { autofillForSpecies } from "@/lib/features/autofillSpecies";
import { buildShareUrl, readStateFromLocation } from "@/lib/share/shareLink";
import { useLocale } from "@/lib/i18n/LocaleContext";
import type { PokemonState } from "@/lib/calc/types";

export default function Home() {
  const { locale, setLocale, t } = useLocale();

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
  const [helpOpen, setHelpOpen] = useState(false);
  const [defender2, setDefender2] = useState<PokemonState | null>(null);
  const [combo, setCombo] = useState<ComboEntry[]>([]);
  const [comboSeq, setComboSeq] = useState(1);
  const [sheetSpecies, setSheetSpecies] = useState<string | null>(null);
  const [dbTarget, setDbTarget] = useState<{ tab: DbTab; name: string } | null>(null);

  const nav = useMemo<NavValue>(
    () => ({
      sheetSpecies,
      openSpecies: (species) => setSheetSpecies(species),
      closeSheet: () => setSheetSpecies(null),
      goView: (v) => {
        setSheetSpecies(null);
        setView(v);
      },
      openDatabase: (tab, name) => {
        setSheetSpecies(null);
        setDbTarget({ tab, name });
        setView("database");
      },
      dbTarget,
    }),
    [sheetSpecies, dbTarget]
  );

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

  // Champions matches are 3v3 (Singles) or 4v4 (Doubles) - never 6v6, even
  // though you build a roster of 6 beforehand. Team-mode rosters are capped
  // to the active battle size, and trimmed automatically if the format
  // switches to a smaller one.
  const maxTeamSize = field.gameType === "Singles" ? 3 : 4;
  useEffect(() => {
    setTeam((t) => (t.length > maxTeamSize ? t.slice(0, maxTeamSize) : t));
    setTeamB((t) => (t.length > maxTeamSize ? t.slice(0, maxTeamSize) : t));
  }, [maxTeamSize]);

  useEffect(() => {
    const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    if (hashParams.get("search")) setView("search");
    else if (hashParams.get("team")) setView("teamCoverage");
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
  // Seen from the defender's side, the two field sides are swapped.
  const backwardField = useMemo(() => swapSides(field), [field]);
  const backwardResults = useMemo(
    () => computeMoveResults(defender, attacker, backwardField),
    [attacker, defender, backwardField]
  );
  const secondResults = useMemo(
    () => (defender2 ? computeMoveResults(attacker, defender2, field) : []),
    [attacker, defender2, field]
  );

  const addHit = (from: PokemonState, to: Slot, moveIndex: number) => {
    const move = from.moves[moveIndex];
    if (!move) return;
    setCombo((c) => [...c, { id: comboSeq, source: from, to, move, crit: !!from.critMoves[moveIndex] }]);
    setComboSeq((n) => n + 1);
  };
  const comboFieldFor = useMemo(
    () => (to: Slot) => (to === "attacker" ? backwardField : field),
    [field, backwardField]
  );

  useEffect(() => {
    if (mode !== "bestMoves") return;
    let cancelled = false;
    setBestLoading(true);
    Promise.all([
      computeBestMoves(attacker, defender, field),
      computeBestMoves(defender, attacker, backwardField),
    ]).then(([fwd, bwd]) => {
      if (cancelled) return;
      setBestForward(fwd);
      setBestBackward(bwd);
      setBestLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [mode, attacker, defender, field, backwardField]);

  const swap = () => {
    setAttacker(defender);
    setDefender(attacker);
  };

  const goTo = (target: GoTarget) => {
    setSheetSpecies(null);
    setMobileNavOpen(false);
    if (target === "calc") {
      setMode((m) => (m === "speedTiers" ? "1v1" : m));
      setView("calculator");
    } else if (target === "speed") {
      setMode("speedTiers");
      setView("calculator");
    } else {
      setView(
        ({ team: "teamCoverage", dex: "pokedex", search: "search", db: "database", types: "types", opt: "optimizer", new: "changelog" } as const)[target]
      );
    }
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
    <NavContext.Provider value={nav}>
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
            <div className="ml-auto flex flex-wrap items-center gap-2">
              {view === "calculator" && (
                <>
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
                </>
              )}
              <button
                onClick={() => setHelpOpen(true)}
                className="pill-btn hidden sm:inline-flex"
                title={t("kbd.title")}
                aria-label={t("kbd.title")}
              >
                ⌨ ?
              </button>
            </div>
          </div>
        </header>

        <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-5 px-4 py-6 sm:px-6">
        {view === "pokedex" && <PokedexView />}

        {view === "search" && <SearchView />}

        {view === "database" && <DatabaseView />}

        {view === "types" && <TypeToolsView />}

        {view === "optimizer" && (
          <OptimizerView
            attacker={attacker}
            defender={defender}
            field={field}
            onChangeAttacker={setAttacker}
            onChangeDefender={setDefender}
          />
        )}

        {view === "teamCoverage" && <TeamCoverage />}

        {view === "changelog" && <ChangelogPage />}

        {view === "settings" && <SettingsView />}

        {view === "calculator" && (
          <>
        {mode === "1v1" && (
          <>
            <div className="flex justify-end">
              {defender2 ? (
                <button type="button" className="pill-btn" onClick={() => setDefender2(null)}>
                  ✕ {t("calc.removeSecondTarget")}
                </button>
              ) : (
                <button type="button" className="pill-btn" onClick={() => setDefender2({ ...defender })}>
                  {t("calc.secondTarget")}
                </button>
              )}
            </div>
            <div className={`grid grid-cols-2 gap-2 sm:gap-5 ${defender2 ? "xl:grid-cols-3" : ""}`}>
              <ResultPanel
                title={`${attacker.species || t("card.attacker")} → ${defender.species || t("card.defender")}`}
                accent="league"
                results={forwardResults}
                critMoves={attacker.critMoves}
                onToggleCrit={(i) => toggleCrit(setAttacker, attacker, i)}
                onAddHit={(i) => addHit(attacker, "defender", i)}
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
                onAddHit={(i) => addHit(defender, "attacker", i)}
                attacker={defender}
                defender={attacker}
                field={backwardField}
              />
              {defender2 && (
                <ResultPanel
                  title={`${attacker.species || t("card.attacker")} → ${defender2.species || t("calc.secondTargetTitle")}`}
                  accent="league"
                  results={secondResults}
                  critMoves={attacker.critMoves}
                  onToggleCrit={(i) => toggleCrit(setAttacker, attacker, i)}
                  onAddHit={(i) => addHit(attacker, "defender2", i)}
                  attacker={attacker}
                  defender={defender2}
                  field={field}
                />
              )}
            </div>
            <ComboTray
              entries={combo}
              targets={{ attacker, defender, defender2 }}
              fieldFor={comboFieldFor}
              onRemove={(id) => setCombo((c) => c.filter((e) => e.id !== id))}
              onClear={() => setCombo([])}
            />
            <div className="grid gap-5 2xl:grid-cols-[minmax(0,0.85fr)_560px_minmax(0,0.85fr)]">
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
            {defender2 && (
              <div className="grid gap-5 2xl:grid-cols-[minmax(0,0.85fr)_560px_minmax(0,0.85fr)]">
                <div />
                <div />
                <PokemonCard
                  role="defender"
                  accent="brick"
                  state={defender2}
                  onChange={setDefender2}
                  field={field}
                  sideKey="defenderSide"
                />
              </div>
            )}
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
            <div className="grid gap-5 2xl:grid-cols-[minmax(0,0.85fr)_560px_minmax(0,0.85fr)]">
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
            <div className="grid gap-5 2xl:grid-cols-[minmax(0,0.85fr)_560px_minmax(0,0.85fr)]">
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
            <div className="grid gap-5 2xl:grid-cols-[minmax(0,1fr)_560px_minmax(0,1fr)]">
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
                field={backwardField}
              />
            </div>
            <div className="grid gap-5 2xl:grid-cols-[minmax(0,0.85fr)_560px_minmax(0,0.85fr)]">
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
      <PokemonSheet />
      <KeyboardShortcuts
        onGo={goTo}
        onSwap={() => {
          if (view === "calculator" && (mode === "1v1" || mode === "bestMoves")) swap();
        }}
        onToggleLocale={() => setLocale(locale === "fr" ? "en" : "fr")}
        helpOpen={helpOpen}
        setHelpOpen={setHelpOpen}
      />
    </div>
    </NavContext.Provider>
  );
}