# Pixel War

A real-time collaborative pixel art canvas, inspired by r/place. Users can place pixels on a shared canvas, create templates, and watch the artwork evolve in real-time.

## Features

- **Real-time Canvas**: See pixel updates instantly as other users place them.
- **Template System**: Create, save, and share pixel art templates to coordinate efforts.
- **Cooldown Mechanics**: Strategic pixel placement with cooldown timers.
- **Responsive Design**: Works on desktop and mobile.

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