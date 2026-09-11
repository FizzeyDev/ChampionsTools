"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useLocale } from "@/lib/i18n/LocaleContext";

interface Option {
  value: string;
  subtitle?: ReactNode;
  preferred?: boolean;
}

type Row = { kind: "header"; label: string } | { kind: "option"; opt: Option };

interface IconSearchSelectProps {
  label: string;
  value: string;
  options: string[];
  iconUrl?: (value: string) => string | null;
  subtitle?: (value: string) => ReactNode;
  placeholder?: string;
  allowEmpty?: boolean;
  onChange: (value: string) => void;
  /** Values that should float to the top, visually highlighted (e.g. a
   * Pokémon's real abilities/moveset among the full list). */
  isPreferred?: (value: string) => boolean;
  preferredLabel?: string;
  /** Group options into labelled sections, in this order (e.g. item
   * categories). Options not covered by groupOf fall in an "Other" bucket. */
  groupOf?: (value: string) => string;
  groupOrder?: string[];
}

export default function IconSearchSelect({
  label,
  value,
  options,
  iconUrl,
  subtitle,
  placeholder,
  allowEmpty = true,
  onChange,
  isPreferred,
  preferredLabel,
  groupOf,
  groupOrder,
}: IconSearchSelectProps) {
  const { t } = useLocale();
  const [query, setQuery] = useState(value);
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) setQuery(value);
  }, [value, open]);

  const rows: Row[] = useMemo(() => {
    const q = query.trim().toLowerCase();
    const matched = q ? options.filter((o) => o.toLowerCase().includes(q)) : options;

    if (isPreferred) {
      const preferred = matched.filter((v) => isPreferred(v)).slice(0, 40);
      const rest = matched.filter((v) => !isPreferred(v)).slice(0, 40);
      const out: Row[] = [];
      if (preferred.length) {
        out.push({ kind: "header", label: preferredLabel ?? t("select.preferred") });
        for (const v of preferred) out.push({ kind: "option", opt: { value: v, subtitle: subtitle?.(v), preferred: true } });
        out.push({ kind: "header", label: t("select.allOptions") });
      }
      for (const v of rest) out.push({ kind: "option", opt: { value: v, subtitle: subtitle?.(v) } });
      return out;
    }

    if (groupOf) {
      const buckets = new Map<string, string[]>();
      for (const v of matched) {
        const g = groupOf(v);
        if (!buckets.has(g)) buckets.set(g, []);
        buckets.get(g)!.push(v);
      }
      const order = groupOrder ?? [...buckets.keys()];
      const out: Row[] = [];
      let shown = 0;
      for (const g of order) {
        const vals = buckets.get(g);
        if (!vals?.length) continue;
        out.push({ kind: "header", label: g });
        for (const v of vals) {
          if (shown >= 90) break;
          out.push({ kind: "option", opt: { value: v, subtitle: subtitle?.(v) } });
          shown++;
        }
      }
      return out;
    }

    return matched.slice(0, 60).map((v) => ({ kind: "option" as const, opt: { value: v, subtitle: subtitle?.(v) } }));
  }, [query, options, subtitle, isPreferred, preferredLabel, groupOf, groupOrder, t]);

  const optionRows = rows.filter((r): r is { kind: "option"; opt: Option } => r.kind === "option");

  const commit = (v: string) => {
    onChange(v);
    setQuery(v);
    setOpen(false);
  };

  const icon = iconUrl?.(value) ?? null;

  return (
    <div className="relative flex flex-col gap-1 text-sm" ref={containerRef}>
      <span className="eyebrow">{label}</span>
      <div className="relative">
        {icon && (
          <img
            src={icon}
            alt=""
            className="pointer-events-none absolute left-1.5 top-1/2 h-6 w-6 -translate-y-1/2 object-contain"
            onError={(e) => ((e.target as HTMLImageElement).style.display = "none")}
          />
        )}
        <input
          className="field-input w-full py-2 pr-3"
          style={{ paddingLeft: icon ? "2.25rem" : "0.75rem" }}
          value={open ? query : value}
          placeholder={placeholder}
          onFocus={() => {
            setOpen(true);
            setQuery("");
            setHighlight(0);
          }}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            setHighlight(0);
          }}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setHighlight((h) => Math.min(h + 1, optionRows.length - 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setHighlight((h) => Math.max(h - 1, 0));
            } else if (e.key === "Enter") {
              e.preventDefault();
              const opt = optionRows[highlight];
              if (opt) commit(opt.opt.value);
              else if (allowEmpty && query.trim() === "") commit("");
            } else if (e.key === "Escape") {
              setOpen(false);
              setQuery(value);
            }
          }}
          onBlur={() => {
            window.setTimeout(() => {
              setOpen(false);
              setQuery(value);
            }, 100);
          }}
        />
      </div>
      {open && (
        <div
          className="absolute top-full z-20 mt-1 max-h-80 w-full overflow-auto rounded-[10px]"
          style={{ background: "var(--color-panel-strong)", border: "1px solid var(--color-line-strong)", boxShadow: "var(--shadow-lg)" }}
        >
          {allowEmpty && (
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => commit("")}
              className="flex w-full items-center px-3 py-1.5 text-left text-sm hover:bg-[var(--color-league-soft)]"
              style={{ color: "var(--color-ink-dim)" }}
            >
              {t("select.none")}
            </button>
          )}
          {rows.length === 0 && (
            <p className="px-3 py-2 text-sm" style={{ color: "var(--color-ink-dim)" }}>
              {t("select.noResults")}
            </p>
          )}
          {(() => {
            let optionIndex = -1;
            return rows.map((row, i) => {
              if (row.kind === "header") {
                return (
                  <p
                    key={`h-${i}`}
                    className="eyebrow px-3 pb-1 pt-2 text-[0.6rem]"
                    style={{ color: "var(--color-violet)" }}
                  >
                    {row.label}
                  </p>
                );
              }
              optionIndex++;
              const idx = optionIndex;
              const opt = row.opt;
              return (
                <button
                  type="button"
                  key={opt.value}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => commit(opt.value)}
                  className="flex w-full items-center gap-2 px-2 py-1.5 text-left text-sm"
                  style={{
                    background:
                      idx === highlight
                        ? "var(--color-league-soft)"
                        : opt.preferred
                          ? "var(--color-violet-soft)"
                          : "transparent",
                    color: "var(--color-ink)",
                    borderLeft: opt.preferred ? "2px solid var(--color-violet)" : "2px solid transparent",
                  }}
                >
                  {iconUrl?.(opt.value) && (
                    <img
                      src={iconUrl(opt.value)!}
                      alt=""
                      className="h-7 w-7 shrink-0 object-contain"
                      onError={(e) => ((e.target as HTMLImageElement).style.visibility = "hidden")}
                    />
                  )}
                  <span className="flex flex-col leading-tight">
                    <span>{opt.value}</span>
                    {opt.subtitle && (
                      <span className="text-xs" style={{ color: "var(--color-ink-dim)" }}>
                        {opt.subtitle}
                      </span>
                    )}
                  </span>
                </button>
              );
            });
          })()}
        </div>
      )}
    </div>
  );
}