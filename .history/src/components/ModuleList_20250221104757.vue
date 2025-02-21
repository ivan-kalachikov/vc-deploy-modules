<script setup lang="ts">
import { ConfigurationData, ModuleType } from '../types'

const props = defineProps<{
  config: ConfigurationData
}>()

const emit = defineEmits<{
  'module-update': [moduleId: string, type: ModuleType, value: string]
}>()

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
</script>

<template>
  <div class="module-list">
    <div v-for="source in config.Sources" :key="source.Name" class="source-section">
      <h2>{{ source.Name }}</h2>
      <div class="modules">
        <div
          v-for="module in source.Modules"
          :key="module.Id || module.BlobName"
          class="module-item"
        >
          <span class="module-name">{{ module.Id || module.BlobName?.split('_')[0] }}</span>
          <select
            :value="source.Name"
            @change="(e) => moveModule(
              module.Id || module.BlobName?.split('_')[0] || '',
              source.Name as ModuleType,
              e.target.value as ModuleType
            )"
          >
            <option value="GithubReleases">GitHub Releases</option>
            <option value="AzureBlob">Azure Blob</option>
          </select>
          <input
            type="text"
            :value="source.Name === 'GithubReleases' ? module.Version : module.BlobName"
            :placeholder="source.Name === 'GithubReleases' ? 'Version' : 'Blob Name'"
            @input="(e) => emit('module-update',
              module.Id || module.BlobName?.split('_')[0] || '',
              source.Name as ModuleType,
              (e.target as HTMLInputElement).value
            )"
          />
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

.module-name {
  min-width: 200px;
  font-family: monospace;
}

input, select {
  padding: 5px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

select {
  min-width: 150px;
}
</style>
