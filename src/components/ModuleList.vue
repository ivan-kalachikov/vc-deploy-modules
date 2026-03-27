<script setup lang="ts">
import { ref, watch, computed, nextTick } from 'vue'
import type { ConfigurationData, ModuleType, ModuleViewModel } from '../types'
import { isValidVersion, isValidBlobName } from '../utils/validation'
import { useModuleTags } from '../composables/useModuleTags'
import { useToast } from '../composables/useToast'
import ModuleSourceSection from './ModuleSourceSection.vue'
import BulkUpdateButton from './BulkUpdateButton.vue'

const props = defineProps<{
  config: ConfigurationData
  originalConfig: ConfigurationData | null
  sortEnabled: boolean
}>()

const emit = defineEmits<{
  'module-update': [moduleId: string, type: ModuleType, value: string]
}>()

const modules = ref<ModuleViewModel[]>([])
const { isUpdatingAll, updateProgress, loadTags, loadCachedTags, updateAllToLatest } = useModuleTags()
const { addToast } = useToast()

// Convert config data to view models
const findOriginal = (moduleId: string): { value: string; sourceType: ModuleType } | null => {
  if (!props.originalConfig) return null
  for (const source of props.originalConfig.Sources) {
    const mod = source.Modules.find(m =>
      source.Name === 'GithubReleases'
        ? m.Id === moduleId
        : m.BlobName?.startsWith(moduleId + '_'),
    )
    if (mod) {
      const val = source.Name === 'GithubReleases'
        ? mod.Version || ''
        : mod.BlobName?.split('_')[1] || ''
      return { value: val, sourceType: source.Name }
    }
  }
  return null
}

const buildViewModels = (config: ConfigurationData): ModuleViewModel[] => {
  const vms: ModuleViewModel[] = []
  config.Sources.forEach(source => {
    source.Modules.forEach(module => {
      const moduleId = source.Name === 'GithubReleases'
        ? module.Id
        : module.BlobName?.split('_')[0]
      if (!moduleId) return

      const value = source.Name === 'GithubReleases'
        ? module.Version || ''
        : module.BlobName?.split('_')[1] || ''

      const orig = findOriginal(moduleId)
      vms.push({
        id: moduleId, value, sourceType: source.Name,
        originalValue: orig?.value,
        originalSourceType: orig?.sourceType,
      })
    })
  })
  return vms
}

// Watch for config changes
watch(() => props.config, (newConfig) => {
  if (newConfig) modules.value = buildViewModels(newConfig)
}, { immediate: true })

// Load cached tags when modules change
watch(() => modules.value, (newModules) => {
  newModules.forEach(m => {
    if (m.sourceType === 'GithubReleases') loadCachedTags(m)
  })
}, { immediate: true })

// Sorted / filtered modules per source type
const sortedModules = computed(() =>
  props.sortEnabled
    ? [...modules.value].sort((a, b) => a.id.localeCompare(b.id))
    : modules.value,
)

const azureModules = computed(() =>
  sortedModules.value.filter(m => m.sourceType === 'AzureBlob'),
)
const githubModules = computed(() =>
  sortedModules.value.filter(m => m.sourceType === 'GithubReleases'),
)

// Input change handler
const handleInputChange = (moduleId: string, type: ModuleType, value: string) => {
  const trimmed = value.trim()
  const module = modules.value.find(m => m.id === moduleId && m.sourceType === type)
  if (module) module.value = trimmed

  const fullValue = type === 'GithubReleases'
    ? trimmed
    : `${moduleId}_${trimmed}`
  emit('module-update', moduleId, type, fullValue)
}

// Revert a single module to its original state
const handleRevert = (moduleId: string, currentType: ModuleType) => {
  const module = modules.value.find(m => m.id === moduleId && m.sourceType === currentType)

  // Deleted module — restore from original config
  if (!module) {
    const orig = findOriginal(moduleId)
    if (!orig) return
    const restored: ModuleViewModel = {
      id: moduleId,
      value: orig.value,
      sourceType: orig.sourceType,
      originalValue: orig.value,
      originalSourceType: orig.sourceType,
    }
    if (orig.sourceType === 'GithubReleases') loadCachedTags(restored)
    modules.value.push(restored)
    const fullValue = orig.sourceType === 'GithubReleases'
      ? orig.value
      : `${moduleId}_${orig.value}`
    emit('module-update', moduleId, orig.sourceType, fullValue)
    return
  }

  if (!module.originalSourceType) return

  const origSource = module.originalSourceType
  const origValue = module.originalValue || ''

  if (origSource !== currentType) {
    // Was moved — move it back and set original value
    moveModule(moduleId, currentType, origSource).then(() => {
      const restored = modules.value.find(m => m.id === moduleId)
      if (restored) {
        restored.value = origValue
        const fullValue = origSource === 'GithubReleases'
          ? origValue
          : `${moduleId}_${origValue}`
        emit('module-update', moduleId, origSource, fullValue)
      }
    })
  } else {
    // Same source, just revert value
    module.value = module.originalValue || ''
    const fullValue = currentType === 'GithubReleases'
      ? module.value
      : `${moduleId}_${module.value}`
    emit('module-update', moduleId, currentType, fullValue)
  }
}

