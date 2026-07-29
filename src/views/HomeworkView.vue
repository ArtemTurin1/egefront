<template>
  <div class="page">
    <!-- ТРЕБУЕТСЯ АВТОРИЗАЦИЯ -->
    <div v-if="!isAuthorized" class="card auth-required">
      <div class="auth-icon">🔐</div>
      <h2>Авторизация требуется</h2>
      <p class="muted">Для просмотра домашних заданий необходимо войти в аккаунт</p>
      <router-link to="/register" class="button">Зарегистрироваться</router-link>
    </div>

    <!-- ДЛЯ УЧЕНИКОВ -->
    <div v-else-if="!isMentor" class="container">
      <div class="card">
        <h2>📚 Мои домашние задания</h2>

        <div v-if="loading" class="text-center muted" style="padding: 40px;">
          ⏳ Загрузка...
        </div>

        <div v-else>
          <!-- НЕРЕШЕННЫЕ ДЗ -->
          <div class="homework-section">
            <h3>✍️ Нерешенные</h3>
            <div v-if="pendingHomework.length === 0" class="text-center muted" style="padding: 20px;">
              Нет нерешенных заданий
            </div>
            <div v-else class="homework-list">
              <div v-for="hw in pendingHomework" :key="hw.student_homework_id" class="homework-card pending">
                <div class="homework-header">
                  <div class="homework-title">{{ hw.title }}</div>
                  <div class="homework-status-badge pending">Не решено</div>
                </div>
                <div class="homework-meta">
                  <span>👨‍🏫 {{ hw.mentor_name }}</span>
                  <span>📐 {{ getSubjectLabel(hw.subject) }}</span>
                </div>
                <div class="homework-dates">
                  <span>📅 Создано: {{ formatDate(hw.created_at) }}</span>
                  <span v-if="hw.end_at" :class="{ 'deadline-soon': isDeadlineSoon(hw.end_at) }">
                    ⏰ До: {{ formatDate(hw.end_at) }}
                  </span>
                </div>
                <button @click="startHomework(hw)" class="button">📝 Решить</button>
              </div>
            </div>
          </div>

          <!-- РЕШЕННЫЕ ДЗ -->
          <div class="homework-section">
            <h3>✅ Решенные</h3>
            <div v-if="completedHomework.length === 0" class="text-center muted" style="padding: 20px;">
              Нет решенных заданий
            </div>
            <div v-else class="homework-list">
              <div v-for="hw in completedHomework" :key="hw.student_homework_id" class="homework-card completed">
                <div class="homework-header">
                  <div class="homework-title">{{ hw.title }}</div>
                  <div class="homework-status-badge completed">Решено</div>
                </div>
                <div class="homework-meta">
                  <span>👨‍🏫 {{ hw.mentor_name }}</span>
                  <span>📐 {{ getSubjectLabel(hw.subject) }}</span>
                </div>
                <div class="homework-stats">
                  <div class="stat-item">
                    <span class="stat-label">Правильно:</span>
                    <span class="stat-value correct">{{ hw.stats.correct }}/{{ hw.stats.total }}</span>
                  </div>
                  <div class="stat-item">
                    <span class="stat-label">Процент:</span>
                    <span class="stat-value">{{ hw.stats.percent }}%</span>
                  </div>
                  <div v-if="hw.stats.time_spent_seconds" class="stat-item">
                    <span class="stat-label">Время:</span>
                    <span class="stat-value">{{ formatTime(hw.stats.time_spent_seconds) }}</span>
                  </div>
                </div>
                <div class="homework-dates">
                  <span>📅 Выполнено: {{ formatDate(hw.stats.completed_at) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ДЛЯ НАСТАВНИКОВ -->
    <div v-else class="container">
      <div class="card">
        <h2>📚 Выданные домашние задания</h2>

        <div v-if="loading" class="text-center muted" style="padding: 40px;">
          ⏳ Загрузка...
        </div>

        <div v-else>
          <div v-if="mentorHomework.length === 0" class="text-center muted" style="padding: 40px;">
            Вы еще не выдавали домашних заданий
          </div>

          <div v-else class="homework-list">
            <div v-for="hw in mentorHomework" :key="hw.homework_id" class="homework-card mentor" @click="viewHomeworkDetails(hw.homework_id)">
              <div class="homework-header">
                <div class="homework-title">{{ hw.title }}</div>
                <div class="homework-stats-mini">
                  {{ hw.students_completed }}/{{ hw.students_total }} решено
                </div>
              </div>
              <div class="homework-meta">
                <span>📐 {{ getSubjectLabel(hw.subject) }}</span>
                <span>👥 {{ hw.students_total }} учеников</span>
              </div>
              <div class="homework-dates">
                <span>📅 Создано: {{ formatDate(hw.created_at) }}</span>
                <span v-if="hw.end_at">⏰ Срок: {{ formatDate(hw.end_at) }}</span>
              </div>
              <div class="progress-bar">
                <div class="progress-fill" :style="{ width: getProgressPercent(hw) + '%' }"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- МОДАЛЬНОЕ ОКНО ДЕТАЛЕЙ ДЗ НАСТАВНИКА -->
    <div v-if="showDetailsModal" class="modal-overlay" @click.self="closeDetails">
      <div class="modal-content modal-large">
        <button class="modal-close" @click="closeDetails">✕</button>
        
        <div v-if="loadingDetails" class="text-center muted" style="padding: 40px;">
          ⏳ Загрузка...
        </div>
        
        <div v-else-if="homeworkDetails">
          <h2>{{ homeworkDetails.homework.title }}</h2>
          
          <div class="details-summary">
            <div class="summary-item">
              <span class="label">Предмет:</span>
              <span class="value">{{ getSubjectLabel(homeworkDetails.homework.subject) }}</span>
            </div>
            <div class="summary-item">
              <span class="label">Учеников:</span>
              <span class="value">{{ homeworkDetails.homework.students_total }}</span>
            </div>
            <div class="summary-item">
              <span class="label">Решили:</span>
              <span class="value">{{ homeworkDetails.homework.students_completed }}</span>
            </div>
          </div>

          <h3>👥 Ученики</h3>
          <div class="students-list">
            <div v-for="student in homeworkDetails.students" :key="student.student_id" class="student-card">
              <div class="student-header">
                <div class="student-name">{{ student.student_name }}</div>
                <div class="student-status-badge" :class="student.status">
                  {{ student.status === 'completed' ? '✅ Решено' : '⏳ Ожидает' }}
                </div>
              </div>
              
              <div v-if="student.status === 'completed'" class="student-stats">
                <div class="stat-item">
                  <span>Правильно: <strong>{{ student.stats.correct }}/{{ student.stats.total }}</strong></span>
                </div>
                <div class="stat-item">
                  <span>Процент: <strong>{{ student.stats.percent }}%</strong></span>
                </div>
                <div v-if="student.stats.time_spent_seconds" class="stat-item">
                  <span>Время: <strong>{{ formatTime(student.stats.time_spent_seconds) }}</strong></span>
                </div>
                <div class="stat-item">
                  <span>Выполнено: {{ formatDate(student.completed_at) }}</span>
                </div>
              </div>
              
              <div v-else class="student-pending">
                <span class="muted">Задание еще не решено</span>
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
  name: 'HomeworkView',
  data() {
    return {
      store,
      isAuthorized: false,
      isMentor: false,
      loading: true,
      
      // Для учеников
      pendingHomework: [],
      completedHomework: [],
      
      // Для наставников
      mentorHomework: [],
      showDetailsModal: false,
      homeworkDetails: null,
      loadingDetails: false
    }
  },
  async mounted() {
    this.checkAuthorization()
    if (this.isAuthorized) {
      await this.loadData()
    }
  },
  methods: {
    checkAuthorization() {
      const savedEmail = localStorage.getItem('email')
      if (savedEmail && store.profile) {
        this.isAuthorized = true
        this.isMentor = store.profile.is_mentor
      } else {
        this.isAuthorized = false
      }
    },
    
    async loadData() {
      this.loading = true
      try {
        if (this.isMentor) {
          await this.loadMentorHomework()
        } else {
          await this.loadStudentHomework()
        }
      } catch (e) {
        console.error('Ошибка загрузки ДЗ:', e)
      } finally {
        this.loading = false
      }
    },
    
    async loadStudentHomework() {
      const result = await api.getStudentHomework()
      const items = result.items || []
      
      this.pendingHomework = items.filter(hw => hw.status === 'pending')
      this.completedHomework = items.filter(hw => hw.status === 'completed')
    },
    
    async loadMentorHomework() {
      const result = await api.getMentorHomeworkList()
      this.mentorHomework = result.items || []
    },
    
    async startHomework(hw) {
      try {
        const result = await api.startStudentHomework(hw.student_homework_id)
        this.$router.push(`/variant/${result.variant_id}`)
      } catch (e) {
        alert('Ошибка: ' + e.message)
      }
    },
    
    async viewHomeworkDetails(homeworkId) {
      this.showDetailsModal = true
      this.loadingDetails = true
      
      try {
        this.homeworkDetails = await api.getMentorHomeworkDetails(homeworkId)
      } catch (e) {
        console.error('Ошибка загрузки деталей:', e)
        alert('Ошибка загрузки деталей')
        this.closeDetails()
      } finally {
        this.loadingDetails = false
      }
    },
    
    closeDetails() {
      this.showDetailsModal = false
      this.homeworkDetails = null
    },
    
    getSubjectLabel(subject) {
      return subject === 'math' ? 'Математика' : 'Информатика'
    },
    
    formatDate(dateStr) {
      if (!dateStr) return '—'
      const d = new Date(dateStr)
      return d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    },
    
    formatTime(seconds) {
      const h = Math.floor(seconds / 3600)
      const m = Math.floor((seconds % 3600) / 60)
      const s = seconds % 60
      if (h > 0) return `${h}ч ${m}м`
      if (m > 0) return `${m}м ${s}с`
      return `${s}с`
    },
    
    isDeadlineSoon(endDate) {
      if (!endDate) return false
      const now = new Date()
      const end = new Date(endDate)
      const diff = end - now
      return diff > 0 && diff < 24 * 60 * 60 * 1000 // меньше суток
    },
    
    getProgressPercent(hw) {
      if (hw.students_total === 0) return 0
      return Math.round((hw.students_completed / hw.students_total) * 100)
    }
  }
}
</script>

<style scoped>
.page {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.container {
  width: 100%;
}

.card {
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 24px;
}

.auth-required {
  max-width: 500px;
  margin: 40px auto;
  text-align: center;
}

.auth-icon {
  font-size: 64px;
  margin-bottom: 16px;
}

h2 {
  background: var(--gradient-primary);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin: 0 0 24px 0;
  font-size: 24px;
}

h3 {
  color: var(--text-primary);
  margin: 24px 0 16px 0;
  font-size: 18px;
}

.muted {
  color: var(--text-muted);
}

.text-center {
  text-align: center;
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
  text-decoration: none;
  display: inline-block;
}

.button:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 255, 136, 0.3);
}

