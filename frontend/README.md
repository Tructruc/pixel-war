# Pixel War Frontend

L’application frontend de Pixel War, construite avec Vue 3 et Vite.

## Installation

1. **Installer les dépendances**
    ```bash
    npm install
    ```

2. **Lancer le serveur de développement**
    ```bash
    npm run dev
    ```
    L’application sera disponible sur `http://localhost:5173`.

## Architecture

### Composants principaux

- **`canvas.vue`** : Le composant principal qui rend la grille de pixels. Gère le zoom, le déplacement (panning) et le placement des pixels. Optimisé avec un culling par viewport et `requestAnimationFrame`.
- **`TemplateCreator.vue`** : Une interface modale permettant de créer et d’enregistrer des modèles de pixel art 20x20.
- **`Controls.vue`** : L’overlay principal contenant le sélecteur de couleurs, le sélecteur de modèles et d’autres outils.
- **`ShapeSelector.vue`** : Permet aux utilisateurs de choisir parmi les modèles disponibles pour les placer sur la toile.

### Gestion d’état

- **`useAppState.js`** : Gère l’état global de l’application (ID utilisateur, cooldowns, sélection en cours).
- **`useTemplates.js`** : Gère la récupération, la création et la suppression de modèles, avec synchronisation en temps réel.

## Fonctionnalités

- **Toile interactive** : Une toile infinie, zoomable et déplaçable.
- **Système de modèles** : Dessinez et enregistrez vos propres modèles.
- **Mises à jour en temps réel** : Intégration Socket.io pour des mises à jour instantanées.
- **Interface responsive** : Optimisée pour les ordinateurs et les appareils tactiles.

## Scripts

- `npm run dev` : Lance le serveur de développement.
- `npm run build` : Build pour la production.
- `npm run preview` : Prévisualise le build de production.
- `npm run lint` : Analyse le code avec ESLint.
- `npm run format` : Formate le code avec Prettier.
