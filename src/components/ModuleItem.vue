<script setup lang="ts">
import type { ModuleViewModel, ModuleType } from '../types'
import { formatModuleId } from '../utils/helpers'
import { getGitHubRepoUrl } from '../config/moduleRepoMapping'
import VersionCombobox from './VersionCombobox.vue'

const props = defineProps<{
  module: ModuleViewModel
  sourceType: ModuleType
}>()

const emit = defineEmits<{
  'update': [moduleId: string, type: ModuleType, value: string]
  'move': [moduleId: string, fromType: ModuleType, toType: ModuleType]
  'tags-loaded': [moduleId: string, tags: string[]]
}>()

const onSourceTypeChange = (e: Event) => {
  const target = e.target as HTMLSelectElement
  emit('move', props.module.id, props.sourceType, target.value as ModuleType)
}
</script>

<template>
  <div class="module-item">
    <div class="module-info">
      <a
        :href="getGitHubRepoUrl(module.id)"
        target="_blank"
        rel="noopener noreferrer"
        class="module-id"
        :title="formatModuleId(module.id)"
      >
        {{ formatModuleId(module.id) }}
      </a>
    </div>
    <div class="module-controls">
      <select :value="sourceType" @change="onSourceTypeChange">
        <option value="GithubReleases">GitHub Releases</option>
        <option value="AzureBlob">Azure Blob</option>
      </select>
      <div class="input-container">
        <VersionCombobox
          :module="module"
          :source-type="sourceType"
          @change="(val: string) => emit('update', module.id, sourceType, val)"
          @tags-loaded="(id: string, tags: string[]) => emit('tags-loaded', id, tags)"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.module-item {
  display: flex;
  gap: 12px;
  align-items: center;
  padding: 10px 12px 10px 10px;
  background: var(--surface-card);
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-primary);
}

.module-info {
  width: 30%;
  flex-shrink: 0;
  padding: 5px;
}

.module-id {
  font-family: monospace;
  font-size: 14px;
  color: var(--link);
  font-weight: 500;
  display: block;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-decoration: none;
}

.module-id:hover {
  text-decoration: underline;
  color: var(--link-hover);
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
  padding: 8px 28px 8px 12px;
  appearance: none;
  border: 1px solid var(--border-secondary);
  border-radius: var(--radius-sm);
  font-size: 14px;
  font-family: monospace;
  background: var(--surface-card) url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23666' d='M6 8L1 3h10z'/%3E%3C/svg%3E") no-repeat right 8px center;
  color: var(--text-primary);
}

.input-container {
  flex: 1;
  min-width: 0;
}

.module-controls select:focus {
  outline: none;
  border-color: var(--border-focus);
  box-shadow: 0 0 0 2px var(--border-focus-shadow);
}

.module-controls select {
  cursor: pointer;
}
</style>
