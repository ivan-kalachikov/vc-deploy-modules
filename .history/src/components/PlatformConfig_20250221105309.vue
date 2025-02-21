<script setup lang="ts">
import { ref, watch } from 'vue'

const props = defineProps<{
  manifestVersion: string
  platformVersion: string
  platformImage: string
  platformImageTag: string
  platformAssetUrl: string
  moduleSources: string[]
}>()

const emit = defineEmits<{
  'update': [field: string, value: string | string[]]
}>()

const moduleSourcesStr = ref(props.moduleSources.join('\n'))

watch(() => moduleSourcesStr.value, (newValue) => {
  emit('update', 'moduleSources', newValue.split('\n').filter(s => s.trim()))
})
</script>

<template>
  <div class="platform-config">
    <h2>Platform Configuration</h2>
    <div class="config-grid">
      <div class="config-item">
        <label>Manifest Version:</label>
        <input
          type="text"
          :value="manifestVersion"
          @input="(e) => emit('update', 'manifestVersion', (e.target as HTMLInputElement).value)"
        />
      </div>

      <div class="config-item">
        <label>Platform Version:</label>
        <input
          type="text"
          :value="platformVersion"
          @input="(e) => emit('update', 'platformVersion', (e.target as HTMLInputElement).value)"
        />
      </div>

      <div class="config-item">
        <label>Platform Image:</label>
        <input
          type="text"
          :value="platformImage"
          @input="(e) => emit('update', 'platformImage', (e.target as HTMLInputElement).value)"
        />
      </div>

      <div class="config-item">
        <label>Platform Image Tag:</label>
        <input
          type="text"
          :value="platformImageTag"
          @input="(e) => emit('update', 'platformImageTag', (e.target as HTMLInputElement).value)"
        />
      </div>

      <div class="config-item">
        <label>Platform Asset URL:</label>
        <input
          type="text"
          :value="platformAssetUrl"
          @input="(e) => emit('update', 'platformAssetUrl', (e.target as HTMLInputElement).value)"
        />
      </div>

      <div class="config-item full-width">
        <label>Module Sources:</label>
        <textarea
          v-model="moduleSourcesStr"
          placeholder="One URL per line"
          rows="3"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.platform-config {
  margin-bottom: 30px;
  padding: 20px;
  background: #f8f8f8;
  border-radius: 8px;
}

.config-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
}

.config-item {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.config-item.full-width {
  grid-column: 1 / -1;
}

label {
  font-weight: 500;
  color: #666;
}

input, textarea {
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-family: monospace;
}

textarea {
  resize: vertical;
}
</style>
