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
      <div v-if="currentTab === 'create'" class="card form-card animate-fade-in">
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
          <label>Прикрепить файлы (фото, документы)</label>
          <input type="file" multiple accept="image/*,.pdf,.doc,.docx,.zip,.txt" @change="handleFileUpload($event, 'create')" class="input-file" />
          <div v-if="uploading" class="muted mt-2">Загрузка файла...</div>
          
          <!-- Галерея картинок и файлов при создании -->
          <div v-if="newHomework.attachments.length" class="attachments-grid mt-3">
            <div v-for="(url, i) in newHomework.attachments" :key="i" class="attachment-preview-card">
              <template v-if="isImage(url)">
                <div class="thumb-wrap" @click="openImagePreview(url)">
                  <img :src="getFileUrl(url)" :alt="getFileName(url)" class="thumb-img" @error="onImageError" />
                  <span class="zoom-badge">🔍</span>
                </div>
                <div class="thumb-info">
                  <span class="file-name" :title="getFileName(url)">{{ getFileName(url) }}</span>
                  <button @click.stop="newHomework.attachments.splice(i, 1)" class="btn-icon delete-btn" title="Удалить">🗑️</button>
                </div>
              </template>
              <template v-else>
                <div class="file-icon-wrap">📄</div>
                <div class="thumb-info">
                  <a :href="getFileUrl(url)" target="_blank" class="file-link" :title="getFileName(url)">{{ getFileName(url) }}</a>
                  <button @click.stop="newHomework.attachments.splice(i, 1)" class="btn-icon delete-btn" title="Удалить">🗑️</button>
                </div>
              </template>
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
            <div class="hw-card-header">
              <h3 class="hw-title">{{ hw.title }}</h3>
              <button 
                class="delete-btn-card" 
                title="Удалить ДЗ" 
                @click.stop="confirmDeleteHomework(hw.homework_id, hw.title)"
              >
                🗑️
              </button>
            </div>
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
        <div class="details-top-bar mb-4">
          <button class="button ghost small" @click="selectedMentorHomework = null">← Назад к списку</button>
          <button class="button ghost danger small" @click="confirmDeleteHomework(selectedMentorHomework.homework.homework_id, selectedMentorHomework.homework.title)">
            🗑️ Удалить ДЗ
          </button>
        </div>
        
        <h2 class="task-title">{{ selectedMentorHomework.homework.title }}</h2>
        <div class="content-block">
          <h3>Описание</h3>
          <p class="pre-line text-wrap-break">{{ selectedMentorHomework.homework.description || 'Нет описания' }}</p>
        </div>
        
        <div class="content-block" v-if="selectedMentorHomework.homework.attachments?.length">
          <h3>Материалы к заданию</h3>
          
          <!-- Галерея изображений -->
          <div v-if="filterImages(selectedMentorHomework.homework.attachments).length" class="gallery-grid mt-3">
            <div 
              v-for="(url, i) in filterImages(selectedMentorHomework.homework.attachments)" 
              :key="'hw-img-' + i" 
              class="gallery-item"
              @click="openImagePreview(url)"
            >
              <img :src="getFileUrl(url)" :alt="getFileName(url)" class="gallery-img" @error="onImageError" />
              <div class="gallery-overlay">
                <span class="overlay-text">🔍 Увеличить</span>
              </div>
            </div>
          </div>

          <!-- Другие файлы -->
          <div v-if="filterFiles(selectedMentorHomework.homework.attachments).length" class="files-list mt-3">
            <a 
              v-for="(url, i) in filterFiles(selectedMentorHomework.homework.attachments)" 
              :key="'hw-file-' + i" 
              :href="getFileUrl(url)" 
              target="_blank" 
              class="attachment-link"
            >
              📎 {{ getFileName(url) }}
            </a>
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
              <div class="student-info">
                <span class="student-name">{{ sw.student_name }}</span>
                <span :class="['status-badge', sw.status]">{{ sw.status === 'completed' ? 'Сдано' : 'В процессе' }}</span>
              </div>
              <button 
                class="button ghost danger small" 
                title="Отменить назначение" 
                @click="confirmUnassignStudent(selectedMentorHomework.homework.homework_id, sw.student_id, sw.student_name)"
              >
                ❌ Отменить назначение
              </button>
            </div>
            <div v-if="sw.status === 'completed'" class="work-content">
              <p><strong>Комментарий ученика:</strong></p>
              <p class="pre-line text-wrap-break mt-1">{{ sw.student_comment || 'Нет комментария' }}</p>
              
              <div v-if="sw.student_attachments?.length" class="mt-3">
                <p><strong>Вложения ученика:</strong></p>
                
                <!-- Изображения от ученика -->
                <div v-if="filterImages(sw.student_attachments).length" class="gallery-grid mt-2">
                  <div 
                    v-for="(url, i) in filterImages(sw.student_attachments)" 
                    :key="'sw-img-' + i" 
                    class="gallery-item"
                    @click="openImagePreview(url)"
                  >
                    <img :src="getFileUrl(url)" :alt="getFileName(url)" class="gallery-img" @error="onImageError" />
                    <div class="gallery-overlay">
                      <span class="overlay-text">🔍 Увеличить</span>
                    </div>
                  </div>
                </div>

                <!-- Не-изображения от ученика -->
                <div v-if="filterFiles(sw.student_attachments).length" class="files-list mt-2">
                  <a 
                    v-for="(url, i) in filterFiles(sw.student_attachments)" 
                    :key="'sw-file-' + i" 
                    :href="getFileUrl(url)" 
                    target="_blank" 
                    class="attachment-link"
                  >
                    📎 {{ getFileName(url) }}
                  </a>
                </div>
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
              <h3 class="hw-title">{{ sw.title }}</h3>
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
        
        <h2 class="task-title">{{ selectedStudentHomework.title }}</h2>
        <p class="muted">Наставник: {{ selectedStudentHomework.mentor_name }}</p>
        
        <div class="content-block mt-4">
          <h3>Описание задачи</h3>
          <p class="pre-line task-desc text-wrap-break">{{ selectedStudentHomework.description || 'Нет описания' }}</p>
        </div>

        <div class="content-block" v-if="selectedStudentHomework.attachments?.length">
          <h3>Материалы от учителя</h3>
          
          <!-- Картинки от учителя -->
          <div v-if="filterImages(selectedStudentHomework.attachments).length" class="gallery-grid mt-3">
            <div 
              v-for="(url, i) in filterImages(selectedStudentHomework.attachments)" 
              :key="'shw-img-' + i" 
              class="gallery-item"
              @click="openImagePreview(url)"
            >
              <img :src="getFileUrl(url)" :alt="getFileName(url)" class="gallery-img" @error="onImageError" />
              <div class="gallery-overlay">
                <span class="overlay-text">🔍 Увеличить</span>
              </div>
            </div>
          </div>

          <!-- Другие файлы -->
          <div v-if="filterFiles(selectedStudentHomework.attachments).length" class="files-list mt-3">
            <a 
              v-for="(url, i) in filterFiles(selectedStudentHomework.attachments)" 
              :key="'shw-file-' + i" 
              :href="getFileUrl(url)" 
              target="_blank" 
              class="attachment-link"
            >
              📎 {{ getFileName(url) }}
            </a>
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
            <label>Прикрепить фото / файлы решения</label>
            <input type="file" multiple accept="image/*,.pdf,.doc,.docx,.zip,.txt" @change="handleFileUpload($event, 'submit')" class="input-file" />
            <div v-if="uploading" class="muted mt-2">Загрузка файла...</div>

            <!-- Предпросмотр прикрепленных фото/файлов ответа -->
            <div v-if="submission.attachments.length" class="attachments-grid mt-3">
              <div v-for="(url, i) in submission.attachments" :key="i" class="attachment-preview-card">
                <template v-if="isImage(url)">
                  <div class="thumb-wrap" @click="openImagePreview(url)">
                    <img :src="getFileUrl(url)" :alt="getFileName(url)" class="thumb-img" @error="onImageError" />
                    <span class="zoom-badge">🔍</span>
                  </div>
                  <div class="thumb-info">
                    <span class="file-name" :title="getFileName(url)">{{ getFileName(url) }}</span>
                    <button @click.stop="submission.attachments.splice(i, 1)" class="btn-icon delete-btn" title="Удалить">🗑️</button>
                  </div>
                </template>
                <template v-else>
                  <div class="file-icon-wrap">📄</div>
                  <div class="thumb-info">
                    <a :href="getFileUrl(url)" target="_blank" class="file-link" :title="getFileName(url)">{{ getFileName(url) }}</a>
                    <button @click.stop="submission.attachments.splice(i, 1)" class="btn-icon delete-btn" title="Удалить">🗑️</button>
                  </div>
                </template>
              </div>
            </div>
          </div>
          
          <button @click="submitHomework" class="button" :disabled="loading">
            {{ loading ? 'Отправка...' : 'Сдать работу' }}
          </button>
        </div>
        
        <div v-else class="success-block">
          <h3>✅ Работа сдана</h3>
          <p class="muted">Вы успешно отправили решение на проверку.</p>
          <div class="mt-4">
            <p><strong>Ваш комментарий:</strong></p>
            <p class="pre-line text-wrap-break mt-1">{{ selectedStudentHomework.student_comment || 'Нет комментария' }}</p>
            
            <div v-if="selectedStudentHomework.student_attachments?.length" class="mt-3">
              <p><strong>Ваши прикрепленные файлы:</strong></p>
              
              <!-- Фотографии сдачи -->
              <div v-if="filterImages(selectedStudentHomework.student_attachments).length" class="gallery-grid mt-2">
                <div 
                  v-for="(url, i) in filterImages(selectedStudentHomework.student_attachments)" 
                  :key="'done-img-' + i" 
                  class="gallery-item"
                  @click="openImagePreview(url)"
                >
                  <img :src="getFileUrl(url)" :alt="getFileName(url)" class="gallery-img" @error="onImageError" />
                  <div class="gallery-overlay">
                    <span class="overlay-text">🔍 Увеличить</span>
                  </div>
                </div>
              </div>

              <!-- Другие файлы -->
              <div v-if="filterFiles(selectedStudentHomework.student_attachments).length" class="files-list mt-2">
                <a 
                  v-for="(url, i) in filterFiles(selectedStudentHomework.student_attachments)" 
                  :key="'done-file-' + i" 
                  :href="getFileUrl(url)" 
                  target="_blank" 
                  class="attachment-link"
                >
                  📎 {{ getFileName(url) }}
                </a>
              </div>
            </div>
          </div>
        </div>

      </div>
    </template>

    <!-- МОДАЛЬНОЕ ОКНО ПРОСМОТРА ИЗОБРАЖЕНИЯ (LIGHTBOX) -->
    <div v-if="previewImageUrl" class="modal-backdrop" @click="closeImagePreview">
      <div class="image-modal-content" @click.stop>
        <button class="image-modal-close" @click="closeImagePreview" title="Закрыть">✕</button>
        <img :src="previewImageUrl" alt="Просмотр изображения" class="lightbox-img" />
        <div class="image-modal-footer">
          <a :href="previewImageUrl" target="_blank" class="button small ghost" download>Скачать оригинал</a>
        </div>
      </div>
    </div>

  </div>
