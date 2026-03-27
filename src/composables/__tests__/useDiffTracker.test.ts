import { describe, it, expect } from 'vitest'
import { ref } from 'vue'
import { useDiffTracker } from '../useDiffTracker'
import type { ConfigurationData } from '../../types'

function makeConfig(overrides?: Partial<ConfigurationData>): ConfigurationData {
  return {
    ManifestVersion: '2.0',
    PlatformVersion: '3.809.0',
    PlatformImage: 'ghcr.io/virtocommerce/platform',
    PlatformImageTag: '3.809.0',
    PlatformAssetUrl: 'https://example.com/platform.zip',
    ModuleSources: [],
    Sources: [
      {
        Name: 'GithubReleases',
        ModuleSources: [],
        Modules: [
          { Id: 'VirtoCommerce.Orders', Version: '3.800.0' },
        ],
      },
    ],
    ...overrides,
  }
}

describe('useDiffTracker', () => {
  it('returns empty array when configs are null', () => {
    const config = ref<ConfigurationData | null>(null)
    const originalConfig = ref<ConfigurationData | null>(null)
    const { changes } = useDiffTracker(config, originalConfig)
    expect(changes.value).toEqual([])
  })

  it('returns empty array when config is null', () => {
    const config = ref<ConfigurationData | null>(null)
    const originalConfig = ref<ConfigurationData | null>(makeConfig())
    const { changes } = useDiffTracker(config, originalConfig)
    expect(changes.value).toEqual([])
  })

  it('returns empty array when configs are identical', () => {
    const config = ref<ConfigurationData | null>(makeConfig())
    const originalConfig = ref<ConfigurationData | null>(makeConfig())
    const { changes } = useDiffTracker(config, originalConfig)
    expect(changes.value).toEqual([])
  })

  it('detects platform version change', () => {
    const config = ref<ConfigurationData | null>(
      makeConfig({ PlatformVersion: '3.810.0' }),
    )
    const originalConfig = ref<ConfigurationData | null>(makeConfig())
    const { changes } = useDiffTracker(config, originalConfig)

    const platformChanges = changes.value.filter((c) => c.type === 'platform')
    expect(platformChanges).toHaveLength(1)
    expect(platformChanges[0]).toMatchObject({
      type: 'platform',
      field: 'Platform Version',
      action: 'changed',
      oldValue: '3.809.0',
      newValue: '3.810.0',
    })
  })

  it('detects multiple platform field changes', () => {
    const config = ref<ConfigurationData | null>(
      makeConfig({
        PlatformVersion: '4.0.0',
        PlatformImageTag: '4.0.0',
      }),
    )
    const originalConfig = ref<ConfigurationData | null>(makeConfig())
    const { changes } = useDiffTracker(config, originalConfig)

    const platformChanges = changes.value.filter((c) => c.type === 'platform')
    expect(platformChanges).toHaveLength(2)
    expect(platformChanges.map((c) => c.field)).toContain('Platform Version')
    expect(platformChanges.map((c) => c.field)).toContain('Platform Image Tag')
  })

  it('detects module version change', () => {
    const newConfig = makeConfig()
    newConfig.Sources[0].Modules[0].Version = '3.900.0'

    const config = ref<ConfigurationData | null>(newConfig)
    const originalConfig = ref<ConfigurationData | null>(makeConfig())
    const { changes } = useDiffTracker(config, originalConfig)

    const moduleChanges = changes.value.filter((c) => c.type === 'module')
    expect(moduleChanges).toHaveLength(1)
    expect(moduleChanges[0]).toMatchObject({
      type: 'module',
      moduleId: 'VirtoCommerce.Orders',
      action: 'changed',
      oldValue: '3.800.0',
      newValue: '3.900.0',
    })
  })

  it('detects module added', () => {
    const newConfig = makeConfig()
    newConfig.Sources[0].Modules.push({
      Id: 'VirtoCommerce.Catalog',
      Version: '3.700.0',
    })

    const config = ref<ConfigurationData | null>(newConfig)
    const originalConfig = ref<ConfigurationData | null>(makeConfig())
    const { changes } = useDiffTracker(config, originalConfig)

    const addedChanges = changes.value.filter((c) => c.action === 'added')
    expect(addedChanges).toHaveLength(1)
    expect(addedChanges[0]).toMatchObject({
      type: 'module',
      moduleId: 'VirtoCommerce.Catalog',
      action: 'added',
      newValue: 'GithubReleases',
      toSource: 'GithubReleases',
    })
  })

  it('detects module moved between sources', () => {
    const original = makeConfig()
    // Original has module in GithubReleases
    original.Sources[0].Modules = [
      { Id: 'VirtoCommerce.Orders', Version: '3.800.0' },
    ]

    const newCfg = makeConfig()
    // New config: module moved to AzureBlob
    newCfg.Sources = [
      {
        Name: 'GithubReleases',
        ModuleSources: [],
        Modules: [],
      },
      {
        Name: 'AzureBlob',
        Container: 'packages',
        ServiceUri: 'https://blob.example.com',
        Modules: [
          { BlobName: 'VirtoCommerce.Orders_3.806.0-pr-1-abc.zip' },
        ],
      },
    ]

    const config = ref<ConfigurationData | null>(newCfg)
    const originalConfig = ref<ConfigurationData | null>(original)
    const { changes } = useDiffTracker(config, originalConfig)

    const movedChanges = changes.value.filter((c) => c.action === 'moved')
    expect(movedChanges).toHaveLength(1)
    expect(movedChanges[0]).toMatchObject({
      type: 'module',
      moduleId: 'VirtoCommerce.Orders',
      action: 'moved',
      fromSource: 'GithubReleases',
      toSource: 'AzureBlob',
    })
  })

  it('detects AzureBlob module BlobName change', () => {
    const original: ConfigurationData = {
      ...makeConfig(),
      Sources: [
        {
          Name: 'AzureBlob',
          Container: 'packages',
          ServiceUri: 'https://blob.example.com',
          Modules: [
            { BlobName: 'VirtoCommerce.Orders_3.800.0.zip' },
          ],
        },
      ],
    }

    const newCfg: ConfigurationData = {
      ...makeConfig(),
      Sources: [
        {
          Name: 'AzureBlob',
          Container: 'packages',
          ServiceUri: 'https://blob.example.com',
          Modules: [
            { BlobName: 'VirtoCommerce.Orders_3.900.0.zip' },
          ],
        },
      ],
    }

    const config = ref<ConfigurationData | null>(newCfg)
    const originalConfig = ref<ConfigurationData | null>(original)
    const { changes } = useDiffTracker(config, originalConfig)

    expect(changes.value).toHaveLength(1)
    expect(changes.value[0]).toMatchObject({
      type: 'module',
      moduleId: 'VirtoCommerce.Orders',
      action: 'changed',
      oldValue: '3.800.0.zip',
      newValue: '3.900.0.zip',
    })
  })
})
