// Draws the team as a PNG (canvas, no libraries): six build cards plus the
// defensive summary. Sprites are fetched with CORS so the canvas stays
// exportable; if one fails to load the card is simply drawn without it.

import { getSpeciesInfo } from "../champions/data";
import { toFrench, toFrenchNature, toFrenchType } from "../champions/gameTranslations";
import { evToSp } from "../champions/statPoints";
import { STAT_KEYS } from "../calc/gen";
import { pokemonSpriteUrl } from "../app/sprites";
import { typeColor } from "../app/typeColors";
import type { TeamTypeEntry } from "../features/teamCoverage";
import type { PokemonState } from "../calc/types";

export interface TeamImageText {
  title: string;
  weak: string;
  veryWeak: string;
  resist: string;
  veryResist: string;
  footer: string;
  stat: Record<string, string>;
}

const W = 1200;
const PAD = 32;
const COLS = 3;
const CARD_W = (W - PAD * 2 - 24 * (COLS - 1)) / COLS;
const CARD_H = 236;

function loadImage(url: string | null): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    if (!url) return resolve(null);
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

function roundRect(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  c.beginPath();
  c.moveTo(x + r, y);
  c.arcTo(x + w, y, x + w, y + h, r);
  c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r);
  c.arcTo(x, y, x + w, y, r);
  c.closePath();
}

function fitText(c: CanvasRenderingContext2D, text: string, maxW: number): string {
  if (c.measureText(text).width <= maxW) return text;
  let t = text;
  while (t.length > 1 && c.measureText(t + "…").width > maxW) t = t.slice(0, -1);
  return t + "…";
}

function pill(c: CanvasRenderingContext2D, label: string, color: string, x: number, y: number): number {
  c.font = "700 13px system-ui, sans-serif";
  const w = c.measureText(label).width + 18;
  roundRect(c, x, y, w, 22, 7);
  c.fillStyle = color + "33";
  c.fill();
  c.strokeStyle = color + "aa";
  c.lineWidth = 1;
  c.stroke();
  c.fillStyle = color;
  c.textBaseline = "middle";
  c.fillText(label, x + 9, y + 11.5);
  return w;
}

