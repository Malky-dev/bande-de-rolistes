# Normes de code — Bande de Rôlistes

## Périmètre

Ces règles s’appliquent à tout travail sur ce projet, sauf exception explicitement justifiée et vérifiée dans l’état courant du dépôt ou de l’archive réelle.

## Source de vérité

- Travailler uniquement à partir de l’état réel courant du dépôt ou de l’archive fournie.
- Ne jamais recycler un diagnostic issu d’une archive plus ancienne ou d’une conversation précédente sans le revalider dans l’état actuel.
- Ne faire aucune supposition sur du code non vérifié directement.

## Priorités

Toujours prioriser :

- la robustesse
- la cohérence
- la clarté
- le nettoyage utile

Éviter :

- l’abstraction décorative
- les refactors spéculatifs
- les modifications cosmétiques sans valeur réelle
- les réécritures structurelles sans raison sérieuse et vérifiée

## Règles TypeScript

- Pas de `any` dans le code source.
- Pas de `unknown` dans le code source.
- `unknown` n’est toléré dans les tests que s’il n’existe aucune alternative raisonnable.
- Garder des types explicites et orientés métier.
- Préférer le narrowing et le parsing validé à un typage lâche.
- Ne pas exporter un type, un guard ou un helper s’il n’a pas de consommateur externe réel dans l’état actuel du code.

## Règles React

- Utiliser des noms de composants simples et orientés métier.
- Ne pas ajouter de suffixes techniques inutiles aux noms de composants.
- Garder des composants lisibles, ciblés et faciles à relire.
- Ne pas introduire de couches d’abstraction sauf si elles suppriment une duplication réelle et vérifiée, ou améliorent clairement la robustesse.
- Ne pas rouvrir des zones stables déjà considérées comme closes sans raison sérieuse démontrée par l’état courant du code.

## Imports

- Préférer les imports en `@/` quand cela est cohérent avec les conventions déjà présentes dans le projet.
- Ne pas réécrire gratuitement des imports déjà cohérents ou plus lisibles localement.

## Politique de nettoyage

Tout nettoyage doit être justifié par l’état actuel du code.

Chaque constat doit être classé explicitement comme :

- réellement mort
- utilisé seulement par les tests
- optionnel
- faux problème
- à garder

Ne proposer une suppression que si elle est solidement vérifiée.

Procéder par petits lots cohérents, par exemple :

- fichiers morts
- exports morts
- exports utilisés seulement par les tests
- helpers ou guards orphelins
- sélecteurs CSS morts

S’il n’y a rien de solide à supprimer, il faut le dire clairement.

## Zones considérées comme closes

Les lots structurels suivants sont considérés comme fermés, sauf preuve contraire dans l’état courant du projet :

- QuotesPanel
- RpgTablesView
- AdminPanel
- RpgTableForm
- AuthForms
- UpsertRpgTableView
- lot structurel polls
- `App.tsx` ne doit pas être rouvert sans raison sérieuse et vérifiée

## Style des modifications

- Toujours préférer le plus petit changement correct.
- Ne pas mélanger des sujets non liés dans un même lot.
- Garder des patches faciles à relire et à valider.
- Préserver le comportement existant sauf si le changement corrige explicitement un bug réel et vérifié.
- Pour le nettoyage, préférer la dépublication d’un export avant la suppression, si le symbole reste utilisé en interne.
- Pour le CSS, ne supprimer que des sélecteurs réellement non utilisés dans l’état courant.

## Validation

Avant de considérer un lot comme terminé :

- revalider le diagnostic sur l’état courant du dépôt
- exécuter les contrôles pertinents
- confirmer que le constat reste vrai après modification

## Attentes de communication et de revue

Quand un changement est proposé :

- donner les fichiers exacts
- justifier chaque suppression
- distinguer clairement les constats solides des points optionnels
- ne pas proposer de patch prématuré
- si la meilleure décision est de ne rien changer, le dire clairement

## Discipline de travail

- Ne pas rouvrir un gros bloc fermé sans raison sérieuse.
- Ne pas lancer de chantier cosmétique.
- Ne pas “améliorer” pour le principe.
- Ne pas créer de complexité pour éviter une duplication mineure si cette duplication reste claire et stable.
- Toujours privilégier un état final propre, maintenable et compréhensible plutôt qu’un code artificiellement sophistiqué.

## Objectif général

Chaque intervention doit chercher à produire un code :

- plus propre
- plus lisible
- plus cohérent
- plus robuste

sans dégrader la simplicité du projet, sans refonte gratuite, et sans sortir du périmètre réellement justifié par l’état courant du dépôt.