</template>

<script>
import { api, getFileUrl } from '../api.js'
import { store } from '../store.js'
import { notify } from '../notify.js'

export default {
  name: 'HomeworkView',
  data() {
    return {
      currentTab: 'list',
      loading: false,
      uploading: false,
      previewImageUrl: null,
      
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
    getFileUrl(url) {
      return getFileUrl(url)
    },

    onImageError(e) {
      e.target.style.display = 'none'
      if (e.target.parentElement) {
        e.target.parentElement.classList.add('img-load-error')
      }
    },

    isImage(url) {
      if (!url || typeof url !== 'string') return false
      const cleanUrl = url.split('?')[0].toLowerCase()
      return cleanUrl.endsWith('.jpg') || 
             cleanUrl.endsWith('.jpeg') || 
             cleanUrl.endsWith('.png') || 
             cleanUrl.endsWith('.webp') || 
             cleanUrl.endsWith('.gif') || 
             cleanUrl.endsWith('.bmp') ||
             cleanUrl.endsWith('.svg')
    },

    getFileName(url) {
      if (!url) return ''
      try {
        const cleanUrl = url.split('?')[0]
        return decodeURIComponent(cleanUrl.split('/').pop() || 'файл')
      } catch {
        return url.split('/').pop() || 'файл'
      }
    },

    filterImages(attachments) {
      if (!Array.isArray(attachments)) return []
      return attachments.filter(url => this.isImage(url))
    },

    filterFiles(attachments) {
      if (!Array.isArray(attachments)) return []
      return attachments.filter(url => !this.isImage(url))
    },

    openImagePreview(url) {
      this.previewImageUrl = getFileUrl(url)
    },

    closeImagePreview() {
      this.previewImageUrl = null
    },

    getStudentDisplayName(s) {
      if (!s) return ''
      const name = s.name && s.name.trim() ? s.name : (s.telegram_username ? `@${s.telegram_username}` : `Ученик #${s.id}`)
      const tgStatus = s.has_telegram || s.telegram_username ? '💬 TG' : '⚠️ нет TG'
      return `${name} (${tgStatus})`
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
        notify.error('Ошибка загрузки данных наставника: ' + e.message)
      }
    },
    
    async loadStudentData() {
      try {
        const res = await api.getStudentHomeworkList()
        this.studentHomeworks = res.items || []
      } catch (e) {
        notify.error('Ошибка загрузки заданий: ' + e.message)
      }
    },
    
    async handleFileUpload(event, target) {
      const files = Array.from(event.target.files || [])
      if (!files.length) return
      
      this.uploading = true
      let successCount = 0
      try {
        for (const file of files) {
          try {
            const res = await api.uploadFile(file)
            if (target === 'create') {
              this.newHomework.attachments.push(res.url)
            } else {
              this.submission.attachments.push(res.url)
            }
            successCount++
          } catch (err) {
            notify.error(`Ошибка загрузки ${file.name}: ${err.message}`)
          }
        }
        if (successCount > 0) {
          notify.success(`Загружено файлов: ${successCount}`)
        }
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
        const res = await api.assignHomework(this.selectedMentorHomework.homework.homework_id, [this.selectedStudentToAssign])
        this.selectedStudentToAssign = ''
        if (res.notified_count > 0) {
          notify.success(`Задание назначено! Ученик получил уведомление в Telegram 📲`)
        } else if (res.no_tg_count > 0) {
          notify.info(`Задание назначено. Ученик пока не привязал Telegram, уведомление не отправлено.`)
        } else {
          notify.success('Задание успешно назначено ученику!')
        }
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
        const res = await api.submitStudentHomework(
          this.selectedStudentHomework.student_homework_id,
          this.submission.comment,
          this.submission.attachments
        )
        if (res.mentor_notified) {
          notify.success('Работа сдана! Преподаватель получил уведомление в Telegram 📲')
        } else {
          notify.success('Работа успешно сдана наставнику!')
        }
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
    },

    async confirmDeleteHomework(homeworkId, title) {
      const confirmed = await notify.confirm(
        `Вы действительно хотите удалить домашнее задание "${title || 'Без названия'}"? Это действие нельзя отменить.`,
        'Удаление ДЗ',
        'Удалить',
        'Отмена'
      )
      if (!confirmed) return

      try {
        await api.deleteHomework(homeworkId)
        notify.success('Домашнее задание успешно удалено')
        if (this.selectedMentorHomework && this.selectedMentorHomework.homework.homework_id === homeworkId) {
          this.selectedMentorHomework = null
        }
        await this.loadMentorData()
      } catch (e) {
        notify.error(e.message || 'Ошибка удаления задания')
      }
    },

    async confirmUnassignStudent(homeworkId, studentId, studentName) {
      const confirmed = await notify.confirm(
        `Отменить назначение домашнего задания для ученика "${studentName || 'Ученик'}"?`,
        'Отмена назначения',
        'Отменить назначение',
        'Отмена'
      )
      if (!confirmed) return

      try {
        await api.unassignHomework(homeworkId, studentId)
        notify.success(`Назначение для ученика "${studentName}" отменено`)
        if (this.selectedMentorHomework && this.selectedMentorHomework.homework.homework_id === homeworkId) {
          await this.openMentorHomework(homeworkId)
        }
        await this.loadMentorData()
      } catch (e) {
        notify.error(e.message || 'Ошибка отмены назначения')
      }
    }
  }
}
</script>

<style scoped>
.homework-page {
  animation: fadeIn 0.4s ease-out;
  max-width: 1000px;
  margin: 0 auto;
  width: 100%;
  box-sizing: border-box;
}

.header-section {
  margin-bottom: 24px;
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
  line-height: 1.5;
  width: 100%;
  box-sizing: border-box;
  word-break: break-word;
  overflow-wrap: anywhere;
}

.input-file {
  background: var(--bg-tertiary);
  padding: 10px;
  border-radius: 8px;
  border: 1px dashed var(--border);
  width: 100%;
  box-sizing: border-box;
  cursor: pointer;
}

/* Сетка карточек ДЗ */
.homework-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}

