<template>
  <div class="header">
    <div class="header-container">
      <!-- ВЕРХНЯЯ СТРОКА: Поддержка слева, Предметы в центре, Корзина/Профиль справа -->
      <button @click="showSupportModal = true" class="support-btn">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          <circle cx="9" cy="10" r="1"/>
          <circle cx="12" cy="10" r="1"/>
          <circle cx="15" cy="10" r="1"/>
        </svg>
        <span class="support-text">Поддержка</span>
      </button>

      <div class="subject-selector">
        <button 
          @click="selectSubject('math')" 
          :class="{ active: store.selectedSubject === 'math' }"
          class="subject-btn"
        >
          📐 Математика
        </button>
        <button 
          @click="selectSubject('informatics')" 
          :class="{ active: store.selectedSubject === 'informatics' }"
          class="subject-btn"
        >
          💻 Информатика
        </button>
      </div>

      <div class="user-section" v-if="store.profile">
        <!-- КОРЗИНА ДЗ (только для наставников) -->
        <button 
          v-if="store.profile.is_mentor" 
          @click="openHomeworkCart" 
          class="cart-btn"
          title="Корзина ДЗ"
        >
          🛒
          <span v-if="store.homeworkCartCount > 0" class="cart-badge">
            {{ store.homeworkCartCount }}
          </span>
        </button>

        <!-- ИМЯ ПОЛЬЗОВАТЕЛЯ (только для учеников) -->
        <div v-else class="user-info">
          <div class="user-name">{{ store.profile.name }}</div>
        </div>
      </div>
      <div v-else class="user-section">
        <button @click="goToAuth" class="logout-btn">Вход</button>
      </div>
    </div>
  </div>

  <!-- МОДАЛЬНОЕ ОКНО ПОДДЕРЖКИ -->
  <div v-if="showSupportModal" class="modal-overlay" @click.self="showSupportModal = false">
    <div class="modal-content">
      <button class="modal-close" @click="showSupportModal = false">✕</button>
      <h2>📞 Служба поддержки</h2>
      <div class="support-info">
        <p class="support-description">
          Если у вас есть вопросы по использованию платформы, обнаружили баг или хотите внести предложение — свяжитесь с администратором.
        </p>
        <div class="contact-section">
          <h3>Контакты администратора:</h3>
          <a href="https://t.me/playex_admin" target="_blank" rel="noopener noreferrer" class="telegram-link">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.02-.14-.07-.2-.09-.06-.22-.04-.31-.02-.13.02-2.28 1.45-6.45 4.27-.61.41-1.16.61-1.66.6-.55-.01-1.6-.31-2.38-.57-.96-.3-1.72-.46-1.65-.97.04-.27.49-.55 1.35-.84 5.27-2.3 8.79-3.82 10.58-4.57 1.04-.46 2.41-.42 3.29.12z"/>
            </svg>
            <span>@playex_admin</span>
          </a>
          <p class="contact-note">Нажмите, чтобы открыть чат в Telegram</p>
        </div>
        <div class="support-features">
          <h3>Мы поможем вам с:</h3>
          <ul>
            <li>✓ Технические вопросы и ошибки</li>
            <li>✓ Предложения по улучшению</li>
            <li>✓ Добавление новых задач</li>
            <li>✓ Другие вопросы</li>
          </ul>
        </div>
      </div>
    </div>
  </div>

  <!-- МОДАЛЬНОЕ ОКНО КОРЗИНЫ ДЗ -->
  <div v-if="showCartModal" class="modal-overlay" @click.self="closeHomeworkCart">
    <div class="modal-content modal-large">
      <button class="modal-close" @click="closeHomeworkCart">✕</button>
      <h2>🛒 Корзина домашнего задания</h2>
      
      <div v-if="loadingCart" class="text-center muted" style="padding: 40px;">
        Загрузка...
      </div>
      
      <div v-else>
        <div v-if="cartItems.length === 0" class="text-center muted" style="padding: 40px;">
          Корзина пуста. Добавьте задачи или варианты.
        </div>
        
        <div v-else>
          <div class="cart-items">
            <div v-for="item in cartItems" :key="item.cart_id" class="cart-item">
              <div class="cart-item-info">
                <div class="cart-item-type">
                  {{ item.type === 'problem' ? '📝 Задача' : '📋 Вариант' }}
                </div>
                <div class="cart-item-title">{{ item.title }}</div>
                <div class="cart-item-meta">
                  {{ item.subject === 'math' ? 'Математика' : 'Информатика' }}
                  <span v-if="item.difficulty"> • {{ item.difficulty }}</span>
                </div>
              </div>
              <button @click="removeFromCart(item.cart_id)" class="cart-item-remove">
                ✕
              </button>
            </div>
          </div>
          
          <button @click="openStudentSelector" class="button" style="width: 100%; margin-top: 20px;">
            Отправить ученикам
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- МОДАЛЬНОЕ ОКНО ВЫБОРА УЧЕНИКОВ -->
  <div v-if="showStudentSelector" class="modal-overlay" @click.self="closeStudentSelector">
    <div class="modal-content">
      <button class="modal-close" @click="closeStudentSelector">✕</button>
      <h2>👥 Выберите учеников</h2>
      
      <div style="margin-bottom: 20px;">
        <label class="form-label">Название ДЗ:</label>
        <input v-model="homeworkTitle" type="text" class="form-input" placeholder="Домашнее задание" />
      </div>
      
      <div v-if="loadingStudents" class="text-center muted">
        Загрузка учеников...
      </div>
      
      <div v-else-if="students.length === 0" class="text-center muted">
        У вас пока нет учеников
      </div>
      
      <div v-else>
        <div class="student-list">
          <label v-for="student in students" :key="student.id" class="student-checkbox">
            <input 
              type="checkbox" 
              :value="student.id" 
              v-model="selectedStudents"
            />
            <span>{{ student.name }}</span>
          </label>
        </div>
        
        <button 
          @click="sendHomework" 
          class="button" 
          style="width: 100%; margin-top: 20px;"
          :disabled="selectedStudents.length === 0 || sendingHomework"
        >
          {{ sendingHomework ? 'Отправка...' : `Отправить (${selectedStudents.length})` }}
        </button>
        
        <div v-if="sendMessage" class="message" :class="{ error: sendError, success: !sendError }" style="margin-top: 12px;">
          {{ sendMessage }}
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { store } from '../store.js'
import { api } from '../api.js'

