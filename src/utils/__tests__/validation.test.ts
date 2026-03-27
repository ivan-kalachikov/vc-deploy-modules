import { describe, it, expect } from 'vitest'
import {
  isValidVersion,
  isValidManifestVersion,
  isValidBlobName,
  isValidPlatformImage,
} from '../validation'

describe('isValidVersion', () => {
  it('accepts valid semver versions', () => {
    expect(isValidVersion('3.809.0')).toBe(true)
    expect(isValidVersion('1.2.3')).toBe(true)
    expect(isValidVersion('0.0.1')).toBe(true)
    expect(isValidVersion('10.200.300')).toBe(true)
  })

  it('trims whitespace before validating', () => {
    expect(isValidVersion('  1.2.3  ')).toBe(true)
    expect(isValidVersion('\t3.809.0\n')).toBe(true)
  })

  it('rejects versions with missing patch', () => {
    expect(isValidVersion('3.809')).toBe(false)
  })

  it('rejects versions with v prefix', () => {
    expect(isValidVersion('v3.809.0')).toBe(false)
  })

  it('rejects empty string', () => {
    expect(isValidVersion('')).toBe(false)
  })

  it('rejects non-numeric values', () => {
    expect(isValidVersion('abc.def.ghi')).toBe(false)
    expect(isValidVersion('1.2.x')).toBe(false)
  })

  it('rejects versions with extra segments', () => {
    expect(isValidVersion('1.2.3.4')).toBe(false)
  })

  it('accepts versions with pre-release suffix', () => {
    expect(isValidVersion('3.1009.0-pr-2987-75d0')).toBe(true)
    expect(isValidVersion('3.1009.0-pr-2987-75d0-vcst-4710-75d0e')).toBe(true)
    expect(isValidVersion('1.0.0-alpha.1')).toBe(true)
    expect(isValidVersion('2.0.0-beta')).toBe(true)
  })
})

describe('isValidManifestVersion', () => {
  it('accepts valid major.minor versions', () => {
    expect(isValidManifestVersion('2.0')).toBe(true)
    expect(isValidManifestVersion('1.0')).toBe(true)
    expect(isValidManifestVersion('10.5')).toBe(true)
  })

  it('rejects three-part versions', () => {
    expect(isValidManifestVersion('2.0.0')).toBe(false)
  })

  it('rejects empty string', () => {
    expect(isValidManifestVersion('')).toBe(false)
  })

  it('rejects single number', () => {
    expect(isValidManifestVersion('2')).toBe(false)
  })

  it('trims whitespace', () => {
    expect(isValidManifestVersion(' 2.0 ')).toBe(true)
  })
})

describe('isValidBlobName', () => {
  it('accepts blob name with suffix', () => {
    expect(isValidBlobName('3.806.0-pr-62-df9c.zip')).toBe(true)
  })

  it('accepts blob name without suffix', () => {
    expect(isValidBlobName('3.806.0.zip')).toBe(true)
  })

  it('rejects blob name with only two version parts', () => {
    expect(isValidBlobName('3.806.zip')).toBe(false)
  })

  it('rejects blob name without version', () => {
    expect(isValidBlobName('noversion.zip')).toBe(false)
  })

  it('rejects empty string', () => {
    expect(isValidBlobName('')).toBe(false)
  })

  it('accepts blob name with complex suffix', () => {
    expect(isValidBlobName('1.0.0-alpha.1.zip')).toBe(true)
  })

  it('trims whitespace', () => {
    expect(isValidBlobName(' 3.806.0.zip ')).toBe(true)
  })
})

describe('isValidPlatformImage', () => {
  it('accepts full image path with org and repo', () => {
    expect(isValidPlatformImage('ghcr.io/virtocommerce/platform')).toBe(true)
  })

  it('accepts image path with org only', () => {
    expect(isValidPlatformImage('ghcr.io/virtocommerce')).toBe(true)
  })

  it('rejects image without slash', () => {
    expect(isValidPlatformImage('noslash')).toBe(false)
  })

  it('rejects empty string', () => {
    expect(isValidPlatformImage('')).toBe(false)
  })

  it('rejects path without domain dot', () => {
    expect(isValidPlatformImage('localhost/virtocommerce')).toBe(false)
  })

  it('trims whitespace', () => {
    expect(isValidPlatformImage(' ghcr.io/virtocommerce ')).toBe(true)
  })
})
