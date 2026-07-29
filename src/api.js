import { store } from './store.js'

export const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000'
export const API_KEY = import.meta.env.VITE_API_KEY || '81d046059d166ace90e2312256d903ae08c315724d366cd1afa159b1e2b21d0f'

async function request(path, opts = {}) {
  try {
    const authHeaders = getAuthHeaders()
    const headers = {
      'Content-Type': 'application/json',
      'X-API-Key': API_KEY,
      ...authHeaders,
      ...(opts.headers || {})
    }

    console.log('🔑 Headers:', { path, headers })

    const res = await fetch(API_BASE + path, { ...opts, headers })

    if (!res.ok) {
      let errorData
      try {
        errorData = await res.json()
      } catch (e) {
        errorData = { detail: `HTTP ${res.status}` }
      }

      let errorMessage = errorData.detail || errorData.message || JSON.stringify(errorData)
      console.error('❌ Ошибка:', errorMessage)
      throw new Error(errorMessage)
    }

    return await res.json()
  } catch (error) {
    console.error('API Error:', error.message)
    throw error
  }
}

function getAuthHeaders() {
  const headers = {}
  const storedEmail = localStorage.getItem('email')
  if (storedEmail) {
    headers['X-EMAIL'] = storedEmail
  }
  return headers
}

