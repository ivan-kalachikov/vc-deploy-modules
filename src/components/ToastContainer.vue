<script setup lang="ts">
import { useToast } from '../composables/useToast'

const { toasts, removeToast } = useToast()
</script>

<template>
  <div class="toast-container">
    <TransitionGroup name="toast">
      <div
        v-for="toast in toasts"
        :key="toast.id"
        :class="['toast', `toast-${toast.type}`]"
        @click="removeToast(toast.id)"
      >
        {{ toast.message }}
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.toast-container {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 9999;
  display: flex;
  flex-direction: column-reverse;
  gap: 8px;
  pointer-events: none;
}

.toast {
  padding: 12px 20px;
  border-radius: var(--radius-sm, 4px);
  margin-bottom: 0;
  cursor: pointer;
  pointer-events: auto;
  font-size: 14px;
  line-height: 1.4;
  box-shadow: var(--shadow-md, 0 2px 8px rgba(0, 0, 0, 0.1));
  max-width: 380px;
  word-break: break-word;
}

.toast-success {
  background: var(--success-bg, #e8f5e9);
  color: var(--success-text, #1b5e20);
  border: 1px solid var(--success, #52c41a);
}

.toast-error {
  background: var(--error-bg, #fff5f5);
  color: var(--error-text, #ff4d4f);
  border: 1px solid var(--error, #d32f2f);
}

.toast-info {
  background: var(--surface-secondary, #f8f8f8);
  color: var(--text-primary, #333333);
  border: 1px solid var(--primary, #4a6ee0);
}

.toast-enter-active {
  transition: all 0.3s ease;
}

.toast-leave-active {
  transition: all 0.2s ease;
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(80px);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(80px);
}
</style>
