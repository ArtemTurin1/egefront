<template>
  <div class="page">
    <div class="register-container">
      <div class="card register-card">
        <div class="brand-header">
          <div class="brand-logo">КогдаУрок ✨</div>
          <h1>{{ activeTab === 'login' ? 'Вход в аккаунт' : activeTab === 'register' ? 'Регистрация' : 'Вход через Telegram' }}</h1>
          <p class="muted">Платформа для занятий с наставниками и управления расписанием уроков</p>
        </div>

        <!-- ВКЛАДКИ НАВИГАЦИИ -->
        <div class="tabs-nav">
          <button 
            class="tab-btn" 
            :class="{ active: activeTab === 'login' }" 
            @click="switchTab('login')"
          >
            🔑 Вход
          </button>
          <button 
            class="tab-btn" 
            :class="{ active: activeTab === 'register' }" 
            @click="switchTab('register')"
          >
            ✨ Регистрация
          </button>
          <button 
            class="tab-btn" 
            :class="{ active: activeTab === 'telegram' }" 
            @click="switchTab('telegram')"
          >
            🤖 Telegram
          </button>
        </div>

        <!-- 1. ФОРМА: ВХОД ПО EMAIL -->
        <div v-if="activeTab === 'login'" class="form-section">
          <form @submit.prevent="handleLogin" class="form-body">
            <div class="form-group">
              <label class="form-label">Email</label>
              <input 
                v-model="loginEmail"
                type="email"
                required
                class="form-input"
                placeholder="name@example.com"
                :disabled="loading"
                autocomplete="email"
              />
            </div>

            <div class="form-group">
              <label class="form-label">Пароль</label>
              <input 
                v-model="loginPassword"
                type="password"
                required
                class="form-input"
                placeholder="Введите пароль"
                :disabled="loading"
                autocomplete="current-password"
              />
            </div>

            <button 
              type="submit" 
              class="register-btn"
              :disabled="loading || !loginEmail || !loginPassword"
            >
              {{ loading ? '⏳ Входим...' : 'Войти в аккаунт →' }}
            </button>
          </form>
        </div>

        <!-- 2. ФОРМА: РЕГИСТРАЦИЯ ПО EMAIL -->
        <div v-if="activeTab === 'register'" class="form-section">
          <form @submit.prevent="handleRegister" class="form-body">
            <div class="form-group">
              <label class="form-label">Ваше имя и фамилия</label>
              <input 
                v-model="regName"
                type="text"
                required
                class="form-input"
                placeholder="Иван Петров"
                :disabled="loading"
              />
            </div>

            <div class="form-group">
              <label class="form-label">Email</label>
              <input 
                v-model="regEmail"
                type="email"
                required
                class="form-input"
                placeholder="name@example.com"
                :disabled="loading"
                autocomplete="email"
              />
            </div>

            <div class="form-group">
              <label class="form-label">Пароль (минимум 4 символа)</label>
              <input 
                v-model="regPassword"
                type="password"
                required
                minlength="4"
                class="form-input"
                placeholder="Придумайте пароль"
                :disabled="loading"
                autocomplete="new-password"
              />
            </div>

            <!-- ВЫБОР РОЛИ -->
            <div class="form-group">
              <label class="form-label">Ваша роль</label>
              <div class="role-selector">
                <div 
                  class="role-card" 
                  :class="{ selected: !regIsMentor }"
                  @click="regIsMentor = false"
                >
                  <div class="role-icon">👨‍🎓</div>
                  <div class="role-title">Ученик</div>
                  <div class="role-sub">Готовлюсь к ЕГЭ</div>
                </div>

                <div 
                  class="role-card" 
                  :class="{ selected: regIsMentor }"
                  @click="regIsMentor = true"
                >
                  <div class="role-icon">👨‍🏫</div>
                  <div class="role-title">Наставник</div>
                  <div class="role-sub">Преподаю и веду уроки</div>
                </div>
              </div>
            </div>

            <button 
              type="submit" 
              class="register-btn"
              :disabled="loading || !regName || !regEmail || !regPassword"
            >
              {{ loading ? '⏳ Создание аккаунта...' : 'Зарегистрироваться →' }}
            </button>
          </form>
        </div>

        <!-- 3. ФОРМА: TELEGRAM КОД -->
        <div v-if="activeTab === 'telegram'" class="form-section">
          <div class="instruction-box">
            <div class="instruction-title">📖 Как получить код в Telegram?</div>
            <div class="instruction-text">
              Откройте бота <a href="https://t.me/kogdaurok_bot" target="_blank" class="bot-link">@kogdaurok_bot</a> и нажмите кнопку «📝 Получить код».
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Код из Telegram-бота</label>
            <input 
              v-model="registrationCode"
              type="text"
              class="form-input text-center font-code"
              placeholder="Например: ABC123"
              @input="checkCode"
              :disabled="loading"
              maxlength="10"
              autocomplete="off"
            />
            <div v-if="codeCheckMessage" class="message-small" :class="{ success: codeValid, error: !codeValid }">
              {{ codeCheckMessage }}
            </div>
          </div>

          <button 
            v-if="codeValid"
            @click="loginOrRegisterWithCode" 
            class="register-btn"
            :disabled="loading"
          >
            {{ loading ? '⏳ Вход...' : '✓ Войти через Telegram' }}
          </button>
        </div>

        <!-- СООБЩЕНИЕ ОБ ОШИБКЕ/УСПЕХЕ -->
        <div v-if="message" class="message" :class="{ error: isError, success: !isError }">
          <span v-if="!isError">✓</span>
          <span v-else>⚠️</span>
          {{ message }}
        </div>

        <!-- НАЗАД НА ГЛАВНУЮ -->
        <router-link to="/schedule" class="button-home">
          ← Перейти к платформе
        </router-link>
      </div>
    </div>
  </div>
