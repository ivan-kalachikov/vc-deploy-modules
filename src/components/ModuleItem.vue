<script setup lang="ts">
import type { ModuleViewModel, ModuleType } from '../types'
import { isValidVersion, isValidBlobName } from '../utils/validation'
import { formatModuleId } from '../utils/helpers'
import { getGitHubRepoUrl } from '../config/moduleRepoMapping'
import GitHubVersionInput from './GitHubVersionInput.vue'

const props = defineProps<{
  module: ModuleViewModel
  sourceType: ModuleType
}>()

const emit = defineEmits<{
  'update': [moduleId: string, type: ModuleType, value: string]
  'move': [moduleId: string, fromType: ModuleType, toType: ModuleType]
  'load-tags': [moduleId: string]
}>()

const extractPrUrl = (blobName: string): string | null => {
  const prMatch = blobName.match(/-pr-(\d+)-/)
  return prMatch ? `https://github.com/VirtoCommerce/vc-platform/pull/${prMatch[1]}` : null
}

const onSourceTypeChange = (e: Event) => {
  const target = e.target as HTMLSelectElement
  emit('move', props.module.id, props.sourceType, target.value as ModuleType)
}

const onAzureInput = (e: Event) => {
  const target = e.target as HTMLInputElement
  emit('update', props.module.id, props.sourceType, target.value)
}

const onAzureBlur = (e: Event) => {
  const target = e.target as HTMLInputElement
  target.value = target.value.trim()
}

const azureTitle = (value: string): string => {
  if (value) {
    const prUrl = extractPrUrl(value)
    if (prUrl) return `PR: ${prUrl}`
  }
  return 'Format should be: version[-suffix].zip (e.g., 3.806.0-pr-62-df9c.zip)'
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
        <GitHubVersionInput
          v-if="sourceType === 'GithubReleases'"
          :module="module"
          @change="(val: string) => emit('update', module.id, sourceType, val)"
          @load-tags="emit('load-tags', module.id)"
        />
        <input
          v-else
          :data-module-id="module.id.trim()"
          type="text"
          :value="module.value"
          placeholder="Version with suffix (e.g., 3.806.0-pr-62-df9c.zip)"
          :title="azureTitle(module.value)"
          :class="{
            'error': !module.value.trim() ||
                    (module.value.trim() && !isValidBlobName(module.value))
          }"
          @input="onAzureInput"
          @blur="onAzureBlur"
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
  padding: 8px 12px;
  border: 1px solid var(--border-secondary);
  border-radius: var(--radius-sm);
  font-size: 14px;
  font-family: monospace;
  background: var(--surface-card);
  color: var(--text-primary);
}

.input-container {
  flex: 1;
  min-width: 0;
}

.input-container input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid var(--border-secondary);
  border-radius: var(--radius-sm);
  font-size: 14px;
  font-family: monospace;
  background: var(--surface-card);
  color: var(--text-primary);
  min-width: 0;
}

.input-container input:focus,
.module-controls select:focus {
  outline: none;
  border-color: var(--border-focus);
  box-shadow: 0 0 0 2px var(--border-focus-shadow);
}

.module-controls select {
  cursor: pointer;
}

.input-container input::placeholder {
  color: var(--text-tertiary);
}

.input-container input.error {
  border-color: var(--error);
  background-color: var(--error-bg);
}

.input-container input.error:focus {
  border-color: var(--error);
  box-shadow: 0 0 0 2px rgba(211, 47, 47, 0.1);
}
</style>
