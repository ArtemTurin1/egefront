<template>
  <div class="page">
    <div class="register-container">
      <div class="card register-card">
        <h1 style="margin-top: 0; text-align: center;">PlayEx 📚</h1>
        <div class="muted" style="text-align: center; margin-bottom: 28px;">
          Выберите способ входа
        </div>

        <!-- ИНСТРУКЦИЯ ПО РЕГИСТРАЦИИ -->
        <div class="instruction-box">
          <h3 style="margin: 0 0 12px 0;">📖 Как начать?</h3>
          <ol class="instruction-list">
            <li><strong>Новый пользователь?</strong> Откройте <a href="https://t.me/ege_playex_bot" target="_blank" class="bot-link">@ege_playex_bot</a> и нажмите «📝 Получить код»</li>
            <li><strong>Вход на другом устройстве?</strong> Используйте тот же код что раньше</li>
            <li>Вставьте код ниже и готово!</li>
          </ol>
        </div>

        <!-- КНОПКИ АВТОРИЗАЦИИ -->
        <div class="oauth-buttons">
          <!-- TELEGRAM (если открыто в мини-приложении) -->
          <button 
            v-if="showTelegramButton"
            @click="loginWithTelegram" 
            class="oauth-btn telegram-btn" 
            :disabled="loading"
          >
            <span class="btn-icon">✈️</span>
            <span>{{ loading ? '⏳ Загружаем...' : 'Telegram' }}</span>
          </button>

          <!-- КОД ИЗ БОТА -->
          <div class="code-section">
            <div class="form-group">
              <label class="form-label">📱 Код из Telegram бота</label>
              <input 
                v-model="registrationCode"
                type="text"
                class="form-input"
                placeholder="ABC123"
                @input="checkCode"
                :disabled="loading"
                maxlength="10"
                autocomplete="off"
              />
              <div v-if="codeCheckMessage" class="message-small" :class="{ success: codeValid, error: !codeValid }">
                {{ codeCheckMessage }}
              </div>
            </div>

            <!-- РЕГИСТРАЦИЯ НОВОГО ПОЛЬЗОВАТЕЛЯ -->
            <div v-if="codeValid && !isExistingUser" class="form-group">
              <label class="form-label">Ваше имя</label>
              <input 
                v-model="displayName"
                type="text"
                class="form-input"
                placeholder="Иван Петров"
                :disabled="loading"
                maxlength="128"
                autocomplete="name"
              />
            </div>

            <!-- КНОПКА РЕГИСТРАЦИИ (для новых) ИЛИ ВХОДА (для существующих) -->
            <button 
              v-if="codeValid"
              @click="isExistingUser ? loginWithCode() : registerWithCode()" 
              class="register-btn"
              :disabled="loading || (!isExistingUser && !displayName.trim())"
            >
              {{ loading ? '⏳ Загружаем...' : (isExistingUser ? '✓ Вход в аккаунт' : '✓ Зарегистрироваться') }}
            </button>

            <!-- ИНФОРМАЦИЯ О СТАРОМ КОДЕ (если уже зарегистрирован) -->
            <div v-if="showUserCode" class="user-code-info">
              <p class="user-code-label">Ваш код доступа:</p>
              <div class="code-display">
                <code>{{ userCodeValue }}</code>
                <button @click="copyToClipboard(userCodeValue)" class="copy-btn" title="Скопировать">📋</button>
              </div>
              <p class="user-code-note">Используйте этот код для входа на других устройствах</p>
            </div>
          </div>

          <!-- ЯНДЕКС -->
          <button @click="loginWithYandex" class="oauth-btn yandex-btn" :disabled="loading">
            <span class="btn-icon">🔴</span>
            <span>{{ loading ? '⏳ Загружаем...' : 'Яндекс' }}</span>
          </button>
        </div>

        <!-- СООБЩЕНИЕ -->
        <div v-if="message" class="message" :class="{ error: isError, success: !isError }">
          <span v-if="!isError">✓</span>
          <span v-else>⚠️</span>
          {{ message }}
        </div>

        <!-- ВЕРНУТЬСЯ НА ГЛАВНУЮ -->
        <router-link to="/" class="button-home">
          ← Вернуться на главную
        </router-link>
      </div>
    </div>
  </div>
</template>

<script>
import { api, tgUtils } from '../api'

