<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { ConfigurationData, ModuleType } from '../types'

const props = defineProps<{
  config: ConfigurationData
}>()

const emit = defineEmits<{
  'module-update': [moduleId: string, type: ModuleType, value: string]
}>()

// Local state for input values
const inputValues = ref<Record<string, string>>({})

// Helper function to get module ID
const getModuleId = (module: any) => {
  if (module.Id) return module.Id
  return module.BlobName?.split('_')[0] || ''
}

// Computed sorted sources
const sortedSources = computed(() => {
  return props.config.Sources.map(source => ({
    ...source,
    Modules: [...source.Modules].sort((a, b) =>
      getModuleId(a).localeCompare(getModuleId(b))
    )
  }))
})

// Initialize input values from props
watch(() => props.config, (newConfig) => {
  newConfig.Sources.forEach(source => {
    source.Modules.forEach(module => {
      const moduleId = getModuleId(module)
      const value = source.Name === 'GithubReleases' ? module.Version : module.BlobName
      inputValues.value[`${moduleId}-${source.Name}`] = value || ''
    })
  })
}, { immediate: true })

const handleInputChange = (moduleId: string, type: ModuleType, value: string) => {
  inputValues.value[`${moduleId}-${type}`] = value
  emit('module-update', moduleId, type, value)
}

const moveModule = (moduleId: string, fromType: ModuleType, toType: ModuleType) => {
  const module = props.config.Sources.find(s => s.Name === fromType)?.Modules
    .find(m => (fromType === 'GithubReleases' ? m.Id === moduleId : m.BlobName?.startsWith(moduleId)))

  if (!module) return

  // Create new module object for the target type
  const newModule: typeof module = {}
  if (toType === 'GithubReleases') {
    newModule.Id = moduleId
    newModule.Version = module.Version || ''
  } else {
    newModule.BlobName = module.BlobName || `${moduleId}_0.0.0.zip`
  }

  // Remove from old type and add to new type
  emit('module-update', moduleId, fromType, '__DELETE__') // Special value to remove
  emit('module-update', moduleId, toType, toType === 'GithubReleases' ? newModule.Version : newModule.BlobName)
}

const getModuleValue = (module: any, sourceName: string) => {
  return sourceName === 'GithubReleases' ? module.Version : module.BlobName
}
</script>

<template>
  <div class="module-list">
    <div v-for="source in sortedSources" :key="source.Name" class="source-section">
      <div class="section-container">
        <h2>{{ source.Name === 'AzureBlob' ? 'Azure Blob Storage' : 'GitHub Releases' }}</h2>
        <div class="modules">
          <div
            v-for="module in source.Modules"
            :key="getModuleId(module)"
            class="module-item"
          >
            <div class="module-info">
              <span class="module-id">{{ getModuleId(module) }}</span>
            </div>
            <div class="module-controls">
              <select
                :value="source.Name"
                @change="(e) => moveModule(
                  getModuleId(module),
                  source.Name as ModuleType,
                  e.target.value as ModuleType
                )"
              >
                <option value="GithubReleases">GitHub Releases</option>
                <option value="AzureBlob">Azure Blob</option>
              </select>
              <div class="input-container">
                <input
                  type="text"
                  :value="inputValues[`${getModuleId(module)}-${source.Name}`]"
                  :placeholder="source.Name === 'GithubReleases' ? 'Version' : 'Blob Name'"
                  @input="(e) => handleInputChange(
                    getModuleId(module),
                    source.Name as ModuleType,
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
