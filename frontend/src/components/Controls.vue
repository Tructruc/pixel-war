<script setup>
import { ref } from 'vue'
import ColorSelector from './ColorSelector.vue'
import Timer from './Timer.vue'
import AgentControl from './AgentControl.vue'

// Keep the same prop name used elsewhere to avoid cascading changes
const props = defineProps({
  currerntColor: { type: Number, required: true },
  pixels: { type: Array, required: true },
  placePixel: { type: Function, required: true },
  getCenter: { type: Function, required: true }
})

const emit = defineEmits(['color_selected', 'timer_ended', 'agent_drawing_state_change'])

const timerRef = ref(null)
const showTimer = ref(true)
const showAgentControl = ref(false)

function handleColorSelected(color) {
  emit('color_selected', color)
}

function handleTimerEnded() {
  emit('timer_ended')
}

function handlePaletteOpen() {
  showTimer.value = false
}

function handlePaletteClose() {
  showTimer.value = true
}

function resetTimer(endTime) {
  if (timerRef.value && timerRef.value.resetTimer) timerRef.value.resetTimer(endTime)
}

function toggleAgentControl() {
  showAgentControl.value = !showAgentControl.value
}

function closeAgentControl() {
  showAgentControl.value = false
}

function handleAgentDrawingStateChange(isDrawing) {
  emit('agent_drawing_state_change', isDrawing)
}

defineExpose({ resetTimer })
</script>

<template>
  <div class="controls-wrapper">
    <div class="controls-container" :class="{ 'agent-mode': showAgentControl }">
      <!-- Show agent control when active, otherwise show normal controls -->
      <AgentControl 
        v-show="showAgentControl"
        :pixels="props.pixels"
        :place-pixel="props.placePixel"
        :get-center="props.getCenter"
        @close="closeAgentControl"
        @agentDrawingStateChange="handleAgentDrawingStateChange"
        class="inline-agent"
      ></AgentControl>
      <div v-show="!showAgentControl" class="normal-controls">
        <ColorSelector
          @color_selected="handleColorSelected"
          @open="handlePaletteOpen"
          @close="handlePaletteClose"
          :currernt-color="props.currerntColor"
        />
        <div v-show="showTimer" class="timer-wrapper">
          <div class="timer-container">
            <Timer ref="timerRef" @timer_ended="handleTimerEnded" />
          </div>
        </div>
        <button v-show="showTimer" class="agent-icon" @click="toggleAgentControl" title="AI Artist">
          ✨
        </button>
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

.controls-container.agent-mode {
  border-radius: 12px;
  padding: 0;
}


.agent-icon {
  width: 2.2em;
  height: 2.2em;
  margin: 0.1em;
  border-radius: 50%;
  background: rgba(148, 163, 184, 0.15);
  border: 1px solid rgba(148, 163, 184, 0.2);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.3rem;
  padding: 0;
  transition: all 0.2s ease;
}

.agent-icon:hover {
  background: rgba(148, 163, 184, 0.25);
  border-color: rgba(148, 163, 184, 0.3);
  transform: scale(1.05);
}
.inline-agent {
  pointer-events: auto;
}

.inline-agent[style*="display: none"] {
  display: none !important;
}

.normal-controls {
  display: contents;
}

</style>
