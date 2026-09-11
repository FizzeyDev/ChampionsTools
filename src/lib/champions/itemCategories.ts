import { HOLD_ITEMS, MEGA_STONES, NEW_MEGA_STONES, BERRIES } from "./items";

export type ItemCategory = "recovery" | "power" | "stat" | "effect" | "mega" | "berry" | "other";

export const ITEM_CATEGORY_ORDER: ItemCategory[] = [
  "recovery",
  "power",
  "stat",
  "effect",
  "mega",
  "berry",
  "other",
];

// Best-effort classification of held items into the categories Champions'
// own item menu uses (Recovery / Power Boost / Stat Boost / Effect Extend),
// based on each item's known effect. Mega Stones and Berries are their own
// pockets in-game, same as here. Not datamined — if a specific item's menu
// placement turns out different in-game, it's easy to move it below.
const RECOVERY = new Set([
  "Leftovers",
  "Shell Bell",
  "Mental Herb",
  "Big Root",
]);

const POWER = new Set([
  "Life Orb",
  "Expert Belt",
  "Muscle Band",
  "Wise Glasses",
  "Metronome",
  "Normal Gem",
  "Light Ball",
  "Black Belt",
  "Black Glasses",
  "Charcoal",
  "Dragon Fang",
  "Fairy Feather",
  "Hard Stone",
  "Magnet",
  "Metal Coat",
  "Miracle Seed",
  "Mystic Water",
  "Never-Melt Ice",
  "Poison Barb",
  "Sharp Beak",
  "Silk Scarf",
  "Silver Powder",
  "Soft Sand",
  "Spell Tag",
  "Twisted Spoon",
  "Binding Band",
]);

const STAT = new Set([
  "Choice Scarf",
  "White Herb",
  "Iron Ball",
  "Electric Seed",
  "Grassy Seed",
  "Misty Seed",
  "Psychic Seed",
  "King's Rock",
  "Quick Claw",
  "Scope Lens",
  "Wide Lens",
  "Zoom Lens",
  "Bright Powder",
]);

const EFFECT = new Set([
  "Damp Rock",
  "Heat Rock",
  "Icy Rock",
  "Smooth Rock",
  "Light Clay",
  "Terrain Extender",
]);

export function getItemCategory(item: string): ItemCategory {
  if (RECOVERY.has(item)) return "recovery";
  if (POWER.has(item)) return "power";
  if (STAT.has(item)) return "stat";
  if (EFFECT.has(item)) return "effect";
  if (MEGA_STONES.some((m) => m.item === item) || NEW_MEGA_STONES.some((m) => m.item === item)) return "mega";
  if (BERRIES.includes(item)) return "berry";
  if (HOLD_ITEMS.includes(item)) return "other";
  return "other";
}