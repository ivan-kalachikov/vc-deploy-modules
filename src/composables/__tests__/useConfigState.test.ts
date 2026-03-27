import { describe, it, expect, beforeEach, vi } from 'vitest'
import type { ConfigurationData } from '../../types'

// structuredClone in jsdom cannot handle Vue reactive proxies.
vi.stubGlobal('structuredClone', <T>(val: T): T =>
  JSON.parse(JSON.stringify(val)),
)

function makeJsonString(overrides?: Partial<ConfigurationData>): string {
  const config: ConfigurationData = {
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
          { Id: 'VirtoCommerce.Catalog', Version: '3.700.0' },
        ],
      },
      {
        Name: 'AzureBlob',
        Container: 'packages',
        ServiceUri: 'https://blob.example.com',
        Modules: [
          { BlobName: 'VirtoCommerce.Notifications_1.0.0.zip' },
        ],
      },
    ],
    ...overrides,
  }
  return JSON.stringify(config)
}

describe('useConfigState', () => {
  let storage: Record<string, string>

  beforeEach(() => {
    storage = {}
    const localStorageMock = {
      getItem: vi.fn((key: string) => storage[key] ?? null),
      setItem: vi.fn((key: string, value: string) => {
        storage[key] = value
      }),
      removeItem: vi.fn((key: string) => {
        delete storage[key]
      }),
    }
    vi.stubGlobal('localStorage', localStorageMock)

    // Reset module to get fresh singleton state for each test
    vi.resetModules()
  })

  async function loadFresh() {
    const mod = await import('../useConfigState')
    return mod.useConfigState()
  }

  describe('parseConfig', () => {
    it('sets config and originalConfig from valid JSON', async () => {
      const { config, originalConfig, jsonError, parseConfig } = await loadFresh()
      parseConfig(makeJsonString())

      expect(config.value).not.toBeNull()
      expect(originalConfig.value).not.toBeNull()
      expect(config.value!.PlatformVersion).toBe('3.809.0')
      expect(jsonError.value).toBe('')
    })

    it('sets config and originalConfig as independent copies', async () => {
      const { config, originalConfig, parseConfig } = await loadFresh()
      parseConfig(makeJsonString())

      config.value!.PlatformVersion = '9.9.9'
      expect(originalConfig.value!.PlatformVersion).toBe('3.809.0')
    })

    it('sets error on invalid JSON', async () => {
      const { config, jsonError, parseConfig } = await loadFresh()
      parseConfig('not valid json')

      expect(jsonError.value).toContain('Invalid JSON format')
      expect(config.value).toBeNull()
    })
  })

  describe('updateModule', () => {
    it('updates version for a GithubReleases module', async () => {
      const { config, parseConfig, updateModule } = await loadFresh()
      parseConfig(makeJsonString())

      updateModule('VirtoCommerce.Orders', 'GithubReleases', '3.900.0')

      const githubSource = config.value!.Sources.find(
        (s) => s.Name === 'GithubReleases',
      )!
      const ordersModule = githubSource.Modules.find(
        (m) => m.Id === 'VirtoCommerce.Orders',
      )
      expect(ordersModule!.Version).toBe('3.900.0')
    })

    it('updates BlobName for an AzureBlob module', async () => {
      const { config, parseConfig, updateModule } = await loadFresh()
      parseConfig(makeJsonString())

      updateModule(
        'VirtoCommerce.Notifications',
        'AzureBlob',
        'VirtoCommerce.Notifications_2.0.0.zip',
      )

      const azureSource = config.value!.Sources.find(
        (s) => s.Name === 'AzureBlob',
      )!
      const mod = azureSource.Modules.find((m) =>
        m.BlobName?.startsWith('VirtoCommerce.Notifications'),
      )
      expect(mod!.BlobName).toBe('VirtoCommerce.Notifications_2.0.0.zip')
    })

    it('deletes a module with __DELETE__', async () => {
      const { config, parseConfig, updateModule } = await loadFresh()
      parseConfig(makeJsonString())

      updateModule('VirtoCommerce.Orders', 'GithubReleases', '__DELETE__')

      const githubSource = config.value!.Sources.find(
        (s) => s.Name === 'GithubReleases',
      )!
      const ordersModule = githubSource.Modules.find(
        (m) => m.Id === 'VirtoCommerce.Orders',
      )
      expect(ordersModule).toBeUndefined()
    })

    it('adds a new module when not found', async () => {
      const { config, parseConfig, updateModule } = await loadFresh()
      parseConfig(makeJsonString())

      updateModule('VirtoCommerce.NewModule', 'GithubReleases', '1.0.0')

      const githubSource = config.value!.Sources.find(
        (s) => s.Name === 'GithubReleases',
      )!
      const newModule = githubSource.Modules.find(
        (m) => m.Id === 'VirtoCommerce.NewModule',
      )
      expect(newModule).toBeDefined()
      expect(newModule!.Version).toBe('1.0.0')
    })

    it('does nothing when config is null', async () => {
      const { updateModule } = await loadFresh()
      expect(() =>
        updateModule('VirtoCommerce.Orders', 'GithubReleases', '1.0.0'),
      ).not.toThrow()
    })

    it('does nothing when source type not found', async () => {
      const { config, parseConfig, updateModule } = await loadFresh()
      const jsonStr = JSON.stringify({
        ManifestVersion: '2.0',
        PlatformVersion: '3.809.0',
        PlatformImage: 'ghcr.io/virtocommerce/platform',
        PlatformImageTag: '3.809.0',
        PlatformAssetUrl: '',
        ModuleSources: [],
        Sources: [
          {
            Name: 'GithubReleases',
            ModuleSources: [],
            Modules: [],
          },
        ],
      })
      parseConfig(jsonStr)

      updateModule('SomeModule', 'AzureBlob', '1.0.0')
      expect(config.value!.Sources).toHaveLength(1)
    })
  })

  describe('updatePlatform', () => {
    it('replaces config with new config', async () => {
      const { config, parseConfig, updatePlatform } = await loadFresh()
      parseConfig(makeJsonString())

      const newConfig: ConfigurationData = JSON.parse(JSON.stringify(config.value!))
      newConfig.PlatformVersion = '4.0.0'
      updatePlatform(newConfig)

      expect(config.value!.PlatformVersion).toBe('4.0.0')
    })
  })

  describe('shouldSortModules', () => {
    it('defaults to true when no localStorage value', async () => {
      const { shouldSortModules } = await loadFresh()
      expect(shouldSortModules.value).toBe(true)
    })

    it('reads initial value from localStorage', async () => {
      storage['sort-modules-preference'] = 'false'
      const { shouldSortModules } = await loadFresh()
      expect(shouldSortModules.value).toBe(false)
    })

    it('persists changes to localStorage via watcher', async () => {
      const { shouldSortModules } = await loadFresh()
      shouldSortModules.value = false

      await new Promise((r) => setTimeout(r, 0))
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'sort-modules-preference',
        'false',
      )
    })
  })
})
