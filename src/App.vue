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

const generateDiffDescription = () => {
  if (!config.value || !originalConfig.value) return ''

  const changes: string[] = []

  // Helper function to format version changes
  const formatVersionChange = (oldVersion: string, newVersion: string) => {
    return `<span class="old-version">${oldVersion}</span> → <span class="new-version">${newVersion}</span>`
  }

  // Check manifest and platform changes
  if (config.value.ManifestVersion !== originalConfig.value.ManifestVersion) {
    changes.push(`• Manifest Version: ${formatVersionChange(originalConfig.value.ManifestVersion, config.value.ManifestVersion)}`)
  }

  if (config.value.PlatformVersion !== originalConfig.value.PlatformVersion) {
    changes.push(`• Platform Version: ${formatVersionChange(originalConfig.value.PlatformVersion, config.value.PlatformVersion)}`)
  }

  if (config.value.PlatformImage !== originalConfig.value.PlatformImage) {
    changes.push(`• Platform Image: ${formatVersionChange(originalConfig.value.PlatformImage, config.value.PlatformImage)}`)
  }

  if (config.value.PlatformImageTag !== originalConfig.value.PlatformImageTag) {
    changes.push(`• Platform Image Tag: ${formatVersionChange(originalConfig.value.PlatformImageTag, config.value.PlatformImageTag)}`)
  }

  if (config.value.PlatformAssetUrl !== originalConfig.value.PlatformAssetUrl) {
    changes.push(`• Platform Asset URL: ${formatVersionChange(originalConfig.value.PlatformAssetUrl, config.value.PlatformAssetUrl)}`)
  }

  // Check Module Sources changes
  if (config.value.ModuleSources[0] !== originalConfig.value.ModuleSources[0]) {
    changes.push(`• Module Sources: ${formatVersionChange(originalConfig.value.ModuleSources[0], config.value.ModuleSources[0])}`)
  }

  // Helper function to get version from any module
  const getVersion = (module: ModuleBase, type: string) => {
    if (type === 'GithubReleases') {
      return module.Version || '(none)'
    } else {
      if (!module.BlobName) return '(none)'
      const parts = module.BlobName.split('_')
      return parts.length > 1 ? parts[1] : '(none)'
    }
  }

  // Track all modules to detect moves between sources
  const processedModules = new Set<string>()

  // Check each source for changes
  config.value.Sources.forEach((source: {
    Name: string,
    Modules: ModuleBase[]
  }) => {

    source.Modules.forEach(module => {
      const moduleId = module.Id || module.BlobName?.split('_')[0] || ''
      processedModules.add(moduleId)

      let originalModule: ModuleBase | null = null
      let originalSourceType: string | null = null

      originalConfig.value?.Sources.forEach(origSource => {
        const found = origSource.Modules.find(m =>
          origSource.Name === 'GithubReleases' ? m.Id === moduleId : m.BlobName?.startsWith(moduleId)
        )
        if (found) {
          originalModule = found
          originalSourceType = origSource.Name
        }
      })

      if (!originalModule) {
        changes.push(`• ${moduleId}: added to ${source.Name}`)
      } else if (originalSourceType !== source.Name) {
        const oldVersion = getVersion(originalModule, originalSourceType!)
        const newVersion = getVersion(module, source.Name)
        changes.push(`• ${moduleId}: moved from ${originalSourceType} to ${source.Name} (${formatVersionChange(oldVersion, newVersion)})`)
      } else if (source.Name === 'GithubReleases') {
        const typedOriginalModule = originalModule as { Version?: string }
        if (typedOriginalModule.Version !== (module as { Version?: string }).Version) {
          changes.push(`• ${moduleId}: ${formatVersionChange(typedOriginalModule.Version || '(none)', (module as { Version?: string }).Version || '(none)')}`)
        }
      } else {
        const currentVersion = getVersion(module, source.Name)
        const originalVersion = getVersion(originalModule, source.Name)
        if (currentVersion !== originalVersion) {
          changes.push(`• ${moduleId}: ${formatVersionChange(originalVersion, currentVersion)}`)
        }
      }
    })
  })

  // Check for removed modules
  originalConfig.value.Sources.forEach(originalSource => {
    originalSource.Modules.forEach(originalModule => {
      const moduleId = originalModule.Id || originalModule.BlobName?.split('_')[0] || ''
      if (!processedModules.has(moduleId)) {
        changes.push(`• ${moduleId}: removed from ${originalSource.Name}`)
      }
    })
  })

  return changes.length ? changes.join('\n') : 'No changes'
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
              <pre class="diff-text" v-html="generateDiffDescription()"></pre>
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
  font-size: 16px; /* Increased font size for emoji */
  line-height: 1;
  min-width: 35px;
  min-height: 35px;
}

.action-button:hover {
  background: #f0f0f0;
  transform: scale(1.05);
}

.action-button:active {
  transform: scale(0.95);
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

.diff-text {
  margin: 0;
  font-family: monospace;
  font-size: 14px;
  line-height: 1.5;
  white-space: pre-wrap;
}

.diff-text :deep(.old-version) {
  color: #d32f2f;
  text-decoration: line-through;
  padding: 0 2px;
}

.diff-text :deep(.new-version) {
  color: #2e7d32;
  padding: 0 2px;
  font-weight: bold;
}

.copy-button {
  padding: 8px 16px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: background-color 0.2s;
}

.copy-button:hover {
  background: #0056b3;
}

.copy-button:active {
  background: #004494;
}

.error-button {
  color: #d32f2f;
  border-color: #d32f2f;
}

.error-button:hover {
  background: #fff5f5;
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