</template>

<script>
import { api } from '../api.js'
import { store } from '../store.js'

export default {
  name: 'RegisterView',
  data() {
    return {
      activeTab: 'login', // 'login' | 'register' | 'telegram'
      
      // Поля входа
      loginEmail: '',
      loginPassword: '',

      // Поля регистрации
      regName: '',
      regEmail: '',
      regPassword: '',
      regIsMentor: false,

      // Поля Telegram
      registrationCode: '',
      codeCheckMessage: '',
      codeValid: false,
      tgName: '',
      codeCheckTimeout: null,

      loading: false,
      message: '',
      isError: false,
    }
  },

  async mounted() {
    if (store.profile) {
      this.$router.replace('/profile')
      return
    }
    const hasSavedAuth = !!(localStorage.getItem('token') || localStorage.getItem('email'))
    if (hasSavedAuth) {
      const p = await api.getMe()
      if (p || store.profile) {
        this.$router.replace('/profile')
      }
    }
  },

  methods: {
    switchTab(tab) {
      this.activeTab = tab
      this.message = ''
      this.isError = false
    },

    async handleLogin() {
      if (!this.loginEmail || !this.loginPassword) return

      try {
        this.loading = true
        this.message = '⏳ Выполняем вход...'
        this.isError = false

        const result = await api.loginWithEmail(this.loginEmail, this.loginPassword)
        this.message = '🎉 ' + (result.message || 'Вход выполнен успешно!')
        
        setTimeout(() => {
          this.$router.push('/profile')
        }, 800)
      } catch (error) {
        this.message = error.message || 'Ошибка входа. Проверьте email и пароль.'
        this.isError = true
      } finally {
        this.loading = false
      }
    },

    async handleRegister() {
      if (!this.regName.trim() || !this.regEmail.trim() || !this.regPassword) return

      try {
        this.loading = true
        this.message = '⏳ Создаем аккаунт...'
        this.isError = false

        const result = await api.registerWithEmail(
          this.regEmail,
          this.regPassword,
          this.regName,
          this.regIsMentor
        )
        this.message = '🎉 ' + (result.message || 'Регистрация успешна!')
        
        setTimeout(() => {
          this.$router.push('/profile')
        }, 800)
      } catch (error) {
        this.message = error.message || 'Ошибка регистрации. Возможно email уже занят.'
        this.isError = true
      } finally {
        this.loading = false
      }
    },

    async checkCode() {
      clearTimeout(this.codeCheckTimeout)
      
      if (!this.registrationCode.trim()) {
        this.codeCheckMessage = ''
        this.codeValid = false
        this.tgName = ''
        return
      }

      this.codeCheckTimeout = setTimeout(async () => {
        try {
          const result = await api.verifyCode(this.registrationCode)
          if (result.valid) {
            this.tgName = result.telegram_username || ''
            this.codeCheckMessage = '✓ Код подтвержден' + (this.tgName ? ` (${this.tgName})` : '')
            this.codeValid = true
          } else {
            this.codeCheckMessage = result.message || 'Неверный код'
            this.codeValid = false
          }
        } catch (error) {
          this.codeCheckMessage = '❌ ' + (error.message || 'Ошибка проверки')
          this.codeValid = false
        }
      }, 350)
    },

    async loginOrRegisterWithCode() {
      if (!this.codeValid || !this.registrationCode.trim()) return

      try {
        this.loading = true
        this.message = '⏳ Авторизация...'
        this.isError = false

        const result = await api.registerWithCode(this.registrationCode, '')
        this.message = '🎉 ' + (result.message || 'Успешный вход!')
        
        setTimeout(() => {
          this.$router.push('/profile')
        }, 800)
      } catch (error) {
        this.message = error.message || 'Ошибка входа по коду'
        this.isError = true
      } finally {
        this.loading = false
      }
    }
  }
}
</script>

