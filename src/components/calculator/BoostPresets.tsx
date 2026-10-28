"use client";

import { useLocale } from "@/lib/i18n/LocaleContext";
import { toFrench } from "@/lib/champions/gameTranslations";
import type { StatsTable } from "@/lib/calc/types";

type Patch = Partial<StatsTable>;

interface Preset {
  /** English move/ability name (translated for display). */
  name: string;
  kind: "move" | "ability";
  patch: Patch;
}

const PRESETS: Preset[] = [
  { name: "Swords Dance", kind: "move", patch: { atk: 2 } },
  { name: "Nasty Plot", kind: "move", patch: { spa: 2 } },
  { name: "Dragon Dance", kind: "move", patch: { atk: 1, spe: 1 } },
  { name: "Calm Mind", kind: "move", patch: { spa: 1, spd: 1 } },
  { name: "Bulk Up", kind: "move", patch: { atk: 1, def: 1 } },
  { name: "Quiver Dance", kind: "move", patch: { spa: 1, spd: 1, spe: 1 } },
  { name: "Shell Smash", kind: "move", patch: { atk: 2, spa: 2, spe: 2, def: -1, spd: -1 } },
  { name: "Intimidate", kind: "ability", patch: { atk: -1 } },
];

const KEYS = ["atk", "def", "spa", "spd", "spe"] as const;

/** One-click stat-stage presets for the common setup moves, so nobody has to
 * set five dropdowns by hand to model "after a Swords Dance". Each preset
 * *replaces* the stages it names and leaves the other stats alone. */
export default function BoostPresets({
  boosts,
  onChange,
}: {
  boosts: StatsTable;
  onChange: (next: StatsTable) => void;
}) {
  const { t, locale } = useLocale();
  const isActive = (p: Patch) => Object.entries(p).every(([k, v]) => boosts[k as keyof StatsTable] === v);
  const anyBoost = KEYS.some((k) => boosts[k] !== 0);

  return (
    <div className="mb-2 flex flex-wrap items-center gap-1">
      <span className="eyebrow mr-1">{t("boost.quick")}</span>
      {PRESETS.map((p) => {
        const active = isActive(p.patch);
        return (
          <button
            key={p.name}
            type="button"
            onClick={() => onChange({ ...boosts, ...(active ? zeroed(p.patch) : p.patch) })}
            aria-pressed={active}
            title={Object.entries(p.patch)
              .map(([k, v]) => `${t(`stat.${k}`)} ${v! > 0 ? "+" : ""}${v}`)
              .join(", ")}
            className="rounded-[6px] px-1.5 py-0.5 text-[0.62rem] font-bold"
            style={{
              background: active ? "var(--color-violet)" : "var(--color-panel-strong)",
              color: active ? "var(--color-paper)" : "var(--color-ink-soft)",
            }}
          >
            {locale === "fr" ? toFrench(p.kind, p.name) : p.name}
          </button>
        );
      })}
      {anyBoost && (
        <button
          type="button"
          onClick={() => onChange({ ...boosts, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 })}
          className="rounded-[6px] px-1.5 py-0.5 text-[0.62rem] font-bold"
          style={{ background: "var(--color-panel)", color: "var(--color-danger)" }}
        >
          ↺ {t("boost.reset")}
        </button>
      )}
    </div>
  );
}

function zeroed(p: Patch): Patch {
  return Object.fromEntries(Object.keys(p).map((k) => [k, 0]));
}
