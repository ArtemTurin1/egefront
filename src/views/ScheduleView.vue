<template>
  <div class="page schedule-page">
    <!-- ЗАГОЛОВОК СТРАНИЦЫ -->
    <div class="header-section">
      <div class="header-content">
        <div class="header-titles">
          <h1>Расписание уроков 📅</h1>
          <div class="subtitle-wrap">
            <span class="subtitle-text">
              {{ isMentor ? 'Управление занятиями учеников и онлайн-встречами (время по МСК)' : 'Ваши запланированные занятия с преподавателями (время по МСК)' }}
            </span>
            <span v-if="hasTelegram" class="tg-inline-badge">
              <span class="tg-dot"></span>
              🔔 Telegram-уведомления активны
            </span>
          </div>
        </div>
        <button v-if="isMentor" class="button add-lesson-btn" @click="openCreateModal()">
          <span>➕</span> Запланировать урок
        </button>
      </div>
    </div>

    <!-- ПАНЕЛЬ УПРАВЛЕНИЯ КАЛЕНДАРЕМ (GOOGLE CALENDAR STYLE TOOLBAR) -->
    <div class="cal-toolbar card">
      <div class="cal-toolbar-left">
        <button class="button small ghost cal-today-btn" @click="goToToday">
          Сегодня
        </button>
        <div class="cal-nav-group">
          <button class="cal-nav-btn" @click="navPrev" title="Назад">
            ◀
          </button>
          <button class="cal-nav-btn" @click="navNext" title="Вперёд">
            ▶
          </button>
        </div>
        <h2 class="cal-period-title">{{ periodTitle }}</h2>
      </div>

      <div class="cal-toolbar-right">
        <div class="view-mode-tabs">
          <button 
            class="view-mode-tab" 
            :class="{ active: calView === 'month' }" 
            @click="calView = 'month'"
          >
            📅 Месяц
          </button>
          <button 
            class="view-mode-tab" 
            :class="{ active: calView === 'week' }" 
            @click="calView = 'week'"
          >
            🗓️ Неделя
          </button>
          <button 
            class="view-mode-tab" 
            :class="{ active: calView === 'list' }" 
            @click="calView = 'list'"
          >
            📋 Список ({{ lessons.length }})
          </button>
        </div>
      </div>
    </div>

    <!-- ЗАГРУЗКА -->
    <div v-if="loading" class="text-center py-10">
      <div class="spinner">⏳</div>
      <p class="muted mt-2">Загружаем расписание уроков...</p>
    </div>

    <!-- РЕЖИМ 1: СЕТКА МЕСЯЦА (GOOGLE CALENDAR MONTH VIEW) -->
    <div v-else-if="calView === 'month'" class="month-view-container card">
      <!-- ДНИ НЕДЕЛИ ШАПКА -->
      <div class="month-weekdays-row">
        <div v-for="wDay in weekDayNames" :key="wDay" class="weekday-header-cell">
          {{ wDay }}
        </div>
      </div>

      <!-- СЕТКА ЯЧЕЕК МЕСЯЦА -->
      <div class="month-grid">
        <div 
          v-for="cell in monthCalendarCells" 
          :key="cell.dateKey" 
          class="month-day-cell"
          :class="{
            'other-month': !cell.isCurrentMonth,
            'is-today': cell.isToday,
            'has-lessons': cell.lessons.length > 0
          }"
          @click="onDayClick(cell)"
        >
          <div class="day-cell-top">
            <span class="day-number-badge" :class="{ 'today-circle': cell.isToday }">
              {{ cell.dayNumber }}
            </span>
            <button 
              v-if="isMentor" 
              class="day-quick-add" 
              @click.stop="openCreateModal(cell.dateKey)" 
              title="Запланировать урок на этот день"
            >
              +
            </button>
          </div>

          <div class="day-events-container">
            <div 
              v-for="lesson in cell.lessons.slice(0, 3)" 
              :key="lesson.id" 
              class="cal-event-chip"
              :class="[getSubjectClass(lesson.subject), { 'is-past': isPast(lesson.start_time) }]"
              @click.stop="openLessonDetails(lesson)"
              :title="lesson.title + ' (' + formatTime(lesson.start_time) + ')'"
            >
              <span class="chip-time">{{ formatTime(lesson.start_time) }}</span>
              <span class="chip-subject-dot"></span>
              <span class="chip-text">{{ lesson.title }}</span>
            </div>

            <div 
              v-if="cell.lessons.length > 3" 
              class="cal-more-chip"
              @click.stop="openDayLessonsModal(cell)"
            >
              + ещё {{ cell.lessons.length - 3 }}...
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- РЕЖИМ 2: СЕТКА НЕДЕЛИ (WEEK VIEW) -->
    <div v-else-if="calView === 'week'" class="week-view-container card">
      <div class="week-columns-grid">
        <div 
          v-for="day in weekDays" 
          :key="day.dateKey" 
          class="week-day-col"
          :class="{ 'is-today': day.isToday }"
        >
          <div class="week-col-header">
            <span class="week-col-name">{{ day.dayName }}</span>
            <span class="week-col-date" :class="{ 'today-circle': day.isToday }">
              {{ day.dayNumber }} {{ day.monthName }}
            </span>
            <button 
              v-if="isMentor" 
              class="col-quick-add" 
              @click.stop="openCreateModal(day.dateKey)" 
              title="Добавить урок на этот день"
            >
              +
            </button>
          </div>

          <div class="week-col-content">
            <div v-if="day.lessons.length === 0" class="week-col-empty">
              <span class="muted text-small">Нет уроков</span>
            </div>
            <div 
              v-for="lesson in day.lessons" 
              :key="lesson.id" 
              class="week-card"
              :class="[getSubjectClass(lesson.subject), { 'is-past': isPast(lesson.start_time) }]"
              @click="openLessonDetails(lesson)"
            >
              <div class="week-card-top">
                <span class="week-time-pill">⏰ {{ formatTime(lesson.start_time) }}</span>
                <span class="week-dur">{{ lesson.duration_minutes }}м</span>
              </div>
              <div class="week-card-title">{{ lesson.title }}</div>
              <div class="week-card-person">
                {{ isMentor ? '👨‍🎓 ' + lesson.student_name : '👨‍🏫 ' + lesson.mentor_name }}
              </div>
              <div v-if="lesson.lesson_link" class="week-card-actions" @click.stop>
                <a :href="formatUrl(lesson.lesson_link)" target="_blank" class="week-join-btn">
                  🚀 Войти
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- РЕЖИМ 3: СПИСОК (LIST VIEW) -->
    <div v-else-if="calView === 'list'" class="list-view-container">
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

      <!-- ПУСТОЙ СПИСОК -->
      <div v-if="filteredLessons.length === 0" class="card empty-card">
        <div class="empty-icon">🗓️</div>
        <h3>{{ filterTab === 'upcoming' ? 'Нет предстоящих уроков' : 'Уроки не найдены' }}</h3>
        <p class="muted">
          {{ isMentor 
              ? 'Нажмите кнопку «Запланировать урок», чтобы назначить онлайн-занятие ученику.' 
              : 'Ваш наставник пока не назначил вам занятий на этот период.' }}
        </p>
        <button v-if="isMentor && filterTab === 'upcoming'" class="button mt-4" @click="openCreateModal()">
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
    </div>

    <!-- МОДАЛЬНОЕ ОКНО ДЕТАЛЕЙ УРОКА ПРИ КЛИКЕ В КАЛЕНДАРЕ -->
    <div v-if="selectedLessonDetail" class="modal-backdrop" @click.self="selectedLessonDetail = null">
      <div class="card modal lesson-detail-modal">
        <div class="modal-header">
          <div class="detail-badges">
            <span class="subject-badge" :class="getSubjectClass(selectedLessonDetail.subject)">
              {{ selectedLessonDetail.subject }}
            </span>
            <span class="duration-badge">⏱️ {{ selectedLessonDetail.duration_minutes }} минут</span>
          </div>
          <button class="close-btn" @click="selectedLessonDetail = null">×</button>
        </div>

        <div class="modal-body">
          <h2 class="detail-modal-title">{{ selectedLessonDetail.title }}</h2>

          <div class="lesson-detail-box">
            <div class="detail-row">
              <span class="detail-icon">⏰</span>
              <div>
                <div class="detail-label">Дата и время начала (МСК)</div>
                <strong>{{ formatDate(selectedLessonDetail.start_time) }}</strong>
                <div class="time-relative" :class="{ soon: isSoon(selectedLessonDetail.start_time) }">
                  {{ formatRelativeTime(selectedLessonDetail.start_time) }}
                </div>
              </div>
            </div>

            <div class="detail-row">
              <span class="detail-icon">{{ isMentor ? '👨‍🎓' : '👨‍🏫' }}</span>
              <div>
                <div class="detail-label">{{ isMentor ? 'Ученик' : 'Преподаватель' }}</div>
                <strong>{{ isMentor ? selectedLessonDetail.student_name : selectedLessonDetail.mentor_name }}</strong>
              </div>
            </div>

            <div v-if="selectedLessonDetail.notes" class="detail-row notes-row">
              <span class="detail-icon">📝</span>
              <div>
                <div class="detail-label">Заметки к уроку</div>
                <div class="notes-text">{{ selectedLessonDetail.notes }}</div>
              </div>
            </div>
          </div>

          <div class="modal-actions-row">
            <a 
              v-if="selectedLessonDetail.lesson_link" 
              :href="formatUrl(selectedLessonDetail.lesson_link)" 
              target="_blank" 
              class="button full-width link-btn"
            >
              🚀 Войти на урок
            </a>
            <div v-else class="no-link-box">
              Ссылка на звонок не указана
            </div>

            <button 
              v-if="isMentor" 
              class="button ghost delete-action-btn" 
              @click="deleteFromDetailModal(selectedLessonDetail.id)"
            >
              🗑️ Отменить этот урок
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- МОДАЛЬНОЕ ОКНО ВСЕХ УРОКОВ ДНЯ (ЕСЛИ В ДНЕ МНОГО УРОКОВ) -->
    <div v-if="selectedDayModal" class="modal-backdrop" @click.self="selectedDayModal = null">
      <div class="card modal day-lessons-modal">
        <div class="modal-header">
          <h3>Уроки на {{ formatDayTitle(selectedDayModal.dateKey) }} 📅</h3>
          <button class="close-btn" @click="selectedDayModal = null">×</button>
        </div>
        <div class="modal-body">
          <div class="day-modal-list">
            <div 
              v-for="l in selectedDayModal.lessons" 
              :key="l.id" 
              class="day-modal-item"
              :class="getSubjectClass(l.subject)"
              @click="openLessonDetails(l); selectedDayModal = null"
            >
              <div class="d-item-time">⏰ {{ formatTime(l.start_time) }}</div>
              <div class="d-item-info">
                <strong>{{ l.title }}</strong>
                <span class="muted text-small">
                  {{ isMentor ? 'Ученик: ' + l.student_name : 'Наставник: ' + l.mentor_name }}
                </span>
              </div>
              <span class="arrow-icon">→</span>
            </div>
          </div>
          <div v-if="isMentor" class="modal-footer mt-4">
            <button class="button small" @click="openCreateModal(selectedDayModal.dateKey); selectedDayModal = null">
              ➕ Запланировать урок на этот день
            </button>
          </div>
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
      
      // 'month' | 'week' | 'list'
      calView: 'month',
      currentDate: new Date(),
      weekDayNames: ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'],

      // Для режима списка
      filterTab: 'upcoming', // 'upcoming' | 'past' | 'all'

      // Модальные окна
      showCreateModal: false,
      selectedLessonDetail: null,
      selectedDayModal: null,

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

    // Группировка уроков по дате (в формате YYYY-MM-DD по МСК)
    lessonsByDate() {
      const map = {}
      for (const l of this.lessons) {
        if (!l.start_time) continue
        const key = this.getMskDateKey(new Date(l.start_time))
        if (!map[key]) {
          map[key] = []
        }
        map[key].push(l)
      }
      for (const key in map) {
        map[key].sort((a, b) => new Date(a.start_time) - new Date(b.start_time))
      }
      return map
    },

    // Заголовок периода (Google Calendar toolbar title)
    periodTitle() {
      if (this.calView === 'month') {
        const { year, month } = this.getMskDateParts(this.currentDate)
        const d = new Date(Date.UTC(year, month, 15, 12, 0, 0))
        const str = d.toLocaleDateString('ru-RU', {
          timeZone: 'Europe/Moscow',
          month: 'long',
          year: 'numeric'
        })
        return str.charAt(0).toUpperCase() + str.slice(1)
      } else if (this.calView === 'week') {
        const { year, month, day } = this.getMskDateParts(this.currentDate)
        const currentUtc = new Date(Date.UTC(year, month, day, 12, 0, 0))
        const dayOfWeek = (currentUtc.getUTCDay() + 6) % 7
        const mon = new Date(Date.UTC(year, month, day - dayOfWeek, 12, 0, 0))
        const sun = new Date(Date.UTC(year, month, day - dayOfWeek + 6, 12, 0, 0))

        const monStr = mon.toLocaleDateString('ru-RU', { timeZone: 'Europe/Moscow', day: 'numeric', month: 'short' })
        const sunStr = sun.toLocaleDateString('ru-RU', { timeZone: 'Europe/Moscow', day: 'numeric', month: 'short', year: 'numeric' })
        return `${monStr} – ${sunStr}`
      }
      return 'Все запланированные занятия'
    },

    // Генерация ячеек для сетки месяца (35 или 42 ячейки) СТРОГО ПО МОСКВЕ
    monthCalendarCells() {
      const { year, month } = this.getMskDateParts(this.currentDate)

      // Первый день отображаемого месяца в полдень UTC
      const firstDayUtc = new Date(Date.UTC(year, month, 1, 12, 0, 0))
      // День недели для 1 числа: Пн=0, Вт=1 ... Вс=6
      const startDayOfWeek = (firstDayUtc.getUTCDay() + 6) % 7

      // Последний день месяца
      const lastDayUtc = new Date(Date.UTC(year, month + 1, 0, 12, 0, 0))
      const daysInMonth = lastDayUtc.getUTCDate()

      const totalRequired = startDayOfWeek + daysInMonth
      const totalCells = totalRequired > 35 ? 42 : 35

      // Понедельник первой недели
      const startDateUtc = new Date(Date.UTC(year, month, 1 - startDayOfWeek, 12, 0, 0))

      const cells = []
      const todayKey = this.getMskDateKey(new Date())

      for (let i = 0; i < totalCells; i++) {
        const d = new Date(Date.UTC(
          startDateUtc.getUTCFullYear(),
          startDateUtc.getUTCMonth(),
          startDateUtc.getUTCDate() + i,
          12, 0, 0
        ))

        const cYear = d.getUTCFullYear()
        const cMonth = d.getUTCMonth()
        const cDay = d.getUTCDate()

        const dateKey = `${cYear}-${String(cMonth + 1).padStart(2, '0')}-${String(cDay).padStart(2, '0')}`
        const isCurrentMonth = cMonth === month
        const dayLessons = this.lessonsByDate[dateKey] || []

        cells.push({
          date: d,
          dateKey,
          dayNumber: cDay,
          isCurrentMonth,
          isToday: dateKey === todayKey,
          lessons: dayLessons
        })
      }
      return cells
    },

    // Генерация колонок для сетки недели (7 дней) СТРОГО ПО МОСКВЕ
    weekDays() {
      const { year, month, day } = this.getMskDateParts(this.currentDate)
      const currentUtc = new Date(Date.UTC(year, month, day, 12, 0, 0))

      // День недели: Пн=0 ... Вс=6
      const dayOfWeek = (currentUtc.getUTCDay() + 6) % 7
      // Понедельник текущей недели
      const mondayUtc = new Date(Date.UTC(year, month, day - dayOfWeek, 12, 0, 0))

      const days = []
      const todayKey = this.getMskDateKey(new Date())
      const dayNames = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']

      for (let i = 0; i < 7; i++) {
        const d = new Date(Date.UTC(
          mondayUtc.getUTCFullYear(),
          mondayUtc.getUTCMonth(),
          mondayUtc.getUTCDate() + i,
          12, 0, 0
        ))

        const cYear = d.getUTCFullYear()
        const cMonth = d.getUTCMonth()
        const cDay = d.getUTCDate()

        const dateKey = `${cYear}-${String(cMonth + 1).padStart(2, '0')}-${String(cDay).padStart(2, '0')}`
        const dayLessons = this.lessonsByDate[dateKey] || []

        days.push({
          date: d,
          dateKey,
          dayName: dayNames[i],
          dayNumber: cDay,
          monthName: d.toLocaleDateString('ru-RU', { timeZone: 'Europe/Moscow', month: 'short' }),
          isToday: dateKey === todayKey,
          lessons: dayLessons
        })
      }
      return days
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
    // Вспомогательный метод: извлечение компонентов даты строго в Europe/Moscow
    getMskDateParts(dateObj = new Date()) {
      try {
        const formatter = new Intl.DateTimeFormat('en-CA', {
          timeZone: 'Europe/Moscow',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false
        })
        const formatted = formatter.format(dateObj)
        const [datePart, timePart] = formatted.split(', ')
        const [year, month, day] = datePart.split('-').map(Number)
        const [hour, minute, second] = (timePart || '00:00:00').split(':').map(Number)
        return { year, month: month - 1, day, hour, minute, second }
      } catch (e) {
        // Fallback: Москва UTC+3
        const utcMs = dateObj.getTime() + (dateObj.getTimezoneOffset() * 60000)
        const mskDate = new Date(utcMs + (3 * 3600000))
        return {
          year: mskDate.getFullYear(),
          month: mskDate.getMonth(),
          day: mskDate.getDate(),
          hour: mskDate.getHours(),
          minute: mskDate.getMinutes(),
          second: mskDate.getSeconds()
        }
      }
    },

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

    // Навигация календаря
    goToToday() {
      this.currentDate = new Date()
    },
    navPrev() {
      const { year, month, day } = this.getMskDateParts(this.currentDate)
      if (this.calView === 'month') {
        this.currentDate = new Date(Date.UTC(year, month - 1, 15, 12, 0, 0))
      } else if (this.calView === 'week') {
        this.currentDate = new Date(Date.UTC(year, month, day - 7, 12, 0, 0))
      }
    },
    navNext() {
      const { year, month, day } = this.getMskDateParts(this.currentDate)
      if (this.calView === 'month') {
        this.currentDate = new Date(Date.UTC(year, month + 1, 15, 12, 0, 0))
      } else if (this.calView === 'week') {
        this.currentDate = new Date(Date.UTC(year, month, day + 7, 12, 0, 0))
      }
    },

    onDayClick(cell) {
      if (cell.lessons.length > 0) {
        this.openDayLessonsModal(cell)
      } else if (this.isMentor) {
        this.openCreateModal(cell.dateKey)
      }
    },

    openLessonDetails(lesson) {
      this.selectedLessonDetail = lesson
    },

    openDayLessonsModal(cell) {
      this.selectedDayModal = cell
    },

    async deleteFromDetailModal(lessonId) {
      await this.deleteLesson(lessonId)
      this.selectedLessonDetail = null
    },

    openCreateModal(dateKey = null) {
      let localISO
      if (dateKey) {
        // При клике на ячейку календаря берём выбранный день и ставим 16:00
        localISO = `${dateKey}T16:00`
      } else {
        // Завтрашний день строго по Москве
        const { year, month, day } = this.getMskDateParts(new Date())
        const tomorrowUtc = new Date(Date.UTC(year, month, day + 1, 12, 0, 0))
        const tYear = tomorrowUtc.getUTCFullYear()
        const tMonth = String(tomorrowUtc.getUTCMonth() + 1).padStart(2, '0')
        const tDay = String(tomorrowUtc.getUTCDate()).padStart(2, '0')
        localISO = `${tYear}-${tMonth}-${tDay}T16:00`
      }

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
        // Строго фиксируем часовой пояс Москвы (+03:00) при отправке
        let mskIsoString
        if (this.newLesson.start_time.includes('+') || this.newLesson.start_time.endsWith('Z')) {
          mskIsoString = new Date(this.newLesson.start_time).toISOString()
        } else {
          mskIsoString = new Date(`${this.newLesson.start_time}:00+03:00`).toISOString()
        }

        const payload = {
          ...this.newLesson,
          start_time: mskIsoString,
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

    // Date formatting helpers
    getMskDateKey(dateObj) {
      if (!dateObj) return ''
      try {
        const formatter = new Intl.DateTimeFormat('en-CA', {
          timeZone: 'Europe/Moscow',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        })
        return formatter.format(dateObj)
      } catch (e) {
        const { year, month, day } = this.getMskDateParts(dateObj)
        return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      }
    },

    formatTime(dateStr) {
      if (!dateStr) return ''
      const d = new Date(dateStr)
      return d.toLocaleTimeString('ru-RU', {
        timeZone: 'Europe/Moscow',
        hour: '2-digit',
        minute: '2-digit'
      })
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

    formatDayTitle(dateVal) {
      if (!dateVal) return ''
      let y, m, d
      if (typeof dateVal === 'string' && dateVal.includes('-')) {
        const parts = dateVal.split('-').map(Number)
        y = parts[0]
        m = parts[1] - 1
        d = parts[2]
      } else {
        const parts = this.getMskDateParts(new Date(dateVal))
        y = parts.year
        m = parts.month
        d = parts.day
      }
      const dt = new Date(Date.UTC(y, m, d, 12, 0, 0))
      return dt.toLocaleDateString('ru-RU', {
        timeZone: 'Europe/Moscow',
        weekday: 'long',
        day: 'numeric',
        month: 'long'
      })
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

/* ЗАГОЛОВОК СТРАНИЦЫ */
.header-section {
  margin-bottom: 20px;
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
  margin-bottom: 6px;
}

.subtitle-wrap {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}

.subtitle-text {
  color: var(--text-muted);
  font-size: 13.5px;
  line-height: 1.4;
}

/* ИНЛАЙН СТАТУС TELEGRAM */
.tg-inline-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: rgba(0, 255, 136, 0.1);
  border: 1px solid rgba(0, 255, 136, 0.25);
  color: var(--accent);
  padding: 3px 10px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
}

.tg-dot {
  width: 6px;
  height: 6px;
  background: var(--accent);
  border-radius: 50%;
  box-shadow: 0 0 6px var(--accent);
}

.add-lesson-btn {
  white-space: nowrap;
}

/* ПАНЕЛЬ УПРАВЛЕНИЯ КАЛЕНДАРЕМ */
.cal-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
  padding: 14px 20px;
  margin-bottom: 20px;
  border-radius: 16px;
  background: var(--bg-secondary);
  border: 1px solid var(--border);
}

.cal-toolbar-left {
  display: flex;
  align-items: center;
  gap: 14px;
}

.cal-today-btn {
  padding: 6px 14px;
  font-size: 13px;
  font-weight: 700;
}

.cal-nav-group {
  display: flex;
  gap: 4px;
}

.cal-nav-btn {
  background: var(--bg-tertiary);
  border: 1px solid var(--border);
  color: var(--text-primary);
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 11px;
  transition: all 0.2s ease;
}

.cal-nav-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: var(--border-light);
  transform: translateY(-1px);
}

.cal-period-title {
  margin: 0;
  font-size: 18px;
  font-weight: 800;
  color: var(--text-primary);
}

/* ПЕРЕКЛЮЧАТЕЛЬ РЕЖИМОВ */
.view-mode-tabs {
  display: flex;
  background: var(--bg-tertiary);
  padding: 4px;
  border-radius: 10px;
  border: 1px solid var(--border);
  gap: 4px;
}

.view-mode-tab {
  background: none;
  border: none;
  color: var(--text-secondary);
  padding: 6px 14px;
  border-radius: 7px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.view-mode-tab:hover {
  color: var(--text-primary);
}

.view-mode-tab.active {
  background: var(--accent);
  color: #000;
  font-weight: 700;
  box-shadow: 0 2px 8px rgba(0, 255, 136, 0.3);
}

/* ======================================================== */
/* 1. СЕТКА МЕСЯЦА (GOOGLE CALENDAR MONTH VIEW)            */
/* ======================================================== */
.month-view-container {
  padding: 0;
  overflow: hidden;
  border-radius: 16px;
  border: 1px solid var(--border);
  background: var(--bg-secondary);
}

.month-weekdays-row {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  background: rgba(255, 255, 255, 0.02);
  border-bottom: 1px solid var(--border);
}

.weekday-header-cell {
  padding: 12px;
  text-align: center;
  font-size: 12px;
  font-weight: 700;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.month-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
}

.month-day-cell {
  min-height: 110px;
  border-right: 1px solid var(--border);
  border-bottom: 1px solid var(--border);
  padding: 8px;
  display: flex;
  flex-direction: column;
  transition: background 0.15s ease;
  position: relative;
  cursor: pointer;
}

.month-day-cell:nth-child(7n) {
  border-right: none;
}

.month-day-cell:hover {
  background: rgba(255, 255, 255, 0.025);
}

.month-day-cell.other-month {
  background: rgba(0, 0, 0, 0.2);
  opacity: 0.45;
}

.month-day-cell.is-today {
  background: rgba(0, 255, 136, 0.03);
}

.day-cell-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.day-number-badge {
  font-size: 12px;
  font-weight: 700;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  color: var(--text-secondary);
}

.today-circle {
  background: var(--accent) !important;
  color: #000 !important;
  font-weight: 800 !important;
  box-shadow: 0 0 10px rgba(0, 255, 136, 0.4);
}

.day-quick-add {
  opacity: 0;
  width: 20px;
  height: 20px;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.1);
  border: none;
  color: var(--accent);
  font-size: 14px;
  font-weight: bold;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;
}

.month-day-cell:hover .day-quick-add {
  opacity: 1;
}

.day-quick-add:hover {
  background: var(--accent);
  color: #000;
}

/* СОБЫТИЯ В ДНЕ */
.day-events-container {
  display: flex;
  flex-direction: column;
  gap: 4px;
  overflow: hidden;
}

.cal-event-chip {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 3px 6px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: transform 0.15s ease, filter 0.15s ease;
}

.cal-event-chip:hover {
  transform: translateY(-1px);
  filter: brightness(1.2);
}

.cal-event-chip.is-past {
  opacity: 0.6;
}

.chip-time {
  font-size: 10px;
  font-weight: 700;
  opacity: 0.85;
}

.chip-subject-dot {
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: currentColor;
}

.chip-text {
  overflow: hidden;
  text-overflow: ellipsis;
}

.cal-more-chip {
  font-size: 10px;
  color: var(--accent);
  padding: 2px 4px;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 700;
  margin-top: 2px;
}

.cal-more-chip:hover {
  text-decoration: underline;
}

/* ЦВЕТА ПРЕДМЕТОВ */
.subj-math {
  background: rgba(0, 255, 136, 0.15);
  color: #00ff88;
  border: 1px solid rgba(0, 255, 136, 0.25);
}

.subj-cs {
  background: rgba(56, 189, 248, 0.15);
  color: #38bdf8;
  border: 1px solid rgba(56, 189, 248, 0.25);
}

.subj-phys {
  background: rgba(168, 85, 247, 0.15);
  color: #c084fc;
  border: 1px solid rgba(168, 85, 247, 0.25);
}

/* ======================================================== */
/* 2. СЕТКА НЕДЕЛИ (WEEK VIEW)                             */
/* ======================================================== */
.week-view-container {
  padding: 0;
  overflow-x: auto;
  border-radius: 16px;
  border: 1px solid var(--border);
  background: var(--bg-secondary);
}

.week-columns-grid {
  display: grid;
  grid-template-columns: repeat(7, minmax(130px, 1fr));
  min-width: 800px;
}

.week-day-col {
  border-right: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  min-height: 480px;
}

.week-day-col:last-child {
  border-right: none;
}

.week-day-col.is-today {
  background: rgba(0, 255, 136, 0.02);
}

.week-col-header {
  padding: 12px 10px;
  text-align: center;
  border-bottom: 1px solid var(--border);
  background: rgba(255, 255, 255, 0.02);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  position: relative;
}

.week-col-name {
  font-size: 11px;
  font-weight: 700;
  color: var(--text-muted);
  text-transform: uppercase;
}

.week-col-date {
  font-size: 13px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 12px;
  color: var(--text-primary);
}

.col-quick-add {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 20px;
  height: 20px;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.08);
  border: none;
  color: var(--accent);
  font-size: 14px;
  font-weight: bold;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0.6;
  transition: all 0.15s;
}

.col-quick-add:hover {
  opacity: 1;
  background: var(--accent);
  color: #000;
}

.week-col-content {
  padding: 10px 8px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  flex: 1;
}

.week-col-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100px;
}

