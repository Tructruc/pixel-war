<script setup>
import { onMounted, onBeforeUnmount, ref, reactive } from "vue";

const canvas = ref(null);
const ctx = ref(null);
const x_size = 1024;
const y_size = 1024;

// Data
const pixels = ref([
  { x: 10, y: 10, color: "red" },
  { x: 20, y: 20, color: "blue" },
  { x: 30, y: 30, color: "yellow" },
  { x: 40, y: 40, color: "purple" },
  { x: 50, y: 50, color: "orange" },
]);

// Camera state (world top-left and zoom)
const cam = reactive({
  zoom: 30,
  maxZoom: 120,
  viewX: 0,
  viewY: 0,
});

let dragging = false;
let lastClientX = 0;
let lastClientY = 0;

function draw() {
  const c = canvas.value;
  const context = ctx.value;
  if (!c || !context) return;

  context.clearRect(0, 0, c.width, c.height);

  for (const p of pixels.value) {
    context.fillStyle = p.color;
    const sx = (p.x - cam.viewX) * cam.zoom;
    const sy = (p.y - cam.viewY) * cam.zoom;
    context.fillRect(sx, sy, cam.zoom, cam.zoom);
  }
}

function clamp(val, min, max) {
  return Math.min(max, Math.max(min, val));
}

function getMousePos(evt) {
  const rect = canvas.value.getBoundingClientRect();
  return {
    x: evt.clientX - rect.left,
    y: evt.clientY - rect.top,
  };
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
}

function onMouseMove(e) {
  if (!dragging) return;
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

function onMouseUp() {
  dragging = false;
}

function onWheel(e) {
  e.preventDefault();
  const { x, y } = getMousePos(e);
  const factor = e.deltaY < 0 ? 1.1 : 1 / 1.1; // zoom in/out
  zoomAt(x, y, factor);
}

function onDblClick() {
  cam.viewX = 0;
  cam.viewY = 0;
  cam.zoom = 10;
  draw();
}

onMounted(() => {
  ctx.value = canvas.value.getContext("2d");
  draw();

  // listeners
  canvas.value.addEventListener("mousedown", onMouseDown);
  window.addEventListener("mousemove", onMouseMove);
  window.addEventListener("mouseup", onMouseUp);
  canvas.value.addEventListener("wheel", onWheel, { passive: false });
  canvas.value.addEventListener("dblclick", onDblClick);
});

onBeforeUnmount(() => {
  if (!canvas.value) return;
  canvas.value.removeEventListener("mousedown", onMouseDown);
  window.removeEventListener("mousemove", onMouseMove);
  window.removeEventListener("mouseup", onMouseUp);
  canvas.value.removeEventListener("wheel", onWheel);
  canvas.value.removeEventListener("dblclick", onDblClick);
});
</script>

<template>
  <canvas width="1000" height="1000" ref="canvas"></canvas>
</template>

<style scoped>
canvas:active {
  cursor: grabbing;
}

canvas {
  border: 1px solid #ddd;
  cursor: grab;
}
</style>
