# Plan — App d'inventaire PWA (FR)

## Objectif
Application web installable (PWA) en français pour faire le contrôle manuel d'inventaire bar/resto/piscine : importer un CSV, compter, comparer, générer un rapport.

## Stack & infrastructure
- TanStack Start (déjà en place) + Tailwind + shadcn/ui
- **Lovable Cloud activé** (base partagée pour qu'un utilisateur soumette le fichier et qu'un autre continue le comptage)
- Pas d'authentification — accès libre, on saisit un nom d'opérateur par inventaire
- Manifest PWA simple (icône générée) pour installation iOS/Android/Desktop — pas de service worker complexe (évite les problèmes en preview)

## Modèle de données (Lovable Cloud)
Table `inventories` :
- `id`, `created_at`, `updated_at`
- `name` (ex: "Inventaire 12 mai")
- `created_by` (texte libre, opérateur qui importe)
- `counted_by` (texte libre, opérateur qui compte)
- `status` : `en_cours` | `complet`
- `completed_at`

Table `inventory_items` :
- `id`, `inventory_id` (FK)
- `product_name`
- `category`
- `system_qty` (numeric — depuis colonne « In stock »)
- `counted_qty` (numeric, nullable tant que non compté)

RLS : politiques permissives (pas d'auth) — lecture/écriture publique sur ces deux tables.

## Parsing CSV
- Librairie : `papaparse`
- Détection automatique de la colonne contenant « In stock » (insensible à la casse, peut varier)
- Colonne catégorie : `category`
- **Filtre catégories acceptées** : `Boissons alcooliques`, `Boissons gazeuses`, `Lait`, `Fruit` (comparaison insensible casse/accents)
- Colonne nom : `Name`

## Routes / écrans

1. **`/` — Accueil**
   - Liste des inventaires (en cours + complets) avec statut, date, opérateurs
   - Bouton « Nouvel inventaire » → `/import`
   - Clic sur un inventaire en cours → `/inventaire/$id/compter`
   - Clic sur un inventaire complet → `/inventaire/$id/rapport`

2. **`/import` — Création**
   - Champ « Nom de l'opérateur »
   - Champ « Nom de l'inventaire » (préfilled avec date)
   - Upload CSV → preview du nombre de produits filtrés
   - Bouton « Créer l'inventaire » → enregistre en base avec `status=en_cours`, redirige vers `/inventaire/$id/compter`

3. **`/inventaire/$id/compter` — Comptage**
   - Champ « Nom de l'opérateur de comptage » (en haut)
   - Liste mobile-friendly de toutes les lignes :
     - Nom produit (gros texte)
     - Input numérique « Quantité comptée » (clavier numérique sur mobile)
     - Badge visuel temps réel (Conforme/Manquant/Surplus) une fois saisi
   - Barre de progression (X/Y comptés)
   - Sauvegarde auto à chaque saisie (debounced) — permet la reprise par une autre personne
   - Bouton « Enregistrer et terminer » (actif uniquement si toutes les quantités saisies) → marque `status=complet`, redirige vers rapport

4. **`/inventaire/$id/rapport` — Rapport final**
   - **Résumé** (cards) : Total produits, Conformes, Manquants, Surplus, Total écart (somme |diff|)
   - **Tableau détaillé** (style sombre comme l'annexe) :
     | Produit | Système | Compté | Différence | Statut |
   - Filtres rapides : Tous / Manquants / Surplus / Conformes
   - Bouton « Exporter CSV » du rapport

## Règles de calcul
- `diff = counted - system`
- `diff == 0` → **Conforme**
- `diff < 0` → **Manquant** (affiché `-N`)
- `diff > 0` → **Surplus** (affiché `+N`)
- « Valeur totale des écarts » = somme des `|diff|` (en unités, pas en monétaire — pas de prix demandé)

## PWA
- `public/manifest.webmanifest` avec `display: standalone`, nom « Inventaire »
- Icônes 192×192 et 512×512 générées (image simple)
- Lien manifest + meta theme-color dans `__root.tsx`
- **Pas de service worker** (recommandation Lovable pour éviter conflits preview)

## Détails techniques
- Server functions (`createServerFn`) pour : create inventory, list inventories, get inventory, update item count, complete inventory
- Client Supabase admin côté serveur (pas d'auth utilisateur)
- Toasts (`sonner`) pour feedback (sauvegarde, erreurs CSV)
- Design : thème sombre par défaut (cohérent avec l'annexe), tokens sémantiques dans `styles.css`

## Livraison
À la fin, l'utilisateur peut :
1. Importer un CSV depuis n'importe quel appareil
2. Reprendre un inventaire en cours depuis un autre appareil
3. Voir le rapport final avec tableau identique à l'annexe
4. Installer l'app sur son téléphone/tablette
