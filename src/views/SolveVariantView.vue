<template>
  <div class="page">
    <!-- ЗАГОЛОВОК И ИНФО -->
    <div class="header-section">
      <div class="header-content">
        <h1>Вариант #{{ variantId }}</h1>
        <div class="variant-info">
          <span class="info-item">
            <span class="label">Всего задач:</span>
            <span class="value">{{ problems.length }}</span>
          </span>
          <span class="info-item">
            <span class="label">Решено:</span>
            <span class="value">{{ solvedCount }}/{{ problems.length }}</span>
          </span>
          <span v-if="completed" class="info-item status-completed">
            ✓ Вариант завершён
          </span>
        </div>
      </div>
      
      <div class="header-actions">
        <router-link to="/create-variant" class="button-back">← Назад</router-link>
        <button 
          v-if="!completed && problems.length > 0"
          @click="finishVariant"
          class="button-finish"
          :disabled="finishing"
        >
          {{ finishing ? '⏳...' : '✓ Завершить' }}
        </button>
      </div>
    </div>

    <!-- КОНТЕНТ -->
    <div v-if="loading" class="loading-state">
      ⏳ Загрузка варианта...
    </div>

    <div v-else-if="error" class="error-state">
      <div class="error-icon">⚠️</div>
      <div class="error-text">{{ error }}</div>
      <router-link to="/create-variant" class="button">← Создать новый вариант</router-link>
    </div>

    <div v-else class="problems-container">
      <!-- РЕШЕНИЕ ЗАДАЧ -->
      <div v-if="!completed" class="solve-section">
        <div 
          v-for="(problem, index) in problems"
          :key="problem.id"
          class="problem-card"
          :class="{ answered: answers[problem.id] !== undefined && answers[problem.id] !== '' }"
        >
          <div class="problem-header">
            <div class="problem-number">Задача {{ index + 1 }}</div>
            <div class="problem-meta">
              <span class="problem-id">ID: {{ problem.id }}</span>
              <span class="difficulty-badge" :class="problem.difficulty">
                {{ getDifficultyLabel(problem.difficulty) }}
              </span>
            </div>
            <div v-if="answers[problem.id] !== undefined && answers[problem.id] !== ''" class="answered-badge">
              ✓ Ответ записан
            </div>
            <div v-else class="not-answered-badge">
              ✗ Ответ не записан
            </div>
          </div>

          <!-- ИЗОБРАЖЕНИЕ ЗАДАЧИ -->
          <div v-if="problem.problem_image" class="image-section">
            <img 
              :src="`data:${problem.problem_image_type};base64,${problem.problem_image}`"
              class="problem-image"
              alt="Problem"
            />
          </div>

          <div class="problem-title">{{ problem.title }}</div>

          <!-- ПОЛЕ ОТВЕТА -->
          <div class="answer-section">
            <input 
              v-model="answers[problem.id]"
              type="text"
              placeholder="Введите ответ..."
              class="answer-input"
              @keyup.enter="focusNext(index)"
            />
            <button 
              @click="focusNext(index)"
              class="button-next"
            >
              → Дальше
            </button>
          </div>

          <div class="problem-divider"></div>
        </div>
      </div>

      <!-- РЕЗУЛЬТАТЫ -->
      <div v-else class="results-section">
        <div class="results-header">
          <h2>Результаты варианта</h2>
          <div class="results-summary">
            <div class="summary-item">
              <div class="summary-label">Правильно:</div>
              <div class="summary-value correct">{{ correctCount }}</div>
            </div>
            <div class="summary-item">
              <div class="summary-label">Неправильно:</div>
              <div class="summary-value incorrect">{{ incorrectCount }}</div>
            </div>
            <div class="summary-item">
              <div class="summary-label">Процент:</div>
              <div class="summary-value">{{ Math.round((correctCount / problems.length) * 100) }}%</div>
            </div>
          </div>
        </div>

        <div class="results-list">
          <div 
            v-for="(problem, index) in problems"
            :key="problem.id"
            class="result-card"
            :class="{ correct: results[problem.id]?.correct, incorrect: !results[problem.id]?.correct }"
          >
            <div class="result-header">
              <div class="result-number">{{ index + 1 }}. {{ problem.title }}</div>
              <div v-if="results[problem.id]?.correct" class="result-badge success">
                ✓ Правильно
              </div>
              <div v-else class="result-badge error">
                ✗ Неправильно
              </div>
            </div>

            <div class="result-details">
              <div class="detail-section">
                <div class="detail-label">Ваш ответ:</div>
                <div class="detail-value">
                  {{ answers[problem.id] && answers[problem.id].trim() !== '' ? answers[problem.id] : 'Ответ не записан' }}
                </div>
              </div>
              <div class="detail-section">
                <div class="detail-label">Правильный ответ:</div>
                <div class="detail-value correct-answer">{{ problem.correct_answer }}</div>
              </div>
            </div>

            <button 
              @click="viewSolution(problem)"
              class="button-view-solution"
            >
              💡 Посмотреть решение
            </button>
          </div>
        </div>

        <div class="results-actions">
          <router-link to="/create-variant" class="button-new-variant">
            ✨ Создать новый вариант
          </router-link>
        </div>
      </div>
    </div>

    <!-- МОДАЛЬНОЕ ОКНО С РЕШЕНИЕМ -->
    <div v-if="selectedProblem" class="modal-backdrop" @click.self="selectedProblem = null">
      <div class="modal card">
        <div class="modal-header">
          <h3 style="margin: 0;">{{ selectedProblem.title }}</h3>
          <button @click="selectedProblem = null" class="close-btn">✕</button>
        </div>

        <div class="modal-body">
          <div v-if="selectedProblem.problem_image" class="image-section">
            <h4>Условие:</h4>
            <img 
              :src="`data:${selectedProblem.problem_image_type};base64,${selectedProblem.problem_image}`"
              class="modal-image"
              alt="Problem"
            />
          </div>

          <div class="solution-section">
            <h4>Решение:</h4>
            <div v-if="selectedProblem.solution" class="solution-content">
              <div ref="solutionDiv"></div>
            </div>
            <div v-else class="empty-solution">Решение не добавлено</div>
          </div>

          <div v-if="selectedProblem.solution_image" class="image-section">
            <h4>Иллюстрация:</h4>
            <img 
              :src="`data:${selectedProblem.solution_image_type};base64,${selectedProblem.solution_image}`"
              class="modal-image"
              alt="Solution"
            />
          </div>

          <div class="answer-section">
            <h4>Правильный ответ:</h4>
            <div class="answer-display">{{ selectedProblem.correct_answer }}</div>
          </div>
        </div>

        <div class="modal-footer">
          <button @click="selectedProblem = null" class="button">Закрыть</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { api } from '../api'

