import { ref } from 'vue'
import type { ModuleViewModel } from '../types'
import { getCachedTags, setCachedTags } from '../services/tagCache'
import { fetchTags, RateLimitError, getRateLimitRemaining } from '../services/github'
import { getRepoName } from '../config/moduleRepoMapping'
import { useToast } from './useToast'

export function useModuleTags() {
  const isUpdatingAll = ref(false)
  const updateProgress = ref({ current: 0, total: 0, status: '' })
  const { addToast } = useToast()

  async function loadTags(module: ModuleViewModel, forceRefresh = false) {
    module.isLoadingTags = true
    try {
      if (!forceRefresh) {
        const cached = getCachedTags(module.id)
        if (cached) {
          module.tags = cached
          module.isLoadingTags = false
          return
        }
      }

      const repoName = getRepoName(module.id)
      const tags = await fetchTags(repoName)
      setCachedTags(module.id, tags)
      module.tags = tags
    } catch (e) {
      if (e instanceof RateLimitError) throw e
      module.tags = undefined
    } finally {
      module.isLoadingTags = false
    }
  }

  function loadCachedTags(module: ModuleViewModel) {
    const cached = getCachedTags(module.id)
    if (cached) module.tags = cached
  }

  async function updateAllToLatest(
    modules: ModuleViewModel[],
    onModuleUpdated: (moduleId: string, latestVersion: string) => void,
    batchSize = 5,
  ): Promise<number> {
    const githubModules = modules.filter(
      (m) => m.sourceType === 'GithubReleases',
    )
    if (githubModules.length === 0) return 0

    isUpdatingAll.value = true
    updateProgress.value = { current: 0, total: githubModules.length, status: '' }

    let updatedCount = 0

    try {
      for (let i = 0; i < githubModules.length; i += batchSize) {
        if (i > 0) await new Promise(r => setTimeout(r, 300))

        // Check remaining requests before batch
        const remaining = getRateLimitRemaining()
        if (remaining !== null && remaining < batchSize) {
          updateProgress.value.status = `Low API quota (${remaining} left) — stopping`
          addToast(`GitHub API quota low (${remaining} requests left). ${updatedCount} modules updated.`, 'info')
          break
        }

        const batch = githubModules.slice(i, i + batchSize)

        try {
          const results = await Promise.allSettled(
            batch.map(async (module) => {
              await loadTags(module, true)
              if (module.tags?.length) {
                onModuleUpdated(module.id, module.tags[0])
                return true
              }
              return false
            }),
          )

          const rateLimited = results.find(
            r => r.status === 'rejected' && r.reason instanceof RateLimitError,
          )

          if (rateLimited && rateLimited.status === 'rejected') {
            const wait = (rateLimited.reason as RateLimitError).retryAfterSeconds
            updateProgress.value.status = `Rate limited — retry in ${wait}s`
            addToast(`GitHub rate limit hit. ${updatedCount} modules updated. Retry in ${wait}s.`, 'error', wait * 1000)
            break
          }

          for (const result of results) {
            if (result.status === 'fulfilled' && result.value) updatedCount++
            updateProgress.value.current++
          }
          updateProgress.value.status = ''
        } catch {
          updateProgress.value.status = ''
        }
      }
    } finally {
      isUpdatingAll.value = false
    }

    return updatedCount
  }

  return { isUpdatingAll, updateProgress, loadTags, loadCachedTags, updateAllToLatest }
}
