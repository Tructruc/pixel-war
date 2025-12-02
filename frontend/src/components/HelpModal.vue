<script setup>
defineProps(['show']);
defineEmits(['close']);
</script>

<template>
  <div v-if="show" class="modal-overlay" @click="$emit('close')">
    <div class="modal-content" @click.stop>
      <h2>Controls & Hotkeys</h2>
      <div class="hotkeys-list">
        <div class="hotkey-item">
          <kbd>M</kbd>
          <span>Toggle Minimap</span>
        </div>
        <div class="hotkey-item">
          <kbd>H</kbd>
          <span>Toggle Help</span>
        </div>
        <div class="hotkey-item">
          <kbd>R</kbd>
          <span>Rotate Template</span>
        </div>
        <div class="hotkey-item">
          <kbd>Scroll</kbd>
          <span>Zoom In/Out</span>
        </div>
        <div class="hotkey-item">
          <kbd>Drag</kbd>
          <span>Pan Canvas</span>
        </div>
      </div>
      <button class="close-btn" @click="$emit('close')">Close</button>
    </div>
  </div>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 100;
  backdrop-filter: blur(4px);
}

.modal-content {
  background: #1e293b;
  color: #f8fafc;
  padding: 2rem;
  border-radius: 16px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  max-width: 400px;
  width: 90%;
  border: 1px solid #334155;
}

h2 {
  margin-top: 0;
  margin-bottom: 1.5rem;
  text-align: center;
  font-family: 'Inter', sans-serif;
}

.hotkeys-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 2rem;
}

.hotkey-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

kbd {
  background: #334155;
  padding: 0.2rem 0.6rem;
  border-radius: 6px;
  font-family: monospace;
  font-weight: bold;
  border-bottom: 2px solid #1e293b;
  box-shadow: 0 2px 0 #0f172a;
}

.close-btn {
  width: 100%;
  padding: 0.8rem;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.close-btn:hover {
  background: #2563eb;
}
</style>
