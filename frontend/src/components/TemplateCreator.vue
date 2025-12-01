<script setup>
import { ref, reactive } from 'vue'
import colors from '@/constants/colors.js'
import { useTemplates } from '@/composables/useTemplates.js'

const emit = defineEmits(['close'])

const { createTemplate } = useTemplates()

const name = ref('')
const selectedColor = ref(1)
const isEraser = ref(false)
const isAdaptive = ref(false) // New: adaptive color mode
const grid = reactive(Array(20).fill().map(() => Array(20).fill(null)))
const isSaving = ref(false)

function setPixel(x, y) {
  // Use 'adaptive' as a special marker for adaptive color
  grid[y][x] = isAdaptive.value ? 'adaptive' : selectedColor.value
}

function clearPixel(x, y) {
  grid[y][x] = null
}

function handlePixelClick(x, y) {
  if (isEraser.value) {
    clearPixel(x, y)
  } else {
    setPixel(x, y)
  }
}

function handleMouseEnter(e, x, y) {
  if (e.buttons !== 1) return
  if (isEraser.value) {
    clearPixel(x, y)
  } else {
    setPixel(x, y)
  }
}

async function save() {
  if (!name.value.trim()) return
  
  isSaving.value = true
  try {
    const pixels = []
    // Find center of mass or bounding box to center the template
    // For simplicity, let's just export relative to top-left (0,0) of the grid
    // Or better, center it relative to the drawn shape's center
    
    let minX = 20, maxX = -1, minY = 20, maxY = -1
    let hasPixels = false
    
    for (let y = 0; y < 20; y++) {
      for (let x = 0; x < 20; x++) {
        if (grid[y][x] !== null) {
          hasPixels = true
          minX = Math.min(minX, x)
          maxX = Math.max(maxX, x)
          minY = Math.min(minY, y)
          maxY = Math.max(maxY, y)
        }
      }
    }
    
    if (!hasPixels) return

    const centerX = Math.floor((minX + maxX) / 2)
    const centerY = Math.floor((minY + maxY) / 2)

    for (let y = 0; y < 20; y++) {
      for (let x = 0; x < 20; x++) {
        if (grid[y][x] !== null) {
          pixels.push({
            x: x - centerX,
            y: y - centerY,
            color: null // Use null so it adapts to selected color, or use grid[y][x] for fixed color?
            // User request: "enable the user to draw anything without constrains"
            // Let's use the specific color if they want fixed colors, or maybe add a checkbox?
            // For now, let's assume they want fixed colors if they pick specific ones, 
            // but maybe we should offer a "transparent/adaptive" color option?
            // The prompt said "without constrains", so let's save the actual color ID.
            // Wait, previous request was "not have a fix color" for Space Invader.
            // Let's stick to fixed colors for now as that's what the drawing grid implies.
            // Actually, let's use the color from the grid.
          })
          // Override color to null if we want adaptive. 
          // Let's add a toggle? No, keep it simple. Use the drawn color.
          // But wait, if I draw in red, I expect it to be red.
          // If I want it adaptive, I should probably select a special "adaptive" color?
          // Let's just save the color ID for now.
        }
      }
    }
    
    // Map pixels to use the color from the grid, converting 'adaptive' to null
    const finalPixels = pixels.map(p => ({
      ...p,
      color: grid[p.y + centerY][p.x + centerX] === 'adaptive' ? null : grid[p.y + centerY][p.x + centerX]
    }))

    const userId = localStorage.getItem('userId')
    if (!userId) {
      alert('User ID not found')
      return
    }
    await createTemplate(userId, name.value, finalPixels)
    emit('close')
  } catch (e) {
    alert('Failed to save template')
  } finally {
    isSaving.value = false
  }
}
</script>

