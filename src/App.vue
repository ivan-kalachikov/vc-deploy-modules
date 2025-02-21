<script setup lang="ts">
import { ref, computed } from 'vue'
import type { ConfigurationData, ModuleType, ModuleBase } from './types'
import JsonInput from './components/JsonInput.vue'
import ModuleList from './components/ModuleList.vue'
import PlatformConfig from './components/PlatformConfig.vue'

const config = ref<ConfigurationData | null>(null)
const originalConfig = ref<ConfigurationData | null>(null)
const jsonError = ref<string>('')
const showDiff = ref(true)
const shouldSortModules = ref(true)
const moduleListRef = ref()
const platformConfigRef = ref()

const handleJsonSubmit = (jsonString: string, sort: boolean) => {
  try {
    const parsed = JSON.parse(jsonString)
    config.value = parsed
    originalConfig.value = JSON.parse(jsonString)
    jsonError.value = ''
    shouldSortModules.value = sort
  } catch (e) {
    jsonError.value = 'Invalid JSON format' + (e as Error).message
  }
}

const handleModuleUpdate = (moduleId: string, type: ModuleType, value: string) => {
  if (!config.value) return

  const newConfig = JSON.parse(JSON.stringify(config.value))
  const sourceIndex = newConfig.Sources.findIndex((s: { Name: string }) => s.Name === type)

  if (sourceIndex === -1) return

  const source = newConfig.Sources[sourceIndex]
  const moduleIndex = source.Modules.findIndex((m: ModuleBase) =>
    type === 'GithubReleases' ? m.Id === moduleId : m.BlobName?.startsWith(moduleId)
  )

  if (value === '__DELETE__') {
    source.Modules.splice(moduleIndex, 1)
  } else if (moduleIndex === -1) {
    const newModule = type === 'GithubReleases'
      ? { Id: moduleId, Version: value }
      : { BlobName: value || `${moduleId}_` }
    source.Modules.push(newModule)
  } else {
    const module = source.Modules[moduleIndex]
    if (type === 'GithubReleases') {
      module.Version = value
    } else {
      module.BlobName = value || `${moduleId}_`
    }
  }

  config.value = newConfig
}

const handlePlatformUpdate = (newConfig: ConfigurationData) => {
  config.value = newConfig
}

const generateJson = () => {
  if (!config.value) return ''

  const newConfig = JSON.parse(JSON.stringify(config.value))

  if (shouldSortModules.value) {
    // Helper function to get module ID for sorting
    const getModuleId = (module: ModuleBase) => {
      if (module.Id) return module.Id
      return module.BlobName?.split('_')[0] || ''
    }

    // Sort Sources array and their modules
    newConfig.Sources = newConfig.Sources
      .sort((a: { Name: string }, b: { Name: string }) => a.Name.localeCompare(b.Name))
      .map((source: {
        Name: string,
        Modules: ModuleBase[],
        Container?: string,
        ServiceUri?: string,
        ModuleSources?: string[]
      }) => {
        // First sort the modules array
        const sortedModules = [...source.Modules].sort((a, b) =>
          getModuleId(a).localeCompare(getModuleId(b))
        )

        return {
          Name: source.Name,
          ...(source.Name === 'AzureBlob'
            ? {
                Container: source.Container,
                ServiceUri: source.ServiceUri,
              }
            : {
                ModuleSources: source.ModuleSources ? [...source.ModuleSources].sort() : [],
              }
          ),
          Modules: sortedModules
        }
      })

    // Sort ModuleSources array
    newConfig.ModuleSources = [...newConfig.ModuleSources].sort()
  }

  // Return sorted object with fixed field order
  return JSON.stringify({
    ManifestVersion: newConfig.ManifestVersion,
    PlatformVersion: newConfig.PlatformVersion,
    PlatformImage: newConfig.PlatformImage,
    PlatformImageTag: newConfig.PlatformImageTag,
    PlatformAssetUrl: newConfig.PlatformAssetUrl,
    ModuleSources: newConfig.ModuleSources,
    Sources: newConfig.Sources
  }, null, 2)
}

const copyToClipboard = async () => {
  const json = generateJson()
  try {
    await navigator.clipboard.writeText(json)
  } catch (err) {
    console.error('Failed to copy text: ', err)
  }
}

// Add new block for diff items
interface DiffItem {
  moduleId?: string
  text: string
}

