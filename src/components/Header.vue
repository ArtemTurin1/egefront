<template>
  <header class="app-header">
    <div class="header-inner">
      <!-- ЛОГОТИП -->
      <router-link to="/schedule" class="brand-logo">
        <span class="brand-name">КогдаУрок</span>
      </router-link>

      <!-- ЦЕНТРАЛЬНАЯ НАВИГАЦИЯ -->
      <nav class="header-nav">
        <router-link to="/schedule" class="header-tab">
          <span class="tab-icon">📅</span>
          <span class="tab-label">Расписание</span>
        </router-link>
        <router-link to="/homework" class="header-tab">
          <span class="tab-icon">📚</span>
          <span class="tab-label">Домашние задания</span>
        </router-link>
        <router-link to="/profile" class="header-tab">
          <span class="tab-icon">👤</span>
          <span class="tab-label">Профиль</span>
        </router-link>
      </nav>

      <!-- ПРАВАЯ ЧАСТЬ: ПРОФИЛЬ / ВХОД -->
      <div class="header-actions">
        <router-link v-if="profile" to="/profile" class="profile-pill" :title="profile.email">
          <div class="avatar-circle">
            {{ profile.name ? profile.name.charAt(0).toUpperCase() : 'U' }}
          </div>
          <div class="profile-info">
            <span class="profile-name">{{ profile.name || 'Пользователь' }}</span>
            <span class="profile-role" :class="{ mentor: profile.is_mentor }">
              {{ profile.is_mentor ? '👨‍🏫 Наставник' : '👨‍🎓 Ученик' }}
            </span>
          </div>
        </router-link>
        <router-link v-else to="/register" class="auth-btn">
          Войти →
        </router-link>
      </div>
    </div>
  </header>
</template>

<script>
import { store } from '../store.js'

export default {
  name: 'Header',
  computed: {
    profile() {
      return store.profile
    }
  }
}
</script>

<style scoped>
.app-header {
  position: sticky;
  top: 0;
  z-index: 1000;
  width: 100%;
  background: rgba(14, 14, 14, 0.88);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.35);
}

.header-inner {
  max-width: 1200px;
  margin: 0 auto;
  padding: 12px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
}

/* ЛОГОТИП */
.brand-logo {
  display: flex;
  align-items: center;
  gap: 6px;
  text-decoration: none;
  flex-shrink: 0;
}

.brand-name {
  font-size: 20px;
  font-weight: 800;
  letter-spacing: 0.3px;
  color: var(--accent);
}

.brand-badge {
  font-size: 10px;
  font-weight: 800;
  background: rgba(0, 255, 136, 0.15);
  color: var(--accent);
  border: 1px solid rgba(0, 255, 136, 0.3);
  padding: 2px 6px;
  border-radius: 6px;
  letter-spacing: 0.8px;
}

/* ЦЕНТРАЛЬНАЯ НАВИГАЦИЯ */
.header-nav {
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(255, 255, 255, 0.03);
  padding: 4px 6px;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.06);
}

.header-tab {
  display: inline-flex !important;
  align-items: center;
  gap: 8px;
  color: var(--text-secondary);
  text-decoration: none;
  font-weight: 600;
  font-size: 14px;
  padding: 8px 16px !important;
  width: auto !important;
  height: auto !important;
  border-radius: 10px;
  white-space: nowrap !important;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  position: static !important;
}

.tab-icon {
  font-size: 16px;
  line-height: 1;
}

.tab-label {
  display: inline-block;
  white-space: nowrap;
}

.header-tab:hover {
  color: var(--text-primary);
  background: rgba(255, 255, 255, 0.06);
}

.header-tab.router-link-active {
  background: var(--accent-transparent) !important;
  color: var(--accent) !important;
  border: 1px solid rgba(0, 255, 136, 0.25);
}

/* ПРАВАЯ ЧАСТЬ */
.header-actions {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.profile-pill {
  display: flex;
  align-items: center;
  gap: 10px;
  text-decoration: none;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  padding: 5px 14px 5px 6px;
  border-radius: 30px;
  transition: all 0.25s ease;
}

.profile-pill:hover {
  border-color: rgba(0, 255, 136, 0.35);
  background: rgba(0, 255, 136, 0.05);
}

.avatar-circle {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--accent);
  color: #000;
  font-weight: 800;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.profile-info {
  display: flex;
  flex-direction: column;
  line-height: 1.2;
}

.profile-name {
  font-size: 13px;
  font-weight: 700;
  color: var(--text-primary);
  max-width: 130px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.profile-role {
  font-size: 11px;
  color: var(--text-muted);
  font-weight: 500;
}

.profile-role.mentor {
  color: var(--accent);
}

.auth-btn {
  background: var(--gradient-primary);
  color: #000;
  text-decoration: none;
  font-size: 13px;
  font-weight: 700;
  padding: 8px 18px;
  border-radius: 8px;
  transition: opacity 0.15s ease;
}

.auth-btn:hover {
  opacity: 0.88;
}

/* АДАПТИВНОСТЬ */
@media (max-width: 820px) {
  .header-nav {
    display: none;
  }

  .header-inner {
    padding: 10px 16px;
  }

  .profile-info {
    display: none;
  }

  .profile-pill {
    padding: 3px;
    border-radius: 50%;
  }
}
</style>
