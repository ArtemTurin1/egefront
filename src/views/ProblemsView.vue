<template>
  <div class="page">
    <div class="container-adaptive">
      <!-- ЛЕВАЯ ПАНЕЛЬ -->
      <div class="selection-panel">
        <div class="card">
          <div class="header-with-search">
            <h2 style="margin: 0;">Задачи ЕГЭ</h2>
            <div class="search-box-header">
              <input 
                v-model="searchId"
                type="number"
                placeholder="ID задачи"
                class="search-input-header"
                @keyup.enter="searchProblemById"
              />
              <button @click="searchProblemById" class="button-search-header" :disabled="submitting">🔍</button>
            </div>
          </div>

          <div v-if="searchError" class="error-message">⚠️ {{ searchError }}</div>

          <div v-if="selectedSubject" class="selection-step">
            <div class="step-label">Выберите категорию</div>
            <div class="categories-list">
              <button 
                v-for="cat in categories"
                :key="cat.id"
                @click="selectCategory(cat)"
                class="category-item"
                :class="{ active: selectedCategory?.id === cat.id }"
              >
                <div class="category-name">{{ cat.name }}</div>
              </button>
            </div>
          </div>

          <div v-if="errorMessage" class="error-message">⚠️ {{ errorMessage }}</div>
        </div>
      </div>

      <!-- ПРАВАЯ ПАНЕЛЬ -->
      <div class="problems-panel">
        <div class="card">
          <div v-if="selectedCategory || searchedProblems.length > 0" class="card-header">
            <h3 style="margin: 0;">{{ selectedCategory ? selectedCategory.name : 'Результаты поиска' }}</h3>
            <div class="muted">{{ displayProblems.length }} задач</div>
          </div>
          <div v-else class="card-header empty-state">
            <div class="muted">Выберите категорию или найдите задачу по ID</div>
          </div>

          <div class="problems-list" v-if="displayProblems.length > 0">
            <div 
              v-for="p in displayProblems"
              :key="p.id"
              class="problem-item"
              :class="{ solved: p.solved }"
            >
              <div class="problem-content">
                <div class="problem-header">
                  <span class="problem-id">ID: {{ p.id }}</span>
                  <h4 style="margin: 0; flex: 1;">{{ p.title }}</h4>
                  <span v-if="p.solved" class="solved-badge">✓</span>
                </div>
                <div class="problem-meta">
                  <span class="difficulty-badge" :class="p.difficulty">{{ getDifficultyLabel(p.difficulty) }}</span>
                  <span class="points-badge">{{ p.points }} баллов</span>
                </div>
              </div>
              <div class="problem-actions">
                <button @click="openProblem(p)" class="button-solve" :disabled="submitting">💡 Решение</button>
              </div>
            </div>
          </div>

          <div v-else-if="selectedCategory" class="empty-problems">Нет задач в этой категории</div>
        </div>
      </div>
    </div>

    <!-- МОДАЛЬНОЕ ОКНО -->
    <div v-if="opened" class="modal-backdrop" @click.self="closeProblem">
      <div class="modal card">
        <div class="modal-header">
          <div style="flex: 1;">
            <h3 style="margin: 0;">{{ opened.title }}</h3>
            <div class="muted">ID: {{ opened.id }}</div>
          </div>
          <button @click="closeProblem" class="close-btn">✕</button>
        </div>

        <div class="modal-body">
          <!-- ИЗОБРАЖЕНИЕ ЗАДАЧИ -->
          <div v-if="opened.problem_image" class="image-section">
            <h4>Изображение задачи:</h4>
            <img :src="`data:${opened.problem_image_type};base64,${opened.problem_image}`" class="problem-image" alt="Problem" />
          </div>

          <!-- РЕШЕНИЕ С LaTeX И КРАСИВЫМ ФОРМАТИРОВАНИЕМ -->
          <div class="solution-section">
            <h4>Решение:</h4>
            <div v-if="opened.solution" class="solution-content">
              <div ref="solutionDiv"></div>
            </div>
            <div v-else class="solution-content empty-solution">Решение не добавлено</div>
          </div>

          <!-- ИЗОБРАЖЕНИЕ РЕШЕНИЯ -->
          <div v-if="opened.solution_image" class="image-section">
            <h4>Иллюстрация решения:</h4>
            <img :src="`data:${opened.solution_image_type};base64,${opened.solution_image}`" class="solution-image" alt="Solution" />
          </div>

          <!-- ОТВЕТ -->
          <div class="answer-section">
            <h4>Правильный ответ:</h4>
            <div class="answer-display">{{ opened.correct_answer }}</div>
          </div>

          <!-- РЕЗУЛЬТАТ -->
          <div v-if="result" class="result-box" :class="result.correct ? 'success' : 'error'">
            <div v-if="result.correct">✅ Поздравляем! Ответ правильный!</div>
            <div v-else>❌ Ответ неправильный. Правильный: <strong>{{ result.correct_answer }}</strong></div>
          </div>
        </div>

        <div class="modal-footer">
          <button @click="closeProblem" class="button">Закрыть</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { store } from '../store.js'
