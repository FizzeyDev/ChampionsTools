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