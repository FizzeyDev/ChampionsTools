// Display settings (theme, text size...). Stored in localStorage and applied as
// data-attributes on <html>; the inline script in layout.tsx applies them before
// first paint so there is no flash of the default theme.

export type ThemeId = "stadium" | "midnight" | "graphite" | "ocean" | "amoled" | "light";
export type TextSize = "small" | "normal" | "large" | "xlarge";

export interface Settings {
  theme: ThemeId;
  text: TextSize;
  font: "stylised" | "clean";
  backdrop: boolean;
  reduceMotion: boolean;
}

export const SETTINGS_KEY = "champcalc.settings";

export const DEFAULT_SETTINGS: Settings = {
  theme: "stadium",
  text: "normal",
  font: "stylised",
  backdrop: true,
  reduceMotion: false,
};

/** Swatches mirror the CSS variables of each theme: [page, panel, accent 1, accent 2]. */
export const THEMES: { id: ThemeId; swatch: [string, string, string, string] }[] = [
  { id: "stadium", swatch: ["#070a1b", "#0e1530", "#4fc3f7", "#ff9d00"] },
  { id: "midnight", swatch: ["#12141c", "#1a1d28", "#6fb7e0", "#e8a24a"] },
  { id: "graphite", swatch: ["#151515", "#1e1e20", "#7cc4e8", "#f0a63a"] },
  { id: "ocean", swatch: ["#0a1a1f", "#10262d", "#4dd0c4", "#ffb347"] },
  { id: "amoled", swatch: ["#000000", "#0b0b0f", "#4fc3f7", "#ff9d00"] },
  { id: "light", swatch: ["#eef1f8", "#ffffff", "#0b7fb8", "#c26a00"] },
];

const THEME_IDS = THEMES.map((t) => t.id as string);

export function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const p = JSON.parse(raw) as Partial<Settings>;
    return {
      theme: THEME_IDS.includes(p.theme as string) ? (p.theme as ThemeId) : DEFAULT_SETTINGS.theme,
      text: ["small", "normal", "large", "xlarge"].includes(p.text as string) ? (p.text as TextSize) : "normal",
      font: p.font === "clean" ? "clean" : "stylised",
      backdrop: p.backdrop !== false,
      reduceMotion: p.reduceMotion === true,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(s: Settings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
  } catch {
    /* storage unavailable: the setting still applies for this visit */
  }
}

export function applySettings(s: Settings): void {
  const el = document.documentElement;
  el.dataset.theme = s.theme;
  el.dataset.text = s.text;
  el.dataset.font = s.font;
  el.dataset.backdrop = s.backdrop ? "on" : "off";
  el.dataset.motion = s.reduceMotion ? "reduce" : "full";
}

/** Same logic as applySettings, as a string for the pre-paint inline script. */
export const BOOT_SCRIPT = `(function(){try{var p=JSON.parse(localStorage.getItem(${JSON.stringify(
  SETTINGS_KEY
)})||"{}"),e=document.documentElement,t=${JSON.stringify(THEME_IDS)};
e.dataset.theme=t.indexOf(p.theme)>-1?p.theme:"stadium";
e.dataset.text=["small","normal","large","xlarge"].indexOf(p.text)>-1?p.text:"normal";
e.dataset.font=p.font==="clean"?"clean":"stylised";
e.dataset.backdrop=p.backdrop===false?"off":"on";
e.dataset.motion=p.reduceMotion===true?"reduce":"full";}catch(_){}})();`;

// ---- backup of everything the site saves in this browser ----

const PREFIX = "champcalc.";

export function exportBackup(): string {
  const data: Record<string, string> = {};
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(PREFIX)) data[k] = localStorage.getItem(k) ?? "";
    }
  } catch {
    /* nothing to export */
  }
  return JSON.stringify({ app: "champions-tools", version: 1, data }, null, 2);
}

/** Restores a backup file. Returns how many entries were written, or null if the file is not a valid backup. */
export function importBackup(text: string): number | null {
  try {
    const parsed = JSON.parse(text);
    if (!parsed || parsed.app !== "champions-tools" || typeof parsed.data !== "object" || parsed.data === null) return null;
    let n = 0;
    for (const [k, v] of Object.entries(parsed.data as Record<string, unknown>)) {
      if (!k.startsWith(PREFIX) || typeof v !== "string") continue;
      localStorage.setItem(k, v);
      n++;
    }
    return n;
  } catch {
    return null;
  }
}
