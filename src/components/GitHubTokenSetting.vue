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
      <svg class="gh-icon" viewBox="0 0 16 16" fill="currentColor"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/></svg>
      {{ hasToken ? 'Token set' : 'GitHub token' }}
    </button>
    <div v-if="isOpen" class="token-panel">
      <p class="token-hint">
        Personal token raises the API limit from 60 to 5,000 requests/hour.
      </p>
      <p class="token-hint">
        <a href="https://github.com/settings/tokens?type=beta" target="_blank" rel="noopener">Create a fine-grained token</a>
        scoped to your organization. <strong>No extra permissions needed.</strong>
      </p>
      <p class="token-hint token-warning">
        <strong>⚠️ If you grant additional permissions, you do so at your own risk.</strong>
      </p>
      <p class="token-hint">
        Token lifetime must be 366 days or less.
      </p>
      <p class="token-hint"><strong>Stored in your browser only.</strong> Never sent anywhere except <code>api.github.com</code>. You can remove it anytime using the button below or by clearing your browser's local storage. For extra safety, use a dedicated token and revoke it when no longer needed.</p>
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
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 8px;
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--text-tertiary);
  font-size: 11px;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.gh-icon {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
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
  margin: 8px 0;
  padding: 12px;
  background: var(--surface-card);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-sm);
}

.token-hint {
  font-size: 12px;
  color: var(--text-secondary);
  margin: 0 0 10px;
  line-height: 1.5;
}

.token-warning {
  color: var(--error-text);
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
