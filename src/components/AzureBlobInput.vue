<script setup lang="ts">
import { ref } from 'vue'
import { onClickOutside } from '@vueuse/core'
import type { ModuleViewModel } from '../types'
import { isValidBlobName } from '../utils/validation'
import { getRepoName } from '../config/moduleRepoMapping'
import { fetchOpenPrs, fetchPrArtifact, type PrInfo } from '../services/github'
import { useToast } from '../composables/useToast'

const props = defineProps<{
  module: ModuleViewModel
}>()

const emit = defineEmits<{
  change: [value: string]
}>()

const { addToast } = useToast()
const prPickerRef = ref<HTMLElement>()
const prs = ref<PrInfo[]>()
const isLoadingPrs = ref(false)
const isLoadingArtifact = ref(false)

const extractPrUrl = (blobName: string): string | null => {
  const m = blobName.match(/-pr-(\d+)-/)
  return m ? `https://github.com/VirtoCommerce/vc-platform/pull/${m[1]}` : null
}

const inputTitle = (value: string): string => {
  if (value) {
    const prUrl = extractPrUrl(value)
    if (prUrl) return `PR: ${prUrl}`
  }
  return 'Format: version[-suffix].zip (e.g., 3.806.0-pr-62-df9c.zip)'
}

async function loadPrs() {
  isLoadingPrs.value = true
  try {
    const repo = getRepoName(props.module.id)
    prs.value = await fetchOpenPrs(repo)
    if (!prs.value.length) addToast('No open PRs found', 'info')
  } catch {
    addToast('Failed to load PRs', 'error')
  } finally {
    isLoadingPrs.value = false
  }
}

async function selectPr(prNumber: number) {
  isLoadingArtifact.value = true
  try {
    const repo = getRepoName(props.module.id)
    const artifact = await fetchPrArtifact(repo, String(prNumber))
    if (artifact) {
      const fileName = artifact.fileName.split('_')[1]
      emit('change', fileName)
    } else {
      addToast('No artifact URL found in PR description', 'error')
    }
  } catch {
    addToast('Failed to parse PR artifact', 'error')
  } finally {
    isLoadingArtifact.value = false
    prs.value = undefined
  }
}

onClickOutside(prPickerRef, () => { prs.value = undefined })

const onInput = (e: Event) => emit('change', (e.target as HTMLInputElement).value)
const onBlur = (e: Event) => { (e.target as HTMLInputElement).value = (e.target as HTMLInputElement).value.trim() }
</script>

<template>
  <div class="azure-input-group">
    <input
      :data-module-id="module.id.trim()"
      type="text"
      :value="module.value"
      placeholder="version[-suffix].zip"
      :title="inputTitle(module.value)"
      :class="{ error: !module.value.trim() || (module.value.trim() && !isValidBlobName(module.value)) }"
      @input="onInput"
      @blur="onBlur"
    />
    <div ref="prPickerRef" class="pr-picker">
      <button
        class="pr-button"
        :disabled="isLoadingPrs || isLoadingArtifact"
        :title="'Pick from open PRs'"
        @click="prs ? (prs = undefined) : loadPrs()"
      >
        {{ isLoadingPrs || isLoadingArtifact ? '\u231B' : 'PR' }}
      </button>
      <ul v-if="prs?.length" class="pr-dropdown">
        <li v-for="pr in prs" :key="pr.number" @click="selectPr(pr.number)">
          <span class="pr-number">#{{ pr.number }}</span>
          <span class="pr-title">{{ pr.title }}</span>
        </li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
.azure-input-group {
  display: flex;
  gap: 8px;
  width: 100%;
}

.azure-input-group input {
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

.azure-input-group input:focus {
  outline: none;
  border-color: var(--border-focus);
  box-shadow: 0 0 0 2px var(--border-focus-shadow);
}

.azure-input-group input::placeholder {
  color: var(--text-tertiary);
}

.azure-input-group input.error {
  border-color: var(--error);
  background-color: var(--error-bg);
}

.azure-input-group input.error:focus {
  border-color: var(--error);
  box-shadow: 0 0 0 2px var(--error-focus-shadow);
}

.pr-picker {
  position: relative;
}

.pr-button {
  padding: 8px 10px;
  background: var(--surface-tertiary);
  border: 1px solid var(--border-secondary);
  border-radius: var(--radius-sm);
  cursor: pointer;
  color: var(--text-secondary);
  font-size: 12px;
  font-weight: 600;
  min-width: 38px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition-fast);
}

.pr-button:hover:not(:disabled) {
  background: var(--border-primary);
}

.pr-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.pr-dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 4px;
  background: var(--surface-card);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-sm);
  box-shadow: var(--shadow-md);
  list-style: none;
  padding: 4px 0;
  z-index: 100;
  min-width: 320px;
  max-height: 300px;
  overflow-y: auto;
}

.pr-dropdown li {
  padding: 8px 12px;
  cursor: pointer;
  display: flex;
  gap: 8px;
  align-items: baseline;
  font-size: 13px;
  transition: background var(--transition-fast);
}

.pr-dropdown li:hover {
  background: var(--surface-tertiary);
}

.pr-number {
  color: var(--primary);
  font-weight: 600;
  font-family: monospace;
  white-space: nowrap;
}

.pr-title {
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