import { api } from '../api'

export default {
  name: 'ProblemsView',
  data() {
    return {
      store,
      selectedSubject: store.selectedSubject,
      selectedCategory: null,
      categories: [],
      categoryProblems: [],
      solvedProblems: new Set(),
      errorMessage: '',

      searchId: null,
      searchError: '',
      searchedProblems: [],

      opened: null,
      result: null,
      submitting: false,
      
      isAuthorized: false,
      currentUser: null
    }
  },
  computed: {
    displayProblems() {
      return this.searchedProblems.length > 0 ? this.searchedProblems : this.categoryProblems
    }
  },
  async mounted() {
    this.checkAuthorization()
    
    const savedSubject = store.selectedSubject || 'math'
    await this.selectSubject(savedSubject)
    
    if (this.isAuthorized) {
      await this.loadSolvedProblems()
    }
    
    this.loadMathJax()
  },
  watch: {
    'store.selectedSubject'(newSubject) {
      this.selectedSubject = newSubject
      this.selectSubject(newSubject)
    },
    opened() {
      if (this.opened) {
        this.$nextTick(() => {
          this.renderSolution()
        })
      }
    }
  },
  methods: {
    loadMathJax() {
      if (!window.MathJax) {
        const script = document.createElement('script')
        script.src = 'https://polyfill.io/v3/polyfill.min.js?features=es6'
        document.head.appendChild(script)
        
        const mjScript = document.createElement('script')
        mjScript.id = 'MathJax-script'
        mjScript.async = true
        mjScript.src = 'https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js'
        document.head.appendChild(mjScript)
      }
    },

    renderSolution() {
      if (this.$refs.solutionDiv && this.opened?.solution) {
        // Преобразуем решение в красивый HTML
        let html = this.opened.solution
        
        // Заменяем переносы строк на <br>
        html = html.replace(/\n/g, '<br>')
        
        // Преобразуем LaTeX формулы $$...$$
        html = html.replace(/\$\$(.*?)\$\$/g, '<div class="latex-block">$$1</div>')
        
        // Преобразуем inline LaTeX $...$
        html = html.replace(/\$(.*?)\$/g, '<span class="latex-inline">$1</span>')
        
        // Оборачиваем выражения в скобках в code tags
        html = html.replace(/\(([^)]+)\)/g, '<code>($1)</code>')
        
        this.$refs.solutionDiv.innerHTML = html
        
        // Рендерим MathJax если доступен
        if (window.MathJax) {
          window.MathJax.typesetPromise([this.$refs.solutionDiv]).catch(err => console.log(err))
        }
      }
    },

    checkAuthorization() {
      const tg_user = window.Telegram?.WebApp?.initDataUnsafe?.user
      if (tg_user?.id) {
        this.isAuthorized = true
        this.currentUser = { id: tg_user.id, type: 'tg' }
        return
      }

      const storedUserId = localStorage.getItem('email')
      if (storedUserId) {
        this.isAuthorized = true
        this.currentUser = { id: storedUserId, type: 'email' }
        return
      }

      this.isAuthorized = false
      this.currentUser = null
    },

    async selectSubject(subject) {
      this.selectedSubject = subject
      store.setSubject(subject)
      this.selectedCategory = null
      this.categoryProblems = []
      this.searchedProblems = []
      this.searchError = ''
      this.errorMessage = ''
      
      try {
        this.categories = await api.getCategories(subject)
        if (this.categories.length === 0) {
          this.errorMessage = `Нет категорий`
        }
      } catch (e) {
        this.errorMessage = `Ошибка загрузки: ${e.message}`
      }
    },

    async selectCategory(category) {
      this.selectedCategory = category
      this.errorMessage = ''
      this.searchedProblems = []
      this.searchError = ''
      
      try {
        const problems = await api.getProblems(this.selectedSubject, null, category.id)
        this.categoryProblems = problems.map(p => ({ ...p, solved: this.solvedProblems.has(p.id) }))
        
        if (this.categoryProblems.length === 0) {
          this.errorMessage = 'Нет задач в этой категории'
        }
      } catch (e) {
        this.errorMessage = `Ошибка: ${e.message}`
      }
    },

    async loadSolvedProblems() {
      try {
        if (!this.currentUser) return
        const stats = await api.getStats(this.currentUser.id)
        if (stats && stats.solved_problems) {
          this.solvedProblems = new Set(stats.solved_problems)
        }
      } catch (e) {
        console.error('Ошибка:', e)
        this.solvedProblems = new Set()
      }
    },

    async searchProblemById() {
      this.searchError = ''
      this.searchedProblems = []
      
      if (!this.searchId) {
        this.searchError = 'Введите ID'
        return
      }

      if (!this.selectedSubject) {
        this.searchError = 'Выберите предмет'
        return
      }

      try {
        this.submitting = true
        const allProblems = await api.getProblems(this.selectedSubject)
        const foundProblem = allProblems.find(p => p.id === parseInt(this.searchId))
        
        if (!foundProblem) {
          this.searchError = `Задача с ID ${this.searchId} не найдена`
          return
        }

        this.selectedCategory = null
        this.searchedProblems = [{ ...foundProblem, solved: this.solvedProblems.has(foundProblem.id) }]
        this.searchId = null
      } catch (e) {
        this.searchError = `Ошибка: ${e.message}`
      } finally {
        this.submitting = false
      }
    },

    openProblem(p) {
      this.opened = { ...p }
      this.result = null
    },

    closeProblem() {
      this.opened = null
      this.result = null
    },

    getDifficultyLabel(difficulty) {
      const labels = { 'easy': 'Лёгкая', 'medium': 'Средняя', 'hard': 'Сложная' }
      return labels[difficulty] || difficulty
    }
  }
}
</script>

