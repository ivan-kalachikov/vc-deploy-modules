<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { ConfigurationData, ModuleType } from '../types'

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

// Computed sorted sources
const sortedSources = computed(() => {
  return props.config.Sources.map(source => ({
    ...source,
    Modules: [...source.Modules].sort((a, b) =>
      getModuleId(a as ModuleWithId).localeCompare(getModuleId(b as ModuleWithId))
    )
  }))
})

// Computed property to sort modules
const sortedModules = computed(() => {
  return [...modules.value].sort((a, b) => a.id.localeCompare(b.id))
})

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

const handleInputChange = (moduleId: string, type: ModuleType, value: string) => {
  // Update local view model:
  const module = modules.value.find(m => m.id === moduleId && m.sourceType === type)
  if (module) {
    module.value = value  // Directly update the value
  }

  // Construct full value for Azure Blob (add prefix):
  const fullValue = type === 'GithubReleases'
    ? value
    : value ? `${moduleId}_${value}` : ''

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
              <span class="module-id">{{ formatModuleId(module.id) }}</span>
            </div>
            <div class="module-controls">
              <select
                :value="sourceType"
                @change="(e) => moveModule(
                  module.id,
                  sourceType as ModuleType,
                  e.target.value as ModuleType
                )"
              >
                <option value="GithubReleases">GitHub Releases</option>
                <option value="AzureBlob">Azure Blob</option>
              </select>
              <div class="input-container">
                <input
                  type="text"
                  :value="module.value"
                  :placeholder="sourceType === 'GithubReleases' ? 'Version' : 'Full filename'"
                  @input="(e) => handleInputChange(
                    module.id,
                    sourceType as ModuleType,
                    (e.target as HTMLInputElement).value
                  )"
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
  gap: 15px;
  align-items: center;
  background: white;
  padding: 10px;
  border-radius: 4px;
  border: 1px solid #ddd;
}

.module-info {
  min-width: 250px;
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
  gap: 10px;
  flex: 1;
  align-items: center;
}

.input-container {
  flex: 1;
  position: relative;
}

input, select {
  padding: 8px 12px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 14px;
  background: white;
  width: 100%;
}

input:focus, select:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 2px rgba(0,123,255,0.1);
}

select {
  min-width: 150px;
  cursor: pointer;
}

input {
  min-width: 300px;
}

input::placeholder {
  color: #999;
}
</style>