.hw-card {
  cursor: pointer;
  overflow: hidden;
  word-break: break-word;
}

.hw-card:hover {
  border-color: rgba(0, 255, 136, 0.35);
  transform: translateY(-2px);
  transition: all 0.2s ease;
}

.hw-card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 10px;
  margin-bottom: 6px;
}

.delete-btn-card {
  background: transparent;
  border: none;
  font-size: 15px;
  cursor: pointer;
  opacity: 0.6;
  transition: opacity 0.2s, transform 0.2s, background-color 0.2s;
  padding: 2px 6px;
  border-radius: 6px;
  flex-shrink: 0;
}

.delete-btn-card:hover {
  opacity: 1;
  background: rgba(224, 85, 85, 0.15);
  transform: scale(1.1);
}

.details-top-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.student-info {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.hw-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 10px;
  margin-bottom: 10px;
}

.hw-title {
  word-break: break-word;
  overflow-wrap: anywhere;
  font-size: 17px;
  font-weight: 700;
}

.stats-row {
  display: flex;
  flex-wrap: wrap;
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
  white-space: nowrap;
  flex-shrink: 0;
}
.status-badge.pending {
  background: rgba(255, 204, 0, 0.1);
  color: var(--warning);
}
.status-badge.completed {
  background: rgba(0, 255, 136, 0.1);
  color: var(--success);
}

