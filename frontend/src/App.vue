<script setup>
import Canvas from '@/components/canvas.vue'
import { onMounted, ref } from 'vue'
import Controls from '@/components/Controls.vue'
import Splash from '@/components/Splash.vue'
import { io } from 'socket.io-client'
import expressXClient from '@jcbuisson/express-x-client'

const showSplash = ref(true)
const isSelecting = ref(false)
var currentColor = ref(1)
const pixels = ref([])
const controls = ref(null)
const socket = io( )
const app = expressXClient(socket)
const canvasRef = ref(null)
const isAgentDrawing = ref(false)

let userId;

async function handleGreet(position) {
  isSelecting.value = false;
  try {
    await app
      .service('Canva')
      .placePixel(
        userId,
      position.x,
      position.y,
      currentColor.value);
    let newNextTime = await app.service("User").getNextPlaceTime(userId);
    if (controls.value && controls.value.resetTimer) controls.value.resetTimer(newNextTime);
  } catch (e) {
    console.error("Failed to place pixel", e);
    isSelecting.value = true; // Re-enable if failed
  }
}

async function handleAgentPlacePixel({ x, y, color }) {
  // Agent bypasses the "selection" mode but still respects cooldown
  try {
      await app
        .service('Canva')
        .placePixel(userId, x, y, color);
      
      let newNextTime = await app.service("User").getNextPlaceTime(userId);
      if (controls.value && controls.value.resetTimer) controls.value.resetTimer(newNextTime);
      return newNextTime;
  } catch (error) {
      console.error("Agent failed to place pixel:", error);
      throw error;
  }
}

function handleAgentDrawingStateChange(isDrawing) {
  isAgentDrawing.value = isDrawing
}

function handleColorSelected(color) {
  currentColor.value = color
}

onMounted(async () => {
  // Hide splash screen after 3 seconds
  setTimeout(() => {
    showSplash.value = false
  }, 3000)

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
  if (controls.value && controls.value.resetTimer) controls.value.resetTimer(nextTime);
})
</script>

<template>
  <Splash v-if="showSplash" />
  <div class="app-container">
    <Canvas ref="canvasRef" :isSelecting="isSelecting" :isAgentDrawing="isAgentDrawing" @selected_pixel="handleGreet" :pixels="pixels" />
    

    <div class="overlay-controls">
      <Controls 
        ref="controls" 
        @color_selected="handleColorSelected" 
        @timer_ended="isSelecting = true" 
        @agent_drawing_state_change="handleAgentDrawingStateChange"
        :currernt-color="currentColor"
        :pixels="pixels"
        :place-pixel="handleAgentPlacePixel"
        :get-center="() => canvasRef ? canvasRef.getCenter() : {x:512, y:512}"
      />
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

.agent-overlay {
  position: absolute;
  top: 20px;
  right: 20px;
  z-index: 20;
}

.overlay-controls {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10;
  display: flex;
  flex-direction: row;
  gap: 20px;
  pointer-events: none;
}

.overlay-controls > * {
  pointer-events: auto;
}
</style>
