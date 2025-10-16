<script setup>
import colors from '@/constants/colors.js'

const props = defineProps({
  currerntColor: {
    type: Number,
    required: true
  }
})

const emit = defineEmits(['color_selected'])
function selectColor(color) {
  emit('color_selected', color)
}
</script>

<template>
  <button
    v-for="id in colors.colors.length - 1"
    :key="id"
    :style="{ backgroundColor: colors.colors[id], border: currerntColor === id ? '3px solid black' : 'none' }"
    @click="selectColor(id)"
  />
</template>

<style scoped>
button {
  width: 3em;
  height: 3em;
  margin: 0.1em;
}
</style>
