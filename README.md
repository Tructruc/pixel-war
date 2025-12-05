# Pixel War

**Une toile de pixel art collaborative en temps réel.**

Inspiré par l’expérience sociale *r/place*, Pixel War permet aux utilisateurs de placer des pixels sur une toile numérique partagée, de créer des modèles pour guider leurs créations et de voir l’œuvre évoluer en direct avec les autres participants.

### [Démo en ligne](https://pixel-war.emilien-fieu.fr/)

## Aperçu
[![Pixel War Demo](https://img.youtube.com/vi/iUljuZ8Nh5E/0.jpg)](https://youtu.be/iUljuZ8Nh5E)  
*(Cliquez sur l’image pour regarder la vidéo de démonstration)*

## ✨ Fonctionnalités
* **Collaboration en temps réel :** La toile se met à jour instantanément lorsque les utilisateurs ajoutent des pixels.
* **Système de modèles :** Créez et utilisez des modèles pour coordonner des dessins complexes.
* **Toile partagée :** Un monde persistant où chaque pixel compte.

## Fonctionnalités

- **Toile en temps réel** : Voyez les mises à jour apparaître instantanément lorsque d'autres utilisateurs placent des pixels.
- **Système de modèles** : Créez, enregistrez et partagez des modèles de pixel art pour coordonner vos efforts.
- **Mécanismes de cooldown** : Placement stratégique des pixels avec temps de recharge.
- **Design responsive** : Fonctionne sur ordinateur et, tant bien que mal, sur mobile.

## Stack Technique

- **Frontend** : Vue 3, Vite, Socket.io Client
- **Backend** : Node.js, ExpressX, Prisma, SQLite, Socket.io

## Démarrage rapide

### Prérequis

- Node.js (v14+)
- npm

### Installation

1. **Cloner le dépôt**
    ```bash
    git clone <repository-url>
    cd pixel-war
    ```

2. **Configurer le backend**
    ```bash
    cd backend
    npm install
    npx prisma db push  # Initialise la base SQLite
    npm run dev         # Lance le serveur sur le port 8000
    ```

3. **Configurer le frontend** (dans un nouveau terminal)
    ```bash
    cd frontend
    npm install
    npm run dev         # Lance le client
    ```

4. **Ouvrir l'application**
    Rendez-vous à l’URL affichée dans le terminal du frontend (généralement `http://localhost:5173`).
