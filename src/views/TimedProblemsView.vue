<template>
  <div class="page">
    <!-- ПРОВЕРКА АВТОРИЗАЦИИ -->
    <div v-if="!isAuthorized" class="auth-required card">
      <div class="auth-icon">⚠️</div>
      <h2>Авторизация требуется</h2>
      <p class="muted">Для использования режима "На время" необходимо войти</p>
      <router-link to="/register" class="button-auth">
        Зарегистрироваться
      </router-link>
    </div>

    <!-- ОСНОВНОЙ КОНТЕНТ (только для авторизованных) -->
    <div v-else class="container">
      <div style="flex:1">
        <div class="card">
          <h2 style="margin-top: 0;">⏱️ Тренировка на время</h2>
          <div class="muted" style="margin-bottom: 24px;">Решайте задачи и набирайте очки на время</div>

          <!-- РЕЖИМ НАСТРОЙКИ -->
          <div v-if="!timedMode.active && !timedMode.finished" class="timed-setup">
            <div class="setup-section">
              <label class="setup-label">Выберите категорию:</label>
              <div v-if="timedCategories.length > 0" class="categories-list">
                <button 
                  v-for="cat in timedCategories"
                  :key="cat.id"
                  @click="timedCategory = cat.id"
                  class="category-item"
                  :class="{ active: timedCategory === cat.id }"
                >
                  <div class="category-name">{{ cat.name }}</div>
                </button>
              </div>
              <div v-else class="loading-text">Загружаем категории...</div>
            </div>

            <div v-if="timedCategory" class="setup-section">
              <label class="setup-label">Время (секунды):</label>
              <div class="time-inputs">
                <input 
                  v-model.number="timedDuration" 
                  type="number" 
                  min="30" 
                  max="600" 
                  class="time-input"
                />
                <div class="time-presets">
                  <button @click="timedDuration = 60" class="preset-btn">1 мин</button>
                  <button @click="timedDuration = 120" class="preset-btn">2 мин</button>
                  <button @click="timedDuration = 300" class="preset-btn">5 мин</button>
                  <button @click="timedDuration = 600" class="preset-btn">10 мин</button>
                </div>
              </div>
            </div>

            <button 
              v-if="timedCategory && timedDuration"
              @click="startTimedMode"
              class="button-start"
              style="width: 100%; margin-top: 24px;"
              :disabled="loadingStart"
            >
              {{ loadingStart ? '⏳ Загружаем...' : '🚀 Начать тренировку' }}
            </button>

            <div v-if="timedError" class="error-message">
              ⚠️ {{ timedError }}
            </div>
          </div>

          <!-- РЕЖИМ ТРЕНИРОВКИ (АКТИВНО) -->
          <div v-if="timedMode.active" class="timed-active">
            <div class="timed-header">
              <div class="timer" :class="{ warning: timedMode.timeLeft < 10, danger: timedMode.timeLeft < 3 }">
                ⏱️ {{ formatTime(timedMode.timeLeft) }}
              </div>
              <div class="timed-stats">
                <span class="stat-item">
                  <span class="stat-icon">✓</span>
                  {{ timedMode.solved }}
                </span>
                <span class="stat-item">
                  <span class="stat-icon">✗</span>
                  {{ timedMode.failed }}
                </span>
                <span class="stat-item">
                  <span class="stat-icon">⭐</span>
                  {{ timedMode.points }}
                </span>
              </div>
            </div>

            <div v-if="timedMode.currentProblem" class="problem-timed card">
              <h3>{{ timedMode.currentProblem.title }}</h3>
              <p class="muted">{{ timedMode.currentProblem.description }}</p>
              
              <div class="problem-meta">
                <span class="difficulty-badge" :class="timedMode.currentProblem.difficulty">
                  {{ getDifficultyLabel(timedMode.currentProblem.difficulty) }}
                </span>
              </div>

              <div class="input-group">
                <input 
                  v-model="timedMode.answer"
                  @keyup.enter="submitTimedAnswer"
                  class="input-answer"
                  placeholder="Введите ответ..."
                  :disabled="timedMode.answerDisabled"
                  autofocus
                />
                <button 
                  @click="submitTimedAnswer"
                  class="button-submit"
                  :disabled="!timedMode.answer.trim() || timedMode.answerDisabled"
                >
                  ✓
                </button>
              </div>

              <div v-if="timedMode.feedback" class="feedback-message" :class="timedMode.feedback.correct ? 'correct' : 'incorrect'">
                <span v-if="timedMode.feedback.correct">
                  ✓ Правильно!
                </span>
                <span v-else>
                  ✗ Неправильно. Ответ: {{ timedMode.feedback.answer }}
                </span>
              </div>
            </div>

            <div v-else class="loading-problem">
              <div class="spinner"></div>
              <p>Загружаем следующую задачу...</p>
            </div>
          </div>

          <!-- РЕЖИМ РЕЗУЛЬТАТОВ -->
          <div v-if="timedMode.finished" class="timed-results">
            <div class="results-header">
              <h3>Результаты 🎉</h3>
            </div>

            <div class="results-grid">
              <div class="result-card">
                <div class="result-label">Решено</div>
                <div class="result-value">{{ timedMode.solved }}</div>
              </div>
              <div class="result-card">
                <div class="result-label">Ошибок</div>
                <div class="result-value">{{ timedMode.failed }}</div>
              </div>
              <div class="result-card">
                <div class="result-label">Очков</div>
                <div class="result-value">{{ timedMode.points }}</div>
              </div>
              <div class="result-card">
                <div class="result-label">Процент</div>
                <div class="result-value">
                  {{ timedMode.solved > 0 ? Math.round((timedMode.solved / (timedMode.solved + timedMode.failed)) * 100) : 0 }}%
                </div>
              </div>
            </div>

            <button 
              @click="resetTimedMode"
              class="button-again"
              style="width: 100%; margin-top: 24px;"
            >
              🔄 Попробовать снова
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { store } from '../store.js'
import { api } from '../api'