export default {
  name: 'RegisterView',
  data() {
    return {
      showTelegramButton: false,
      registrationCode: '',
      displayName: '',
      loading: false,
      message: '',
      isError: false,
      codeCheckMessage: '',
      codeValid: false,
      isExistingUser: false,
      codeCheckTimeout: null,
      showUserCode: false,
      userCodeValue: '',
      telegramId: null
    }
  },

  async mounted() {
    // Проверяем параметры в URL (callback от Яндекса)
    const params = new URLSearchParams(window.location.search)
    const authSuccess = params.get('auth_success')
    const authError = params.get('auth_error')
    const email = params.get('email')
    const errorMessage = params.get('message')

    if (authSuccess === 'true' && email) {
      this.message = '✓ Авторизация успешна! Перенаправляем...'
      this.isError = false
      localStorage.setItem('email', email)

      try {
        const profile = await api.getProfile(email)
        if (profile) {
          setTimeout(() => {
            this.$router.push('/')
          }, 1000)
        }
      } catch (err) {
        console.error('❌ Ошибка получения профиля:', err)
        setTimeout(() => {
          this.$router.push('/')
        }, 1000)
      }

      window.history.replaceState({}, document.title, '/register')
    } else if (authError === 'true') {
      this.message = errorMessage ? decodeURIComponent(errorMessage).replace(/\+/g, ' ') : '❌ Ошибка авторизации'
      this.isError = true
      window.history.replaceState({}, document.title, '/register')
    }

    // Проверяем, можно ли использовать Telegram
    const tg = await tgUtils.init()
    if (tg) {
      const user = tgUtils.getUser()
      if (user) {
        this.showTelegramButton = true
        this.telegramId = user.id
        console.log('✅ Telegram мини-приложение обнаружено')
        localStorage.setItem('telegram_id', user.id)
      }
    }
  },

  methods: {
    async checkCode() {
      clearTimeout(this.codeCheckTimeout)
      this.isExistingUser = false
      this.showUserCode = false
      
      if (!this.registrationCode.trim()) {
        this.codeCheckMessage = ''
        this.codeValid = false
        return
      }

      this.codeCheckTimeout = setTimeout(async () => {
        try {
          const result = await api.verifyCode(this.registrationCode)
          if (result.valid) {
            this.codeCheckMessage = '✓ ' + result.message
            this.codeValid = true
          } else {
            this.codeCheckMessage = result.message
            this.codeValid = false
          }
        } catch (error) {
          this.codeCheckMessage = '❌ ' + (error.message || 'Ошибка проверки')
          this.codeValid = false
        }
      }, 500)
    },

    async registerWithCode() {
      if (!this.codeValid || !this.displayName.trim()) {
        this.message = '❌ Проверьте код и имя'
        this.isError = true
        return
      }

      try {
        this.loading = true
        this.message = '⏳ Регистрируем аккаунт...'
        this.isError = false

        const result = await api.registerWithCode(this.registrationCode, this.displayName)

        if (result.status === 'existing_user') {
          // Пользователь уже существует
          this.isExistingUser = true
          this.message = '✓ ' + result.message + ' Выполняю вход...'
          this.isError = false
          
          // Получаем старый код
          try {
            if (this.telegramId) {
              const codeResult = await api.getUserCode(this.telegramId)
              this.userCodeValue = codeResult.code
              this.showUserCode = true
            }
          } catch (e) {
            console.warn('⚠️ Не удалось получить старый код:', e)
          }

          setTimeout(() => {
            this.$router.push('/')
          }, 2000)
        } else {
          // Новый пользователь зарегистрирован
          this.message = '🎉 ' + result.message + ' Добро пожаловать!'
          this.isError = false
          this.userCodeValue = this.registrationCode
          this.showUserCode = true

          setTimeout(() => {
            this.$router.push('/')
          }, 2000)
        }
      } catch (error) {
        this.message = error.message || 'Ошибка регистрации'
        this.isError = true
        console.error('❌ Регистрация ошибка:', error)
      } finally {
        this.loading = false
      }
    },

    async loginWithCode() {
      if (!this.codeValid) {
        this.message = '❌ Проверьте код'
        this.isError = true
        return
      }

      try {
        this.loading = true
        this.message = '⏳ Выполняем вход...'
        this.isError = false

        let telegramId = this.telegramId
        if (!telegramId) {
          telegramId = parseInt(localStorage.getItem('telegram_id') || '0')
        }

        if (!telegramId) {
          throw new Error('Не удалось получить Telegram ID')
        }

        const result = await api.loginWithCode(this.registrationCode, telegramId)

        this.message = '✓ ' + result.message
        this.isError = false

        setTimeout(() => {
          this.$router.push('/')
        }, 1000)
      } catch (error) {
        this.message = error.message || 'Ошибка входа'
        this.isError = true
        console.error('❌ Вход ошибка:', error)
      } finally {
        this.loading = false
      }
    },

    async loginWithTelegram() {
      try {
        this.loading = true
        this.message = ''
        this.isError = false

        const user = tgUtils.getUser()

        if (!user || !user.id) {
          this.message = '❌ Не удалось получить данные Telegram профиля'
          this.isError = true
          this.loading = false
          return
        }

        this.message = '⏳ Авторизуем через Telegram...'

        const result = await api.telegramAuth({
          id: user.id,
          first_name: user.first_name || '',
          username: user.username || ''
        })

        console.log('✅ Telegram auth успешно:', result)
        this.message = '✓ Вы успешно вошли! Перенаправляем...'
        this.isError = false

        setTimeout(() => {
          this.$router.push('/')
        }, 1000)
      } catch (error) {
        this.message = error.message || 'Ошибка при авторизации Telegram'
        this.isError = true
        console.error('❌ Telegram ошибка:', error)
      } finally {
        this.loading = false
      }
    },

    async loginWithYandex() {
      try {
        this.loading = true
        this.message = ''
        this.isError = false

        const authUrl = await api.getYandexAuthUrl()
        window.location.href = authUrl
      } catch (error) {
        this.message = error.message || 'Ошибка при подключении Яндекса'
        this.isError = true
        this.loading = false
      }
    },

    copyToClipboard(text) {
      navigator.clipboard.writeText(text).then(() => {
        this.message = '✓ Код скопирован в буфер обмена'
        this.isError = false
        setTimeout(() => {
          this.message = ''
        }, 2000)
      }).catch(err => {
        console.error('Ошибка копирования:', err)
      })
    }
  }
}
</script>

