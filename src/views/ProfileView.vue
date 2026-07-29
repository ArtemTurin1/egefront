<template>
  <div class="page">
    <!-- ТРЕБУЕТСЯ АВТОРИЗАЦИЯ -->
    <div v-if="!isAuthorized" class="card auth-required">
      <div class="auth-icon">🔐</div>
      <h2 style="text-align: center; margin-bottom: 12px;">Авторизация требуется</h2>
      <p class="muted" style="text-align: center; margin-bottom: 24px;">
        Для просмотра профиля необходимо войти в аккаунт
      </p>
      <router-link to="/register" class="button" style="width: 100%; text-align: center; justify-content: center;">
        Зарегистрироваться
      </router-link>
    </div>

    <!-- ПРОФИЛЬ АВТОРИЗОВАННОГО ПОЛЬЗОВАТЕЛЯ -->
    <div v-else class="container">
      <div style="flex:1">
        <div class="card">
          <div class="header-with-settings">
            <h2>Профиль</h2>
            <button @click="openSettings" class="settings-btn" title="Настройки">
              ⚙️
            </button>
          </div>

          <div v-if="profile" class="v-stack" style="gap: 24px;">
            <div class="profile-card">
              <div class="profile-header">
                <div class="profile-left">
                  <div class="avatar">
                    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                      <circle cx="12" cy="7" r="4"/>
                    </svg>
                  </div>
                  <div style="flex: 1; min-width: 0;">
                    <div style="display: flex; align-items: center; gap: 12px; justify-content: space-between; flex-wrap: wrap;">
                      <h3 style="margin:0">{{ profile.name || 'Анонимный пользователь' }}</h3>
                      <div class="user-id-badge">
                        <span>ID: {{ userId }}</span>
                        <button @click="copyUserId" class="copy-btn-mini" :title="copyMessage">
                          {{ copied ? '✓' : '📋' }}
                        </button>
                      </div>
                    </div>
                    <div class="muted" style="margin-top: 4px;">{{ userRole }}</div>
                  </div>
                </div>
              </div>
              <!-- Подсказка для ID -->
              <div class="id-hint">
                <div class="muted" style="font-size: 12px; line-height: 1.5;">
                  {{ isMentor ? '💡 Узнайте ID ученика для добавления' : '💡 Сообщите ваш ID наставнику для добавления' }}
                </div>
              </div>
            </div>

            <!-- Действия -->
            <div class="actions-grid">
              <router-link to="/stats" class="button ghost">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="18" y1="20" x2="18" y2="10"/>
                  <line x1="12" y1="20" x2="12" y2="4"/>
                  <line x1="6" y1="20" x2="6" y2="14"/>
                </svg>
                <span>Статистика</span>
              </router-link>
              
              <!-- Кнопка "Стать учителем" для обучающихся -->
              <button v-if="!isMentor" @click="openBecomeMentorModal" class="button ghost">
                <span>👨‍🏫 Стать учителем</span>
              </button>

              <!-- Кнопка "Мои ученики" для наставников -->
              <button v-if="isMentor" @click="openStudentsModal" class="button ghost">
                <span>👥 Мои ученики</span>
              </button>

              <!-- Кнопка "Мои наставники" для обучающихся (только просмотр) -->
              <button v-if="!isMentor" @click="openMentorsModal" class="button ghost">
                <span>👨‍🏫 Мои наставники</span>
              </button>
            </div>
          </div>

          <div v-else class="text-center muted" style="padding: 40px;">
            <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" style="opacity: 0.5; margin-bottom: 16px;">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
            <div>Профиль не найден</div>
            <router-link to="/register" class="button" style="margin-top: 16px;">
              Зарегистрироваться
            </router-link>
          </div>
        </div>
      </div>
    </div>

    <!-- МОДАЛЬНОЕ ОКНО НАСТРОЕК -->
    <div v-if="showSettings && isAuthorized" class="modal-backdrop" @click.self="closeSettings">
      <div class="modal card">
        <div class="modal-header">
          <h3 style="margin: 0;">Настройки</h3>
          <button @click="closeSettings" class="close-btn">✕</button>
        </div>

        <div class="modal-body">
          <div class="settings-section">
            <label class="settings-label">Изменить имя:</label>
            <div class="input-group">
              <input
                v-model="newName"
                type="text"
                class="settings-input"
                placeholder="Новое имя"
                @keyup.enter="updateName"
              />
              <button
                @click="updateName"
                class="settings-btn-small"
                :disabled="!newName || updatingName"
              >
                {{ updatingName ? '...' : '✓' }}
              </button>
            </div>
            <div v-if="updateMessage" class="message" :class="{ error: updateError, success: !updateError }">
              {{ updateMessage }}
            </div>
          </div>

          <div class="settings-section divider-top">
            <label class="settings-label">Опасная зона:</label>
            <button @click="logout" class="button-logout">
              🚪 Выйти из аккаунта
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- МОДАЛЬНОЕ ОКНО "СТАТЬ УЧИТЕЛЕМ" -->
    <div v-if="showBecomeMentorModal" class="modal-backdrop" @click.self="closeBecomeMentorModal">
      <div class="modal card">
        <div class="modal-header">
          <h3 style="margin: 0;">👨‍🏫 Стать учителем</h3>
          <button @click="closeBecomeMentorModal" class="close-btn">✕</button>
        </div>

        <div class="modal-body">
          <div class="info-block">
            <p>Чтобы стать учителем, откройте наш Telegram-бот и нажмите кнопку "👨‍🏫 Стать учителем"</p>
            <a href="https://t.me/playexmathbot" target="_blank" class="button" style="margin-top: 16px; width: 100%;">
              <span>📱 Открыть бота</span>
            </a>
          </div>
        </div>
      </div>
    </div>

    <!-- МОДАЛЬНОЕ ОКНО "МОИ УЧЕНИКИ" (ТОЛЬКО ДЛЯ НАСТАВНИКОВ) -->
    <div v-if="showStudentsModal" class="modal-backdrop" @click.self="closeStudentsModal">
      <div class="modal card">
        <div class="modal-header">
          <h3 style="margin: 0;">👥 Мои ученики</h3>
          <button @click="closeStudentsModal" class="close-btn">✕</button>
        </div>

        <div class="modal-body">
          <div class="settings-section">
            <label class="settings-label">Добавить ученика по ID:</label>
            <div class="input-group">
              <input
                v-model="studentIdInput"
                type="text"
                class="settings-input"
                placeholder="Введите ID ученика"
                @keyup.enter="addStudent"
              />
              <button
                @click="addStudent"
                class="settings-btn-small"
                :disabled="!studentIdInput || addingStudent"
              >
                {{ addingStudent ? '...' : '+' }}
              </button>
            </div>
            <div v-if="addStudentMessage" class="message" :class="{ error: addStudentError, success: !addStudentError }">
              {{ addStudentMessage }}
            </div>
          </div>

          <div class="settings-section divider-top">
            <label class="settings-label">Список учеников:</label>
            <div v-if="loadingStudents" class="text-center muted">
              Загрузка...
            </div>
            <div v-else-if="students.length === 0" class="text-center muted">
              У вас пока нет учеников
            </div>
            <div v-else class="list-container">
              <div v-for="student in students" :key="student.id" class="list-item">
                <div class="list-item-info">
                  <div class="list-item-name">{{ student.name }}</div>
                  <div class="muted" style="font-size: 12px;">ID: {{ student.id }} • Решено: {{ student.solved_count }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- МОДАЛЬНОЕ ОКНО "МОИ НАСТАВНИКИ" (ТОЛЬКО ПРОСМОТР) -->
    <div v-if="showMentorsModal" class="modal-backdrop" @click.self="closeMentorsModal">
      <div class="modal card">
        <div class="modal-header">
          <h3 style="margin: 0;">👨‍🏫 Мои наставники</h3>
          <button @click="closeMentorsModal" class="close-btn">✕</button>
        </div>

        <div class="modal-body">
          <div class="settings-section">
            <div class="info-block" style="margin-bottom: 16px;">
              <p style="font-size: 13px; line-height: 1.6;">
                ℹ️ Наставники добавляют учеников сами.<br>
                Сообщите ваш ID наставнику: <strong style="color: var(--accent);">{{ userId }}</strong>
              </p>
            </div>
          </div>

          <div class="settings-section divider-top">
            <label class="settings-label">Список наставников:</label>
            <div v-if="loadingMentors" class="text-center muted">
              Загрузка...
            </div>
            <div v-else-if="mentors.length === 0" class="text-center muted">
              У вас пока нет наставников
            </div>
            <div v-else class="list-container">
              <div v-for="mentor in mentors" :key="mentor.id" class="list-item">
                <div class="list-item-info">
                  <div class="list-item-name">{{ mentor.name }}</div>
                  <div class="muted" style="font-size: 12px;">ID: {{ mentor.id }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { api } from '../api'
import { store } from '../store.js'

export default {
  name: 'ProfileView',
  data() {
    return {
      profile: null,
      stats: null,
      showSettings: false,
      newName: '',
      updatingName: false,
      updateMessage: '',
      updateError: false,
      isAuthorized: false,
      
      // Статус наставника
      isMentor: false,
      userId: null,
      userRole: 'обучающийся',
      
      // Копирование ID
      copied: false,
      copyMessage: 'Копировать ID',
      
      // Модалки
      showBecomeMentorModal: false,
      showStudentsModal: false,
      showMentorsModal: false,
      
      // Ученики
      students: [],
      loadingStudents: false,
      studentIdInput: '',
      addingStudent: false,
      addStudentMessage: '',
      addStudentError: false,
      
      // Наставники
      mentors: [],
      loadingMentors: false,
    }
  },
  
  async mounted() {
    this.checkAuthorization()
    if (this.isAuthorized) {
      await this.load()
      await this.loadProfileStatus()
    }
  },
  
  methods: {
    checkAuthorization() {
      const savedEmail = localStorage.getItem('email')
      if (savedEmail) {
        this.isAuthorized = true
        console.log('✅ Профиль: пользователь авторизован', savedEmail)
      } else {
        this.isAuthorized = false
        console.warn('⚠️ Профиль: пользователь не авторизован')
      }
    },

    async load() {
      try {
        const savedEmail = localStorage.getItem('email')
        if (savedEmail) {
          console.log('📧 Загружаю профиль Email пользователя:', savedEmail)
          this.profile = await api.getProfile(savedEmail, 'email')
          this.stats = await api.getStats(savedEmail, 'email')
          this.newName = this.profile.name
        } else {
          console.log('⚠️ Пользователь не найден')
        }
      } catch (err) {
        console.error('❌ Ошибка загрузки профиля:', err)
      }
    },

    async loadProfileStatus() {
      try {
        const status = await api.getProfileStatus()
        this.isMentor = status.is_mentor
        this.userId = status.user_id
        this.userRole = status.role
        console.log('✅ Статус загружен:', status)
      } catch (err) {
        console.error('❌ Ошибка загрузки статуса:', err)
      }
    },

    async copyUserId() {
      try {
        await navigator.clipboard.writeText(String(this.userId))
        this.copied = true
        this.copyMessage = 'Скопировано!'
        setTimeout(() => {
          this.copied = false
          this.copyMessage = 'Копировать ID'
        }, 2000)
      } catch (err) {
        console.error('❌ Ошибка копирования:', err)
      }
    },

    openSettings() {
      this.showSettings = true
      this.updateMessage = ''
      this.updateError = false
    },

    closeSettings() {
      this.showSettings = false
      this.updateMessage = ''
      this.updateError = false
    },

    async updateName() {
      if (!this.newName.trim()) {
        this.updateMessage = 'Укажите новое имя'
        this.updateError = true
        return
      }

      this.updatingName = true
      try {
        await api.updateProfile(this.newName)
        this.profile.name = this.newName
        this.updateMessage = '✓ Имя успешно обновлено'
        this.updateError = false
        setTimeout(() => {
          this.closeSettings()
        }, 1500)
      } catch (e) {
        this.updateMessage = e.message || 'Ошибка при обновлении имени'
        this.updateError = true
        console.error('❌ Ошибка обновления имени:', e)
      } finally {
        this.updatingName = false
      }
    },

    logout() {
      if (confirm('Вы уверены, что хотите выйти из аккаунта?')) {
        store.logout()
        this.isAuthorized = false
        this.$router.push('/register')
      }
    },

    // === МОДАЛКА "СТАТЬ УЧИТЕЛЕМ" ===
    openBecomeMentorModal() {
      this.showBecomeMentorModal = true
    },

    closeBecomeMentorModal() {
      this.showBecomeMentorModal = false
    },

    // === МОДАЛКА "МОИ УЧЕНИКИ" ===
    async openStudentsModal() {
      this.showStudentsModal = true
      this.addStudentMessage = ''
      this.addStudentError = false
      await this.loadStudents()
    },

    closeStudentsModal() {
      this.showStudentsModal = false
      this.studentIdInput = ''
      this.addStudentMessage = ''
    },

    async loadStudents() {
      this.loadingStudents = true
      try {
        const result = await api.getMyStudents()
        this.students = result.students || []
        console.log('✅ Ученики загружены:', this.students)
      } catch (err) {
        console.error('❌ Ошибка загрузки учеников:', err)
      } finally {
        this.loadingStudents = false
      }
    },

    async addStudent() {
      const studentIdStr = String(this.studentIdInput || '').trim()
      
      if (!studentIdStr) {
        this.addStudentMessage = 'Укажите ID ученика'
        this.addStudentError = true
        return
      }

      const studentId = parseInt(studentIdStr)
      
      if (isNaN(studentId)) {
        this.addStudentMessage = 'ID должен быть числом'
        this.addStudentError = true
        return
      }

      this.addingStudent = true
      try {
        const result = await api.addStudent(studentId)
        this.addStudentMessage = result.message
        this.addStudentError = false
        this.studentIdInput = ''
        
        await this.loadStudents()
        
        setTimeout(() => {
          this.addStudentMessage = ''
        }, 3000)
      } catch (e) {
        this.addStudentMessage = e.message || 'Ошибка добавления ученика'
        this.addStudentError = true
        console.error('❌ Ошибка добавления ученика:', e)
      } finally {
        this.addingStudent = false
      }
    },

    // === МОДАЛКА "МОИ НАСТАВНИКИ" (ТОЛЬКО ПРОСМОТР) ===
    async openMentorsModal() {
      this.showMentorsModal = true
      await this.loadMentors()
    },

    closeMentorsModal() {
      this.showMentorsModal = false
    },

    async loadMentors() {
      this.loadingMentors = true
      try {
        const result = await api.getMyMentors()
        this.mentors = result.mentors || []
        console.log('✅ Наставники загружены:', this.mentors)
      } catch (err) {
        console.error('❌ Ошибка загрузки наставников:', err)
      } finally {
        this.loadingMentors = false
      }
    },
  }
}
</script>

<style scoped>
.page {
  padding: 20px;
  max-width: 900px;
  margin: 0 auto;
  width: 100%;
}

.container {
  display: flex;
  gap: 20px;
  align-items: flex-start;
  width: 100%;
}

.card {
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 24px;
  backdrop-filter: blur(20px);
  width: 100%;
}

.auth-required {
  max-width: 500px;
  margin: 40px auto;
  text-align: center;
  padding: 40px 24px;
}

.auth-icon {
  font-size: 64px;
  margin-bottom: 16px;
  display: block;
}

h2 {
  background: var(--gradient-primary);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  font-size: 28px;
  margin: 0;
}

h3 {
  color: var(--text-primary);
  margin: 0;
  word-break: break-word;
}

.muted {
  color: var(--text-muted);
  font-size: 14px;
}

.v-stack {
  display: flex;
  flex-direction: column;
}

.header-with-settings {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  gap: 12px;
}

.settings-btn {
  background: var(--bg-tertiary);
  border: 1px solid var(--border);
  border-radius: 8px;
  width: 40px;
  height: 40px;
  min-width: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  flex-shrink: 0;
}

.settings-btn:hover {
  border-color: var(--accent);
  background: var(--accent-transparent);
}

.profile-card {
  background: var(--bg-tertiary);
  padding: 20px;
  border-radius: 12px;
  border: 1px solid var(--border);
}

.profile-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  gap: 12px;
  flex-wrap: wrap;
}

.profile-left {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 0;
}

.avatar {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: var(--gradient-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #000;
  flex-shrink: 0;
}

.user-id-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: var(--bg-secondary);
  padding: 6px 12px;
  border-radius: 20px;
  border: 1px solid var(--border);
  font-size: 13px;
  font-weight: 600;
  color: var(--accent);
  white-space: nowrap;
}

.copy-btn-mini {
  background: transparent;
  border: none;
  color: var(--accent);
  cursor: pointer;
  padding: 2px;
  font-size: 14px;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.copy-btn-mini:hover {
  transform: scale(1.1);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
  gap: 12px;
  width: 100%;
}

.stat-card {
  background: var(--bg-secondary);
  padding: 12px;
  border-radius: 8px;
  text-align: center;
  border: 1px solid var(--border);
}

.stat-big {
  font-size: 28px;
  font-weight: 700;
  color: var(--accent);
  word-break: break-word;
}

.id-hint {
  margin-top: 16px;
  padding: 12px;
  background: var(--bg-secondary);
  border-radius: 8px;
  border: 1px solid var(--border);
}

.actions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 12px;
  width: 100%;
}

.button {
  background: var(--gradient-primary);
  color: #000;
  border: none;
  padding: 12px 16px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  text-decoration: none;
  font-size: 14px;
  min-height: 44px;
  word-break: break-word;
}

.button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 255, 136, 0.3);
}

