<script setup lang="ts">
import { ref, computed } from 'vue'
import { useConfigState } from './composables/useConfigState'
import { useJsonGenerator } from './composables/useJsonGenerator'
import { useDiffTracker } from './composables/useDiffTracker'
import { useManifestLoader } from './composables/useManifestLoader'
import JsonInput from './components/JsonInput.vue'
import ModuleList from './components/ModuleList.vue'
import PlatformConfig from './components/PlatformConfig.vue'
import JsonOutput from './components/JsonOutput.vue'
import DiffPreview from './components/DiffPreview.vue'
import ThemeToggle from './components/ThemeToggle.vue'
import ToastContainer from './components/ToastContainer.vue'
import SkeletonLoader from './components/SkeletonLoader.vue'
import { useToast } from './composables/useToast'
import { highlightJson } from './utils/jsonHighlight'

const { config, originalConfig, shouldSortModules, parseConfig, updateModule, updatePlatform, resetToOriginal } = useConfigState()
const { generateJson, copyToClipboard } = useJsonGenerator()
const { changes } = useDiffTracker(config, originalConfig)
const { isLoading, error, manifestUrl, fetchManifest, loadFromHistory, clearManifestUrl, getInitialUrl } = useManifestLoader()
const { addToast } = useToast()

const moduleListRef = ref<InstanceType<typeof ModuleList> | null>(null)
const platformConfigRef = ref<InstanceType<typeof PlatformConfig> | null>(null)

const json = computed(() => generateJson(config.value, shouldSortModules.value))
const jsonHtml = computed(() => highlightJson(json.value))

const hasInvalidInputs = computed(() =>
  moduleListRef.value?.hasInvalidInputs || platformConfigRef.value?.hasInvalidInputs
)

const initialUrl = getInitialUrl()
if (initialUrl) {
  fetchManifest(initialUrl).then(text => {
    if (text) parseConfig(text)
  })
}

const scrollToFirstInvalidInput = () => {
  if (platformConfigRef.value?.hasInvalidInputs) {
    platformConfigRef.value.scrollToFirstInvalidInput()
  } else if (moduleListRef.value?.hasInvalidInputs) {
    moduleListRef.value.scrollToFirstInvalidInput()
  }
}

const scrollToModule = (moduleId: string) => {
  const el = document.querySelector(`[data-module-id="${moduleId.trim()}"]`) as HTMLElement
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    el.classList.add('highlight')
    setTimeout(() => el.classList.remove('highlight'), 2000)
  }
}

const handleJsonSubmit = (text: string) => parseConfig(text)
async function handleUrlSubmit(url: string) {
  const text = await fetchManifest(url)
  if (text) parseConfig(text)
}
async function handleHistoryClick(url: string) {
  const text = await loadFromHistory(url)
  if (text) parseConfig(text)
}
const handleBack = () => {
  config.value = null
  originalConfig.value = null
  clearManifestUrl()
}
const handleCopy = async () => {
  const ok = await copyToClipboard(json.value)
  addToast(ok ? 'JSON copied to clipboard' : 'Failed to copy', ok ? 'success' : 'error')
}
</script>