.homework-section {
  margin-bottom: 32px;
}

.homework-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.homework-card {
  background: var(--bg-tertiary);
  border: 2px solid var(--border);
  border-radius: 12px;
  padding: 16px;
  transition: all 0.3s ease;
}

.homework-card.mentor {
  cursor: pointer;
}

.homework-card.mentor:hover {
  border-color: var(--accent);
  transform: translateX(4px);
}

.homework-card.pending {
  border-left: 4px solid #ffc107;
}

.homework-card.completed {
  border-left: 4px solid var(--accent);
  opacity: 0.8;
}

.homework-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  gap: 12px;
}

.homework-title {
  font-weight: 600;
  color: var(--text-primary);
  font-size: 16px;
}

.homework-status-badge {
  padding: 4px 12px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
}

.homework-status-badge.pending {
  background: rgba(255, 193, 7, 0.2);
  color: #ffc107;
}

.homework-status-badge.completed {
  background: rgba(0, 255, 136, 0.2);
  color: var(--accent);
}

.homework-meta {
  display: flex;
  gap: 16px;
  font-size: 13px;
  color: var(--text-muted);
  margin-bottom: 8px;
  flex-wrap: wrap;
}

.homework-dates {
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: var(--text-muted);
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.deadline-soon {
  color: #ff4444;
  font-weight: 600;
}

.homework-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 12px;
  margin-top: 12px;
  padding: 12px;
  background: var(--bg-secondary);
  border-radius: 8px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-label {
  font-size: 11px;
  color: var(--text-muted);
  text-transform: uppercase;
}

.stat-value {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
}

.stat-value.correct {
  color: var(--accent);
}

.homework-stats-mini {
  background: var(--bg-secondary);
  padding: 4px 12px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
  color: var(--accent);
}

.progress-bar {
  width: 100%;
  height: 6px;
  background: var(--bg-secondary);
  border-radius: 3px;
  overflow: hidden;
  margin-top: 12px;
}

.progress-fill {
  height: 100%;
  background: var(--gradient-primary);
  transition: width 0.3s ease;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1001;
  padding: 20px;
  overflow-y: auto;
}

.modal-content {
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 32px;
  max-width: 800px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
}

.modal-close {
  position: absolute;
  top: 16px;
  right: 16px;
  background: transparent;
  border: none;
  color: var(--text-muted);
  font-size: 24px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.modal-close:hover {
  color: var(--text-primary);
  transform: scale(1.2);
}

.details-summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 16px;
  margin: 20px 0;
  padding: 16px;
  background: var(--bg-tertiary);
  border-radius: 12px;
}

.summary-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.summary-item .label {
  font-size: 12px;
  color: var(--text-muted);
}

.summary-item .value {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
}

.students-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.student-card {
  background: var(--bg-tertiary);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 16px;
}

.student-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  gap: 12px;
}

.student-name {
  font-weight: 600;
  color: var(--text-primary);
}

.student-status-badge {
  padding: 4px 12px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
}

.student-status-badge.completed {
  background: rgba(0, 255, 136, 0.2);
  color: var(--accent);
}

.student-status-badge.pending {
  background: rgba(255, 193, 7, 0.2);
  color: #ffc107;
}

.student-stats {
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: 13px;
  color: var(--text-muted);
}

.student-pending {
  font-size: 13px;
  font-style: italic;
}

@media (max-width: 768px) {
  .page {
    padding: 12px;
  }
  
  .card {
    padding: 16px;
  }
  
  .homework-meta,
  .homework-dates {
    flex-direction: column;
    gap: 8px;
  }
  
  .details-summary {
    grid-template-columns: 1fr;
  }
}
</style>