export default {
  name: 'Header',
  data() {
    return {
      store,
      showSupportModal: false,
      showCartModal: false,
      showStudentSelector: false,
      loadingCart: false,
      loadingStudents: false,
      cartItems: [],
      students: [],
      selectedStudents: [],
      homeworkTitle: 'Домашнее задание',
      sendingHomework: false,
      sendMessage: '',
      sendError: false
    }
  },
  mounted() {
    window.addEventListener('auth-changed', this.onAuthChanged)
    window.addEventListener('cart-updated', this.loadCart)
    this.loadCart()
  },
  beforeUnmount() {
    window.removeEventListener('auth-changed', this.onAuthChanged)
    window.removeEventListener('cart-updated', this.loadCart)
  },
  methods: {
    selectSubject(subject) {
      store.setSubject(subject)
    },
    goToAuth() {
      this.$router.push('/register')
    },
    onAuthChanged() {
      this.$forceUpdate()
      this.loadCart()
    },
    
    // === КОРЗИНА ДЗ ===
    async openHomeworkCart() {
      this.showCartModal = true
      await this.loadCart()
    },
    
    closeHomeworkCart() {
      this.showCartModal = false
    },
    
    async loadCart() {
      if (!store.profile || !store.profile.is_mentor) return
      
      try {
        const result = await api.getHomeworkCart()
        this.cartItems = result.items || []
        store.setHomeworkCartCount(this.cartItems.length)
      } catch (e) {
        console.error('❌ Ошибка загрузки корзины:', e)
      }
    },
    
    async removeFromCart(cartId) {
      try {
        await api.removeFromCart(cartId)
        await this.loadCart()
      } catch (e) {
        console.error('❌ Ошибка удаления из корзины:', e)
      }
    },
    
    // === ВЫБОР УЧЕНИКОВ ===
    async openStudentSelector() {
      this.showStudentSelector = true
      this.loadingStudents = true
      
      try {
        const result = await api.getMyStudents()
        this.students = result.students || []
      } catch (e) {
        console.error('❌ Ошибка загрузки учеников:', e)
      } finally {
        this.loadingStudents = false
      }
    },
    
    closeStudentSelector() {
      this.showStudentSelector = false
      this.selectedStudents = []
      this.sendMessage = ''
    },
    
    async sendHomework() {
      this.sendingHomework = true
      this.sendMessage = ''
      
      try {
        await api.createHomeworkFromCart(
          this.selectedStudents,
          this.homeworkTitle,
          store.selectedSubject
        )
        
        this.sendMessage = '✅ Домашнее задание отправлено!'
        this.sendError = false
        
        setTimeout(() => {
          this.closeStudentSelector()
          this.closeHomeworkCart()
          this.loadCart()
        }, 1500)
        
      } catch (e) {
        this.sendMessage = e.message || 'Ошибка отправки ДЗ'
        this.sendError = true
      } finally {
        this.sendingHomework = false
      }
    }
  }
}
</script>

