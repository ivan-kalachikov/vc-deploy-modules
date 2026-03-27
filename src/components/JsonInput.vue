<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useUrlSearchParams } from '@vueuse/core'
import { useManifestHistory } from '../composables/useManifestHistory'
import { useToast } from '../composables/useToast'

const sortModules = defineModel<boolean>('sortModules', { default: true })

const params = useUrlSearchParams('history')
const jsonInput = ref('')
const jsonUrl = ref('')
const isLoading = ref(false)
const error = ref('')
const { history, addEntry, removeEntry, touchEntry } = useManifestHistory()
const { addToast } = useToast()

// Auto-fetch from manifest-url query param on mount
onMounted(() => {
  const urlParam = params['manifest-url']
  const url = Array.isArray(urlParam) ? urlParam[0] : urlParam
  if (url) {
    jsonUrl.value = url
    fetchAndSubmit(url)
  }
})

const emit = defineEmits<{
  submit: [value: string]
}>()

const handleSubmit = () => {
  if (!jsonInput.value.trim()) return
  emit('submit', jsonInput.value)
}

const handleTextareaInput = (e: Event) => {
  jsonInput.value = (e.target as HTMLTextAreaElement).value
}

// Convert GitHub blob/tree URLs to raw.githubusercontent.com
// e.g. https://github.com/VirtoCommerce/vc-deploy-dev/blob/vcst-dev/backend/packages.json
//   -> https://raw.githubusercontent.com/VirtoCommerce/vc-deploy-dev/vcst-dev/backend/packages.json
function toRawUrl(url: string): string {
  const ghMatch = url.match(
    /^https?:\/\/github\.com\/([^/]+\/[^/]+)\/(?:blob|tree)\/(.+)$/,
  )
  if (ghMatch) return `https://raw.githubusercontent.com/${ghMatch[1]}/${ghMatch[2]}`
  return url
}

async function fetchAndSubmit(url: string) {
  const trimmed = url.trim()
  if (!trimmed) return

  isLoading.value = true
  error.value = ''
  try {
    const rawUrl = toRawUrl(trimmed)
    const response = await fetch(rawUrl)
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const text = await response.text()
    JSON.parse(text) // validate
    addEntry(trimmed) // store original URL, not raw
    params['manifest-url'] = trimmed
    emit('submit', text)
  } catch (e) {
    error.value = `Failed to fetch: ${(e as Error).message}`
  } finally {
    isLoading.value = false
  }
}

const handleUrlSubmit = () => fetchAndSubmit(jsonUrl.value)

function handleHistoryClick(url: string) {
  touchEntry(url)
  fetchAndSubmit(url)
}
</script>

<template>
  <div class="json-input">
    <!-- URL Input -->
    <h2>Load from URL</h2>
    <div class="url-row">
      <input
        v-model="jsonUrl"
        type="text"
        placeholder="https://example.com/packages.json"
        class="url-input"
        @keyup.enter="handleUrlSubmit"
      />
      <button type="button" :disabled="isLoading" @click="handleUrlSubmit">
        {{ isLoading ? 'Loading...' : 'Fetch' }}
      </button>
    </div>

    <!-- History -->
    <div v-if="history.length" class="history">
      <h3>History</h3>
      <ul>
        <li v-for="entry in history" :key="entry.url">
          <button class="history-link" @click="handleHistoryClick(entry.url)" :title="entry.url">
            {{ entry.label }}
          </button>
          <button class="history-delete" @click="removeEntry(entry.url)" title="Remove">&times;</button>
        </li>
      </ul>
    </div>

    <div v-if="error" class="error">{{ error }}</div>

    <!-- Textarea -->
    <h2 class="paste-heading">Or paste JSON</h2>
    <textarea
      :value="jsonInput"
      rows="20"
      placeholder="Paste your JSON here..."
      @input="handleTextareaInput"
    />
    <div class="input-controls">
      <button type="button" @click="handleSubmit">Load Configuration</button>
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

/* History */
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
  background: rgba(255, 255, 255, 0.1);
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

/* Textarea & controls */
.json-input textarea {
  width: 100%;
  margin-bottom: 10px;
  padding: 20px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-secondary);
  font-family: monospace;
  font-size: 14px;
  line-height: 1.5;
  min-height: 300px;
  box-sizing: border-box;
  text-align: left;
  background: var(--surface-card);
  color: var(--text-primary);
}

.error {
  color: var(--error-text);
  margin: 8px 0;
}

button {
  width: fit-content;
  padding: 10px 20px;
  background: var(--primary);
  color: var(--text-on-primary);
  border: none;
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-size: 14px;
}

button:hover:not(:disabled) {
  background: var(--primary-hover);
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
