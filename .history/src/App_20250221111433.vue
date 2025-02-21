<script setup lang="ts">
import { ref } from 'vue'
import { ConfigurationData, ModuleType, ModuleBase } from './types'
import JsonInput from './components/JsonInput.vue'
import ModuleList from './components/ModuleList.vue'
import PlatformConfig from './components/PlatformConfig.vue'

const config = ref<ConfigurationData | null>(null)
const jsonError = ref<string>('')

const handleJsonSubmit = (jsonString: string) => {
  try {
    const parsed = JSON.parse(jsonString)
    config.value = parsed
    jsonError.value = ''
  } catch (e) {
    jsonError.value = 'Invalid JSON format'
  }
}

const handleModuleUpdate = (moduleId: string, type: ModuleType, value: string) => {
  if (!config.value) return

  const newConfig = JSON.parse(JSON.stringify(config.value)) // Use JSON parse/stringify instead of structuredClone
  const sourceIndex = newConfig.Sources.findIndex((s) => s.Name === type)

  if (sourceIndex === -1) return

  const source = newConfig.Sources[sourceIndex]
  const moduleIndex = source.Modules.findIndex((m) =>
    type === 'GithubReleases' ? m.Id === moduleId : m.BlobName?.startsWith(moduleId)
  )

  if (value === '__DELETE__') {
    // Remove module from this source
    source.Modules.splice(moduleIndex, 1)
  } else if (moduleIndex === -1) {
    // Add new module to this source
    source.Modules.push(
      type === 'GithubReleases'
        ? { Id: moduleId, Version: value }
        : { BlobName: value }
    )
  } else {
    // Update existing module
    if (type === 'GithubReleases') {
      (source.Modules[moduleIndex] as ModuleBase).Version = value
    } else {
      (source.Modules[moduleIndex] as ModuleBase).BlobName = value
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

  // Helper function to get module ID for sorting
  const getModuleId = (module: ModuleBase) => {
    if (module.Id) return module.Id
    return module.BlobName?.split('_')[0] || ''
  }

  // Sort Sources array and their modules
  newConfig.Sources = newConfig.Sources
    .sort((a, b) => a.Name.localeCompare(b.Name))
    .map((source) => {
      // First sort the modules array
      const sortedModules = [...source.Modules].sort((a, b) =>
        getModuleId(a).localeCompare(getModuleId(b))
      )

      return {
        // Sort fields within each Source
        Name: source.Name,
        ...(source.Name === 'AzureBlob'
          ? {
              Container: source.Container,
              ServiceUri: source.ServiceUri,
            }
          : {
              ModuleSources: [...source.ModuleSources].sort(),
            }
        ),
        Modules: sortedModules
      }
    })

  // Sort ModuleSources array
  newConfig.ModuleSources = [...newConfig.ModuleSources].sort()

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
</script>

<template>
  <div class="app">
    <h1>Module Configuration Manager</h1>

    <JsonInput v-if="!config" :error="jsonError" @submit="handleJsonSubmit" />

    <template v-else>
      <div class="main-layout">
        <div class="config-column">
          <PlatformConfig
            :config="config"
            @update="handlePlatformUpdate"
          />
          <ModuleList :config="config" @module-update="handleModuleUpdate" />
        </div>
        <div class="json-column">
          <div class="json-output">
            <h2>Generated JSON</h2>
            <pre>{{ generateJson() }}</pre>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.app {
  max-width: 1600px;
  margin: 0 auto;
  padding: 20px;
}

.main-layout {
  display: grid;
  grid-template-columns: 1fr 500px;
  gap: 20px;
  align-items: start;
}

.config-column {
  min-width: 0; /* Allows the column to shrink if needed */
}

.json-column {
  position: sticky;
  top: 20px;
}

.json-output {
  background: #f8f8f8;
  border-radius: 8px;
  padding: 20px;
}

.json-output h2 {
  color: #333;
  margin-bottom: 20px;
  font-weight: 600;
}

.json-output pre {
  background: white;
  padding: 15px;
  border-radius: 4px;
  overflow-x: auto;
  color: #333;
  border: 1px solid #ddd;
  font-family: monospace;
  font-size: 14px;
}
</style>
