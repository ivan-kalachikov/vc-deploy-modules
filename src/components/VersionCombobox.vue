<script setup lang="ts">
import { ref, computed } from 'vue'
import { onClickOutside } from '@vueuse/core'
import type { ModuleViewModel, ModuleType } from '../types'
import { isValidVersion, isValidBlobName } from '../utils/validation'
import { getRepoName } from '../config/moduleRepoMapping'
import { getCachedTags, setCachedTags } from '../services/tagCache'
import { fetchTags, fetchOpenPrs, fetchPrArtifact, type PrInfo } from '../services/github'
import { useToast } from '../composables/useToast'

const props = defineProps<{
  module: ModuleViewModel
  sourceType: ModuleType
}>()

const emit = defineEmits<{
  'change': [value: string]
  'tags-loaded': [moduleId: string, tags: string[]]
}>()

const { addToast } = useToast()
const comboboxRef = ref<HTMLElement>()
const isOpen = ref(false)
const isLoading = ref(false)

// Dropdown items: version strings for GitHub, PrInfo[] for Azure
const items = ref<string[]>([])
const prItems = ref<PrInfo[]>([])
const hasFetched = ref(false)

const isGitHub = computed(() => props.sourceType === 'GithubReleases')

const hasError = computed(() => {
  const v = props.module.value.trim()
  if (!v) return true
  return isGitHub.value ? !isValidVersion(v) : !isValidBlobName(v)
})

const placeholder = computed(() =>
  isGitHub.value ? 'Version' : 'version[-suffix].zip',
)

async function fetchDropdownItems() {
  if (hasFetched.value) return
  isLoading.value = true
  try {
    const repo = getRepoName(props.module.id)
    if (isGitHub.value) {
      // Check module.tags first, then cache, then fetch
      if (props.module.tags?.length) {
        items.value = props.module.tags
        hasFetched.value = true
        return
      }
      const cached = getCachedTags(props.module.id)
      if (cached) {
        items.value = cached
        emit('tags-loaded', props.module.id, cached)
        hasFetched.value = true
        return
      }
      const tags = await fetchTags(repo)
      setCachedTags(props.module.id, tags)
      items.value = tags
      emit('tags-loaded', props.module.id, tags)
    } else {
      const prs = await fetchOpenPrs(repo)
      prItems.value = prs
      if (!prs.length) addToast('No open PRs found', 'info')
    }
    hasFetched.value = true
  } catch {
    addToast(isGitHub.value ? 'Failed to load tags' : 'Failed to load PRs', 'error')
  } finally {
    isLoading.value = false
  }
}

async function toggleDropdown() {
  if (isOpen.value) {
    isOpen.value = false
    return
  }
  isOpen.value = true
  await fetchDropdownItems()
}

function selectGitHubTag(tag: string) {
  emit('change', tag)
  isOpen.value = false
}

async function selectPr(pr: PrInfo) {
  isLoading.value = true
  try {
    const repo = getRepoName(props.module.id)
    const artifact = await fetchPrArtifact(repo, String(pr.number))
    if (artifact) {
      emit('change', artifact.fileName.split('_')[1])
    } else {
      addToast('No artifact URL found in PR description', 'error')
    }
  } catch {
    addToast('Failed to parse PR artifact', 'error')
  } finally {
    isLoading.value = false
    isOpen.value = false
  }
}

function onInput(e: Event) {
  emit('change', (e.target as HTMLInputElement).value)
}

function onBlur(e: Event) {
  ;(e.target as HTMLInputElement).value = (e.target as HTMLInputElement).value.trim()
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') isOpen.value = false
}

const dropdownItems = computed(() => {
  if (isGitHub.value) return items.value
  return prItems.value
})

onClickOutside(comboboxRef, () => { isOpen.value = false })
</script>

<template>
  <div ref="comboboxRef" class="combobox" @keydown="onKeydown">
    <div class="input-wrapper">
      <input
        :data-module-id="module.id.trim()"
        type="text"
        :value="module.value"
        :placeholder="placeholder"
        :class="{ error: hasError }"
        @input="onInput"
        @blur="onBlur"
      />
      <button
        class="chevron"
        :class="{ open: isOpen }"
        type="button"
        tabindex="-1"
        :disabled="isLoading && !isOpen"
        @click="toggleDropdown"
      >{{ isLoading && !isOpen ? '...' : '\u25BE' }}</button>
    </div>
    <ul v-if="isOpen" class="dropdown">
      <li v-if="isLoading" class="loading">Loading...</li>
      <template v-else-if="isGitHub">
        <li v-if="!items.length" class="loading">No versions found</li>
        <li
          v-for="tag in items"
          :key="tag"
          :title="tag"
          @click="selectGitHubTag(tag)"
        >{{ tag }}</li>
      </template>
      <template v-else>
        <li v-if="!prItems.length" class="loading">No open PRs</li>
        <li
          v-for="pr in prItems"
          :key="pr.number"
          :title="`#${pr.number} ${pr.title}`"
          @click="selectPr(pr)"
        >
          <span class="pr-number">#{{ pr.number }}</span>
          <span class="pr-title">{{ pr.title }}</span>
        </li>
      </template>
    </ul>
  </div>
</template>

<style scoped>
.combobox {
  position: relative;
  width: 100%;
}

.input-wrapper {
  position: relative;
  display: flex;
}

.input-wrapper input {
  width: 100%;
  padding: 8px 32px 8px 12px;
  border: 1px solid var(--border-secondary);
  border-radius: var(--radius-sm);
  font-size: 14px;
  font-family: monospace;
  background: var(--surface-card);
  color: var(--text-primary);
  min-width: 0;
}

.input-wrapper input:focus {
  outline: none;
  border-color: var(--border-focus);
  box-shadow: 0 0 0 2px var(--border-focus-shadow);
}

.input-wrapper input::placeholder {
  color: var(--text-tertiary);
}

.input-wrapper input.error {
  border-color: var(--error);
  background-color: var(--error-bg);
}

.input-wrapper input.error:focus {
  border-color: var(--error);
  box-shadow: 0 0 0 2px var(--error-focus-shadow);
}

.chevron {
  position: absolute;
  right: 1px;
  top: 1px;
  bottom: 1px;
  width: 28px;
  background: transparent;
  border: none;
  cursor: pointer;
  color: var(--text-tertiary);
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
  transition: transform var(--transition-fast);
}

.chevron:hover {
  color: var(--text-primary);
  background: var(--surface-tertiary);
}

.chevron:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.chevron.open {
  transform: rotate(180deg);
}

.dropdown {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  z-index: 100;
  background: var(--surface-card);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-sm);
  box-shadow: var(--shadow-md);
  list-style: none;
  padding: 4px 0;
  margin: 0;
  max-height: 260px;
  overflow-y: auto;
}

.dropdown li {
  padding: 7px 12px;
  cursor: pointer;
  font-size: 13px;
  font-family: monospace;
  color: var(--text-primary);
  transition: background var(--transition-fast);
  display: flex;
  gap: 8px;
  align-items: baseline;
}

.dropdown li:hover:not(.loading) {
  background: var(--surface-tertiary);
}

.dropdown li.loading {
  color: var(--text-tertiary);
  font-style: italic;
  cursor: default;
  font-family: inherit;
}

.pr-number {
  color: var(--primary);
  font-weight: 600;
  white-space: nowrap;
}

.pr-title {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-family: inherit;
}
</style>
