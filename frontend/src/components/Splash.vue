<template>
  <div class="splash-container">
    <img src="/Big_log_o.png" alt="Logo" class="splash-logo" />
  </div>
</template>

<style scoped>
.splash-container {
  display: flex;
  justify-content: center;
  align-items: center;
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: #ffffff;
  z-index: 9999;
}

.splash-logo {
  max-width: 80%;
  max-height: 80%;
  animation: fade-in 1.3s ease-in-out;
}

@keyframes fade-in {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
</style>
