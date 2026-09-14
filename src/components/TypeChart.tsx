"use client";

import { computeTypeChart } from "@/lib/typeChart";
import { typeIconUrl } from "@/lib/sprites";
import { toFrenchType } from "@/lib/champions/gameTranslations";
import { useLocale } from "@/lib/i18n/LocaleContext";

const GROUPS: { mult: number; labelKey: string; color: string }[] = [
  { mult: 4, labelKey: "chart.x4", color: "var(--color-danger)" },
  { mult: 2, labelKey: "chart.x2", color: "var(--color-amber)" },
  { mult: 0.5, labelKey: "chart.x05", color: "var(--color-success)" },
  { mult: 0.25, labelKey: "chart.x025", color: "var(--color-league)" },
  { mult: 0, labelKey: "chart.x0", color: "var(--color-ink-dim)" },
];

export default function TypeChart({ types }: { types: string[] }) {
  const { t, locale } = useLocale();
  if (types.length === 0) return null;
  const chart = computeTypeChart(types);

  const grouped = GROUPS.map((g) => ({
    ...g,
    types: Object.entries(chart)
      .filter(([, m]) => m === g.mult)
      .map(([ty]) => ty),
  })).filter((g) => g.types.length > 0);

  if (grouped.length === 0) return null;

  return (
    <div className="mt-2 flex flex-col gap-1.5">
      {grouped.map((g) => (
        <div key={g.mult} className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="tabular w-9 shrink-0 font-bold" style={{ color: g.color }}>
            {t(g.labelKey)}
          </span>
          {g.types.map((ty) => (
            <span
              key={ty}
              className="flex items-center gap-1 rounded-[6px] px-1.5 py-0.5"
              style={{ background: "var(--color-panel-strong)" }}
              title={locale === "fr" ? toFrenchType(ty) : ty}
            >
              {typeIconUrl(ty) && <img src={typeIconUrl(ty)!} alt="" className="h-4 w-4 object-contain" />}
            </span>
          ))}
        </div>
      ))}
    </div>
  );
}