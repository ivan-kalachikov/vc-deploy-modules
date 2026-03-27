import { ref } from 'vue'
import type { ModuleViewModel } from '../types'
import { getCachedTags, setCachedTags } from '../services/tagCache'
import { fetchTags } from '../services/github'
import { getRepoName } from '../config/moduleRepoMapping'

export function useModuleTags() {
  const isUpdatingAll = ref(false)
  const updateProgress = ref({ current: 0, total: 0 })

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
    } catch {
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
  ): Promise<number> {
    const githubModules = modules.filter(
      (m) => m.sourceType === 'GithubReleases',
    )
    if (githubModules.length === 0) return 0

    isUpdatingAll.value = true
    updateProgress.value = { current: 0, total: githubModules.length }

    let updatedCount = 0

    try {
      for (const module of githubModules) {
        try {
          if (updateProgress.value.current > 0) {
            await new Promise((resolve) => setTimeout(resolve, 500))
          }

          await loadTags(module, true)

          if (module.tags?.length) {
            const latestVersion = module.tags[0]
            onModuleUpdated(module.id, latestVersion)
            updatedCount++
          }
        } finally {
          updateProgress.value.current++
        }
      }
    } finally {
      isUpdatingAll.value = false
    }

    return updatedCount
  }

  return { isUpdatingAll, updateProgress, loadTags, loadCachedTags, updateAllToLatest }
}
