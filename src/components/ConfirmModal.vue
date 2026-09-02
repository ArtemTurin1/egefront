<template>
  <transition name="modal-fade">
    <div v-if="modal.isOpen" class="custom-modal-backdrop" @click.self="cancel">
      <div class="custom-modal-box">
        <div class="modal-header">
          <div class="modal-icon">❓</div>
          <h3>{{ modal.title || 'Подтверждение' }}</h3>
        </div>
        <div class="modal-body">
          <p>{{ modal.message }}</p>
        </div>
        <div class="modal-actions">
          <button class="button ghost" @click="cancel">
            {{ modal.cancelText || 'Отмена' }}
          </button>
          <button class="button confirm-btn" @click="confirm">
            {{ modal.confirmText || 'Подтвердить' }}
          </button>
        </div>
      </div>
    </div>
  </transition>
</template>

<script>
import { notifyState, notify } from '../notify.js'

export default {
  name: 'ConfirmModal',
  computed: {
    modal() {
      return notifyState.confirmModal
    }
  },
  methods: {
    confirm() {
      notify.closeConfirm(true)
    },
    cancel() {
      notify.closeConfirm(false)
    }
  }
}
</script>

<style scoped>
.custom-modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100000;
  padding: 20px;
}

.custom-modal-box {
  background: #141414;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 20px;
  max-width: 440px;
  width: 100%;
  padding: 24px;
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.6), 0 0 30px rgba(0, 255, 136, 0.1);
  transform: translateY(0);
}

.modal-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 14px;
}

.modal-icon {
  font-size: 24px;
  background: rgba(0, 255, 136, 0.1);
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(0, 255, 136, 0.2);
}

.modal-header h3 {
  font-size: 18px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

.modal-body p {
  color: var(--text-secondary);
  font-size: 14px;
  line-height: 1.5;
  margin: 0 0 24px 0;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.confirm-btn {
  background: var(--gradient-primary);
  color: #000;
  font-weight: 700;
}

/* Анимации */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: all 0.25s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.modal-fade-enter-from .custom-modal-box,
.modal-fade-leave-to .custom-modal-box {
  transform: scale(0.95) translateY(10px);
}
</style>
