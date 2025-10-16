Usage guide: frontend integration with Pixel-War backend

This file explains how frontend developers should connect to and use the backend services in this repository.

Overview
--------
This backend exposes a small, socket-first API designed for real-time frontends. Key points:

- Transports and protocol
  - Primary transport: socket.io (websockets). The code uses `express-x` on top of socket.io to provide simple RPC-style services.
  - HTTP: a minimal health endpoint exists at `GET /health` for monitoring. The main API is socket-based.

- Services and contracts
  - `User` service
    - authenticate(): Creates/authenticates a new user and returns { id: string }.
    - getNextPlaceTime(userId): Returns an epoch timestamp in milliseconds (number) or null when the user can place immediately.

  - `Canva` service
    - placePixel(userId, x, y, colorId): Attempts to place a pixel.
  - Success response (transport payload): { pixel: { x: number, y: number, color: number, placedAt: number }, nextTimestamp: number }
  - Cooldown behavior: when a user is on cooldown the server signals this as a transport-level error (HTTP 429 / TooManyRequestsError). The error response includes `nextTimestamp` (epoch ms number) which indicates when the user can next place a pixel.
  - getPixels(since?): Returns an array of pixel objects ordered by placedAt ascending. When `since` (epoch ms number or valid date string) is provided, only changes with placedAt >= since are returned. Pixel shape: { x: number, y: number, color: number, placedAt: number }.

- Events
  - The server publishes `placePixel` events to subscribed clients. The published payload is the pixel object itself: { x, y, color, placedAt } (not wrapped in a success envelope). Use these events to update the UI in real-time.

- Timestamps and formats
  - All timestamps are epoch milliseconds (numbers). Convert to Date client-side with `new Date(ms)`.

- Concurrency & atomicity
  - Pixel placement and the user's next placement time are updated inside a single database transaction to avoid race conditions. This ensures at-most-one placement per user per cooldown window even under concurrent requests.


Connecting from the frontend
----------------------------
This repo uses socket.io + an `express-x` client. Example minimal connection:

```js
import { io } from 'socket.io-client';
import expressXClient from '@jcbuisson/express-x-client';

const socket = io('http://localhost:8000', { transports: ['websocket'] });
const app = expressXClient(socket);

// Listen to published events (the server publishes placePixel updates).
// The published payload is the pixel object itself: { x, y, color, placedAt }
app.service('Canva').on('placePixel', (payload) => {
  const p = payload && payload.pixel ? payload.pixel : payload;
  // render p.x, p.y, p.color, p.placedAt
});
```

Common usage patterns
---------------------
Authenticate once (client should store userId in localStorage):

```js
const { id: userId } = await app.service('User').authenticate();
localStorage.setItem('userId', userId);
```

Place a pixel:
```js
async function placePixel(x, y, colorId) {
  const userId = localStorage.getItem('userId');
  if (!userId) throw new Error('User not authenticated');
  try {
    const resp = await app.service('Canva').placePixel(userId, x, y, colorId);
    // success: { pixel, nextTimestamp }
    return resp;
  } catch (err) {
    // cooldown is signaled as a 429 TooManyRequestsError with `nextTimestamp` in the error body
    if (err && (err.status === 429 || err.name === 'TooManyRequestsError')) {
      const nt = err.nextTimestamp || (await app.service('User').getNextPlaceTime(userId));
      // wait until nt and retry, or inform the user of the cooldown
    }
    // rethrow other errors
    throw err;
  }
}
```
Handling errors
---------------
The server uses typed errors and a central error handler:
- `ValidationError` -> status 400
- `NotFoundError` -> status 404
- `TooManyRequestsError` -> status 429 and includes `nextTimestamp` to indicate when the user can place again
- Other errors -> status 500

Local development & tests
-------------------------
Start the backend server:

```bash
cd backend
node app.js
```

Run the integration test harness (simulates two users and validates expected behavior):

```bash
cd backend
node test.js
```
