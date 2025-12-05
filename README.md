# Pixel War

**A real-time collaborative pixel art canvas.**

Inspired by the social experiment r/place, Pixel War allows users to place pixels on a shared digital canvas, create templates to guide their designs, and watch the artwork evolve live with other users.

### [Live Demo](https://pixel-war.emilien-fieu.fr/)

## Preview
[![Pixel War Demo](https://img.youtube.com/vi/iUljuZ8Nh5E/0.jpg)](https://youtu.be/iUljuZ8Nh5E)  
*(Click the image to watch the demo video)*

## ✨ Features
* **Real-time Collaboration:** Watch the canvas update instantly as users contribute.
* **Template System:** Create and use templates to coordinate complex artwork.
* **Shared Canvas:** A persistent world where every pixel counts.

## Features

- **Real-time Canvas**: See pixel updates instantly as other users place them.
- **Template System**: Create, save, and share pixel art templates to coordinate efforts.
- **Cooldown Mechanics**: Strategic pixel placement with cooldown timers.
- **Responsive Design**: Works on desktop and somehow mobile.

## Tech Stack

- **Frontend**: Vue 3, Vite, Socket.io Client
- **Backend**: Node.js, ExpressX, Prisma, SQLite, Socket.io

## Quick Start

### Prerequisites

- Node.js (v14+)
- npm

### Installation

1.  **Clone the repository**
    ```bash
    git clone <repository-url>
    cd pixel-war
    ```

2.  **Setup Backend**
    ```bash
    cd backend
    npm install
    npx prisma db push  # Initialize SQLite database
    npm run dev         # Starts server on port 8000
    ```

3.  **Setup Frontend** (in a new terminal)
    ```bash
    cd frontend
    npm install
    npm run dev         # Starts client
    ```

4.  **Open Application**
    Visit the URL shown in the frontend terminal (usually `http://localhost:5173`).
