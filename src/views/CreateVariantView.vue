<template>
  <div class="page">
    <div class="container">
      <!-- ЛЕВАЯ ПАНЕЛЬ - ВЫБОР КАТЕГОРИЙ -->
      <div class="selection-panel">
        <div class="card">
          <h2 style="margin: 0 0 20px 0;">Создать вариант</h2>
          
          <!-- Выбор категорий и сложности -->
          <div v-if="categories.length > 0" class="categories-config">
            <div class="step-label">Выберите задачи</div>
            
            <div class="categories-list">
              <div 
                v-for="cat in categories"
                :key="cat.id"
                class="category-config"
              >
                <!-- Название категории + количество справа -->
                <div class="category-header">
                  <div class="category-title">{{ cat.name }}</div>
                  <div class="count-input-wrapper">
                    <button @click="decrementRandom(cat.id)" class="btn-count-header">−</button>
                    <input 
                      v-model.number="variantConfig[cat.id].random_count"
                      type="number"
                      min="0"
                      max="50"
                      class="input-count-header"
                      @change="variantConfig[cat.id].random_count = Math.max(0, variantConfig[cat.id].random_count)"
                    />
                    <button @click="incrementRandom(cat.id)" class="btn-count-header">+</button>
                  </div>
                </div>

                <!-- Кнопка выбора сложности под названием -->
                <div class="difficulty-selector">
                  <button 
                    @click="openDropdown === cat.id ? openDropdown = null : openDropdown = cat.id"
                    class="dropdown-btn"
                    :class="{ open: openDropdown === cat.id }"
                  >
                    <span>⚙️ Выбрать сложность</span>
                    <svg class="chevron" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <polyline points="6 9 12 15 18 9"/>
                    </svg>
                  </button>

                  <!-- Выпадающий список со сложностями -->
                  <div v-show="openDropdown === cat.id" class="dropdown-menu">
                    <!-- Лёгкие -->
                    <div class="dropdown-item">
                      <label class="checkbox-item">
                        <input 
                          type="checkbox"
                          :checked="variantConfig[cat.id].easy"
                          @change="variantConfig[cat.id].easy = !variantConfig[cat.id].easy"
                          class="checkbox-input"
                        />
                        <span class="difficulty-label">📗 Лёгкие</span>
                      </label>
                    </div>

                    <!-- Средние -->
                    <div class="dropdown-item">
                      <label class="checkbox-item">
                        <input 
                          type="checkbox"
                          :checked="variantConfig[cat.id].medium"
                          @change="variantConfig[cat.id].medium = !variantConfig[cat.id].medium"
                          class="checkbox-input"
                        />
                        <span class="difficulty-label">📙 Средние</span>
                      </label>
                    </div>

                    <!-- Сложные -->
                    <div class="dropdown-item">
                      <label class="checkbox-item">
                        <input 
                          type="checkbox"
                          :checked="variantConfig[cat.id].hard"
                          @change="variantConfig[cat.id].hard = !variantConfig[cat.id].hard"
                          class="checkbox-input"
                        />
                        <span class="difficulty-label">📕 Сложные</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div v-else class="loading">
            ⏳ Загрузка категорий...
          </div>
        </div>
      </div>

      <!-- ПРАВАЯ ПАНЕЛЬ - ПРЕВЬЮ И КНОПКА -->
      <div class="preview-panel">
        <div class="card">
          <h3 style="margin: 0 0 16px 0;">Предпросмотр варианта</h3>
          
          <div class="preview-content">
            <div class="preview-stat">
              <span class="stat-label">Предмет:</span>
              <span class="stat-value">{{ getSubjectLabel(store.selectedSubject) }}</span>
            </div>
            
            <div class="preview-stat">
              <span class="stat-label">Всего задач:</span>
              <span class="stat-value">{{ getTotalProblems() }}</span>
            </div>

            <div v-if="getTotalProblems() > 0" class="categories-preview">
              <div class="preview-stat" style="margin-bottom: 12px;">
                <span class="stat-label">Распределение по категориям:</span>
              </div>
              
              <div 
                v-for="cat in categories"
                :key="cat.id"
                class="category-preview-item"
                v-show="variantConfig[cat.id].random_count > 0"
              >
                <div class="cat-name">{{ cat.name }}</div>
                <div class="cat-distribution">
                  <span class="random-badge">
                    🎲: {{ variantConfig[cat.id].random_count }}
                  </span>
                  <span class="difficulties-info">
                    <span v-if="variantConfig[cat.id].easy" class="easy-square" title="Лёгкие"></span>
                    <span v-if="variantConfig[cat.id].medium" class="medium-square" title="Средние"></span>
                    <span v-if="variantConfig[cat.id].hard" class="hard-square" title="Сложные"></span>
                  </span>
                </div>
              </div>
            </div>

            <div v-else class="empty-preview">
              Выберите задачи для варианта
            </div>
          </div>

          <button 
            @click="createVariant"
            :disabled="getTotalProblems() === 0 || creating"
            class="button-create"
          >
            {{ creating ? '⏳ Формирую вариант...' : '✨ Сформировать вариант' }}
          </button>

          <div v-if="error" class="error-message">
            ⚠️ {{ error }}
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
  name: 'CreateVariantView',
  data() {
    return {
      store,
      categories: [],
      variantConfig: {},
      creating: false,
      error: '',
      openDropdown: null
    }
  },
  async mounted() {
    await this.loadCategories()
  },
  beforeUnmount() {
    // Cleanup if needed
  },
  watch: {
    'store.selectedSubject'(newSubject) {
      this.loadCategories()
    }
  },
  methods: {
    async loadCategories() {
      this.error = ''
      
      try {
        this.categories = await api.getCategories(this.store.selectedSubject)
        this.initializeConfig()
      } catch (e) {
        this.error = `Ошибка загрузки категорий: ${e.message}`
      }
    },
    
    initializeConfig() {
      this.variantConfig = {}
      this.categories.forEach(cat => {
        this.variantConfig[cat.id] = {
          category_id: cat.id,
          random_count: 0,
          easy: true,
          medium: true,
          hard: true
        }
      })
    },
    
    incrementRandom(catId) {
      this.variantConfig[catId].random_count++
    },

    decrementRandom(catId) {
      if (this.variantConfig[catId].random_count > 0) {
        this.variantConfig[catId].random_count--
      }
    },
    
    getTotalProblems() {
      let total = 0
      for (const catId in this.variantConfig) {
        total += this.variantConfig[catId].random_count
      }
      return total
    },
    
    getSubjectLabel(subject) {
      const labels = {
        'math': '📐 Математика',
        'informatics': '💻 Информатика'
      }
      return labels[subject] || subject
    },
    
    async createVariant() {
      if (this.getTotalProblems() === 0) {
        this.error = 'Выберите хотя бы одну задачу'
        return
      }
      
      this.creating = true
      this.error = ''
      
      try {
        const config = Object.values(this.variantConfig).filter(
          c => c.random_count > 0
        ).map(c => ({
          category_id: c.category_id,
          count: c.random_count,
          difficulties: {
            easy: c.easy,
            medium: c.medium,
            hard: c.hard
          }
        }))
        
        const result = await api.createVariant(this.store.selectedSubject, config)
        
        this.$router.push(`/variant/${result.variant_id}`)
      } catch (e) {
        this.error = `Ошибка создания варианта: ${e.message}`
      } finally {
        this.creating = false
      }
    }
  }
}
</script>

