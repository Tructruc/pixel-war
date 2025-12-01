<script setup>
import { ref, onMounted, onBeforeUnmount, computed } from 'vue'
import colorsPalette from '@/constants/colors.js'
import { useTemplates } from '@/composables/useTemplates.js'
import TemplateCreator from '@/components/TemplateCreator.vue'

const { templates, fetchTemplates } = useTemplates()
const showCreator = ref(false)

const props = defineProps({
  currentTemplate: {
    type: String,
    required: true
  }
})

const emit = defineEmits(['template_selected', 'open', 'close'])

const open = ref(false)

function toggleSelector() {
  open.value = !open.value
  if (open.value) emit('open')
  else emit('close')
}

function selectTemplate(name) {
  emit('template_selected', name)
  if (open.value) {
    open.value = false
    emit('close')
  }
}

function onClickOutside(e) {
  const selector = document.getElementById('shape-selector')
  const trigger = document.getElementById('shape-trigger')
  if (!selector || !trigger) return
  if (!selector.contains(e.target) && !trigger.contains(e.target)) {
    if (open.value) {
      open.value = false
      emit('close')
    }
  }
}

// Helper to calculate preview styles for a shape
function getPreviewPixels(shapeName) {
  const pixels = templates.value[shapeName]
  if (!pixels || pixels.length === 0) return []

  // Find bounds
  const xs = pixels.map(p => p.x)
  const ys = pixels.map(p => p.y)
  const minX = Math.min(...xs)
  const maxX = Math.max(...xs)
  const minY = Math.min(...ys)
  const maxY = Math.max(...ys)

  const width = maxX - minX + 1
  const height = maxY - minY + 1
  
  // Calculate cell size to fit in 18x18 (leaving 1px padding)
  const containerSize = 18
  const maxDim = Math.max(width, height)
  const cellSize = Math.max(1, Math.floor(containerSize / maxDim))
  
  // Calculate total dimensions
  const totalWidth = width * cellSize
  const totalHeight = height * cellSize
  
  // Calculate offsets to center
  const offsetX = (20 - totalWidth) / 2
  const offsetY = (20 - totalHeight) / 2

  return pixels.map(p => {
    const color = p.color !== null && p.color !== undefined 
      ? colorsPalette.colors[p.color] 
      : '#ffffff'
    // Ensure pixel is at least 1px
    const pixelSize = Math.max(1, cellSize - 1)
    return {
      style: {
        left: `${offsetX + (p.x - minX) * cellSize}px`,
        top: `${offsetY + (p.y - minY) * cellSize}px`,
        width: `${pixelSize}px`,
        height: `${pixelSize}px`,
        backgroundColor: color
      }
    }
  })
}

// Compute number of columns so grid is rendered nicely
const columns = computed(() => {
  const total = Object.keys(templates.value).length
  return Math.ceil(total / 2) || 1
})

onMounted(() => {
  window.addEventListener('click', onClickOutside)
  fetchTemplates()
})
onBeforeUnmount(() => window.removeEventListener('click', onClickOutside))
</script>

<template>
  <div class="shape-selector">
    <button
      v-if="!open"
      id="shape-trigger"
      class="current-shape"
      @click.stop="toggleSelector"
      :aria-expanded="open"
      :aria-label="`Selected shape ${props.currentTemplate}`"
    >
      <div class="shape-preview">
        <div 
          v-for="(pixel, idx) in getPreviewPixels(props.currentTemplate)" 
          :key="idx" 
          class="preview-pixel"
          :style="pixel.style"
        ></div>
      </div>
    </button>

    <div v-else id="shape-selector" class="selector-grid" role="list" :style="{ gridTemplateColumns: `repeat(${columns}, auto)` }">
      <button
        v-for="(shape, name) in templates"
        :key="name"
        class="shape-option"
        :class="{ active: props.currentTemplate === name }"
        :style="{ outline: props.currentTemplate === name ? '3px solid white' : 'none' }"
        @click.stop="selectTemplate(name)"
        :aria-label="`Select shape ${name}`"
      >
        <div class="shape-preview">
          <div 
            v-for="(pixel, idx) in getPreviewPixels(name)" 
            :key="idx" 
            class="preview-pixel"
            :style="pixel.style"
          ></div>
        </div>
      </button>
      
      <button 
        class="shape-option add-btn"
        @click.stop="showCreator = true"
        aria-label="Create new template"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>
    </div>
    
    <TemplateCreator v-if="showCreator" @close="showCreator = false" />
  </div>
</template>

<style scoped>
.shape-selector {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.current-shape {
  width: 3.2em;
  height: 3.2em;
  margin: 0.1em;
  border-radius: 50%;
  padding: 0;
  cursor: pointer;
  background-color: #334155;
  border: 2px solid #475569;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.current-shape:hover {
  background-color: #475569;
}

.selector-grid {
  position: absolute;
  bottom: calc(100% + 10px);
  left: 50%;
  transform: translateX(-50%);
  display: grid;
  grid-auto-rows: auto;
  gap: 0.4em;
  padding: 0.5em;
  background-color: #1e293b;
  border-radius: 12px;
  box-shadow: 0 8px 20px rgba(0,0,0,0.3);
  z-index: 100;
}

.shape-option {
  width: 2.6em;
  height: 2.6em;
  border-radius: 0.4em;
  border: 1px solid rgba(255,255,255,0.1);
  cursor: pointer;
  transition: transform 0.2s ease;
  background-color: #334155;
  padding: 0.3em;
  display: flex;
  align-items: center;
  justify-content: center;
}

.shape-option:hover {
  transform: scale(1.1);
  border-color: rgba(255,255,255,0.3);
}

.add-btn {
  color: rgba(255,255,255,0.7);
  border-style: dashed;
}

.add-btn:hover {
  color: white;
  border-color: white;
  background-color: #475569;
}

.shape-preview {
  position: relative;
  width: 20px;
  height: 20px;
}

.preview-pixel {
  position: absolute;
  border-radius: 1px;
}
</style>
