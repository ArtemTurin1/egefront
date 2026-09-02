<template>
  <div id="app">
    <Header />
    <main class="main-content">
      <router-view />
    </main>
    <Navbar />
    <NotificationToast />
    <ConfirmModal />
  </div>
</template>

<script>
import Header from './components/Header.vue'
import Navbar from './components/Navbar.vue'
import NotificationToast from './components/NotificationToast.vue'
import ConfirmModal from './components/ConfirmModal.vue'
import { store } from './store.js'
import { api } from './api.js'

export default {
  name: 'App',
  components: {
    Header,
    Navbar,
    NotificationToast,
    ConfirmModal
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
.main-content {
  min-height: calc(100vh - 60px);
  padding-bottom: 80px;
}
</style>