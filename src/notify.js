import { reactive } from 'vue'

export const notifyState = reactive({
  toasts: [],
  confirmModal: {
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Да',
    cancelText: 'Отмена',
    resolve: null
  }
})

let toastId = 0

export const notify = {
  toast(message, type = 'info', duration = 3500) {
    const id = ++toastId
    const item = {
      id,
      message,
      type, // 'success' | 'error' | 'warning' | 'info'
      duration,
      progress: 100
    }
    notifyState.toasts.push(item)

    setTimeout(() => {
      this.removeToast(id)
    }, duration)
    return id
  },

  success(message, duration = 3500) {
    return this.toast(message, 'success', duration)
  },

  error(message, duration = 4000) {
    return this.toast(message, 'error', duration)
  },

  warning(message, duration = 3500) {
    return this.toast(message, 'warning', duration)
  },

  info(message, duration = 3500) {
    return this.toast(message, 'info', duration)
  },

  removeToast(id) {
    const index = notifyState.toasts.findIndex(t => t.id === id)
    if (index !== -1) {
      notifyState.toasts.splice(index, 1)
    }
  },

  confirm(message, title = 'Подтверждение', confirmText = 'Да', cancelText = 'Отмена') {
    return new Promise((resolve) => {
      notifyState.confirmModal = {
        isOpen: true,
        title,
        message,
        confirmText,
        cancelText,
        resolve
      }
    })
  },

  closeConfirm(result) {
    if (notifyState.confirmModal.resolve) {
      notifyState.confirmModal.resolve(result)
    }
    notifyState.confirmModal.isOpen = false
    notifyState.confirmModal.resolve = null
  }
}