<style scoped>
.page {
  padding: 16px;
  max-width: 1400px;
  margin: 0 auto;
}

.card {
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 20px;
  backdrop-filter: blur(20px);
}

h2 {
  background: var(--gradient-primary);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  font-size: 24px;
  margin: 0;
}

h3, h4 {
  color: var(--text-primary);
  margin: 0;
}

.muted {
  color: var(--text-muted);
  font-size: 14px;
}

.button {
  background: var(--gradient-primary);
  color: #000;
  border: none;
  padding: 12px 20px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 255, 136, 0.3);
}

.button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.container-adaptive {
  display: grid;
  grid-template-columns: 1fr 1.5fr;
  gap: 20px;
  min-height: 400px;
}

.selection-panel {
  height: fit-content;
  position: sticky;
  top: 100px;
}

.header-with-search {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 8px;
  align-items: center;
}

.search-box-header {
  display: flex;
  gap: 8px;
  flex: 1;
  min-width: 200px;
}

.search-input-header {
  flex: 1;
  background: var(--bg-tertiary);
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 8px 12px;
  color: var(--text-primary);
  font-size: 14px;
}

.search-input-header:focus {
  outline: none;
  border-color: var(--accent);
}

.button-search-header {
  background: var(--accent);
  color: #000;
  border: none;
  padding: 8px 12px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: 600;
  flex-shrink: 0;
}

.button-search-header:hover:not(:disabled) {
  transform: translateY(-2px);
}

.button-search-header:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.selection-step {
  margin-bottom: 24px;
}

.step-label {
  font-size: 14px;
  font-weight: 600;
  color: var(--accent);
  margin-bottom: 12px;
  text-transform: uppercase;
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
  font-weight: 600;
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

.card-header {
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--border);
}

.card-header h3 {
  margin-bottom: 4px;
}

.card-header.empty-state {
  text-align: center;
  padding: 40px 20px;
  border-bottom: none;
}

.problems-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.problem-item {
  background: var(--bg-tertiary);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 12px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  transition: all 0.3s ease;
}

.problem-item:hover:not(.solved) {
  border-color: var(--accent);
  transform: translateX(4px);
}

.problem-item.solved {
  opacity: 0.6;
}

.problem-content {
  flex: 1;
}

.problem-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.problem-id {
  background: var(--accent-transparent);
  color: var(--accent);
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
}

.problem-header h4 {
  font-size: 14px;
}

.solved-badge {
  background: rgba(0, 255, 136, 0.2);
  color: var(--accent);
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 12px;
}

