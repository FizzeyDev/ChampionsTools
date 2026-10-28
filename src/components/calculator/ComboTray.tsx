"use client";

import { useMemo } from "react";
import { buildPokemon, computeMoveResults } from "@/lib/calc/calcEngine";
import { rollsFromRange, summarizeCombo } from "@/lib/features/combo";
import { useLocale } from "@/lib/i18n/LocaleContext";
import { toFrench } from "@/lib/champions/gameTranslations";
import type { FieldState, PokemonState } from "@/lib/calc/types";

export type Slot = "attacker" | "defender" | "defender2";

export interface ComboEntry {
  id: number;
  /** Snapshot of the attacker when the hit was added (so swapping the Pokémon afterwards keeps the tray intact). */
  source: PokemonState;
  /** Which Pokémon on screen takes this hit - read live, so editing its Stat Points updates the tray. */
  to: Slot;
  move: string;
  crit: boolean;
}

interface Props {
  entries: ComboEntry[];
  targets: Record<Slot, PokemonState | null>;
  /** Field as seen by the attacker of a hit aimed at `to`: the caller flips the sides for hits aimed at the attacker. */
  fieldFor: (to: Slot) => FieldState;
  onRemove: (id: number) => void;
  onClear: () => void;
}

export default function ComboTray({ entries, targets, fieldFor, onRemove, onClear }: Props) {
  const { t, locale } = useLocale();
  const name = (kind: "species" | "move", n: string) => (locale === "fr" ? toFrench(kind, n) : n);

  const groups = useMemo(() => {
    const order: Slot[] = ["defender", "attacker", "defender2"];
    return order
      .map((slot) => {
        const target = targets[slot];
        const mine = entries.filter((e) => e.to === slot);
        if (!target || mine.length === 0) return null;
        const hp = buildPokemon(target).maxHP();
        const f = fieldFor(slot);
        const rows = mine.map((e) => {
          const src = { ...e.source, moves: [e.move, "", "", ""], critMoves: [e.crit, false, false, false] };
          const res = computeMoveResults(src, target, f, [e.move])[0];
          const rolls = res?.rolls ?? (res?.range ? rollsFromRange(res.range[0], res.range[1]) : null);
          return { entry: e, res, rolls };
        });
        const valid = rows.filter((r) => r.rolls);
        const summary = summarizeCombo(valid.map((r) => ({ rolls: r.rolls! })), hp);
        return { slot, target, hp, rows, summary };
      })
      .filter((g): g is NonNullable<typeof g> => !!g);
  }, [entries, targets, fieldFor]);

  if (entries.length === 0) {
    return (
      <section className="card-shell p-4">
        <h2 className="heading mb-1 text-base" style={{ color: "var(--color-violet)" }}>
          {t("combo.title")}
        </h2>
        <p className="text-xs" style={{ color: "var(--color-ink-dim)" }}>
          {t("combo.empty")}
        </p>
      </section>
    );
  }

  return (
    <section className="card-shell p-4">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="heading text-base" style={{ color: "var(--color-violet)" }}>
          {t("combo.title")}
        </h2>
        <button type="button" className="pill-btn" onClick={onClear}>
          ↺ {t("combo.clear")}
        </button>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        {groups.map((g) => {
          const pct = (n: number) => Math.round((n / g.hp) * 1000) / 10;
          const verdict = g.summary.guaranteedKo
            ? { text: t("combo.guaranteedKo"), color: "var(--color-danger)" }
            : g.summary.survivesAlways
              ? { text: t("combo.survives"), color: "var(--color-success)" }
              : { text: t("combo.koChance").replace("{p}", String(Math.round(g.summary.koChance * 1000) / 10)), color: "var(--color-amber)" };
          return (
            <div key={g.slot} className="rounded-[10px] p-3" style={{ background: "var(--color-panel-soft)", border: "1px solid var(--color-line)" }}>
              <p className="eyebrow mb-2">
                {t("combo.on")} {name("species", g.target.species)} <span className="tabular">({g.hp} HP)</span>
              </p>
              <ul className="flex flex-col gap-1">
                {g.rows.map((r) => (
                  <li key={r.entry.id} className="flex items-center gap-2 text-sm">
                    <span className="min-w-0 flex-1 truncate">
                      <span style={{ color: "var(--color-ink-dim)" }}>{name("species", r.entry.source.species)} · </span>
                      {name("move", r.entry.move)}
                      {r.entry.crit && <span style={{ color: "var(--color-amber)" }}> ★</span>}
                    </span>
                    <span className="tabular shrink-0 text-xs">
                      {r.res?.range ? `${pct(r.res.range[0])} – ${pct(r.res.range[1])}%` : "-"}
                    </span>
                    <button type="button" onClick={() => onRemove(r.entry.id)} className="shrink-0 px-1 text-xs" style={{ color: "var(--color-ink-dim)" }} title={t("speed.remove")}>
                      ✕
                    </button>
                  </li>
                ))}
              </ul>
              <div className="mt-2 border-t pt-2" style={{ borderColor: "var(--color-line)" }}>
                <p className="tabular text-sm font-bold">
                  {t("combo.total")}: {pct(g.summary.minDamage)} – {pct(g.summary.maxDamage)}%
                </p>
                <p className="text-sm font-extrabold" style={{ color: verdict.color }}>
                  {verdict.text}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
