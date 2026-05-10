# Plan — Rôles Admin / Opérateur

## 1. Authentification (username + PIN)

- Connexion via **nom d'utilisateur + code PIN à 6 chiffres**.
- Implémentation : on s'appuie sur l'auth intégrée de Lovable Cloud en utilisant un email synthétique `username@reverence.local` et le PIN comme mot de passe (min 6 caractères, accepté par Supabase). L'utilisateur ne voit que « Nom d'utilisateur » et « PIN ».
- Auto-confirm activé pour les comptes (pas d'email de vérification).
- Page `/login` unique, pas de page d'inscription publique.

## 2. Modèle de données

Nouvelles tables :

- **`profiles`** : `id` (= `auth.users.id`), `username` (unique), `display_name`, `created_at`.
- **`user_roles`** : `id`, `user_id`, `role` (`admin` | `operateur`) — table séparée + enum, conformément aux bonnes pratiques (évite l'escalade de privilèges).
- Fonction SECURITY DEFINER `has_role(_user_id, _role)` pour RLS.

Trigger : à la création d'un `auth.users`, créer automatiquement la ligne `profiles`. Le rôle par défaut est `operateur`. Si l'email correspond à l'**email admin prédéfini** (stocké comme secret `ADMIN_EMAIL`), le rôle `admin` est attribué.

Tables existantes :

- `inventories` : ajout de `owner_id` (uuid, FK profiles) et `counted_by_id` (uuid, FK profiles, nullable). On garde aussi `created_by`/`counted_by` (texte) pour l'affichage.
- **Suppression de tous les inventaires existants** (choix utilisateur).

## 3. Politiques RLS (mises à jour)

- `inventories` & `inventory_items` :
  - **SELECT** : admin = tout ; opérateur = uniquement les inventaires `en_cours` (pour pouvoir compter).
  - **INSERT** : admin uniquement (créer un inventaire = importer le CSV).
  - **UPDATE** : admin = tout ; opérateur = uniquement champs liés au comptage (`counted_qty`, `counted_by`, `counted_by_id`) sur inventaires `en_cours`.
  - **DELETE** : admin uniquement.
- `profiles` : lecture par tous les connectés ; modification par l'admin uniquement.
- `user_roles` : lecture/écriture admin uniquement (via `has_role`).

## 4. Écrans / routes

### Public
- **`/login`** — connexion username + PIN.

### Opérateur (rôle `operateur`)
- **`/`** — liste **uniquement des inventaires `en_cours`** assignés ou disponibles.
- **`/inventaire/$id/compter`** — comptage (accès si statut `en_cours`).
  - **La colonne « Système » est masquée.** L'opérateur ne voit que le nom du produit et son champ « quantité comptée ».
  - Bouton « Terminer » disponible quand tout est compté.
- Pas d'accès à `/import`, `/rapport`, ni à la suppression.

### Admin (rôle `admin`)
- **`/`** — vue complète (inventaires en cours + complets, suppression, etc., comme aujourd'hui).
- **`/import`** — création d'inventaire.
- **`/inventaire/$id/rapport`** — rapport complet avec quantités système, écarts, export CSV.
- **`/admin/operateurs`** — nouvelle page :
  - Liste des opérateurs (username, nom, date création).
  - Bouton « Ajouter un opérateur » → formulaire (username, nom, PIN initial). L'admin transmet le PIN à l'opérateur.
  - Action « Réinitialiser PIN », « Supprimer ».
- Header : badge rôle + bouton « Déconnexion ».

### Garde de routes
- `/_authenticated` : redirige vers `/login` si non connecté.
- `/_authenticated/_admin` : layout supplémentaire qui vérifie le rôle admin via `has_role`, sinon redirige vers `/`.

## 5. Détails techniques

- Server functions (`createServerFn`) avec `requireSupabaseAuth` pour :
  - `createOperator` (admin only) → crée `auth.users` + profile + role via `supabaseAdmin`.
  - `resetOperatorPin`, `deleteOperator` (admin only).
  - `getMyRole` côté client pour adapter l'UI.
- Hook `useAuth()` qui expose `user`, `role`, `signIn(username, pin)`, `signOut()`.
- Sur `/inventaire/$id/compter`, on retire visuellement « Système : N » et le badge de statut quand le rôle est `operateur`. Le `system_qty` n'est même pas envoyé : la query SELECT côté opérateur n'inclura que `id, product_name, counted_qty`.
- Secret à configurer : **`ADMIN_EMAIL`** (l'email du premier admin, ex. `admin@reverence.local`). Lors du premier login, on demandera à l'admin de définir son PIN via un script de bootstrap ou via le secret `ADMIN_INITIAL_PIN`. (À confirmer par toi : on peut aussi te créer le compte admin directement avec un PIN fixe que tu changeras après.)

## 6. Migrations & nettoyage

1. Migration SQL : enum `app_role`, tables `profiles` + `user_roles`, fonction `has_role`, trigger d'auto-création de profile + rôle, ajout colonnes à `inventories`, nouvelles policies RLS.
2. Suppression des inventaires existants (`DELETE FROM inventory_items; DELETE FROM inventories;`).
3. Création du compte admin initial (via insert tool une fois le secret `ADMIN_EMAIL` fourni).
4. Mise à jour des composants : `index.tsx`, `import.tsx`, `inventaire.$id.compter.tsx`, `inventaire.$id.rapport.tsx`, `__root.tsx`, nouveau `/login`, nouveau `/admin/operateurs`.

## 7. Questions résiduelles

Avant d'implémenter, j'aurai besoin de :
- L'**email admin** à utiliser (ex. `admin@reverence.local`).
- Un **PIN initial** pour ce compte admin (6 chiffres).
