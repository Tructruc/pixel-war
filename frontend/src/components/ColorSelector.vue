<script setup>
import { ref, onMounted, onBeforeUnmount, computed } from 'vue'
import colors from '@/constants/colors.js'

// keep the original prop name for compatibility with existing parent usage
const props = defineProps({
  currerntColor: {
    type: Number,
    required: true
  }
})

const emit = defineEmits(['color_selected', 'open', 'close'])

// local state: whether the palette is open
const open = ref(false)

function togglePalette() {
  open.value = !open.value
  if (open.value) emit('open')
  else emit('close')
}

function selectColor(index) {
  // emit the selected index so parent can update its state
  emit('color_selected', index)
  if (open.value) {
    open.value = false
    emit('close')
  }
}

// click-outside handler to close the palette
function onClickOutside(e) {
  const palette = document.getElementById('color-palette')
  const trigger = document.getElementById('color-trigger')
  if (!palette || !trigger) return
  if (!palette.contains(e.target) && !trigger.contains(e.target)) {
    if (open.value) {
      open.value = false
      emit('close')
    }
  }
}

onMounted(() => window.addEventListener('click', onClickOutside))
onBeforeUnmount(() => window.removeEventListener('click', onClickOutside))

// compute number of columns so palette is rendered in two rows
const columns = computed(() => {
  const total = Array.isArray(colors?.colors) ? colors.colors.length : 0
  return Math.ceil(total / 2) || 1
})
</script>

<template>
  <div class="color-selector">
    <!-- when closed, show the circular trigger; when open, replace with the palette -->
    <button
      v-if="!open"
      id="color-trigger"
      class="current-color"
      :style="{ backgroundColor: colors.colors[props.currerntColor] || 'transparent', border: '2px solid #333' }"
      @click.stop="togglePalette"
      :aria-expanded="open"
      :aria-label="`Selected color ${props.currerntColor}`"
    />

    <div v-else id="color-palette" class="palette" role="list" :style="{ gridTemplateColumns: `repeat(${columns}, auto)` }">
      <button
        v-for="(color, id) in colors.colors"
        :key="id"
        class="palette-color"
        :style="{ backgroundColor: color, outline: props.currerntColor === id ? '3px solid black' : 'none' }"
        @click.stop="selectColor(id)"
        :aria-label="`Select color ${id}`"
      />
    </div>
  </div>
</template>

<style scoped>
.color-selector {
  /* use grid so trigger and palette share the same place in flow */
  display: inline-grid;
  place-items: center;
}

.current-color {
  width: 3.2em;
  height: 3.2em;
  margin: 0.1em;
  border-radius: 50%;
  padding: 0;
  cursor: pointer;
}

.palette {
  /* no absolute positioning: palette replaces the trigger in the flow */
  display: grid;
  grid-auto-rows: 2em;
  gap: 0.3em;
  padding: 0.2em;
}

.palette-color {
  width: 2.6em;
  height: 2.6em;
  border-radius: 0.4em;
  border: 1px solid rgba(0,0,0,0.07);
  cursor: pointer;
}

.palette-color:hover {
  transform: scale(1.1);
  border-color: rgba(0,0,0,0.2);
}

</style>