<style scoped>
.page {
  padding: 20px;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
}

.register-container {
  width: 100%;
  max-width: 500px;
}

.card {
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 32px;
  backdrop-filter: blur(20px);
}

.register-card {
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

h1 {
  background: var(--gradient-primary);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  font-size: 28px;
  margin: 0 0 8px 0;
}

h3 {
  color: var(--text-primary);
  font-size: 16px;
  font-weight: 600;
}

.muted {
  color: var(--text-muted);
  font-size: 14px;
}

/* ИНСТРУКЦИЯ */
.instruction-box {
  background: var(--bg-tertiary);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 16px;
  margin-bottom: 20px;
}

.instruction-list {
  margin: 0;
  padding-left: 20px;
  color: var(--text-primary);
  font-size: 14px;
  line-height: 1.8;
}

.instruction-list li {
  margin-bottom: 10px;
}

.instruction-list code {
  background: var(--color-bg-1);
  padding: 2px 6px;
  border-radius: 4px;
  font-family: monospace;
  font-weight: 600;
}

.bot-link {
  color: var(--accent);
  text-decoration: none;
  font-weight: 600;
  border-bottom: 1px solid transparent;
  transition: border-color 0.3s ease;
}

.bot-link:hover {
  border-bottom-color: var(--accent);
}

.oauth-buttons {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 24px;
}

.oauth-btn {
  width: 100%;
  background: var(--bg-tertiary);
  border: 2px solid var(--border);
  color: var(--text-primary);
  padding: 16px 20px;
  border-radius: 10px;
  font-weight: 600;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

.oauth-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  border-color: var(--accent);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.oauth-btn:active:not(:disabled) {
  transform: translateY(0);
}

.oauth-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-icon {
  font-size: 22px;
}

.telegram-btn {
  border-color: #0088cc;
  background: rgba(0, 136, 204, 0.08);
}

.telegram-btn:hover:not(:disabled) {
  background: rgba(0, 136, 204, 0.15);
  border-color: #0088cc;
}

.yandex-btn {
  border-color: #ffcc00;
  background: rgba(255, 204, 0, 0.08);
}

.yandex-btn:hover:not(:disabled) {
  background: rgba(255, 204, 0, 0.15);
  border-color: #ffcc00;
}

.code-section {
  padding: 16px;
  background: var(--bg-tertiary);
  border: 1px solid var(--border);
  border-radius: 10px;
  margin: 12px 0;
}

.form-group {
  margin-bottom: 16px;
}

.form-group:last-child {
  margin-bottom: 0;
}

.form-label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: var(--text-primary);
  font-size: 14px;
}

.form-input {
  width: 100%;
  background: var(--bg-secondary);
  border: 2px solid var(--border);
  color: var(--text-primary);
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  transition: all 0.3s ease;
  box-sizing: border-box;
}

.form-input:focus {
  outline: none;
  border-color: var(--accent);
}

.form-input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.message-small {
  padding: 6px 10px;
  border-radius: 6px;
  margin-top: 6px;
  font-size: 12px;
  font-weight: 600;
}

.message-small.success {
  background: rgba(0, 255, 136, 0.1);
  color: var(--accent);
  border: 1px solid rgba(0, 255, 136, 0.3);
}

.message-small.error {
  background: rgba(255, 68, 68, 0.1);
  color: #ff4444;
  border: 1px solid rgba(255, 68, 68, 0.3);
}

.register-btn {
  width: 100%;
  background: var(--gradient-primary);
  color: #000;
  border: none;
  padding: 12px 16px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.register-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 255, 136, 0.3);
}