<style scoped>
* {
  box-sizing: border-box;
}

.page {
  padding: 16px;
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
}

.card {
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 20px;
  backdrop-filter: blur(20px);
}

h2, h3 {
  color: var(--text-primary);
  background: var(--gradient-primary);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  width: 100%;
}

.selection-panel, .preview-panel {
  height: fit-content;
  width: 100%;
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
  gap: 16px;
  margin-bottom: 20px;
}

.category-config {
  background: var(--bg-tertiary);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 12px;
}

.category-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  gap: 12px;
}

.category-title {
  font-weight: 600;
  color: var(--text-primary);
  font-size: 14px;
  flex: 1;
}

.count-input-wrapper {
  display: flex;
  align-items: center;
  gap: 4px;
  background: var(--accent-transparent);
  border: 1px solid var(--accent);
  border-radius: 6px;
  padding: 4px;
  flex-shrink: 0;
}

.btn-count-header {
  background: var(--accent);
  color: #000;
  border: none;
  width: 28px;
  height: 28px;
  border-radius: 4px;
  font-weight: 700;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.btn-count-header:hover {
  transform: scale(1.1);
}

.btn-count-header:active {
  transform: scale(0.95);
}

.input-count-header {
  width: 50px;
  background: transparent;
  border: none;
  padding: 4px 6px;
  color: var(--text-primary);
  text-align: center;
  font-weight: 600;
  font-size: 14px;
}

.input-count-header:focus {
  outline: none;
}

/* Убираем стрелочки в input number */
.input-count-header::-webkit-outer-spin-button,
.input-count-header::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.input-count-header[type=number] {
  -moz-appearance: textfield;
}

.difficulty-selector {
  position: relative;
  width: 100%;
}

.dropdown-btn {
  width: 100%;
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 8px 12px;
  color: var(--text-primary);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  transition: all 0.3s ease;
}

.dropdown-btn:hover {
  border-color: var(--accent);
  color: var(--accent);
}

.dropdown-btn.open {
  background: var(--accent-transparent);
  border-color: var(--accent);
  color: var(--accent);
}

.chevron {
  transition: transform 0.3s ease;
  flex-shrink: 0;
}

.dropdown-btn.open .chevron {
  transform: rotate(180deg);
}

.dropdown-menu {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: 6px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
  z-index: 1000;
  min-width: 100%;
}

.dropdown-item {
  padding: 10px 12px;
  border-bottom: 1px solid var(--border);
}

.dropdown-item:last-child {
  border-bottom: none;
}

.checkbox-input {
  cursor: pointer;
  margin-right: 8px;
  width: 16px;
  height: 16px;
  accent-color: var(--accent);
}

.difficulty-label {
  color: var(--text-primary);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  user-select: none;
}

.checkbox-item {
  display: flex;
  align-items: center;
  cursor: pointer;
}

.preview-content {
  background: var(--bg-tertiary);
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
}

.preview-stat {
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--border);
}

