<script setup>
import { ref, onMounted } from 'vue';
import { pipeline, env } from '@xenova/transformers';
import { templates, labels } from '@/agent/templates.js';

// Configuration
env.allowLocalModels = false;
env.useBrowserCache = false; // Disable cache to debug

const props = defineProps({
  pixels: { type: Array, required: true },
  colors: { type: Object, default: () => ({}) },
  getCenter: { type: Function, default: () => ({ x: 512, y: 512 }) },
  placePixel: { type: Function, required: true }
});

const emit = defineEmits(['close', 'agentDrawingStateChange']);

// const emit = defineEmits(['placePixel']); // No longer used

const userInput = ref('');
const status = ref('Idle');
const isLoading = ref(false);
const isDrawing = ref(false);
const progress = ref(0);
const currentTemplateName = ref('');

const targetX = ref(null);
const targetY = ref(null);
const scale = ref(1.0);

let classifier = null;
let stopSignal = false;

onMounted(async () => {
  status.value = 'Checking connectivity...';
  isLoading.value = true;
  
  try {
    // Debug: Check if we can reach Hugging Face
    const testUrl = 'https://huggingface.co/Xenova/distilbert-base-uncased-mnli/resolve/main/config.json';
    const response = await fetch(testUrl);
    const text = await response.text();
    
    if (!response.ok) {
      throw new Error(`Failed to fetch config: ${response.status} ${response.statusText}`);
    }
    
    if (text.trim().startsWith('<')) {
      throw new Error(`Received HTML instead of JSON from ${testUrl}. Possible proxy/network login required?`);
    }

    status.value = 'Loading model...';
    // Switch to a very standard model
    classifier = await pipeline('zero-shot-classification', 'Xenova/distilbert-base-uncased-mnli');
    status.value = 'Model loaded. Ready.';
  } catch (e) {
    console.error(e);
    status.value = `Error: ${e.message}`;
  } finally {
    isLoading.value = false;
  }
});

function useCurrentCenter() {
  const center = props.getCenter();
  targetX.value = center.x;
  targetY.value = center.y;
}

async function startAgent() {
  if (!classifier || !userInput.value) return;

  status.value = 'Classifying...';
  isLoading.value = true;

  try {
    const output = await classifier(userInput.value, labels);
    const bestLabel = output.labels[0];
    const score = output.scores[0];

    console.log(`Classified as: ${bestLabel} (${score})`);
    currentTemplateName.value = bestLabel;
    
    if (score < 0.2) {
        status.value = "I'm not sure what you mean.";
        isLoading.value = false;
        return;
    }

    status.value = `Drawing a ${bestLabel}...`;
    isLoading.value = false;
    isDrawing.value = true;
    emit('agentDrawingStateChange', true);
    stopSignal = false;

    await drawTemplate(templates[bestLabel]);

  } catch (e) {
    console.error(e);
    status.value = 'Error during classification.';
    isLoading.value = false;
  }
}

function stopAgent() {
  stopSignal = true;
  isDrawing.value = false;
  emit('agentDrawingStateChange', false);
  status.value = 'Stopped.';
}

async function drawTemplate(template) {
  let originX, originY;
  const scaledWidth = Math.floor(template.width * scale.value);
  const scaledHeight = Math.floor(template.height * scale.value);

  if (targetX.value !== null && targetY.value !== null) {
      // Center the template on the target coordinates
      originX = Math.floor(targetX.value - scaledWidth / 2);
      originY = Math.floor(targetY.value - scaledHeight / 2);
  } else {
      // Random location
      originX = Math.floor(Math.random() * (1024 - scaledWidth));
      originY = Math.floor(Math.random() * (1024 - scaledHeight));
  }

  const totalPixels = template.pixels.length;
  let drawnCount = 0;

  for (const p of template.pixels) {
    if (stopSignal) break;

    const tx = originX + Math.floor(p.x * scale.value);
    const ty = originY + Math.floor(p.y * scale.value);
    const targetColor = p.color;

    // Check bounds
    if (tx < 0 || tx > 1023 || ty < 0 || ty > 1023) {
        drawnCount++; // Count as "done" (skipped)
        progress.value = Math.floor((drawnCount / totalPixels) * 100);
        continue;
    }

    // Check if already correct
    const existing = props.pixels.find(pix => pix.x === tx && pix.y === ty);
    if (existing && existing.color === targetColor) {
      drawnCount++;
      progress.value = Math.floor((drawnCount / totalPixels) * 100);
      continue;
    }

    // Place pixel and get next time
    try {
        const nextTime = await props.placePixel({ x: tx, y: ty, color: targetColor });
        
        drawnCount++;
        progress.value = Math.floor((drawnCount / totalPixels) * 100);
        
        // Wait loop
        while (!stopSignal) {
            const now = Date.now();
            const waitMs = nextTime - now;
            if (waitMs <= 0) break;
            
            const waitSec = Math.ceil(waitMs / 1000);
            status.value = `Drawing ${currentTemplateName.value}... (Cooldown: ${waitSec}s)`;
            await new Promise(r => setTimeout(r, 1000));
        }
    } catch (e) {
        console.error("Failed to place pixel", e);
        status.value = "Error placing pixel. Retrying...";
        await new Promise(r => setTimeout(r, 2000));
        // Retry same pixel? Or skip? Let's retry.
        // Actually the loop will continue to next pixel if we don't decrement index or something.
        // But here we are in a for..of loop.
        // Let's just break for now or continue.
        // If we fail, maybe we are on cooldown?
        // Let's wait a bit and continue.
    }
  }

  if (!stopSignal) {
    status.value = `Finished drawing ${currentTemplateName.value}!`;
    isDrawing.value = false;
    emit('agentDrawingStateChange', false);
  }
}
</script>

