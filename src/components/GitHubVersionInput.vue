<script setup lang="ts">
import type { ModuleViewModel } from '../types'
import { isValidVersion } from '../utils/validation'

const props = defineProps<{
  module: ModuleViewModel
}>()

const emit = defineEmits<{
  'change': [value: string]
  'load-tags': []
}>()

const onSelectChange = (e: Event) => {
  const target = e.target as HTMLSelectElement
  emit('change', target.value)
}

const onInputChange = (e: Event) => {
  const target = e.target as HTMLInputElement
  emit('change', target.value)
}

const onInputBlur = (e: Event) => {
  const target = e.target as HTMLInputElement
  target.value = target.value.trim()
}
</script>

<template>
  <div class="github-input-group">
    <template v-if="module.tags">
      <select
        :value="module.value"
        :data-module-id="module.id.trim()"
        :class="{ 'error': !module.value || module.value === '' || !isValidVersion(module.value) }"
        @change="onSelectChange"
      >
        <option value="" disabled>Select version</option>
        <option v-for="tag in module.tags" :key="tag" :value="tag">
          {{ tag }}
        </option>
      </select>
    </template>
    <template v-else>
      <input
        :data-module-id="module.id.trim()"
        type="text"
        :value="module.value"
        placeholder="Version"
        :class="{
          'error': !module.value.trim() || (module.value.trim() && !isValidVersion(module.value))
        }"
        title="Format should be: major.minor.patch (e.g., 3.809.0)"
        @input="onInputChange"
        @blur="onInputBlur"
      />
    </template>
    <button
      class="load-tags-button"
      :disabled="module.isLoadingTags"
      :title="module.tags ? 'Reload tags' : 'Load available versions'"
      @click="emit('load-tags')"
    >
      {{ module.isLoadingTags ? '\u231B' : '\u21BB' }}
    </button>
  </div>
</template>

<style scoped>
.github-input-group {
  display: flex;
  gap: 8px;
  width: 100%;
}

.github-input-group input,
.github-input-group select {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid var(--border-secondary);
  border-radius: var(--radius-sm);
  font-size: 14px;
  font-family: monospace;
  background: var(--surface-card);
  color: var(--text-primary);
  min-width: 0;
}

.github-input-group input:focus,
.github-input-group select:focus {
  outline: none;
  border-color: var(--border-focus);
  box-shadow: 0 0 0 2px var(--border-focus-shadow);
}

.github-input-group input::placeholder {
  color: var(--text-tertiary);
}

.github-input-group input.error,
.github-input-group select.error {
  border-color: var(--error);
  background-color: var(--error-bg);
}

.github-input-group input.error:focus,
.github-input-group select.error:focus {
  border-color: var(--error);
  box-shadow: 0 0 0 2px var(--error-focus-shadow);
}

.load-tags-button {
  padding: 8px;
  background: var(--surface-tertiary);
  border: 1px solid var(--border-secondary);
  border-radius: var(--radius-sm);
  cursor: pointer;
  color: var(--text-secondary);
  font-size: 14px;
  min-width: 35px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition-fast);
}

.load-tags-button:hover:not(:disabled) {
  background: var(--border-primary);
  transform: scale(1.05);
}

.load-tags-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
