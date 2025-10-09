import io from 'socket.io-client'
import expressXClient from '@jcbuisson/express-x-client'

const socket = io('http://localhost:8000', { transports: ["websocket"] })

const app = expressXClient(socket)


app.service('User').on('authenticate', (user) => {
   console.log('User authenticated', user)
})

app.service('Canva').on('getPixels', (changes) => {
   console.log('getPixels event', changes)
})

app.service('Canva').on('placePixel', (change) => {
   console.log('placePixel event', change)
})

app.service('User').on('getNextPlaceTime', (nextTime) => {
   console.log('getNextPlaceTime event', nextTime)
})


async function main() {
   // tiny test helpers
   const sleep = (ms) => new Promise((res) => setTimeout(res, ms))
   const assert = (cond, msg) => {
      if (!cond) console.error('ASSERT FAILED:', msg)
      else console.log('assert ok:', msg)
   }

   try {
      console.log('\n== Running client tests ==')

      // 1) authenticate
      const user = await app.service('User').authenticate()
      console.log('Authenticated user:', user)
      assert(user && typeof user.id === 'string', 'User.authenticate returns {id: string}')

      // 2) getNextPlaceTime (may be null initially)
      let next = null
      try {
         next = await app.service('User').getNextPlaceTime(user.id)
         console.log('getNextPlaceTime:', next)
         const okType = next === null || typeof next === 'string' || next instanceof Date
         assert(okType, 'User.getNextPlaceTime returns null|string|Date')
      } catch (err) {
         console.warn('getNextPlaceTime failed (maybe unsupported):', err.message)
      }

      // 3) getPixels (initial)
      const pixels = await app.service('Canva').getPixels()
      console.log('Initial pixels length:', Array.isArray(pixels) ? pixels.length : 'unknown')
      assert(Array.isArray(pixels), 'Canva.getPixels returns an array')

      // 4) place multiple pixels
      const placements = [
         { x: 0, y: 0, color: 1 },
         { x: 1, y: 0, color: 2 },
         { x: 2, y: 1, color: 3 },
      ]
      const placeResponses = []
      let lastPlaceResp = null
      for (const p of placements) {
         try {
            const resp = await app.service('Canva').placePixel(user.id, p.x, p.y, p.color)
            console.log('placePixel', p, '=>', resp)
            placeResponses.push({ success: true, resp, pos: p })
            // server now returns { nextTimestamp, ts }
            lastPlaceResp = resp
            assert(resp !== undefined && resp !== null, 'Canva.placePixel returns a next-timestamp object')

            // If server returned a nextTimestamp, wait until that time before next placement
            try {
               const nt = resp.nextTimestamp || resp
               const tsMs = new Date(nt).getTime()
               if (!Number.isNaN(tsMs)) {
                  const now = Date.now()
                  const wait = tsMs - now
                  if (wait > 0) {
                     console.log(`Waiting ${wait}ms until next allowed placement...`)
                     // add small safety margin
                     await sleep(wait + 20)
                  }
               }
            } catch (e) {
               // ignore parsing/wait errors and continue
            }
         } catch (err) {
            console.warn('placePixel failed for', p, ':', err && (err.message || err))
            placeResponses.push({ success: false, err, pos: p })
            assert(err && (err.message || err.code), 'placePixel threw an error object')
            // if failed due to cooldown, we can attempt to parse returned timestamp and wait
            try {
               const maybeTs = err && err.message ? new Date(err.message).getTime() : NaN
               if (!Number.isNaN(maybeTs)) {
                  const wait = maybeTs - Date.now()
                  if (wait > 0) await sleep(wait + 20)
               }
            } catch (ignore) {}
         }
      }

   // 5) getPixels since the last changes
   // Determine since: prefer the pixel change timestamp returned by placePixel (resp.placedAt)
   const since = lastPlaceResp && lastPlaceResp.placedAt ? lastPlaceResp.placedAt : (lastPlaceResp && (typeof lastPlaceResp === 'string' || lastPlaceResp instanceof Date) ? lastPlaceResp : new Date().toISOString())
      // small delay to allow server to emit/persist change
      await sleep(200)
      try {
         const changes = await app.service('Canva').getPixels(since)
         console.log('getPixels(since) =>', changes)
         assert(Array.isArray(changes), 'Canva.getPixels(since) returns an array')
      } catch (err) {
         console.warn('getPixels(since) failed:', err && err.message)
      }

      // 6) placing again to check cooldown behavior (should return a timestamp in future)
      try {
         const { x: cx, y: cy, color: ccolor } = placements[0]
         const secondResp = await app.service('Canva').placePixel(user.id, cx, cy, ccolor)
         console.log('second placePixel response:', secondResp)
         try {
            const t1s = (lastPlaceResp && (lastPlaceResp.nextTimestamp || lastPlaceResp.nextTimestamp === 0)) ? lastPlaceResp.nextTimestamp : (lastPlaceResp && lastPlaceResp.nextTimestamp === undefined ? undefined : lastPlaceResp)
            const t2s = (secondResp && (secondResp.nextTimestamp || secondResp.nextTimestamp === 0)) ? secondResp.nextTimestamp : secondResp
            const t1 = new Date(t1s)
            const t2 = new Date(t2s)
            if (!Number.isNaN(t1.getTime()) && !Number.isNaN(t2.getTime())) {
               assert(t2.getTime() >= t1.getTime(), 'second placePixel next-timestamp is >= first')
            }
         } catch (e) {
            console.warn('Could not compare timestamps:', e.message)
         }
      } catch (err) {
         console.warn('second placePixel failed (cooldown or server error):', err && err.message)
      }

      console.log('== client tests finished ==\n')
   } catch (err) {
      console.error('client tests error:', err)
   } finally {
      // ensure socket is closed and exit so the script doesn't hang
      try { socket.close() } catch (e) {}
      // give a moment for socket close events to flush
      setTimeout(() => process.exit(0), 200)
   }
   // no-op: exit handled in finally
}
main()