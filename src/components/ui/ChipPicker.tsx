"use client";

import IconSearchSelect from "./IconSearchSelect";
import { useDisplayName, type NameKind } from "./NameLink";

/** Pick several game names (abilities, moves…) one at a time; picked ones
 * stay visible as removable chips. */
export default function ChipPicker({
  label,
  kind,
  options,
  value,
  onChange,
  iconUrl,
}: {
  label: string;
  kind: NameKind;
  options: string[];
  value: string[];
  onChange: (next: string[]) => void;
  iconUrl?: (v: string) => string | null;
}) {
  const display = useDisplayName();
  return (
    <div className="flex flex-col gap-1.5">
      <IconSearchSelect
        label={label}
        value=""
        options={options.filter((o) => !value.includes(o))}
        placeholder="+"
        iconUrl={iconUrl}
        translateKind={kind}
        onChange={(v) => v && onChange([...value, v])}
      />
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {value.map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => onChange(value.filter((x) => x !== v))}
              className="rounded-[6px] px-2 py-0.5 text-xs font-bold"
              style={{ background: "var(--color-violet-soft)", color: "var(--color-violet)" }}
              title="✕"
            >
              {display(kind, v)} ✕
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
