<script setup lang="ts">
import type { DiffChange } from '../types'
import { formatModuleId } from '../utils/helpers'

defineProps<{
  changes: DiffChange[]
}>()

const emit = defineEmits<{
  'scroll-to-module': [moduleId: string]
  'revert-module': [moduleId: string, sourceType: 'AzureBlob' | 'GithubReleases']
}>()
</script>

<template>
  <div class="diff-preview">
    <h3>Changes: <span v-if="changes.length" class="change-count">({{ changes.length }})</span></h3>
    <p v-if="!changes.length" class="no-changes">No changes yet</p>
    <ul v-else>
      <li v-for="(change, index) in changes" :key="index">
        <div class="change-content">
          <template v-if="change.type === 'platform'">
            <span>{{ change.field }} changed from </span>
            <span class="old-version">{{ change.oldValue }}</span>
            <span> to </span>
            <span class="new-version">{{ change.newValue }}</span>
          </template>

          <template v-else-if="change.type === 'module' && change.action === 'changed'">
            <button class="module-id-button" @click="emit('scroll-to-module', change.moduleId!)">
              {{ formatModuleId(change.moduleId!) }}
            </button>
            <div class="change-values">
              <span class="old-version">{{ change.oldValue }}</span>
              <span> &rarr; </span>
              <span class="new-version">{{ change.newValue }}</span>
            </div>
          </template>

          <template v-else-if="change.type === 'module' && change.action === 'added'">
            <button class="module-id-button" @click="emit('scroll-to-module', change.moduleId!)">
              {{ formatModuleId(change.moduleId!) }}
            </button>
            <div class="change-values">added to {{ change.toSource }}</div>
          </template>

          <template v-else-if="change.type === 'module' && change.action === 'deleted'">
            <button class="module-id-button deleted" @click="emit('scroll-to-module', change.moduleId!)">
              {{ formatModuleId(change.moduleId!) }}
            </button>
            <div class="change-values">removed from {{ change.fromSource }}</div>
          </template>

          <template v-else-if="change.type === 'module' && change.action === 'moved'">
            <button class="module-id-button" @click="emit('scroll-to-module', change.moduleId!)">
              {{ formatModuleId(change.moduleId!) }}
            </button>
            <div class="change-values">
              <span class="old-version">{{ change.oldValue }}</span>
              <span> ({{ change.fromSource }}) &rarr; </span>
              <span class="new-version">{{ change.newValue }}</span>
              <span> ({{ change.toSource }})</span>
            </div>
          </template>
        </div>
        <button
          v-if="change.type === 'module' && change.currentSourceType"
          class="undo-btn"
          title="Undo this change"
          @click="emit('revert-module', change.moduleId!, change.currentSourceType!)"
        >&#x21A9;</button>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.diff-preview {
  background: var(--surface-card);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-sm);
  padding: 15px;
  margin-bottom: 15px;
  max-height: 60vh;
  overflow-y: auto;
}

@media (max-width: 800px) {
  .diff-preview {
    max-height: none;
  }
}

.diff-preview h3 {
  color: var(--text-primary);
  font-size: 14px;
  margin: 0 0 10px 0;
  font-weight: bold;
}

.change-count {
  color: var(--text-tertiary);
  font-weight: normal;
}

.diff-preview ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.diff-preview li {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  padding: 8px 0;
  border-bottom: 1px solid var(--border-primary);
  color: var(--text-secondary);
  font-size: 14px;
  line-height: 1.5;
}

.change-content {
  flex: 1;
  overflow-wrap: break-word;
  word-break: break-all;
}

.change-values {
  font-size: 12px;
}

.diff-preview li:last-child {
  border-bottom: none;
}

.no-changes {
  color: var(--text-tertiary);
  font-size: 14px;
  font-style: italic;
  margin: 0;
}

.module-id-button {
  background: none;
  border: none;
  text-align: left;
  color: var(--primary);
  cursor: pointer;
  font-family: monospace;
  font-weight: 500;
  padding: 0;
  text-decoration: underline;
}

.module-id-button:hover {
  color: var(--primary-hover);
}

.undo-btn {
  flex-shrink: 0;
  width: 22px;
  height: 22px;
  padding: 0;
  border: none;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--text-tertiary);
  font-size: 14px;
  line-height: 22px;
  text-align: center;
  cursor: pointer;
  transition: all var(--transition-fast);
  margin-top: 1px;
}

.undo-btn:hover {
  color: var(--primary-text);
  background: var(--surface-tertiary);
}

.old-version {
  color: var(--text-tertiary);
  padding: 0 2px;
}

.module-id-button.deleted {
  text-decoration: line-through;
  color: var(--error-text);
}

.new-version {
  color: var(--diff-new-text);
  padding: 0 2px;
  font-weight: bold;
  background-color: var(--diff-new-bg);
}
</style>
