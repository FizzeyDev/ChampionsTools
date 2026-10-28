"use client";

import { useEffect, useMemo, useState } from "react";
import TeamSlotCard from "./TeamSlotCard";
import TypeBadge from "../ui/TypeBadge";
import { pokemonSpriteUrl } from "@/lib/app/sprites";
import { toFrench } from "@/lib/champions/gameTranslations";
import { useLocale } from "@/lib/i18n/LocaleContext";
import { parseShowdownTeam, exportShowdownTeam } from "@/lib/share/showdownSet";
import {
  emptyTeam,
  loadTeam,
  saveTeam,
  getSavedTeams,
  saveNamedTeam,
  deleteSavedTeam,
  TEAM_SIZE,
  type SavedTeam,
} from "@/lib/features/savedTeam";
import { analyzeTeam, type WeaknessLabel } from "@/lib/features/teamCoverage";
import { buildTeamUrl, readTeamFromLocation } from "@/lib/share/teamShare";
import { renderTeamImage } from "@/lib/share/teamImage";
import type { PokemonState } from "@/lib/calc/types";

const LABEL_STYLE: Record<WeaknessLabel, { color: string; key: string }> = {
  veryWeak: { color: "var(--color-danger)", key: "teamCov.veryWeak" },
  weak: { color: "var(--color-amber)", key: "teamCov.weak" },
  resist: { color: "var(--color-success)", key: "teamCov.resist" },
  veryResist: { color: "var(--color-league)", key: "teamCov.veryResist" },
};

