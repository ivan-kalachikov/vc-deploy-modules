import { ref, watch } from 'vue'

type ThemeMode = 'light' | 'dark' | 'system'

const STORAGE_KEY = 'theme-preference'

function loadInitialMode(): ThemeMode {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'light' || stored === 'dark' || stored === 'system') {
      return stored
    }
  } catch {
    // localStorage unavailable
  }
  return 'system'
}

function resolveTheme(m: ThemeMode): 'light' | 'dark' {
  if (m === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }
  return m
}

function applyTheme(theme: 'light' | 'dark') {
  document.documentElement.dataset.theme = theme
}

// Module-level singleton state
const mode = ref<ThemeMode>(loadInitialMode())
const resolvedTheme = ref<'light' | 'dark'>(resolveTheme(mode.value))

// Listen to OS changes when in system mode
const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
mediaQuery.addEventListener('change', () => {
  if (mode.value === 'system') {
    resolvedTheme.value = resolveTheme('system')
    applyTheme(resolvedTheme.value)
  }
})

// Watch mode changes
watch(mode, (newMode) => {
  try {
    localStorage.setItem(STORAGE_KEY, newMode)
  } catch {
    // localStorage unavailable
  }
  resolvedTheme.value = resolveTheme(newMode)
  applyTheme(resolvedTheme.value)
}, { immediate: true })

export function useTheme() {
  return {
    mode,
    resolvedTheme,
    toggle() {
      const cycle: ThemeMode[] = ['system', 'light', 'dark']
      const idx = cycle.indexOf(mode.value)
      mode.value = cycle[(idx + 1) % cycle.length]
    },
    setMode(m: ThemeMode) {
      mode.value = m
    }
  }
}
