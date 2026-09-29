"use client";

import { useEffect, useState } from "react";
import { CHANGELOG, CURRENT_VERSION, type ChangelogTag } from "@/lib/features/changelog";
import { useLocale } from "@/lib/i18n/LocaleContext";

const STORAGE_KEY = "champcalc.lastSeenVersion";

const TAG_STYLE: Record<ChangelogTag, { color: string; soft: string }> = {
  update: { color: "var(--color-league)", soft: "var(--color-league-soft)" },
  fix: { color: "var(--color-danger)", soft: "var(--color-danger-soft)" },
  new: { color: "var(--color-success)", soft: "var(--color-success-soft)" },
};

function compareVersions(a: string, b: string): number {
  const pa = a.split(".").map(Number);
  const pb = b.split(".").map(Number);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const diff = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

function TagBadge({ tag }: { tag: ChangelogTag }) {
  const { t } = useLocale();
  const style = TAG_STYLE[tag];
  return (
    <span
      className="eyebrow shrink-0 rounded-[4px] px-1.5 py-0.5 text-[0.6rem]"
      style={{ color: style.color, background: style.soft, border: `1px solid ${style.color}` }}
    >
      {t(`changelog.tag.${tag}`)}
    </span>
  );
}

interface ChangelogModalProps {
  /** Set to true (e.g. from a "What's new" header button) to open the
   * modal on demand, showing the FULL history rather than just what's new
   * since the visitor's last seen version. Edge-triggered: toggling it
   * back to false doesn't close an already-open modal by itself. */
  forceOpen?: boolean;
  /** Called once the modal closes after being force-opened, so the parent
   * can reset its own toggle state back to false. */
  onForceClose?: () => void;
}

export default function ChangelogModal({ forceOpen = false, onForceClose }: ChangelogModalProps) {
  const { t, locale } = useLocale();
  const [open, setOpen] = useState(false);
  const [entries, setEntries] = useState(CHANGELOG.slice(0, 1));
  const [openedByUser, setOpenedByUser] = useState(false);

  useEffect(() => {
    let lastSeen: string | null = null;
    try {
      lastSeen = window.localStorage.getItem(STORAGE_KEY);
    } catch {
      // storage unavailable — just show the latest entry once per session
    }

    if (lastSeen === CURRENT_VERSION) return;

    // First-ever visit: nothing to be "new since" — introduce the current
    // state with just the latest entry. Returning after an update:
    // everything newer than what they last saw, newest first.
    const relevant = lastSeen
      ? CHANGELOG.filter((e) => compareVersions(e.version, lastSeen!) > 0)
      : CHANGELOG.slice(0, 1);

    if (relevant.length === 0) return;
    setEntries(relevant);
    setOpen(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!forceOpen) return;
    setEntries(CHANGELOG);
    setOpen(true);
    setOpenedByUser(true);
  }, [forceOpen]);

  const close = () => {
    setOpen(false);
    try {
      window.localStorage.setItem(STORAGE_KEY, CURRENT_VERSION);
    } catch {
      // ignore
    }
    if (openedByUser) {
      setOpenedByUser(false);
      onForceClose?.();
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.6)" }}
      onClick={close}
    >
      <div
        className="card-shell flex max-h-[80vh] w-full max-w-lg flex-col overflow-hidden p-4"
        style={{ borderColor: "rgba(159,83,236,0.35)", boxShadow: "var(--shadow-lg), 0 0 40px var(--color-violet-glow)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between border-b pb-3" style={{ borderColor: "var(--color-line)" }}>
          <div>
            <p className="eyebrow" style={{ color: "var(--color-ink-dim)" }}>
              {t("app.title")} · {t("changelog.tracker")}
            </p>
            <h2 className="heading text-lg" style={{ color: "var(--color-violet)", textShadow: "0 0 20px var(--color-violet-glow)" }}>
              {t("changelog.title")}
            </h2>
          </div>
          <button type="button" onClick={close} className="pill-btn text-[0.68rem]">
            {t("changelog.close")}
          </button>
        </div>

        <div className="flex flex-col gap-4 overflow-y-auto pr-1">
          {entries.map((entry) => (
            <div key={entry.version}>
              <p className="mb-2 text-sm font-bold tabular" style={{ color: "var(--color-ink-bright)" }}>
                v{entry.version} <span style={{ color: "var(--color-ink-dim)", fontWeight: 400 }}>· {entry.date}</span>
              </p>
              <ul className="flex flex-col gap-2">
                {entry.notes.map((note, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <span className="mt-0.5 shrink-0" style={{ color: TAG_STYLE[note.tag].color }}>
                      ✦
                    </span>
                    <TagBadge tag={note.tag} />
                    <span style={{ color: "var(--color-ink-soft)" }}>{locale === "fr" ? note.fr : note.en}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}