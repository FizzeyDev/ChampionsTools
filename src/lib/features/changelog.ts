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
 * user-visible release - the "what's new" modal (ChangelogModal.tsx) uses
 * this list to show everything newer than what's stored in the visitor's
 * localStorage, then stores CURRENT_VERSION so it doesn't show again until
 * the next bump. */
export const CHANGELOG: ChangelogEntry[] = [
  {
    version: "1.0.0",
    date: "2026-10-28",
    notes: [
      {
        tag: "new",
        en: "Settings page - six themes (including soft dark, neutral grey, OLED black and light), text size, font, effects, plus export / import of all your saved Pokémon, teams and notes.",
        fr: "Page Réglages - six thèmes (dont un sombre doux, un gris neutre, un noir OLED et un clair), taille du texte, police, effets, plus export / import de tous tes Pokémon, équipes et notes sauvegardés.",
      },
      {
        tag: "update",
        en: "Menu sections can be folded with an arrow; the tab you are on always stays visible.",
        fr: "Les sections du menu se replient avec une flèche; l'onglet en cours reste toujours visible.",
      },
      {
        tag: "update",
        en: "Game database - every Pokémon list now shows its sprite.",
        fr: "Base de données - chaque liste de Pokémon affiche maintenant son image.",
      },
      {
        tag: "update",
        en: "Type & coverage - new list of the Pokémon that resist (or are immune to) your whole set of types.",
        fr: "Types & coverage - nouvelle liste des Pokémon qui résistent (ou sont immunisés) à tout ton set de types.",
      },
      {
        tag: "update",
        en: "Spread optimizer - the attacker and defender are now editable on the same page, and the result is written as a plain sentence (cheapest spread, or no investment needed).",
        fr: "Optimiseur de spread - l'attaquant et le défenseur se modifient directement sur la même page, et le résultat s'écrit en une phrase claire (spread le moins cher, ou aucun investissement nécessaire).",
      },
      {
        tag: "new",
        en: "Champions Tools 1.0 - the official release. Everything below ships together: Pokédex, advanced search, type & coverage tools, Speed Tiers v2, spread optimizer, shareable links, offline mode and a new look.",
        fr: "Champions Tools 1.0 - la version officielle. Tout ce qui suit sort en même temps : Pokédex, recherche avancée, outils de types & coverage, Speed Tiers v2, optimiseur de spread, liens partageables, mode hors-ligne et nouveau look.",
      },
      {
        tag: "new",
        en: "Champions Pokédex - every Pokémon and Mega available in Champions with types, abilities, base stats and a full detail sheet (weaknesses & resistances, legal moves, competitive set with its source, Speed benchmarks). Every name on the site is now clickable.",
        fr: "Pokédex Champions - tous les Pokémon et Méga disponibles dans Champions avec types, talents, stats de base et une fiche détaillée (faiblesses & résistances, attaques légales, set compétitif avec sa source, repères de vitesse). Tous les noms du site sont maintenant cliquables.",
      },
      {
        tag: "new",
        en: "Advanced search - filter by type or dual type, ability, one or several moves (all / any), Mega, minimum stats, base Speed range, offensive coverage and resistances. Each result shows why it matched, and the search can be shared as a link.",
        fr: "Recherche avancée - filtre par type ou double type, talent, une ou plusieurs attaques (toutes / au moins une), Méga, stats minimales, plage de Vitesse de base, coverage offensive et résistances. Chaque résultat indique pourquoi il correspond, et la recherche se partage par lien.",
      },
      {
        tag: "new",
        en: "Moves, Abilities and Items pages - what each does and which Champions Pokémon learn it or hold it.",
        fr: "Pages Attaques, Talents et Objets - ce que fait chacun et quels Pokémon de Champions l'apprennent ou l'ont.",
      },
      {
        tag: "new",
        en: "Type & coverage calculators - pick 1–2 types for the full defensive table and the Champions Pokémon with that typing; pick up to 4 attacking types to see what you hit, which Pokémon you can't, and which extra type would close the gaps.",
        fr: "Calculateurs de types & coverage - choisis 1 à 2 types pour la table défensive complète et les Pokémon de Champions de ce typage ; choisis jusqu'à 4 types d'attaque pour voir ce que tu touches, quels Pokémon tu ne touches pas, et quel type supplémentaire comblerait les trous.",
      },
      {
        tag: "new",
        en: "Speed Tiers v2 - speed abilities (Swift Swim, Slush Rush, Chlorophyll, Sand Rush, Surge Surfer, Unburden, Quick Feet, Speed Boost) now apply on their own; global Context panel (weather, terrain, Tailwind, Trick Room) and Reference spread panel (SP, nature, stage, Scarf, paralysis + presets) that can target everyone, your side or the opponents; per-row edits override them; import your team, and see where you sit in the order.",
        fr: "Speed Tiers v2 - les talents de vitesse (Glissade, Chasse-Neige, Chlorophylle, Baigne Sable, Surf Caudal, Délestage, Pied Véloce, Turbo) s'appliquent tout seuls ; panneau Contexte global (météo, terrain, Vent Arrière, Distorsion) et panneau Spread de référence (SP, nature, stage, Mouchoir, paralysie + préréglages) applicables à tout le monde, à ton côté ou aux adversaires ; les réglages par ligne les surchargent ; import de ton équipe et repère de ta position dans le classement.",
      },
      {
        tag: "new",
        en: "Calculator - second target for spread moves, partner boosts (Helping Hand, Battery, Power Spot, Steely Spirit, Flower Gift), one-click stat boosts (Swords Dance, Nasty Plot…), and a combo tray that stacks several hits and gives the exact chance the target survives them in one turn.",
        fr: "Calculateur - seconde cible pour les attaques de zone, boosts de partenaire (Coup d'Main, Batterie, Cercle d'Énergie, Boost Acier, Don Floral), boosts de stats en un clic (Danse Lames, Machination…), et plateau de combo qui cumule plusieurs coups et donne la probabilité exacte que la cible y survive dans le même tour.",
      },
      {
        tag: "new",
        en: "Spread optimizer - finds the minimum Stat Points needed to survive a hit, KO or outspeed a target. It only calculates; it never picks a build for you.",
        fr: "Optimiseur de spread - trouve le minimum de Stat Points pour survivre à un coup, mettre K.O. ou dépasser une cible. Il ne fait que calculer ; il ne choisit jamais un build à ta place.",
      },
      {
        tag: "new",
        en: "Team Coverage - shareable team link (your own saved team is never overwritten) and PNG image export.",
        fr: "Team Coverage - lien d'équipe partageable (ton équipe sauvegardée n'est jamais écrasée) et export en image PNG.",
      },
      {
        tag: "new",
        en: "Works offline once visited (installable as an app), keyboard shortcuts (press ? to see them), and link previews when you paste a link in Discord or Slack.",
        fr: "Fonctionne hors ligne après une première visite (installable comme une app), raccourcis clavier (appuie sur ? pour les voir) et aperçu des liens collés dans Discord ou Slack.",
      },
      {
        tag: "update",
        en: "New look inspired by the Champions stadium feel - still 100% fan-made, with no official assets. The field panel is now grouped (ally support, screens, hazards, afflictions) and easier to read.",
        fr: "Nouveau style inspiré de l'ambiance stade de Champions - toujours 100% fanmade, sans aucun asset officiel. Le panneau de terrain est maintenant regroupé (soutien des alliés, écrans, pièges, altérations) et plus lisible.",
      },
      {
        tag: "fix",
        en: "Defender → attacker calculations now read the field from the right side: Reflect, Light Screen, Helping Hand and other per-side effects ticked under the Defender card were applied to the wrong Pokémon in the second result panel.",
        fr: "Les calculs défenseur → attaquant lisent maintenant le terrain du bon côté : Protection, Mur Lumière, Coup d'Main et les autres effets par côté cochés sous la carte Défenseur étaient appliqués au mauvais Pokémon dans le second panneau de résultats.",
      },
      {
        tag: "fix",
        en: "Data corrections: King's Shield and Sucker Punch are no longer missing for Aegislash and Kingambit, and made-up Pokémon names are now rejected. Automated tests (npm test) now guard the data, the damage and speed formulas and the translations.",
        fr: "Corrections de données : Bouclier Royal et Coup Bas ne manquent plus à Aegislash et Kingambit, et les noms de Pokémon inventés sont maintenant rejetés. Des tests automatiques (npm test) protègent désormais les données, les formules de dégâts et de vitesse et les traductions.",
      },
    ],
  },
  {
    version: "0.6.1",
    date: "2026-10-20",
    notes: [
      {
        tag: "fix",
        en: "GitHub Pages deployment: the sidebar logo, the Unite Tools logo and the language flags no longer 404 - they were missing their deployment subpath prefix.",
        fr: "Déploiement GitHub Pages : le logo de la sidebar, le logo Unite Tools et les drapeaux de langue ne font plus de 404 - il leur manquait le préfixe de sous-dossier du déploiement.",
      },
      {
        tag: "fix",
        en: "Fixed the real cause of Pokemon tanking more or less than expected after switching species several times: the previous Pokemon's held item (often a Mega Stone) could silently stay equipped on the new one. Ability, Tera type, status and \"ability triggered\" are now reset on every switch too.",
        fr: "Corrigé la vraie cause des Pokemon qui encaissaient plus ou moins de dégâts que prévu après plusieurs changements d'espèce : l'objet tenu du Pokemon précédent (souvent une Méga-Pierre) pouvait rester équipé silencieusement sur le nouveau. Le talent, le type Tera, le statut et \"talent déclenché\" se réinitialisent maintenant aussi à chaque changement.",
      },
      {
        tag: "fix",
        en: "Moveset legality checking no longer produces false \"illegal move\" warnings for real, sourced competitive moves missing from the underlying move database (e.g. Sucker Punch on Kingambit) - curated sets' own moves are now always treated as legal.",
        fr: "La vérification de légalité des capacités ne génère plus de faux avertissements \"capacité illégale\" pour de vraies capacités compétitives sourcées absentes de la base de données sous-jacente (ex. Coup Bas sur Kingambit) - les capacités des sets curatés sont désormais toujours considérées comme légales.",
      },
      {
        tag: "fix",
        en: "Fixed several curated sets that pointed at the wrong Mega form or the wrong item/ability/nature (Mega Floette, Mega Dragonite, Mega Froslass, Mega Golisopod's ability, and Mega Meganium's item/nature/ability, which was mislabeled as base Meganium).",
        fr: "Correction de plusieurs sets curatés qui pointaient vers la mauvaise forme Méga ou avaient le mauvais objet/talent/nature (Méga Floette, Méga Dragonite, Méga Froslass, le talent de Méga Golisopod, et l'objet/la nature/le talent de Méga Meganium, qui était mal étiqueté comme Meganium de base).",
      },
      {
        tag: "new",
        en: "Added 7 more real, sourced competitive sets: Rillaboom, Mega Salamence, Mega Baxcalibur, Mega Hawlucha, Zoroark, Krookodile and Skeledirge.",
        fr: "Ajout de 7 nouveaux sets compétitifs réels et sourcés : Rillaboom, Méga Salamence, Méga Baxcalibur, Méga Hawlucha, Zoroark, Krookodile et Skeledirge.",
      },
      {
        tag: "new",
        en: "Importing a set now also understands a \"Stat Points:\"/\"SP:\" line (0-32 per stat, the game's own scale) as an alternative to the classic Showdown \"EVs:\" line (0-252).",
        fr: "L'import d'un set reconnaît maintenant aussi une ligne \"Stat Points:\"/\"SP:\" (0-32 par stat, l'échelle du jeu) en plus de la ligne classique Showdown \"EVs:\" (0-252).",
      },
    ],
  },
  {
    version: "0.6.0",
    date: "2026-10-01",
    notes: [
      {
        tag: "new",
        en: "Team Coverage - build a 6-Pokemon roster (item, ability, moves, Stat Points) and get an instant type-weakness gut-check, coverage-type recommendations, and an optional look at which meta Pokemon threaten or get threatened by your team.",
        fr: "Team Coverage - construis une équipe de 6 Pokemon (objet, talent, capacités, Points de Stat) et obtiens d'un coup d'œil ses faiblesses de type, des recommandations de types à couvrir, et un aperçu optionnel des Pokemon de la meta qui menacent ou sont menacés par ton équipe.",
      },
      {
        tag: "new",
        en: "Full navbar rework to match Unite Tools' sidebar style - real flag icons, the Unite Tools logo on its link, and a closer layout/animation match overall.",
        fr: "Refonte complète de la navbar pour coller au style de la sidebar d'Unite Tools - vrais drapeaux, logo Unite Tools sur son lien, et une mise en page/animation beaucoup plus proche.",
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
        en: "Team Coverage: save named teams, load or delete them later, and import/export a roster as a Showdown-format team - on top of the automatic working-team save.",
        fr: "Team Coverage : sauvegarde des équipes nommées, chargeables ou supprimables plus tard, et import/export d'un roster au format équipe Showdown - en plus de la sauvegarde automatique de l'équipe en cours.",
      },
      {
        tag: "new",
        en: "Team Coverage: added an \"Offensive coverage\" section showing the attacking types your team's current moves actually cover - the type-weaknesses section above it is about your team's own defensive typing and intentionally doesn't move when you pick moves.",
        fr: "Team Coverage : ajout d'une section \"Couverture offensive\" qui montre les types offensifs réellement couverts par les capacités de ton équipe - la section des faiblesses de type juste au-dessus concerne le typage défensif de ton équipe et ne bouge volontairement pas quand tu choisis des capacités.",
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
        en: "Move Comparator - pick an attacker and two moves, compare them across a curated pool of meta-relevant Pokemon (bulk-editable Stat Points, kill-count summary, hide & auto-replace, swap moves).",
        fr: "Comparateur de Move - choisis un attaquant et deux capacités, compare-les sur une liste de Pokemon meta-pertinents (Points de Stat modifiables en masse, résumé des KO, cacher & remplacement auto, inversion des capacités).",
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
  if (!lastSeen) return true; // never visited the page - flag it once
  return compareVersions(CURRENT_VERSION, lastSeen) > 0;
}