<script setup lang="ts">
import { ref, computed } from 'vue'
import { useConfigState } from './composables/useConfigState'
import { useJsonGenerator } from './composables/useJsonGenerator'
import { useDiffTracker } from './composables/useDiffTracker'
import JsonInput from './components/JsonInput.vue'
import ModuleList from './components/ModuleList.vue'
import PlatformConfig from './components/PlatformConfig.vue'
import JsonOutput from './components/JsonOutput.vue'
import ThemeToggle from './components/ThemeToggle.vue'
import ToastContainer from './components/ToastContainer.vue'

const { config, originalConfig, shouldSortModules, parseConfig, updateModule, updatePlatform } = useConfigState()
const { generateJson } = useJsonGenerator()
const { changes } = useDiffTracker(config, originalConfig)

const showDiff = ref(true)
const moduleListRef = ref<InstanceType<typeof ModuleList> | null>(null)
const platformConfigRef = ref<InstanceType<typeof PlatformConfig> | null>(null)

const json = computed(() => generateJson(config.value, shouldSortModules.value))

const hasInvalidInputs = computed(() =>
  moduleListRef.value?.hasInvalidInputs || platformConfigRef.value?.hasInvalidInputs
)

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

const handleJsonSubmit = (jsonString: string, sort: boolean) => {
  parseConfig(jsonString, sort)
}
</script>

<template>
  <div class="app">
    <header class="app-header">
      <h1>Module Configuration Manager</h1>
      <ThemeToggle />
    </header>

    <div v-if="!config" class="json-input-container">
      <JsonInput @submit="handleJsonSubmit" />
    </div>

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

h1 {
  color: var(--text-inverse);
  font-size: 28px;
  font-weight: 600;
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
