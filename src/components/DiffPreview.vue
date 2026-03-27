<script setup lang="ts">
import type { DiffChange } from '../types'

defineProps<{
  changes: DiffChange[]
}>()

const emit = defineEmits<{
  'scroll-to-module': [moduleId: string]
}>()
</script>

<template>
  <div class="diff-preview">
    <h3>Changes:</h3>
    <p v-if="!changes.length" class="no-changes">No changes yet</p>
    <ul v-else>
      <li v-for="(change, index) in changes" :key="index">
        <template v-if="change.type === 'platform'">
          <span>{{ change.field }} changed from </span>
          <span class="old-version">{{ change.oldValue }}</span>
          <span> to </span>
          <span class="new-version">{{ change.newValue }}</span>
        </template>

        <template v-else-if="change.type === 'module' && change.action === 'changed'">
          <button class="module-id-button" @click="emit('scroll-to-module', change.moduleId!)">
            {{ change.moduleId }}
          </button>
          <span>: version changed from </span>
          <span class="old-version">{{ change.oldValue }}</span>
          <span> to </span>
          <span class="new-version">{{ change.newValue }}</span>
        </template>

        <template v-else-if="change.type === 'module' && change.action === 'added'">
          <button class="module-id-button" @click="emit('scroll-to-module', change.moduleId!)">
            {{ change.moduleId }}
          </button>
          <span>: added to {{ change.toSource }}</span>
        </template>

        <template v-else-if="change.type === 'module' && change.action === 'moved'">
          <button class="module-id-button" @click="emit('scroll-to-module', change.moduleId!)">
            {{ change.moduleId }}
          </button>
          <span>: moved from {{ change.fromSource }} with </span>
          <span class="old-version">{{ change.oldValue }}</span>
          <span> to {{ change.toSource }} with </span>
          <span class="new-version">{{ change.newValue }}</span>
        </template>
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
  overflow: hidden;
}

.diff-preview h3 {
  color: var(--text-primary);
  font-size: 14px;
  margin: 0 0 10px 0;
  font-weight: bold;
}

.diff-preview ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.diff-preview li {
  padding: 8px 0;
  border-bottom: 1px solid var(--border-primary);
  color: var(--text-secondary);
  font-size: 14px;
  line-height: 1.5;
  overflow-wrap: break-word;
  word-break: break-all;
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

.old-version {
  color: var(--diff-old-text);
  text-decoration: line-through;
  padding: 0 2px;
  background-color: var(--diff-old-bg);
}

.new-version {
  color: var(--diff-new-text);
  padding: 0 2px;
  font-weight: bold;
  background-color: var(--diff-new-bg);
}
</style>
