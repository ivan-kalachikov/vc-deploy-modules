<script setup lang="ts">
import { computed } from 'vue'
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

const copyButtonColor = computed(() =>
  props.hasErrors ? 'var(--error-text)' : 'var(--success)'
)
const copyButtonHoverColor = computed(() =>
  props.hasErrors ? 'var(--error)' : 'var(--success-hover)'
)

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
          title="Some fields have invalid values"
          @click="emit('scroll-to-error')"
        >
          ⚠️
        </button>
        <button
          class="action-button"
          :title="showDiff ? 'Hide Changes' : 'Show Changes'"
          @click="emit('toggle-diff')"
        >
          {{ showDiff ? '⬆️' : '⬇️' }}
        </button>
        <button class="copy-button" @click="handleCopy">
          <svg class="icon" viewBox="0 0 24 24" width="16" height="16">
            <path fill="currentColor" d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
          </svg>
          Copy
        </button>
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
  padding: 8px;
  background: transparent;
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-sm);
  cursor: pointer;
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition-fast);
  font-size: 16px;
  line-height: 1;
  min-width: 35px;
  min-height: 35px;
}
.action-button:hover { background: var(--surface-tertiary); transform: scale(1.05); }
.error-button { background: var(--error-bg); border-color: var(--error-border); color: var(--error-text); }
.error-button:hover { background: var(--error-bg-hover); border-color: var(--error-border-hover); transform: scale(1.05); }
.error-button:active, .copy-button:active { transform: scale(0.95); }
.copy-button {
  padding: 8px 12px;
  background: v-bind(copyButtonColor);
  color: var(--text-on-primary);
  border: none;
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all var(--transition-fast);
  height: 35px;
}
.copy-button:hover { background: v-bind(copyButtonHoverColor); transform: scale(1.05); }
.copy-button .icon { width: 16px; height: 16px; flex-shrink: 0; }
.icon { display: block; }
</style>
