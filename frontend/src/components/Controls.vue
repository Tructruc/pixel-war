<script setup>
import { ref } from 'vue'
import ColorSelector from './ColorSelector.vue'
import Timer from './Timer.vue'

// Keep the same prop name used elsewhere to avoid cascading changes
const props = defineProps({
  currerntColor: { type: Number, required: true }
})

const emit = defineEmits(['color_selected', 'timer_ended'])

const timerRef = ref(null)
const showTimer = ref(true)

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

defineExpose({ resetTimer })
</script>

<template>
  <div class="controls-wrapper">
    <div class="controls-container">
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


</style>