.button.ghost {
  background: transparent;
  color: var(--text-primary);
  border: 1px solid var(--border);
}

.button.ghost:hover {
  border-color: var(--accent);
  color: var(--accent);
}

.text-center {
  text-align: center;
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

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--border);
  gap: 12px;
}

.modal-header h3 {
  font-size: 20px;
  flex: 1;
}

.close-btn {
  background: transparent;
  border: none;
  color: var(--text-muted);
  font-size: 24px;
  cursor: pointer;
  transition: color 0.3s ease;
  padding: 0;
  width: 32px;
  height: 32px;
  min-width: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.close-btn:hover {
  color: var(--text-primary);
}

.modal-body {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.settings-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.divider-top {
  padding-top: 20px;
  border-top: 1px solid var(--border);
}

.settings-label {
  display: block;
  font-weight: 600;
  color: var(--text-primary);
  font-size: 14px;
  margin-bottom: 8px;
}

.input-group {
  display: flex;
  gap: 8px;
  width: 100%;
}

.settings-input {
  flex: 1;
  min-width: 0;
  background: var(--bg-tertiary);
  border: 2px solid var(--border);
  border-radius: 8px;
  padding: 10px 14px;
  color: var(--text-primary);
  font-size: 14px;
  transition: all 0.3s ease;
}

.settings-input:focus {
  outline: none;
  border-color: var(--accent);
}

.settings-btn-small {
  background: var(--gradient-primary);
  color: #000;
  border: none;
  padding: 10px 16px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 50px;
  flex-shrink: 0;
}

.settings-btn-small:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(0, 255, 136, 0.3);
}

.settings-btn-small:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.button-logout {
  background: rgba(255, 68, 68, 0.1);
  border: 2px solid rgba(255, 68, 68, 0.3);
  color: #ff4444;
  padding: 12px 16px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  width: 100%;
  min-height: 44px;
}

.button-logout:hover {
  background: rgba(255, 68, 68, 0.2);
  border-color: #ff4444;
}

.message {
  padding: 10px 12px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  word-break: break-word;
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

.info-block {
  padding: 16px;
  background: var(--bg-tertiary);
  border-radius: 8px;
  border: 1px solid var(--border);
}

.info-block p {
  margin: 0;
  color: var(--text-secondary);
  line-height: 1.6;
}

.list-container {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 300px;
  overflow-y: auto;
}

.list-item {
  background: var(--bg-tertiary);
  padding: 12px;
  border-radius: 8px;
  border: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.list-item-info {
  flex: 1;
  min-width: 0;
}

.list-item-name {
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 4px;
  word-break: break-word;
}

@media (max-width: 768px) {
  .page {
    padding: 12px;
  }
  
  .modal {
    max-width: 95%;
  }
  
  .actions-grid {
    grid-template-columns: 1fr;
  }
  
  .user-id-badge {
    font-size: 11px;
    padding: 4px 10px;
  }
}

@media (max-width: 480px) {
  h3 {
    font-size: 14px;
  }
  
  .user-id-badge {
    font-size: 10px;
    padding: 4px 8px;
  }
  
  .copy-btn-mini {
    font-size: 12px;
  }
}
</style>
