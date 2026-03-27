<script setup lang="ts">
import { ref, computed } from 'vue'
import { useManifestHistory } from '../composables/useManifestHistory'
import { highlightJson } from '../utils/jsonHighlight'

const sortModules = defineModel<boolean>('sortModules', { default: true })

const props = defineProps<{
  isLoading: boolean
  error: string
}>()

const emit = defineEmits<{
  submit: [value: string]
  'fetch-url': [url: string]
  'history-click': [url: string]
}>()

const jsonInput = ref('')
const jsonUrl = ref('')
const { history, removeEntry } = useManifestHistory()

const highlighted = computed(() => highlightJson(jsonInput.value))
const editorRef = ref<HTMLTextAreaElement>()
const backdropRef = ref<HTMLPreElement>()

const handleTextareaInput = (e: Event) => {
  jsonInput.value = (e.target as HTMLTextAreaElement).value
}

const syncScroll = () => {
  if (editorRef.value && backdropRef.value) {
    backdropRef.value.scrollTop = editorRef.value.scrollTop
    backdropRef.value.scrollLeft = editorRef.value.scrollLeft
  }
}
</script>

<template>
  <div class="json-input">
    <h2>Load from URL</h2>
    <div class="url-row">
      <input
        v-model="jsonUrl"
        type="text"
        placeholder="https://example.com/packages.json"
        class="url-input"
        @keyup.enter="emit('fetch-url', jsonUrl)"
      />
      <button type="button" :disabled="isLoading" @click="emit('fetch-url', jsonUrl)">
        {{ isLoading ? 'Loading...' : 'Fetch' }}
      </button>
    </div>

    <div v-if="history.length" class="history">
      <h3>History</h3>
      <ul>
        <li v-for="entry in history" :key="entry.url">
          <button class="history-link" @click="emit('history-click', entry.url)" :title="entry.url">
            {{ entry.label }}
          </button>
          <button class="history-delete" @click="removeEntry(entry.url)" title="Remove">&times;</button>
        </li>
      </ul>
    </div>

    <div v-if="error" class="error">{{ error }}</div>

    <h2 class="paste-heading">Or paste JSON</h2>
    <div class="editor-wrap">
      <pre ref="backdropRef" class="editor-backdrop" aria-hidden="true" v-html="highlighted + '\n'"></pre>
      <textarea
        ref="editorRef"
        :value="jsonInput"
        rows="20"
        placeholder="Paste your JSON here..."
        spellcheck="false"
        @input="handleTextareaInput"
        @scroll="syncScroll"
      />
    </div>
    <div class="input-controls">
      <button type="button" @click="jsonInput.trim() && emit('submit', jsonInput)">Load Configuration</button>
      <label class="sort-checkbox">
        <input type="checkbox" v-model="sortModules">
        Sort modules
      </label>
    </div>
  </div>
</template>

<style scoped>
.json-input {
  display: flex;
  flex-direction: column;
  width: 100%;
}

h2 {
  color: var(--text-on-app);
  margin-bottom: 16px;
  font-size: 22px;
  font-weight: 600;
}

.paste-heading {
  margin-top: 24px;
}

.url-row {
  display: flex;
  gap: 8px;
}

.url-input {
  flex: 1;
  padding: 10px 14px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-secondary);
  font-size: 14px;
  background: var(--surface-card);
  color: var(--text-primary);
}

.url-input:focus {
  outline: none;
  border-color: var(--border-focus);
  box-shadow: 0 0 0 2px var(--border-focus-shadow);
}

.url-input::placeholder {
  color: var(--text-tertiary);
}

.history {
  margin-top: 16px;
}

.history h3 {
  color: var(--text-on-app);
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 8px;
  opacity: 0.7;
}

.history ul {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.history li {
  display: flex;
  align-items: center;
  gap: 4px;
}

.history-link {
  background: none;
  border: none;
  color: var(--link);
  cursor: pointer;
  font-size: 13px;
  font-family: monospace;
  padding: 4px 8px;
  border-radius: var(--radius-sm);
  text-align: left;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 600px;
  transition: background var(--transition-fast);
}

.history-link:hover {
  color: var(--link-hover);
  background: var(--surface-tertiary);
  text-decoration: underline;
}

.history-delete {
  background: none;
  border: none;
  color: var(--text-tertiary);
  cursor: pointer;
  font-size: 16px;
  padding: 2px 6px;
  border-radius: var(--radius-sm);
  line-height: 1;
  transition: color var(--transition-fast);
}

.history-delete:hover {
  color: var(--error-text);
}

.editor-wrap {
  position: relative;
  margin-bottom: 10px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-secondary);
  background: var(--surface-card);
}

.editor-wrap:focus-within {
  border-color: var(--border-focus);
  box-shadow: 0 0 0 2px var(--border-focus-shadow);
}

.editor-backdrop,
.editor-wrap textarea {
  padding: 20px;
  font-family: monospace;
  font-size: 14px;
  line-height: 1.5;
  white-space: pre-wrap;
  word-wrap: break-word;
  overflow-wrap: break-word;
  margin: 0;
  width: 100%;
  min-height: 300px;
  box-sizing: border-box;
}

.editor-backdrop {
  color: var(--text-primary);
  pointer-events: none;
  border-radius: var(--radius-sm);
}

.editor-backdrop :deep(.json-key) { color: var(--json-key); }
.editor-backdrop :deep(.json-string) { color: var(--json-string); }
.editor-backdrop :deep(.json-number) { color: var(--json-number); }
.editor-backdrop :deep(.json-bool) { color: var(--json-bool); }
.editor-backdrop :deep(.json-punct) { color: var(--text-tertiary); }

.editor-wrap textarea {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  resize: none;
  background: transparent;
  color: transparent;
  caret-color: var(--text-primary);
  border: none;
  outline: none;
  border-radius: var(--radius-sm);
}

.error {
  color: var(--error-text);
  margin: 8px 0;
}

button {
  width: fit-content;
  padding: 6px 12px;
  background: transparent;
  color: var(--text-primary);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-size: 13px;
  transition: all var(--transition-fast);
}

button:hover:not(:disabled) {
  background: var(--surface-tertiary);
}

button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.input-controls {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-top: 12px;
}

.sort-checkbox {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--text-on-app);
  cursor: pointer;
  user-select: none;
}

.sort-checkbox input {
  cursor: pointer;
}
</style>
