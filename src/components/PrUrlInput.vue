<script setup lang="ts">
import { ref } from 'vue'
import { parsePrUrl, fetchPrArtifact } from '../services/github'
import type { ArtifactInfo } from '../services/github'
import { useToast } from '../composables/useToast'

const emit = defineEmits<{
  'artifact-parsed': [info: ArtifactInfo]
}>()

const prUrl = ref('')
const { addToast } = useToast()

const handleSubmit = async () => {
  try {
    const parsed = parsePrUrl(prUrl.value)
    if (!parsed) {
      addToast('Invalid PR URL', 'error')
      return
    }

    const artifact = await fetchPrArtifact(parsed.repo, parsed.prNumber)
    if (!artifact) {
      addToast('No artifact URL found in PR description', 'error')
      return
    }

    emit('artifact-parsed', artifact)
    prUrl.value = ''
  } catch (error) {
    addToast(
      error instanceof Error ? error.message : 'Failed to process PR',
      'error',
    )
  }
}
</script>

<template>
  <div class="pr-input-group">
    <input
      v-model="prUrl"
      placeholder="Enter PR URL"
      @keyup.enter="handleSubmit"
    />
    <button class="pr-button" @click="handleSubmit">Parse</button>
  </div>
</template>

<style scoped>
.pr-input-group {
  display: flex;
  gap: 8px;
  align-items: center;
}

.pr-input-group input {
  padding: 8px 12px;
  border: 1px solid var(--border-secondary);
  border-radius: var(--radius-sm);
  font-size: 14px;
  min-width: 300px;
  background: var(--surface-card);
  color: var(--text-primary);
}

.pr-input-group input:focus {
  outline: none;
  border-color: var(--border-focus);
  box-shadow: 0 0 0 2px var(--border-focus-shadow);
}

.pr-input-group input::placeholder {
  color: var(--text-tertiary);
}

.pr-button {
  padding: 8px 12px;
  background: var(--primary);
  color: var(--text-on-primary);
  border: none;
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-size: 14px;
}

.pr-button:hover {
  background: var(--primary-hover);
}
</style>
