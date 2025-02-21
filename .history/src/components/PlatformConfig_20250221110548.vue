<script setup lang="ts">
import { computed } from 'vue'

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

const manifestVersionModel = computed({
  get: () => props.manifestVersion,
  set: (value: string) => emit('update', 'manifestVersion', value)
})

const platformVersionModel = computed({
  get: () => props.platformVersion,
  set: (value: string) => emit('update', 'platformVersion', value)
})

const platformImageModel = computed({
  get: () => props.platformImage,
  set: (value: string) => emit('update', 'platformImage', value)
})

const platformImageTagModel = computed({
  get: () => props.platformImageTag,
  set: (value: string) => emit('update', 'platformImageTag', value)
})

const platformAssetUrlModel = computed({
  get: () => props.platformAssetUrl,
  set: (value: string) => emit('update', 'platformAssetUrl', value)
})

const moduleSourcesStr = computed({
  get: () => props.moduleSources.join('\n'),
  set: (value: string) => emit('update', 'moduleSources', value.split('\n').filter(s => s.trim()))
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
          v-model="manifestVersionModel"
        />
      </div>

      <div class="config-item">
        <label>Platform Version:</label>
        <input
          type="text"
          v-model="platformVersionModel"
        />
      </div>

      <div class="config-item">
        <label>Platform Image:</label>
        <input
          type="text"
          v-model="platformImageModel"
        />
      </div>

      <div class="config-item">
        <label>Platform Image Tag:</label>
        <input
          type="text"
          v-model="platformImageTagModel"
        />
      </div>

      <div class="config-item">
        <label>Platform Asset URL:</label>
        <input
          type="text"
          v-model="platformAssetUrlModel"
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

.platform-config h2 {
  color: #333;
  margin-bottom: 20px;
  font-weight: 600;
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
  color: #333;
}

input, textarea {
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-family: monospace;
  background: white;
}

input:focus, textarea:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 2px rgba(0,123,255,0.25);
}

textarea {
  resize: vertical;
}
</style>
