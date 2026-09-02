<template>
  <div class="page schedule-page">
    <!-- ЗАГОЛОВОК СТРАНИЦЫ -->
    <div class="header-section">
      <div class="header-content">
        <div class="header-titles">
          <h1>Расписание уроков 📅</h1>
          <p class="subtitle">
            {{ isMentor ? 'Управление занятиями учеников и онлайн-встречами (время по МСК)' : 'Ваши запланированные занятия с преподавателями (время по МСК)' }}
          </p>
        </div>
        <button v-if="isMentor" class="button add-lesson-btn" @click="openCreateModal">
          <span>➕</span> Запланировать урок
        </button>
      </div>

      <!-- ИНФО-БАННЕР О TELEGRAM УВЕДОМЛЕНИЯХ -->
      <div class="tg-status-banner" :class="{ linked: hasTelegram }">
        <div class="tg-status-icon">{{ hasTelegram ? '🔔' : '⚠️' }}</div>
        <div class="tg-status-text">
          <strong v-if="hasTelegram">Telegram-уведомления активны:</strong>
          <strong v-else>Telegram не привязан:</strong>
          <span>
            {{ hasTelegram 
                ? `Бот напомнит об уроке за 1 час и за 15 минут до начала (по МСК).` 
                : `Привяжите Telegram в Профиле, чтобы получать напоминания об уроках в боте!` }}
          </span>
        </div>
        <router-link v-if="!hasTelegram" to="/profile" class="tg-link-btn">
          Привязать Telegram →
        </router-link>
      </div>
    </div>

    <!-- ТАБЫ ФИЛЬТРА (ПРЕДСТОЯЩИЕ / ВСЕ / ПРОШЕДШИЕ) -->
    <div class="filter-tabs">
      <button 
        class="filter-tab" 
        :class="{ active: filterTab === 'upcoming' }"
        @click="filterTab = 'upcoming'"
      >
        ⏳ Предстоящие ({{ upcomingLessons.length }})
      </button>
      <button 
        class="filter-tab" 
        :class="{ active: filterTab === 'past' }"
        @click="filterTab = 'past'"
      >
        ✅ Прошедшие ({{ pastLessons.length }})
      </button>
      <button 
        class="filter-tab" 
        :class="{ active: filterTab === 'all' }"
        @click="filterTab = 'all'"
      >
        📋 Все ({{ lessons.length }})
      </button>
    </div>

    <!-- ЗАГРУЗКА -->
    <div v-if="loading" class="text-center py-10">
      <div class="spinner">⏳</div>
      <p class="muted mt-2">Загружаем расписание уроков...</p>
    </div>

    <!-- ПУСТОЙ СПИСОК -->
    <div v-else-if="filteredLessons.length === 0" class="card empty-card">
      <div class="empty-icon">🗓️</div>
      <h3>{{ filterTab === 'upcoming' ? 'Нет предстоящих уроков' : 'Уроки не найдены' }}</h3>
      <p class="muted">
        {{ isMentor 
            ? 'Нажмите кнопку «Запланировать урок», чтобы назначить онлайн-занятие ученику.' 
            : 'Ваш наставник пока не назначил вам занятий на этот период.' }}
      </p>
      <button v-if="isMentor && filterTab === 'upcoming'" class="button mt-4" @click="openCreateModal">
        ➕ Запланировать первый урок
      </button>
    </div>

    <!-- СПИСОК КАРТОЧЕК УРОКОВ -->
    <div v-else class="lessons-grid">
      <div 
        v-for="lesson in filteredLessons" 
        :key="lesson.id" 
        class="card lesson-card"
        :class="{ 'is-past': isPast(lesson.start_time) }"
      >
        <div class="lesson-header">
          <span class="subject-badge" :class="getSubjectClass(lesson.subject)">
            {{ lesson.subject }}
          </span>
          <span class="duration-badge">⏱️ {{ lesson.duration_minutes }} мин</span>
        </div>

        <h3 class="lesson-title">{{ lesson.title }}</h3>

        <div class="lesson-details">
          <div class="detail-row">
            <span class="detail-icon">⏰</span>
            <div>
              <strong>{{ formatDate(lesson.start_time) }}</strong>
              <div class="time-relative" :class="{ soon: isSoon(lesson.start_time) }">
                {{ formatRelativeTime(lesson.start_time) }}
              </div>
            </div>
          </div>

          <div class="detail-row">
            <span class="detail-icon">{{ isMentor ? '👨‍🎓' : '👨‍🏫' }}</span>
            <div>
              <span class="muted">{{ isMentor ? 'Ученик:' : 'Преподаватель:' }}</span>
              <strong>{{ isMentor ? lesson.student_name : lesson.mentor_name }}</strong>
            </div>
          </div>

          <div v-if="lesson.notes" class="detail-row notes-row">
            <span class="detail-icon">📝</span>
            <span class="notes-text">{{ lesson.notes }}</span>
          </div>
        </div>

        <!-- КНОПКИ ДЕЙСТВИЙ -->
        <div class="lesson-actions">
          <a 
            v-if="lesson.lesson_link" 
            :href="formatUrl(lesson.lesson_link)" 
            target="_blank" 
            class="button link-btn"
          >
            🚀 Войти на урок
          </a>
          <span v-else class="no-link-badge">Ссылка не указана</span>

          <button 
            v-if="isMentor" 
            class="button ghost delete-btn" 
            @click="deleteLesson(lesson.id)"
            title="Отменить урок"
          >
            🗑️
          </button>
        </div>
      </div>
    </div>

    <!-- МОДАЛЬНОЕ ОКНО СОЗДАНИЯ УРОКА (ДЛЯ НАСТАВНИКА) -->
    <div v-if="showCreateModal" class="modal-backdrop" @click.self="showCreateModal = false">
      <div class="card modal create-lesson-modal">
        <div class="modal-header">
          <h2>Запланировать урок 📅</h2>
          <button class="close-btn" @click="showCreateModal = false">×</button>
        </div>

        <form @submit.prevent="submitCreateLesson" class="modal-body">
          <div class="form-group">
            <label class="form-label">Ученик *</label>
            <select v-model="newLesson.student_id" required class="input select-input">
              <option value="" disabled>Выберите ученика</option>
              <option v-for="st in myStudents" :key="st.id" :value="st.id">
                {{ st.name }} (ID: {{ st.id }})
              </option>
            </select>
            <div v-if="myStudents.length === 0" class="muted text-small text-warn">
              ⚠️ У вас пока нет учеников. Добавьте их во вкладке «Профиль».
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Предмет *</label>
            <div class="subject-pills">
              <button 
                type="button" 
                v-for="sub in ['Математика', 'Информатика', 'Физика']" 
                :key="sub"
                class="subject-pill" 
                :class="{ active: newLesson.subject === sub }"
                @click="newLesson.subject = sub"
              >
                {{ sub }}
              </button>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Тема урока / Название *</label>
            <input 
              v-model="newLesson.title" 
              type="text" 
              required 
              class="input" 
              placeholder="Например: Разбор задач №13 и №15 ЕГЭ" 
            />
          </div>

          <div class="form-row">
            <div class="form-group flex-1">
              <label class="form-label">Дата и время начала (МСК) *</label>
              <input 
                v-model="newLesson.start_time" 
                type="datetime-local" 
                required 
                class="input" 
              />
            </div>
            <div class="form-group flex-1">
              <label class="form-label">Длительность</label>
              <select v-model.number="newLesson.duration_minutes" class="input">
                <option :value="45">45 минут</option>
                <option :value="60">60 минут (1 час)</option>
                <option :value="90">90 минут (1.5 ч)</option>
                <option :value="120">120 минут (2 ч)</option>
              </select>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Ссылка на видеозвонок (Zoom / Meet / Discord / TG)</label>
            <input 
              v-model="newLesson.lesson_link" 
              type="text" 
              class="input" 
              placeholder="https://meet.google.com/xyz или https://t.me/..." 
            />
          </div>

          <div class="form-group">
            <label class="form-label">Заметки / Дополнительно</label>
            <textarea 
              v-model="newLesson.notes" 
              class="input textarea" 
              placeholder="Что подготовить к уроку..."
              rows="2"
            ></textarea>
          </div>

          <div class="modal-footer">
            <button type="button" class="button ghost" @click="showCreateModal = false">Отмена</button>
            <button type="submit" class="button" :disabled="submitting || !newLesson.student_id || !newLesson.title">
              {{ submitting ? '⏳ Сохранение...' : '✓ Назначить урок' }}
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
  name: 'ScheduleView',
  data() {
    return {
      lessons: [],
      myStudents: [],
      loading: true,
      submitting: false,
      filterTab: 'upcoming', // 'upcoming' | 'past' | 'all'
      showCreateModal: false,

      newLesson: {
        student_id: '',
        subject: 'Математика',
        title: '',
        start_time: '',
        duration_minutes: 60,
        lesson_link: '',
        notes: '',
      }
    }
  },
  computed: {
    profile() {
      return store.profile
    },
    isMentor() {
      return !!this.profile?.is_mentor
    },
    hasTelegram() {
      return !!this.profile?.telegram_id
    },
    upcomingLessons() {
      const now = new Date()
      return this.lessons.filter(l => new Date(l.start_time) >= now)
    },
    pastLessons() {
      const now = new Date()
      return this.lessons.filter(l => new Date(l.start_time) < now)
    },
    filteredLessons() {
      if (this.filterTab === 'upcoming') return this.upcomingLessons
      if (this.filterTab === 'past') return this.pastLessons
      return this.lessons
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
    await this.loadSchedule()
  },
  methods: {
    async loadSchedule() {
      try {
        this.loading = true
        if (this.isMentor) {
          const res = await api.getMentorLessons()
          this.lessons = res.lessons || []
          const stRes = await api.getMyStudents()
          this.myStudents = stRes.students || []
        } else {
          const res = await api.getStudentLessons()
          this.lessons = res.lessons || []
        }
      } catch (e) {
        console.error('Ошибка загрузки расписания:', e)
      } finally {
        this.loading = false
      }
    },

    openCreateModal() {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      tomorrow.setHours(16, 0, 0, 0)
      
      const pad = (n) => String(n).padStart(2, '0')
      const localISO = `${tomorrow.getFullYear()}-${pad(tomorrow.getMonth() + 1)}-${pad(tomorrow.getDate())}T${pad(tomorrow.getHours())}:${pad(tomorrow.getMinutes())}`

      this.newLesson = {
        student_id: this.myStudents.length > 0 ? this.myStudents[0].id : '',
        subject: 'Математика',
        title: '',
        start_time: localISO,
        duration_minutes: 60,
        lesson_link: '',
        notes: '',
      }
      this.showCreateModal = true
    },

    async submitCreateLesson() {
      try {
        this.submitting = true
        const payload = {
          ...this.newLesson,
          start_time: new Date(this.newLesson.start_time).toISOString(),
        }
        await api.createLesson(payload)
        this.showCreateModal = false
        await this.loadSchedule()
        notify.success('Урок успешно запланирован! Ученику отправлено уведомление в Telegram.')
      } catch (e) {
        notify.error(e.message || 'Ошибка создания урока')
      } finally {
        this.submitting = false
      }
    },

    async deleteLesson(id) {
      const confirmed = await notify.confirm(
        'Вы уверены, что хотите отменить этот урок? Он будет удален из расписания.',
        'Отмена урока',
        'Удалить урок',
        'Оставить'
      )
      if (!confirmed) return

      try {
        await api.deleteLesson(id)
        notify.success('Урок успешно удален из расписания')
        await this.loadSchedule()
      } catch (e) {
        notify.error(e.message || 'Ошибка удаления урока')
      }
    },

    formatDate(dateStr) {
      if (!dateStr) return '—'
      const d = new Date(dateStr)
      const formatted = d.toLocaleDateString('ru-RU', {
        timeZone: 'Europe/Moscow',
        weekday: 'short',
        day: 'numeric',
        month: 'long',
        hour: '2-digit',
        minute: '2-digit',
      })
      return `${formatted} МСК`
    },

    formatRelativeTime(dateStr) {
      if (!dateStr) return ''
      const diffMs = new Date(dateStr) - new Date()
      const diffMin = Math.round(diffMs / 60000)

      if (diffMin < 0) return 'Урок завершен'
      if (diffMin <= 15) return '🔥 Начнется через ' + diffMin + ' мин!'
      if (diffMin <= 60) return '⏰ Через ' + diffMin + ' мин'
      
      const diffHours = Math.floor(diffMin / 60)
      if (diffHours < 24) return `Через ${diffHours} ч ${diffMin % 60} мин`
      
      const diffDays = Math.floor(diffHours / 24)
      return `Через ${diffDays} дн.`
    },

    isPast(dateStr) {
      return new Date(dateStr) < new Date()
    },

    isSoon(dateStr) {
      const diff = (new Date(dateStr) - new Date()) / 60000
      return diff >= 0 && diff <= 60
    },

    getSubjectClass(subject) {
      if (subject === 'Информатика') return 'subj-cs'
      if (subject === 'Физика') return 'subj-phys'
      return 'subj-math'
    },

    formatUrl(url) {
      if (!url) return '#'
      if (url.startsWith('http://') || url.startsWith('https://')) return url
      return 'https://' + url
    }
  }
}
</script>

