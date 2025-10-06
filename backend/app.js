import expressX from '@jcbuisson/express-x'
import { PrismaClient } from '@prisma/client'

// `app` is a regular express application, enhanced with service and real-time features
const app = expressX()

// configure prisma client from schema
const prisma = new PrismaClient()

// create two CRUD database services. They provide Prisma methods: `create`, `createMany`, `find`, `findMany`, `upsert`, etc.
// Prisma client model accessors are lowercase (prisma.user, prisma.canva)
app.createService('User', prisma.user)
app.createService('Canva', prisma.canva)

// publish - decide which channels a change should be broadcast to
app.service('User').publish(async (user, context) => {
  // for now publish all user events to the anonymous channel
  return ['anonymous']
})

app.service('Canva').publish(async (pixel, context) => {
  // you may want to publish per-board or per-region channels later
  return ['anonymous']
})

// subscribe - when a client connects, join them to default channels
app.on('connection', (socket) => {
  console.log('connection', socket.id)
  app.joinChannel('anonymous', socket)
})

// simple health route (express still works as usual)
app.get('/health', (req, res) => res.json({ ok: true }))

const PORT = process.env.PORT || 8000
app.server.listen(PORT, () => console.log(`App listening at http://localhost:${PORT}`))

// graceful shutdown for Prisma
async function shutdown() {
  console.log('shutting down...')
  try {
    await prisma.$disconnect()
  } catch (err) {
    console.error('Error during prisma disconnect', err)
  }
  process.exit(0)
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)

export default app