export default {
  name: 'SolveVariantView',
  data() {
    return {
      variantId: null,
      problems: [],
      answers: {},
      results: {},
      completed: false,
      loading: true,
      finishing: false,
      error: '',
      selectedProblem: null,
      solvedCount: 0,
      correctCount: 0,
      incorrectCount: 0
    }
  },
  async mounted() {
    this.variantId = this.$route.params.variantId
    await this.loadVariant()
    this.loadMathJax()
  },
  watch: {
    selectedProblem() {
      if (this.selectedProblem) {
        this.$nextTick(() => {
          this.renderSolution()
        })
      }
    },
    answers: {
      handler() {
        this.solvedCount = Object.values(this.answers).filter(a => a !== undefined && a !== '' && a.trim() !== '').length
      },
      deep: true
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
      if (this.$refs.solutionDiv && this.selectedProblem?.solution) {
        let html = this.selectedProblem.solution
        html = html.replace(/\n/g, '<br>')
        html = html.replace(/\$\$(.*?)\$\$/g, '<div class="latex-block">$$1</div>')
        html = html.replace(/\$(.*?)\$/g, '<span class="latex-inline">$1</span>')
        
        this.$refs.solutionDiv.innerHTML = html
        
        if (window.MathJax) {
          window.MathJax.typesetPromise([this.$refs.solutionDiv]).catch(err => console.log(err))
        }
      }
    },

    async loadVariant() {
      try {
        this.loading = true
        const variant = await api.getVariant(this.variantId)
        
        this.problems = variant.problems || []
        this.problems.forEach(p => {
          this.answers[p.id] = ''
        })
        
        if (variant.completed) {
          this.completed = true
          await this.loadResults()
        }
      } catch (e) {
        this.error = `Ошибка загрузки варианта: ${e.message}`
      } finally {
        this.loading = false
      }
    },

    async loadResults() {
      try {
        const resultsData = await api.getVariantResults(this.variantId)
        
        this.results = resultsData.results || {}
        this.correctCount = resultsData.correct_count || 0
        this.incorrectCount = resultsData.incorrect_count || 0
      } catch (e) {
        console.error('Ошибка загрузки результатов:', e)
      }
    },

    focusNext(currentIndex) {
      const nextIndex = currentIndex + 1
      if (nextIndex < this.problems.length) {
        setTimeout(() => {
          document.querySelectorAll('.answer-input')[nextIndex]?.focus()
        }, 100)
      }
    },

    async finishVariant() {
      this.finishing = true
      
      try {
        // Отправляем все ответы
        for (const problem of this.problems) {
          const userAnswer = this.answers[problem.id] || ''
          await api.submitVariantAnswer(
            this.variantId,
            problem.id,
            userAnswer
          )
        }
        
        // Завершаем вариант
        await api.completeVariant(this.variantId)
        
        this.completed = true
        await this.loadResults()
      } catch (e) {
        this.error = `Ошибка завершения варианта: ${e.message}`
      } finally {
        this.finishing = false
      }
    },

    viewSolution(problem) {
      this.selectedProblem = { ...problem }
    },

    getDifficultyLabel(difficulty) {
      const labels = {
        'easy': 'Лёгкая',
        'medium': 'Средняя',
        'hard': 'Сложная'
      }
      return labels[difficulty] || difficulty
    }
  }
}
</script>

