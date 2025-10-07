import io from 'socket.io-client'
import expressXClient from '@jcbuisson/express-x-client'

// connect to the server
const socket = io('http://localhost:8000', { transports: ['websocket'] })

const app = expressXClient(socket)

// listen to server-side create events for the services defined in the Prisma schema
try {
  const userSvc = app.service('User')
  if (userSvc && typeof userSvc.on === 'function') {
    userSvc.on('create', (u) => console.log('User created (event):', u))
  }
} catch (e) {
  // service may not be available yet
}

try {
  const canvaSvc = app.service('Canva')
  if (canvaSvc && typeof canvaSvc.on === 'function') {
    canvaSvc.on('create', (p) => console.log('Canva created (event):', p))
  }
} catch (e) {}

async function main() {
  try {
    // Create a User. The Prisma schema defines defaults for id and next_timestamp,
    // so sending empty data is valid.
    const user = await app.service('User').create({ data: {} })
    console.log('created user ->', user)

    // Create or update pixels using upsert so we respect the composite primary key @@id([x,y])
    const pixels = [
      { x: 0, y: 0, color: 1 },
      { x: 1, y: 0, color: 2 },
      { x: 0, y: 1, color: 3 },
    ]

    for (const p of pixels) {
      try {
        // upsert: if a row with the composite key (x,y) exists, update color; otherwise create
        const res = await app.service('Canva').upsert({
          where: { x: p.x, y: p.y },
          create: p,
          update: { color: p.color },
        })
        console.log('upserted pixel ->', res)
      } catch (err) {
        // fallback to create if upsert is not supported by the transport/service
        try {
          const created = await app.service('Canva').create({ data: p })
          console.log('created pixel ->', created)
        } catch (e) {
          console.error('failed to create/upsert pixel', p, e.message)
        }
      }
    }

    // Read back the user (no relations in schema)
    try {
      const found = await app.service('User').findUnique({ where: { id: user.id } })
      console.log('found user ->', found)
    } catch (e) {
      console.error('failed to read back user', e.message)
    }

  } catch (err) {
    console.error('client error', err)
  } finally {
    setTimeout(() => process.exit(0), 500)
  }
}

socket.on('connect', () => {
  console.log('connected to server')
  main()
})

socket.on('connect_error', (err) => {
  console.error('connection error', err && err.message ? err.message : err)
})
