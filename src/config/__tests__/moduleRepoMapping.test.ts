import { describe, it, expect } from 'vitest'
import { getRepoName, getGitHubRepoUrl, MODULE_REPO_MAPPING } from '../moduleRepoMapping'

describe('getRepoName', () => {
  it('returns mapped repo name for known modules', () => {
    expect(getRepoName('VirtoCommerce.Orders')).toBe('vc-module-order')
    expect(getRepoName('VirtoCommerce.Notifications')).toBe('vc-module-notification')
    expect(getRepoName('VirtoCommerce.XCMS')).toBe('vc-module-x-cms')
    expect(getRepoName('VirtoCommerce.Xapi')).toBe('vc-module-x-api')
  })

  it('falls back to kebab-case for unknown modules', () => {
    expect(getRepoName('VirtoCommerce.Catalog')).toBe('vc-module-catalog')
    expect(getRepoName('VirtoCommerce.Cart')).toBe('vc-module-cart')
  })

  it('strips VirtoCommerce. prefix in fallback', () => {
    expect(getRepoName('VirtoCommerce.SomeNewModule')).toBe('vc-module-some-new-module')
  })

  it('handles module without VirtoCommerce prefix in fallback', () => {
    // No prefix to strip, kebabCase applied directly
    expect(getRepoName('CustomModule')).toBe('vc-module-custom-module')
  })

  it('has all expected mappings', () => {
    expect(Object.keys(MODULE_REPO_MAPPING).length).toBeGreaterThan(10)
  })
})

describe('getGitHubRepoUrl', () => {
  it('returns correct URL for a known module', () => {
    expect(getGitHubRepoUrl('VirtoCommerce.Orders')).toBe(
      'https://github.com/VirtoCommerce/vc-module-order',
    )
  })

  it('returns correct URL for an unknown module using fallback', () => {
    expect(getGitHubRepoUrl('VirtoCommerce.Catalog')).toBe(
      'https://github.com/VirtoCommerce/vc-module-catalog',
    )
  })
})
