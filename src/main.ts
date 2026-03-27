import { createApp } from 'vue'
import App from './App.vue'
import { useTheme } from './composables/useTheme'

// Initialize theme before mount
useTheme()

createApp(App).mount('#app')
