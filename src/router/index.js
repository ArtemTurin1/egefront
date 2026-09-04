import { createRouter, createWebHashHistory } from 'vue-router'
import ProfileView from '../views/ProfileView.vue'
import RegisterView from '../views/RegisterView.vue'
import HomeworkView from '../views/HomeworkView.vue'
import ScheduleView from '../views/ScheduleView.vue'
import { store } from '../store.js'
import { api } from '../api.js'

const routes = [
  {
    path: '/',
    redirect: () => {
      const hasAuth = !!(localStorage.getItem('token') || localStorage.getItem('email') || store.profile)
      return hasAuth ? '/profile' : '/register'
    }
  },
  {
    path: '/schedule',
    name: 'Schedule',
    component: ScheduleView
  },
  {
    path: '/profile',
    name: 'Profile',
    component: ProfileView
  },
  {
    path: '/register',
    name: 'Register',
    component: RegisterView
  },
  {
    path: '/homework',
    name: 'Homework',
    component: HomeworkView
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

// Автоматический редирект в /profile для авторизованных пользователей
router.beforeEach(async (to, from, next) => {
  const hasSavedAuth = !!(localStorage.getItem('token') || localStorage.getItem('email'))

  // Если профиль ещё не загружен в store, но есть сохранённые данные авторизации
  if (!store.profile && hasSavedAuth) {
    try {
      await api.getMe()
    } catch (e) {
      console.warn('Router guard: getMe failed', e)
    }
  }

  const isAuth = !!(store.profile || hasSavedAuth)

  // Если пользователь уже авторизован и заходит на страницу входа/регистрации -> перенаправляем в профиль
  if (to.path === '/register' && isAuth) {
    return next('/profile')
  }

  // Если переходит в корень сайта
  if (to.path === '/') {
    return next(isAuth ? '/profile' : '/register')
  }

  next()
})

export default router

