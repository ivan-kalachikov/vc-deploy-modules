<script setup lang="ts">
import { useTheme } from '../composables/useTheme'

const { mode, toggle } = useTheme()
const labels: Record<string, string> = { system: 'Auto', light: 'Light', dark: 'Dark' }
</script>

<template>
  <button class="theme-toggle" @click="toggle">{{ labels[mode] }}</button>
</template>

<style scoped>
.theme-toggle {
  padding: 6px 12px;
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--text-primary);
  font-size: 13px;
  cursor: pointer;
  transition: all var(--transition-fast);
}
.theme-toggle:hover {
  background: var(--surface-tertiary);
}
</style>
