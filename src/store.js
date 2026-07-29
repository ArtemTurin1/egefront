import { reactive } from 'vue'

export const store = reactive({
  user: null,
  profile: null,
  selectedSubject: 'math',
  
  setUser(user) {
    this.user = user
  },
  
  setProfile(profile) {
    this.profile = profile
  },
  
  setSubject(subject) {
    this.selectedSubject = subject
  },
  
  clearUser() {
    this.user = null
    this.profile = null
  },
  
  logout() {
    this.user = null
    this.profile = null
    localStorage.removeItem('email')
    localStorage.removeItem('tg_username')
    localStorage.removeItem('tg_id')
  }
})