/* Детальная карточка */
.details-card {
  max-width: 900px;
  width: 100%;
  margin: 0 auto;
  box-sizing: border-box;
  overflow: hidden;
  word-break: break-word;
}

.form-card {
  max-width: 900px;
  width: 100%;
  margin: 0 auto;
  box-sizing: border-box;
}

.task-title {
  word-break: break-word;
  overflow-wrap: anywhere;
  margin-bottom: 8px;
  font-size: 24px;
}

.content-block {
  background: var(--bg-tertiary);
  padding: 20px;
  border-radius: 12px;
  margin: 15px 0;
  width: 100%;
  box-sizing: border-box;
  overflow: hidden;
}

.content-block h3 {
  margin-bottom: 10px;
  color: var(--text-primary);
  font-size: 16px;
}

.text-wrap-break {
  word-break: break-word;
  overflow-wrap: anywhere;
  white-space: pre-wrap;
  line-height: 1.6;
}

.pre-line {
  white-space: pre-line;
}

.task-desc {
  font-size: 15px;
  color: var(--text-primary);
}

.divider {
  border: 0;
  border-top: 1px solid var(--border);
  margin: 25px 0;
}

.assign-section {
  background: var(--bg-tertiary);
  padding: 20px;
  border-radius: 12px;
  box-sizing: border-box;
}

