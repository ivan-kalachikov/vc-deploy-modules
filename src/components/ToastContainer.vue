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
  border-radius: var(--radius-sm);
  margin-bottom: 0;
  cursor: pointer;
  pointer-events: auto;
  font-size: 14px;
  line-height: 1.4;
  box-shadow: var(--shadow-md);
  max-width: 380px;
  word-break: break-word;
}

.toast-success {
  background: var(--success-bg);
  color: var(--success-text);
  border: 1px solid var(--success);
}

.toast-error {
  background: var(--error-bg);
  color: var(--error-text);
  border: 1px solid var(--error);
}

.toast-info {
  background: var(--surface-secondary);
  color: var(--text-primary);
  border: 1px solid var(--primary);
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
