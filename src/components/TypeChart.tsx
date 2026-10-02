"use client";

import { computeTypeChart } from "@/lib/typeChart";
import { useLocale } from "@/lib/i18n/LocaleContext";
import TypeBadge from "./TypeBadge";

const GROUPS: { mult: number; labelKey: string; color: string }[] = [
  { mult: 4, labelKey: "chart.x4", color: "var(--color-danger)" },
  { mult: 2, labelKey: "chart.x2", color: "var(--color-amber)" },
  { mult: 0.5, labelKey: "chart.x05", color: "var(--color-success)" },
  { mult: 0.25, labelKey: "chart.x025", color: "var(--color-league)" },
  { mult: 0, labelKey: "chart.x0", color: "var(--color-ink-dim)" },
];

export default function TypeChart({ types }: { types: string[] }) {
  const { t } = useLocale();
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
    <div className="mt-2 flex flex-col gap-2">
      {grouped.map((g) => (
        <div key={g.mult} className="flex flex-wrap items-center gap-1.5">
          <span className="tabular w-9 shrink-0 text-xs font-bold" style={{ color: g.color }}>
            {t(g.labelKey)}
          </span>
          {g.types.map((ty) => (
            <TypeBadge key={ty} type={ty} size="sm" />
          ))}
        </div>
      ))}
    </div>
  );
}