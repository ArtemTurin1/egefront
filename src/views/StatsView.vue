<template>
  <div class="page">
    <div class="container">
      <div class="card">
        <h2>📊 Статистика</h2>
        <div class="muted" style="margin-bottom: 24px;">Ваши достижения и прогресс</div>

        <!-- ТРЕБУЕТСЯ АВТОРИЗАЦИЯ -->
        <div v-if="!isAuthorized" class="auth-required">
          <div class="auth-icon">⚠️</div>
          <p>Для просмотра статистики требуется авторизация</p>
          <router-link to="/register" class="button-auth">
            Войти в аккаунт
          </router-link>
        </div>

        <!-- КОНТЕНТ ДЛЯ АВТОРИЗОВАННЫХ ПОЛЬЗОВАТЕЛЕЙ -->
        <div v-else-if="profile && stats" class="stats-content">
          <!-- ОБЩАЯ ИНФОРМАЦИЯ -->
          <div class="stats-section">
            <h3>📈 Общая статистика</h3>
            <div class="stats-grid">
              <div class="stat-card">
                <div class="stat-icon">📚</div>
                <div class="stat-title">Всего решено</div>
                <div class="stat-value">{{ stats.solved_count }}</div>
              </div>
              <div class="stat-card">
                <div class="stat-icon">📐</div>
                <div class="stat-title">Математика</div>
                <div class="stat-value">{{ stats.math_solved }}</div>
              </div>
              <div class="stat-card">
                <div class="stat-icon">💻</div>
                <div class="stat-title">Информатика</div>
                <div class="stat-value">{{ stats.informatics_solved }}</div>
              </div>
              <div class="stat-card">
                <div class="stat-icon">⭐</div>
                <div class="stat-title">Уровень</div>
                <div class="stat-value">{{ profile.level }}</div>
              </div>
            </div>
          </div>

          <!-- СТАТИСТИКА НА ВРЕМЯ -->
          <div class="stats-section">
            <h3>⏱️ Тренировка на время</h3>
            <div class="timed-tabs">
              <button 
                @click="timedSubject = null"
                class="timed-tab"
                :class="{ active: timedSubject === null }"
              >
                Все
              </button>
              <button 
                @click="timedSubject = 'math'"
                class="timed-tab"
                :class="{ active: timedSubject === 'math' }"
              >
                Математика
              </button>
              <button 
                @click="timedSubject = 'informatics'"
                class="timed-tab"
                :class="{ active: timedSubject === 'informatics' }"
              >
                Информатика
              </button>
            </div>

            <div class="timed-stats-grid">
              <div class="timed-stat-card">
                <div class="timed-stat-label">Всего попыток</div>
                <div class="timed-stat-value">{{ timedStats.total_attempts }}</div>
              </div>
              <div class="timed-stat-card">
                <div class="timed-stat-label">Верно</div>
                <div class="timed-stat-value correct">{{ timedStats.correct_answers }}</div>
              </div>
              <div class="timed-stat-card">
                <div class="timed-stat-label">Неверно</div>
                <div class="timed-stat-value incorrect">{{ timedStats.incorrect_answers }}</div>
              </div>
              <div class="timed-stat-card">
                <div class="timed-stat-label">Процент успеха</div>
                <div class="timed-stat-value">{{ timedStats.success_rate }}%</div>
              </div>
              <div class="timed-stat-card">
                <div class="timed-stat-label">Задач в минуту</div>
                <div class="timed-stat-value">{{ timedStats.avg_problems_per_minute }}</div>
              </div>
              <div class="timed-stat-card">
                <div class="timed-stat-label">Общее время</div>
                <div class="timed-stat-value">{{ formatTime(timedStats.total_time_seconds) }}</div>
              </div>
            </div>
          </div>

          <!-- ИНФОРМАЦИЯ -->
          <div class="info-box">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="16" x2="12" y2="12"/>
              <line x1="12" y1="8" x2="12.01" y2="8"/>
            </svg>
            <span>Статистика обновляется в реальном времени при решении задач</span>
          </div>

          <!-- КНОПКА НАЗАД -->
          <router-link to="/" class="button-back">
            ← Вернуться к задачам
          </router-link>
        </div>

        <!-- ЗАГРУЗКА -->
        <div v-else class="loading">
          <div class="spinner"></div>
          <p>Загружаем статистику...</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { api } from '../api'