// Move module between sources
const moveModule = async (moduleId: string, fromType: ModuleType, toType: ModuleType) => {
  const idx = modules.value.findIndex(m => m.id === moduleId && m.sourceType === fromType)
  if (idx !== -1) modules.value.splice(idx, 1)

  const newModule: ModuleViewModel = { id: moduleId, value: '', sourceType: toType }

  if (toType === 'GithubReleases') {
    loadCachedTags(newModule)
    await loadTags(newModule, true)
    if (newModule.tags?.length) {
      newModule.value = newModule.tags[0]
    }
  }

  // Preserve original state from the removed module
  const removed = modules.value.find(m => m.id === moduleId && m.sourceType === fromType)
  if (removed) {
    newModule.originalValue = removed.originalValue
    newModule.originalSourceType = removed.originalSourceType
  }

  modules.value.push(newModule)

  // Delete then add in sequence, awaiting reactivity between
  emit('module-update', moduleId, fromType, '__DELETE__')
  await nextTick()
  const fullValue = toType === 'GithubReleases'
    ? newModule.value
    : `${moduleId}_${newModule.value}`
  emit('module-update', moduleId, toType, fullValue)
}

// Delete a module (mark as deleted, keep in view models for undo)
const handleDelete = (moduleId: string, type: ModuleType) => {
  const idx = modules.value.findIndex(m => m.id === moduleId && m.sourceType === type)
  if (idx === -1) return
  modules.value.splice(idx, 1)
  emit('module-update', moduleId, type, '__DELETE__')
}

// Add a new module
const handleAdd = async (moduleId: string, type: ModuleType) => {
  const newModule: ModuleViewModel = { id: moduleId, value: '', sourceType: type }

  if (type === 'GithubReleases') {
    loadCachedTags(newModule)
    await loadTags(newModule, true)
    if (newModule.tags?.length) {
      newModule.value = newModule.tags[0]
    }
  }

  modules.value.push(newModule)

  const fullValue = type === 'GithubReleases'
    ? newModule.value
    : `${moduleId}_${newModule.value}`
  emit('module-update', moduleId, type, fullValue)
}

// Update all GitHub modules to latest
const handleUpdateAll = async () => {
  const count = await updateAllToLatest(modules.value, (moduleId, latestVersion) => {
    handleInputChange(moduleId, 'GithubReleases', latestVersion)
  })

  if (count > 0) {
    addToast(`Updated ${count} module${count > 1 ? 's' : ''} to latest versions`, 'success')
  } else {
    addToast('No modules were updated. This could be due to API rate limits or no available versions.', 'info')
  }
}

// Handle tags loaded from VersionCombobox
const handleTagsLoaded = (moduleId: string, tags: string[]) => {
  const module = modules.value.find(m => m.id === moduleId)
  if (module) module.tags = tags
}

// Validation
const invalidCount = computed(() =>
  modules.value.filter(module => {
    const trimmed = module.value.trim()
    if (!trimmed) return true
    if (module.sourceType === 'GithubReleases' && module.tags?.length) {
      return !trimmed || !isValidVersion(trimmed)
    }
    return module.sourceType === 'GithubReleases'
      ? !isValidVersion(trimmed)
      : !isValidBlobName(trimmed)
  }).length,
)

const hasInvalidInputs = computed(() => invalidCount.value > 0)

const azureSectionRef = ref<InstanceType<typeof ModuleSourceSection> | null>(null)
const githubSectionRef = ref<InstanceType<typeof ModuleSourceSection> | null>(null)

const scrollToFirstInvalidInput = () => {
  // Expand both sections to ensure error elements are visible
  azureSectionRef.value?.expand()
  githubSectionRef.value?.expand()
  nextTick(() => {
    const el = document.querySelector('.error') as HTMLElement
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      el.focus()
    }
  })
}

const expandAll = () => {
  azureSectionRef.value?.expand()
  githubSectionRef.value?.expand()
}

defineExpose({ hasInvalidInputs, invalidCount, scrollToFirstInvalidInput, handleRevert, expandAll })
</script>

<template>
  <div class="module-list">
    <ModuleSourceSection
      ref="azureSectionRef"
      source-type="AzureBlob"
      :modules="azureModules"
      @module-update="handleInputChange"
      @module-move="moveModule"
      @module-revert="handleRevert"
      @module-delete="handleDelete"
      @module-add="handleAdd"
      @tags-loaded="handleTagsLoaded"
    />

    <ModuleSourceSection
      ref="githubSectionRef"
      source-type="GithubReleases"
      :modules="githubModules"
      @module-update="handleInputChange"
      @module-move="moveModule"
      @module-revert="handleRevert"
      @module-delete="handleDelete"
      @module-add="handleAdd"
      @tags-loaded="handleTagsLoaded"
    >
      <template #header-actions>
        <BulkUpdateButton
          :is-updating="isUpdatingAll"
          :progress="updateProgress"
          @update-all="handleUpdateAll"
        />
      </template>
    </ModuleSourceSection>
  </div>
</template>

<style scoped>
.module-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
</style>
