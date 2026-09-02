<template>
  <div class="toast-container">
    <transition-group name="toast">
      <div 
        v-for="toast in toasts" 
        :key="toast.id" 
        class="toast-card" 
        :class="toast.type"
        @click="remove(toast.id)"
      >
        <div class="toast-icon">
          <span v-if="toast.type === 'success'">✅</span>
          <span v-else-if="toast.type === 'error'">❌</span>
          <span v-else-if="toast.type === 'warning'">⚠️</span>
          <span v-else>ℹ️</span>
        </div>
        <div class="toast-content">
          <div class="toast-message">{{ toast.message }}</div>
        </div>
        <button class="toast-close" @click.stop="remove(toast.id)">×</button>
      </div>
    </transition-group>
  </div>
</template>

<script>
import { notifyState, notify } from '../notify.js'

export default {
  name: 'NotificationToast',
  computed: {
    toasts() {
      return notifyState.toasts
    }
  },
  methods: {
    remove(id) {
      notify.removeToast(id)
    }
  }
}
</script>

<style scoped>
.toast-container {
  position: fixed;
  top: 24px;
  right: 24px;
  z-index: 99999;
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-width: 420px;
  width: calc(100vw - 48px);
  pointer-events: none;
}

.toast-card {
  pointer-events: auto;
  display: flex;
  align-items: center;
  gap: 12px;
  background: rgba(20, 20, 20, 0.94);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-radius: 14px;
  padding: 14px 18px;
  box-shadow: 0 12px 36px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.08);
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
  position: relative;
}

.toast-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 16px 44px rgba(0, 0, 0, 0.6);
}

.toast-icon {
  font-size: 20px;
  flex-shrink: 0;
}

.toast-content {
  flex: 1;
  font-size: 14px;
  font-weight: 500;
  line-height: 1.4;
  color: var(--text-primary);
}

.toast-close {
  background: none;
  border: none;
  color: var(--text-muted);
  font-size: 20px;
  cursor: pointer;
  padding: 0 4px;
  line-height: 1;
  transition: color 0.2s;
}

.toast-close:hover {
  color: var(--text-primary);
}

/* Стили по типам */
.toast-card.success {
  border-left: 4px solid var(--accent);
  box-shadow: 0 12px 36px rgba(0, 0, 0, 0.5), 0 0 20px rgba(0, 255, 136, 0.15);
}

.toast-card.error {
  border-left: 4px solid #ff4444;
  box-shadow: 0 12px 36px rgba(0, 0, 0, 0.5), 0 0 20px rgba(255, 68, 68, 0.15);
}

.toast-card.warning {
  border-left: 4px solid #ffaa00;
  box-shadow: 0 12px 36px rgba(0, 0, 0, 0.5), 0 0 20px rgba(255, 170, 0, 0.15);
}

.toast-card.info {
  border-left: 4px solid #667eea;
}

/* Анимации */
.toast-enter-active {
  animation: toastIn 0.35s cubic-bezier(0.2, 0.9, 0.3, 1.2);
}

.toast-leave-active {
  animation: toastOut 0.25s ease-in forwards;
}

@keyframes toastIn {
  from {
    opacity: 0;
    transform: translateX(40px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateX(0) scale(1);
  }
}

@keyframes toastOut {
  from {
    opacity: 1;
    transform: scale(1);
    max-height: 100px;
    margin-bottom: 0;
  }
  to {
    opacity: 0;
    transform: scale(0.9);
    max-height: 0;
    margin-bottom: -12px;
    padding-top: 0;
    padding-bottom: 0;
  }
}

@media (max-width: 480px) {
  .toast-container {
    top: 12px;
    right: 12px;
    left: 12px;
    width: auto;
  }
}
</style>
