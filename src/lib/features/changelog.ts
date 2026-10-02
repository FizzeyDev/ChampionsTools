export type ChangelogTag = "new" | "update" | "fix";

export interface ChangelogNote {
  tag: ChangelogTag;
  en: string;
  fr: string;
}

export interface ChangelogEntry {
  version: string;
  date: string; // ISO date, display only
  notes: ChangelogNote[];
}

/** Newest first. Bump CURRENT_VERSION and add an entry here on every
 * user-visible release — the "what's new" modal (ChangelogModal.tsx) uses
 * this list to show everything newer than what's stored in the visitor's
 * localStorage, then stores CURRENT_VERSION so it doesn't show again until
 * the next bump. */
export const CHANGELOG: ChangelogEntry[] = [
  {
    version: "0.6.0",
    date: "2026-10-01",
    notes: [
      {
        tag: "new",
        en: "Team Coverage — build a 6-Pokemon roster (item, ability, moves, Stat Points) and get an instant type-weakness gut-check, coverage-type recommendations, and an optional look at which meta Pokemon threaten or get threatened by your team.",
        fr: "Team Coverage — construis une équipe de 6 Pokemon (objet, talent, capacités, Points de Stat) et obtiens d'un coup d'œil ses faiblesses de type, des recommandations de types à couvrir, et un aperçu optionnel des Pokemon de la meta qui menacent ou sont menacés par ton équipe.",
      },
      {
        tag: "new",
        en: "Full navbar rework to match Unite Tools' sidebar style — real flag icons, the Unite Tools logo on its link, and a closer layout/animation match overall.",
        fr: "Refonte complète de la navbar pour coller au style de la sidebar d'Unite Tools — vrais drapeaux, logo Unite Tools sur son lien, et une mise en page/animation beaucoup plus proche.",
      },
      {
        tag: "new",
        en: "What's New is now a real page instead of a popup, with a small dot on its sidebar entry when there's something you haven't seen yet.",
        fr: "Les Nouveautés sont maintenant une vraie page au lieu d'une popup, avec un petit point sur son entrée dans la sidebar quand il y a du nouveau non vu.",
      },
      {
        tag: "update",
        en: "Saved Pokemon and Copy Link moved out of the global navbar and back into the calculator itself, since they only make sense there.",
        fr: "Pokemon sauvegardés et Copier le lien sont sortis de la navbar globale pour revenir dans le calculateur, puisqu'ils n'ont de sens que là.",
      },
      {
        tag: "new",
        en: "Added the Champions Tools trophy logo (from Unite Tools' homepage) as the sidebar logo and site favicon.",
        fr: "Ajout du logo trophée Champions Tools (repris de la page d'accueil d'Unite Tools) comme logo de la sidebar et favicon du site.",
      },
      {
        tag: "new",
        en: "Team Coverage: save named teams, load or delete them later, and import/export a roster as a Showdown-format team — on top of the automatic working-team save.",
        fr: "Team Coverage : sauvegarde des équipes nommées, chargeables ou supprimables plus tard, et import/export d'un roster au format équipe Showdown — en plus de la sauvegarde automatique de l'équipe en cours.",
      },
      {
        tag: "new",
        en: "Team Coverage: added an \"Offensive coverage\" section showing the attacking types your team's current moves actually cover — the type-weaknesses section above it is about your team's own defensive typing and intentionally doesn't move when you pick moves.",
        fr: "Team Coverage : ajout d'une section \"Couverture offensive\" qui montre les types offensifs réellement couverts par les capacités de ton équipe — la section des faiblesses de type juste au-dessus concerne le typage défensif de ton équipe et ne bouge volontairement pas quand tu choisis des capacités.",
      },
      {
        tag: "update",
        en: "Team Coverage's roster cards redesigned: sprite, species and type badges up top, item/ability side by side, an always-visible base/Stat Points/total stat block, and the 4 moves in their own column.",
        fr: "Cartes du roster de Team Coverage redessinées : sprite, espèce et badges de type en haut, objet/talent côte à côte, un bloc stats (base/Points de Stat/total) toujours visible, et les 4 capacités dans leur propre colonne.",
      },
      {
        tag: "update",
        en: "Every Pokemon card across the site (1v1, 1 vs All, All vs 1, All vs All, Best Moves, Move Comparator, Team Coverage) now tints its background with the Pokemon's own type color(s), split diagonally for dual types.",
        fr: "Chaque carte Pokemon du site (1v1, 1 vs Tous, Tous vs 1, Tous vs Tous, Best Moves, Comparateur de Move, Team Coverage) teinte maintenant son fond avec la ou les couleurs de type du Pokemon, en diagonale pour un double type.",
      },
      {
        tag: "update",
        en: "Replaced every small type icon across the site with bigger, round energy-style badges (icon + name) that are actually readable at a glance, instead of the tiny in-game banner icons.",
        fr: "Remplacement de toutes les petites icônes de type du site par des badges ronds façon \"énergie\" (icône + nom), bien plus lisibles d'un coup d'œil que les minuscules bannières du jeu.",
      },
      {
        tag: "update",
        en: "Sidebar: Speed Tiers moved into the Tools section next to Team Coverage, \"Useful Links\" renamed to \"My Other Projects\", the site title is now \"Champions Tools\", and the collapse button is now pinned to the bottom-left with the language flags centered next to it.",
        fr: "Sidebar : Speed Tiers déplacé dans la section Outils à côté de Team Coverage, \"Liens utiles\" renommé en \"Mes autres projets\", le titre du site est maintenant \"Champions Tools\", et le bouton de repliement est maintenant calé en bas à gauche avec les drapeaux centrés à côté.",
      },
    ],
  },
  {
    version: "0.5.0",
    date: "2026-09-29",
    notes: [
      {
        tag: "new",
        en: "Move Comparator — pick an attacker and two moves, compare them across a curated pool of meta-relevant Pokemon (bulk-editable Stat Points, kill-count summary, hide & auto-replace, swap moves).",
        fr: "Comparateur de Move — choisis un attaquant et deux capacités, compare-les sur une liste de Pokemon meta-pertinents (Points de Stat modifiables en masse, résumé des KO, cacher & remplacement auto, inversion des capacités).",
      },
      {
        tag: "fix",
        en: "The Speed stat shown on a Pokemon's card now reflects Choice Scarf and other item/ability/weather/Tailwind modifiers, not just stat stages.",
        fr: "La Vitesse affichée sur la carte d'un Pokemon reflète maintenant le Choice Scarf et les autres effets d'objet/talent/météo/vent arrière, pas seulement les stages.",
      },
      {
        tag: "fix",
        en: "Switching species no longer leaves the previous Pokemon's EV/stage spread stuck on the new one, and no longer races a slow moveset lookup against a newer switch.",
        fr: "Changer d'espèce ne laisse plus le spread EV/stages de l'ancien Pokemon collé au nouveau, et une recherche de moveset lente ne peut plus écraser un changement plus récent.",
      },
      {
        tag: "new",
        en: "Your saved Pokemon builds now show up while searching the species field, not just in the Saved Pokemon list.",
        fr: "Tes Pokemon sauvegardés apparaissent maintenant directement dans la recherche du champ espèce, pas seulement dans la liste des sauvegardes.",
      },
      {
        tag: "update",
        en: "The default 4 moves suggested for a Pokemon without a curated real set now favor STAB damage and staple utility/setup moves instead of being picked alphabetically.",
        fr: "Les 4 capacités proposées par défaut pour un Pokemon sans set réel curaté favorisent maintenant les dégâts STAB et les capacités utilitaires/setup classiques, au lieu d'un tirage alphabétique.",
      },
      {
        tag: "fix",
        en: "Fixed a double-click on the team roster's \"add slot\" button occasionally losing one of the two added Pokemon.",
        fr: "Corrigé un double-clic sur le bouton \"+\" du roster d'équipe qui pouvait faire perdre un des deux Pokemon ajoutés.",
      },
    ],
  },
];

export const CURRENT_VERSION = CHANGELOG[0].version;

const SEEN_STORAGE_KEY = "champcalc.lastSeenVersion";

export function compareVersions(a: string, b: string): number {
  const pa = a.split(".").map(Number);
  const pb = b.split(".").map(Number);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const diff = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

export function getLastSeenVersion(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(SEEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function markChangelogSeen() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(SEEN_STORAGE_KEY, CURRENT_VERSION);
  } catch {
    // ignore
  }
}

export function hasUnseenChangelog(): boolean {
  const lastSeen = getLastSeenVersion();
  if (!lastSeen) return true; // never visited the page — flag it once
  return compareVersions(CURRENT_VERSION, lastSeen) > 0;
}