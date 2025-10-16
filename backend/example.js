import io from 'socket.io-client'
import expressXClient from '@jcbuisson/express-x-client'

const socket = io('http://localhost:8000', { transports: ['websocket'] })
const app = expressXClient(socket)

app.service('User').on('authenticate', (user) => console.log('User authenticated', user))
app.service('Canva').on('getPixels', (changes) => console.log('getPixels event', changes))
app.service('Canva').on('placePixel', (change) => console.log('placePixel event', change))
app.service('User').on('getNextPlaceTime', (nextTime) => console.log('getNextPlaceTime event', nextTime))

async function main() {
  const sleep = (ms) => new Promise((res) => setTimeout(res, ms))
  const assert = (cond, msg) => {
    if (!cond) console.error('ASSERT FAILED:', msg)
    else console.log('assert ok:', msg)
  }

  try {
    console.log('\n== Running client tests ==')

    const user = await app.service('User').authenticate()
    console.log('Authenticated user:', user)
    assert(user && typeof user.id === 'string', 'User.authenticate returns {id: string}')

    let next = null
    try {
      next = await app.service('User').getNextPlaceTime(user.id)
      console.log('getNextPlaceTime:', next)
      const okType = next === null || typeof next === 'string' || next instanceof Date
      assert(okType, 'User.getNextPlaceTime returns null|string|Date')
    } catch (err) {
      console.warn('getNextPlaceTime failed (maybe unsupported):', err.message)
    }

    const pixels = await app.service('Canva').getPixels()
    console.log('Initial pixels length:', Array.isArray(pixels) ? pixels.length : 'unknown')
    assert(Array.isArray(pixels), 'Canva.getPixels returns an array')

    const waitUntilIso = async (iso) => {
      const ms = new Date(iso).getTime() - Date.now()
      if (ms > 0) await sleep(ms + 20)
    }

    const placeWithRetry = async (userId, x, y, color) => {
      while (true) {
        try {
          const resp = await app.service('Canva').placePixel(userId, x, y, color)
          if (resp && resp.success === false && resp.reason === 'COOLDOWN') {
            const nt = resp.nextTimestamp
            console.log(`placePixel blocked; will wait until ${nt}`)
            await waitUntilIso(nt)
            continue
          }
          if (resp && resp.success === true) return resp
          if (resp && resp.success === false) throw new Error(`placePixel rejected: ${resp.reason || 'unknown'}`)
          return resp
        } catch (err) {
          const isCooldownError = (e) => {
            if (!e) return false
            if (e.reason === 'COOLDOWN') return true
            if (e.name === 'TooManyRequestsError') return true
            if (e.status === 429) return true
            if (e.error === 'TooManyRequestsError' || e.error === 'COOLDOWN') return true
            if (typeof e.message === 'string' && e.message.toUpperCase().includes('COOLDOWN')) return true
            if (typeof e.code === 'string' && e.code.toUpperCase().includes('COOLDOWN')) return true
            return false
          }

          const extractNextTimestamp = (e) => {
            if (!e) return null
            return e.nextTimestamp || e.next || (e.data && e.data.nextTimestamp) || (e.response && e.response.data && e.response.data.nextTimestamp) || null
          }

          if (isCooldownError(err)) {
            let nt = extractNextTimestamp(err)
            if (!nt) {
              try {
                nt = await app.service('User').getNextPlaceTime(userId)
                console.log('fetched next place time from User.getNextPlaceTime:', nt)
              } catch (e) {
                throw err
              }
            }
            if (nt) {
              console.log(`placePixel blocked by server error; will wait until ${nt}`)
              await waitUntilIso(nt)
              continue
            }
          }

          throw err
        }
      }
    }

    const userB = await app.service('User').authenticate()
    console.log('Authenticated userA:', user)
    console.log('Authenticated userB:', userB)

    const before = await app.service('Canva').getPixels()
    console.log('Initial canvas pixels:', before.length)

    const userAPlacements = [
      { x: 10, y: 10, color: 4 },
      { x: 11, y: 10, color: 4 },
      { x: 10, y: 11, color: 4 },
      { x: 11, y: 11, color: 4 },
    ]

    const placeEvents = []
    app.service('Canva').on('placePixel', (change) => {
      const payload = change && change.pixel ? change.pixel : change
      const normalized = { ...payload }
      if (normalized && normalized.placedAt) normalized.placedAt = new Date(normalized.placedAt).toISOString()
      placeEvents.push(normalized)
    })

    const placedA = []
    const overwrite = { x: 11, y: 11, color: 7 }
    let userBStarted = false

    const userBTask = (async () => {
      while (!userBStarted) await sleep(10)
      await sleep(60)
      const respB = await placeWithRetry(userB.id, overwrite.x, overwrite.y, overwrite.color)
      console.log('userB overwrote', overwrite, '=>', respB)
      return respB
    })()

    for (const p of userAPlacements) {
      userBStarted = true
      const resp = await placeWithRetry(user.id, p.x, p.y, p.color)
      console.log('userA placed', p, '=>', resp)
      placedA.push({ ...p, placedAt: resp && resp.pixel ? resp.pixel.placedAt : undefined })
    }

    const respB = await userBTask

    await sleep(200)
    const since = placedA[0].placedAt
    const changes = await app.service('Canva').getPixels(since)
    console.log('getPixels(since) =>', changes)
    assert(Array.isArray(changes), 'Canva.getPixels(since) returns an array')

    const foundEvent = placeEvents.find(
      (e) => e.x === overwrite.x && e.y === overwrite.y && e.color === overwrite.color && e.placedAt === (respB && respB.pixel ? respB.pixel.placedAt : respB && respB.placedAt),
    )
    assert(foundEvent, 'userB placePixel was published as an event (even if later overwritten)')

    const placedAts = changes.map((c) => new Date(c.placedAt).getTime())
    const isSorted = placedAts.every((t, i) => i === 0 || t >= placedAts[i - 1])
    assert(isSorted, 'getPixels(since) is ordered by placedAt ascending')

    const matchEvent = (resp) => placeEvents.some((e) => e.x === resp.x && e.y === resp.y && e.color === resp.color && e.placedAt === resp.placedAt)
    for (const resp of [
      ...placedA.map((p) => ({ x: p.x, y: p.y, color: p.color, placedAt: p.placedAt })),
      (respB && respB.pixel) ? respB.pixel : respB,
    ]) {
      if (!matchEvent(resp)) {
        console.warn('Warning: response not matched by a placePixel event (timing or publish behavior):', resp)
      }
    }

    console.log('== scenario finished ==\n')
  } catch (err) {
    console.error('client tests error:', err)
  } finally {
    try {
      socket.close()
    } catch (e) {}
    setTimeout(() => process.exit(0), 200)
  }
}

main()