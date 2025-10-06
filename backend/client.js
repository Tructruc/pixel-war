import io from 'socket.io-client'
import { expressXClient } from '@jcbuisson/express-x'

// connect to the server (make sure backend/app.js is running)
const socket = io('http://localhost:8000', { transports: ['websocket'] })
const app = expressXClient(socket)

async function main() {
  try {
    // create a user (schema requires next_timestamp DateTime)
    const user = await app.service('User').create({
      next_timestamp: new Date().toISOString(),
    })
    console.log('created user', user)

    // create two pixels on the canvas
    const p1 = await app.service('Canva').create({ x: 0, y: 0, color: 3 })
    const p2 = await app.service('Canva').create({ x: 1, y: 0, color: 5 })
    console.log('created pixels', p1, p2)

    // read back the first pixel using composite PK where syntax
    const found = await app.service('Canva').findUnique({
      where: { x_y: { x: 0, y: 0 } },
    })
    console.log('found pixel', found)

    // done
    socket.close()
    process.exit(0)
  } catch (err) {
    console.error('error in client', err)
    socket.close()
    process.exit(1)
  }
}

// wait for socket connection before running
socket.on('connect', () => {
  console.log('connected to server', socket.id)
  main()
})

socket.on('connect_error', (err) => {
  console.error('connection error', err.message)
  process.exit(1)
})

export default app