<style scoped>
.schedule-page {
  animation: fadeIn 0.3s ease-out;
}

.header-section {
  margin-bottom: 24px;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
}

.header-titles {
  flex: 1;
  min-width: 260px;
}

h1 {
  font-size: 26px;
  font-weight: 800;
  color: var(--text-primary);
  margin-bottom: 4px;
}

.subtitle {
  color: var(--text-muted);
  font-size: 13px;
  line-height: 1.4;
}

.add-lesson-btn {
  white-space: nowrap;
}

/* TG БАННЕР */
.tg-status-banner {
  display: flex;
  align-items: center;
  gap: 12px;
  background: rgba(255, 204, 0, 0.08);
  border: 1px solid rgba(255, 204, 0, 0.25);
  border-radius: 12px;
  padding: 12px 16px;
  margin-top: 16px;
  font-size: 13px;
}

.tg-status-banner.linked {
  background: rgba(0, 255, 136, 0.06);
  border-color: rgba(0, 255, 136, 0.25);
}

.tg-status-icon {
  font-size: 20px;
}

.tg-status-text {
  flex: 1;
  color: var(--text-primary);
}

.tg-status-text strong {
  color: var(--accent);
  margin-right: 6px;
}

.tg-status-banner:not(.linked) .tg-status-text strong {
  color: #ffcc00;
}

