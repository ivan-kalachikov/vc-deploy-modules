import { ref } from 'vue'
import type { ModuleViewModel } from '../types'
import { getCachedTags, setCachedTags } from '../services/tagCache'
import { fetchTags, RateLimitError, getRateLimitRemaining } from '../services/github'
import { getRepoName } from '../config/moduleRepoMapping'
import { useToast } from './useToast'


function formatWait(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  const mins = Math.ceil(seconds / 60)
  return mins < 60 ? `${mins}min` : `${Math.floor(mins / 60)}h ${mins % 60}min`
}

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
    let stopped = false

    try {
      for (let i = 0; i < githubModules.length && !stopped; i += batchSize) {
        if (i > 0) await new Promise(r => setTimeout(r, 300))

        const remaining = getRateLimitRemaining()
        if (remaining !== null && remaining < batchSize) {
          updateProgress.value.status = `API quota exhausted`
          const hint = getRateLimitRemaining() === 0 ? ' Set a GitHub token for 5000 req/hour.' : ''
          addToast(`GitHub API limit reached. ${updatedCount} modules updated.${hint}`, 'error')
          break
        }

        const batch = githubModules.slice(i, i + batchSize)
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

        for (const result of results) {
          updateProgress.value.current++

          if (result.status === 'rejected' && result.reason instanceof RateLimitError) {
            const wait = result.reason.retryAfterSeconds
            const waitStr = formatWait(wait)
            updateProgress.value.status = `Rate limited — retry in ${waitStr}`
            addToast(`GitHub rate limit hit. ${updatedCount} modules updated. Retry in ${waitStr}.`, 'error', Math.min(wait * 1000, 10000))
            stopped = true
            break
          }

          if (result.status === 'fulfilled' && result.value) {
            updatedCount++
          }
        }
      }
    } finally {
      isUpdatingAll.value = false
    }

    return updatedCount
  }

  return { isUpdatingAll, updateProgress, loadTags, loadCachedTags, updateAllToLatest }
}
