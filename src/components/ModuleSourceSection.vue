<script setup lang="ts">
import type { ModuleViewModel, ModuleType } from '../types'
import ModuleItem from './ModuleItem.vue'

defineProps<{
  sourceType: ModuleType
  modules: ModuleViewModel[]
}>()

const emit = defineEmits<{
  'module-update': [moduleId: string, type: ModuleType, value: string]
  'module-move': [moduleId: string, fromType: ModuleType, toType: ModuleType]
  'tags-loaded': [moduleId: string, tags: string[]]
}>()

const sectionTitle = (type: ModuleType): string =>
  type === 'AzureBlob' ? 'Azure Blob Storage' : 'GitHub Releases'
</script>

<template>
  <div class="source-section">
    <div class="section-container">
      <div class="section-header">
        <h2>{{ sectionTitle(sourceType) }}</h2>
        <slot name="header-actions" />
      </div>
      <div v-if="modules.length" class="modules">
        <ModuleItem
          v-for="module in modules"
          :key="module.id + '-' + module.sourceType"
          :module="module"
          :source-type="sourceType"
          @update="(id, type, val) => emit('module-update', id, type, val)"
          @move="(id, from, to) => emit('module-move', id, from, to)"
          @tags-loaded="(id, tags) => emit('tags-loaded', id, tags)"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.source-section {
  margin-bottom: 10px;
}

.section-container {
  background: var(--surface-secondary);
  border-radius: var(--radius-md);
  padding: 20px;
}

.section-container h2 {
  color: var(--text-primary);
  margin: 0;
  font-weight: 600;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.section-header:not(:last-child) {
  margin-bottom: 20px;
}

.modules {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.modules::-webkit-scrollbar {
  width: 8px;
}

.modules::-webkit-scrollbar-track {
  background: var(--scrollbar-track);
  border-radius: var(--radius-sm);
}

.modules::-webkit-scrollbar-thumb {
  background: var(--scrollbar-thumb);
  border-radius: var(--radius-sm);
}

.modules::-webkit-scrollbar-thumb:hover {
  background: var(--scrollbar-thumb-hover);
}
</style>
