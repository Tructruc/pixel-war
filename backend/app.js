import { expressX } from '@jcbuisson/express-x';
import { PrismaClient } from '@prisma/client';
import { ValidationError, NotFoundError, TooManyRequestsError } from './errors.js';

const app = expressX();
const prisma = new PrismaClient();

const PIXEL_COOLDOWN_MS = 5_000;
const MAX_X = 1023;
const MAX_Y = 1023;
const MAX_COLOR = 15;

const toEpoch = (d) => (d ? (d instanceof Date ? d.getTime() : Number(d)) : null);
 

// User service methods
const userMethods = {
  /**
   * Create/authenticate a user and return its id.
   * @returns {{id: string}}
   */
  authenticate: async () => {
    const newUser = await prisma.user.create({ data: {} });
    return { id: newUser.id };
  },

  /** Return the next allowed placement time for a user. */
  getNextPlaceTime: async (userId) => {
    if (!userId) throw new ValidationError('userId is required');
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundError('user not found');
    const nextPlacementAt = user.nextPlacementAt;
    if (!nextPlacementAt) return Date.now();
    else return nextPlacementAt.getTime();
  },
}

app.createService('User', userMethods)

// Canva (pixel) service methods
const canvaMethods = {
  /**
   * Place a pixel on the canvas.
   * @param {string} userId
   * @param {number} x
   * @param {number} y
   * @param {number} colorId
   * @returns {Date} nextAllowedPlacement
   */
  placePixel: async (userId, x, y, colorId) => {
    if (!userId) throw new ValidationError('userId is required')
    if (!Number.isInteger(x) || !Number.isInteger(y) || !Number.isInteger(colorId)) {
      throw new ValidationError('x, y and colorId must be integers');
    }
    if (x < 0 || x > MAX_X || y < 0 || y > MAX_Y) throw new ValidationError(`x and y must be between 0 and ${MAX_X}`);
    if (colorId < 0 || colorId > MAX_COLOR) throw new ValidationError(`colorId must be between 0 and ${MAX_COLOR}`);

  const now = new Date();
    const nextTimestamp = new Date(Date.now() + PIXEL_COOLDOWN_MS);

    const pixel = await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({ where: { id: userId } });
      if (!user) throw new NotFoundError('user not found');

      if (user.nextPlacementAt && now < user.nextPlacementAt) {
        // blocked by cooldown — throw a typed error with the next allowed timestamp
        throw new TooManyRequestsError('COOLDOWN', user.nextPlacementAt);
      }

      const p = await tx.canva.upsert({
        where: { x_y: { x, y } },
        create: { x, y, color: colorId, placedAt: now },
        update: { color: colorId, placedAt: now },
      });

      await tx.user.update({ where: { id: userId }, data: { nextPlacementAt: nextTimestamp } });

      return p;
    });

    return {
      pixel: { x: pixel.x, y: pixel.y, color: pixel.color, placedAt: toEpoch(pixel.placedAt) },
      nextTimestamp: toEpoch(nextTimestamp),
    };
  },

  /** Get pixels; if `since` provided, return only changes after that time. */
  getPixels: async (since) => {
    if (!since) {
      const rows = await prisma.canva.findMany({ orderBy: { placedAt: 'asc' } });
      return rows.map((r) => ({ x: r.x, y: r.y, color: r.color, placedAt: r.placedAt.getTime() }));
    }

    const sinceDate = new Date(since);
    if (Number.isNaN(sinceDate.getTime())) throw new Error('invalid since timestamp');

    const rows = await prisma.canva.findMany({ where: { placedAt: { gte: sinceDate } }, orderBy: { placedAt: 'asc' } });
    return rows.map((r) => ({ x: r.x, y: r.y, color: r.color, placedAt: r.placedAt.getTime() }));
  }
}

app.createService('Canva', canvaMethods)


app.service('User').publish(async () => ['anonymous'])
app.service('Canva').publish(async () => ['anonymous'])

app.addConnectListener((socket) => app.joinChannel('anonymous', socket))

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// central error handler (safer)
app.use((err, req, res, next) => {
  if (res.headersSent) {
    // delegate to default Express handler if headers already sent
    return next(err);
  }

  // Prefer explicit status on typed errors; fallback to 500
  const status = (err && err.status) || 500;
  const name = (err && err.name) || 'Error';
  const message = (err && err.message) || 'Internal server error';

  // Server-side logging: include stack/traces for ops, but not for clients
  console.error(`[error] ${req.method} ${req.originalUrl} -> ${status} ${name}: ${message}`);
  if (err && err.stack) console.error(err.stack);

  const body = { error: name, message };

  // include domain metadata (cooldown) if available; always format timestamp
  if (err && err.nextTimestamp) body.nextTimestamp = toIso(err.nextTimestamp);

  // in production, avoid exposing internal error details (optionally tighten message)
  if (process.env.NODE_ENV === 'production') {
    // replace message for 500-level errors to avoid leaking internals
    if (status >= 500 && name === 'Error') {
      body.message = 'Internal server error';
    }
  }

  res.status(status).json(body);
});

const server = app.httpServer.listen(8000, () => console.log(`App listening at http://localhost:8000`));

const shutdown = async (signal) => {
  console.log(`Received ${signal}, shutting down...`)
  try {
    server.close(() => console.log('HTTP server closed'));
  } catch (e) {
    console.error('Error closing server', e);
  }
  try {
    await prisma.$disconnect();
    console.log('Prisma disconnected');
  } catch (e) {
    console.error('Error disconnecting Prisma', e);
  }
  process.exit(0)
}

process.on('SIGINT', () => shutdown('SIGINT'))
process.on('SIGTERM', () => shutdown('SIGTERM'))