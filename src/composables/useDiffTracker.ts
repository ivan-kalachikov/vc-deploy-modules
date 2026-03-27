import { computed, type Ref } from 'vue'
import type { ConfigurationData, DiffChange, ModuleBase } from '../types'

export function useDiffTracker(
  config: Ref<ConfigurationData | null>,
  originalConfig: Ref<ConfigurationData | null>,
) {
  const changes = computed<DiffChange[]>(() => {
    const items: DiffChange[] = []
    if (!config.value || !originalConfig.value) return items

    // Platform field changes
    const platformFields: Array<{ key: keyof ConfigurationData; label: string }> = [
      { key: 'ManifestVersion', label: 'Manifest Version' },
      { key: 'PlatformVersion', label: 'Platform Version' },
      { key: 'PlatformImage', label: 'Platform Image' },
      { key: 'PlatformImageTag', label: 'Platform Image Tag' },
      { key: 'PlatformAssetUrl', label: 'Platform Asset URL' },
    ]

    for (const { key, label } of platformFields) {
      if (config.value[key] !== originalConfig.value[key]) {
        items.push({
          type: 'platform',
          field: label,
          action: 'changed',
          oldValue: String(originalConfig.value[key]),
          newValue: String(config.value[key]),
        })
      }
    }

    // Module changes
    config.value.Sources.forEach((source) => {
      source.Modules.forEach((module) => {
        const moduleId = module.Id || module.BlobName?.split('_')[0] || ''
        if (!moduleId) return

        let originalModule: ModuleBase | undefined
        let originalSourceName: string | undefined

        originalConfig.value?.Sources.forEach((origSource) => {
          const found = origSource.Modules.find((m) =>
            origSource.Name === 'GithubReleases'
              ? m.Id === moduleId
              : m.BlobName?.startsWith(moduleId + '_'),
          )
          if (found) {
            originalModule = found
            originalSourceName = origSource.Name
          }
        })

        if (!originalModule) {
          items.push({
            type: 'module',
            moduleId,
            action: 'added',
            newValue: source.Name,
            toSource: source.Name,
          })
        } else if (originalSourceName !== source.Name) {
          const oldVal =
            originalSourceName === 'GithubReleases'
              ? originalModule.Version || '(none)'
              : originalModule.BlobName?.split('_')[1] || '(none)'
          const newVal =
            source.Name === 'GithubReleases'
              ? module.Version || '(none)'
              : module.BlobName?.split('_')[1] || '(none)'

          items.push({
            type: 'module',
            moduleId,
            action: 'moved',
            oldValue: oldVal,
            newValue: newVal,
            fromSource: originalSourceName,
            toSource: source.Name,
          })
        } else if (source.Name === 'GithubReleases') {
          if (originalModule.Version !== module.Version) {
            items.push({
              type: 'module',
              moduleId,
              action: 'changed',
              oldValue: originalModule.Version || '(none)',
              newValue: module.Version || '(none)',
            })
          }
        } else {
          if (originalModule.BlobName !== module.BlobName) {
            items.push({
              type: 'module',
              moduleId,
              action: 'changed',
              oldValue: originalModule.BlobName || '(none)',
              newValue: module.BlobName || '(none)',
            })
          }
        }
      })
    })

    return items
  })

  return { changes }
}
