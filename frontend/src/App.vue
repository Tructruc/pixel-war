<script setup>
import Canvas from '@/components/canvas.vue'
import { onMounted, ref } from 'vue'
import Controls from '@/components/Controls.vue'
import Splash from '@/components/Splash.vue'
import { client as app } from '@/services/api.js'
import { useAppState } from '@/composables/useAppState.js'
import { useTemplates } from '@/composables/useTemplates.js'

const showSplash = ref(true)
const pixels = ref([])
const controls = ref(null)

// Use centralized state management
const state = useAppState()
const { templates } = useTemplates()

let userId;

// Helper to rotate a point (x, y) by 90 degrees * rotation
function rotatePoint(x, y, r) {
  switch (r) {
    case 1: return { x: -y, y: x }
    case 2: return { x: -x, y: -y }
    case 3: return { x: y, y: -x }
    default: return { x, y }
  }
}

async function processQueue() {
  if (state.drawingQueue.value.length === 0) {
    state.finishDrawing()
    return
  }

  const pixel = state.dequeue()
  
  // Use the color from the template if specified, otherwise use current selected color
  const colorToUse = pixel.color !== null ? pixel.color : state.currentColor.value

  await app
    .service('Canva')
    .placePixel(
      userId,
      pixel.x,
      pixel.y,
      colorToUse
    );
  
  let newNextTime = await app.service("User").getNextPlaceTime(userId);
  state.setNextPlaceTime(newNextTime);
  if (controls.value && controls.value.resetTimer) controls.value.resetTimer(newNextTime);
  
  // Check if we just finished - immediately update UI
  if (state.drawingQueue.value.length === 0) {
    state.finishDrawing()
  }
}

async function handleGreet(position) {
  if (state.currentTemplate.value === 'Pixel') {
    await app
      .service('Canva')
      .placePixel(
        userId,
      position.x,
      position.y,
      state.currentColor.value);
    let newNextTime = await app.service("User").getNextPlaceTime(userId);
    state.setNextPlaceTime(newNextTime);
    if (controls.value && controls.value.resetTimer) controls.value.resetTimer(newNextTime);
  } else {
    // Shape drawing logic
    state.startDrawing()
    const shapePixels = templates.value[state.currentTemplate.value]
    if (!shapePixels) return

    // Add all pixels to queue with rotation
    const pixelsToQueue = shapePixels.map(p => {
      const rotated = rotatePoint(p.x, p.y, state.rotation.value)
      return {
        x: position.x + rotated.x,
        y: position.y + rotated.y,
        color: p.color
      }
    })

    state.addToQueue(pixelsToQueue)

    // Start processing
    await processQueue()
  }
}

function handleTimerEnded() {
  if (state.drawingQueue.value.length > 0) {
    processQueue()
  } else {
    state.forceEnableSelection()
  }
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
  state.setNextPlaceTime(nextTime)
  if (controls.value && controls.value.resetTimer) controls.value.resetTimer(nextTime);
})
</script>

<template>
  <Splash v-if="showSplash" />
  <div class="app-container">
    <Canvas 
      :isSelecting="state.canSelect.value" 
      :currentTemplate="state.currentTemplate.value" 
      :rotation="state.rotation.value"
      @selected_pixel="handleGreet" 
      @rotate_shape="state.rotateShape()"
      :pixels="pixels" 
    />
    <div class="overlay-controls">
      <Controls 
        ref="controls" 
        @timer_ended="handleTimerEnded" 
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
