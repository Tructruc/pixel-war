# Pixel War Backend

The backend service for Pixel War, built with Node.js, ExpressX, and Prisma.

## 🛠️ Setup

1.  **Install Dependencies**
    ```bash
    npm install
    ```

2.  **Database Setup**
    Initialize the SQLite database:
    ```bash
    npx prisma db push
    ```

3.  **Run Server**
    ```bash
    npm run dev
    ```
    The server will start on `http://localhost:8000`.

## ⚙️ Configuration

You can configure the server using environment variables:

| Variable | Default | Description |
| :--- | :--- | :--- |
| `PORT` | `8000` | Server port |
| `PIXEL_COOLDOWN_MS` | `5000` | Cooldown between pixel placements (ms) |
| `MAX_X` | `1023` | Canvas width - 1 |
| `MAX_Y` | `1023` | Canvas height - 1 |
| `MAX_COLOR` | `15` | Max color ID (0-indexed) |

## 🔌 API Services

The backend uses `express-x` to expose services via REST and Socket.io.

### User Service
- **`authenticate()`**: Creates a new user session.
- **`getNextPlaceTime(userId)`**: Returns the timestamp when the user can place their next pixel.

### Canva Service
- **`placePixel(userId, x, y, colorId)`**: Places a pixel on the canvas. Enforces cooldowns.
- **`getPixels(since?)`**: Retrieves all pixels. If `since` is provided, returns only pixels placed after that timestamp.

### Template Service
- **`find()`**: Retrieves all available templates.
- **`create(userId, name, pixels)`**: Creates a new template.
- **`remove(userId, name)`**: Deletes a template (creator only).

## 📡 Real-time Events

The server broadcasts updates to the `anonymous` channel. Clients should join this channel to receive real-time updates for pixel placements and template changes.
