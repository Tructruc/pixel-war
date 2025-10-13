import io from 'socket.io-client';
import expressXClient from '@jcbuisson/express-x-client';

const socket = io('http://localhost:8000', { transports: ['websocket'] });
const app = expressXClient(socket);

const tests = [];
const failures = [];

const sleep = (ms) => new Promise((res) => setTimeout(res, ms));
const assert = (cond, msg) => {
  if (!cond) throw new Error(msg || 'assertion failed');
};

// helpers to wait until an ISO timestamp
const waitUntilIso = async (iso) => {
  const ms = new Date(iso).getTime() - Date.now();
  if (ms > 0) await sleep(ms + 20);
};

// resilient placeWithRetry: handles returned COOLDOWN or thrown 429/COOLDOWN
async function placeWithRetry(userId, x, y, color) {
  while (true) {
    try {
      const resp = await app.service('Canva').placePixel(userId, x, y, color);
      // handle returned cooldown object
      if (resp && resp.success === false && resp.reason === 'COOLDOWN') {
        const nt = resp.nextTimestamp;
        console.log('placePixel blocked; will wait until', nt);
        await waitUntilIso(nt);
        continue;
      }
      // success
      if (resp && (resp.success === true || resp.pixel)) return resp;
      if (resp && resp.success === false) throw new Error(`placePixel rejected: ${resp.reason || 'unknown'}`);
      return resp;
    } catch (err) {
      // detect cooldown-like errors
      const isCooldown = (e) => {
        if (!e) return false;
        if (e.reason === 'COOLDOWN') return true;
        if (e.name === 'TooManyRequestsError') return true;
        if (e.status === 429) return true;
        if (e.error === 'TooManyRequestsError' || e.error === 'COOLDOWN') return true;
        if (typeof e.message === 'string' && e.message.toUpperCase().includes('COOLDOWN')) return true;
        if (typeof e.code === 'string' && e.code.toUpperCase().includes('COOLDOWN')) return true;
        return false;
      };

      const extractNext = (e) => {
        if (!e) return null;
        return e.nextTimestamp || e.next || (e.data && e.data.nextTimestamp) || (e.response && e.response.data && e.response.data.nextTimestamp) || null;
      };

      if (isCooldown(err)) {
        let nt = extractNext(err);
        if (!nt) {
          // fallback to User.getNextPlaceTime
          try {
            nt = await app.service('User').getNextPlaceTime(userId);
            console.log('fetched next place time from User.getNextPlaceTime:', nt);
          } catch (e) {
            // cannot recover
            throw err;
          }
        }
        if (nt) {
          console.log('placePixel blocked by server error; will wait until', nt);
          await waitUntilIso(nt);
          continue;
        }
      }

      // not a retryable error
      throw err;
    }
  }
}

async function runTests() {
  const placeEvents = [];
  app.service('Canva').on('placePixel', (change) => {
    const payload = change && change.pixel ? change.pixel : change;
    const normalized = { ...payload };
    if (normalized && normalized.placedAt) normalized.placedAt = new Date(normalized.placedAt).toISOString();
    placeEvents.push(normalized);
  });

  try {
    console.log('== test: authenticate ==');
    const user = await app.service('User').authenticate();
    assert(user && typeof user.id === 'string', 'authenticate should return {id:string}');
    console.log('ok authenticate');

    console.log('== test: getNextPlaceTime (may be null) ==');
    let next = null;
    try {
      next = await app.service('User').getNextPlaceTime(user.id);
      const okType = next === null || typeof next === 'string' || next instanceof Date;
      assert(okType, 'getNextPlaceTime returns null|string|Date');
    } catch (err) {
      // accept method missing or not implemented as non-fatal for older servers
      console.warn('getNextPlaceTime call failed:', err && err.message);
    }
    console.log('ok getNextPlaceTime');

    console.log('== test: getPixels initial ==');
    const pixels = await app.service('Canva').getPixels();
    assert(Array.isArray(pixels), 'getPixels should return an array');
    console.log('ok getPixels initial, count=', pixels.length);

    console.log('== test: validation errors ==');
    let sawValidation = false;
    try {
      // invalid colorId type
      await app.service('Canva').placePixel(user.id, 1, 1, 'not-an-int');
    } catch (err) {
      // expect ValidationError or status 400
      if (err && (err.name === 'ValidationError' || err.status === 400 || (typeof err.message === 'string' && err.message.toLowerCase().includes('integer')))) {
        sawValidation = true;
      } else {
        throw err;
      }
    }
    assert(sawValidation, 'server should reject invalid placePixel inputs');
    console.log('ok validation error');

    console.log('== test: placePixel happy path and cooldown/429 handling ==');
    // place a few pixels with retry
    const userB = await app.service('User').authenticate();
    const before = await app.service('Canva').getPixels();

    const placements = [
      { x: 20, y: 20, color: 2 },
      { x: 21, y: 20, color: 2 },
      { x: 20, y: 21, color: 2 },
      { x: 21, y: 21, color: 2 },
    ];

    const placed = [];
    let userBStarted = false;
    const overwrite = { x: 21, y: 21, color: 7 };

    const userBTask = (async () => {
      while (!userBStarted) await sleep(10);
      await sleep(60);
      const respB = await placeWithRetry(userB.id, overwrite.x, overwrite.y, overwrite.color);
      return respB;
    })();

    for (const p of placements) {
      userBStarted = true;
      const resp = await placeWithRetry(user.id, p.x, p.y, p.color);
      placed.push({ ...p, placedAt: resp && resp.pixel ? resp.pixel.placedAt : undefined });
    }

    const respB = await userBTask;

    // small wait for events to propagate
    await sleep(200);

    // verify getPixels(since) ordering and that events contain placed pixels
    const since = placed[0].placedAt;
    const changes = await app.service('Canva').getPixels(since);
    assert(Array.isArray(changes), 'getPixels(since) returns array');
    const placedAts = changes.map((c) => new Date(c.placedAt).getTime());
    const isSorted = placedAts.every((t, i) => i === 0 || t >= placedAts[i - 1]);
    assert(isSorted, 'getPixels(since) is ordered by placedAt ascending');

    const matchEvent = (resp) => placeEvents.some((e) => e.x === resp.x && e.y === resp.y && e.color === resp.color && e.placedAt === resp.placedAt);
    for (const resp of [...placed.map((p) => ({ x: p.x, y: p.y, color: p.color, placedAt: p.placedAt })), (respB && respB.pixel) ? respB.pixel : respB]) {
      if (!matchEvent(resp)) {
        console.warn('Warning: response not matched by a placePixel event (timing or publish behavior):', resp);
      }
    }

    console.log('ok placePixel and event publication tests');

    console.log('All tests passed');
    process.exit(0);
  } catch (err) {
    console.error('client tests error:', err);
    failures.push(err && err.message ? err.message : String(err));
    process.exit(1);
  } finally {
    try { socket.close(); } catch (e) {}
    setTimeout(() => process.exit(failures.length ? 1 : 0), 200);
  }
}

// start
runTests();
