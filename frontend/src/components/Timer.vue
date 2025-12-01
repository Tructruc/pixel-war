<script setup>
import { onMounted, ref } from 'vue'

const time = ref(-1);
const endTimestamp = ref(0);
let timer = null;

const emit = defineEmits(['timer_ended']);

function convertSecondsToMSorS(time) {
  const t = Number(time);
  if (t === 0) return 'ready';
  if (t >= 60) {
    const minutes = Math.floor(t / 60);
    const seconds = Math.floor(t % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  } else if (t > 0) {
    return `${Math.round(t)}s`;
  } else {
    return '';
  }
}

onMounted(() => {
  timer = setInterval(() => {
      let oldTime = time.value;
       let currentTime = Math.floor(Date.now()/1000);
       time.value = Math.max(0, endTimestamp.value - currentTime);

       if (time.value === 0 && oldTime > 0) {
          emit('timer_ended');
       }
    }, 100);
  });

function resetTimer(endTime) {
  endTimestamp.value = endTime/1000;
  
  let currentTime = Math.floor(Date.now()/1000);
  time.value = Math.max(0, endTimestamp.value - currentTime);
  
  if (time.value === 0) {
    emit('timer_ended');
  }
}

defineExpose(
  { resetTimer }
)
</script>

<template>
  <div class="timer-wrapper">
    <div class="timer-container" :class="{ 'ready': time === 0 }">
      <span class="timer-text">{{ convertSecondsToMSorS(time) }}</span>
    </div>
  </div>
</template>

<style scoped>
.timer-wrapper {
  display: flex;
  justify-content: center; /* horizontal */
  align-items: center;     /* vertical */
  width: 100%;
  height: 100%;
}

.timer-container {
  margin: 0 auto;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #f8fafc;
  font-size: 1.5rem;
  font-weight: 600;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
  border-radius: 9999px;
  padding: 0.5rem 0.8rem;
  transition: all 0.3s ease;
  min-width: fit-content;
  background: rgba(100, 100, 100, 0.3);
}

.timer-container.ready {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  box-shadow: 0 0 20px rgba(16, 185, 129, 0.6);
  animation: pulse 2s ease-in-out infinite;
  color: white;
  font-weight: 800;
  font-size: 1.25rem;
  text-transform: uppercase;
  letter-spacing: 3px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
  padding: 0.75rem 1.5rem;
}

@keyframes pulse {
  0%, 100% {
    transform: scale(0.95);
    box-shadow: 0 0 20px rgba(16, 185, 129, 0.6);
  }
  50% {
    transform: scale(1.0);
    box-shadow: 0 0 30px rgba(16, 185, 129, 0.8);
  }
}

.timer-text {
  letter-spacing: 1px;
}
</style>