export const api = {
  // ===== YANDEX OAuth =====
  getYandexAuthUrl: async () => {
    const result = await request('/api/auth/yandex/url')
    return result.auth_url
  },

  // ===== TELEGRAM Direct (мини-приложение) =====
  telegramAuth: async (telegramUser) => {
    const result = await request('/api/auth/telegram', {
      method: 'POST',
      body: JSON.stringify({
        id: telegramUser.id,
        first_name: telegramUser.first_name || '',
        username: telegramUser.username || ''
      })
    })
    if (result.email) {
      localStorage.setItem('email', result.email)
      const profile = await api.getProfile(result.email)
      store.setProfile(profile)
    }
    return result
  },

  // ===== РЕГИСТРАЦИЯ ПО КОДУ =====
  verifyCode: async (code) => {
    const result = await request('/api/auth/code/verify', {
      method: 'POST',
      body: JSON.stringify({ code: code.trim() })
    })
    return result
  },

  registerWithCode: async (code, name) => {
    const result = await request('/api/auth/code/register', {
      method: 'POST',
      body: JSON.stringify({
        code: code.trim(),
        name: name.trim()
      })
    })
    if (result.email) {
      localStorage.setItem('email', result.email)
      const profile = await api.getProfile(result.email)
      store.setProfile(profile)
      if (result.status === 'new_user') {
        console.log('✅ Новый пользователь зарегистрирован')
      } else if (result.status === 'existing_user') {
        console.log('ℹ️ Пользователь уже зарегистрирован, выполняем вход')
      }
    }
    return result
  },

  loginWithCode: async (code, telegramId) => {
    const result = await request('/api/auth/code/login', {
      method: 'POST',
      body: JSON.stringify({
        code: code.trim(),
        telegram_id: telegramId
      })
    })
    if (result.email) {
      localStorage.setItem('email', result.email)
      const profile = await api.getProfile(result.email)
      store.setProfile(profile)
    }
    return result
  },

  markCodeAsUsed: async (code) => {
    return await request('/api/auth/code/mark-used', {
      method: 'POST',
      body: JSON.stringify({ code: code.trim() })
    })
  },

  // ===== ПОЛУЧЕНИЕ ПОЛЬЗОВАТЕЛЬСКОГО КОДА ДЛЯ ВХОДА =====
  getUserCode: async (telegramId) => {
    const result = await request('/api/auth/code/get-user-code', {
      method: 'POST',
      body: JSON.stringify({ telegram_id: telegramId })
    })
    return result
  },

  // ===== Профиль и статистика =====
  getProfile: async (identifier) => {
    try {
      const path = `/api/profile/email/${identifier}`
      const profile = await request(path)
      store.setProfile(profile)
      return profile
    } catch (error) {
      console.error('❌ getProfile Error:', error)
      return null
    }
  },

  updateProfile: (newName) => {
    const headers = getAuthHeaders()
    return request('/api/profile/update', {
      method: 'PUT',
      body: JSON.stringify({ name: newName }),
      headers
    })
  },

  getStats: async (identifier) => {
    try {
      const path = `/api/stats/email/${identifier}`
      const stats = await request(path)
      return stats
    } catch (error) {
      console.error('❌ getStats Error:', error)
      return null
    }
  },

  getTimedStats: async (subject = null) => {
    try {
      const headers = getAuthHeaders()
      if (!headers['X-EMAIL']) {
        return {
          total_attempts: 0,
          correct_answers: 0,
          incorrect_answers: 0,
          success_rate: 0,
          avg_problems_per_minute: 0,
          total_time_seconds: 0
        }
      }
      const path = subject ? `/api/timed-stats/?subject=${subject}` : '/api/timed-stats/'
      const stats = await request(path, { headers })
      return {
        total_attempts: stats.total_attempts || 0,
        correct_answers: stats.correct_answers || 0,
        incorrect_answers: stats.incorrect_answers || 0,
        success_rate: stats.success_rate || 0,
        avg_problems_per_minute: stats.avg_problems_per_minute || 0,
        total_time_seconds: stats.total_time_seconds || 0
      }
    } catch (error) {
      console.error('❌ getTimedStats Error:', error)
      return {
        total_attempts: 0,
        correct_answers: 0,
        incorrect_answers: 0,
        success_rate: 0,
        avg_problems_per_minute: 0,
        total_time_seconds: 0
      }
    }
  },

  // ===== НАСТАВНИКИ И УЧЕНИКИ =====
  getProfileStatus: async () => {
    const headers = getAuthHeaders()
    return request('/api/profile/status', { headers })
  },

  becomeMentor: async () => {
    const headers = getAuthHeaders()
    return request('/api/mentor/become', {
      method: 'POST',
      headers
    })
  },

  addStudent: async (studentId) => {
    const headers = getAuthHeaders()
    return request('/api/mentor/add-student', {
      method: 'POST',
      body: JSON.stringify({ student_id: studentId }),
      headers
    })
  },

  addMentor: async (mentorId) => {
    const headers = getAuthHeaders()
    return request('/api/student/add-mentor', {
      method: 'POST',
      body: JSON.stringify({ mentor_id: mentorId }),
      headers
    })
  },

  getMyStudents: async () => {
    const headers = getAuthHeaders()
    return request('/api/mentor/students', { headers })
  },

  getMyMentors: async () => {
    const headers = getAuthHeaders()
    return request('/api/student/mentors', { headers })
  },

  // ===== Категории и задачи =====
  getCategories: (subject) => {
    const params = new URLSearchParams()
    if (subject) params.append('subject', subject)
    return request('/api/categories/?' + params.toString())
  },

  getProblems: (subject, difficulty, category_id) => {
    const params = new URLSearchParams()
    if (difficulty) params.append('difficulty', difficulty)
    if (category_id) params.append('category_id', category_id)
    const path = subject === 'math'
      ? `/api/problems/math/?${params.toString()}`
      : `/api/problems/informatics/?${params.toString()}`
    return request(path)
  },

  solveProblem: async (subject, problem_id, user_answer) => {
    const payload = {
      subject,
      problem_id: parseInt(problem_id),
      user_answer: String(user_answer).trim()
    }
    const headers = getAuthHeaders()
    try {
      const result = await request('/api/solve/', {
        method: 'POST',
        body: JSON.stringify(payload),
        headers
      })
      return result
    } catch (error) {
      console.error('❌ solveProblem error:', error.message)
      throw error
    }
  },

  // ===== Задачи пользователя =====
  getTasks: async () => {
    const headers = getAuthHeaders()
    return request('/api/tasks/', { headers })
  },

  createTask: (title) => {
    const headers = getAuthHeaders()
    return request('/api/tasks/', {
      method: 'POST',
      body: JSON.stringify({ title }),
      headers
    })
  },

  completeTask: (task_id) => {
    return request(`/api/tasks/${task_id}/complete`, { method: 'PATCH' })
  },

  deleteTask: (task_id) => {
    return request(`/api/tasks/${task_id}`, { method: 'DELETE' })
  },

  saveTimedAttempt: async (subject, problem_id, user_answer, is_correct, time_spent) => {
    const headers = getAuthHeaders()
    if (!headers['X-EMAIL']) {
      console.warn('⚠️ Не авторизован')
      return null
    }
    try {
      const result = await request('/api/timed-attempt/', {
        method: 'POST',
        body: JSON.stringify({
          subject,
          problem_id,
          user_answer,
          is_correct,
          time_spent_seconds: time_spent
        }),
        headers
      })
      return result
    } catch (error) {
      console.error('❌ saveTimedAttempt error:', error)
      return null
    }
  },

  // ===== ВАРИАНТЫ =====
  createVariant: async (subject, variantConfig) => {
    const headers = getAuthHeaders()
    return request('/api/variants/', {
      method: 'POST',
      body: JSON.stringify({
        subject,
        config: variantConfig
      }),
      headers
    })
  },

  getVariant: async (variantId) => {
    return request(`/api/variants/${variantId}/`)
  },

  submitVariantAnswer: async (variantId, problemId, userAnswer) => {
    const headers = getAuthHeaders()
    return request(`/api/variants/${variantId}/submit/`, {
      method: 'POST',
      body: JSON.stringify({
        problem_id: problemId,
        user_answer: userAnswer
      }),
      headers
    })
  },

  completeVariant: async (variantId) => {
    const headers = getAuthHeaders()
    return request(`/api/variants/${variantId}/complete/`, {
      method: 'POST',
      headers
    })
  },

  getVariantResults: async (variantId) => {
    return request(`/api/variants/${variantId}/results/`)
  }
}

export const tgUtils = {
  init() {
    return new Promise((resolve) => {
      if (window.Telegram?.WebApp) {
        const tg = window.Telegram.WebApp
        tg.ready()
        resolve(tg)
      } else {
        resolve(null)
      }
    })
  },

  getUser() {
    return window.Telegram?.WebApp?.initDataUnsafe?.user
  },

  getTheme() {
    return window.Telegram?.WebApp?.colorScheme || 'dark'
  }
}
