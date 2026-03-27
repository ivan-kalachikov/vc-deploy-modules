<script setup lang="ts">
import { ref, computed } from 'vue'
import type { ModuleViewModel, ModuleType } from '../types'
import { isValidVersion, isValidBlobName } from '../utils/validation'
import ModuleItem from './ModuleItem.vue'

const props = defineProps<{
  sourceType: ModuleType
  modules: ModuleViewModel[]
}>()

const errorCount = computed(() =>
  props.modules.filter(m => {
    const v = m.value.trim()
    if (!v) return true
    return props.sourceType === 'GithubReleases'
      ? !isValidVersion(v)
      : !isValidBlobName(v)
  }).length
)

const emit = defineEmits<{
  'module-update': [moduleId: string, type: ModuleType, value: string]
  'module-move': [moduleId: string, fromType: ModuleType, toType: ModuleType]
  'module-revert': [moduleId: string, type: ModuleType]
  'module-delete': [moduleId: string, type: ModuleType]
  'module-add': [moduleId: string, type: ModuleType]
  'tags-loaded': [moduleId: string, tags: string[]]
}>()

const isExpanded = ref(true)
const isAdding = ref(false)
const newModuleId = ref('')
const addInputRef = ref<HTMLInputElement>()

const expand = () => { isExpanded.value = true }

const sectionTitle = (type: ModuleType): string =>
  type === 'AzureBlob' ? 'Azure Blob Storage' : 'GitHub Releases'

const startAdding = () => {
  isExpanded.value = true
  isAdding.value = true
  setTimeout(() => addInputRef.value?.focus(), 0)
}

const confirmAdd = () => {
  const id = newModuleId.value.trim()
  if (!id) return
  // Ensure VirtoCommerce. prefix
  const moduleId = id.startsWith('VirtoCommerce.') ? id : `VirtoCommerce.${id}`
  // Check duplicate
  if (props.modules.some(m => m.id === moduleId)) {
    isAdding.value = false
    newModuleId.value = ''
    return
  }
  emit('module-add', moduleId, props.sourceType)
  newModuleId.value = ''
  isAdding.value = false
}

const cancelAdd = () => {
  isAdding.value = false
  newModuleId.value = ''
}

defineExpose({ expand })
</script>

<template>
  <div class="source-section">
    <div class="section-container">
      <div class="section-header" @click="isExpanded = !isExpanded">
        <h2>{{ sectionTitle(sourceType) }} <span class="module-count">({{ modules.length }})</span><span v-if="errorCount" class="error-count"> {{ errorCount }} invalid</span></h2>
        <div class="header-right">
          <div @click.stop><slot name="header-actions" /></div>
          <button class="add-btn" @click.stop="startAdding" title="Add module">+</button>
          <span class="toggle-icon">{{ isExpanded ? '▼' : '▶' }}</span>
        </div>
      </div>
      <div v-if="isAdding" class="add-row" @click.stop>
        <input
          ref="addInputRef"
          v-model="newModuleId"
          type="text"
          placeholder="Module name, e.g. Orders or VirtoCommerce.Orders"
          @keyup.enter="confirmAdd"
          @keyup.escape="cancelAdd"
        />
        <button class="confirm-btn" @click="confirmAdd">Add</button>
        <button class="cancel-btn" @click="cancelAdd">&times;</button>
      </div>
      <div v-show="isExpanded" v-if="modules.length" class="modules">
        <ModuleItem
          v-for="module in modules"
          :key="module.id + '-' + module.sourceType"
          :module="module"
          :source-type="sourceType"
          @update="(id, type, val) => emit('module-update', id, type, val)"
          @move="(id, from, to) => emit('module-move', id, from, to)"
          @revert="(id, type) => emit('module-revert', id, type)"
          @delete="(id, type) => emit('module-delete', id, type)"
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
  container-type: inline-size;
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
  cursor: pointer;
  user-select: none;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.toggle-icon {
  font-size: 14px;
  color: var(--text-secondary);
}

.module-count {
  font-size: 14px;
  color: var(--text-tertiary);
  font-weight: normal;
}

.error-count {
  font-size: 12px;
  color: var(--error-text);
  font-weight: normal;
  margin-left: 6px;
}

.add-btn {
  width: 24px;
  height: 24px;
  padding: 0;
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--text-tertiary);
  font-size: 16px;
  line-height: 22px;
  text-align: center;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.add-btn:hover {
  color: var(--primary-text);
  border-color: var(--primary);
  background: var(--surface-tertiary);
}

.add-row {
  display: flex;
  gap: 8px;
  margin: 12px 0;
}

.add-row input {
  flex: 1;
  padding: 6px 10px;
  border: 1px solid var(--border-secondary);
  border-radius: var(--radius-sm);
  background: var(--surface-card);
  color: var(--text-primary);
  font-size: 13px;
}

.add-row input:focus {
  outline: none;
  border-color: var(--border-focus);
}

.confirm-btn {
  padding: 6px 12px;
  border: none;
  border-radius: var(--radius-sm);
  background: var(--primary);
  color: var(--text-on-primary);
  font-size: 12px;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.confirm-btn:hover {
  background: var(--primary-hover);
}

.cancel-btn {
  width: 28px;
  padding: 0;
  border: none;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--text-tertiary);
  font-size: 18px;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.cancel-btn:hover {
  color: var(--error-text);
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

@container (max-width: 500px) {
  .section-container {
    padding: 12px;
  }

  .section-header {
    flex-wrap: wrap;
    gap: 8px;
  }
}
</style>
