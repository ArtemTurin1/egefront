<template>
  <div class="page profile-page">
    <div class="header-section">
      <h1>Личный кабинет</h1>
      <p class="subtitle">Ваш профиль и настройки</p>
    </div>

    <div class="container" v-if="profile">
      <!-- Левая колонка: Основная инфа -->
      <div class="card v-stack main-info">
        <div class="avatar-placeholder">
          {{ profile.name ? profile.name.charAt(0).toUpperCase() : 'U' }}
        </div>
        
        <div class="user-name-box">
          <h2 class="user-name-text">{{ profile.name || 'Пользователь' }}</h2>
          <button class="button small ghost edit-nick-btn" @click="openEditNicknameModal" title="Сменить никнейм">
            ✏️ Сменить никнейм
          </button>
        </div>

        <p v-if="!isTgUser && profile.email" class="muted user-email">{{ profile.email }}</p>
        <p v-else-if="profile.telegram_username" class="muted user-email">@{{ profile.telegram_username }}</p>
        
        <div class="role-badge" :class="{ mentor: profile.is_mentor }">
          {{ profile.is_mentor ? 'Наставник' : 'Ученик' }}
        </div>

        <div class="info-details mt-4">
          <div class="info-row">
            <span class="muted">ID:</span>
            <span>{{ profile.id }}</span>
          </div>
          <div class="info-row">
            <span class="muted">Telegram:</span>
            <span v-if="profile.telegram_username" class="tg-linked-badge">
              ✓ @{{ profile.telegram_username }}
            </span>
            <span v-else class="tg-not-linked-badge">
              Не привязан
            </span>
          </div>
        </div>

        <!-- БЛОК ПРИВЯЗКИ TELEGRAM -->
        <div v-if="!profile.telegram_id" class="link-tg-box mt-4">
          <div class="link-tg-title">🤖 Привязать Telegram-бота</div>
          <div class="link-tg-desc">
            Получите код в <a href="https://t.me/ege_playex_bot" target="_blank" class="bot-link">@ege_playex_bot</a> (кнопка «📝 Получить код») и введите сюда для получения уведомлений об уроках и ДЗ:
          </div>
          <div class="link-tg-form">
            <input 
              v-model="tgCodeToLink" 
              type="text" 
              class="input text-center" 
              placeholder="Код (ABC123)" 
              maxlength="10" 
            />
            <button class="button" @click="linkTelegram" :disabled="!tgCodeToLink.trim() || linkingTg">
              {{ linkingTg ? '...' : 'Привязать' }}
            </button>
          </div>
        </div>

        <button class="button ghost full-width mt-4" @click="logout">Выйти</button>
      </div>

      <!-- Правая колонка: Наставничество -->
      <div class="card v-stack mentoring-info">
        
        <template v-if="profile.is_mentor">
          <h3>Мои ученики</h3>
          <div class="add-user-form">
            <input v-model="newStudentId" type="number" class="input" placeholder="ID ученика" />
            <button class="button" @click="addStudent" :disabled="!newStudentId">Добавить</button>
          </div>
          
          <div class="users-list mt-4">
            <div v-if="myStudents.length === 0" class="muted">У вас пока нет учеников.</div>
            <div v-for="student in myStudents" :key="student.id" class="user-item">
              <div class="user-info">
                <strong>{{ student.name }}</strong>
                <span v-if="student.email && !isTgEmail(student.email)" class="muted text-small">{{ student.email }}</span>
                <span v-else-if="student.telegram_username" class="muted text-small">@{{ student.telegram_username }}</span>
              </div>
              <span class="badge">ID: {{ student.id }}</span>
            </div>
          </div>
        </template>

        <template v-else>
          <h3>Мои наставники</h3>
          <div class="add-user-form">
            <input v-model="newMentorId" type="number" class="input" placeholder="ID наставника" />
            <button class="button" @click="addMentor" :disabled="!newMentorId">Добавить</button>
          </div>
          
          <div class="users-list mt-4">
            <div v-if="myMentors.length === 0" class="muted">У вас пока нет наставников.</div>
            <div v-for="mentor in myMentors" :key="mentor.id" class="user-item">
              <div class="user-info">
                <strong>{{ mentor.name }}</strong>
                <span v-if="mentor.email && !isTgEmail(mentor.email)" class="muted text-small">{{ mentor.email }}</span>
                <span v-else-if="mentor.telegram_username" class="muted text-small">@{{ mentor.telegram_username }}</span>
              </div>
              <span class="badge">ID: {{ mentor.id }}</span>
            </div>
          </div>
          
          <hr class="divider" />
          <div class="role-switch-hint text-center">
            <p class="muted mb-1">Сменить роль (Наставник / Ученик) можно через Telegram-бота:</p>
            <a href="https://t.me/ege_playex_bot" target="_blank" class="bot-link">
              🤖 @ege_playex_bot (кнопка «🔄 Сменить роль»)
            </a>
          </div>
        </template>
        
      </div>
    </div>

    <!-- МОДАЛЬНОЕ ОКНО СМЕНЫ НИКНЕЙМА -->
    <div v-if="showNicknameModal" class="modal-backdrop" @click.self="showNicknameModal = false">
      <div class="card modal nickname-modal">
        <div class="modal-header">
          <h3>Смена никнейма ✏️</h3>
          <button class="close-btn" @click="showNicknameModal = false">×</button>
        </div>
        <form @submit.prevent="saveNickname" class="modal-body">
          <p class="muted text-small mb-3">
            Укажите имя или никнейм, который будет отображаться в уроках и домашних заданиях:
          </p>
          <div class="form-group">
            <label class="form-label">Новый никнейм *</label>
            <input 
              v-model="editNicknameInput" 
              type="text" 
              class="input" 
              placeholder="Например: Иван Иванов или MathGenius" 
              maxlength="64"
              required 
            />
          </div>
          <div class="modal-footer mt-4">
            <button type="button" class="button ghost" @click="showNicknameModal = false">Отмена</button>
            <button type="submit" class="button" :disabled="savingNickname || !editNicknameInput.trim()">
              {{ savingNickname ? '⏳ Сохранение...' : '✓ Сохранить' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
import { api } from '../api.js'
import { store } from '../store.js'
import { notify } from '../notify.js'

export default {
  name: 'ProfileView',
  data() {
    return {
      newStudentId: '',
      newMentorId: '',
      myStudents: [],
      myMentors: [],
      tgCodeToLink: '',
      linkingTg: false,
      showNicknameModal: false,
      editNicknameInput: '',
      savingNickname: false,
    }
  },
  computed: {
    profile() {
      return store.profile
    },
    isTgUser() {
      if (!this.profile) return false
      return this.profile.auth_type === 'telegram' || 
        (this.profile.email && (this.profile.email.includes('@kogdaurok.local') || this.profile.email.startsWith('telegram_')))
    }
  },
  async mounted() {
    if (!this.profile) {
      await api.getMe()
    }
    if (!this.profile) {
      this.$router.push('/register')
      return
    }
    await this.loadMentoringData()
  },
  methods: {
    isTgEmail(email) {
      if (!email) return true
      return email.includes('@kogdaurok.local') || email.startsWith('telegram_')
    },

    openEditNicknameModal() {
      this.editNicknameInput = this.profile?.name || ''
      this.showNicknameModal = true
    },

    async saveNickname() {
      const trimmed = this.editNicknameInput.trim()
      if (!trimmed) {
        notify.warning('Никнейм не может быть пустым')
        return
      }
      try {
        this.savingNickname = true
        await api.updateProfile(trimmed)
        if (store.profile) {
          store.profile.name = trimmed
        }
        notify.success('Никнейм успешно обновлен!')
        this.showNicknameModal = false
      } catch (e) {
        notify.error(e.message || 'Ошибка обновления никнейма')
      } finally {
        this.savingNickname = false
      }
    },

    async loadMentoringData() {
      try {
        if (this.profile.is_mentor) {
          const res = await api.getMyStudents()
          this.myStudents = res.students || []
        } else {
          const res = await api.getMyMentors()
          this.myMentors = res.mentors || []
        }
      } catch (e) {
        console.error('Ошибка загрузки данных:', e)
      }
    },
    
    async addStudent() {
      try {
        const res = await api.addStudent(this.newStudentId)
        notify.success(res.message || 'Ученик успешно добавлен')
        this.newStudentId = ''
        await this.loadMentoringData()
      } catch (e) {
        notify.error(e.message || 'Ошибка добавления ученика')
      }
    },
    
    async addMentor() {
      try {
        const res = await api.addMentor(this.newMentorId)
        notify.success(res.message || 'Наставник успешно добавлен')
        this.newMentorId = ''
        await this.loadMentoringData()
      } catch (e) {
        notify.error(e.message || 'Ошибка добавления наставника')
      }
    },
    
    async linkTelegram() {
      if (!this.tgCodeToLink.trim()) return
      try {
        this.linkingTg = true
        const res = await api.linkTelegramCode(this.tgCodeToLink)
        notify.success(res.message || 'Telegram успешно привязан!')
        this.tgCodeToLink = ''
        await api.getMe()
      } catch (e) {
        notify.error(e.message || 'Ошибка привязки Telegram')
      } finally {
        this.linkingTg = false
      }
    },
    
    logout() {
      localStorage.removeItem('token')
      localStorage.removeItem('email')
      store.setUser(null)
      store.setProfile(null)
      this.$router.push('/register')
    }
  }
}
</script>

<style scoped>
.profile-page {
  animation: fadeIn 0.4s ease-out;
}

.container {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 20px;
}

@media (max-width: 768px) {
  .container {
    grid-template-columns: 1fr;
  }
}

.avatar-placeholder {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background: var(--gradient-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 40px;
  font-weight: bold;
  color: #000;
  margin: 0 auto 20px;
}

.main-info {
  align-items: center;
  text-align: center;
}

.role-badge {
  background: rgba(255, 255, 255, 0.1);
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 14px;
  margin-top: 10px;
}
.role-badge.mentor {
  background: rgba(0, 255, 136, 0.2);
  color: var(--success);
}

.info-details {
  width: 100%;
  text-align: left;
  background: var(--bg-tertiary);
  padding: 15px;
  border-radius: 12px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.add-user-form {
  display: flex;
  gap: 10px;
  margin-top: 15px;
}

.users-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.user-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: var(--bg-tertiary);
  padding: 12px 15px;
  border-radius: 12px;
  border: 1px solid var(--border);
}

.user-info {
  display: flex;
  flex-direction: column;
}

.text-small {
  font-size: 12px;
}

.badge {
  background: var(--bg-secondary);
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 12px;
  color: var(--text-secondary);
}

.tg-linked-badge {
  color: var(--accent);
  font-weight: 700;
  font-size: 13px;
}

.tg-not-linked-badge {
  color: var(--text-muted);
  font-size: 13px;
}

.link-tg-box {
  background: rgba(0, 255, 136, 0.04);
  border: 1px solid rgba(0, 255, 136, 0.2);
  border-radius: 12px;
  padding: 12px 14px;
  text-align: left;
}

.link-tg-title {
  font-size: 13px;
  font-weight: 700;
  color: var(--accent);
  margin-bottom: 4px;
}

.link-tg-desc {
  font-size: 12px;
  color: var(--text-secondary);
  line-height: 1.4;
  margin-bottom: 10px;
}

.bot-link {
  color: var(--accent);
  font-weight: 700;
  text-decoration: underline;
}

.link-tg-form {
  display: flex;
  gap: 8px;
}

.link-tg-form input {
  padding: 8px 12px;
  font-size: 13px;
  font-weight: 600;
}

.link-tg-form button {
  padding: 8px 14px;
  font-size: 13px;
  white-space: nowrap;
}

.full-width {
  width: 100%;
  justify-content: center;
}

.divider {
  border: 0;
  border-top: 1px solid var(--border);
  margin: 30px 0;
}

.mb-2 { margin-bottom: 8px; }
.mt-4 { margin-top: 16px; }

.user-name-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  margin-bottom: 4px;
}

.user-name-text {
  margin: 0;
  font-size: 22px;
  font-weight: 800;
  word-break: break-word;
}

.edit-nick-btn {
  font-size: 12px;
  padding: 4px 10px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: var(--accent);
  cursor: pointer;
  transition: all 0.2s ease;
}

.edit-nick-btn:hover {
  background: rgba(0, 255, 136, 0.12);
  border-color: var(--accent);
  transform: translateY(-1px);
}

.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 16px;
}

.nickname-modal {
  max-width: 440px;
  width: 100%;
  padding: 24px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.6);
  border-radius: 16px;
  background: #18181b;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.modal-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
}

.close-btn {
  background: none;
  border: none;
  color: var(--text-muted);
  font-size: 22px;
  cursor: pointer;
  padding: 4px 8px;
  line-height: 1;
}

.close-btn:hover {
  color: var(--text-primary);
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
