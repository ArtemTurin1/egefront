import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import './assets/styles.css'
import Chart from 'chart.js/auto'
const app = createApp(App)

app.use(router)


app.config.errorHandler = (err, instance, info) => {
  console.error('Vue ошибка:', err, info)
}

window.Chart = Chart
app.mount('#app')


if (window.Telegram?.WebApp) {
  const tg = window.Telegram.WebApp
  tg.ready()
  tg.expand()
  
  document.documentElement.setAttribute('data-theme', tg.colorScheme || 'dark')
}