.week-card {
  padding: 10px;
  border-radius: 10px;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.week-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.4);
}

.week-card.is-past {
  opacity: 0.6;
}

.week-card-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.week-time-pill {
  font-size: 11px;
  font-weight: 700;
}

.week-dur {
  font-size: 10px;
  opacity: 0.8;
}

.week-card-title {
  font-size: 13px;
  font-weight: 700;
  line-height: 1.3;
}

.week-card-person {
  font-size: 11px;
  opacity: 0.85;
}

.week-card-actions {
  margin-top: 4px;
}

.week-join-btn {
  display: block;
  text-align: center;
  background: rgba(255, 255, 255, 0.15);
  color: #fff;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 700;
  text-decoration: none;
}

.week-join-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

/* ======================================================== */
/* 3. СПИСОК (LIST VIEW)                                   */
/* ======================================================== */
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

.detail-label {
  font-size: 11px;
  color: var(--text-muted);
  margin-bottom: 2px;
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
  white-space: pre-line;
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

.empty-card {
  text-align: center;
  padding: 48px 24px;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 12px;
}

/* ======================================================== */
/* МОДАЛЬНЫЕ ОКНА                                          */
/* ======================================================== */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 16px;
}

.lesson-detail-modal,
.day-lessons-modal {
  max-width: 480px;
  width: 100%;
  background: #18181b;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 20px;
  padding: 24px;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.7);
}