.stat-label {
  color: var(--text-muted);
  font-size: 13px;
}

.stat-value {
  color: var(--text-primary);
  font-weight: 600;
}

.categories-preview {
  margin-top: 12px;
}

.category-preview-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  font-size: 12px;
}

.cat-name {
  color: var(--text-primary);
  font-weight: 500;
}

.cat-distribution {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: flex-end;
  align-items: center;
}

.random-badge {
  background: rgba(100, 150, 255, 0.2);
  color: #6496ff;
  padding: 2px 8px;
  border-radius: 4px;
  font-weight: 600;
}

.difficulties-info {
  display: flex;
  gap: 4px;
}

.easy-square {
  width: 16px;
  height: 16px;
  background: var(--accent);
  border-radius: 3px;
  display: inline-block;
  flex-shrink: 0;
}

.medium-square {
  width: 16px;
  height: 16px;
  background: #ffc107;
  border-radius: 3px;
  display: inline-block;
  flex-shrink: 0;
}

.hard-square {
  width: 16px;
  height: 16px;
  background: #ff4444;
  border-radius: 3px;
  display: inline-block;
  flex-shrink: 0;
}

.empty-preview {
  color: var(--text-muted);
  font-style: italic;
  text-align: center;
  padding: 20px 0;
}

.button-create {
  width: 100%;
  background: var(--gradient-primary);
  color: #000;
  border: none;
  padding: 12px 20px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 14px;
}

.button-create:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 255, 136, 0.3);
}

.button-create:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.error-message {
  background: rgba(255, 68, 68, 0.1);
  border: 1px solid rgba(255, 68, 68, 0.3);
  color: #ff4444;
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 13px;
  margin-top: 12px;
}

.loading {
  text-align: center;
  color: var(--text-muted);
  padding: 40px 20px;
}

@media (max-width: 1024px) {
  .container {
    grid-template-columns: 1fr;
  }

  .preview-panel {
    order: -1;
  }
}

@media (max-width: 768px) {
  .page {
    padding: 12px;
  }

  .card {
    padding: 16px;
  }

  h2, h3 {
    font-size: 18px;
  }

  .category-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .count-input-wrapper {
    width: 100%;
    justify-content: center;
  }

  .difficulty-selector {
    width: 100%;
  }

  .dropdown-menu {
    position: fixed;
    top: auto;
    left: 12px;
    right: 12px;
    width: auto;
    max-width: calc(100% - 24px);
  }

  .container {
    display: flex;
    flex-direction: column;
    width: 100%;
  }

  .selection-panel,
  .preview-panel {
    width: 100%;
  }

  .preview-panel {
    order: -1;
  }
}
</style>