export default {
  name: 'TimedProblemsView',
  data() {
    return {
      store,
      // Авторизация
      isAuthorized: false,
      currentUser: null,

      // Основные данные
      timedCategory: null,
      timedDuration: 120,
      timedCategories: [],
      timedError: '',
      loadingStart: false,

      timedMode: {
        active: false,
        finished: false,
        timeLeft: 0,
        currentProblem: null,
        answer: '',
        feedback: null,
        solved: 0,
        failed: 0,
        points: 0,
        timer: null,
        answerDisabled: false
      }
    }
  },
  async mounted() {
    this.checkAuthorization()
    await this.loadCategories()
  },
  watch: {
    'store.selectedSubject': async function(newSubject) {
      console.log('📚 Предмет изменился на:', newSubject)
      await this.loadCategories()
      // Сбросим выбранную категорию при смене предмета
      this.timedCategory = null
      this.timedError = ''
    }
  },
  methods: {
    checkAuthorization() {
      const savedEmail = localStorage.getItem('email')
      
      if (savedEmail) {
        this.isAuthorized = true
        this.currentUser = { id: savedEmail, type: 'email' }
        console.log('✅ Пользователь авторизован:', savedEmail)
        return
      }

      this.isAuthorized = false
      this.currentUser = null
      console.warn('⚠️ Пользователь не авторизован')
    },

    async loadCategories() {
      try {
        console.log('🔄 Загружаем категории для предмета:', this.store.selectedSubject)
        this.timedCategories = await api.getCategories(this.store.selectedSubject)
        console.log('✅ Категории загружены:', this.timedCategories)
      } catch (e) {
        console.error('Ошибка загрузки категорий:', e)
        this.timedError = `Ошибка загрузки категорий: ${e.message}`
        this.timedCategories = []
      }
    },

    async startTimedMode() {
      // ✅ ПРОВЕРКА АВТОРИЗАЦИИ ПЕРЕД СТАРТОМ
      if (!this.isAuthorized) {
        this.timedError = 'Вы должны быть авторизованы'
        return
      }

      this.timedError = ''
      this.loadingStart = true
      
      try {
        // Загружаем первую задачу перед началом
        const firstProblem = await api.getRandomProblem(
          this.store.selectedSubject,
          this.timedCategory
        )

        if (!firstProblem) {
          this.timedError = 'В этой категории нет задач'
          this.loadingStart = false
          return
        }

        this.timedMode.active = true
        this.timedMode.finished = false
        this.timedMode.timeLeft = this.timedDuration
        this.timedMode.solved = 0
        this.timedMode.failed = 0
        this.timedMode.points = 0
        this.timedMode.answerDisabled = false
        this.timedMode.currentProblem = firstProblem
        this.timedMode.answer = ''
        this.timedMode.feedback = null
        
        // Запускаем таймер
        this.timedMode.timer = setInterval(() => {
          this.timedMode.timeLeft--
          if (this.timedMode.timeLeft <= 0) {
            this.finishTimedMode()
          }
        }, 1000)
      } catch (e) {
        console.error('Ошибка запуска тренировки:', e)
        this.timedError = `Ошибка: ${e.message}`
      } finally {
        this.loadingStart = false
      }
    },

    async loadNextTimedProblem() {
      try {
        const problem = await api.getRandomProblem(
          this.store.selectedSubject,
          this.timedCategory
        )
        if (problem) {
          this.timedMode.currentProblem = problem
          this.timedMode.answer = ''
          this.timedMode.feedback = null
          this.timedMode.answerDisabled = false
        } else {
          console.warn('Нет больше задач в этой категории')
          await this.loadNextTimedProblem()
        }
      } catch (e) {
        console.error('Ошибка загрузки задачи:', e)
        this.timedError = `Ошибка загрузки задачи: ${e.message}`
      }
    },

    async submitTimedAnswer() {
      if (!this.timedMode.answer.trim() || !this.currentUser) return
      
      this.timedMode.answerDisabled = true
      
      try {
        const result = await api.solveProblem(
          this.store.selectedSubject,
          this.timedMode.currentProblem.id,
          this.timedMode.answer
        )
        
        // ✅ СОХРАНЯЕМ ПОПЫТКУ НА СЕРВЕР (с 1 секундой на ответ)
        await api.saveTimedAttempt(
          this.store.selectedSubject,
          this.timedMode.currentProblem.id,
          this.timedMode.answer,
          result.correct,
          1  // ✅ ПЕРЕДАЁМ 1 СЕКУНДУ НА КАЖДЫЙ ОТВЕТ
        )
        
        if (result.correct) {
          this.timedMode.solved++
          this.timedMode.points += 1
          this.timedMode.feedback = {
            correct: true,
            answer: null
          }
        } else {
          this.timedMode.failed++
          this.timedMode.feedback = {
            correct: false,
            answer: result.correct_answer
          }
        }
        
        // Загружаем следующую задачу через 1.5 секунды
        setTimeout(() => {
          this.loadNextTimedProblem()
        }, 1500)
        
      } catch (e) {
        console.error('Ошибка при проверке ответа:', e)
        this.timedMode.feedback = {
          correct: false,
          answer: 'Ошибка сервера'
        }
        this.timedMode.answerDisabled = false
      }
    },

    finishTimedMode() {
      if (this.timedMode.timer) {
        clearInterval(this.timedMode.timer)
      }
      this.timedMode.active = false
      this.timedMode.finished = true
    },

    resetTimedMode() {
      if (this.timedMode.timer) {
        clearInterval(this.timedMode.timer)
      }
      this.timedMode = {
        active: false,
        finished: false,
        timeLeft: 0,
        currentProblem: null,
        answer: '',
        feedback: null,
        solved: 0,
        failed: 0,
        points: 0,
        timer: null,
        answerDisabled: false
      }
      this.timedCategory = null
      this.timedDuration = 120
      this.timedError = ''
    },

    getDifficultyLabel(difficulty) {
      const labels = {
        'easy': 'Лёгкая',
        'medium': 'Средняя',
        'hard': 'Сложная'
      }
      return labels[difficulty] || difficulty
    },

    formatTime(seconds) {
      const mins = Math.floor(seconds / 60)
      const secs = seconds % 60
      return `${mins}:${secs < 10 ? '0' : ''}${secs}`
    }
  },
  beforeUnmount() {
    if (this.timedMode.timer) {
      clearInterval(this.timedMode.timer)
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

h2 {
  margin: 0 0 8px 0;
  background: var(--gradient-primary);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  font-size: 24px;
}

h3 {
  color: var(--text-primary);
  margin: 0 0 12px 0;
}

.muted {
  color: var(--text-muted);
  font-size: 14px;
}

/* ===== АВТОРИЗАЦИЯ ===== */

.auth-required {
  max-width: 500px;
  margin: 40px auto;
  text-align: center;
  padding: 40px;
}

.auth-icon {
  font-size: 64px;
  margin-bottom: 16px;
}

.auth-required h2 {
  margin-bottom: 12px;
}

.auth-required p {
  margin-bottom: 24px;
  font-size: 16px;
}

.button-auth {
  display: inline-block;
  background: var(--gradient-primary);
  color: #000;
  padding: 14px 28px;
  border-radius: 8px;
  font-weight: 600;
  text-decoration: none;
  transition: all 0.3s ease;
  border: none;
  cursor: pointer;
}

.button-auth:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 255, 136, 0.3);
}

/* ===== SETUP ===== */

.setup-label {
  font-weight: 600;
  color: var(--accent);
  text-transform: uppercase;
  font-size: 13px;
  margin-bottom: 12px;
  display: block;
}

.timed-setup {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.setup-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.categories-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.category-item {
  background: var(--bg-tertiary);
  border: 2px solid var(--border);
  border-radius: 8px;
  padding: 12px 16px;
  text-align: left;
  cursor: pointer;
  transition: all 0.3s ease;
  color: var(--text-primary);
}

.category-item:hover {
  border-color: var(--accent);
  transform: translateX(4px);
}

.category-item.active {
  background: var(--accent-transparent);
  border-color: var(--accent);
}

.category-name {
  font-weight: 600;
}

.loading-text {
  color: var(--text-muted);
  text-align: center;
  padding: 20px;
}

.time-inputs {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.time-input {
  background: var(--bg-tertiary);
  border: 2px solid var(--border);
  border-radius: 8px;
  padding: 12px 16px;
  color: var(--text-primary);
  font-size: 16px;
  font-weight: 600;
}

.time-input:focus {
  outline: none;
  border-color: var(--accent);
}

.time-presets {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}

.preset-btn {
  background: var(--bg-tertiary);
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 8px 12px;
  color: var(--text-primary);
  cursor: pointer;
  font-size: 12px;
  font-weight: 600;
  transition: all 0.3s ease;
}

.preset-btn:hover {
  border-color: var(--accent);
  color: var(--accent);
}

.button-start {
  background: var(--gradient-primary);
  color: #000;
  border: none;
  padding: 14px 24px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.button-start:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 255, 136, 0.3);
}

.button-start:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.error-message {
  background: rgba(255, 68, 68, 0.1);
  border: 1px solid rgba(255, 68, 68, 0.3);
  color: #ff4444;
  padding: 12px 16px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
}

/* ===== TIMED ACTIVE ===== */

.timed-active {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.timed-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: var(--bg-tertiary);
  border-radius: 8px;
  border: 1px solid var(--border);
  gap: 20px;
}

.timer {
  font-size: 36px;
  font-weight: 700;
  color: var(--accent);
  font-variant-numeric: tabular-nums;
  font-family: 'Courier New', monospace;
  flex-shrink: 0;
}

.timer.warning {
  color: #ffc107;
}

.timer.danger {
  color: #ff4444;
  animation: blink 0.5s infinite;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.timed-stats {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 600;
  font-size: 14px;
}

.stat-icon {
  font-size: 18px;
}

.problem-timed {
  background: var(--bg-tertiary);
  border: 1px solid var(--border);
  border-radius: 8px;
}

.problem-meta {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
  font-size: 12px;
}

.difficulty-badge {
  padding: 4px 12px;
  border-radius: 6px;
  font-weight: 600;
}

.difficulty-badge.easy {
  background: rgba(0, 255, 136, 0.1);
  color: var(--accent);
}

.difficulty-badge.medium {
  background: rgba(255, 193, 7, 0.1);
  color: #ffc107;
}

.difficulty-badge.hard {
  background: rgba(255, 68, 68, 0.1);
  color: #ff4444;
}

.input-group {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.input-answer {
  flex: 1;
  background: var(--bg-secondary);
  border: 2px solid var(--border);
  border-radius: 8px;
  padding: 12px 16px;
  color: var(--text-primary);
  font-size: 16px;
  transition: all 0.3s ease;
}

.input-answer:focus {
  outline: none;
  border-color: var(--accent);
}

.input-answer:disabled {
  opacity: 0.5;
}

.button-submit {
  background: var(--gradient-primary);
  color: #000;
  border: none;
  padding: 12px 20px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 18px;
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 50px;
}

.button-submit:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(0, 255, 136, 0.3);
}

.button-submit:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.feedback-message {
  padding: 12px 16px;
  border-radius: 8px;
  font-weight: 600;
  text-align: center;
}

.feedback-message.correct {
  background: rgba(0, 255, 136, 0.1);
  border: 1px solid rgba(0, 255, 136, 0.3);
  color: var(--accent);
}

.feedback-message.incorrect {
  background: rgba(255, 68, 68, 0.1);
  border: 1px solid rgba(255, 68, 68, 0.3);
  color: #ff4444;
}

.loading-problem {
  text-align: center;
  padding: 40px;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(0, 255, 136, 0.2);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin: 0 auto 16px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* ===== RESULTS ===== */

.timed-results {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.results-header {
  text-align: center;
}

.results-header h3 {
  font-size: 28px;
  margin-bottom: 8px;
}

.results-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.result-card {
  background: var(--bg-tertiary);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 20px;
  text-align: center;
}

.result-label {
  color: var(--text-muted);
  font-size: 12px;
  margin-bottom: 8px;
  text-transform: uppercase;
}

.result-value {
  font-size: 32px;
  font-weight: 700;
  color: var(--accent);
}

.button-again {
  background: var(--gradient-primary);
  color: #000;
  border: none;
  padding: 14px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.button-again:hover {
  transform: translateY(-2px);
}

@media (max-width: 768px) {
  .page {
    padding: 16px;
  }

  .card {
    padding: 16px;
  }

  .time-presets {
    grid-template-columns: repeat(2, 1fr);
  }

  .results-grid {
    grid-template-columns: 1fr;
  }

  .timed-header {
    flex-direction: column;
    text-align: center;
  }

  .timed-stats {
    justify-content: center;
  }

  .timer {
    font-size: 28px;
  }

  .input-group {
    flex-direction: column;
  }

  .button-submit {
    width: 100%;
  }
}
</style>
