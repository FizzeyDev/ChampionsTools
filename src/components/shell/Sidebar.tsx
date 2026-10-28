"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import {
  Swords,
  Users,
  Shield,
  Grid3x3,
  Target,
  Gauge,
  GitCompare,
  LayoutGrid,
  History,
  BookOpen,
  Search,
  Database,
  Palette,
  ChevronDown,
  Settings,
  SlidersHorizontal,
  ChevronsLeft,
  ChevronsRight,
  Menu,
  X,
} from "lucide-react";
import { useLocale } from "@/lib/i18n/LocaleContext";
import { LOCALES } from "@/lib/i18n/translations";
import { hasUnseenChangelog } from "@/lib/features/changelog";
import { BASE_PATH } from "@/lib/app/sprites";

export type Mode = "1v1" | "1vAll" | "Allv1" | "AllvAll" | "bestMoves" | "speedTiers" | "moveComparator";
import type { View } from "@/lib/app/nav";
export type { View };

const MODE_ICON: Record<Mode, React.ComponentType<{ size?: number }>> = {
  "1v1": Swords,
  "1vAll": Users,
  Allv1: Shield,
  AllvAll: Grid3x3,
  bestMoves: Target,
  speedTiers: Gauge,
  moveComparator: GitCompare,
};

const MODES: Mode[] = ["1v1", "1vAll", "Allv1", "AllvAll", "bestMoves", "moveComparator"];
const TOOL_MODES: Mode[] = ["speedTiers"];

const DEX_VIEWS: { id: View; icon: React.ComponentType<{ size?: number }>; label: string }[] = [
  { id: "pokedex", icon: BookOpen, label: "sidebar.pokedex" },
  { id: "search", icon: Search, label: "sidebar.search" },
  { id: "database", icon: Database, label: "sidebar.database" },
  { id: "types", icon: Palette, label: "sidebar.types" },
];

interface SidebarProps {
  view: View;
  mode: Mode;
  onSelectMode: (m: Mode) => void;
  onSelectView: (v: View) => void;
  collapsed: boolean;
  onToggleCollapsed: () => void;
  mobileOpen: boolean;
  onOpenMobile: () => void;
  onCloseMobile: () => void;
}

