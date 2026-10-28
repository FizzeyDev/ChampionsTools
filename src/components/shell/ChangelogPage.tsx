"use client";

import { useEffect } from "react";
import { CHANGELOG, markChangelogSeen, type ChangelogTag } from "@/lib/features/changelog";
import { useLocale } from "@/lib/i18n/LocaleContext";

const TAG_STYLE: Record<ChangelogTag, { color: string; soft: string }> = {
  update: { color: "var(--color-league)", soft: "var(--color-league-soft)" },
  fix: { color: "var(--color-danger)", soft: "var(--color-danger-soft)" },
  new: { color: "var(--color-success)", soft: "var(--color-success-soft)" },
};

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

export default function ChangelogPage() {
  const { t, locale } = useLocale();

  // Visiting the page is what clears the "unseen update" dot in the sidebar.
  useEffect(() => {
    markChangelogSeen();
  }, []);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <p className="eyebrow" style={{ color: "var(--color-ink-dim)" }}>
          {t("app.title")} · {t("changelog.tracker")}
        </p>
        <h2
          className="heading text-xl"
          style={{ color: "var(--color-violet)", textShadow: "0 0 20px var(--color-violet-glow)" }}
        >
          {t("changelog.title")}
        </h2>
      </div>

      <div className="flex flex-col gap-5">
        {CHANGELOG.map((entry) => (
          <div key={entry.version} className="card-shell p-4">
            <p className="mb-3 text-sm font-bold tabular" style={{ color: "var(--color-ink-bright)" }}>
              v{entry.version} <span style={{ color: "var(--color-ink-dim)", fontWeight: 400 }}>· {entry.date}</span>
            </p>
            <ul className="flex flex-col gap-2.5">
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
  );
}