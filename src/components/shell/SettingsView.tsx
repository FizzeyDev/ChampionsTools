"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale } from "@/lib/i18n/LocaleContext";
import { LOCALES } from "@/lib/i18n/translations";

const LOCALE_LABEL: Record<string, string> = { en: "English", fr: "Français" };
import {
  DEFAULT_SETTINGS,
  THEMES,
  applySettings,
  exportBackup,
  importBackup,
  loadSettings,
  saveSettings,
  type Settings,
  type TextSize,
} from "@/lib/app/settings";
import Seg from "../ui/Seg";

function Row({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5 border-t py-3 first:border-t-0 first:pt-0" style={{ borderColor: "var(--color-line)" }}>
      <span className="text-sm font-bold" style={{ color: "var(--color-ink-bright)" }}>
        {title}
      </span>
      {hint && (
        <span className="text-xs" style={{ color: "var(--color-ink-dim)" }}>
          {hint}
        </span>
      )}
      <div className="mt-1">{children}</div>
    </div>
  );
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="inline-flex items-center gap-2 text-sm" style={{ color: "var(--color-ink-soft)" }}>
      <input type="checkbox" className="field-checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      {label}
    </label>
  );
}

export default function SettingsView() {
  const { t, locale, setLocale } = useLocale();
  const [s, setS] = useState<Settings>(DEFAULT_SETTINGS);
  const [msg, setMsg] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setS(loadSettings());
  }, []);

  const update = (patch: Partial<Settings>) => {
    const next = { ...s, ...patch };
    setS(next);
    applySettings(next);
    saveSettings(next);
  };

  const download = () => {
    const blob = new Blob([exportBackup()], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `champions-tools-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    setMsg(t("settings.exported"));
  };

  const onFile = async (f: File | undefined) => {
    if (!f) return;
    const n = importBackup(await f.text());
    if (n === null) {
      setMsg(t("settings.importBad"));
    } else {
      setMsg(t("settings.imported").replace("{n}", String(n)));
      setTimeout(() => window.location.reload(), 900);
    }
    if (fileRef.current) fileRef.current.value = "";
  };

  const textOptions: { value: TextSize; label: string }[] = [
    { value: "small", label: t("settings.text.small") },
    { value: "normal", label: t("settings.text.normal") },
    { value: "large", label: t("settings.text.large") },
    { value: "xlarge", label: t("settings.text.xlarge") },
  ];

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4">
      <div className="card-shell p-4">
        <h2 className="heading text-xl" style={{ color: "var(--color-ink-bright)" }}>
          {t("settings.title")}
        </h2>
        <p className="text-xs" style={{ color: "var(--color-ink-dim)" }}>
          {t("settings.subtitle")}
        </p>
      </div>

      <div className="card-shell p-4">
        <h3 className="eyebrow mb-3">{t("settings.appearance")}</h3>
        <Row title={t("settings.theme")} hint={t("settings.themeHint")}>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {THEMES.map((th) => {
              const active = s.theme === th.id;
              return (
                <button
                  key={th.id}
                  type="button"
                  onClick={() => update({ theme: th.id })}
                  aria-pressed={active}
                  className="flex flex-col gap-2 rounded-[10px] p-2.5 text-left transition-colors"
                  style={{
                    background: "var(--color-panel-soft)",
                    border: `2px solid ${active ? "var(--color-league)" : "var(--color-line)"}`,
                  }}
                >
                  <span className="flex h-9 overflow-hidden rounded-[6px]" style={{ border: "1px solid var(--color-line-strong)" }}>
                    <span className="flex-[2]" style={{ background: th.swatch[0] }} />
                    <span className="flex-[2]" style={{ background: th.swatch[1] }} />
                    <span className="flex-1" style={{ background: th.swatch[2] }} />
                    <span className="flex-1" style={{ background: th.swatch[3] }} />
                  </span>
                  <span className="text-sm font-bold" style={{ color: "var(--color-ink-bright)" }}>
                    {t(`settings.theme.${th.id}`)}
                    {active && " ✓"}
                  </span>
                </button>
              );
            })}
          </div>
        </Row>
        <Row title={t("settings.textSize")}>
          <Seg value={s.text} onChange={(v) => update({ text: v })} options={textOptions} />
        </Row>
        <Row title={t("settings.font")} hint={t("settings.fontHint")}>
          <Seg
            value={s.font}
            onChange={(v) => update({ font: v })}
            options={[
              { value: "stylised" as const, label: t("settings.font.stylised") },
              { value: "clean" as const, label: t("settings.font.clean") },
            ]}
          />
        </Row>
        <Row title={t("settings.effects")}>
          <div className="flex flex-col gap-2">
            <Toggle checked={s.backdrop} onChange={(v) => update({ backdrop: v })} label={t("settings.backdrop")} />
            <Toggle checked={s.reduceMotion} onChange={(v) => update({ reduceMotion: v })} label={t("settings.reduceMotion")} />
          </div>
        </Row>
      </div>

      <div className="card-shell p-4">
        <h3 className="eyebrow mb-3">{t("settings.general")}</h3>
        <Row title={t("settings.language")}>
          <Seg
            value={locale}
            onChange={setLocale}
            options={LOCALES.map((l) => ({ value: l, label: LOCALE_LABEL[l] ?? l }))}
          />
        </Row>
        <Row title={t("settings.backup")} hint={t("settings.backupHint")}>
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" className="pill-btn" onClick={download}>
              {t("settings.export")}
            </button>
            <button type="button" className="pill-btn" onClick={() => fileRef.current?.click()}>
              {t("settings.import")}
            </button>
            <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
          </div>
          {msg && (
            <p className="mt-2 text-xs font-bold" role="status" style={{ color: "var(--color-success)" }}>
              {msg}
            </p>
          )}
        </Row>
        <Row title={t("settings.reset")}>
          <button
            type="button"
            className="pill-btn"
            onClick={() => {
              setS(DEFAULT_SETTINGS);
              applySettings(DEFAULT_SETTINGS);
              saveSettings(DEFAULT_SETTINGS);
            }}
          >
            {t("settings.resetBtn")}
          </button>
        </Row>
      </div>
    </div>
  );
}
