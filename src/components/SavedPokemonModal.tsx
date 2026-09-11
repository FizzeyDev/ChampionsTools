"use client";

import { useEffect, useState } from "react";
import { deleteSavedPokemon, getSavedPokemons, type SavedPokemon } from "@/lib/features/savedPokemon";
import { pokemonSpriteUrl } from "@/lib/sprites";
import { useLocale } from "@/lib/i18n/LocaleContext";
import type { PokemonState } from "@/lib/types";

interface SavedPokemonModalProps {
  open: boolean;
  onClose: () => void;
  onAssign: (state: PokemonState, role: "attacker" | "defender") => void;
}

export default function SavedPokemonModal({ open, onClose, onAssign }: SavedPokemonModalProps) {
  const { t } = useLocale();
  const [entries, setEntries] = useState<SavedPokemon[]>([]);

  useEffect(() => {
    if (open) setEntries(getSavedPokemons());
  }, [open]);

  if (!open) return null;

  const remove = (id: string) => {
    deleteSavedPokemon(id);
    setEntries(getSavedPokemons());
  };

  const assign = (entry: SavedPokemon, role: "attacker" | "defender") => {
    onAssign(JSON.parse(JSON.stringify(entry.state)), role);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.6)" }}
      onClick={onClose}
    >
      <div
        className="card-shell flex max-h-[80vh] w-full max-w-2xl flex-col overflow-hidden p-4"
        style={{ borderColor: "rgba(159,83,236,0.35)", boxShadow: "var(--shadow-lg), 0 0 40px var(--color-violet-glow)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between border-b pb-3" style={{ borderColor: "var(--color-line)" }}>
          <h2 className="heading text-lg" style={{ color: "var(--color-violet)" }}>
            {t("saved.title")}
          </h2>
          <button type="button" onClick={onClose} className="pill-btn text-[0.68rem]">
            ✕ {t("saved.close")}
          </button>
        </div>

        {entries.length === 0 ? (
          <p className="py-6 text-center text-sm text-ink-dim">{t("saved.empty")}</p>
        ) : (
          <div className="flex flex-col gap-2 overflow-y-auto">
            {entries.map((entry) => {
              const art = pokemonSpriteUrl(entry.state.species, true);
              const moves = entry.state.moves.filter(Boolean).join(" · ");
              return (
                <div
                  key={entry.id}
                  className="flex items-center gap-3 rounded-[10px] p-2.5"
                  style={{ background: "var(--color-panel-soft)", border: "1px solid var(--color-line)" }}
                >
                  {art && <img src={art} alt="" className="h-10 w-10 shrink-0 object-contain" />}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold" style={{ color: "var(--color-ink-bright)" }}>
                      {entry.name}
                    </p>
                    <p className="truncate text-xs" style={{ color: "var(--color-ink-dim)" }}>
                      {entry.state.species} {moves && `— ${moves}`}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => assign(entry, "attacker")}
                      className="pill-btn text-[0.65rem]"
                      style={{ color: "var(--color-league)", borderColor: "rgba(79,195,247,0.4)", background: "var(--color-league-soft)" }}
                    >
                      → {t("card.attacker")}
                    </button>
                    <button
                      type="button"
                      onClick={() => assign(entry, "defender")}
                      className="pill-btn text-[0.65rem]"
                      style={{ color: "var(--color-brick)", borderColor: "rgba(255,157,0,0.4)", background: "var(--color-brick-soft)" }}
                    >
                      → {t("card.defender")}
                    </button>
                    <button
                      type="button"
                      onClick={() => remove(entry.id)}
                      title={t("saved.delete")}
                      className="rounded-[6px] px-2 py-1.5 text-xs"
                      style={{ color: "var(--color-danger)", background: "var(--color-danger-soft)" }}
                    >
                      🗑
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}