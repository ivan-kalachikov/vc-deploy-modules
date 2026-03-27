import { ref, watch } from 'vue'
import type { ConfigurationData, ModuleType, ModuleBase } from '../types'

const SORT_STORAGE_KEY = 'sort-modules-preference'

function loadSortPreference(): boolean {
  const stored = localStorage.getItem(SORT_STORAGE_KEY)
  return stored !== null ? stored === 'true' : true
}

export function useConfigState() {
  const config = ref<ConfigurationData | null>(null)
  const originalConfig = ref<ConfigurationData | null>(null)
  const jsonError = ref('')
  const shouldSortModules = ref(loadSortPreference())

  watch(shouldSortModules, (val) => {
    localStorage.setItem(SORT_STORAGE_KEY, String(val))
  })

  function parseConfig(jsonString: string, sort: boolean) {
    try {
      const parsed = JSON.parse(jsonString)
      config.value = parsed
      originalConfig.value = structuredClone(parsed)
      jsonError.value = ''
      shouldSortModules.value = sort
    } catch (e) {
      jsonError.value = 'Invalid JSON format' + (e as Error).message
    }
  }

  function updateModule(moduleId: string, type: ModuleType, value: string) {
    if (!config.value) return

    const newConfig = structuredClone(config.value)
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
