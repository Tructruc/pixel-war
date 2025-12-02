<script setup>
defineProps({
  title: {
    type: String,
    default: 'Confirm Action'
  },
  message: {
    type: String,
    required: true
  },
  confirmText: {
    type: String,
    default: 'Confirm'
  },
  cancelText: {
    type: String,
    default: 'Cancel'
  },
  isDestructive: {
    type: Boolean,
    default: false
  }
})

defineEmits(['confirm', 'cancel'])
</script>

<template>
  <Teleport to="body">
    <div class="modal-overlay" @click.self="$emit('cancel')">
      <div class="modal-content">
        <h2>{{ title }}</h2>
        <p>{{ message }}</p>
        
        <div class="actions">
          <button @click="$emit('cancel')" class="btn secondary">{{ cancelText }}</button>
          <button 
            @click="$emit('confirm')" 
            class="btn"
            :class="isDestructive ? 'destructive' : 'primary'"
          >
            {{ confirmText }}
          </button>
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
  z-index: 2000;
  backdrop-filter: blur(2px);
}

.modal-content {
  background: #1e293b;
  padding: 24px;
  border-radius: 16px;
  color: white;
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-width: 400px;
  width: 90vw;
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  border: 1px solid #334155;
}

h2 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #f8fafc;
  letter-spacing: -0.025em;
}

p {
  margin: 0;
  color: #cbd5e1;
  line-height: 1.5;
  font-size: 0.95rem;
}

.actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 8px;
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

.btn.primary:hover {
  background: #2563eb;
}

.btn.destructive {
  background: #ef4444;
  color: white;
}

.btn.destructive:hover {
  background: #dc2626;
}

.btn.secondary {
  background: #334155;
  color: #e2e8f0;
}

.btn.secondary:hover {
  background: #475569;
}
</style>
