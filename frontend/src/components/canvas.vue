<script setup>
import { onMounted, onBeforeUnmount, ref, reactive, watch} from "vue";
import colors from '@/constants/colors.js'
import { templates } from '@/constants/templates.js'

// Constants
const x_size = 1024;
const y_size = 1024;
const drag_threshold = 200; // ms
const pixel_overlap = 0.5;

// Defining props and emits
const props = defineProps(["isSelecting", "pixels", "currentTemplate", "rotation"]);
const emit = defineEmits(["selected_pixel", "rotate_shape"]);

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
let rafId = null;
let needsRedraw = false;

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

function requestRedraw() {
  if (needsRedraw) return;
  needsRedraw = true;
  rafId = requestAnimationFrame(() => {
    draw();
    needsRedraw = false;
  });
}

function draw() {
  const c = canvas.value;
  const context = ctx.value;
  if (!c || !context) return;

  context.clearRect(0, 0, c.width, c.height);

  // To prevent anti-aliasing artifacts
  context.imageSmoothingEnabled = false;

  // Viewport culling: only render visible pixels
  const minX = Math.floor(cam.viewX);
  const maxX = Math.ceil(cam.viewX + c.width / cam.zoom);
  const minY = Math.floor(cam.viewY);
  const maxY = Math.ceil(cam.viewY + c.height / cam.zoom);

  for (const p of props.pixels) {
    // Skip pixels outside viewport
    if (p.x < minX || p.x > maxX || p.y < minY || p.y > maxY) continue;
    
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

  requestRedraw();
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

function rotatePoint(x, y, r) {
  switch (r) {
    case 1: return { x: -y, y: x }
    case 2: return { x: -x, y: -y }
    case 3: return { x: y, y: -x }
    default: return { x, y }
  }
}

function onMouseMove(e) {
  if (!dragging) {
    if (props.isSelecting && canvas.value) {
      const { x, y } = getMousePos(e);
      const context = ctx.value;
      // Must call draw() directly for preview, not requestRedraw()
      // because we need to draw the preview strokes synchronously on top
      draw();
      context.strokeStyle = "black";
      context.lineWidth = 2;

      const baseWorldX = Math.floor(cam.viewX + x / cam.zoom);
      const baseWorldY = Math.floor(cam.viewY + y / cam.zoom);

      const shapePixels = templates[props.currentTemplate || 'Pixel'] || templates['Pixel'];

      for (const p of shapePixels) {
        const rotated = rotatePoint(p.x, p.y, props.rotation || 0);
        const targetX = baseWorldX + rotated.x;
        const targetY = baseWorldY + rotated.y;
        
        // Only draw if within bounds (optional, but good for visual clarity)
        // if (targetX < 0 || targetX >= x_size || targetY < 0 || targetY >= y_size) continue;

        context.strokeRect(
          targetX * cam.zoom - cam.viewX * cam.zoom,
          targetY * cam.zoom - cam.viewY * cam.zoom,
          cam.zoom,
          cam.zoom
        );
      }
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

  requestRedraw();
}

function onMouseUp(e) {
  dragging = false;
  const clickDuration = Date.now() - clickStartTime;

  if (canvas.value) {
    canvas.value.style.cursor = props.isSelecting ? "default" : "grab";
  }

  if (clickDuration < drag_threshold && props.isSelecting) {
    const { x, y } = getMousePos(e);

    // Convert to world/grid coords by offsetting with camera and dividing by zoom
    const worldX = clamp(Math.floor(cam.viewX + x / cam.zoom), 0, x_size - 1);
    const worldY = clamp(Math.floor(cam.viewY + y / cam.zoom), 0, y_size - 1);

    emit("selected_pixel", { x: worldX, y: worldY });
  }
}


function onContextMenu(e) {
  e.preventDefault();
  if (props.isSelecting) {
    emit("rotate_shape");
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
    if (newVal) {
      if (canvas.value) {
        canvas.value.style.cursor = "default";
      }
    } else {
      if (canvas.value) {
        canvas.value.style.cursor = "grab";
        requestRedraw()
      }
    }
  }
)

watch(
  () => props.pixels,
  () => {
    requestRedraw();
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
  canvas.value.addEventListener("contextmenu", onContextMenu);
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", resizeCanvas);
  
  // Cancel pending animation frame
  if (rafId !== null) {
    cancelAnimationFrame(rafId);
  }
  
  if (resizeObserver) {
    resizeObserver.disconnect();
  }
  
  if (!canvas.value) return;
  canvas.value.removeEventListener("mousedown", onMouseDown);
  window.removeEventListener("mousemove", onMouseMove);
  window.removeEventListener("mouseup", onMouseUp);
  canvas.value.removeEventListener("wheel", onWheel);
  canvas.value.removeEventListener("contextmenu", onContextMenu);
});
</script>

<template>
  <canvas ref="canvas"></canvas>
</template>

<style scoped>
canvas {
  display: block;
  width: 100%;
  height: 100%;
  cursor: grab;
}
</style>
