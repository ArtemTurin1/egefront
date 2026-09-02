import { reactive } from 'vue'

export const store = reactive({
  user: null,
  profile: null,
  token: localStorage.getItem('token') || null,
  
  get isAuthenticated() {
    return !!(this.token || localStorage.getItem('email'))
  },

  setUser(user) {
    this.user = user
  },
  
  setProfile(profile) {
    this.profile = profile
    if (profile && profile.email) {
      localStorage.setItem('email', profile.email)
    }
  },

  clearUser() {
    this.user = null
    this.profile = null
    this.token = null
  },
  
  logout() {
    this.user = null
    this.profile = null
    this.token = null
    localStorage.removeItem('token')
    localStorage.removeItem('email')
    localStorage.removeItem('tg_username')
    localStorage.removeItem('tg_id')
  }
})