<style scoped>
.page {
  padding: 30px 20px;
  min-height: calc(100vh - 80px);
  display: flex;
  align-items: center;
  justify-content: center;
}

.register-container {
  width: 100%;
  max-width: 480px;
}

.register-card {
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: 20px;
  padding: 32px 28px;
  backdrop-filter: blur(24px);
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.4);
}

.brand-header {
  text-align: center;
  margin-bottom: 20px;
}

.brand-logo {
  font-size: 22px;
  font-weight: 800;
  color: var(--accent);
  margin-bottom: 6px;
  letter-spacing: 1px;
}

h1 {
  font-size: 24px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 6px 0;
}

.muted {
  color: var(--text-muted);
  font-size: 13px;
  line-height: 1.4;
  margin: 0;
}

/* ВКЛАДКИ */
.tabs-nav {
  display: flex;
  background: var(--bg-tertiary);
  padding: 4px;
  border-radius: 12px;
  gap: 4px;
  margin-bottom: 22px;
  border: 1px solid var(--border);
}

.tab-btn {
  flex: 1;
  background: transparent;
  border: none;
  color: var(--text-secondary);
  padding: 10px 8px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.25s ease;
}

.tab-btn:hover {
  color: var(--text-primary);
}

.tab-btn.active {
  background: var(--bg-secondary);
  color: var(--accent);
  box-shadow: var(--shadow-sm);
  border: 1px solid rgba(0, 255, 136, 0.2);
}

/* ФОРМЫ */
.form-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-body {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
}

.form-input {
  width: 100%;
  background: var(--bg-tertiary);
  border: 1.5px solid var(--border);
  color: var(--text-primary);
  padding: 12px 14px;
  border-radius: 10px;
  font-size: 14px;
  transition: all 0.2s ease;
  box-sizing: border-box;
}

.font-code {
  font-family: monospace;
  font-size: 18px;
  letter-spacing: 2px;
}

.form-input:focus {
  outline: none;
  border-color: var(--accent);
}

/* ВЫБОР РОЛИ */
.role-selector {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-top: 4px;
}

.role-card {
  background: var(--bg-tertiary);
  border: 1.5px solid var(--border);
  border-radius: 10px;
  padding: 12px 10px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

.role-card:hover {
  border-color: var(--border-light);
}

.role-card.selected {
  border-color: var(--accent);
  background: rgba(0, 255, 136, 0.08);
}

.role-icon {
  font-size: 22px;
  margin-bottom: 4px;
}

.role-title {
  font-size: 13px;
  font-weight: 700;
  color: var(--text-primary);
}

.role-sub {
  font-size: 11px;
  color: var(--text-muted);
  margin-top: 2px;
}

.register-btn {
  width: 100%;
  background: var(--gradient-primary);
  color: #000;
  border: none;
  padding: 14px;
  border-radius: 10px;
  font-weight: 700;
  font-size: 15px;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-top: 6px;
}

.register-btn:hover:not(:disabled) {
  opacity: 0.88;
}

.register-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.instruction-box {
  background: rgba(0, 255, 136, 0.05);
  border: 1px solid rgba(0, 255, 136, 0.2);
  border-radius: 10px;
  padding: 12px 14px;
  font-size: 13px;
}

.instruction-title {
  font-weight: 700;
  color: var(--accent);
  margin-bottom: 4px;
}

.instruction-text {
  color: var(--text-primary);
}

.bot-link {
  color: var(--accent);
  font-weight: 700;
  text-decoration: underline;
}

.message {
  padding: 12px 16px;
  border-radius: 10px;
  margin-top: 18px;
  font-size: 13px;
  font-weight: 600;
}

.message.success {
  background: rgba(0, 255, 136, 0.1);
  color: var(--accent);
  border: 1px solid rgba(0, 255, 136, 0.3);
}

.message.error {
  background: rgba(255, 68, 68, 0.1);
  color: #ff4444;
  border: 1px solid rgba(255, 68, 68, 0.3);
}

.message-small {
  font-size: 12px;
  margin-top: 4px;
  font-weight: 600;
}

.message-small.success {
  color: var(--accent);
}

.message-small.error {
  color: #ff4444;
}

.button-home {
  display: block;
  text-align: center;
  color: var(--text-muted);
  text-decoration: none;
  font-size: 13px;
  font-weight: 600;
  margin-top: 20px;
  transition: color 0.2s ease;
}

.button-home:hover {
  color: var(--accent);
}
</style>
