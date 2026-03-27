import { computed, ref, watch } from 'vue'
import { useStorage, usePreferredDark } from '@vueuse/core'

type ThemeMode = 'light' | 'dark' | 'system'

const mode = useStorage<ThemeMode>('theme-preference', 'system')
const prefersDark = usePreferredDark()
const isTransitioning = ref(false)

const resolvedTheme = computed<'light' | 'dark'>(() =>
  mode.value === 'system'
    ? (prefersDark.value ? 'dark' : 'light')
    : mode.value,
)

// Apply theme to DOM — but skip if a view transition is handling it
watch(resolvedTheme, (theme) => {
  if (!isTransitioning.value) {
    document.documentElement.dataset.theme = theme
  }
}, { immediate: true })

export function useTheme() {
  return {
    mode,
    resolvedTheme,
    toggle(event?: MouseEvent) {
      const nextMode: ThemeMode = resolvedTheme.value === 'dark' ? 'light' : 'dark'
      const nextTheme = nextMode

      if (!document.startViewTransition || !event) {
        mode.value = nextMode
        return
      }

      const x = event.clientX
      const y = event.clientY
      const maxRadius = Math.hypot(
        Math.max(x, window.innerWidth - x),
        Math.max(y, window.innerHeight - y),
      )

      // Block the watcher from applying theme during transition
      isTransitioning.value = true

      const transition = document.startViewTransition(() => {
        document.documentElement.dataset.theme = nextTheme
        mode.value = nextMode
        isTransitioning.value = false
      })

      // Sunset/sunrise glow from the button
      const isDark = nextTheme === 'dark'
      const overlay = document.createElement('div')
      Object.assign(overlay.style, {
        position: 'fixed', inset: '0', zIndex: '999999',
        pointerEvents: 'none',
        background: isDark
          ? `radial-gradient(circle at ${x}px ${y}px, #ff6b35 0%, #c2185b 25%, #4a148c 50%, #1a1a2e 75%, transparent 100%)`
          : `radial-gradient(circle at ${x}px ${y}px, #fff176 0%, #ffb74d 25%, #ff8a80 50%, #80d8ff 75%, transparent 100%)`,
        opacity: '0',
      })
      document.body.appendChild(overlay)

      overlay.animate([
        { opacity: '0' },
        { opacity: '0.5', offset: 0.3 },
        { opacity: '0.3', offset: 0.6 },
        { opacity: '0' },
      ], { duration: 700, easing: 'ease-in-out' }).onfinish = () => overlay.remove()

      transition.ready.then(() => {
        const blur = maxRadius * 0.4
        const frames = 50
        const keyframes: Keyframe[] = []
        for (let i = 0; i <= frames; i++) {
          const t = i / frames
          const ease = t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2
          const r = ease * maxRadius
          keyframes.push({
            maskImage: `radial-gradient(circle at ${x}px ${y}px, black ${r}px, transparent ${r + blur}px)`,
            WebkitMaskImage: `radial-gradient(circle at ${x}px ${y}px, black ${r}px, transparent ${r + blur}px)`,
          })
        }
        document.documentElement.animate(keyframes, {
          duration: 700,
          easing: 'linear',
          pseudoElement: '::view-transition-new(root)',
        })
      })
    },
    setMode(m: ThemeMode) {
      mode.value = m
    },
  }
}
