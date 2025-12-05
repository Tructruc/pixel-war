# Pixel War Backend

Le service backend de Pixel War, construit avec Node.js, ExpressX et Prisma.

## Installation

1. **Installer les dépendances**
    ```bash
    npm install
    ```

2. **Configurer la base de données**  
    Initialiser la base SQLite :
    ```bash
    npx prisma db push
    ```

3. **Lancer le serveur**
    ```bash
    npm run dev
    ```
    Le serveur démarrera sur `http://localhost:8000`.

## Configuration

Vous pouvez configurer le serveur via des variables d’environnement :

| Variable | Valeur par défaut | Description |
| :--- | :--- | :--- |
| `PORT` | `8000` | Port du serveur |
| `PIXEL_COOLDOWN_MS` | `5000` | Cooldown entre deux placements de pixels (ms) |
| `MAX_X` | `1023` | Largeur de la toile - 1 |
| `MAX_Y` | `1023` | Hauteur de la toile - 1 |
| `MAX_COLOR` | `15` | ID maximum de couleur (indexé à partir de 0) |

## Services API

Le backend utilise `express-x` pour exposer des services via REST et Socket.io.

### Service Utilisateur
- **`authenticate()`** : Crée une nouvelle session utilisateur.
- **`getNextPlaceTime(userId)`** : Renvoie le timestamp auquel l’utilisateur pourra placer son prochain pixel.

### Service Canvas
- **`placePixel(userId, x, y, colorId)`** : Place un pixel sur la toile. Applique les cooldowns.
- **`getPixels(since?)`** : Récupère tous les pixels. Si `since` est fourni, renvoie uniquement les pixels placés après ce timestamp.

### Service Template
- **`find()`** : Récupère tous les modèles disponibles.
- **`create(userId, name, pixels)`** : Crée un nouveau modèle.
- **`remove(userId, name)`** : Supprime un modèle (réservé au créateur).

## Événements en temps réel

Le serveur diffuse les mises à jour sur le canal `anonymous`.  
Les clients doivent rejoindre ce canal pour recevoir les mises à jour en temps réel concernant les placements de pixels et les modifications de modèles.
