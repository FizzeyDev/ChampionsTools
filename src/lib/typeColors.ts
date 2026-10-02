// Official-ish Pokémon type colors (the palette most Pokédex/type-chart
// sites use), kept separate from the app's own UI accent palette
// (--color-league etc.) since these need to map 1:1 to all 18 types.
export const TYPE_COLORS: Record<string, string> = {
  Normal: "#A8A77A",
  Fire: "#EE8130",
  Water: "#6390F0",
  Electric: "#F7D02C",
  Grass: "#7AC74C",
  Ice: "#96D9D6",
  Fighting: "#C22E28",
  Poison: "#A33EA1",
  Ground: "#E2BF65",
  Flying: "#A98FF3",
  Psychic: "#F95587",
  Bug: "#A6B91A",
  Rock: "#B6A136",
  Ghost: "#735797",
  Dragon: "#6F35FC",
  Dark: "#705746",
  Steel: "#B7B7CE",
  Fairy: "#D685AD",
  Stellar: "#4fc3f7",
};

export function typeColor(type: string | undefined): string {
  return (type && TYPE_COLORS[type]) || "#5a7577";
}

/** A card-header-friendly background for a Pokémon's 1 or 2 types: a solid
 * tint for a single type, or a diagonal gradient (each type starting in its
 * own corner and meeting in the middle) for a dual type. */
export function typeGradient(types: string[]): string {
  if (types.length === 0) return "transparent";
  if (types.length === 1) {
    const c = typeColor(types[0]);
    return `linear-gradient(135deg, ${c}55, ${c}22)`;
  }
  const [a, b] = types;
  const ca = typeColor(a);
  const cb = typeColor(b);
  return `linear-gradient(135deg, ${ca}66 0%, ${ca}33 35%, ${cb}33 65%, ${cb}66 100%)`;
}