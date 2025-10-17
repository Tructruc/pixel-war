<script setup>
import Canvas from '@/components/canvas.vue'
import { onMounted, ref } from 'vue'
import ColorSelector from '@/components/ColorSelector.vue'
import Timer from '@/components/Timer.vue'
import { io } from 'socket.io-client'
import expressXClient from '@jcbuisson/express-x-client'

const isSelecting = ref(false)
var currentColor = ref(1)
const pixels = ref([])
const timer = ref(null)
const socket = io( )
const app = expressXClient(socket)

let userId;

async function handleGreet(position) {
  await app
    .service('Canva')
    .placePixel(
      userId,
    position.x,
    position.y,
    currentColor.value);
  let newNextTime = await app.service("User").getNextPlaceTime(userId);
  timer.value.resetTimer(newNextTime);
  isSelecting.value = false;
}
function handleColorSelected(color) {
  currentColor.value = color
}

onMounted(async () => {
  const map = await app.service('Canva').getPixels()
  pixels.value = map
  if (localStorage.getItem("userId")) {
    userId = localStorage.getItem("userId");
  } else {
    var user = await app.service('User').authenticate()
    userId = user.id
    localStorage.setItem("userId", userId);
  }
  app.service('Canva').on('placePixel', (payload) => {
    const p = payload && payload.pixel ? payload.pixel : payload
    const index = pixels.value.findIndex((pix) => pix.x === p.x && pix.y === p.y)
    if (index !== -1) {
      pixels.value.splice(index, 1)
    }
    pixels.value.push({ x: p.x, y: p.y, color: p.color })
  })

  let nextTime = await app.service("User").getNextPlaceTime(userId);
  timer.value.resetTimer(nextTime);
})
</script>

<template>
  <div class="app-container">
    <Canvas :isSelecting="isSelecting" @selected_pixel="handleGreet" :pixels="pixels" />
    <div class="overlay-controls">
      <ColorSelector @color_selected="handleColorSelected" :currernt-color="currentColor" />
      <Timer ref="timer" @timer_ended="isSelecting = true" />
    </div>
  </div>
</template>

<style>
html, body {
  margin: 0;
  padding: 0;
  overflow: hidden;
  width: 100%;
  height: 100%;
}

#app {
  width: 100%;
  height: 100%;
}
</style>

<style scoped>
.app-container {
  position: relative;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
}

.overlay-controls {
  position: absolute;
  top: 20px;
  left: 20px;
  z-index: 10;
  display: flex;
  flex-direction: column;
  gap: 20px;
  pointer-events: none;
}

.overlay-controls > * {
  pointer-events: auto;
}
</style>
