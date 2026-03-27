<script setup lang="ts">
import type { DiffChange } from '../types'
import { useJsonGenerator } from '../composables/useJsonGenerator'
import { useToast } from '../composables/useToast'
import DiffPreview from './DiffPreview.vue'

const props = defineProps<{
  json: string
  hasErrors: boolean
  showDiff: boolean
  changes: DiffChange[]
}>()

const emit = defineEmits<{
  'toggle-diff': []
  'scroll-to-error': []
  'scroll-to-module': [moduleId: string]
}>()

const { copyToClipboard } = useJsonGenerator()
const { addToast } = useToast()

const handleCopy = async () => {
  const ok = await copyToClipboard(props.json)
  if (ok) {
    addToast('JSON copied to clipboard', 'success')
  } else {
    addToast('Failed to copy to clipboard', 'error')
  }
}
</script>

<template>
  <div class="json-output">
    <div class="json-header">
      <h2>Generated JSON</h2>
      <div class="json-actions">
        <button
          v-if="hasErrors"
          class="action-button error-button"
          @click="emit('scroll-to-error')"
        >
          Errors
        </button>
        <button
          class="action-button"
          @click="emit('toggle-diff')"
        >
          {{ showDiff ? 'Hide Diff' : 'Show Diff' }}
        </button>
        <button class="copy-button" @click="handleCopy">Copy</button>
      </div>
    </div>
    <DiffPreview
      v-if="showDiff"
      :changes="changes"
      @scroll-to-module="(id: string) => emit('scroll-to-module', id)"
    />
    <pre>{{ json }}</pre>
  </div>
</template>

<style scoped>
.json-output {
  background: var(--surface-secondary);
  border-radius: var(--radius-md);
  padding: 20px;
  height: 100%;
  display: flex;
  flex-direction: column;
}
.json-output h2 { color: var(--text-primary); margin-bottom: 0; font-weight: 600; font-size: 18px; }
.json-output pre {
  background: var(--surface-card);
  padding: 15px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-primary);
  color: var(--text-primary);
  font-family: monospace;
  font-size: 14px;
  line-height: 1.5;
  flex: 1;
  overflow: auto;
  margin: 0;
}
.json-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.json-actions { display: flex; gap: 8px; align-items: center; }
.action-button {
  padding: 6px 12px;
  background: transparent;
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-sm);
  cursor: pointer;
  color: var(--text-primary);
  transition: all var(--transition-fast);
  font-size: 13px;
}
.action-button:hover { background: var(--surface-tertiary); }
.error-button { color: var(--error-text); border-color: var(--error-border); }
.error-button:hover { background: var(--error-bg); }
.copy-button {
  padding: 6px 12px;
  background: var(--primary);
  color: var(--text-on-primary);
  border: none;
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  transition: all var(--transition-fast);
}
.copy-button:hover { background: var(--primary-hover); }
</style>
