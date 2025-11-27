<script setup>
import { onMounted, onBeforeUnmount, ref, reactive, watch} from "vue";
import colors from '@/constants/colors.js'

// Constants
const x_size = 1024;
const y_size = 1024;
const drag_threshold = 200; // ms
const pixel_overlap = 0.5;

// Defining props and emits
const props = defineProps(["isSelecting", "pixels", "isAgentDrawing"]);
const emit = defineEmits(["selected_pixel"]);

// Refs
const canvas = ref(null);
const ctx = ref(null);

const cam = reactive({
  zoom: 30,
  maxZoom: 200,
  minZoom: 1,
  viewX: 0,
  viewY: 0,
});

// Variables
let dragging = false;
let lastClientX = 0;
let lastClientY = 0;
let clickStartTime = 0;
let resizeObserver = null;
let coordHideTimeout = null;

// Coordinate display
const showCoords = ref(false);
const coordX = ref(0);
const coordY = ref(0);

// Helpers
function clamp(val, min, max) {
  return Math.min(max, Math.max(min, val));
}

function getMousePos(evt) {
  const c = canvas.value;
  const rect = c.getBoundingClientRect();
  // scale from CSS pixels to canvas pixels (handles zoom, CSS scaling, DPR)
  const scaleX = c.width / rect.width;
  const scaleY = c.height / rect.height;
  return {
    x: (evt.clientX - rect.left) * scaleX,
    y: (evt.clientY - rect.top) * scaleY,
  };
}

function resizeCanvas() {
  const c = canvas.value;
  if (!c) return;

  c.width = window.innerWidth;
  c.height = window.innerHeight;

  draw();
}

function draw() {
  const c = canvas.value;
  const context = ctx.value;
  if (!c || !context) return;

  context.clearRect(0, 0, c.width, c.height);

  // To prevent anti-aliasing artifacts
  context.imageSmoothingEnabled = false;

  for (const p of props.pixels) {
    context.fillStyle = colors.colors[p.color];
    const sx = (p.x - cam.viewX) * cam.zoom;
    const sy = (p.y - cam.viewY) * cam.zoom;
    context.fillRect(sx, sy, cam.zoom + pixel_overlap, cam.zoom + pixel_overlap);
  }
}

function zoomAt(mouseX, mouseY, factor) {
  const oldZoom = cam.zoom;
  const newZoom = clamp(oldZoom * factor, cam.minZoom, cam.maxZoom);
  if (newZoom === oldZoom) return;

  const newX = cam.viewX - mouseX / newZoom + mouseX / oldZoom;
  const newY = cam.viewY - mouseY / newZoom + mouseY / oldZoom;

  // Calculate max view bounds (how far we can see based on zoom)
  const maxViewX = Math.max(0, x_size - canvas.value.width / newZoom);
  const maxViewY = Math.max(0, y_size - canvas.value.height / newZoom);

  // Clamp the view position to valid bounds
  cam.viewX = clamp(newX, 0, maxViewX);
  cam.viewY = clamp(newY, 0, maxViewY);
  cam.zoom = newZoom;

  draw();
}

function onMouseDown(e) {
  dragging = true;
  lastClientX = e.clientX;
  lastClientY = e.clientY;
  clickStartTime = Date.now();
  if (canvas.value) {
    canvas.value.style.cursor = "grabbing";
  }
}

function onMouseMove(e) {
  if (!dragging) {
    if (props.isSelecting && canvas.value) {
      const { x, y } = getMousePos(e);
      const context = ctx.value;
      draw();
      
      const worldX = Math.floor(cam.viewX + x / cam.zoom);
      const worldY = Math.floor(cam.viewY + y / cam.zoom);
      const rectX = worldX * cam.zoom - cam.viewX * cam.zoom;
      const rectY = worldY * cam.zoom - cam.viewY * cam.zoom;
      
      // Use red color if agent is drawing, black otherwise
      context.strokeStyle = props.isAgentDrawing ? "red" : "black";
      context.lineWidth = 2;
      context.strokeRect(rectX, rectY, cam.zoom, cam.zoom);
      
      // Update coordinates and show them
      coordX.value = worldX;
      coordY.value = worldY;
      showCoords.value = true;
      
      // Clear existing timeout and set new one
      if (coordHideTimeout) clearTimeout(coordHideTimeout);
      coordHideTimeout = setTimeout(() => {
        showCoords.value = false;
      }, 2000); // Hide after 2 seconds
    }

    return;
  }
  const dx = e.clientX - lastClientX;
  const dy = e.clientY - lastClientY;

  const viewX = cam.viewX - dx / cam.zoom;
  const viewY = cam.viewY - dy / cam.zoom;

  lastClientX = e.clientX;
  lastClientY = e.clientY;

  if (viewX < 0 || viewX >= x_size - canvas.value.width / cam.zoom) return;
  if (viewY < 0 || viewY >= y_size - canvas.value.height / cam.zoom) return;

  cam.viewX = viewX;

  cam.viewY = viewY;

  draw();
}

