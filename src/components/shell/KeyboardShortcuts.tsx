"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale } from "@/lib/i18n/LocaleContext";

export type GoTarget = "calc" | "speed" | "team" | "dex" | "search" | "db" | "types" | "opt" | "new";

interface Props {
  onGo: (target: GoTarget) => void;
  onSwap: () => void;
  onToggleLocale: () => void;
  helpOpen: boolean;
  setHelpOpen: (open: boolean) => void;
}

const GO_KEYS: Record<string, GoTarget> = {
  c: "calc",
  s: "speed",
  t: "team",
  p: "dex",
  f: "search",
  d: "db",
  y: "types",
  o: "opt",
  w: "new",
};

const isTyping = (el: EventTarget | null) => {
  const n = el as HTMLElement | null;
  if (!n || !n.tagName) return false;
  return n.tagName === "INPUT" || n.tagName === "TEXTAREA" || n.tagName === "SELECT" || n.isContentEditable;
};

/** Global keyboard shortcuts (GitHub-style "g then letter" navigation) plus
 * the help dialog that lists them. Ignored while typing in a field. */
export default function KeyboardShortcuts({ onGo, onSwap, onToggleLocale, helpOpen, setHelpOpen }: Props) {
  const { t } = useLocale();
  const pendingG = useRef<number | null>(null);
  const [, force] = useState(0);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && helpOpen) {
        setHelpOpen(false);
        return;
      }
      if (e.ctrlKey || e.metaKey || e.altKey || isTyping(e.target)) return;

      if (pendingG.current !== null) {
        window.clearTimeout(pendingG.current);
        pendingG.current = null;
        const target = GO_KEYS[e.key.toLowerCase()];
        if (target) {
          e.preventDefault();
          onGo(target);
        }
        return;
      }
      switch (e.key) {
        case "?":
          e.preventDefault();
          setHelpOpen(!helpOpen);
          break;
        case "/":
          e.preventDefault();
          onGo("search");
          break;
        case "g":
          pendingG.current = window.setTimeout(() => {
            pendingG.current = null;
            force((n) => n + 1);
          }, 1200);
          break;
        case "x":
          onSwap();
          break;
        case "l":
          onToggleLocale();
          break;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onGo, onSwap, onToggleLocale, helpOpen, setHelpOpen]);

  if (!helpOpen) return null;

  const rows: [string, string][] = [
    ["?", t("kbd.help")],
    ["/", t("kbd.search")],
    ["g c", t("kbd.go.calc")],
    ["g s", t("kbd.go.speed")],
    ["g t", t("kbd.go.team")],
    ["g p", t("kbd.go.dex")],
    ["g f", t("kbd.go.search")],
    ["g d", t("kbd.go.db")],
    ["g y", t("kbd.go.types")],
    ["g o", t("kbd.go.opt")],
    ["g w", t("kbd.go.new")],
    ["x", t("kbd.swap")],
    ["l", t("kbd.locale")],
    ["Esc", t("kbd.close")],
  ];

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 p-4" onClick={() => setHelpOpen(false)}>
      <div className="card-shell w-full max-w-md p-5" onClick={(e) => e.stopPropagation()} role="dialog" aria-label={t("kbd.title")}>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="heading text-lg" style={{ color: "var(--color-ink-bright)" }}>
            {t("kbd.title")}
          </h2>
          <button type="button" className="pill-btn" onClick={() => setHelpOpen(false)} aria-label={t("sheet.close")}>
            ✕
          </button>
        </div>
        <ul className="flex flex-col gap-1.5">
          {rows.map(([keys, label]) => (
            <li key={keys} className="flex items-center justify-between gap-3 text-sm">
              <span style={{ color: "var(--color-ink-soft)" }}>{label}</span>
              <span className="flex gap-1">
                {keys.split(" ").map((k, i) => (
                  <kbd
                    key={i}
                    className="tabular rounded-[6px] px-2 py-0.5 text-xs font-bold"
                    style={{ background: "var(--color-panel-strong)", border: "1px solid var(--color-line-strong)", color: "var(--color-amber)" }}
                  >
                    {k}
                  </kbd>
                ))}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
