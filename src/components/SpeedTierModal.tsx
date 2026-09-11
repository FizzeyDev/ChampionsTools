"use client";

import { useState } from "react";
import { computeFinalSpeed } from "@/lib/features/speedTiers";
import { pokemonSpriteUrl } from "@/lib/sprites";
import { useLocale } from "@/lib/i18n/LocaleContext";
import type { FieldState, PokemonState } from "@/lib/types";

interface SpeedEntry {
  label: string;
  accent: "league" | "brick";
  state: PokemonState;
}

interface SpeedTierModalProps {
  open: boolean;
  onClose: () => void;
  entries: SpeedEntry[];
  field: FieldState;
}

export default function SpeedTierModal({ open, onClose, entries, field }: SpeedTierModalProps) {
  const { t } = useLocale();
  const [tailwind, setTailwind] = useState(false);
  const [trickRoom, setTrickRoom] = useState(false);

  if (!open) return null;

  const ranked = entries
    .filter((e) => e.state.species)
    .map((e) => ({ ...e, speed: computeFinalSpeed(e.state, field, tailwind) }))
    .sort((a, b) => (trickRoom ? a.speed - b.speed : b.speed - a.speed));

  const maxSpeed = Math.max(1, ...ranked.map((r) => r.speed));

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.6)" }}
      onClick={onClose}
    >
      <div
        className="card-shell flex max-h-[80vh] w-full max-w-xl flex-col overflow-hidden p-4"
        style={{ borderColor: "rgba(159,83,236,0.35)", boxShadow: "var(--shadow-lg), 0 0 40px var(--color-violet-glow)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between border-b pb-3" style={{ borderColor: "var(--color-line)" }}>
          <h2 className="heading text-lg" style={{ color: "var(--color-violet)" }}>
            {t("speed.title")}
          </h2>
          <button type="button" onClick={onClose} className="pill-btn text-[0.68rem]">
            ✕ {t("saved.close")}
          </button>
        </div>

        <div className="mb-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setTailwind((s) => !s)}
            className="pill-btn text-[0.68rem]"
            style={
              tailwind
                ? { color: "var(--color-paper)", background: "var(--color-violet)", borderColor: "var(--color-violet)" }
                : undefined
            }
          >
            {t("field.tailwind")}
          </button>
          <button
            type="button"
            onClick={() => setTrickRoom((s) => !s)}
            className="pill-btn text-[0.68rem]"
            style={
              trickRoom
                ? { color: "var(--color-paper)", background: "var(--color-violet)", borderColor: "var(--color-violet)" }
                : undefined
            }
          >
            {t("speed.trickRoom")}
          </button>
        </div>

        {trickRoom && (
          <p className="mb-2 text-[11px]" style={{ color: "var(--color-ink-dim)" }}>
            {t("speed.trickRoomNote")}
          </p>
        )}

        {ranked.length === 0 ? (
          <p className="py-6 text-center text-sm text-ink-dim">{t("speed.empty")}</p>
        ) : (
          <div className="flex flex-col gap-1.5 overflow-y-auto">
            {ranked.map((r, i) => {
              const isTie = i > 0 && ranked[i - 1].speed === r.speed;
              const art = pokemonSpriteUrl(r.state.species, true);
              const accentVar = r.accent === "league" ? "var(--color-league)" : "var(--color-brick)";
              return (
                <div key={i} className="flex items-center gap-2">
                  <span className="tabular w-5 shrink-0 text-right text-xs" style={{ color: "var(--color-ink-dim)" }}>
                    {isTie ? "=" : i + 1}
                  </span>
                  {art && <img src={art} alt="" className="h-7 w-7 shrink-0 object-contain" />}
                  <div className="min-w-[6rem] shrink-0">
                    <p className="truncate text-xs font-semibold" style={{ color: "var(--color-ink-bright)" }}>
                      {r.state.species}
                    </p>
                    <p className="truncate text-[10px]" style={{ color: "var(--color-ink-dim)" }}>
                      {r.label}
                    </p>
                  </div>
                  <div className="relative h-4 flex-1 overflow-hidden rounded-full" style={{ background: "var(--color-panel-strong)" }}>
                    <div
                      className="absolute inset-y-0 left-0 rounded-full"
                      style={{
                        width: `${(r.speed / maxSpeed) * 100}%`,
                        background: accentVar,
                        boxShadow: `0 0 8px ${r.accent === "league" ? "var(--color-league-glow)" : "var(--color-brick-glow)"}`,
                      }}
                    />
                  </div>
                  <span className="tabular w-10 shrink-0 text-right text-xs font-bold" style={{ color: "var(--color-ink-bright)" }}>
                    {r.speed}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}