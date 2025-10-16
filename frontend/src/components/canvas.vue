<script setup>
import { onMounted, onBeforeUnmount, ref, reactive, watch} from "vue";

// Constants
const x_size = 1024;
const y_size = 1024;
const drag_threshold = 200; // ms

// Defining props and emits
const props = defineProps(["isSelecting", "pixels"]);
const emit = defineEmits(["selected_pixel"]);

// Refs
const canvas = ref(null);
const ctx = ref(null);

const cam = reactive({
  zoom: 30,
  maxZoom: 200,
  viewX: 0,
  viewY: 0,
});

// Variables
let dragging = false;
let lastClientX = 0;
let lastClientY = 0;
let clickStartTime = 0;

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

function draw() {
  const c = canvas.value;
  const context = ctx.value;
  if (!c || !context) return;

  context.clearRect(0, 0, c.width, c.height);

  for (const p of props.pixels) {
    context.fillStyle = p.color;
    const sx = (p.x - cam.viewX) * cam.zoom;
    const sy = (p.y - cam.viewY) * cam.zoom;
    context.fillRect(sx, sy, cam.zoom, cam.zoom);
  }
}

function zoomAt(mouseX, mouseY, factor) {
  const oldZoom = cam.zoom;
  const newZoom = clamp(oldZoom * factor, 0, cam.maxZoom);
  if (newZoom === oldZoom) return;

  const newX = clamp(cam.viewX - mouseX / newZoom + mouseX / oldZoom, 0, x_size - canvas.value.width / newZoom);
  const newY = clamp(cam.viewY - mouseY / newZoom + mouseY / oldZoom, 0, y_size - canvas.value.height / newZoom);

  if (newX < 0 || newX >= x_size - canvas.value.width / newZoom) return;
  if (newY < 0 || newY >= y_size - canvas.value.height / newZoom) return;

  cam.zoom = newZoom;

  cam.viewX = newX;
  cam.viewY = newY;

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
      context.strokeStyle = "black";
      context.lineWidth = 2;
      context.strokeRect(
        Math.floor(cam.viewX + x / cam.zoom) * cam.zoom - cam.viewX * cam.zoom,
        Math.floor(cam.viewY + y / cam.zoom) * cam.zoom - cam.viewY * cam.zoom,
        cam.zoom,
        cam.zoom
      );
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
  draw();

  canvas.value.addEventListener("mousedown", onMouseDown);
  window.addEventListener("mousemove", onMouseMove);
  window.addEventListener("mouseup", onMouseUp);
  canvas.value.addEventListener("wheel", onWheel, { passive: false });
  //canvas.value.addEventListener("dblclick", onDblClick);
});

onBeforeUnmount(() => {
  if (!canvas.value) return;
  canvas.value.removeEventListener("mousedown", onMouseDown);
  window.removeEventListener("mousemove", onMouseMove);
  window.removeEventListener("mouseup", onMouseUp);
  canvas.value.removeEventListener("wheel", onWheel);
  //canvas.value.removeEventListener("dblclick", onDblClick);
});
</script>

<template>
  <canvas width="1000" height="800" ref="canvas"></canvas>
</template>

<style scoped>
canvas {
  border: 1px solid #ddd;
}
</style>
