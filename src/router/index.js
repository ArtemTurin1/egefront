import { createRouter, createWebHashHistory } from 'vue-router'
import ProblemsView from '../views/ProblemsView.vue'
import ProfileView from '../views/ProfileView.vue'
import StatsView from '../views/StatsView.vue'
import RegisterView from '../views/RegisterView.vue'
import TimedProblemsView from '../views/TimedProblemsView.vue'
import CreateVariantView from '../views/CreateVariantView.vue'
import SolveVariantView from '../views/SolveVariantView.vue'
import HomeworkView from '../views/HomeworkView.vue' // ✅ Добавлено

const routes = [
  {
    path: '/',
    name: 'Problems',
    component: ProblemsView
  },
  {
    path: '/create-variant',
    name: 'CreateVariant',
    component: CreateVariantView
  },
  {
    path: '/variant/:variantId',
    name: 'SolveVariant',
    component: SolveVariantView
  },
  {
    path: '/timed',
    name: 'TimedProblems',
    component: TimedProblemsView
  },
  {
    path: '/profile',
    name: 'Profile',
    component: ProfileView
  },
  {
    path: '/stats',
    name: 'Stats',
    component: StatsView
  },
  {
    path: '/register',
    name: 'Register',
    component: RegisterView
  },
  // ✅ Новый роут для домашних заданий
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

export default router
