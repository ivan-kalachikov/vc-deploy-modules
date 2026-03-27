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
import ThemeToggle from './components/ThemeToggle.vue'
import ToastContainer from './components/ToastContainer.vue'
import SkeletonLoader from './components/SkeletonLoader.vue'

const { config, originalConfig, shouldSortModules, parseConfig, updateModule, updatePlatform, resetToOriginal } = useConfigState()
const { generateJson } = useJsonGenerator()
const { changes } = useDiffTracker(config, originalConfig)
const { isLoading, error, fetchManifest, loadFromHistory, clearManifestUrl, getInitialUrl } = useManifestLoader()

const showDiff = ref(true)
const moduleListRef = ref<InstanceType<typeof ModuleList> | null>(null)
const platformConfigRef = ref<InstanceType<typeof PlatformConfig> | null>(null)

const json = computed(() => generateJson(config.value, shouldSortModules.value))

const hasInvalidInputs = computed(() =>
  moduleListRef.value?.hasInvalidInputs || platformConfigRef.value?.hasInvalidInputs
)

// Determine initial state: if URL param exists, start fetching immediately
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

const handleJsonSubmit = (text: string) => {
  parseConfig(text)
}

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
</script>

<template>
  <div class="app">
    <header class="app-header">
      <div class="header-left">
        <button v-if="config" class="back-button" @click="handleBack" title="Back to input">&larr;</button>
        <h1>Module Configuration Manager</h1>
      </div>
      <div class="header-right">
        <button v-if="config" class="reset-button" @click="resetToOriginal" title="Discard all changes">Reset</button>
        <ThemeToggle />
      </div>
    </header>

    <!-- Loading from URL param -->
    <SkeletonLoader v-if="isLoading && !config" />

    <!-- Input screen -->
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

    <!-- Config screen -->
    <template v-else>
      <div class="main-layout">
        <div class="config-column">
          <PlatformConfig ref="platformConfigRef" :config="config" @update="updatePlatform" />
          <ModuleList ref="moduleListRef" :config="config" :sort-enabled="shouldSortModules" @module-update="updateModule" />
        </div>
        <div class="json-column">
          <JsonOutput
            :json="json"
            :has-errors="!!hasInvalidInputs"
            :show-diff="showDiff"
            :changes="changes"
            @toggle-diff="showDiff = !showDiff"
            @scroll-to-error="scrollToFirstInvalidInput"
            @scroll-to-module="scrollToModule"
          />
        </div>
      </div>
    </template>

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

.back-button {
  background: none;
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-sm);
  color: var(--text-on-app);
  font-size: 20px;
  cursor: pointer;
  padding: 4px 12px;
  line-height: 1;
  transition: all var(--transition-fast);
}

.back-button:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: var(--border-secondary);
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.reset-button {
  padding: 4px 12px;
  background: none;
  border: 1px solid var(--error-border);
  border-radius: var(--radius-sm);
  color: var(--error-text);
  font-size: 13px;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.reset-button:hover {
  background: var(--error-bg);
  border-color: var(--error);
}

.json-input-container {
  width: 100%;
  max-width: 1600px;
  margin: 0 auto;
}

.main-layout {
  display: grid;
  grid-template-columns: minmax(550px, 2fr) minmax(350px, 1fr);
  gap: 30px;
  align-items: start;
  min-height: calc(100vh - 120px);
}

.config-column {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.json-column {
  position: sticky;
  top: 20px;
  height: calc(100vh - 120px);
  overflow: hidden;
}

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
