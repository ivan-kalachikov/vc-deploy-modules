<script setup lang="ts">
</script>

<template>
  <div class="skeleton">
    <!-- Platform Config skeleton -->
    <div class="skeleton-section">
      <div class="skeleton-header">
        <div class="skeleton-line" style="width: 220px; height: 22px"></div>
        <div class="skeleton-line" style="width: 14px; height: 14px"></div>
      </div>
    </div>

    <!-- Module Source Section skeletons -->
    <div v-for="i in 2" :key="i" class="skeleton-section">
      <div class="skeleton-header">
        <div class="skeleton-line" style="width: 180px; height: 22px"></div>
        <div class="skeleton-line" style="width: 120px; height: 32px; border-radius: var(--radius-sm)"></div>
      </div>
      <div class="skeleton-modules">
        <div v-for="j in (i === 1 ? 3 : 8)" :key="j" class="skeleton-module">
          <div class="skeleton-line" style="width: 30%; height: 16px"></div>
          <div class="skeleton-line" style="width: 25%; height: 36px; border-radius: var(--radius-sm)"></div>
          <div class="skeleton-line" style="width: 35%; height: 36px; border-radius: var(--radius-sm)"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.skeleton {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.skeleton-section {
  background: var(--surface-secondary);
  border-radius: var(--radius-md);
  padding: 20px;
}

.skeleton-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.skeleton-header:not(:last-child) {
  margin-bottom: 20px;
}

.skeleton-modules {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.skeleton-module {
  display: flex;
  gap: 12px;
  align-items: center;
  padding: 10px;
  background: var(--surface-card);
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-primary);
}

.skeleton-line {
  background: var(--surface-tertiary);
  border-radius: 4px;
  animation: shimmer 1.5s ease-in-out infinite;
}

@keyframes shimmer {
  0%, 100% { opacity: 0.4; }
  50% { opacity: 0.7; }
}
</style>
