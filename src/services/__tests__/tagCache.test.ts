import { describe, it, expect, beforeEach, vi } from 'vitest'
import { getCachedTags, setCachedTags } from '../tagCache'

describe('tagCache', () => {
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
  })

  it('returns null when cache is empty', () => {
    expect(getCachedTags('SomeModule')).toBeNull()
  })

  it('stores and retrieves tags', () => {
    const tags = ['3.0.0', '2.0.0', '1.0.0']
    setCachedTags('VirtoCommerce.Orders', tags)
    const result = getCachedTags('VirtoCommerce.Orders')
    expect(result).toEqual(tags)
  })

  it('returns null for expired cache', () => {
    const tags = ['1.0.0']
    setCachedTags('TestModule', tags)

    // Manually overwrite the cached entry with an old timestamp
    const key = 'vc-module-tags-TestModule'
    const data = JSON.parse(storage[key])
    data.timestamp = Date.now() - 25 * 60 * 60 * 1000 // 25 hours ago
    storage[key] = JSON.stringify(data)

    expect(getCachedTags('TestModule')).toBeNull()
    // Should also remove the expired entry
    expect(localStorage.removeItem).toHaveBeenCalledWith(key)
  })

  it('returns null when localStorage.getItem throws', () => {
    vi.mocked(localStorage.getItem).mockImplementation(() => {
      throw new Error('Storage error')
    })
    expect(getCachedTags('TestModule')).toBeNull()
  })

  it('handles localStorage.setItem throwing gracefully', () => {
    vi.mocked(localStorage.setItem).mockImplementation(() => {
      throw new Error('Quota exceeded')
    })
    // Should not throw
    expect(() => setCachedTags('TestModule', ['1.0.0'])).not.toThrow()
  })

  it('returns null when stored value is invalid JSON', () => {
    storage['vc-module-tags-BadModule'] = 'not-json'
    expect(getCachedTags('BadModule')).toBeNull()
  })
})
