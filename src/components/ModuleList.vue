<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { ConfigurationData, ModuleType } from '../types'
import type { Event } from '@vue/runtime-dom'

interface ModuleWithId extends ModuleBase {
  _id?: string // Internal ID that remains constant
}

interface ModuleViewModel {
  id: string          // Module identifier (always the same as GitHub's Id)
  value: string       // Current input value
  sourceType: string  // 'GithubReleases' or 'AzureBlob'
}

const props = defineProps<{
  config: ConfigurationData
  sortEnabled: boolean
}>()

const emit = defineEmits<{
  'module-update': [moduleId: string, type: ModuleType, value: string]
}>()

const modules = ref<ModuleViewModel[]>([])

// Helper function to get module ID
const getModuleId = (module: ModuleWithId) => {
  // If we already have an internal ID, use it
  if (module._id) return module._id

  // Otherwise, create one and store it
  const id = module.Id || module.BlobName?.split('_')[0] || ''
  module._id = id
  return id
}

// Helper function to format module ID for display
const formatModuleId = (id: string) => {
  return id.replace(/^VirtoCommerce\./, '')
}

// Convert config data to view models
const updateModules = (config: ConfigurationData) => {
  const viewModels: ModuleViewModel[] = []

  config.Sources.forEach(source => {
    source.Modules.forEach(module => {
      // Consistent ID handling:
      const moduleId = source.Name === 'GithubReleases'
        ? module.Id
        : module.BlobName?.split('_')[0]

      if (!moduleId) return // Skip invalid modules

      // Get the value part (no .zip handling):
      const value = source.Name === 'GithubReleases'
        ? module.Version || ''
        : module.BlobName?.split('_')[1] || ''

      viewModels.push({
        id: moduleId,
        value: value,
        sourceType: source.Name
      })
    })
  })

  // Use spread to trigger reactivity:
  modules.value = [...viewModels]
}

// Watch for config changes
watch(() => props.config, (newConfig) => {
  if (newConfig) {
    updateModules(newConfig)
  }
}, { immediate: true })

// Helper function to validate version format (major.minor.patch)
const isValidVersion = (version: string): boolean => {
  const versionRegex = /^\d+\.\d+\.\d+$/
  return versionRegex.test(version.trim())
}

// Helper function to validate blob filename format (version-suffix.zip)
const isValidBlobName = (name: string): boolean => {
  const blobRegex = /^\d+\.\d+\.\d+(-[\w.-]+)?\.zip$/
  return blobRegex.test(name.trim())
}

// Update hasInvalidInputs to include blob format validation
const hasInvalidInputs = computed(() => {
  return modules.value.some(module => {
    if (!module.value.trim()) return true
    if (module.value.trim()) {
      return module.sourceType === 'GithubReleases'
        ? !isValidVersion(module.value)
        : !isValidBlobName(module.value)
    }
    return false
  })
})

const handleInputChange = (moduleId: string, type: ModuleType, value: string) => {
  const trimmedValue = value.trim()

  // Update local view model:
  const module = modules.value.find(m => m.id === moduleId && m.sourceType === type)
  if (module) {
    module.value = trimmedValue
  }

  // Construct full value for Azure Blob (add prefix):
  const fullValue = type === 'GithubReleases'
    ? trimmedValue
    : `${moduleId}_${trimmedValue}`

  emit('module-update', moduleId, type, fullValue)
}

const moveModule = (moduleId: string, fromType: ModuleType, toType: ModuleType) => {
    // Find the index of the module in our view models:
    const existingModuleIndex = modules.value.findIndex(m => m.id === moduleId && m.sourceType === fromType);
    if (existingModuleIndex !== -1) {
        // Remove from the old source, using splice to trigger reactivity:
        modules.value.splice(existingModuleIndex, 1);
    }
    // Create a new module object for the target source with an empty value:
    const newModule: ModuleViewModel = {
        id: moduleId,
        value: '',
        sourceType: toType,
    };
    // Add the new module:
    modules.value.push(newModule);

    // Emit updates to the parent:
    emit('module-update', moduleId, fromType, '__DELETE__'); // Remove from old source
    emit('module-update', moduleId, toType, '');               // Add to new source (will store BlobName as moduleId_ if empty)
};

