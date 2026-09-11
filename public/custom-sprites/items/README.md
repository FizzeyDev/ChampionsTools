# Sprites d'objets manquants

Ces objets n'existent pas encore dans la base d'images publique PokeAPI (ce
sont soit des objets exclusifs à Champions, soit trop récents). L'appli
cherche automatiquement une image ici avant d'abandonner — dépose un PNG avec
EXACTEMENT le nom de fichier ci-dessous et ça s'affichera tout seul, sans
toucher au code.

Format recommandé : PNG carré, fond transparent, ~64x64px (comme les icônes
d'objets classiques du jeu).

## Fichiers attendus (0)

Si tu ajoutes/renommes un objet dans `src/lib/champions/items.ts`, pense à
mettre à jour la liste `MISSING_ITEM_SPRITES` dans
`src/lib/features/spriteOverrides.ts` en conséquence.