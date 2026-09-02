<template>
  <nav class="mobile-navbar">
    <router-link to="/schedule" class="nav-item">
      <span class="icon">📅</span>
      <span class="label">Уроки</span>
    </router-link>
    <router-link to="/homework" class="nav-item">
      <span class="icon">📚</span>
      <span class="label">ДЗ</span>
    </router-link>
    <router-link to="/profile" class="nav-item">
      <span class="icon">👤</span>
      <span class="label">Профиль</span>
    </router-link>
  </nav>
</template>

<script>
export default {
  name: 'Navbar'
}
</script>

<style scoped>
.mobile-navbar {
  display: none;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: var(--bg-secondary);
  border-top: 1px solid var(--border);
  padding: 10px 20px;
  justify-content: space-around;
  z-index: 100;
  backdrop-filter: blur(10px);
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  color: var(--text-secondary);
  text-decoration: none;
  font-size: 12px;
  transition: all 0.3s ease;
}

.icon {
  font-size: 24px;
  margin-bottom: 4px;
}

.nav-item:hover, .nav-item.router-link-active {
  color: var(--accent);
}

@media (max-width: 768px) {
  .mobile-navbar {
    display: flex;
  }
}
</style>
