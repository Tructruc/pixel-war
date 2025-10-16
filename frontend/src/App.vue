<script setup>
import Canvas from "@/components/canvas.vue";
import {ref} from "vue";
import ColorSelector from '@/components/ColorSelector.vue'
import colors from '@/constants/colors.js'
import Timer from '@/components/Timer.vue'

const isSelecting = ref(false);
var currentColor = ref(1);
const pixels = ref([]);
const timer = ref(null);

function handleGreet(position) {
  pixels.value.push({ x: position.x, y: position.y, color: colors.colors[currentColor.value] });
}
function handleColorSelected(color) {
  currentColor.value = color;
}
</script>

<template>
  <button @click="isSelecting = !isSelecting">
    {{ isSelecting ? "Stop Selecting" : "Start Selecting" }}
  </button>
  <button @click="timer.resetTimer(Date.now()+10*1000)">ResetTimer</button>
  <Canvas :isSelecting="isSelecting" @selected_pixel="handleGreet" :pixels="pixels"/>
  <ColorSelector @color_selected="handleColorSelected" :currernt-color="currentColor" />
  <Timer ref="timer" @timer_ended="isSelecting=true"/>
</template>

<style scoped></style>
