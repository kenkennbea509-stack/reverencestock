# Inventaire Facile

Objectif

Créer une petite application web PWA en français pour faciliter le contrôle manuel d’inventaire du bar/resto/piscine.

L’application doit permettre :

d’importer un rapport CSV exporté du système actuel ;

de demander à l’utilisateur la quantité réelle comptée pour chaque produit ;

de comparer automatiquement les quantités du système avec les quantités comptées ;

de générer un rapport final clair montrant :

les produits conformes ;

les produits manquants ;

les surplus ;

les écarts.

L’application doit fonctionner comme une PWA afin de pouvoir être installée sur téléphone, tablette et ordinateur.

Fonctionnement principal

1. Importation du fichier CSV

L’utilisateur importe un fichier CSV exporté du système.

Colonnes importantes du CSV :

Name

In stock (Essa coluna pode ter alteracao no nome mas sempre tera a palavra In stock no nome)


Le système doit automatiquement :

lire le fichier ;

extraire les produits ;
Considerer seulement les produit dont la categorie est l un des suivant: Boissons alcooliques, Boissons gazeuses, Lait, Fruit

afficher la liste des produits ;

récupérer la quantité théorique actuelle.
Écran de comptage

Afficher une liste simple et rapide, la liste doit etre user friendly 

Chaque ligne doit contenir :

Nom du produit



Champ “Quantité comptée” (Obligatoire)
apres avoire compter tout les produits il faut enregistrer l inventaire 

Calcul automatique

Règles :

Si quantité comptée = quantité système → Conforme

Si quantité comptée < quantité système → Manquant

Si quantité comptée > quantité système → Surplus

Génération du rapport final

À la fin du comptage, générer un rapport clair.

Résumé général

Nombre total de produits

Nombre conformes

Nombre avec manque

Nombre avec surplus

Valeur totale des écarts

Aficher le tableau comme en annexe 

Important

L’objectif principal est la simplicité et la rapidité.

Le personnel doit pouvoir :

importer le fichier ;

compter ;

entrer les quantités ;

obtenir automatiquement les écarts.

Le système doit être très simple à utiliser même pour quelqu’un qui n’est pas technique.

Important une personne peux soummetre le fichier e une autre peux continuer l inventaire une invantaire no terminer reste avec le status en cours e lorsque completer il marque complet.  mettre n importe image pour l icone du pwa

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://reverencestock.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/75fb47ef-3e2c-4d75-aee7-e9521b1358d5).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
