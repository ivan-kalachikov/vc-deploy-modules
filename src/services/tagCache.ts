import type { CachedTags } from '../types'

const CACHE_PREFIX = 'vc-module-tags-'
const CACHE_TTL = 24 * 60 * 60 * 1000 // 24 hours

export function getCachedTags(moduleId: string): string[] | null {
  try {
    const cached = localStorage.getItem(CACHE_PREFIX + moduleId)
    if (!cached) return null

    const data = JSON.parse(cached) as CachedTags
    if (Date.now() - data.timestamp > CACHE_TTL) {
      localStorage.removeItem(CACHE_PREFIX + moduleId)
      return null
    }
    return data.tags
  } catch {
    return null
  }
}

export function setCachedTags(moduleId: string, tags: string[]): void {
  try {
    const data: CachedTags = { tags, timestamp: Date.now() }
    localStorage.setItem(CACHE_PREFIX + moduleId, JSON.stringify(data))
  } catch {
    // Silently ignore storage errors (quota exceeded, etc.)
  }
}
