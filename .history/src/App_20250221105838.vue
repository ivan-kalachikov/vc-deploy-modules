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

const handlePlatformUpdate = (field: string, value: string | string[]) => {
  if (!config.value) return

  const newConfig = JSON.parse(JSON.stringify(config.value)) // Use JSON parse/stringify instead of structuredClone
  newConfig[field as keyof ConfigurationData] = value
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
      <PlatformConfig
        :manifest-version="config.ManifestVersion"
        :platform-version="config.PlatformVersion"
        :platform-image="config.PlatformImage"
        :platform-image-tag="config.PlatformImageTag"
        :platform-asset-url="config.PlatformAssetUrl"
        :module-sources="config.ModuleSources"
        @update="handlePlatformUpdate"
      />
      <ModuleList :config="config" @module-update="handleModuleUpdate" />
      <div class="json-output">
        <h2>Generated JSON</h2>
        <pre>{{ generateJson() }}</pre>
      </div>
    </template>
  </div>
</template>

<style scoped>
.app {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.json-output {
  margin-top: 30px;
}

.json-output pre {
  background: #f5f5f5;
  padding: 15px;
  border-radius: 4px;
  overflow-x: auto;
  color: #333;
}
</style>
