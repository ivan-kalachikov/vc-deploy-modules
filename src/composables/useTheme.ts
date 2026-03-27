import { computed, watch } from 'vue'
import { useStorage, usePreferredDark } from '@vueuse/core'

type ThemeMode = 'light' | 'dark' | 'system'

const mode = useStorage<ThemeMode>('theme-preference', 'system')
const prefersDark = usePreferredDark()

const resolvedTheme = computed<'light' | 'dark'>(() =>
  mode.value === 'system'
    ? (prefersDark.value ? 'dark' : 'light')
    : mode.value,
)

watch(resolvedTheme, (theme) => {
  document.documentElement.dataset.theme = theme
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
    },
  }
}