<template>
  <div class="app">
    <header class="app-header">
      <div class="header-left">
        <button v-if="config" class="back-button" @click="handleBack">Back</button>
        <h1>Module Configuration Manager</h1>
      </div>
      <div class="header-right">
        <button
          v-if="config && hasInvalidInputs"
          class="action-button error-button"
          @click="scrollToFirstInvalidInput"
        >Errors</button>
        <ThemeToggle />
      </div>
    </header>

    <SkeletonLoader v-if="isLoading && !config" />

    <div v-else-if="!config" class="json-input-container">
      <JsonInput
        v-model:sort-modules="shouldSortModules"
        :is-loading="isLoading"
        :error="error"
        @submit="handleJsonSubmit"
        @fetch-url="handleUrlSubmit"
        @history-click="handleHistoryClick"
      />
    </div>

    <template v-else>
      <div v-if="manifestUrl" class="manifest-url-bar">
        <a :href="manifestUrl" target="_blank" rel="noopener noreferrer">{{ manifestUrl }}</a>
      </div>
      <div class="main-layout">
        <div class="config-column">
          <PlatformConfig ref="platformConfigRef" :config="config" @update="updatePlatform" />
          <ModuleList ref="moduleListRef" :config="config" :sort-enabled="shouldSortModules" @module-update="updateModule" />
        </div>
        <div class="sidebar">
          <div class="sidebar-actions">
            <button class="action-button" popovertarget="json-preview">Preview</button>
            <button class="action-button" @click="handleCopy">Copy</button>
            <button class="reset-button" @click="resetToOriginal">Reset</button>
          </div>
          <DiffPreview
            :changes="changes"
            @scroll-to-module="scrollToModule"
          />
        </div>
      </div>
    </template>

    <!-- JSON Preview Popover -->
    <div id="json-preview" popover class="preview-popover">
      <div class="popover-content">
        <pre v-html="jsonHtml"></pre>
      </div>
    </div>

    <ToastContainer />
  </div>
</template>

<style scoped>
.app {
  width: 100%;
  max-width: 1800px;
  margin: 0 auto;
  padding: 20px;
  box-sizing: border-box;
}

.app-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

h1 {
  color: var(--text-on-app);
  font-size: 28px;
  font-weight: 600;
}

.back-button, .action-button {
  background: transparent;
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-sm);
  color: var(--text-primary);
  font-size: 13px;
  cursor: pointer;
  padding: 6px 12px;
  transition: all var(--transition-fast);
}

.back-button:hover, .action-button:hover {
  background: var(--surface-tertiary);
}

.error-button {
  color: var(--error-text);
  border-color: var(--error-border);
}

.error-button:hover {
  background: var(--error-bg);
}

.header-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.reset-button {
  padding: 6px 12px;
  background: transparent;
  border: 1px solid var(--error-border);
  border-radius: var(--radius-sm);
  color: var(--error-text);
  font-size: 13px;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.reset-button:hover {
  background: var(--error-bg);
}

.manifest-url-bar {
  margin-bottom: 16px;
  padding: 8px 14px;
  background: var(--surface-secondary);
  border-radius: var(--radius-sm);
  font-size: 13px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.manifest-url-bar a {
  color: var(--link);
  text-decoration: none;
  font-family: monospace;
}

.manifest-url-bar a:hover {
  color: var(--link-hover);
  text-decoration: underline;
}

.json-input-container {
  width: 100%;
  max-width: 1600px;
  margin: 0 auto;
}

.main-layout {
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: 24px;
  align-items: start;
}

.config-column {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.sidebar {
  position: sticky;
  top: 20px;
  max-height: calc(100vh - 120px);
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.sidebar-actions {
  display: flex;
  gap: 8px;
}

/* Popover */
.preview-popover {
  margin: auto;
  padding: 0;
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-md);
  background: var(--surface-card);
  box-shadow: var(--shadow-md);
  width: min(90vw, 800px);
  height: min(85vh, 800px);
  overflow: hidden;
}

.preview-popover::backdrop {
  background: rgba(0, 0, 0, 0.4);
}

.popover-content {
  height: 100%;
  overflow: auto;
  padding: 20px;
}

.popover-content pre {
  margin: 0;
  font-family: monospace;
  font-size: 14px;
  line-height: 1.5;
  color: var(--text-primary);
  white-space: pre-wrap;
  word-break: break-word;
}

.popover-content :deep(.json-key) { color: var(--json-key); }
.popover-content :deep(.json-string) { color: var(--json-string); }
.popover-content :deep(.json-number) { color: var(--json-number); }
.popover-content :deep(.json-bool) { color: var(--json-bool); }

@keyframes highlight {
  0% { background-color: transparent; }
  20% { background-color: var(--warning-bg); }
  80% { background-color: var(--warning-bg); }
  100% { background-color: transparent; }
}

:deep(.highlight) {
  animation: highlight 2s ease-in-out;
}
</style>