<style scoped>
.header {
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border);
  padding: 0;
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 16px;
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 16px;
}

.subject-selector {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.subject-btn {
  padding: 12px 20px;
  background: var(--bg-tertiary);
  border: 2px solid var(--border);
  border-radius: 8px;
  color: var(--text-primary);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 0;
  flex: 1;
  max-width: 200px;
}

.subject-btn:hover {
  border-color: var(--accent);
  transform: translateY(-2px);
}

.subject-btn.active {
  background: var(--accent);
  color: #000;
  border-color: var(--accent);
}

.user-section {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-shrink: 0;
}

.user-info {
  text-align: right;
}

.user-name {
  color: var(--text-primary);
  font-weight: 600;
  font-size: 14px;
}

.cart-btn {
  position: relative;
  background: var(--bg-tertiary);
  border: 2px solid var(--border);
  color: var(--text-primary);
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;
}

.cart-btn:hover {
  border-color: var(--accent);
  background: var(--accent-transparent);
}

.cart-badge {
  position: absolute;
  top: -6px;
  right: -6px;
  background: var(--accent);
  color: #000;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: 700;
}

.logout-btn {
  background: transparent;
  border: 2px solid var(--accent);
  color: var(--accent);
  padding: 8px 16px;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;
}

.logout-btn:hover {
  background: var(--accent);
  color: #000;
}

.support-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--accent-transparent);
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

.support-btn:hover {
  background: var(--accent);
  color: #000;
  transform: translateY(-2px);
}

