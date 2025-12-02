# Pixel War Frontend

The frontend application for Pixel War, built with Vue 3 and Vite.

## Setup

1.  **Install Dependencies**
    ```bash
    npm install
    ```

2.  **Run Development Server**
    ```bash
    npm run dev
    ```
    The application will be available at `http://localhost:5173`.

## Architecture

### Key Components

- **`canvas.vue`**: The core component that renders the pixel grid. Handles zooming, panning, and pixel placement. Optimized with viewport culling and `requestAnimationFrame`.
- **`TemplateCreator.vue`**: A modal interface for designing and saving 20x20 pixel art templates.
- **`Controls.vue`**: The main UI overlay containing the color selector, template selector, and other tools.
- **`ShapeSelector.vue`**: Allows users to pick from available templates to place on the canvas.

### State Management

- **`useAppState.js`**: Manages global application state (user ID, cooldowns, current selection).
- **`useTemplates.js`**: Handles fetching, creating, and deleting templates, including real-time synchronization.

## Features

- **Interactive Canvas**: Zoomable and pannable infinite canvas.
- **Template System**: Draw and save your own templates.
- **Real-time Updates**: Socket.io integration for instant updates.
- **Responsive UI**: Optimized for both desktop and touch devices.

## Scripts

- `npm run dev`: Start development server.
- `npm run build`: Build for production.
- `npm run preview`: Preview production build.
- `npm run lint`: Lint code with ESLint.
- `npm run format`: Format code with Prettier.
