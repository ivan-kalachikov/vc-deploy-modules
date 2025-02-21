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
      <h2>{{ source.Name }}</h2>
      <div class="modules">
        <div
          v-for="module in source.Modules"
          :key="getModuleId(module)"
          class="module-item"
        >
          <div class="module-info">
            <span class="module-name">{{ getModuleId(module) }}</span>
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
</template>

<style scoped>
.source-section {
  margin-bottom: 30px;
}

.module-item {
  display: flex;
  gap: 10px;
  margin-bottom: 10px;
  align-items: center;
}

.module-info {
  min-width: 250px;
  flex-shrink: 0;
}

.module-name {
  font-family: monospace;
  color: #333;
  font-weight: 500;
}

.module-controls {
  display: flex;
  gap: 10px;
  flex: 1;
}

input, select {
  padding: 5px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

select {
  min-width: 150px;
}

input {
  min-width: 300px;
  flex: 1;
}
</style>