.detail-badges {
  display: flex;
  gap: 8px;
  align-items: center;
}

.detail-modal-title {
  font-size: 20px;
  font-weight: 800;
  margin-bottom: 16px;
  color: var(--text-primary);
  line-height: 1.3;
}

.lesson-detail-box {
  background: var(--bg-tertiary);
  border-radius: 14px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 20px;
}

.modal-actions-row {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.no-link-box {
  text-align: center;
  padding: 10px;
  background: var(--bg-tertiary);
  border-radius: 10px;
  color: var(--text-muted);
  font-size: 13px;
}

.delete-action-btn {
  color: #ef4444;
  border-color: rgba(239, 68, 68, 0.3);
  justify-content: center;
}

.delete-action-btn:hover {
  background: rgba(239, 68, 68, 0.1);
  border-color: #ef4444;
}

/* ДЕНЬ СО СПИСКОМ УРОКОВ */
.day-modal-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: 360px;
  overflow-y: auto;
}

.day-modal-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px;
  border-radius: 12px;
  cursor: pointer;
  transition: transform 0.15s ease;
}

.day-modal-item:hover {
  transform: translateX(4px);
}

.d-item-time {
  font-size: 12px;
  font-weight: 700;
}

.d-item-info {
  display: flex;
  flex-direction: column;
  flex: 1;
  margin: 0 14px;
}

.arrow-icon {
  font-size: 16px;
  opacity: 0.7;
}

/* СОЗДАНИЕ УРОКА МОДАЛКА */
.create-lesson-modal {
  max-width: 520px;
  width: 100%;
  background: #18181b;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 20px;
  padding: 26px;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.7);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.modal-header h2,
.modal-header h3 {
  font-size: 20px;
  font-weight: 700;
  margin: 0;
}

.close-btn {
  background: none;
  border: none;
  color: var(--text-muted);
  font-size: 26px;
  cursor: pointer;
  line-height: 1;
}

.close-btn:hover {
  color: var(--text-primary);
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

.full-width {
  width: 100%;
}

@media (max-width: 768px) {
  .month-day-cell {
    min-height: 70px;
    padding: 4px;
  }
  .cal-period-title {
    font-size: 15px;
  }
  .view-mode-tab {
    padding: 5px 8px;
    font-size: 11px;
  }
  .cal-event-chip {
    font-size: 9px;
    padding: 2px 4px;
  }
}
</style>
