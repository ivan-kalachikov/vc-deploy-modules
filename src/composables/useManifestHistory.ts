import { useStorage } from '@vueuse/core'

export interface HistoryEntry {
  url: string
  label: string
  timestamp: number
}

const history = useStorage<HistoryEntry[]>('manifest-history', [])

export function useManifestHistory() {
  function addEntry(url: string) {
    // Remove existing entry with same URL
    history.value = history.value.filter(e => e.url !== url)
    // Add to top
    const label = url.replace(/^https?:\/\//, '').replace(/\/$/, '')
    history.value.unshift({ url, label, timestamp: Date.now() })
    // Keep max 20 entries
    if (history.value.length > 20) history.value = history.value.slice(0, 20)
  }

  function removeEntry(url: string) {
    history.value = history.value.filter(e => e.url !== url)
  }

  function touchEntry(url: string) {
    const idx = history.value.findIndex(e => e.url === url)
    if (idx > 0) {
      const [entry] = history.value.splice(idx, 1)
      entry.timestamp = Date.now()
      history.value.unshift(entry)
    }
  }

  return { history, addEntry, removeEntry, touchEntry }
}