export async function renderTeamImage(
  team: PokemonState[],
  weaknesses: TeamTypeEntry[],
  locale: "en" | "fr",
  text: TeamImageText
): Promise<Blob> {
  const members = team.filter((m) => m.species);
  const rows = Math.max(1, Math.ceil(members.length / COLS));
  const groups = (["veryWeak", "weak", "resist", "veryResist"] as const)
    .map((label) => ({ label, items: weaknesses.filter((w) => w.label === label) }))
    .filter((g) => g.items.length > 0);
  const summaryH = groups.length ? 40 + groups.length * 36 : 0;
  const H = 96 + rows * (CARD_H + 20) + summaryH + 56;

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const c = canvas.getContext("2d")!;
  const tr = (kind: "species" | "move" | "ability" | "item", n: string) => (locale === "fr" ? toFrench(kind, n) : n);

  // background
  const bg = c.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, "#0b1618");
  bg.addColorStop(1, "#14212b");
  c.fillStyle = bg;
  c.fillRect(0, 0, W, H);

  // header
  c.fillStyle = "#e9f6f8";
  c.font = "800 34px system-ui, sans-serif";
  c.textBaseline = "alphabetic";
  c.fillText(text.title, PAD, 62);
  const bar = c.createLinearGradient(PAD, 0, W - PAD, 0);
  bar.addColorStop(0, "#4fc3f7");
  bar.addColorStop(1, "#ff9d00");
  c.fillStyle = bar;
  c.fillRect(PAD, 76, W - PAD * 2, 3);

  const sprites = await Promise.all(members.map((m) => loadImage(pokemonSpriteUrl(m.species))));

  members.forEach((m, idx) => {
    const col = idx % COLS;
    const row = Math.floor(idx / COLS);
    const x = PAD + col * (CARD_W + 24);
    const y = 96 + row * (CARD_H + 20);
    const info = getSpeciesInfo(m.species);

    roundRect(c, x, y, CARD_W, CARD_H, 14);
    c.fillStyle = "#16262d";
    c.fill();
    c.strokeStyle = "#2a4048";
    c.lineWidth = 1.5;
    c.stroke();

    const sprite = sprites[idx];
    if (sprite) c.drawImage(sprite, x + 10, y + 10, 84, 84);
    else {
      c.fillStyle = "#22373f";
      c.beginPath();
      c.arc(x + 52, y + 52, 36, 0, Math.PI * 2);
      c.fill();
    }

    c.textBaseline = "alphabetic";
    c.fillStyle = "#e9f6f8";
    c.font = "800 21px system-ui, sans-serif";
    c.fillText(fitText(c, tr("species", m.species), CARD_W - 120), x + 104, y + 34);

    let px = x + 104;
    for (const ty of info?.types ?? []) {
      px += pill(c, locale === "fr" ? toFrenchType(ty) : ty, typeColor(ty), px, y + 44) + 6;
    }

    c.font = "600 13px system-ui, sans-serif";
    c.fillStyle = "#9cc3c9";
    const line1 = [m.item && tr("item", m.item), m.ability && tr("ability", m.ability)].filter(Boolean).join(" · ");
    c.fillText(fitText(c, line1 || "-", CARD_W - 120), x + 104, y + 86);
    const sp = STAT_KEYS.filter((k) => m.evs[k]).map((k) => `${evToSp(m.evs[k])} ${text.stat[k]}`);
    const line2 = [locale === "fr" ? toFrenchNature(m.nature) : m.nature, ...sp].join(" · ");
    c.fillStyle = "#6f969c";
    c.fillText(fitText(c, line2, CARD_W - 120), x + 104, y + 106);

    // moves, 2 × 2
    const moves = m.moves.filter(Boolean);
    moves.forEach((mv, i) => {
      const mx = x + 14 + (i % 2) * (CARD_W / 2 - 4);
      const my = y + 128 + Math.floor(i / 2) * 44;
      roundRect(c, mx, my, CARD_W / 2 - 22, 36, 9);
      c.fillStyle = "#1f343c";
      c.fill();
      c.fillStyle = "#e9f6f8";
      c.font = "700 14px system-ui, sans-serif";
      c.textBaseline = "middle";
      c.fillText(fitText(c, tr("move", mv), CARD_W / 2 - 46), mx + 12, my + 18);
    });
  });

  // defensive summary
  let y = 96 + rows * (CARD_H + 20) + 8;
  if (groups.length) {
    c.textBaseline = "alphabetic";
    c.fillStyle = "#cfe9ed";
    c.font = "800 18px system-ui, sans-serif";
    c.fillText(text.weak + " / " + text.resist, PAD, y + 14);
    y += 30;
    const color = { veryWeak: "#ff5252", weak: "#ffd740", resist: "#4caf50", veryResist: "#4fc3f7" };
    const label = { veryWeak: text.veryWeak, weak: text.weak, resist: text.resist, veryResist: text.veryResist };
    for (const g of groups) {
      c.textBaseline = "middle";
      c.fillStyle = color[g.label];
      c.font = "800 14px system-ui, sans-serif";
      c.fillText(label[g.label], PAD, y + 16);
      let px = PAD + 150;
      for (const e of g.items) px += pill(c, locale === "fr" ? toFrenchType(e.type) : e.type, typeColor(e.type), px, y + 5) + 6;
      y += 36;
    }
  }

  c.textBaseline = "alphabetic";
  c.fillStyle = "#4d6d73";
  c.font = "600 13px system-ui, sans-serif";
  c.fillText(text.footer, PAD, H - 22);

  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("canvas export failed"))), "image/png")
  );
}
