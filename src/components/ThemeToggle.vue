<script setup lang="ts">
import { useTheme } from '../composables/useTheme'

const { mode, toggle } = useTheme()
const icons: Record<string, string> = { system: '\u{1F5A5}', light: '\u2600', dark: '\u{1F319}' }
const labels: Record<string, string> = { system: 'System', light: 'Light', dark: 'Dark' }
</script>

<template>
  <button class="theme-toggle" @click="toggle" :title="`Theme: ${labels[mode]}`">
    {{ icons[mode] }} {{ labels[mode] }}
  </button>
</template>

<style scoped>
.theme-toggle {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border: 1px solid var(--border-primary);
  border-radius: 999px;
  background: var(--surface-secondary);
  color: var(--text-secondary);
  font-size: 12px;
  cursor: pointer;
  transition: var(--transition-fast);
  line-height: 1.4;
}
.theme-toggle:hover {
  background: var(--surface-tertiary);
  color: var(--text-primary);
  border-color: var(--border-secondary);
}
</style>
