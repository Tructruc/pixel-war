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
    }, 1000);
  });

function resetTimer(endTime) {
  console.log(endTime, Date.now(), endTime < Date.now());
  if (endTime/1000 <= Math.floor(Date.now()/1000)) {
    emit('timer_ended');
  }
  endTimestamp.value = endTime/1000;
}

defineExpose(
  { resetTimer }
)
</script>

<template>
  <div class="timer-wrapper">
    <div class="timer-container">
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

.timer-container:hover {
  transform: scale(1.05);
  background-color: #334155;
}

.timer-text {
  letter-spacing: 1px;
}
</style>