.register-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* ОТОБРАЖЕНИЕ СТАРОГО КОДА */
.user-code-info {
  margin-top: 16px;
  padding: 12px;
  background: rgba(0, 255, 136, 0.05);
  border: 1px solid rgba(0, 255, 136, 0.3);
  border-radius: 8px;
}

.user-code-label {
  margin: 0 0 8px 0;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-primary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.code-display {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.code-display code {
  flex: 1;
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  padding: 8px 12px;
  border-radius: 6px;
  font-family: 'Courier New', monospace;
  font-size: 16px;
  font-weight: 700;
  color: var(--accent);
  word-break: break-all;
}

.copy-btn {
  background: var(--accent);
  border: none;
  color: #000;
  padding: 8px 12px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 16px;
  transition: all 0.3s ease;
  flex-shrink: 0;
}

.copy-btn:hover {
  transform: scale(1.1);
  opacity: 0.9;
}

.copy-btn:active {
  transform: scale(0.95);
}

.user-code-note {
  margin: 0;
  font-size: 12px;
  color: var(--text-muted);
  font-style: italic;
}

.message {
  padding: 12px 16px;
  border-radius: 8px;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  font-size: 14px;
  animation: slideIn 0.3s ease;
}

.message.success {
  background: rgba(0, 255, 136, 0.1);
  border: 1px solid rgba(0, 255, 136, 0.3);
  color: var(--accent);
}

.message.error {
  background: rgba(255, 68, 68, 0.1);
  border: 1px solid rgba(255, 68, 68, 0.3);
  color: #ff4444;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.button-home {
  display: block;
  width: 100%;
  text-align: center;
  padding: 12px 20px;
  background: transparent;
  border: 2px solid var(--border);
  color: var(--text-primary);
  border-radius: 8px;
  text-decoration: none;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-top: 20px;
}

.button-home:hover {
  border-color: var(--accent);
  color: var(--accent);
  transform: translateX(-4px);
}

@media (max-width: 480px) {
  .page {
    padding: 12px;
  }

  .card {
    padding: 20px;
    border-radius: 12px;
  }

  h1 {
    font-size: 24px;
  }

  .instruction-box {
    padding: 12px;
  }

  .instruction-list {
    font-size: 13px;
    padding-left: 18px;
  }

  .oauth-btn {
    padding: 14px 16px;
    font-size: 14px;
  }

  .btn-icon {
    font-size: 20px;
  }

  .code-section {
    padding: 12px;
  }

  .form-input {
    padding: 10px 12px;
    font-size: 13px;
  }

  .register-btn {
    padding: 10px 14px;
    font-size: 13px;
  }

  .button-home {
    padding: 10px 16px;
    font-size: 14px;
  }

  .code-display {
    flex-direction: column;
    align-items: stretch;
  }

  .code-display code {
    font-size: 14px;
  }

  .copy-btn {
    width: 100%;
  }
}
</style>