export default {
  name: 'StatsView',
  data() {
    return {
      profile: null,
      stats: null,
      timedStats: {
        total_attempts: 0,
        correct_answers: 0,
        incorrect_answers: 0,
        avg_problems_per_minute: 0,
        total_time_seconds: 0,
        success_rate: 0
      },
      timedSubject: null,
      isAuthorized: false,
      currentUser: null,
      loading: true
    }
  },
  async mounted() {
    this.checkAuthorization()
    if (this.isAuthorized) {
      await this.loadStats()
    } else {
      this.loading = false
    }
  },
  watch: {
    timedSubject: async function() {
      if (this.isAuthorized) {
        await this.loadTimedStats()
      }
    }
  },
  methods: {
    checkAuthorization() {
      const savedEmail = localStorage.getItem('email')
      
      if (savedEmail) {
        this.isAuthorized = true
        this.currentUser = { id: savedEmail, type: 'email' }
        console.log('✅ Статистика: пользователь авторизован', savedEmail)
        return
      }

      this.isAuthorized = false
      this.currentUser = null
      console.warn('⚠️ Статистика: пользователь не авторизован')
    },

    async loadStats() {
      try {
        this.profile = await api.getProfile(this.currentUser.id, this.currentUser.type)
        this.stats = await api.getStats(this.currentUser.id, this.currentUser.type)
        await this.loadTimedStats()
      } catch (e) {
        console.error('❌ Ошибка загрузки статистики:', e)
      } finally {
        this.loading = false
      }
    },

    async loadTimedStats() {
      try {
        // ✅ ГАРАНТИРУЕМ ВСЕ ПОЛЯ ИЗ API
        const stats = await api.getTimedStats(this.timedSubject)
        
        this.timedStats = {
          total_attempts: stats.total_attempts || 0,
          correct_answers: stats.correct_answers || 0,
          incorrect_answers: stats.incorrect_answers || 0,
          success_rate: stats.success_rate || 0,
          avg_problems_per_minute: stats.avg_problems_per_minute || 0,
          total_time_seconds: stats.total_time_seconds || 0
        }
        
        console.log('✅ Загружена статистика на время:', this.timedStats)
      } catch (e) {
        console.error('❌ Ошибка загрузки статистики на время:', e)
        // Устанавливаем пустые значения при ошибке
        this.timedStats = {
          total_attempts: 0,
          correct_answers: 0,
          incorrect_answers: 0,
          success_rate: 0,
          avg_problems_per_minute: 0,
          total_time_seconds: 0
        }
      }
    },

    formatTime(seconds) {
      const hours = Math.floor(seconds / 3600)
      const minutes = Math.floor((seconds % 3600) / 60)
      const secs = seconds % 60

      if (hours > 0) {
        return `${hours}ч ${minutes}м`
      } else if (minutes > 0) {
        return `${minutes}м ${secs}с`
      } else {
        return `${secs}с`
      }
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
}

.card {
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 24px;
  backdrop-filter: blur(20px);
  flex: 1;
}

h2 {
  background: var(--gradient-primary);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  font-size: 28px;
  margin: 0 0 8px 0;
}

h3 {
  color: var(--text-primary);
  font-size: 18px;
  margin: 0 0 16px 0;
}

.muted {
  color: var(--text-muted);
  font-size: 14px;
}

/* ===== AUTH REQUIRED ===== */
.auth-required {
  text-align: center;
  padding: 40px 20px;
}

.auth-icon {
  font-size: 64px;
  margin-bottom: 16px;
}

.auth-required p {
  color: var(--text-muted);
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

/* ===== STATS CONTENT ===== */
.stats-content {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.stats-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
}

.stat-card {
  background: var(--bg-tertiary);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 20px;
  text-align: center;
  transition: all 0.3s ease;
}

.stat-card:hover {
  border-color: var(--accent);
  transform: translateY(-4px);
}

.stat-icon {
  font-size: 32px;
  margin-bottom: 8px;
}

.stat-title {
  color: var(--text-muted);
  font-size: 12px;
  text-transform: uppercase;
  margin-bottom: 8px;
  letter-spacing: 0.5px;
}

.stat-value {
  font-size: 32px;
  font-weight: 700;
  color: var(--accent);
}

/* ===== TIMED STATS ===== */
.timed-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.timed-tab {
  background: var(--bg-tertiary);
  border: 2px solid var(--border);
  border-radius: 8px;
  padding: 10px 16px;
  color: var(--text-primary);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 14px;
}

.timed-tab:hover {
  border-color: var(--accent);
}

.timed-tab.active {
  background: var(--accent-transparent);
  border-color: var(--accent);
  color: var(--accent);
}

.timed-stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 12px;
}

.timed-stat-card {
  background: var(--bg-tertiary);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 16px;
  text-align: center;
}

.timed-stat-label {
  color: var(--text-muted);
  font-size: 12px;
  text-transform: uppercase;
  margin-bottom: 8px;
  letter-spacing: 0.5px;
}

.timed-stat-value {
  font-size: 28px;
  font-weight: 700;
  color: var(--accent);
}

.timed-stat-value.correct {
  color: #00ff88;
}

.timed-stat-value.incorrect {
  color: #ff4444;
}

/* ===== INFO BOX ===== */
.info-box {
  background: rgba(0, 255, 136, 0.1);
  border: 1px solid rgba(0, 255, 136, 0.3);
  border-radius: 8px;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  color: var(--accent);
  font-size: 14px;
}

.info-box svg {
  flex-shrink: 0;
}

/* ===== BUTTONS ===== */
.button-back {
  display: block;
  text-align: center;
  padding: 12px 20px;
  background: transparent;
  border: 2px solid var(--border);
  color: var(--text-primary);
  border-radius: 8px;
  text-decoration: none;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-top: 24px;
}

.button-back:hover {
  border-color: var(--accent);
  color: var(--accent);
}

/* ===== LOADING ===== */
.loading {
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

@media (max-width: 768px) {
  .page {
    padding: 12px;
  }

  .card {
    padding: 16px;
  }

  h2 {
    font-size: 24px;
  }

  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .timed-stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 480px) {
  .page {
    padding: 8px;
  }

  .card {
    padding: 12px;
  }

  .stats-grid,
  .timed-stats-grid {
    grid-template-columns: 1fr;
  }

  .timed-tabs {
    flex-direction: column;
  }

  .timed-tab {
    width: 100%;
  }
}
</style>