// Method to scroll to first invalid input
const scrollToFirstInvalidInput = () => {
  const firstInvalidInput = document.querySelector('.error') as HTMLElement
  if (firstInvalidInput) {
    firstInvalidInput.scrollIntoView({ behavior: 'smooth', block: 'center' })
    firstInvalidInput.focus()
  }
}

// Computed property for filtered and sorted modules
const sortedModules = computed(() => {
  if (!props.sortEnabled) {
    return modules.value
  }
  return [...modules.value].sort((a, b) => a.id.localeCompare(b.id))
})

// Expose these to parent
defineExpose({
  hasInvalidInputs,
  scrollToFirstInvalidInput
})
</script>

<template>
  <div class="module-list">
    <div
      v-for="sourceType in ['AzureBlob', 'GithubReleases']"
      :key="sourceType"
      class="source-section"
    >
      <div class="section-container">
        <h2>{{ sourceType === 'AzureBlob' ? 'Azure Blob Storage' : 'GitHub Releases' }}</h2>
        <div class="modules">
          <div
            v-for="module in sortedModules.filter(m => m.sourceType === sourceType)"
            :key="module.id + '-' + module.sourceType"
            class="module-item"
          >
            <div class="module-info">
              <span class="module-id" :title="formatModuleId(module.id)">{{ formatModuleId(module.id) }}</span>
            </div>
            <div class="module-controls">
              <select
                :value="sourceType"
                @change="(e: Event) => {
                  const target = e.target as HTMLSelectElement;
                  moveModule(module.id, sourceType as ModuleType, target.value as ModuleType);
                }"
              >
                <option value="GithubReleases">GitHub Releases</option>
                <option value="AzureBlob">Azure Blob</option>
              </select>
              <div class="input-container">
                <input
                  type="text"
                  :value="module.value"
                  :placeholder="sourceType === 'GithubReleases' ? 'Version' : 'Version with suffix (e.g., 3.806.0-pr-62-df9c.zip)'"
                  :class="{
                    'error': !module.value.trim() ||
                            (module.value.trim() && (
                              (sourceType === 'GithubReleases' && !isValidVersion(module.value)) ||
                              (sourceType === 'AzureBlob' && !isValidBlobName(module.value))
                            ))
                  }"
                  :title="sourceType === 'GithubReleases'
                    ? 'Format should be: major.minor.patch (e.g., 3.809.0)'
                    : 'Format should be: version[-suffix].zip (e.g., 3.806.0-pr-62-df9c.zip)'"
                  @input="(e: Event) => {
                    const target = e.target as HTMLInputElement;
                    handleInputChange(module.id, sourceType as ModuleType, target.value);
                  }"
                  @blur="(e: Event) => {
                    const target = e.target as HTMLInputElement;
                    target.value = target.value.trim();
                  }"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.module-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.source-section {
  margin-bottom: 10px;
}

.section-container {
  background: #f8f8f8;
  border-radius: 8px;
  padding: 20px;
}

.section-container h2 {
  color: #333;
  margin-bottom: 20px;
  font-weight: 600;
}

.modules {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.module-item {
  display: flex;
  gap: 12px;
  align-items: center;
  padding-right: 12px;
  background: white;
  padding: 10px;
  border-radius: 4px;
  border: 1px solid #ddd;
}

.module-info {
  width: 30%;
  flex-shrink: 0;
  padding: 5px;
}

.module-id {
  font-family: monospace;
  font-size: 14px;
  color: #000;
  font-weight: 500;
  display: block;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.module-controls {
  display: flex;
  gap: 8px;
  align-items: center;
  width: 70%;
  min-width: 0;
}

.module-controls select {
  width: 37%;
  padding: 8px 12px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 14px;
  font-family: monospace;
  background: white;
}

.input-container {
  flex: 1;
  min-width: 0;
}

.module-controls input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 14px;
  font-family: monospace;
  background: white;
  min-width: 0;
}

input:focus, select:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 2px rgba(0,123,255,0.1);
}

select {
  cursor: pointer;
}

input::placeholder {
  color: #999;
}

input.error {
  border-color: #d32f2f;
  background-color: #fff5f5;
}

input.error:focus {
  border-color: #d32f2f;
  box-shadow: 0 0 0 2px rgba(211, 47, 47, 0.1);
}
</style>
