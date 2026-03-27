<script setup lang="ts">
import { useTheme } from '../composables/useTheme'

const { mode, toggle } = useTheme()
const icons: Record<string, string> = { system: '🌗', light: '☀️', dark: '🌙' }
const titles: Record<string, string> = { system: 'Auto (system)', light: 'Light mode', dark: 'Dark mode' }
</script>

<template>
  <button class="theme-toggle" :title="titles[mode]" @click="toggle">{{ icons[mode] }}</button>
</template>

<style scoped>
.theme-toggle {
  padding: 4px 8px;
  border: none;
  border-radius: var(--radius-sm);
  background: transparent;
  font-size: 18px;
  cursor: pointer;
  transition: all var(--transition-fast);
  line-height: 1;
}
.theme-toggle:hover {
  background: var(--surface-tertiary);
}
</style>
