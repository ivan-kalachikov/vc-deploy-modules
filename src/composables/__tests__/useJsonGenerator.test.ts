import { describe, it, expect } from 'vitest'
import { useJsonGenerator } from '../useJsonGenerator'
import type { ConfigurationData } from '../../types'

function makeConfig(overrides?: Partial<ConfigurationData>): ConfigurationData {
  return {
    ManifestVersion: '2.0',
    PlatformVersion: '3.809.0',
    PlatformImage: 'ghcr.io/virtocommerce/platform',
    PlatformImageTag: '3.809.0',
    PlatformAssetUrl: 'https://example.com/platform.zip',
    ModuleSources: ['https://source-b.com', 'https://source-a.com'],
    Sources: [
      {
        Name: 'GithubReleases',
        ModuleSources: ['https://ms-b.com', 'https://ms-a.com'],
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
          { BlobName: 'VirtoCommerce.Cart_2.0.0.zip' },
        ],
      },
    ],
    ...overrides,
  }
}

describe('useJsonGenerator', () => {
  const { generateJson } = useJsonGenerator()

  it('returns empty string for null config', () => {
    expect(generateJson(null, false)).toBe('')
    expect(generateJson(null, true)).toBe('')
  })

  it('returns JSON with fixed field order', () => {
    const config = makeConfig()
    const result = generateJson(config, false)
    const parsed = JSON.parse(result)

    const keys = Object.keys(parsed)
    expect(keys).toEqual([
      'ManifestVersion',
      'PlatformVersion',
      'PlatformImage',
      'PlatformImageTag',
      'PlatformAssetUrl',
      'ModuleSources',
      'Sources',
    ])
  })

  it('does not sort when shouldSort is false', () => {
    const config = makeConfig()
    const result = generateJson(config, false)
    const parsed = JSON.parse(result)

    // ModuleSources should keep original order
    expect(parsed.ModuleSources).toEqual([
      'https://source-b.com',
      'https://source-a.com',
    ])

    // GitHub modules should keep original order
    const githubSource = parsed.Sources.find(
      (s: { Name: string }) => s.Name === 'GithubReleases',
    )
    expect(githubSource.Modules[0].Id).toBe('VirtoCommerce.Orders')
    expect(githubSource.Modules[1].Id).toBe('VirtoCommerce.Catalog')
  })

  it('sorts when shouldSort is true', () => {
    const config = makeConfig()
    const result = generateJson(config, true)
    const parsed = JSON.parse(result)

    // ModuleSources should be sorted
    expect(parsed.ModuleSources).toEqual([
      'https://source-a.com',
      'https://source-b.com',
    ])

    // Sources should be sorted by Name (AzureBlob before GithubReleases)
    expect(parsed.Sources[0].Name).toBe('AzureBlob')
    expect(parsed.Sources[1].Name).toBe('GithubReleases')

    // GitHub modules should be sorted by Id
    const githubSource = parsed.Sources.find(
      (s: { Name: string }) => s.Name === 'GithubReleases',
    )
    expect(githubSource.Modules[0].Id).toBe('VirtoCommerce.Catalog')
    expect(githubSource.Modules[1].Id).toBe('VirtoCommerce.Orders')

    // AzureBlob modules should be sorted by BlobName prefix
    const azureSource = parsed.Sources.find(
      (s: { Name: string }) => s.Name === 'AzureBlob',
    )
    expect(azureSource.Modules[0].BlobName).toContain('Cart')
    expect(azureSource.Modules[1].BlobName).toContain('Notifications')
  })

  it('sorts GithubReleases ModuleSources when sorting', () => {
    const config = makeConfig()
    const result = generateJson(config, true)
    const parsed = JSON.parse(result)

    const githubSource = parsed.Sources.find(
      (s: { Name: string }) => s.Name === 'GithubReleases',
    )
    expect(githubSource.ModuleSources).toEqual([
      'https://ms-a.com',
      'https://ms-b.com',
    ])
  })

  it('does not mutate the original config', () => {
    const config = makeConfig()
    const originalOrder = config.Sources[0].Modules.map(
      (m) => m.Id,
    )
    generateJson(config, true)
    const afterOrder = config.Sources[0].Modules.map((m) => m.Id)
    expect(afterOrder).toEqual(originalOrder)
  })
})