const diffItems = computed<DiffItem[]>(() => {
  const items: DiffItem[] = []
  if (!config.value || !originalConfig.value) return items

  // Platform changes:
  if (config.value.ManifestVersion !== originalConfig.value.ManifestVersion) {
    items.push({
      text: `Manifest Version changed from <span class="old-version">${originalConfig.value.ManifestVersion}</span> to <span class="new-version">${config.value.ManifestVersion}</span>`
    })
  }
  if (config.value.PlatformVersion !== originalConfig.value.PlatformVersion) {
    items.push({
      text: `Platform Version changed from <span class="old-version">${originalConfig.value.PlatformVersion}</span> to <span class="new-version">${config.value.PlatformVersion}</span>`
    })
  }
  if (config.value.PlatformImage !== originalConfig.value.PlatformImage) {
    items.push({
      text: `Platform Image changed from <span class="old-version">${originalConfig.value.PlatformImage}</span> to <span class="new-version">${config.value.PlatformImage}</span>`
    })
  }
  if (config.value.PlatformImageTag !== originalConfig.value.PlatformImageTag) {
    items.push({
      text: `Platform Image Tag changed from <span class="old-version">${originalConfig.value.PlatformImageTag}</span> to <span class="new-version">${config.value.PlatformImageTag}</span>`
    })
  }
  if (config.value.PlatformAssetUrl !== originalConfig.value.PlatformAssetUrl) {
    items.push({
      text: `Platform Asset URL changed from <span class="old-version">${originalConfig.value.PlatformAssetUrl}</span> to <span class="new-version">${config.value.PlatformAssetUrl}</span>`
    })
  }

  // Module changes:
  config.value.Sources.forEach(source => {
    source.Modules.forEach(module => {
      const moduleId = module.Id || module.BlobName?.split('_')[0] || ''
      if (!moduleId) return
      let originalModule: ModuleBase | undefined
      let originalSourceName: string | undefined
      originalConfig.value?.Sources.forEach(origSource => {
        const found = origSource.Modules.find(m =>
          origSource.Name === 'GithubReleases' ? m.Id === moduleId : m.BlobName?.startsWith(moduleId)
        )
        if (found) {
          originalModule = found
          originalSourceName = origSource.Name
        }
      })

      if (!originalModule) {
        items.push({
          moduleId,
          text: `added to ${source.Name}`
        })
      } else if (originalSourceName !== source.Name) {
        items.push({
          moduleId,
          text: `moved from ${originalSourceName} with ${
            originalSourceName === 'GithubReleases'
              ? `<span class="old-version">${originalModule.Version || '(none)'}</span>`
              : `<span class="old-version">${originalModule.BlobName?.split('_')[1] || '(none)'}</span>`
          } to ${source.Name} with ${
            source.Name === 'GithubReleases'
              ? `<span class="new-version">${module.Version || '(none)'}</span>`
              : `<span class="new-version">${module.BlobName?.split('_')[1] || '(none)'}</span>`
          }`
        })
      } else if (source.Name === 'GithubReleases') {
        if (originalModule.Version !== module.Version) {
          items.push({
            moduleId,
            text: `version changed from <span class="old-version">${originalModule.Version || '(none)'}</span> to <span class="new-version">${module.Version || '(none)'}</span>`
          })
        }
      } else {
        if (originalModule.BlobName !== module.BlobName) {
          items.push({
            moduleId,
            text: `BlobName changed from <span class="old-version">${originalModule.BlobName || '(none)'}</span> to <span class="new-version">${module.BlobName || '(none)'}</span>`
          })
        }
      }
    })
  })

  return items
})

// New helper: scroll to module field
const scrollToModule = (moduleId?: string) => {
  if (!moduleId) return
  const id = moduleId.trim()
  const el = document.querySelector(`[data-module-id="${id}"]`) as HTMLElement
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    // Optional: highlight the field briefly
    el.classList.add('highlight')
    setTimeout(() => el.classList.remove('highlight'), 2000)
  }
}

const hasInvalidInputs = computed(() => {
  return moduleListRef.value?.hasInvalidInputs || platformConfigRef.value?.hasInvalidInputs
})

const scrollToFirstInvalidInput = () => {
  if (platformConfigRef.value?.hasInvalidInputs) {
    platformConfigRef.value.scrollToFirstInvalidInput()
  } else if (moduleListRef.value?.hasInvalidInputs) {
    moduleListRef.value.scrollToFirstInvalidInput()
  }
}
</script>

<template>
  <div class="app">
    <h1>Module Configuration Manager</h1>

    <div v-if="!config" class="json-input-container">
      <JsonInput :error="jsonError" @submit="handleJsonSubmit" />
    </div>

    <template v-else>
      <div class="main-layout">
        <div class="config-column">
          <PlatformConfig
            ref="platformConfigRef"
            :config="config"
            @update="handlePlatformUpdate"
          />
          <ModuleList
            ref="moduleListRef"
            :config="config"
            :sort-enabled="shouldSortModules"
            @module-update="handleModuleUpdate"
          />
        </div>
        <div class="json-column">
          <div class="json-output">
            <div class="json-header">
              <h2>Generated JSON</h2>
              <div class="json-actions">
                <button
                  v-if="hasInvalidInputs"
                  class="action-button error-button"
                  title="Some fields have invalid values"
                  @click="scrollToFirstInvalidInput()"
                >
                  ⚠️
                </button>
                <button
                  class="action-button"
                  :title="showDiff ? 'Hide Changes' : 'Show Changes'"
                  @click="showDiff = !showDiff"
                >
                  {{ showDiff ? '⬆️' : '⬇️' }}
                </button>
                <button class="copy-button" @click="copyToClipboard">
                  <svg class="icon" viewBox="0 0 24 24" width="16" height="16">
                    <path fill="currentColor" d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
                  </svg>
                  Copy
                </button>
              </div>
            </div>
            <div v-if="showDiff" class="diff-preview">
              <h3>Changes:</h3>
              <ul>
                <li v-for="(item, index) in diffItems" :key="index">
                  <template v-if="item.moduleId">
                    <button
                      class="module-id-button"
                      @click="scrollToModule(item.moduleId)"
                    >
                      {{ item.moduleId }}
                    </button>
                    <span>: </span>
                    <span v-html="item.text"></span>
                  </template>
                  <template v-else>
                    <span v-html="item.text"></span>
                  </template>
                </li>
              </ul>
            </div>
            <pre>{{ generateJson() }}</pre>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.app {
  width: 100%;
  margin: 0 auto;
  padding: 20px;
  box-sizing: border-box;
  max-width: 1800px;
}

