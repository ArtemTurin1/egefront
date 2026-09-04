import { store } from './store.js'

export const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000'

export function getFileUrl(url) {
  if (!url) return ''
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:') || url.startsWith('blob:')) {
    return url
  }
  const base = API_BASE.endsWith('/') ? API_BASE.slice(0, -1) : API_BASE
  const path = url.startsWith('/') ? url : '/' + url
  return `${base}${path}`
}

async function request(path, opts = {}) {
  try {
    const authHeaders = getAuthHeaders()
    const headers = {
      'Content-Type': 'application/json',
      ...authHeaders,
      ...(opts.headers || {})
    }

    // Если отправляем FormData (для файлов), удаляем Content-Type, чтобы браузер сам поставил boundary
    if (opts.body instanceof FormData) {
      delete headers['Content-Type']
    }

    const res = await fetch(API_BASE + path, { ...opts, headers })

    if (!res.ok) {
      let errorData
      try {
        errorData = await res.json()
      } catch (e) {
        errorData = { detail: `HTTP ${res.status}` }
      }

      let errorMessage = errorData.detail || errorData.message || JSON.stringify(errorData)
      console.error('API Error Response:', errorMessage)
      throw new Error(errorMessage)
    }

    return await res.json()
  } catch (error) {
    console.error('API Request Failed:', error.message)
    throw error
  }
}

function getAuthHeaders() {
  const headers = {}
  const token = localStorage.getItem('token')
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  const email = localStorage.getItem('email')
  if (email) {
    headers['X-EMAIL'] = email
  }
  return headers
}

