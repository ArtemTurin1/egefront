import { createRouter, createWebHashHistory } from 'vue-router'
import ProfileView from '../views/ProfileView.vue'
import RegisterView from '../views/RegisterView.vue'
import HomeworkView from '../views/HomeworkView.vue'
import ScheduleView from '../views/ScheduleView.vue'

const routes = [
  {
    path: '/',
    redirect: '/schedule'
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

export default router
