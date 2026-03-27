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
      {{ isUpdating ? 'Updating...' : 'Update All' }}
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
  padding: 6px 12px;
  background: transparent;
  color: var(--text-primary);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-size: 13px;
  white-space: nowrap;
  transition: all var(--transition-fast);
}

.update-all-button:hover:not(:disabled) {
  background: var(--surface-tertiary);
}

.update-all-button:disabled {
  opacity: 0.6;
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
