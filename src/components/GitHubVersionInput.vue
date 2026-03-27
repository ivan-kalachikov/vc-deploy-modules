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

.github-input-group input {
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

.github-input-group select {
  flex: 1;
  padding: 8px 28px 8px 12px;
  appearance: none;
  border: 1px solid var(--border-secondary);
  border-radius: var(--radius-sm);
  font-size: 14px;
  font-family: monospace;
  background: var(--surface-card) url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23666' d='M6 8L1 3h10z'/%3E%3C/svg%3E") no-repeat right 8px center;
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
  padding: 6px;
  background: transparent;
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-sm);
  cursor: pointer;
  color: var(--text-primary);
  font-size: 14px;
  min-width: 32px;
  min-height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition-fast);
}

.load-tags-button:hover:not(:disabled) {
  background: var(--surface-tertiary);
}

.load-tags-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
