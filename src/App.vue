<template>
  <div id="app">
    <Header />
    <main class="main-content">
      <router-view />
    </main>
    <Navbar />
  </div>
</template>

<script>
import Header from './components/Header.vue'
import Navbar from './components/Navbar.vue'
import { store } from './store.js'
import { api } from './api.js'

export default {
  name: 'App',
  components: {
    Header,
    Navbar
  },
  async mounted() {
    console.log('🚀 App: mounted')
    
    // Обработка OAuth callback результатов
    const params = new URLSearchParams(window.location.search)
    const authSuccess = params.get('auth_success')
    const authError = params.get('auth_error')
    const email = params.get('email')
    const message = params.get('message')

    if (authSuccess === 'true' && email) {
      // Успешная OAuth авторизация
      const decodedEmail = decodeURIComponent(email)
      localStorage.setItem('email', decodedEmail)
      
      console.log('✅ App: OAuth успешна:', decodedEmail)
      
      try {
        const profile = await api.getProfile(decodedEmail)
        if (profile) {
          store.setProfile(profile)
          console.log('✅ App: профиль загружен')
          
          // Отправляем событие всем компонентам
          window.dispatchEvent(new Event('auth-changed'))
        }
      } catch (err) {
        console.error('❌ App: ошибка загрузки профиля:', err)
      }
      
      // Очищаем URL параметры
      window.history.replaceState({}, document.title, window.location.pathname)
    } else if (authError === 'true') {
      // Ошибка OAuth авторизации
      const errorMsg = message ? decodeURIComponent(message).replace(/\+/g, ' ') : 'Ошибка авторизации'
      console.error('❌ App: OAuth ошибка:', errorMsg)
      
      // Очищаем URL параметры
      window.history.replaceState({}, document.title, window.location.pathname)
    }

    // Инициализация пользователя (обычная логика)
    await this.initializeUser()
  },
  
  methods: {
    async initializeUser() {
      console.log('🔄 App: инициализация пользователя')
      
      try {
        // Сначала проверяем есть ли сохранённый email
        const storedEmail = localStorage.getItem('email')
        
        if (storedEmail) {
          // Если email есть в localStorage, загружаем его профиль
          console.log('📧 App: загружаю профиль из localStorage:', storedEmail)
          const profile = await api.getProfile(storedEmail)
          if (profile) {
            store.setProfile(profile)
            console.log('✅ App: профиль загружен из localStorage')
            
            // Отправляем событие всем компонентам
            window.dispatchEvent(new Event('auth-changed'))
          }
        } else {
          // Проверяем Telegram WebApp (если открыто в Telegram)
          const tg_user = window.Telegram?.WebApp?.initDataUnsafe?.user
          if (tg_user?.id) {
            console.log('🔔 App: Telegram пользователь обнаружен:', tg_user)
            
            // Пытаемся авторизовать через Telegram
            try {
              const result = await api.telegramAuth({
                id: tg_user.id,
                first_name: tg_user.first_name || '',
                username: tg_user.username || '',
                is_bot: tg_user.is_bot || false
              })
              
              if (result && result.email) {
                localStorage.setItem('email', result.email)
                const profile = await api.getProfile(result.email)
                if (profile) {
                  store.setProfile(profile)
                  console.log('✅ App: Telegram авторизация успешна')
                  
                  // Отправляем событие всем компонентам
                  window.dispatchEvent(new Event('auth-changed'))
                }
              }
            } catch (err) {
              console.warn('⚠️ App: ошибка Telegram авторизации:', err)
              // Продолжаем даже если ошибка
            }
          } else {
            console.log('ℹ️ App: не в Telegram и нет сохранённого email')
          }
        }
      } catch (error) {
        console.error('❌ App: ошибка инициализации пользователя:', error)
      }
    }
  }
}
</script>


<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

:root {
  --bg-primary: #000000;
  --bg-secondary: #0a0a0a;
  --bg-tertiary: #111111;
  --text-primary: #ffffff;
  --text-secondary: #888888;
  --text-muted: #666666;
  --accent: #00ff88;
  --accent-dark: #00cc6a;
  --accent-transparent: rgba(0, 255, 136, 0.1);
  --border: #222222;
  --border-light: #333333;
  --success: #00ff88;
  --warning: #ffcc00;
  --error: #ff4444;
  --gradient-primary: linear-gradient(135deg, #00ff88 0%, #00cc6a 100%);
  --gradient-secondary: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: var(--bg-primary);
  color: var(--text-primary);
  line-height: 1.6;
}

.main-content {
  min-height: calc(100vh - 120px);
  padding-bottom: 80px;
}

.page {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.container {
  display: flex;
  gap: 20px;
  align-items: flex-start;
}

.card {
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 20px;
  backdrop-filter: blur(20px);
  transition: all 0.3s ease;
}

.card:hover {
  border-color: var(--border-light);
  transform: translateY(-2px);
}

.h-stack {
  display: flex;
  align-items: center;
}

.v-stack {
  display: flex;
  flex-direction: column;
}

.muted {
  color: var(--text-muted);
  font-size: 14px;
}

.text-center {
  text-align: center;
}

.button {
  background: var(--gradient-primary);
  color: #000;
  border: none;
  padding: 12px 20px;
  border-radius: 12px;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s ease;
  text-decoration: none;
}

.button:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 255, 136, 0.3);
}

.button.ghost {
  background: transparent;
  color: var(--text-primary);
  border: 1px solid var(--border);
}

.button.ghost:hover {
  background: var(--accent-transparent);
  border-color: var(--accent);
  color: var(--accent);
}

.input {
  background: var(--bg-tertiary);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 12px 16px;
  color: var(--text-primary);
  font-size: 14px;
  transition: all 0.3s ease;
  width: 100%;
}

.input:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 2px rgba(0, 255, 136, 0.1);
}

.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal {
  max-width: 500px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
}

@media (max-width: 768px) {
  .page {
    padding: 16px;
  }
  
  .container {
    flex-direction: column;
  }
  
  .card {
    padding: 16px;
    border-radius: 12px;
  }
}
</style>