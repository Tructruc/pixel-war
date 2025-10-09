import { expressX } from '@jcbuisson/express-x'
import { PrismaClient } from '@prisma/client'

const app = expressX()
const prisma = new PrismaClient()

const PIXEL_COOLDOWN_MS = 5_000
const MAX_X = 1023
const MAX_Y = 1023
const MAX_COLOR = 15

const pixelChanges = new Map()

// User service methods
const userMethods = {
  /**
   * Create/authenticate a user and return its id.
   * @returns {{id: string}}
   */
  authenticate: async () => {
    const newUser = await prisma.user.create({ data: {} })
    return { id: newUser.id }
  },

  /** Return the next allowed placement time for a user. */
  getNextPlaceTime: async (userId) => {
    if (!userId) throw new Error('userId is required')
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) throw new Error('user not found')
    return user.nextPlacementAt
  }
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
    if (!userId) throw new Error('userId is required')
    if (!Number.isInteger(x) || !Number.isInteger(y) || !Number.isInteger(colorId)) {
      throw new Error('x, y and colorId must be integers')
    }
    if (x < 0 || x > MAX_X || y < 0 || y > MAX_Y) throw new Error(`x and y must be between 0 and ${MAX_X}`)
    if (colorId < 0 || colorId > MAX_COLOR) throw new Error(`colorId must be between 0 and ${MAX_COLOR}`)

    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) throw new Error('user not found')

    const now = new Date()
    if (user.nextPlacementAt && now < user.nextPlacementAt) {
      return user.nextPlacementAt
    }

    const nowIso = new Date().toISOString()
    const pixel = await prisma.canva.upsert({
      where: { x_y: { x, y } },
      create: { x, y, color: colorId, placedAt: nowIso },
      update: { color: colorId, placedAt: nowIso },
    })

  const nextTimestamp = new Date(Date.now() + PIXEL_COOLDOWN_MS)
  await prisma.user.update({ where: { id: userId }, data: { nextPlacementAt: nextTimestamp } })

    const key = `${x},${y}`
    const placedAt = nowIso
    // keep in-memory latest changes for quick emission (optional)
    pixelChanges.set(key, { x, y, color: colorId, placedAt })

    // return both the next allowed timestamp and the pixel change timestamp (ISO strings)
    return { nextTimestamp: nextTimestamp.toISOString(), placedAt }
  },

  /** Get pixels; if `since` provided, return only changes after that time. */
  getPixels: async (since) => {
    if (!since) return prisma.canva.findMany()

  const sinceDate = new Date(since)
  if (Number.isNaN(sinceDate.getTime())) throw new Error('invalid since timestamp')

  // query the database for pixels with placedAt >= sinceDate (inclusive)
  return prisma.canva.findMany({ where: { placedAt: { gte: sinceDate } } })
  }
}

app.createService('Canva', canvaMethods)


app.service('User').publish(async () => ['anonymous'])
app.service('Canva').publish(async () => ['anonymous'])

app.addConnectListener((socket) => app.joinChannel('anonymous', socket))

// health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' })
})

app.httpServer.listen(8000, () => console.log(`App listening at http://localhost:8000`))