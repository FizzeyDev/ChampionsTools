"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ALL_MOVE_NAMES,
  getAbilityIndex,
  getItemIndex,
  getMoveInfo,
  loadLearnsetIndex,
  REAL_TYPES,
  type LearnsetIndex,
} from "@/lib/champions/data";
import { matchesBilingual } from "@/lib/champions/gameTranslations";
import { itemSpriteUrl } from "@/lib/app/sprites";
import { useLocale } from "@/lib/i18n/LocaleContext";
import { useNav, type DbTab } from "@/lib/app/nav";
import NameLink, { useDisplayName } from "../ui/NameLink";
import SpeciesGrid from "./SpeciesGrid";
import TypeBadge from "../ui/TypeBadge";
import Seg from "../ui/Seg";

interface Row {
  name: string;
  type?: string;
}

function SpeciesList({ names, empty }: { names: string[]; empty: string }) {
  return <SpeciesGrid names={names} empty={empty} scroll />;
}

export default function DatabaseView() {
  const { t } = useLocale();
  const { dbTarget } = useNav();
  const display = useDisplayName();
  const [tab, setTab] = useState<DbTab>("moves");
  const [selected, setSelected] = useState<string>("");
  const [text, setText] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [learnsets, setLearnsets] = useState<LearnsetIndex | null>(null);

  useEffect(() => {
    let alive = true;
    loadLearnsetIndex().then((i) => alive && setLearnsets(i));
    return () => {
      alive = false;
    };
  }, []);

  // A cross-link elsewhere on the site ("Fake Out" clicked) lands here.
  useEffect(() => {
    if (!dbTarget) return;
    setTab(dbTarget.tab);
    setSelected(dbTarget.name);
    setText("");
    setTypeFilter("");
  }, [dbTarget]);

  const abilities = useMemo(() => getAbilityIndex(), []);
  const items = useMemo(() => getItemIndex(), []);

  const rows: Row[] = useMemo(() => {
    const kind = tab === "moves" ? "move" : tab === "abilities" ? "ability" : "item";
    let base: Row[] =
      tab === "moves"
        ? ALL_MOVE_NAMES.map((name) => ({ name, type: getMoveInfo(name)?.type }))
        : tab === "abilities"
          ? abilities.map((a) => ({ name: a.name }))
          : items.map((i) => ({ name: i.name }));
    if (tab === "moves" && typeFilter) base = base.filter((r) => r.type === typeFilter);
    return base.filter((r) => matchesBilingual(kind, r.name, text));
  }, [tab, text, typeFilter, abilities, items]);

  const detail = () => {
    if (!selected) {
      return (
        <p className="text-sm" style={{ color: "var(--color-ink-dim)" }}>
          {t("db.pick")}
        </p>
      );
    }
    if (tab === "moves") {
      const m = getMoveInfo(selected);
      if (!m) return null;
      const learners = learnsets?.byMove.get(m.name) ?? [];
      return (
        <>
          <h3 className="heading text-xl" style={{ color: "var(--color-ink-bright)" }}>
            {display("move", m.name)}
          </h3>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <TypeBadge type={m.type} />
            <span className="rounded-[6px] px-2 py-0.5 text-xs font-bold" style={{ background: "var(--color-panel-strong)" }}>
              {t(`db.cat.${m.category}`)}
            </span>
          </div>
          <dl className="tabular mt-3 grid grid-cols-2 gap-x-6 gap-y-1 text-sm sm:grid-cols-4">
            <div>
              <dt className="eyebrow">{t("db.power")}</dt>
              <dd>{m.basePower || "-"}</dd>
            </div>
            <div>
              <dt className="eyebrow">{t("db.accuracy")}</dt>
              <dd>{m.accuracy === true ? "-" : `${m.accuracy}%`}</dd>
            </div>
            <div>
              <dt className="eyebrow">PP</dt>
              <dd>{m.pp}</dd>
            </div>
            <div>
              <dt className="eyebrow">{t("db.priority")}</dt>
              <dd>{m.priority > 0 ? `+${m.priority}` : m.priority}</dd>
            </div>
          </dl>
          {m.description && (
            <p className="mt-3 text-sm" style={{ color: "var(--color-ink-soft)" }}>
              {m.description}
            </p>
          )}
          <h4 className="eyebrow mb-1.5 mt-4">
            {t("db.learnedBy")} {learnsets ? `(${learners.length})` : ""}
          </h4>
          {learnsets ? <SpeciesList names={learners} empty={t("db.nobody")} /> : <p className="text-xs">{t("common.loading")}</p>}
        </>
      );
    }
    if (tab === "abilities") {
      const a = abilities.find((x) => x.name === selected);
      if (!a) return null;
      return (
        <>
          <h3 className="heading text-xl" style={{ color: "var(--color-ink-bright)" }}>
            {display("ability", a.name)}
          </h3>
          {a.description && (
            <p className="mt-2 text-sm" style={{ color: "var(--color-ink-soft)" }}>
              {a.description}
            </p>
          )}
          <h4 className="eyebrow mb-1.5 mt-4">
            {t("db.heldBy")} ({a.species.length})
          </h4>
          <SpeciesList names={a.species} empty={t("db.nobody")} />
        </>
      );
    }
    const it = items.find((x) => x.name === selected);
    if (!it) return null;
    const sprite = itemSpriteUrl(it.name);
    return (
      <>
        <div className="flex items-center gap-3">
          {sprite && <img src={sprite} alt="" className="h-10 w-10 object-contain" />}
          <div>
            <h3 className="heading text-xl" style={{ color: "var(--color-ink-bright)" }}>
              {display("item", it.name)}
            </h3>
            <p className="eyebrow">{it.category}</p>
          </div>
        </div>
        {it.description && (
          <p className="mt-3 text-sm" style={{ color: "var(--color-ink-soft)" }}>
            {it.description}
          </p>
        )}
        {it.megaSpecies && (
          <p className="mt-3 text-sm">
            <span className="eyebrow mr-2">{t("db.megaEvolves")}</span>
            <NameLink kind="species" name={it.megaSpecies} />
          </p>
        )}
      </>
    );
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="card-shell p-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="heading text-xl" style={{ color: "var(--color-ink-bright)" }}>
              {t("db.title")}
            </h2>
            <p className="text-xs" style={{ color: "var(--color-ink-dim)" }}>
              {t("db.subtitle")}
            </p>
          </div>
          <Seg
            value={tab}
            onChange={(v) => {
              setTab(v);
              setSelected("");
              setText("");
              setTypeFilter("");
            }}
            options={[
              { value: "moves" as DbTab, label: t("db.tab.moves") },
              { value: "abilities" as DbTab, label: t("db.tab.abilities") },
              { value: "items" as DbTab, label: t("db.tab.items") },
            ]}
          />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[360px_1fr]">
        <div className="card-shell flex flex-col gap-2 p-3">
          <input value={text} onChange={(e) => setText(e.target.value)} placeholder={t("pokedex.namePlaceholder")} className="field-input px-2 py-1.5 text-sm" />
          {tab === "moves" && (
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="field-input px-2 py-1.5 text-sm">
              <option value="">{t("db.allTypes")}</option>
              {REAL_TYPES.map((ty) => (
                <option key={ty} value={ty}>
                  {ty}
                </option>
              ))}
            </select>
          )}
          <p className="text-[11px]" style={{ color: "var(--color-ink-dim)" }}>
            {rows.length}
          </p>
          <ul className="max-h-[60vh] overflow-y-auto">
            {rows.map((r) => (
              <li key={r.name}>
                <button
                  type="button"
                  onClick={() => setSelected(r.name)}
                  className="flex w-full items-center gap-2 rounded-[6px] px-2 py-1 text-left text-sm"
                  style={{
                    background: selected === r.name ? "var(--color-panel-strong)" : "transparent",
                    color: selected === r.name ? "var(--color-brick)" : "var(--color-ink-bright)",
                  }}
                >
                  {r.type && <TypeBadge type={r.type} size="sm" />}
                  <span className="truncate">{display(tab === "moves" ? "move" : tab === "abilities" ? "ability" : "item", r.name)}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="card-shell p-4">{detail()}</div>
      </div>
    </div>
  );
}
