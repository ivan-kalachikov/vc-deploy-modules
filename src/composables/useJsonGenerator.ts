import type { ConfigurationData, ModuleBase } from '../types'
import { getModuleId } from '../utils/helpers'

export function useJsonGenerator() {
  function generateJson(
    config: ConfigurationData | null,
    shouldSort: boolean,
  ): string {
    if (!config) return ''

    const newConfig = structuredClone(config)

    if (shouldSort) {
      newConfig.Sources = newConfig.Sources
        .sort((a: { Name: string }, b: { Name: string }) =>
          a.Name.localeCompare(b.Name),
        )
        .map(
          (source: {
            Name: string
            Modules: ModuleBase[]
            Container?: string
            ServiceUri?: string
            ModuleSources?: string[]
          }) => {
            const sortedModules = [...source.Modules].sort((a, b) =>
              getModuleId(a).localeCompare(getModuleId(b)),
            )

            return {
              Name: source.Name,
              ...(source.Name === 'AzureBlob'
                ? {
                    Container: source.Container,
                    ServiceUri: source.ServiceUri,
                  }
                : {
                    ModuleSources: source.ModuleSources
                      ? [...source.ModuleSources].sort()
                      : [],
                  }),
              Modules: sortedModules,
            }
          },
        )

      newConfig.ModuleSources = [...newConfig.ModuleSources].sort()
    }

    return JSON.stringify(
      {
        ManifestVersion: newConfig.ManifestVersion,
        PlatformVersion: newConfig.PlatformVersion,
        PlatformImage: newConfig.PlatformImage,
        PlatformImageTag: newConfig.PlatformImageTag,
        PlatformAssetUrl: newConfig.PlatformAssetUrl,
        ModuleSources: newConfig.ModuleSources,
        Sources: newConfig.Sources,
      },
      null,
      2,
    )
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