function onMouseUp(e) {
  dragging = false;
  const clickDuration = Date.now() - clickStartTime;

  if (canvas.value) {
    // Restore cursor based on state
    if (props.isSelecting) {
      canvas.value.style.cursor = props.isAgentDrawing ? "not-allowed" : "default";
    } else {
      canvas.value.style.cursor = "grab";
    }
  }

  // Prevent pixel placement if agent is drawing
  if (clickDuration < drag_threshold && props.isSelecting && !props.isAgentDrawing) {
    const { x, y } = getMousePos(e);

    // Convert to world/grid coords by offsetting with camera and dividing by zoom
    const worldX = clamp(Math.floor(cam.viewX + x / cam.zoom), 0, x_size - 1);
    const worldY = clamp(Math.floor(cam.viewY + y / cam.zoom), 0, y_size - 1);

    emit("selected_pixel", { x: worldX, y: worldY });
  }
}


function onWheel(e) {
  e.preventDefault();
  const { x, y } = getMousePos(e);
  const factor = e.deltaY < 0 ? 1.1 : 1 / 1.1; // zoom in/out
  zoomAt(x, y, factor);
}

// Watchers
watch(
  () => props.isSelecting,
  (newVal) => {
    if (canvas.value) {
      if (newVal) {
        // Selection mode: default or not-allowed if agent drawing
        canvas.value.style.cursor = props.isAgentDrawing ? "not-allowed" : "default";
      } else {
        // Panning mode: grab
        canvas.value.style.cursor = "grab";
        draw();
      }
    }
  }
)

watch(
  () => props.pixels,
  () => {
    draw();
  },
  { deep: true }
)

// Hooks
onMounted(() => {
  ctx.value = canvas.value.getContext("2d");
  
  resizeCanvas();
  
  window.addEventListener("resize", resizeCanvas);
  
  // Use ResizeObserver for more precise resize detection
  resizeObserver = new ResizeObserver(() => {
    resizeCanvas();
  });
  resizeObserver.observe(canvas.value);

  canvas.value.addEventListener("mousedown", onMouseDown);
  window.addEventListener("mousemove", onMouseMove);
  window.addEventListener("mouseup", onMouseUp);
  canvas.value.addEventListener("wheel", onWheel, { passive: false });
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", resizeCanvas);
  
  if (resizeObserver) {
    resizeObserver.disconnect();
  }
  
  if (!canvas.value) return;
  canvas.value.removeEventListener("mousedown", onMouseDown);
  window.removeEventListener("mousemove", onMouseMove);
  window.removeEventListener("mouseup", onMouseUp);
  canvas.value.removeEventListener("wheel", onWheel);
});
// Expose helper to get current center in world coordinates
function getCenter() {
  const c = canvas.value;
  if (!c) return { x: 512, y: 512 };
  
  // Center of screen in pixels
  const cx = c.width / 2;
  const cy = c.height / 2;
  
  // Convert to world coords
  const worldX = Math.floor(cam.viewX + cx / cam.zoom);
  const worldY = Math.floor(cam.viewY + cy / cam.zoom);
  
  return { x: clamp(worldX, 0, x_size), y: clamp(worldY, 0, y_size) };
}

defineExpose({ getCenter });
</script>

<template>
  <div class="canvas-container">
    <canvas ref="canvas"></canvas>
    <div v-if="showCoords" class="coord-display">
      ({{ coordX }}, {{ coordY }})
    </div>
  </div>
</template>

<style scoped>
.canvas-container {
  position: relative;
  width: 100%;
  height: 100%;
}

canvas {
  display: block;
  width: 100%;
  height: 100%;
  cursor: grab; /* Default to grab, but overridden by JS */
}

.coord-display {
  position: absolute;
  bottom: 20px;
  left: 20px;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 8px 16px;
  border-radius: 6px;
  font-family: 'Courier New', monospace;
  font-size: 14px;
  font-weight: 600;
  pointer-events: none;
  z-index: 10;
  animation: fadeIn 0.2s ease-in;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
