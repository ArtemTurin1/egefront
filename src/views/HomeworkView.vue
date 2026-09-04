<template>
  <div class="page homework-page">
    <div class="header-section">
      <h1>Домашние задания</h1>
      <p class="subtitle">Управление учебным процессом и заданиями</p>
    </div>

    <!-- Вкладки (только для наставника) -->
    <div v-if="isMentor" class="tabs">
      <button :class="['tab', { active: currentTab === 'list' }]" @click="currentTab = 'list'">Мои ДЗ</button>
      <button :class="['tab', { active: currentTab === 'create' }]" @click="currentTab = 'create'">Создать ДЗ</button>
    </div>

    <!-- КОНТЕНТ ДЛЯ УЧИТЕЛЯ -->
    <template v-if="isMentor">
      
      <!-- Создание ДЗ -->
      <div v-if="currentTab === 'create'" class="card animate-fade-in">
        <h2>Новое задание</h2>
        <div class="form-group">
          <label>Название</label>
          <input v-model="newHomework.title" type="text" class="input" placeholder="Например: Введение в алгебру" />
        </div>
        <div class="form-group">
          <label>Описание (текст, ссылки)</label>
          <textarea v-model="newHomework.description" class="input textarea" placeholder="Подробное описание задачи..."></textarea>
        </div>
        
        <div class="form-group">
          <label>Прикрепить файлы</label>
          <input type="file" @change="handleFileUpload($event, 'create')" class="input-file" />
          <div v-if="uploading" class="muted">Загрузка...</div>
          <div class="attachments-list">
            <div v-for="(url, i) in newHomework.attachments" :key="i" class="attachment-item">
              <a :href="url" target="_blank">{{ url.split('/').pop() }}</a>
              <button @click="newHomework.attachments.splice(i, 1)" class="btn-icon">❌</button>
            </div>
          </div>
        </div>

        <button @click="createHomework" class="button" :disabled="!newHomework.title || loading">
          {{ loading ? 'Создание...' : 'Создать задание' }}
        </button>
      </div>

      <!-- Список созданных ДЗ -->
      <div v-if="currentTab === 'list' && !selectedMentorHomework" class="animate-fade-in">
        <div v-if="mentorHomeworks.length === 0" class="empty-state">
          Вы еще не создали ни одного задания.
        </div>
        <div class="homework-grid">
          <div v-for="hw in mentorHomeworks" :key="hw.homework_id" class="card hw-card" @click="openMentorHomework(hw.homework_id)">
            <h3>{{ hw.title }}</h3>
            <p class="muted">Создано: {{ formatDate(hw.created_at) }}</p>
            <div class="stats-row">
              <div class="stat-badge"><span class="icon">👥</span> Назначено: {{ hw.students_total }}</div>
              <div class="stat-badge success"><span class="icon">✅</span> Сдали: {{ hw.students_completed }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Детали ДЗ для учителя -->
      <div v-if="currentTab === 'list' && selectedMentorHomework" class="card details-card animate-fade-in">
        <button class="button ghost small mb-4" @click="selectedMentorHomework = null">← Назад к списку</button>
        
        <h2>{{ selectedMentorHomework.homework.title }}</h2>
        <div class="content-block">
          <h3>Описание</h3>
          <p class="pre-line">{{ selectedMentorHomework.homework.description || 'Нет описания' }}</p>
        </div>
        
        <div class="content-block" v-if="selectedMentorHomework.homework.attachments?.length">
          <h3>Вложения</h3>
          <div class="attachments-list">
            <a v-for="(url, i) in selectedMentorHomework.homework.attachments" :key="i" :href="url" target="_blank" class="attachment-link">📎 {{ url.split('/').pop() }}</a>
          </div>
        </div>

        <hr class="divider" />
        
        <div class="assign-section">
          <h3>Назначить ученикам</h3>
          <div class="assign-controls">
            <select v-model="selectedStudentToAssign" class="input">
              <option value="" disabled>Выберите ученика</option>
              <option v-for="s in myStudents" :key="s.id" :value="s.id">{{ getStudentDisplayName(s) }}</option>
            </select>
            <button class="button" @click="assignHomework" :disabled="!selectedStudentToAssign">Назначить</button>
          </div>
        </div>

        <hr class="divider" />

        <h3>Работы учеников</h3>
        <div class="student-works">
          <div v-if="selectedMentorHomework.students.length === 0" class="muted">Задание еще не назначено.</div>
          <div v-for="sw in selectedMentorHomework.students" :key="sw.student_homework_id" class="student-work-card">
            <div class="work-header">
              <span class="student-name">{{ sw.student_name }}</span>
              <span :class="['status-badge', sw.status]">{{ sw.status === 'completed' ? 'Сдано' : 'В процессе' }}</span>
            </div>
            <div v-if="sw.status === 'completed'" class="work-content">
              <p><strong>Комментарий ученика:</strong></p>
              <p class="pre-line">{{ sw.student_comment || 'Нет комментария' }}</p>
              
              <div v-if="sw.student_attachments?.length" class="mt-2">
                <p><strong>Вложения ученика:</strong></p>
                <a v-for="(url, i) in sw.student_attachments" :key="i" :href="url" target="_blank" class="attachment-link">📎 {{ url.split('/').pop() }}</a>
              </div>
              
              <div class="work-actions mt-4">
                <button class="button ghost warning" @click="reviewHomework(sw.student_homework_id, 'pending')">Вернуть на доработку</button>
              </div>
            </div>
          </div>
        </div>
      </div>

    </template>

    <!-- КОНТЕНТ ДЛЯ УЧЕНИКА -->
    <template v-else>
      <div v-if="!selectedStudentHomework" class="animate-fade-in">
        <div v-if="studentHomeworks.length === 0" class="empty-state">
          У вас пока нет назначенных заданий.
        </div>
        <div class="homework-grid">
          <div v-for="sw in studentHomeworks" :key="sw.student_homework_id" class="card hw-card" @click="openStudentHomework(sw.student_homework_id)">
            <div class="hw-header">
              <h3>{{ sw.title }}</h3>
              <span :class="['status-badge', sw.status]">{{ sw.status === 'completed' ? 'Сдано' : 'К выполнению' }}</span>
            </div>
            <p class="muted">Наставник: {{ sw.mentor_name }}</p>
            <p class="muted">Назначено: {{ formatDate(sw.assigned_at) }}</p>
          </div>
        </div>
      </div>

      <!-- Детали ДЗ для ученика -->
      <div v-if="selectedStudentHomework" class="card details-card animate-fade-in">
        <button class="button ghost small mb-4" @click="selectedStudentHomework = null">← Назад к списку</button>
        
        <h2>{{ selectedStudentHomework.title }}</h2>
        <p class="muted">Наставник: {{ selectedStudentHomework.mentor_name }}</p>
        
        <div class="content-block mt-4">
          <h3>Описание задачи</h3>
          <p class="pre-line task-desc">{{ selectedStudentHomework.description || 'Нет описания' }}</p>
        </div>

        <div class="content-block" v-if="selectedStudentHomework.attachments?.length">
          <h3>Материалы от учителя</h3>
          <div class="attachments-list">
            <a v-for="(url, i) in selectedStudentHomework.attachments" :key="i" :href="url" target="_blank" class="attachment-link">📎 {{ url.split('/').pop() }}</a>
          </div>
        </div>

        <hr class="divider" />

        <div v-if="selectedStudentHomework.status === 'pending'" class="submission-section">
          <h3>Ваш ответ</h3>
          <div class="form-group">
            <label>Комментарий / Решение (текст, ссылки)</label>
            <textarea v-model="submission.comment" class="input textarea" placeholder="Опишите ваше решение..."></textarea>
          </div>
          
          <div class="form-group">
            <label>Прикрепить файлы решения</label>
            <input type="file" @change="handleFileUpload($event, 'submit')" class="input-file" />
            <div v-if="uploading" class="muted">Загрузка...</div>
            <div class="attachments-list">
              <div v-for="(url, i) in submission.attachments" :key="i" class="attachment-item">
                <a :href="url" target="_blank">{{ url.split('/').pop() }}</a>
                <button @click="submission.attachments.splice(i, 1)" class="btn-icon">❌</button>
              </div>
            </div>
          </div>
          
          <button @click="submitHomework" class="button" :disabled="loading">
            {{ loading ? 'Отправка...' : 'Сдать работу' }}
          </button>
        </div>
        
        <div v-else class="success-block">
          <h3>✅ Работа сдана</h3>
          <p>Вы успешно отправили решение.</p>
          <div class="mt-4">
            <p><strong>Ваш комментарий:</strong></p>
            <p class="pre-line">{{ selectedStudentHomework.student_comment || 'Нет комментария' }}</p>
            <div v-if="selectedStudentHomework.student_attachments?.length" class="mt-2">
              <p><strong>Ваши файлы:</strong></p>
              <a v-for="(url, i) in selectedStudentHomework.student_attachments" :key="i" :href="url" target="_blank" class="attachment-link">📎 {{ url.split('/').pop() }}</a>
            </div>
          </div>
        </div>

      </div>
    </template>
  </div>
</template>

<script>
import { api } from '../api.js'
import { store } from '../store.js'
import { notify } from '../notify.js'

export default {
  name: 'HomeworkView',
  data() {
    return {
      currentTab: 'list',
      loading: false,
      uploading: false,
      
      // Mentor data
      mentorHomeworks: [],
      myStudents: [],
      selectedMentorHomework: null,
      selectedStudentToAssign: '',
      newHomework: {
        title: '',
        description: '',
        attachments: []
      },
      
      // Student data
      studentHomeworks: [],
      selectedStudentHomework: null,
      submission: {
        comment: '',
        attachments: []
      }
    }
  },
  computed: {
    profile() {
      return store.profile
    },
    isMentor() {
      return this.profile?.is_mentor === true
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
    await this.loadData()
  },
  methods: {
    getStudentDisplayName(s) {
      if (!s) return ''
      if (s.name && s.name.trim()) return s.name
      if (s.telegram_username) return `@${s.telegram_username}`
      if (s.email && !s.email.includes('@kogdaurok.local') && !s.email.startsWith('telegram_')) {
        return s.email
      }
      return `Ученик #${s.id}`
    },

    formatDate(dateStr) {
      if (!dateStr) return ''
      return new Date(dateStr).toLocaleString('ru-RU')
    },
    
    async loadData() {
      if (this.isMentor) {
        await this.loadMentorData()
      } else {
        await this.loadStudentData()
      }
    },
    
    async loadMentorData() {
      try {
        const [hwRes, stRes] = await Promise.all([
          api.getMentorHomeworkList(),
          api.getMyStudents()
        ])
        this.mentorHomeworks = hwRes.items || []
        this.myStudents = stRes.students || []
      } catch (e) {
        notify.error(e.message || 'Ошибка загрузки данных наставника')
      }
    },
    
    async loadStudentData() {
      try {
        const res = await api.getStudentHomeworkList()
        this.studentHomeworks = res.items || []
      } catch (e) {
        notify.error(e.message || 'Ошибка загрузки заданий')
      }
    },
    
    async handleFileUpload(event, target) {
      const file = event.target.files[0]
      if (!file) return
      
      this.uploading = true
      try {
        const res = await api.uploadFile(file)
        if (target === 'create') {
          this.newHomework.attachments.push(res.url)
        } else {
          this.submission.attachments.push(res.url)
        }
        notify.success('Файл успешно прикреплен')
      } catch (e) {
        notify.error('Ошибка загрузки файла: ' + e.message)
      } finally {
        this.uploading = false
        event.target.value = ''
      }
    },
    
    async createHomework() {
      this.loading = true
      try {
        await api.createHomework(
          this.newHomework.title,
          this.newHomework.description,
          this.newHomework.attachments
        )
        this.newHomework = { title: '', description: '', attachments: [] }
        this.currentTab = 'list'
        notify.success('Домашнее задание успешно создано!')
        await this.loadMentorData()
      } catch (e) {
        notify.error(e.message || 'Ошибка создания задания')
      } finally {
        this.loading = false
      }
    },
    
    async openMentorHomework(id) {
      try {
        const res = await api.getMentorHomeworkDetails(id)
        this.selectedMentorHomework = res
      } catch (e) {
        notify.error(e.message || 'Ошибка открытия задания')
      }
    },
    
    async assignHomework() {
      if (!this.selectedStudentToAssign) return
      try {
        await api.assignHomework(this.selectedMentorHomework.homework.homework_id, [this.selectedStudentToAssign])
        this.selectedStudentToAssign = ''
        notify.success('Задание успешно назначено ученику!')
        await this.openMentorHomework(this.selectedMentorHomework.homework.homework_id)
        await this.loadMentorData() // update stats
      } catch (e) {
        notify.error(e.message || 'Ошибка назначения задания')
      }
    },
    
    async openStudentHomework(id) {
      try {
        const res = await api.getStudentHomeworkDetails(id)
        this.selectedStudentHomework = res
        this.submission = { comment: '', attachments: [] }
      } catch (e) {
        notify.error(e.message || 'Ошибка открытия задания')
      }
    },
    
    async submitHomework() {
      this.loading = true
      try {
        await api.submitStudentHomework(
          this.selectedStudentHomework.student_homework_id,
          this.submission.comment,
          this.submission.attachments
        )
        notify.success('Работа успешно сдана наставнику!')
        await this.openStudentHomework(this.selectedStudentHomework.student_homework_id)
        await this.loadStudentData()
      } catch (e) {
        notify.error(e.message || 'Ошибка сдачи работы')
      } finally {
        this.loading = false
      }
    },
    
    async reviewHomework(studentHomeworkId, status) {
      try {
        await api.reviewHomework(studentHomeworkId, status)
        notify.info('Работа возвращена на доработку')
        await this.openMentorHomework(this.selectedMentorHomework.homework.homework_id)
        await this.loadMentorData()
      } catch (e) {
        notify.error(e.message || 'Ошибка обновления статуса')
      }
    }
  }
}
</script>

<style scoped>
.homework-page {
  animation: fadeIn 0.4s ease-out;
}

.header-section {
  margin-bottom: 30px;
}

.subtitle {
  color: var(--text-muted);
}

.tabs {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  background: var(--bg-tertiary);
  padding: 5px;
  border-radius: 12px;
  width: fit-content;
}

.tab {
  background: transparent;
  border: none;
  color: var(--text-secondary);
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
}

.tab.active {
  background: var(--bg-secondary);
  color: var(--text-primary);
  box-shadow: 0 2px 8px rgba(0,0,0,0.2);
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: var(--text-secondary);
}

.textarea {
  min-height: 120px;
  resize: vertical;
}

.input-file {
  background: var(--bg-tertiary);
  padding: 10px;
  border-radius: 8px;
  border: 1px dashed var(--border);
  width: 100%;
  cursor: pointer;
}

.attachments-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 10px;
}

.attachment-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--bg-tertiary);
  padding: 8px 12px;
  border-radius: 8px;
  border: 1px solid var(--border);
}

