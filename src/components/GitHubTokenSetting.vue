<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getGitHubToken, setGitHubToken } from '../services/github'
import { useToast } from '../composables/useToast'

const { addToast } = useToast()
const token = ref('')
const isOpen = ref(false)
const hasToken = ref(false)

onMounted(() => {
  hasToken.value = !!getGitHubToken()
})

const save = () => {
  const trimmed = token.value.trim()
  setGitHubToken(trimmed || null)
  hasToken.value = !!trimmed
  token.value = ''
  isOpen.value = false
  addToast(trimmed ? 'Token saved (5000 req/hour)' : 'Token removed', 'success')
}

const remove = () => {
  setGitHubToken(null)
  hasToken.value = false
  token.value = ''
  addToast('Token removed', 'info')
}
</script>

<template>
  <div class="token-setting">
    <button class="token-btn" :class="{ active: hasToken }" @click="isOpen = !isOpen">
      {{ hasToken ? 'Token set' : 'Set GitHub token' }}
    </button>
    <div v-if="isOpen" class="token-panel">
      <p class="token-hint">
        Personal token raises the API limit from 60 to 5,000 requests/hour.
        <a href="https://github.com/settings/tokens?type=beta" target="_blank" rel="noopener">Create a fine-grained token</a>
        scoped to <strong>VirtoCommerce</strong> organization.
        No extra permissions needed. Token lifetime must be 366 days or less.
        Stored in your browser only.
      </p>
      <div class="token-input-row">
        <input
          v-model="token"
          type="password"
          :placeholder="hasToken ? 'Replace token...' : 'github_pat_...'"
          @keyup.enter="save"
        />
        <button class="save-btn" @click="save">Save</button>
        <button v-if="hasToken" class="remove-btn" @click="remove">Remove</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.token-setting {
  position: relative;
}

.token-btn {
  padding: 4px 8px;
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--text-tertiary);
  font-size: 11px;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.token-btn:hover {
  color: var(--text-primary);
  background: var(--surface-tertiary);
}

.token-btn.active {
  color: var(--success-text);
  border-color: var(--success);
}

.token-panel {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  width: 360px;
  padding: 12px;
  background: var(--surface-card);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-sm);
  box-shadow: var(--shadow-md);
  z-index: 200;
}

.token-hint {
  font-size: 12px;
  color: var(--text-secondary);
  margin: 0 0 10px;
  line-height: 1.5;
}

.token-hint a {
  color: var(--link);
}

.token-hint a:hover {
  color: var(--link-hover);
}

.token-input-row {
  display: flex;
  gap: 6px;
}

.token-input-row input {
  flex: 1;
  padding: 6px 10px;
  border: 1px solid var(--border-secondary);
  border-radius: var(--radius-sm);
  background: var(--surface-card);
  color: var(--text-primary);
  font-size: 12px;
  font-family: monospace;
}

.token-input-row input:focus {
  outline: none;
  border-color: var(--border-focus);
}

.save-btn, .remove-btn {
  padding: 6px 10px;
  border: none;
  border-radius: var(--radius-sm);
  font-size: 12px;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.save-btn {
  background: var(--primary);
  color: var(--text-on-primary);
}

.save-btn:hover {
  background: var(--primary-hover);
}

.remove-btn {
  background: transparent;
  border: 1px solid var(--error-border);
  color: var(--error-text);
}

.remove-btn:hover {
  background: var(--error-bg);
}
</style>