<template>
  <Teleport to="body">
    <div class="modal-overlay" @click.self="$emit('close')">
      <div class="modal-content">
        <h2>Create New Template</h2>
        
        <div class="form-group">
          <label>Name:</label>
          <input v-model="name" placeholder="Template Name" maxlength="20" />
        </div>

        <div class="editor-container">
          <div class="grid">
            <div v-for="(row, y) in grid" :key="y" class="row">
              <div 
                v-for="(color, x) in row" 
                :key="x" 
                class="cell"
                :style="{ 
                  backgroundColor: color === 'adaptive' ? 'transparent' : (color !== null ? colors.colors[color] : 'transparent'),
                  backgroundImage: color === 'adaptive' ? 'repeating-linear-gradient(45deg, #cbd5e1 0, #cbd5e1 2px, transparent 2px, transparent 4px)' : 'none'
                }"
                @mousedown="handlePixelClick(x, y)"
                @mouseenter="e => handleMouseEnter(e, x, y)"
              ></div>
            </div>
          </div>

          <div class="palette">
            <div 
              v-for="(c, idx) in colors.colors" 
              :key="idx"
              class="color-swatch"
              :class="{ active: selectedColor === idx && !isEraser && !isAdaptive }"
              :style="{ backgroundColor: c }"
              @click="selectedColor = idx; isEraser = false; isAdaptive = false"
            ></div>
            
            <!-- Adaptive Color Tool -->
            <div 
              class="color-swatch adaptive-color"
              :class="{ active: isAdaptive && !isEraser }"
              @click="isAdaptive = true; isEraser = false"
              title="Adaptive Color (uses selected color when placing)"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <path d="M12 2a10 10 0 0 0 0 20"></path>
              </svg>
            </div>
            
            <!-- Eraser Tool -->
            <div 
              class="color-swatch eraser"
              :class="{ active: isEraser }"
              @click="isEraser = true; isAdaptive = false"
              title="Eraser"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20 20H7L3 16C2 15 2 13 3 12L13 2L22 11L20 20Z"></path>
                <line x1="18" y1="13" x2="13" y2="18"></line>
              </svg>
            </div>
          </div>
        </div>

        <div class="actions">
          <button @click="$emit('close')" class="btn secondary">Cancel</button>
          <button @click="save" class="btn primary" :disabled="!name || isSaving">Save</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: #1e293b;
  padding: 24px;
  border-radius: 16px;
  color: white;
  display: flex;
  flex-direction: column;
  gap: 24px;
  max-width: 90vw;
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
}

h2 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: #f8fafc;
  letter-spacing: -0.025em;
}

.form-group {
  display: flex;
  gap: 10px;
  align-items: center;
}

input {
  background: #334155;
  border: 1px solid #475569;
  color: white;
  padding: 10px 12px;
  border-radius: 8px;
  flex: 1;
  font-family: inherit;
  font-size: 0.95rem;
  transition: all 0.2s;
}

input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
}

label {
  font-weight: 500;
  color: #cbd5e1;
}

.editor-container {
  display: flex;
  gap: 20px;
}

.grid {
  display: flex;
  flex-direction: column;
  background: white;
  border: 1px solid #cbd5e1;
}

.row {
  display: flex;
}

.cell {
  width: 15px;
  height: 15px;
  border: 1px solid rgba(0, 0, 0, 0.05);
  cursor: pointer;
}

.cell:hover {
  border-color: rgba(0, 0, 0, 0.2);
}

.palette {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 5px;
  height: fit-content;
}

.color-swatch {
  width: 25px;
  height: 25px;
  border-radius: 4px;
  cursor: pointer;
  border: 2px solid transparent;
}

.color-swatch.active {
  border-color: white;
  outline: 2px solid #3b82f6;
}

.eraser {
  background-color: #f1f5f9;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #475569;
}

.eraser.active {
  background-color: #e2e8f0;
  color: #0f172a;
  border-color: #3b82f6;
}

.adaptive-color {
  background: linear-gradient(135deg, #3b82f6 0%, #3b82f6 50%, #10b981 50%, #10b981 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.adaptive-color.active {
  outline: 2px solid white;
  border-color: white;
}

.actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.btn {
  padding: 10px 20px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  font-weight: 600;
  font-family: inherit;
  font-size: 0.95rem;
  transition: all 0.2s;
}

.btn.primary {
  background: #3b82f6;
  color: white;
}

.btn.primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn.secondary {
  background: #475569;
  color: white;
}
</style>
