import { expressX } from '@jcbuisson/express-x'
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

// publish
app.service('User').publish(async (user, context) => {
   return ['anonymous']
})
app.service('Canva').publish(async (post, context) => {
   return ['anonymous']
})

// subscribe
app.addConnectListener((socket) => {
   app.joinChannel('anonymous', socket)
})

// health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' })
})

app.httpServer.listen(8000, () => console.log(`App listening at http://localhost:8000`))