export default function TeamCoverage() {
  const { t, locale } = useLocale();
  const [team, setTeam] = useState<PokemonState[]>(emptyTeam());
  const [loaded, setLoaded] = useState(false);
  const [showThreats, setShowThreats] = useState(false);
  const [savedTeams, setSavedTeams] = useState<SavedTeam[]>([]);
  const [showManage, setShowManage] = useState(false);
  const [saveName, setSaveName] = useState("");
  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState("");
  const [importError, setImportError] = useState("");

  // A team opened from a shared link is shown, but NOT written over the
  // visitor's own saved working team until they choose to keep it.
  const [sharedView, setSharedView] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [imageBusy, setImageBusy] = useState(false);

  useEffect(() => {
    const shared = readTeamFromLocation();
    if (shared) {
      const padded = emptyTeam();
      shared.forEach((m, i) => (padded[i] = m));
      setTeam(padded);
      setSharedView(true);
    } else {
      setTeam(loadTeam());
    }
    setSavedTeams(getSavedTeams());
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded && !sharedView) saveTeam(team);
  }, [team, loaded, sharedView]);

  const keepShared = () => {
    setSharedView(false);
    history.replaceState(null, "", window.location.pathname + window.location.search);
  };
  const discardShared = () => {
    setTeam(loadTeam());
    setSharedView(false);
    history.replaceState(null, "", window.location.pathname + window.location.search);
  };

  const doShare = async () => {
    const url = buildTeamUrl(team);
    try {
      await navigator.clipboard.writeText(url);
      setLinkCopied(true);
      window.setTimeout(() => setLinkCopied(false), 2000);
    } catch {
      window.prompt(locale === "fr" ? "Copie ce lien :" : "Copy this link:", url);
    }
  };

  const doImage = async () => {
    setImageBusy(true);
    try {
      const blob = await renderTeamImage(team, analysis.weaknesses, locale, {
        title: t("teamCov.title"),
        weak: t("teamCov.weak"),
        veryWeak: t("teamCov.veryWeak"),
        resist: t("teamCov.resist"),
        veryResist: t("teamCov.veryResist"),
        footer: t("teamCov.imageFooter"),
        stat: { hp: t("stat.hp"), atk: "Atk", def: "Def", spa: "SpA", spd: "SpD", spe: "Spe" },
      });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "champions-team.png";
      a.click();
      window.setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    } finally {
      setImageBusy(false);
    }
  };

  const analysis = useMemo(() => analyzeTeam(team, showThreats), [team, showThreats]);

  const updateSlot = (i: number, next: PokemonState) => {
    const copy = [...team];
    copy[i] = next;
    setTeam(copy);
  };

  const clearSlot = (i: number) => {
    const copy = [...team];
    copy[i] = emptyTeam()[0];
    setTeam(copy);
  };

  const resetTeam = () => setTeam(emptyTeam());

  const doSave = () => {
    if (!saveName.trim()) return;
    saveNamedTeam(saveName, team);
    setSavedTeams(getSavedTeams());
    setSaveName("");
  };

  const doLoad = (entry: SavedTeam) => {
    const padded = emptyTeam();
    for (let i = 0; i < TEAM_SIZE; i++) if (entry.team[i]) padded[i] = entry.team[i];
    setTeam(padded);
    setShowManage(false);
  };

  const doDelete = (id: string) => {
    deleteSavedTeam(id);
    setSavedTeams(getSavedTeams());
  };

  const doImport = () => {
    const parsed = parseShowdownTeam(importText, TEAM_SIZE);
    if (parsed.length === 0) {
      setImportError(t("team.importError"));
      return;
    }
    const padded = emptyTeam();
    for (let i = 0; i < Math.min(TEAM_SIZE, parsed.length); i++) padded[i] = parsed[i];
    setTeam(padded);
    setShowImport(false);
    setImportError("");
    setImportText("");
  };

  const doExport = async () => {
    const text = exportShowdownTeam(team.filter((m) => m.species));
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      window.prompt(locale === "fr" ? "Copie ton équipe :" : "Copy your team:", text);
    }
  };

  const speciesLabel = (s: string) => (locale === "fr" ? toFrench("species", s) : s);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="heading text-lg" style={{ color: "var(--color-ink-bright)" }}>
            {t("teamCov.title")}
          </h2>
          <p className="text-xs text-ink-dim">{t("teamCov.subtitle")}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={() => setShowImport((s) => !s)} className="pill-btn text-[0.68rem]">
            {t("teamCov.importTeam")}
          </button>
          <button type="button" onClick={doExport} className="pill-btn text-[0.68rem]">
            {t("teamCov.exportTeam")}
          </button>
          <button
            type="button"
            onClick={doShare}
            disabled={analysis.filledCount === 0}
            className="pill-btn text-[0.68rem]"
            style={{ color: "var(--color-violet)", borderColor: "rgba(159,83,236,0.4)", background: "var(--color-violet-soft)" }}
          >
            🔗 {linkCopied ? t("app.linkCopied") : t("teamCov.shareLink")}
          </button>
          <button
            type="button"
            onClick={doImage}
            disabled={analysis.filledCount === 0 || imageBusy}
            className="pill-btn text-[0.68rem]"
          >
            🖼 {imageBusy ? t("common.loading") : t("teamCov.exportImage")}
          </button>
          <button
            type="button"
            onClick={() => setShowManage((s) => !s)}
            className="pill-btn text-[0.68rem]"
            style={{ color: "var(--color-amber)", borderColor: "rgba(255,215,64,0.4)", background: "var(--color-amber-soft)" }}
          >
            ★ {t("teamCov.savedTeams")}
          </button>
          <button type="button" onClick={resetTeam} className="pill-btn text-[0.68rem]">
            {t("teamCov.resetTeam")}
          </button>
        </div>
      </div>

      {sharedView && (
        <div
          className="flex flex-wrap items-center justify-between gap-2 rounded-[10px] p-3 text-sm"
          style={{ background: "var(--color-violet-soft)", border: "1px solid rgba(159,83,236,0.4)" }}
        >
          <span style={{ color: "var(--color-ink-bright)" }}>{t("teamCov.sharedBanner")}</span>
          <span className="flex gap-2">
            <button type="button" className="pill-btn" onClick={keepShared}>
              {t("teamCov.sharedKeep")}
            </button>
            <button type="button" className="pill-btn" onClick={discardShared}>
              {t("teamCov.sharedDiscard")}
            </button>
          </span>
        </div>
      )}

      {showImport && (
        <div className="card-shell p-3">
          <textarea
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            placeholder={t("team.importPlaceholder")}
            rows={8}
            className="field-input tabular w-full p-2 text-xs"
          />
          <div className="mt-2 flex items-center gap-2">
            <button
              type="button"
              onClick={doImport}
              className="pill-btn"
              style={{ color: "var(--color-paper)", background: "var(--color-violet)", borderColor: "var(--color-violet)" }}
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

      {showManage && (
        <div className="card-shell p-3">
          <div className="mb-3 flex items-center gap-2">
            <input
              type="text"
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              placeholder={t("teamCov.saveNamePlaceholder")}
              className="field-input flex-1 px-2.5 py-1.5 text-sm"
            />
            <button
              type="button"
              onClick={doSave}
              className="pill-btn"
              style={{ color: "var(--color-paper)", background: "var(--color-amber)", borderColor: "var(--color-amber)" }}
            >
              {t("teamCov.saveAs")}
            </button>
          </div>
          {savedTeams.length === 0 ? (
            <p className="text-xs text-ink-dim">{t("teamCov.noSavedTeams")}</p>
          ) : (
            <div className="flex flex-col gap-1.5">
              {savedTeams.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center gap-2 rounded-[8px] px-2.5 py-1.5"
                  style={{ background: "var(--color-panel-soft)" }}
                >
                  <div className="flex -space-x-2">
                    {entry.team
                      .filter((m) => m.species)
                      .slice(0, 6)
                      .map((m, i) =>
                        pokemonSpriteUrl(m.species, true) ? (
                          <img
                            key={i}
                            src={pokemonSpriteUrl(m.species, true)!}
                            alt=""
                            className="h-6 w-6 rounded-full object-contain"
                            style={{ background: "var(--color-panel)", border: "1px solid var(--color-line-strong)" }}
                          />
                        ) : null
                      )}
                  </div>
                  <span className="flex-1 truncate text-sm font-semibold">{entry.name}</span>
                  <button type="button" onClick={() => doLoad(entry)} className="pill-btn text-[0.62rem]">
                    {t("teamCov.load")}
                  </button>
                  <button
                    type="button"
                    onClick={() => doDelete(entry.id)}
                    className="rounded-full px-1.5 py-0.5 text-xs"
                    style={{ color: "var(--color-danger)" }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {team.map((member, i) => (
          <TeamSlotCard
            key={i}
            index={i}
            state={member}
            onChange={(next) => updateSlot(i, next)}
            onClear={() => clearSlot(i)}
          />
        ))}
      </div>

      <div className="card-shell p-4">
        <p className="eyebrow mb-3" style={{ color: "var(--color-violet)" }}>
          {t("teamCov.analysis")}
        </p>

        {analysis.filledCount === 0 ? (
          <p className="text-sm text-ink-dim">{t("teamCov.emptyHint")}</p>
        ) : (
          <>
            <div className="mb-4">
              <p className="mb-2 text-xs font-semibold" style={{ color: "var(--color-ink-soft)" }}>
                {t("teamCov.weaknesses")}
              </p>
              {analysis.weaknesses.length === 0 ? (
                <p className="text-xs" style={{ color: "var(--color-success)" }}>
                  {t("teamCov.noWeaknesses")}
                </p>
              ) : (
                <div className="flex flex-col gap-2">
                  {(["veryWeak", "weak", "resist", "veryResist"] as WeaknessLabel[]).map((label) => {
                    const entries = analysis.weaknesses.filter((w) => w.label === label);
                    if (entries.length === 0) return null;
                    const style = LABEL_STYLE[label];
                    return (
                      <div key={label} className="flex flex-wrap items-center gap-1.5">
                        <span className="tabular w-24 shrink-0 text-xs font-bold" style={{ color: style.color }}>
                          {t(style.key)}
                        </span>
                        {entries.map((w) => (
                          <TypeBadge key={w.type} type={w.type} size="sm" />
                        ))}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {analysis.offensiveCoverage.length > 0 && (
              <div className="mb-4 border-t pt-3" style={{ borderColor: "var(--color-line)" }}>
                <p className="mb-1 text-xs font-semibold" style={{ color: "var(--color-ink-soft)" }}>
                  {t("teamCov.coverage")}
                </p>
                <p className="mb-2 text-[11px]" style={{ color: "var(--color-ink-dim)" }}>
                  {t("teamCov.coverageHint")}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {analysis.offensiveCoverage.map((ty) => (
                    <TypeBadge key={ty} type={ty} size="sm" />
                  ))}
                </div>
              </div>
            )}

            {analysis.recommendations.length > 0 && (
              <div className="mb-4 border-t pt-3" style={{ borderColor: "var(--color-line)" }}>
                <p className="mb-1 text-xs font-semibold" style={{ color: "var(--color-ink-soft)" }}>
                  {t("teamCov.recommendations")}
                </p>
                <p className="mb-2 text-[11px]" style={{ color: "var(--color-ink-dim)" }}>
                  {t("teamCov.recommendationsHint")}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {analysis.recommendations.map((r) => (
                    <TypeBadge key={r.type} type={r.type} size="md" />
                  ))}
                </div>
              </div>
            )}

            <div className="border-t pt-3" style={{ borderColor: "var(--color-line)" }}>
              <button
                type="button"
                onClick={() => setShowThreats((s) => !s)}
                className="pill-btn text-[0.68rem]"
                style={{ color: "var(--color-league)", borderColor: "rgba(79,195,247,0.4)", background: "var(--color-league-soft)" }}
              >
                {showThreats ? t("teamCov.hideThreats") : t("teamCov.showThreats")}
              </button>

              {showThreats && (
                <div className="mt-3">
                  <p className="mb-3 text-[11px]" style={{ color: "var(--color-ink-dim)" }}>
                    {t("teamCov.threatsHint")}
                  </p>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <p className="mb-2 text-xs font-semibold" style={{ color: "var(--color-success)" }}>
                        {t("teamCov.teamThreatens")}
                      </p>
                      {analysis.teamThreatens.length === 0 ? (
                        <p className="text-xs text-ink-dim">{t("teamCov.noThreats")}</p>
                      ) : (
                        <div className="flex flex-col gap-1.5">
                          {analysis.teamThreatens.map((entry) => (
                            <div key={entry.species} className="flex items-center gap-2 text-xs">
                              {pokemonSpriteUrl(entry.species, true) && (
                                <img
                                  src={pokemonSpriteUrl(entry.species, true)!}
                                  alt=""
                                  className="h-7 w-7 object-contain"
                                />
                              )}
                              <span className="flex-1 truncate">{speciesLabel(entry.species)}</span>
                              <span className="tabular font-bold" style={{ color: "var(--color-success)" }}>
                                {entry.score}×
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="mb-2 text-xs font-semibold" style={{ color: "var(--color-danger)" }}>
                        {t("teamCov.threatsToTeam")}
                      </p>
                      {analysis.threatsToTeam.length === 0 ? (
                        <p className="text-xs text-ink-dim">{t("teamCov.noThreats")}</p>
                      ) : (
                        <div className="flex flex-col gap-1.5">
                          {analysis.threatsToTeam.map((entry) => (
                            <div key={entry.species} className="flex items-center gap-2 text-xs">
                              {pokemonSpriteUrl(entry.species, true) && (
                                <img
                                  src={pokemonSpriteUrl(entry.species, true)!}
                                  alt=""
                                  className="h-7 w-7 object-contain"
                                />
                              )}
                              <span className="flex-1 truncate">{speciesLabel(entry.species)}</span>
                              <span className="tabular font-bold" style={{ color: "var(--color-danger)" }}>
                                {entry.score}×
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}