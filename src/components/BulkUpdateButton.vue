<script setup lang="ts">
defineProps<{
  isUpdating: boolean
  progress: { current: number; total: number }
}>()

const emit = defineEmits<{
  'update-all': []
}>()
</script>

<template>
  <div class="update-all-group">
    <button
      class="update-all-button"
      :disabled="isUpdating"
      @click="emit('update-all')"
    >
      {{ isUpdating ? 'Updating...' : 'Update All To Latest Versions' }}
    </button>
    <div v-if="isUpdating" class="progress-container">
      <div
        class="progress-bar"
        :style="{ width: `${progress.total ? (progress.current / progress.total) * 100 : 0}%` }"
      ></div>
      <span class="progress-text">{{ progress.current }}/{{ progress.total }}</span>
    </div>
  </div>
</template>

<style scoped>
.update-all-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.update-all-button {
  padding: 8px 12px;
  background: var(--primary);
  color: var(--text-on-primary);
  border: none;
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-size: 14px;
  white-space: nowrap;
}

.update-all-button:hover:not(:disabled) {
  background: var(--primary-hover);
}

.update-all-button:disabled {
  background: var(--primary-disabled);
  cursor: not-allowed;
}

.progress-container {
  position: relative;
  height: 24px;
  background: var(--surface-tertiary);
  border-radius: 12px;
  overflow: hidden;
  width: 150px;
  border: 1px solid var(--border-secondary);
}

.progress-bar {
  height: 100%;
  background: var(--progress-bar);
  transition: width 0.3s ease;
}

.progress-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 12px;
  color: var(--text-primary);
  font-weight: 600;
}
</style>