export default function Sidebar({
  view,
  mode,
  onSelectMode,
  onSelectView,
  collapsed,
  onToggleCollapsed,
  mobileOpen,
  onOpenMobile,
  onCloseMobile,
}: SidebarProps) {
  const { locale, setLocale, t } = useLocale();
  const [unseen, setUnseen] = useState(false);
  const [closed, setClosed] = useState<Record<string, boolean>>({});

  useEffect(() => {
    try {
      const raw = localStorage.getItem("champcalc.navClosed");
      if (raw) setClosed(JSON.parse(raw));
    } catch {
      /* storage unavailable: sections just start open */
    }
  }, []);

  const toggleSection = (id: string) =>
    setClosed((c) => {
      const next = { ...c, [id]: !c[id] };
      try {
        localStorage.setItem("champcalc.navClosed", JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });

  useEffect(() => {
    setUnseen(hasUnseenChangelog());
  }, [view]);

  const expanded = !collapsed || mobileOpen;

  const navLink = (
    key: string,
    icon: React.ReactNode,
    label: string,
    active: boolean,
    onClick: () => void,
    dot?: boolean
  ) => (
    <li key={key} className="mb-[3px]">
      <button
        type="button"
        onClick={onClick}
        className="group relative flex w-full items-center overflow-hidden rounded-[10px] text-left transition-all"
        style={{
          minHeight: 40,
          background: active
            ? "linear-gradient(90deg, rgba(255,157,0,0.1), rgba(255,120,48,0.05))"
            : "var(--tint-faint)",
          border: `1px solid ${active ? "rgba(255,157,0,0.2)" : "var(--tint-line)"}`,
          color: active ? "var(--color-brick)" : "var(--color-ink-soft)",
        }}
        title={expanded ? undefined : label}
      >
        <span
          aria-hidden
          className="absolute left-0 rounded-r-[2px] transition-opacity"
          style={{
            top: "20%",
            bottom: "20%",
            width: 2,
            background: active
              ? "linear-gradient(180deg, #ffd27a, var(--color-brick))"
              : "linear-gradient(180deg, #7ef0ff, var(--color-league))",
            opacity: active ? 1 : 0,
          }}
        />
        <span
          className="flex h-10 w-[42px] shrink-0 items-center justify-center transition-transform group-hover:scale-110"
          style={{
            background: active ? "rgba(255,157,0,0.1)" : "rgba(0,0,0,0.12)",
            borderRight: `1px solid ${active ? "rgba(255,157,0,0.15)" : "var(--tint-line)"}`,
          }}
        >
          {icon}
        </span>
        {expanded && (
          <span className="flex-1 truncate px-2.5 text-[0.88rem] font-semibold tracking-wide">{label}</span>
        )}
        {expanded && dot && (
          <span
            className="mr-2.5 h-[9px] w-[9px] shrink-0 rounded-full"
            style={{ background: "var(--color-league)", boxShadow: "0 0 8px rgba(79,195,247,0.8)" }}
          />
        )}
        {!expanded && dot && (
          <span
            className="absolute right-[3px] top-[3px] h-2 w-2 rounded-full"
            style={{ background: "var(--color-league)", boxShadow: "0 0 8px rgba(79,195,247,0.8)" }}
          />
        )}
      </button>
    </li>
  );

  const go = (v: View) => () => {
    onSelectView(v);
    onCloseMobile();
  };
  const goMode = (m: Mode) => () => {
    onSelectMode(m);
    onSelectView("calculator");
    onCloseMobile();
  };
  const modeItem = (m: Mode) => {
    const Icon = MODE_ICON[m];
    return { key: m, icon: <Icon size={15} />, label: t(`team.mode.${m}`), active: view === "calculator" && mode === m, onClick: goMode(m) };
  };
  const sections: {
    id: string;
    title: string;
    items: { key: string; icon: React.ReactNode; label: string; active: boolean; onClick: () => void; dot?: boolean }[];
  }[] = [
    { id: "calc", title: "sidebar.navTitle", items: MODES.map(modeItem) },
    {
      id: "tools",
      title: "sidebar.toolsTitle",
      items: [
        { key: "teamCoverage", icon: <LayoutGrid size={15} />, label: t("sidebar.teamCoverage"), active: view === "teamCoverage", onClick: go("teamCoverage") },
        { key: "optimizer", icon: <SlidersHorizontal size={15} />, label: t("sidebar.optimizer"), active: view === "optimizer", onClick: go("optimizer") },
        ...TOOL_MODES.map(modeItem),
      ],
    },
    {
      id: "dex",
      title: "sidebar.dexTitle",
      items: DEX_VIEWS.map(({ id, icon: Icon, label }) => ({ key: id, icon: <Icon size={15} />, label: t(label), active: view === id, onClick: go(id) })),
    },
    {
      id: "info",
      title: "sidebar.infoTitle",
      items: [
        {
          key: "changelog",
          icon: <History size={15} />,
          label: t("sidebar.changelog"),
          active: view === "changelog",
          onClick: () => {
            onSelectView("changelog");
            setUnseen(false);
            onCloseMobile();
          },
          dot: unseen,
        },
        { key: "settings", icon: <Settings size={15} />, label: t("sidebar.settings"), active: view === "settings", onClick: go("settings") },
      ],
    },
  ];

  return (
    <>
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/60 sm:hidden" onClick={onCloseMobile} aria-hidden="true" />
      )}

      <nav
        className={`fixed left-0 top-0 z-50 flex h-screen flex-col overflow-hidden transition-transform duration-200 sm:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{
          width: expanded ? "15.5rem" : "4.25rem",
          background: "var(--color-sidebar)",
          borderRight: "1px solid var(--tint-line)",
          boxShadow: "var(--sidebar-shadow)",
        }}
      >
        {/* Header */}
        <div
          className="flex shrink-0 items-center gap-2.5 px-3.5"
          style={{
            height: 58,
            background: "linear-gradient(105deg, #1b3fa8 0%, #5a2bb8 55%, #ff9d00 100%)",
            borderBottom: "1px solid rgba(0,0,0,0.3)",
          }}
        >
          <span
            className="flex h-[30px] w-[30px] shrink-0 items-center justify-center overflow-hidden rounded-[8px]"
            style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.2)" }}
          >
            <Image src={`${BASE_PATH}/logo.svg`} alt="" width={30} height={30} className="h-full w-full" />
          </span>
          {expanded && (
            <span
              className="heading truncate text-[1rem] tracking-[2px]"
              style={{
                background: "linear-gradient(90deg, #7ef0ff, #ffd27a)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              {t("app.title")}
            </span>
          )}
          <button
            type="button"
            onClick={onCloseMobile}
            className="ml-auto shrink-0 rounded-md p-1 sm:hidden"
            style={{ color: "rgba(255,255,255,0.8)" }}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable nav */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden px-2.5 py-2.5">
          {sections.map((sec, si) => {
            const isClosed = expanded && !!closed[sec.id];
            const items = isClosed ? sec.items.filter((i) => i.active) : sec.items;
            return (
              <div key={sec.id}>
                {expanded ? (
                  <button
                    type="button"
                    onClick={() => toggleSection(sec.id)}
                    aria-expanded={!isClosed}
                    className={`eyebrow mb-1 flex w-full items-center gap-2 px-1 text-left ${si === 0 ? "mt-1" : "mt-3.5"}`}
                    style={{ color: "var(--color-ink-dim)", fontSize: "0.57rem" }}
                  >
                    <ChevronDown
                      size={11}
                      className="shrink-0 transition-transform"
                      style={{ transform: isClosed ? "rotate(-90deg)" : "none" }}
                    />
                    {t(sec.title)}
                    <span className="h-px flex-1" style={{ background: "linear-gradient(90deg, var(--tint-line), transparent)" }} />
                  </button>
                ) : (
                  si > 0 && <div className="my-2.5 h-px" style={{ background: "var(--tint-line)" }} />
                )}
                <ul>{items.map((i) => navLink(i.key, i.icon, i.label, i.active, i.onClick, i.dot))}</ul>
              </div>
            );
          })}
        </div>

        {/* Useful links */}
        {expanded && (
          <div className="shrink-0 px-2.5 pb-1.5 pt-2" style={{ borderTop: "1px solid var(--tint-line)" }}>
            <p
              className="eyebrow mb-1.5 flex items-center gap-2 px-0.5"
              style={{ color: "var(--color-ink-dim)", fontSize: "0.57rem" }}
            >
              {t("sidebar.usefulLinks")}
              <span className="h-px flex-1" style={{ background: "linear-gradient(90deg, var(--tint-line), transparent)" }} />
            </p>
            <a
              href="https://unite-tools.com"
              target="_blank"
              rel="noreferrer"
              className="group relative flex items-center gap-2.5 overflow-hidden rounded-[10px] px-2 py-1.5 transition-all hover:translate-x-0.5"
              style={{ background: "var(--tint-faint)", border: "1px solid var(--tint-line)" }}
            >
              <span
                aria-hidden
                className="absolute left-0 rounded-r-[2px] opacity-0 transition-opacity group-hover:opacity-100"
                style={{ top: "20%", bottom: "20%", width: 2, background: "linear-gradient(180deg, #7ef0ff, #ffd27a)" }}
              />
              <span
                className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-[7px]"
                style={{ background: "rgba(79,195,247,0.07)", border: "1px solid rgba(79,195,247,0.12)" }}
              >
                <Image src={`${BASE_PATH}/favicon/unite-tools-logo.svg`} alt="" width={28} height={28} className="h-full w-full" />
              </span>
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-[0.75rem] font-bold tracking-wide" style={{ color: "var(--color-ink)" }}>
                  {t("sidebar.uniteTools")}
                </span>
                <span className="truncate text-[0.65rem] font-semibold" style={{ color: "var(--color-ink-dim)" }}>
                  {t("sidebar.uniteToolsDesc")}
                </span>
              </span>
            </a>
          </div>
        )}

        {/* Footer: locale + collapse */}
        <div
          className="flex shrink-0 items-center gap-1.5 px-2.5 py-2"
          style={{ borderTop: "1px solid var(--tint-line)", background: "rgba(0,0,0,0.2)" }}
        >
          <button
            type="button"
            onClick={onToggleCollapsed}
            className="hidden shrink-0 items-center justify-center rounded-[8px] p-1.5 sm:flex"
            style={{ color: "var(--color-ink-dim)", background: "var(--tint-line)", border: "1px solid var(--tint-line)" }}
            title={collapsed ? t("sidebar.show") : t("sidebar.hide")}
          >
            {collapsed ? <ChevronsRight size={14} /> : <ChevronsLeft size={14} />}
          </button>
          {expanded && (
            <div className="flex flex-1 items-center justify-center gap-1.5">
              {LOCALES.map((l) => (
                <button
                  key={l}
                  onClick={() => setLocale(l)}
                  className="flex items-center justify-center rounded-[8px] p-[5px] transition-all"
                  style={{
                    background: "var(--tint-line)",
                    border: `1px solid ${locale === l ? "rgba(126,240,255,0.3)" : "var(--tint-line)"}`,
                    opacity: locale === l ? 1 : 0.75,
                    boxShadow: locale === l ? "0 0 10px rgba(126,240,255,0.1)" : undefined,
                  }}
                  title={l === "fr" ? "Français" : "English"}
                >
                  <Image
                    src={`${BASE_PATH}/favicon/flags/${l}.svg`}
                    alt={l}
                    width={22}
                    height={14}
                    className="block rounded-[3px] object-cover"
                    style={{ border: "1px solid rgba(0,0,0,0.3)" }}
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      </nav>

      <button
        type="button"
        onClick={onOpenMobile}
        className="fixed left-3.5 top-3.5 z-30 flex h-9 w-9 items-center justify-center rounded-[9px] sm:hidden"
        style={{
          background: "rgba(8,13,36,0.92)",
          border: "1px solid rgba(79,195,247,0.25)",
          color: "var(--color-league)",
          display: mobileOpen ? "none" : "flex",
        }}
        aria-label={t("sidebar.openMenu")}
      >
        <Menu size={18} />
      </button>
    </>
  );
}