.assign-controls {
  display: flex;
  gap: 12px;
  margin-top: 15px;
  flex-wrap: wrap;
}

.assign-controls .input {
  flex: 1;
  min-width: 200px;
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
  padding: 18px;
  box-sizing: border-box;
  overflow: hidden;
}

.work-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.student-name {
  font-weight: 600;
  font-size: 16px;
  word-break: break-word;
}

.work-content {
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px solid var(--border);
  word-break: break-word;
}

.success-block {
  background: rgba(0, 255, 136, 0.04);
  border: 1px solid rgba(0, 255, 136, 0.2);
  padding: 20px;
  border-radius: 12px;
  margin-top: 20px;
  box-sizing: border-box;
  word-break: break-word;
}

/* ===================================================
   ГАЛЕРЕЯ И ПРЕДПРОСМОТР КАРТИНОК
   =================================================== */
.gallery-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 12px;
}

.gallery-item {
  position: relative;
  aspect-ratio: 1;
  border-radius: 10px;
  overflow: hidden;
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  cursor: pointer;
  transition: all 0.2s ease;
}

.gallery-item:hover {
  border-color: var(--accent);
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
}

.gallery-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.gallery-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.gallery-item:hover .gallery-overlay {
  opacity: 1;
}

.overlay-text {
  font-size: 12px;
  font-weight: 600;
  color: #fff;
  background: rgba(0, 0, 0, 0.6);
  padding: 4px 8px;
  border-radius: 6px;
  pointer-events: none;
}