.attachment-link {
  display: inline-block;
  padding: 8px 12px;
  background: var(--bg-tertiary);
  border: 1px solid var(--border);
  border-radius: 8px;
  color: var(--accent);
  text-decoration: none;
  transition: all 0.2s;
}
.attachment-link:hover {
  border-color: var(--accent);
  background: var(--accent-transparent);
}

.btn-icon {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 14px;
}

.homework-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.hw-card {
  cursor: pointer;
}

.hw-card:hover {
  border-color: rgba(0, 255, 136, 0.3);
}

.hw-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 10px;
}

.stats-row {
  display: flex;
  gap: 10px;
  margin-top: 15px;
}

.stat-badge {
  background: var(--bg-tertiary);
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 12px;
  color: var(--text-secondary);
}
.stat-badge.success {
  color: var(--success);
  background: rgba(0, 255, 136, 0.1);
}

.status-badge {
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
}
.status-badge.pending {
  background: rgba(255, 204, 0, 0.1);
  color: var(--warning);
}
.status-badge.completed {
  background: rgba(0, 255, 136, 0.1);
  color: var(--success);
}

.details-card {
  max-width: 800px;
  margin: 0 auto;
}

.content-block {
  background: var(--bg-tertiary);
  padding: 20px;
  border-radius: 12px;
  margin: 15px 0;
}