export const api = {
  // ===== АУТЕНТИФИКАЦИЯ =====

  getMe: async () => {
    try {
      const profile = await request('/api/auth/me')
      store.setProfile(profile)
      store.setUser(profile)
      return profile
    } catch (e) {
      console.warn('Could not fetch /api/auth/me:', e.message)
      return null
    }
  },

  telegramAuth: async (telegramUser) => {
    const result = await request('/api/auth/telegram', {
      method: 'POST',
      body: JSON.stringify({
        id: telegramUser.id,
        first_name: telegramUser.first_name || '',
        username: telegramUser.username || ''
      })
    })
    if (result.access_token) {
      localStorage.setItem('token', result.access_token)
    }
    if (result.user && result.user.email) {
      localStorage.setItem('email', result.user.email)
      store.setUser(result.user)
      store.setProfile(result.user)
    }
    return result
  },

  verifyCode: async (code) => {
    return await request('/api/auth/code/verify', {
      method: 'POST',
      body: JSON.stringify({ code: code.trim().toUpperCase() })
    })
  },

  registerWithCode: async (code, name = '') => {
    const result = await request('/api/auth/code/register', {
      method: 'POST',
      body: JSON.stringify({
        code: code.trim().toUpperCase(),
        name: (name || '').trim()
      })
    })
    if (result.access_token) {
      localStorage.setItem('token', result.access_token)
    }
    if (result.user && result.user.email) {
      localStorage.setItem('email', result.user.email)
      store.setUser(result.user)
      store.setProfile(result.user)
    }
    return result
  },

  registerWithEmail: async (email, password, name, isMentor = false) => {
    const result = await request('/api/auth/register-email', {
      method: 'POST',
      body: JSON.stringify({
        email: email.trim().toLowerCase(),
        password,
        name: name.trim(),
        is_mentor: isMentor
      })
    })
    if (result.access_token) {
      localStorage.setItem('token', result.access_token)
    }
    if (result.user && result.user.email) {
      localStorage.setItem('email', result.user.email)
      store.setUser(result.user)
      store.setProfile(result.user)
    }
    return result
  },

  loginWithEmail: async (email, password) => {
    const result = await request('/api/auth/login-email', {
      method: 'POST',
      body: JSON.stringify({
        email: email.trim().toLowerCase(),
        password
      })
    })
    if (result.access_token) {
      localStorage.setItem('token', result.access_token)
    }
    if (result.user && result.user.email) {
      localStorage.setItem('email', result.user.email)
      store.setUser(result.user)
      store.setProfile(result.user)
    }
    return result
  },

  linkTelegramCode: async (code) => {
    const result = await request('/api/auth/link-telegram', {
      method: 'POST',
      body: JSON.stringify({ code: code.trim().toUpperCase() })
    })
    if (result.user) {
      store.setUser(result.user)
      store.setProfile(result.user)
    }
    return result
  },


  // ===== НАСТАВНИКИ =====
  becomeMentor: async () => {
    return await request('/api/mentor/become', { method: 'POST' })
  },

  addStudent: async (studentId) => {
    return await request('/api/mentor/add-student', {
      method: 'POST',
      body: JSON.stringify({ student_id: parseInt(studentId) })
    })
  },

  addMentor: async (mentorId) => {
    return await request('/api/student/add-mentor', {
      method: 'POST',
      body: JSON.stringify({ mentor_id: parseInt(mentorId) })
    })
  },

  getMyStudents: async () => {
    return await request('/api/mentor/students')
  },

  getMyMentors: async () => {
    return await request('/api/student/mentors')
  },

  // ===== ДОМАШНИЕ ЗАДАНИЯ =====

  createHomework: async (title, description, attachments = []) => {
    return await request('/api/homework/', {
      method: 'POST',
      body: JSON.stringify({
        title,
        description,
        attachments
      })
    })
  },

  assignHomework: async (homeworkId, studentIds) => {
    return await request(`/api/homework/${homeworkId}/assign`, {
      method: 'POST',
      body: JSON.stringify({
        student_ids: studentIds
      })
    })
  },

  getMentorHomeworkList: async () => {
    return await request('/api/homework/mentor')
  },

  getMentorHomeworkDetails: async (homeworkId) => {
    return await request(`/api/homework/mentor/${homeworkId}`)
  },

  getStudentHomeworkList: async () => {
    return await request('/api/homework/student')
  },

  getStudentHomeworkDetails: async (studentHomeworkId) => {
    return await request(`/api/homework/student/${studentHomeworkId}`)
  },

  submitStudentHomework: async (studentHomeworkId, studentComment, studentAttachments = []) => {
    return await request(`/api/homework/student/${studentHomeworkId}/submit`, {
      method: 'POST',
      body: JSON.stringify({
        student_comment: studentComment,
        student_attachments: studentAttachments
      })
    })
  },

  reviewHomework: async (studentHomeworkId, status, mentorFeedback = '') => {
    return await request(`/api/homework/review/${studentHomeworkId}`, {
      method: 'POST',
      body: JSON.stringify({
        status,
        mentor_feedback: mentorFeedback
      })
    })
  },

  deleteHomework: async (homeworkId) => {
    return await request(`/api/homework/${homeworkId}`, {
      method: 'DELETE'
    })
  },

  unassignHomework: async (homeworkId, studentId) => {
    return await request(`/api/homework/${homeworkId}/assign/${studentId}`, {
      method: 'DELETE'
    })
  },

  // ===== РАСПИСАНИЕ И УРОКИ =====
  getMentorLessons: async () => {
    return await request('/api/schedule/mentor')
  },

  getStudentLessons: async () => {
    return await request('/api/schedule/student')
  },

  createLesson: async (lessonData) => {
    return await request('/api/schedule/lessons', {
      method: 'POST',
      body: JSON.stringify(lessonData)
    })
  },

  deleteLesson: async (lessonId) => {
    return await request(`/api/schedule/lessons/${lessonId}`, {
      method: 'DELETE'
    })
  },

  updateLesson: async (lessonId, updateData) => {
    return await request(`/api/schedule/lessons/${lessonId}`, {
      method: 'PUT',
      body: JSON.stringify(updateData)
    })
  },

  // ===== ЗАГРУЗКА ФАЙЛОВ =====
  uploadFile: async (file) => {
    const formData = new FormData()
    formData.append('file', file)
    return await request('/api/upload/', {
      method: 'POST',
      body: formData
    })
  },

  // ===== ПРОФИЛЬ =====
  getProfile: async (email = null) => {
    if (!email) {
      return await api.getMe()
    }
    return await request(`/api/profile/email/${email}`)
  },

  updateProfile: async (name) => {
    const result = await request('/api/profile/update', {
      method: 'PUT',
      body: JSON.stringify({ name })
    })
    if (store.profile) {
      store.profile.name = name
    }
    return result
  }
}