.tg-link-btn {
  color: #ffcc00;
  font-weight: 700;
  text-decoration: underline;
  white-space: nowrap;
}

/* ФИЛЬТРЫ */
.filter-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
  overflow-x: auto;
  padding-bottom: 4px;
}

.filter-tab {
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  color: var(--text-secondary);
  padding: 8px 16px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s ease;
}

.filter-tab:hover {
  color: var(--text-primary);
  border-color: var(--border-light);
}

.filter-tab.active {
  background: var(--accent-transparent);
  color: var(--accent);
  border-color: var(--accent);
}

/* СЕТКА УРОКОВ */
.lessons-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 18px;
}

.lesson-card {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  border: 1.5px solid var(--border);
  padding: 20px;
  transition: all 0.25s ease;
}

.lesson-card:hover {
  border-color: rgba(0, 255, 136, 0.3);
}

.lesson-card.is-past {
  opacity: 0.6;
  filter: grayscale(0.2);
}

.lesson-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.subject-badge {
  font-size: 12px;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: 8px;
}

.subj-math {
  background: rgba(0, 255, 136, 0.15);
  color: var(--accent);
}

.subj-cs {
  background: rgba(102, 126, 234, 0.15);
  color: #769eff;
}

.subj-phys {
  background: rgba(255, 120, 0, 0.15);
  color: #ff9944;
}

