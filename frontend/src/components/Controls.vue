<script setup>
import { ref } from 'vue'
import ColorSelector from './ColorSelector.vue'
import ShapeSelector from './ShapeSelector.vue'
import Timer from './Timer.vue'
import { useAppState } from '@/composables/useAppState.js'

// Use centralized state management
const state = useAppState()

const emit = defineEmits(['timer_ended'])

const timerRef = ref(null)
const showTimer = ref(true)

function handleColorSelected(color) {
  state.setColor(color)
}

function handleTemplateSelected(template) {
  state.setTemplate(template)
}

function handleTimerEnded() {
  emit('timer_ended')
}

function handleShapePaletteOpen() {
  showTimer.value = false
  state.openShapePalette()
}

function handleColorPaletteOpen() {
  showTimer.value = false
  state.openColorPalette()
}

function handlePaletteClose() {
  showTimer.value = true
  state.closePalette()
}

function rotateShape() {
  state.rotateShape()
}

function resetTimer(endTime) {
  if (timerRef.value && timerRef.value.resetTimer) timerRef.value.resetTimer(endTime)
}

defineExpose({ resetTimer })
</script>

<template>
  <div class="controls-wrapper">
    <div class="controls-container">
      <!-- Drawing Progress Indicator -->
      <div v-if="state.isDrawing.value" class="drawing-progress">
        <div class="progress-info">
          <span class="progress-text">Drawing... {{ state.queueLength.value }} left</span>
          <button class="cancel-btn" @click="state.cancelDrawing()" aria-label="Cancel Drawing">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
      </div>

      <!-- Regular Controls -->
      <template v-else>
        <ShapeSelector
          v-show="state.openPalette.value === null || state.openPalette.value === 'shape'"
          :current-template="state.currentTemplate.value"
          @template_selected="handleTemplateSelected"
          @open="handleShapePaletteOpen"
          @close="handlePaletteClose"
        />
        <button 
          v-show="state.openPalette.value === null"
          class="control-btn rotate-btn" 
          @click="rotateShape" 
          aria-label="Rotate Shape"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" :style="{ transform: `rotate(${state.rotation.value * 90}deg)`, transition: 'transform 0.1s ease-out' }">
            <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.3"/>
          </svg>
        </button>
        <ColorSelector
          v-show="state.openPalette.value === null || state.openPalette.value === 'color'"
          @color_selected="handleColorSelected"
          @open="handleColorPaletteOpen"
          @close="handlePaletteClose"
          :current-color="state.currentColor.value"
        />
      </template>

      <!-- Timer - Always mounted, hidden when drawing or palette open -->
      <div v-show="showTimer && state.openPalette.value === null && !state.isDrawing.value" class="timer-wrapper">
        <div class="timer-container">
          <Timer ref="timerRef" @timer_ended="handleTimerEnded" />
        </div>
      </div>
    </div>
  </div>
   
</template>

<style scoped>


.controls-wrapper {
  display: flex;
  justify-content: center; /* horizontal */
  align-items: center;     /* vertical */
  width: 100%;
  height: 100%;
}

.controls-container {
  margin:  auto;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  background-color: #1e293b;
  color: #f8fafc;
  font-size: 1.5rem;
  font-weight: 600;
  border-radius: 9999px;
  padding: 0.5rem 1rem;
  box-shadow: 0 4px 10px rgba(0,0,0,0.15);
  transition: all 0.3s ease;
  min-width: 80px;
}

.control-btn {
  background: transparent;
  border: none;
  color: #cbd5e1;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.control-btn:hover {
  background-color: #334155;
  color: white;
}

.rotate-btn {
  width: 3.2em;
  height: 3.2em;
  border: 2px solid transparent;
}

.rotate-btn:hover {
  border-color: #475569;
}

.drawing-progress {
  display: flex;
  align-items: center;
  padding: 0.5rem 1rem;
}

.progress-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.progress-text {
  color: #cbd5e1;
  font-size: 1rem;
  font-weight: 600;
  white-space: nowrap;
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.01em;
}

.cancel-btn {
  background: #ef4444;
  border: none;
  color: white;
  cursor: pointer;
  padding: 0.4rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  width: 2em;
  height: 2em;
}

.cancel-btn:hover {
  background-color: #dc2626;
  transform: scale(1.1);
}

.cancel-btn:active {
  transform: scale(0.95);
}


</style>
