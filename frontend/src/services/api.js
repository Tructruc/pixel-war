import { io } from 'socket.io-client'
import expressXClient from '@jcbuisson/express-x-client'

const socket = io()
export const client = expressXClient(socket)
