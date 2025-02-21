<script setup lang="ts">
import { ConfigurationData, ModuleType } from '../types'

const props = defineProps<{
  config: ConfigurationData
}>()

const emit = defineEmits<{
  'module-update': [moduleId: string, type: ModuleType, value: string]
}>()
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

input {
  padding: 5px;
  border: 1px solid #ddd;
  border-radius: 4px;
}
</style>
