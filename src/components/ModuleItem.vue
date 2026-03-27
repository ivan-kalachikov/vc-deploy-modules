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

const isGitHub = () => props.sourceType === 'GithubReleases'

const toggleSource = () => {
  const to: ModuleType = isGitHub() ? 'AzureBlob' : 'GithubReleases'
  emit('move', props.module.id, props.sourceType, to)
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
      <button
        class="source-toggle"
        :title="isGitHub() ? 'Move to Azure Blob' : 'Move to GitHub Releases'"
        @click="toggleSource"
      >{{ isGitHub() ? '↓ Blob' : '↑ Releases' }}</button>
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

.source-toggle {
  padding: 8px 10px;
  border: 1px solid var(--border-secondary);
  border-radius: var(--radius-sm);
  background: var(--surface-tertiary);
  color: var(--text-secondary);
  font-size: 12px;
  cursor: pointer;
  transition: all var(--transition-fast);
  white-space: nowrap;
  text-align: center;
}

.source-toggle:hover {
  border-color: var(--border-focus);
}

.input-container {
  flex: 1;
  min-width: 0;
}
</style>
