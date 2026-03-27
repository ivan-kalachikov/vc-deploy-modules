import { ref, toRaw } from 'vue'
import { useStorage } from '@vueuse/core'
import type { ConfigurationData, ModuleType, ModuleBase } from '../types'

// Module-level singletons — survive across multiple useConfigState() calls
const config = ref<ConfigurationData | null>(null)
const originalConfig = ref<ConfigurationData | null>(null)
const jsonError = ref('')
const shouldSortModules = useStorage('sort-modules-preference', true)

export function useConfigState() {
  function parseConfig(jsonString: string) {
    try {
      const parsed = JSON.parse(jsonString)
      config.value = parsed
      originalConfig.value = structuredClone(parsed)
      jsonError.value = ''
    } catch (e) {
      jsonError.value = 'Invalid JSON format: ' + (e as Error).message
    }
  }

  function updateModule(moduleId: string, type: ModuleType, value: string) {
    if (!config.value) return

    const newConfig = JSON.parse(JSON.stringify(toRaw(config.value))) as ConfigurationData
    const sourceIndex = newConfig.Sources.findIndex(
      (s: { Name: string }) => s.Name === type,
    )
    if (sourceIndex === -1) return

    const source = newConfig.Sources[sourceIndex]
    const moduleIndex = source.Modules.findIndex((m: ModuleBase) =>
      type === 'GithubReleases'
        ? m.Id === moduleId
        : m.BlobName?.startsWith(moduleId),
    )

    if (value === '__DELETE__') {
      source.Modules.splice(moduleIndex, 1)
    } else if (moduleIndex === -1) {
      const newModule =
        type === 'GithubReleases'
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

  function updatePlatform(newConfig: ConfigurationData) {
    config.value = newConfig
  }

  return {
    config,
    originalConfig,
    jsonError,
    shouldSortModules,
    parseConfig,
    updateModule,
    updatePlatform,
  }
}