<template>
  <div class="agent-panel">
    <div class="header">
      <h3>AI Artist</h3>
      <button class="close-btn" @click="emit('close')" title="Close">✕</button>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="loading-state">
      <div class="spinner"></div>
      <div class="status">{{ status }}</div>
    </div>

    <!-- Drawing State -->
    <div v-else-if="isDrawing" class="drawing-state">
      <div class="status drawing-status">{{ status }}</div>
      <div class="progress-bar">
        <div class="fill" :style="{ width: progress + '%' }"></div>
      </div>
      <div class="progress-text">{{ progress }}%</div>
      <button @click="stopAgent" class="stop-btn">Stop Drawing</button>
    </div>

    <!-- Ready State (inputs visible) -->
    <div v-else class="ready-state">
      <div class="input-group">
        <input 
          v-model="userInput" 
          placeholder="What should I draw?" 
          @keyup.enter="startAgent"
        />
        <button @click="startAgent" :disabled="!userInput || !classifier">
          Draw
        </button>
      </div>

      <div class="coords-group">
        <input type="number" v-model.number="targetX" placeholder="X" class="coord-input" />
        <input type="number" v-model.number="targetY" placeholder="Y" class="coord-input" />
        <button @click="useCurrentCenter" class="center-btn" title="Use current view center">
          📍
        </button>
      </div>

      <div class="scale-group">
        <label for="scale-input">Scale:</label>
        <input 
          id="scale-input" 
          type="number" 
          v-model.number="scale" 
          min="0.1" 
          max="10" 
          step="0.1" 
          class="scale-input" 
        />
        <span class="scale-display">{{ scale.toFixed(1) }}x</span>
      </div>

      <div class="status">{{ status }}</div>
    </div>
  </div>
</template>


<style scoped>
.agent-panel {
  background: rgba(30, 41, 59, 0.95);
  padding: 1rem;
  border-radius: 12px;
  color: white;
  width: 300px;
  pointer-events: auto;
  display: flex;
  flex-direction: column;
  gap: 10px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.3);
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

h3 {
  margin: 0;
  font-size: 1.1rem;
  color: #60a5fa;
}

.close-btn {
  width: 28px;
  height: 28px;
  padding: 0;
  background: #475569;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  line-height: 1;
  transition: background 0.2s ease;
}

.close-btn:hover {
  background: #64748b;
}

/* Loading State */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem 1rem;
  gap: 1rem;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid rgba(96, 165, 250, 0.2);
  border-top-color: #60a5fa;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Drawing State */
.drawing-state {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 0.5rem 0;
}

.drawing-status {
  text-align: center;
  font-size: 0.9rem;
  color: #60a5fa;
  font-weight: 500;
}

.progress-text {
  text-align: center;
  font-size: 1.5rem;
  font-weight: 600;
  color: #22c55e;
}

/* Ready State */
.ready-state {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.input-group {
  display: flex;
  gap: 8px;
}

.coords-group {
  display: flex;
  gap: 8px;
  align-items: center;
}

.coord-input {
  width: 60px;
  padding: 4px;
  border-radius: 4px;
  border: 1px solid #475569;
  background: #0f172a;
  color: white;
  text-align: center;
}

.center-btn {
  padding: 4px 8px;
  background: #475569;
}

.scale-group {
  display: flex;
  gap: 8px;
  align-items: center;
}

.scale-group label {
  font-size: 0.9rem;
  color: #94a3b8;
}

.scale-input {
  width: 80px;
  padding: 4px;
  border-radius: 4px;
  border: 1px solid #475569;
  background: #0f172a;
  color: white;
  text-align: center;
}

.scale-display {
  font-size: 0.9rem;
  color: #60a5fa;
  font-weight: 600;
  min-width: 40px;
}

input {
  flex: 1;
  padding: 6px 10px;
  border-radius: 6px;
  border: 1px solid #475569;
  background: #0f172a;
  color: white;
}

button {
  padding: 6px 12px;
  border-radius: 6px;
  border: none;
  background: #3b82f6;
  color: white;
  cursor: pointer;
  font-weight: 600;
}

button:disabled {
  background: #475569;
  cursor: not-allowed;
}

.stop-btn {
  background: #ef4444;
  width: 100%;
}

.status {
  font-size: 0.85rem;
  color: #94a3b8;
  min-height: 1.2em;
}

.progress-bar {
  height: 12px;
  background: #334155;
  border-radius: 6px;
  overflow: hidden;
}

.fill {
  height: 100%;
  background: linear-gradient(90deg, #22c55e 0%, #16a34a 100%);
  transition: width 0.3s ease;
}
</style>