<style scoped>
.page {
  padding: 16px;
  max-width: 1200px;
  margin: 0 auto;
}

.header-section {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
  gap: 16px;
}

.header-content {
  flex: 1;
}

h1 {
  background: var(--gradient-primary);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin: 0 0 12px 0;
  font-size: 28px;
}

.variant-info {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  background: var(--bg-secondary);
  border-radius: 6px;
  border: 1px solid var(--border);
}

.info-item .label {
  color: var(--text-muted);
  font-size: 12px;
}

.info-item .value {
  color: var(--text-primary);
  font-weight: 600;
}

.status-completed {
  background: rgba(0, 255, 136, 0.1);
  border-color: rgba(0, 255, 136, 0.3);
  color: var(--accent);
}

.header-actions {
  display: flex;
  gap: 8px;
}

.button-back, .button-finish, .button-new-variant {
  padding: 10px 16px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 13px;
  text-decoration: none;
  transition: all 0.3s ease;
  cursor: pointer;
  border: none;
  white-space: nowrap;
}

.button-back {
  background: var(--bg-secondary);
  color: var(--text-primary);
  border: 1px solid var(--border);
}

.button-back:hover {
  border-color: var(--accent);
}

.button-finish, .button-new-variant {
  background: var(--gradient-primary);
  color: #000;
}

.button-finish:hover:not(:disabled), .button-new-variant:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 255, 136, 0.3);
}

.button-finish:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.loading-state, .error-state {
  text-align: center;
  padding: 60px 20px;
  color: var(--text-muted);
}

.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.error-icon {
  font-size: 48px;
}

.error-text {
  color: #ff4444;
  font-size: 16px;
  max-width: 400px;
}

.problems-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.solve-section {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.problem-card {
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 20px;
  transition: all 0.3s ease;
}

.problem-card.answered {
  border-color: var(--accent);
  background: rgba(0, 255, 136, 0.02);
}

.problem-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
  gap: 12px;
}

.problem-number {
  font-weight: 600;
  color: var(--text-primary);
  font-size: 14px;
}