.json-input-container {
  width: 100%;
  max-width: 1600px;
  margin: 0 auto;
}

h1 {
  color: white;
  margin-bottom: 30px;
  font-size: 28px;
  font-weight: 600;
}

.main-layout {
  display: grid;
  grid-template-columns: minmax(550px, 2fr) minmax(350px, 1fr);
  gap: 30px;
  align-items: start;
  min-height: calc(100vh - 120px); /* Full height minus header and padding */
}

.config-column {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.json-column {
  position: sticky;
  top: 20px;
  height: calc(100vh - 120px); /* Match layout height */
  overflow: hidden; /* Prevent double scrollbars */
}

.json-output {
  background: #f8f8f8;
  border-radius: 8px;
  padding: 20px;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.json-output h2 {
  color: #333;
  margin-bottom: 20px;
  font-weight: 600;
  font-size: 18px;
}

.json-output pre {
  background: white;
  padding: 15px;
  border-radius: 4px;
  border: 1px solid #ddd;
  color: #333;
  font-family: monospace;
  font-size: 14px;
  line-height: 1.5;
  flex: 1;
  overflow: auto;
  margin: 0;
}

.json-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.json-header h2 {
  margin-bottom: 0;
}

.json-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.action-button {
  padding: 8px;
  background: transparent;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  color: #666;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  font-size: 16px;
  line-height: 1;
  min-width: 35px;
  min-height: 35px;
}

.error-button {
  background: #fff2f0;
  border-color: #ffccc7;
  color: #ff4d4f;
}

.error-button:hover {
  background: #fff1f0;
  border-color: #ffa39e;
  color: #ff7875;
  transform: scale(1.05);
}

.error-button:active {
  transform: scale(0.95);
}

.action-button:hover {
  background: #f0f0f0;
  transform: scale(1.05);
}

.copy-button {
  padding: 8px 12px;
  background: v-bind(hasInvalidInputs ? '#ff7875' : '#52c41a');
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s;
  height: 35px;
}

.copy-button:hover {
  background: v-bind(hasInvalidInputs ? '#ff4d4f' : '#389e0d');
  transform: scale(1.05);
}

.copy-button:active {
  transform: scale(0.95);
}

.copy-button .icon {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

.icon {
  display: block;
}

.diff-preview {
  background: white;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 15px;
  margin-bottom: 15px;
}

.diff-preview h3 {
  color: #333;
  font-size: 14px;
  margin: 0 0 10px 0;
  font-weight: bold;
}

.diff-preview ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.diff-preview li {
  padding: 8px 0;
  border-bottom: 1px solid #eee;
  color: #444;
  font-size: 14px;
  line-height: 1.5;
}

.diff-preview li:last-child {
  border-bottom: none;
}

.module-id-button {
  background: none;
  border: none;
  color: #4a6ee0;
  cursor: pointer;
  font-family: monospace;
  font-weight: 500;
  padding: 0;
  text-decoration: underline;
}

.module-id-button:hover {
  color: #3d5bc4;
}

/* Update colors for old/new versions */
:deep(.old-version) {
  color: #cc0000;
  text-decoration: line-through;
  padding: 0 2px;
  background-color: #ffebee;
}

:deep(.new-version) {
  color: #1b5e20;
  padding: 0 2px;
  font-weight: bold;
  background-color: #e8f5e9;
}

/* Update highlight animation with better contrast */
@keyframes highlight {
  0% { background-color: transparent; }
  20% { background-color: #fff0c0; }
  80% { background-color: #fff0c0; }
  100% { background-color: transparent; }
}

:deep(.highlight) {
  animation: highlight 2s ease-in-out;
}
</style>

<style>
.app-container {
  display: flex;
  height: 100vh;
}

/* Remove or comment out the sidebar styles since they're not being used */
/* .sidebar {
  width: 800px;
  height: 100%;
  overflow-y: auto;
  padding: 20px;
  border-right: 1px solid #ddd;
  background: white;
}

.main-content {
  flex: 1;
  height: 100%;
  overflow-y: auto;
  padding: 20px;
  background: #f5f5f5;
} */
</style>