.support-text {
  display: inline;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1001;
  padding: 20px;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.modal-content {
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 32px;
  max-width: 500px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
  animation: slideUp 0.3s ease;
}

.modal-large {
  max-width: 700px;
}

@keyframes slideUp {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
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

.modal-content h2 {
  background: var(--gradient-primary);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin: 0 0 24px 0;
  font-size: 24px;
}

.support-info {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.support-description {
  color: var(--text-muted);
  font-size: 14px;
  line-height: 1.6;
  margin: 0;
}

.contact-section {
  background: var(--bg-tertiary);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 16px;
}

.contact-section h3 {
  margin: 0 0 12px 0;
  color: var(--text-primary);
  font-size: 14px;
}

.telegram-link {
  display: flex;
  align-items: center;
  gap: 12px;
  background: var(--accent-transparent);
  border: 2px solid var(--accent);
  color: var(--accent);
  padding: 12px 16px;
  border-radius: 8px;
  text-decoration: none;
  font-weight: 600;
  transition: all 0.3s ease;
  margin-bottom: 8px;
}

.telegram-link:hover {
  background: var(--accent);
  color: #000;
  transform: translateY(-2px);
}

.telegram-link svg {
  flex-shrink: 0;
}

.contact-note {
  margin: 0;
  color: var(--text-muted);
  font-size: 12px;
}

.support-features {
  background: var(--bg-tertiary);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 16px;
}

.support-features h3 {
  margin: 0 0 12px 0;
  color: var(--text-primary);
  font-size: 14px;
}

.support-features ul {
  margin: 0;
  padding: 0 0 0 20px;
  list-style: none;
}

.support-features li {
  color: var(--text-muted);
  font-size: 13px;
  line-height: 1.8;
  margin: 4px 0;
}

/* КОРЗИНА */
.cart-items {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.cart-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: var(--bg-tertiary);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 12px;
}

.cart-item-info {
  flex: 1;
}

.cart-item-type {
  font-size: 12px;
  color: var(--accent);
  font-weight: 600;
  margin-bottom: 4px;
}

.cart-item-title {
  color: var(--text-primary);
  font-weight: 600;
  margin-bottom: 4px;
}

.cart-item-meta {
  font-size: 12px;
  color: var(--text-muted);
}

.cart-item-remove {
  background: transparent;
  border: none;
  color: var(--text-muted);
  font-size: 18px;
  cursor: pointer;
  padding: 4px 8px;
  transition: all 0.3s ease;
}

.cart-item-remove:hover {
  color: #ff4444;
}

/* ВЫБОР УЧЕНИКОВ */
.form-label {
  display: block;
  font-weight: 600;
  color: var(--text-primary);
  font-size: 14px;
  margin-bottom: 8px;
}

.form-input {
  width: 100%;
  background: var(--bg-tertiary);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 12px;
  color: var(--text-primary);
  font-size: 14px;
}

.student-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 300px;
  overflow-y: auto;
}

.student-checkbox {
  display: flex;
  align-items: center;
  gap: 12px;
  background: var(--bg-tertiary);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.student-checkbox:hover {
  border-color: var(--accent);
}

.student-checkbox input[type="checkbox"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.student-checkbox span {
  color: var(--text-primary);
  font-size: 14px;
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
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 14px;
}

.button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 255, 136, 0.3);
}

.button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.message {
  padding: 12px;
  border-radius: 8px;
  font-size: 14px;
  text-align: center;
}

.message.success {
  background: rgba(0, 255, 136, 0.1);
  border: 1px solid var(--accent);
  color: var(--accent);
}

.message.error {
  background: rgba(255, 68, 68, 0.1);
  border: 1px solid #ff4444;
  color: #ff4444;
}

.text-center {
  text-align: center;
}

.muted {
  color: var(--text-muted);
}

/* АДАПТИВНОСТЬ */
@media (max-width: 1024px) {
  .header-container {
    padding: 12px;
    gap: 12px;
  }

  .support-text {
    display: none;
  }

  .support-btn {
    padding: 8px 12px;
  }

  .subject-selector {
    gap: 8px;
  }

  .subject-btn {
    padding: 10px 16px;
    font-size: 14px;
  }
}

@media (max-width: 768px) {
  .header-container {
    grid-template-columns: 1fr auto;
    grid-template-rows: auto auto;
    gap: 12px;
    padding: 12px;
    align-items: center;
  }

  .support-btn {
    grid-column: 1;
    grid-row: 1;
    justify-self: start;
  }

  .user-section {
    grid-column: 2;
    grid-row: 1;
    justify-self: end;
  }

  .subject-selector {
    grid-column: 1 / -1;
    grid-row: 2;
    width: 100%;
  }

  .subject-btn {
    font-size: 14px;
    padding: 10px 16px;
  }

  .modal-content {
    padding: 24px;
    margin: 0 20px;
  }
}

@media (max-width: 480px) {
  .header-container {
    grid-template-columns: 1fr auto;
    grid-template-rows: auto auto;
    gap: 12px;
    padding: 12px;
    align-items: center;
  }

  .support-btn {
    grid-column: 1;
    grid-row: 1;
    justify-self: start;
    padding: 8px 12px;
    font-size: 12px;
  }

  .user-section {
    grid-column: 2;
    grid-row: 1;
    justify-self: end;
  }

  .subject-btn {
    font-size: 12px;
    padding: 8px 12px;
  }

  .logout-btn {
    padding: 6px 12px;
    font-size: 12px;
  }

  .modal-content {
    padding: 20px;
    margin: 0 16px;
  }

  .modal-content h2 {
    font-size: 20px;
    margin-bottom: 16px;
  }
}
</style>