.duration-badge {
  font-size: 12px;
  color: var(--text-muted);
}

.lesson-title {
  font-size: 17px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 14px;
  line-height: 1.35;
}

.lesson-details {
  display: flex;
  flex-direction: column;
  gap: 10px;
  background: var(--bg-tertiary);
  padding: 12px 14px;
  border-radius: 12px;
  margin-bottom: 16px;
}

.detail-row {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  font-size: 13px;
}

.detail-icon {
  font-size: 16px;
}

.time-relative {
  font-size: 11px;
  color: var(--text-muted);
  margin-top: 2px;
}

.time-relative.soon {
  color: var(--accent);
  font-weight: 700;
}

.notes-row {
  border-top: 1px solid var(--border);
  padding-top: 8px;
}

.notes-text {
  color: var(--text-secondary);
  font-size: 12px;
  font-style: italic;
}

.lesson-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.link-btn {
  flex: 1;
  justify-content: center;
  padding: 10px;
  font-size: 13px;
  font-weight: 700;
}

.no-link-badge {
  flex: 1;
  text-align: center;
  font-size: 12px;
  color: var(--text-muted);
  background: var(--bg-tertiary);
  padding: 10px;
  border-radius: 10px;
}

.delete-btn {
  padding: 10px 14px;
}

/* ПУСТОЕ СОСТОЯНИЕ */
.empty-card {
  text-align: center;
  padding: 48px 24px;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 12px;
}

/* МОДАЛЬНОЕ ОКНО */
.create-lesson-modal {
  max-width: 520px;
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: 20px;
  padding: 26px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.modal-header h2 {
  font-size: 20px;
  font-weight: 700;
  margin: 0;
}

.close-btn {
  background: none;
  border: none;
  color: var(--text-muted);
  font-size: 28px;
  cursor: pointer;
}

.modal-body {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-row {
  display: flex;
  gap: 12px;
}

.flex-1 { flex: 1; }

.form-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
}

.subject-pills {
  display: flex;
  gap: 8px;
}

.subject-pill {
  flex: 1;
  background: var(--bg-tertiary);
  border: 1px solid var(--border);
  color: var(--text-secondary);
  padding: 8px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.subject-pill.active {
  background: var(--accent-transparent);
  border-color: var(--accent);
  color: var(--accent);
}

.select-input {
  cursor: pointer;
}

.textarea {
  resize: vertical;
  min-height: 60px;
}

.text-warn {
  color: #ffcc00;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 12px;
}
</style>
