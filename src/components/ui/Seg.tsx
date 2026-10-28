"use client";

/** A small segmented control (pill-shaped group of mutually exclusive
 * buttons), used wherever a handful of choices should stay visible. */
export default function Seg<T extends string | number | boolean | null>({
  options,
  value,
  onChange,
  accent = "var(--color-violet)",
  small = false,
}: {
  options: { value: T; label: string; title?: string }[];
  value: T;
  onChange: (v: T) => void;
  accent?: string;
  small?: boolean;
}) {
  return (
    <div
      className="inline-flex overflow-hidden rounded-[4px_12px_4px_12px]"
      style={{ border: "1px solid var(--color-line-strong)" }}
      role="group"
    >
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={String(o.value)}
            type="button"
            title={o.title}
            aria-pressed={active}
            onClick={() => onChange(o.value)}
            className={`font-bold uppercase tracking-wide ${small ? "px-2 py-1 text-[0.62rem]" : "px-2.5 py-1.5 text-[0.68rem]"}`}
            style={{
              background: active ? accent : "var(--color-panel-soft)",
              color: active ? "var(--color-paper)" : "var(--color-ink-soft)",
            }}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
