"use client";

import { STAT_POINT_CAP, evToSp, spToEv } from "@/lib/champions/statPoints";

interface StatRowProps {
  label: string;
  base: number;
  ev: number;
  boost: number;
  advanced: boolean;
  total: number;
  onEvChange: (v: number) => void;
  onBoostChange: (v: number) => void;
  showBoost?: boolean;
}

export default function StatRow({
  label,
  base,
  ev,
  boost,
  advanced,
  total,
  onEvChange,
  onBoostChange,
  showBoost = true,
}: StatRowProps) {
  const cols = advanced
    ? "3.2rem 2.4rem 1fr 3.2rem 3.4rem 3rem"
    : "3.2rem 2.4rem 1fr 3.2rem 3rem";
  const sp = evToSp(ev);

  const setSp = (nextSp: number) => {
    const clamped = Math.max(0, Math.min(STAT_POINT_CAP, nextSp));
    onEvChange(spToEv(clamped));
  };

  return (
    <div className="grid items-center gap-2 py-1" style={{ gridTemplateColumns: cols }}>
      <span className="text-xs font-semibold" style={{ color: "var(--color-ink-soft)" }}>
        {label}
      </span>
      <span
        className="tabular text-center text-xs"
        style={{ color: "var(--color-ink-dim)" }}
        title="Base stat"
      >
        {base}
      </span>
      <input
        type="range"
        min={0}
        max={STAT_POINT_CAP}
        step={1}
        value={sp}
        onChange={(e) => setSp(Number(e.target.value))}
      />
      <div className="flex flex-col items-end leading-tight" title={`${ev} EV`}>
        <input
          type="number"
          min={0}
          max={STAT_POINT_CAP}
          step={1}
          value={sp}
          onChange={(e) => setSp(Number(e.target.value) || 0)}
          className="field-input tabular w-full px-1.5 py-1 text-right text-xs"
        />
        <span className="tabular text-[9px]" style={{ color: "var(--color-ink-dim)" }}>
          {ev} EV
        </span>
      </div>
      {advanced &&
        (showBoost ? (
          <select
            value={boost}
            onChange={(e) => onBoostChange(Number(e.target.value))}
            className="field-input w-full px-1 py-1 text-xs"
          >
            {Array.from({ length: 13 }, (_, i) => i - 6).map((v) => (
              <option key={v} value={v}>
                {v > 0 ? `+${v}` : v}
              </option>
            ))}
          </select>
        ) : (
          <span />
        ))}
      <span
        className="tabular text-right text-sm font-bold"
        style={{ color: "var(--color-ink-bright)" }}
        title="Stat totale (sans les stages)"
      >
        {total}
      </span>
    </div>
  );
}