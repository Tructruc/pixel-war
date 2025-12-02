<script setup>
import { ref, onMounted, watch, onBeforeUnmount } from 'vue';
import { useCamera } from '@/composables/useCamera.js';
import colors from '@/constants/colors.js';

const props = defineProps(['pixels']);
const { cam, setView } = useCamera();

const canvas = ref(null);
const ctx = ref(null);
const x_size = 1024;
const y_size = 1024;

let rafId = null;

function draw() {
  if (!canvas.value || !ctx.value) return;
  
  const c = canvas.value;
  const context = ctx.value;
  
  context.clearRect(0, 0, c.width, c.height);
  
  context.fillStyle = '#eee';
  context.fillRect(0, 0, c.width, c.height);
  
  const scaleX = c.width / x_size;
  const scaleY = c.height / y_size;
  
  for (const p of props.pixels) {
    context.fillStyle = colors.colors[p.color];
    context.fillRect(p.x * scaleX, p.y * scaleY, Math.max(1, scaleX), Math.max(1, scaleY));
  }
  
  context.strokeStyle = '#3b82f6';
  context.lineWidth = 2;
  context.shadowColor = 'rgba(59, 130, 246, 0.5)';
  context.shadowBlur = 4;
  
  const viewportW = window.innerWidth / cam.zoom;
  const viewportH = window.innerHeight / cam.zoom;
  
  context.strokeRect(
    cam.viewX * scaleX,
    cam.viewY * scaleY,
    viewportW * scaleX,
    viewportH * scaleY
  );
  
  context.shadowBlur = 0;
}

function onMouseDown(e) {
  if (!canvas.value) return;
  const rect = canvas.value.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  
  const scaleX = canvas.value.width / x_size;
  const scaleY = canvas.value.height / y_size;
  
  const worldX = x / scaleX;
  const worldY = y / scaleY;
  
  const viewportW = window.innerWidth / cam.zoom;
  const viewportH = window.innerHeight / cam.zoom;
  
  setView(worldX - viewportW / 2, worldY - viewportH / 2, window.innerWidth, window.innerHeight);
}

watch(
  () => props.pixels,
  () => {
    requestAnimationFrame(draw);
  },
  { deep: true }
);

watch(
  cam,
  () => {
    requestAnimationFrame(draw);
  }
);

onMounted(() => {
  ctx.value = canvas.value.getContext('2d');
  draw();
  window.addEventListener('resize', draw);
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', draw);
  if (rafId) cancelAnimationFrame(rafId);
});

</script>

<template>
  <div class="minimap-container">
    <canvas 
      ref="canvas" 
      width="200" 
      height="200"
      @mousedown="onMouseDown"
    ></canvas>
  </div>
</template>

<style scoped>
.minimap-container {
  background-color: #1e293b;
  border: 1px solid #334155;
  padding: 4px;
  border-radius: 8px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  cursor: pointer;
  transition: border-color 0.2s;
}

.minimap-container:hover {
  border-color: #475569;
}

canvas {
  display: block;
  border-radius: 4px;
  background-color: #f1f5f9;
}
</style>
