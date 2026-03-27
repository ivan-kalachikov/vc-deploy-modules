<script setup lang="ts">
import { ref } from 'vue'
import { useTheme } from '../composables/useTheme'

const { resolvedTheme, toggle } = useTheme()
const isHovered = ref(false)
</script>

<template>
  <button
    class="theme-toggle"
    :class="[resolvedTheme, { hovered: isHovered }]"
    :title="resolvedTheme === 'light' ? 'Switch to dark' : 'Switch to light'"
    @mouseenter="isHovered = true"
    @mouseleave="isHovered = false"
    @click="toggle($event); isHovered = false"
  >
    <span class="icon current">{{ resolvedTheme === 'light' ? '☀️' : '🌙' }}</span>
    <span class="icon next">{{ resolvedTheme === 'light' ? '🌙' : '☀️' }}</span>
  </button>
</template>

<style scoped>
.theme-toggle {
  position: relative;
  padding: 0;
  border: none;
  background: transparent;
  font-size: 24px;
  cursor: pointer;
  line-height: 1;
  width: 32px;
  height: 32px;
  overflow: hidden;
}

.icon {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.4s ease, opacity 0.4s ease;
}

.current {
  transform: scale(1.1);
  opacity: 1;
}

.next {
  transform: scale(0.3) rotate(-90deg);
  opacity: 0;
}

/* Sun idle animation */
.light .current {
  animation: sun-pulse 3s ease-in-out infinite;
}

@keyframes sun-pulse {
  0%, 100% { transform: scale(1.1) rotate(0deg); }
  50% { transform: scale(1.15) rotate(10deg); }
}

/* Moon idle animation */
.dark .current {
  animation: moon-rock 4s ease-in-out infinite;
}

@keyframes moon-rock {
  0%, 100% { transform: scale(1.1) rotate(0deg); }
  33% { transform: scale(1.1) rotate(8deg); }
  66% { transform: scale(1.1) rotate(-8deg); }
}

/* Hover: current exits, next enters */
.hovered .current {
  animation: none;
}

.light.hovered .current {
  transform: scale(0.3) rotate(180deg);
  opacity: 0;
}

.dark.hovered .current {
  transform: scale(0.3) rotate(-180deg);
  opacity: 0;
}

.light.hovered .next {
  transform: scale(1.1) rotate(0deg);
  opacity: 1;
  animation: moon-swing 1s ease-in-out infinite 0.3s;
}

.dark.hovered .next {
  transform: scale(1.1) rotate(0deg);
  opacity: 1;
  animation: sun-spin 1.5s linear infinite 0.3s;
}

@keyframes moon-swing {
  0%, 100% { transform: scale(1.1) rotate(0deg); }
  25% { transform: scale(1.1) rotate(15deg); }
  75% { transform: scale(1.1) rotate(-15deg); }
}

@keyframes sun-spin {
  0% { transform: scale(1.1) rotate(0deg); }
  100% { transform: scale(1.1) rotate(360deg); }
}
</style>