.problem-meta {
  display: flex;
  gap: 8px;
  font-size: 12px;
}

.difficulty-badge {
  padding: 2px 8px;
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

.points-badge {
  background: rgba(100, 100, 255, 0.1);
  color: #6464ff;
  padding: 2px 8px;
  border-radius: 6px;
  font-weight: 600;
}

.problem-actions {
  display: flex;
}

.button-solve {
  background: transparent;
  border: 2px solid var(--accent);
  color: var(--accent);
  padding: 8px 16px;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;
  flex-shrink: 0;
}

.button-solve:hover:not(:disabled) {
  background: var(--accent);
  color: #000;
}

.button-solve:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.empty-problems {
  text-align: center;
  padding: 40px 20px;
  color: var(--text-muted);
}

.error-message {
  background: rgba(255, 68, 68, 0.1);
  border: 1px solid rgba(255, 68, 68, 0.3);
  color: #ff4444;
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 14px;
  margin-top: 16px;
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
  overflow-y: auto;
}

.modal {
  max-width: 800px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  margin: auto 0;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--border);
}

.modal-header h3 {
  margin-bottom: 4px;
}

.close-btn {
  background: transparent;
  border: none;
  color: var(--text-muted);
  font-size: 24px;
  cursor: pointer;
  padding: 0;
  width: 32px;
  height: 32px;
  flex-shrink: 0;
}

.close-btn:hover {
  color: var(--text-primary);
}

.modal-body {
  margin-bottom: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.image-section {
  background: var(--bg-tertiary);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 16px;
}

.image-section h4 {
  margin-top: 0;
  margin-bottom: 12px;
}

.problem-image, .solution-image {
  width: 100%;
  height: auto;
  max-height: 400px;
  border-radius: 6px;
  object-fit: contain;
  border: 1px solid var(--border);
}

.solution-section, .answer-section {
  background: var(--bg-tertiary);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 16px;
}

.solution-section h4, .answer-section h4 {
  margin-top: 0;
  margin-bottom: 12px;
}

.solution-content {
  color: var(--text-primary);
  line-height: 1.8;
  font-size: 14px;
}

.solution-content code {
  background: var(--bg-primary);
  padding: 2px 6px;
  border-radius: 4px;
  color: var(--accent);
  font-family: monospace;
}

.solution-content br {
  margin: 8px 0;
  display: block;
}

.solution-content .latex-block {
  display: block;
  margin: 12px 0;
  padding: 12px;
  background: var(--bg-secondary);
  border-left: 3px solid var(--accent);
  border-radius: 4px;
  overflow-x: auto;
}

.solution-content .latex-inline {
  font-family: monospace;
  background: var(--bg-secondary);
  padding: 2px 4px;
  border-radius: 3px;
  color: var(--accent);
}

.empty-solution {
  color: var(--text-muted);
  font-style: italic;
}

.answer-display {
  background: var(--bg-secondary);
  border: 2px solid var(--accent);
  border-radius: 6px;
  padding: 16px;
  color: var(--accent);
  font-weight: 600;
  font-size: 18px;
  text-align: center;
  word-break: break-all;
}

.result-box {
  padding: 16px;
  border-radius: 8px;
  font-weight: 600;
  text-align: center;
}

.result-box.success {
  background: rgba(0, 255, 136, 0.1);
  border: 1px solid rgba(0, 255, 136, 0.3);
  color: var(--accent);
}

.result-box.error {
  background: rgba(255, 68, 68, 0.1);
  border: 1px solid rgba(255, 68, 68, 0.3);
  color: #ff4444;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  padding-top: 16px;
  border-top: 1px solid var(--border);
}

@media (max-width: 1024px) {
  .container-adaptive {
    grid-template-columns: 1fr;
  }
  .selection-panel {
    position: static;
  }
}

@media (max-width: 768px) {
  .page {
    padding: 12px;
  }
  .card {
    padding: 16px;
  }
  .problem-item {
    flex-direction: column;
    align-items: flex-start;
  }
  .modal {
    max-width: 95vw;
  }
  .header-with-search {
    flex-direction: column;
  }
  .search-box-header {
    width: 100%;
  }
}

@media (max-width: 480px) {
  .page {
    padding: 8px;
  }
  .card {
    padding: 12px;
  }
  h2 {
    font-size: 18px;
  }
  .problem-image, .solution-image {
    max-height: 250px;
  }
}
</style>
