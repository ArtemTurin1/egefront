<template>
  <nav class="navbar">
    <router-link to="/" class="nav-link" :title="isMobile ? '' : 'Задачи'" @click="trackActive">
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/>
        <polyline points="10 9 9 9 8 9"/>
      </svg>
      <span class="nav-label">Задачи</span>
    </router-link>

    <router-link to="/create-variant" class="nav-link" :title="isMobile ? '' : 'Вариант'" @click="trackActive">
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 5v14M5 12h14"/>
      </svg>
      <span class="nav-label">Вариант</span>
    </router-link>

    <router-link to="/timed" class="nav-link" :title="isMobile ? '' : 'На время'" @click="checkAuth">
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="9"/>
        <polyline points="12 6 12 12 16 14"/>
      </svg>
      <span class="nav-label">На время</span>
    </router-link>

    <router-link to="/profile" class="nav-link" :title="isMobile ? '' : 'Профиль'" @click="trackActive">
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
        <circle cx="12" cy="7" r="4"/>
      </svg>
      <span class="nav-label">Профиль</span>
    </router-link>
  </nav>
</template>

<script>
export default { 
  name: "Navbar",
  data() {
    return {
      isMobile: window.innerWidth <= 768
    }
  },
  mounted() {
    window.addEventListener('resize', () => {
      this.isMobile = window.innerWidth <= 768
    })

    const links = document.querySelectorAll('.nav-link');
    links.forEach(link => {
      link.addEventListener('click', function() {
        this.style.transform = 'scale(0.9)';
        setTimeout(() => {
          this.style.transform = 'scale(1)';
        }, 150);
      });
    });
  },
  methods: {
    trackActive() {
      // Просто для анимации
    },
    checkAuth(e) {
      // Проверка авторизации будет в самом компоненте TimedProblemsView
    }
  }
}
</script>

<style scoped>
.navbar {
  box-shadow: 0 8px 32px rgba(0, 255, 136, 0.15);
  border: 1px solid rgba(0, 255, 136, 0.2);
  display: flex;
  justify-content: space-around;
  align-items: center;
  padding: 0;
  gap: 0;
  background: var(--bg-primary);
  min-height: 70px;
}

.nav-link {
  position: relative;
  overflow: hidden;
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 16px;
  text-decoration: none;
  color: var(--text-muted);
  transition: all 0.3s ease;
  border: none;
  background: transparent;
  cursor: pointer;
  white-space: nowrap;
  min-height: 70px;
}

.nav-link:hover {
  color: var(--text-primary);
}

.nav-link svg {
  width: 24px;
  height: 24px;
  transition: all 0.3s ease;
  flex-shrink: 0;
}

.nav-link:hover svg {
  transform: scale(1.1);
}

.nav-label {
  font-size: 13px;
  font-weight: 600;
  white-space: nowrap;
  text-align: center;
  line-height: 1.3;
}

.nav-link::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(0, 255, 136, 0.15), transparent);
  transition: left 0.5s;
  z-index: -1;
}

.nav-link:hover::before {
  left: 100%;
}

.nav-link.router-link-active {
  background: var(--accent-transparent);
  border: none;
  color: var(--accent);
}

.nav-link.router-link-active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: var(--accent);
}

/* На пк показываем подписи и растягиваем по горизонтали */
@media (min-width: 769px) {
  .navbar {
    min-height: 70px;
  }

  .nav-link {
    min-height: 70px;
    padding: 12px 40px;
    gap: 8px;
    flex: 1;
  }

  .nav-label {
    font-size: 14px;
    display: block;
  }
}

/* На телефоне только иконки */
@media (max-width: 768px) {
  .navbar {
    min-height: 60px;
  }

  .nav-link {
    min-height: 60px;
    padding: 12px 16px;
    gap: 0;
    flex: 1;
  }

  .nav-label {
    display: none;
  }

  .nav-link svg {
    width: 24px;
    height: 24px;
  }
}
</style>