.problem-meta {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.problem-id {
  background: var(--accent-transparent);
  color: var(--accent);
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
}

.difficulty-badge {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
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

.answered-badge {
  background: rgba(0, 255, 136, 0.2);
  color: var(--accent);
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
}

.not-answered-badge {
  background: rgba(255, 68, 68, 0.2);
  color: #ff4444;
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
}

.image-section {
  margin-bottom: 16px;
}

.image-section h4 {
  margin: 0 0 12px 0;
  color: var(--text-muted);
  font-size: 12px;
  text-transform: uppercase;
}

.problem-image, .modal-image {
  width: 100%;
  max-height: 400px;
  border-radius: 8px;
  object-fit: contain;
  border: 1px solid var(--border);
}

.problem-title {
  color: var(--text-primary);
  margin-bottom: 16px;
  font-size: 14px;
  line-height: 1.6;
}

.answer-section {
  display: flex;
  gap: 8px;
  margin-bottom: 0;
}

.answer-input {
  flex: 1;
  background: var(--bg-tertiary);
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 10px 12px;
  color: var(--text-primary);
  font-size: 14px;
  font-weight: 500;
}

.answer-input:focus {
  outline: none;
  border-color: var(--accent);
}

.button-next {
  background: var(--accent);
  color: #000;
  border: none;
  padding: 10px 16px;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 12px;
}

.button-next:hover {
  transform: translateY(-2px);
}

.problem-divider {
  height: 1px;
  background: var(--border);
  margin-top: 20px;
}

.problem-card:last-child .problem-divider {
  display: none;
}

.results-section {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.results-header {
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 20px;
}

.results-header h2 {
  margin: 0 0 16px 0;
  color: var(--text-primary);
}

.results-summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 12px;
}

.summary-item {
  background: var(--bg-tertiary);
  border-radius: 6px;
  padding: 12px;
  text-align: center;
}

.summary-label {
  font-size: 12px;
  color: var(--text-muted);
  margin-bottom: 6px;
}

.summary-value {
  font-size: 24px;
  font-weight: 700;
  color: var(--text-primary);
}

.summary-value.correct {
  color: var(--accent);
}

.summary-value.incorrect {
  color: #ff4444;
}

.results-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.result-card {
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 16px;
  transition: all 0.3s ease;
}

.result-card.correct {
  border-left: 4px solid var(--accent);
}

.result-card.incorrect {
  border-left: 4px solid #ff4444;
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
  gap: 12px;
}

.result-number {
  color: var(--text-primary);
  font-weight: 600;
  font-size: 14px;
}

.result-badge {
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
}

.result-badge.success {
  background: rgba(0, 255, 136, 0.2);
  color: var(--accent);
}

.result-badge.error {
  background: rgba(255, 68, 68, 0.2);
  color: #ff4444;
}

.result-details {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 12px;
  padding: 12px;
  background: var(--bg-tertiary);
  border-radius: 6px;
}

.detail-section {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.detail-label {
  font-size: 12px;
  color: var(--text-muted);
  font-weight: 600;
}

.detail-value {
  font-size: 14px;
  color: var(--text-primary);
  word-break: break-all;
}

.detail-value:has(+ .correct-answer) {
  color: var(--text-muted);
  font-style: italic;
}

.correct-answer {
  color: var(--accent);
  font-weight: 600;
}

.button-view-solution {
  background: transparent;
  border: 1px solid var(--border);
  color: var(--text-primary);
  padding: 8px 12px;
  border-radius: 6px;
  font-weight: 600;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.button-view-solution:hover {
  border-color: var(--accent);
  color: var(--accent);
}

.results-actions {
  text-align: center;
  padding: 20px;
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
  max-width: 600px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  margin: auto 0;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--border);
}

.modal-header h3 {
  margin: 0;
  color: var(--text-primary);
}

.close-btn {
  background: transparent;
  border: none;
  color: var(--text-muted);
  font-size: 24px;
  cursor: pointer;
  padding: 0;
}

.close-btn:hover {
  color: var(--text-primary);
}

.modal-body {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 16px;
}

.solution-section {
  background: var(--bg-tertiary);
  border-radius: 8px;
  padding: 12px;
}

.solution-section h4 {
  margin: 0 0 8px 0;
  color: var(--text-muted);
  font-size: 12px;
}

.solution-content {
  color: var(--text-primary);
  font-size: 13px;
  line-height: 1.8;
}

.empty-solution {
  color: var(--text-muted);
  font-style: italic;
}

.answer-display {
  background: var(--bg-secondary);
  border: 2px solid var(--accent);
  border-radius: 6px;
  padding: 12px;
  color: var(--accent);
  font-weight: 600;
  text-align: center;
  word-break: break-all;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  padding-top: 12px;
  border-top: 1px solid var(--border);
}

.button {
  background: var(--gradient-primary);
  color: #000;
  border: none;
  padding: 10px 16px;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 13px;
}

.button:hover {
  transform: translateY(-2px);
}

.card {
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 20px;
  backdrop-filter: blur(20px);
}

@media (max-width: 768px) {
  .page {
    padding: 12px;
  }

  .header-section {
    flex-direction: column;
  }

  .problem-card {
    padding: 16px;
  }

  .variant-info {
    flex-direction: column;
    gap: 8px;
  }

  h1 {
    font-size: 22px;
  }

  .problem-header {
    flex-direction: column;
  }

  .problem-meta {
    justify-content: flex-start;
  }

  .answer-section {
    flex-direction: column;
  }

  .button-next {
    width: 100%;
  }

  .result-details {
    flex-direction: row;
    align-items: center;
    gap: 12px;
  }

  .detail-section {
    flex: 1;
  }

  .detail-label {
    display: none;
  }
}

@media (max-width: 480px) {
  .page {
    padding: 8px;
  }

  .modal {
    max-width: 95vw;
  }

  .result-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .result-number {
    word-break: break-word;
  }
}
</style>
