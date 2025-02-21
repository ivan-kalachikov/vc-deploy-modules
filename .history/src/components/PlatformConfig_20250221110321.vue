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

// Local state for input values
const localValues = ref({
  manifestVersion: props.manifestVersion,
  platformVersion: props.platformVersion,
  platformImage: props.platformImage,
  platformImageTag: props.platformImageTag,
  platformAssetUrl: props.platformAssetUrl,
  moduleSourcesStr: props.moduleSources.join('\n')
})

// Watch for prop changes
watch(() => props, (newProps) => {
  localValues.value = {
    manifestVersion: newProps.manifestVersion,
    platformVersion: newProps.platformVersion,
    platformImage: newProps.platformImage,
    platformImageTag: newProps.platformImageTag,
    platformAssetUrl: newProps.platformAssetUrl,
    moduleSourcesStr: newProps.moduleSources.join('\n')
  }
}, { deep: true })

const handleInputChange = (field: string, value: string) => {
  if (field === 'moduleSourcesStr') {
    localValues.value[field] = value
    emit('update', 'moduleSources', value.split('\n').filter(s => s.trim()))
  } else {
    localValues.value[field as keyof typeof localValues.value] = value
    emit('update', field, value)
  }
}
</script>

<template>
  <div class="platform-config">
    <h2>Platform Configuration</h2>
    <div class="config-grid">
      <div class="config-item">
        <label>Manifest Version:</label>
        <input
          type="text"
          :value="localValues.manifestVersion"
          @input="(e) => handleInputChange('manifestVersion', (e.target as HTMLInputElement).value)"
        />
      </div>

      <div class="config-item">
        <label>Platform Version:</label>
        <input
          type="text"
          :value="localValues.platformVersion"
          @input="(e) => handleInputChange('platformVersion', (e.target as HTMLInputElement).value)"
        />
      </div>

      <div class="config-item">
        <label>Platform Image:</label>
        <input
          type="text"
          :value="localValues.platformImage"
          @input="(e) => handleInputChange('platformImage', (e.target as HTMLInputElement).value)"
        />
      </div>

      <div class="config-item">
        <label>Platform Image Tag:</label>
        <input
          type="text"
          :value="localValues.platformImageTag"
          @input="(e) => handleInputChange('platformImageTag', (e.target as HTMLInputElement).value)"
        />
      </div>

      <div class="config-item">
        <label>Platform Asset URL:</label>
        <input
          type="text"
          :value="localValues.platformAssetUrl"
          @input="(e) => handleInputChange('platformAssetUrl', (e.target as HTMLInputElement).value)"
        />
      </div>

      <div class="config-item full-width">
        <label>Module Sources:</label>
        <textarea
          :value="localValues.moduleSourcesStr"
          @input="(e) => handleInputChange('moduleSourcesStr', (e.target as HTMLInputElement).value)"
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
