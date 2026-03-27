import { toRaw } from 'vue'
import type { ConfigurationData, ModuleBase, Source } from '../types'
import { getModuleId } from '../utils/helpers'

export function useJsonGenerator() {
  function generateJson(
    config: ConfigurationData | null,
    shouldSort: boolean,
  ): string {
    if (!config) return ''

    const newConfig = JSON.parse(JSON.stringify(toRaw(config))) as ConfigurationData

    if (shouldSort) {
      newConfig.Sources = newConfig.Sources
        .sort((a, b) => a.Name.localeCompare(b.Name))
        .map((source) => {
          const sortedModules = [...source.Modules].sort((a, b) =>
            getModuleId(a).localeCompare(getModuleId(b)),
          )

          if (source.Name === 'AzureBlob') {
            return { Name: source.Name, Container: source.Container, ServiceUri: source.ServiceUri, Modules: sortedModules }
          }
          return {
            Name: source.Name,
            ModuleSources: source.ModuleSources ? [...source.ModuleSources].sort() : [],
            Modules: sortedModules,
          }
        }) as Source[]

      if (newConfig.ModuleSources) {
        newConfig.ModuleSources = [...newConfig.ModuleSources].sort()
      }
    }

    // Build output with only fields that exist in the config
    const output: Record<string, unknown> = {}
    if (newConfig.ManifestVersion !== undefined) output.ManifestVersion = newConfig.ManifestVersion
    if (newConfig.PlatformVersion !== undefined) output.PlatformVersion = newConfig.PlatformVersion
    if (newConfig.PlatformImage !== undefined) output.PlatformImage = newConfig.PlatformImage
    if (newConfig.PlatformImageTag !== undefined) output.PlatformImageTag = newConfig.PlatformImageTag
    if (newConfig.PlatformAssetUrl !== undefined) output.PlatformAssetUrl = newConfig.PlatformAssetUrl
    if (newConfig.ModuleSources !== undefined) output.ModuleSources = newConfig.ModuleSources
    output.Sources = newConfig.Sources

    return JSON.stringify(output, null, 2)
  }

  async function copyToClipboard(json: string): Promise<boolean> {
    try {
      await navigator.clipboard.writeText(json)
      return true
    } catch {
      return false
    }
  }

  return { generateJson, copyToClipboard }
}
