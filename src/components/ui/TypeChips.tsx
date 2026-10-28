"use client";

import { REAL_TYPES } from "@/lib/champions/data";
import { typeColor } from "@/lib/app/typeColors";
import { typeIconUrl } from "@/lib/app/sprites";
import { toFrenchType } from "@/lib/champions/gameTranslations";
import { useLocale } from "@/lib/i18n/LocaleContext";

/** A row of the 18 types as toggle chips. `max` caps how many can be on
 * (picking one more drops the oldest, so the control never feels stuck). */
export default function TypeChips({
  value,
  onChange,
  max,
}: {
  value: string[];
  onChange: (next: string[]) => void;
  max?: number;
}) {
  const { locale } = useLocale();
  const toggle = (ty: string) => {
    if (value.includes(ty)) return onChange(value.filter((x) => x !== ty));
    const next = [...value, ty];
    onChange(max && next.length > max ? next.slice(next.length - max) : next);
  };
  return (
    <div className="flex flex-wrap gap-1.5">
      {REAL_TYPES.map((ty) => {
        const on = value.includes(ty);
        const color = typeColor(ty);
        const icon = typeIconUrl(ty);
        return (
          <button
            key={ty}
            type="button"
            aria-pressed={on}
            onClick={() => toggle(ty)}
            className="inline-flex items-center gap-1 rounded-[7px] px-2 py-1 text-[0.7rem] font-bold"
            style={{
              background: on ? color : `${color}1f`,
              border: `1px solid ${on ? color : `${color}55`}`,
              color: on ? "#070a1b" : color,
            }}
          >
            {icon && <img src={icon} alt="" className="h-4 w-4 object-contain" />}
            {locale === "fr" ? toFrenchType(ty) : ty}
          </button>
        );
      })}
    </div>
  );
}
