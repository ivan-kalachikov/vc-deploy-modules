import { ref, computed } from 'vue'
import { useUrlSearchParams } from '@vueuse/core'
import { useManifestHistory } from './useManifestHistory'
import { useToast } from './useToast'

function toRawUrl(url: string): string {
  const m = url.match(/^https?:\/\/github\.com\/([^/]+\/[^/]+)\/(?:blob|tree)\/(.+)$/)
  return m ? `https://raw.githubusercontent.com/${m[1]}/${m[2]}` : url
}

const params = useUrlSearchParams('history')
const isLoading = ref(false)
const error = ref('')

export function useManifestLoader() {
  const { addEntry, touchEntry } = useManifestHistory()
  const { addToast } = useToast()

  async function fetchManifest(url: string): Promise<string | null> {
    const trimmed = url.trim()
    if (!trimmed) return null

    isLoading.value = true
    error.value = ''
    try {
      const response = await fetch(toRawUrl(trimmed))
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const text = await response.text()
      JSON.parse(text) // validate
      addEntry(trimmed)
      params['manifest-url'] = trimmed
      return text
    } catch (e) {
      error.value = `Failed to fetch: ${(e as Error).message}`
      return null
    } finally {
      isLoading.value = false
    }
  }

  function loadFromHistory(url: string): Promise<string | null> {
    touchEntry(url)
    return fetchManifest(url)
  }

  function clearManifestUrl() {
    delete params['manifest-url']
  }

  function getInitialUrl(): string | null {
    const val = params['manifest-url']
    const url = Array.isArray(val) ? val[0] : val
    return url || null
  }

  const manifestUrl = computed(() => {
    const val = params['manifest-url']
    return (Array.isArray(val) ? val[0] : val) || null
  })

  return { isLoading, error, manifestUrl, fetchManifest, loadFromHistory, clearManifestUrl, getInitialUrl }
}