/* Карточки файлов/картинок в форме */
.attachments-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
  gap: 12px;
}

.attachment-preview-card {
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: 8px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.thumb-wrap {
  position: relative;
  height: 100px;
  background: var(--bg-tertiary);
  cursor: pointer;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.thumb-wrap.img-load-error::after,
.gallery-item.img-load-error::after {
  content: '🖼️ Ошибка фото';
  font-size: 11px;
  color: var(--text-muted);
  text-align: center;
  padding: 4px;
}

.thumb-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.2s ease;
}

.thumb-wrap:hover .thumb-img {
  transform: scale(1.05);
}

.zoom-badge {
  position: absolute;
  bottom: 6px;
  right: 6px;
  font-size: 11px;
  background: rgba(0, 0, 0, 0.7);
  padding: 2px 4px;
  border-radius: 4px;
}

.file-icon-wrap {
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
  background: rgba(255, 255, 255, 0.02);
}

.thumb-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 8px;
  gap: 6px;
  background: var(--bg-tertiary);
  border-top: 1px solid var(--border);
}

.file-name {
  font-size: 11px;
  color: var(--text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
}

.file-link {
  font-size: 11px;
  color: var(--accent);
  text-decoration: none;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
}
.file-link:hover {
  text-decoration: underline;
}

.delete-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 13px;
  opacity: 0.75;
  transition: opacity 0.15s;
}
.delete-btn:hover {
  opacity: 1;
}

/* Список не-графических вложений */
.files-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.attachment-link {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: 8px;
  color: var(--accent);
  text-decoration: none;
  font-size: 14px;
  transition: all 0.2s;
  max-width: 100%;
  word-break: break-all;
}

.attachment-link:hover {
  border-color: var(--accent);
  background: var(--accent-transparent);
}

/* Модальное окно просмотра фото (Lightbox) */
.image-modal-content {
  position: relative;
  max-width: 90vw;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  animation: modalAppear 0.2s ease;
}

.lightbox-img {
  max-width: 88vw;
  max-height: 80vh;
  object-fit: contain;
  border-radius: 10px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.image-modal-close {
  position: absolute;
  top: -40px;
  right: -10px;
  background: rgba(0, 0, 0, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: #fff;
  font-size: 20px;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.image-modal-close:hover {
  background: var(--accent);
  color: #000;
}

.image-modal-footer {
  margin-top: 12px;
}

.mb-4 { margin-bottom: 16px; }
.mt-1 { margin-top: 4px; }
.mt-2 { margin-top: 8px; }
.mt-3 { margin-top: 12px; }
.mt-4 { margin-top: 16px; }

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

@media (max-width: 768px) {
  .gallery-grid {
    grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
    gap: 8px;
  }
  .content-block {
    padding: 14px;
  }
  .assign-controls {
    flex-direction: column;
  }
  .assign-controls .button {
    width: 100%;
    justify-content: center;
  }
}
</style>
