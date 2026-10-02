"use client";

import { typeIconUrl } from "@/lib/sprites";
import { typeColor } from "@/lib/typeColors";
import { toFrenchType } from "@/lib/champions/gameTranslations";
import { useLocale } from "@/lib/i18n/LocaleContext";

interface TypeBadgeProps {
  type: string;
  size?: "sm" | "md" | "lg";
}

const SIZES = {
  sm: { icon: 18, text: "text-[0.68rem]", pad: "px-1.5 py-0.5", gap: "gap-1" },
  md: { icon: 22, text: "text-xs", pad: "px-2 py-1", gap: "gap-1.5" },
  lg: { icon: 26, text: "text-sm", pad: "px-2.5 py-1.5", gap: "gap-2" },
};

/** A clear, legible type badge: icon + the type's name, tinted with the
 * type's own color. Used everywhere a Pokémon or move type needs to be
 * shown as more than a decorative icon — the plain tiny PokeAPI icon alone
 * (used elsewhere for move-row decoration) is too small to read on its
 * own. */
export default function TypeBadge({ type, size = "md" }: TypeBadgeProps) {
  const { locale } = useLocale();
  const s = SIZES[size];
  const color = typeColor(type);
  const icon = typeIconUrl(type);
  const label = locale === "fr" ? toFrenchType(type) : type;

  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-[7px] font-bold ${s.pad} ${s.gap} ${s.text}`}
      style={{
        background: `${color}26`,
        border: `1px solid ${color}66`,
        color,
      }}
      title={label}
    >
      {icon && <img src={icon} alt="" style={{ width: s.icon, height: s.icon }} className="shrink-0 object-contain" />}
      {label}
    </span>
  );
}