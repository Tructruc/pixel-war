<script setup>
import { onMounted, ref } from 'vue'

const time = ref(-1);
const endTimestamp = ref(0);
let timer = null;

const emit = defineEmits(['timer_ended']);

function convertSecondsToMSorS(time) {
  if (time >= 60) {
    const minutes = Math.floor(time / 60);
    const seconds = time % 60;
    return `${minutes}:${Math.round(seconds).toString().padStart(2, '0')}`;
  } else {
    return `${Math.round(time)}s`;
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
  endTimestamp.value = endTime/1000;
}

defineExpose(
  { resetTimer }
)
</script>

<template>{{
  convertSecondsToMSorS(time)}}</template>

<style scoped></style>