.pre-line {
  white-space: pre-line;
}

.task-desc {
  font-size: 16px;
  line-height: 1.6;
}

.divider {
  border: 0;
  border-top: 1px solid var(--border);
  margin: 30px 0;
}

.assign-section {
  background: var(--bg-tertiary);
  padding: 20px;
  border-radius: 12px;
}

.assign-controls {
  display: flex;
  gap: 10px;
  margin-top: 15px;
}

.student-works {
  display: flex;
  flex-direction: column;
  gap: 15px;
  margin-top: 15px;
}

.student-work-card {
  background: var(--bg-tertiary);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 15px;
}

.work-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.student-name {
  font-weight: 600;
  font-size: 16px;
}

.work-content {
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px solid var(--border);
}

.success-block {
  background: rgba(0, 255, 136, 0.04);
  border: 1px solid rgba(0, 255, 136, 0.15);
  padding: 20px;
  border-radius: 12px;
  margin-top: 20px;
}

.mb-4 { margin-bottom: 16px; }
.mt-4 { margin-top: 16px; }
.mt-2 { margin-top: 8px; }

.empty-state {
  text-align: center;
  padding: 50px 20px;
  color: var(--text-muted);
  background: var(--bg-tertiary);
  border-radius: 12px;
  border: 1px dashed var(--border);
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
.animate-fade-in {
  animation: fadeIn 0.4s ease-out;
}
</style>
