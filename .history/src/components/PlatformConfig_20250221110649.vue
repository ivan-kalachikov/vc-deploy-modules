<script setup lang="ts">
import { computed } from 'vue'
import { ConfigurationData } from '../types'

const props = defineProps<{
  config: ConfigurationData
}>()

const emit = defineEmits<{
  'update': [newConfig: ConfigurationData]
}>()

const updateField = (field: keyof ConfigurationData, value: any) => {
  const newConfig = { ...props.config }
  newConfig[field] = value
  emit('update', newConfig)
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
          :value="config.ManifestVersion"
          @input="(e) => updateField('ManifestVersion', (e.target as HTMLInputElement).value)"
        />
      </div>

      <div class="config-item">
        <label>Platform Version:</label>
        <input
          type="text"
          :value="config.PlatformVersion"
          @input="(e) => updateField('PlatformVersion', (e.target as HTMLInputElement).value)"
        />
      </div>

      <div class="config-item">
        <label>Platform Image:</label>
        <input
          type="text"
          :value="config.PlatformImage"
          @input="(e) => updateField('PlatformImage', (e.target as HTMLInputElement).value)"
        />
      </div>

      <div class="config-item">
        <label>Platform Image Tag:</label>
        <input
          type="text"
          :value="config.PlatformImageTag"
          @input="(e) => updateField('PlatformImageTag', (e.target as HTMLInputElement).value)"
        />
      </div>

      <div class="config-item">
        <label>Platform Asset URL:</label>
        <input
          type="text"
          :value="config.PlatformAssetUrl"
          @input="(e) => updateField('PlatformAssetUrl', (e.target as HTMLInputElement).value)"
        />
      </div>

      <div class="config-item full-width">
        <label>Module Sources:</label>
        <textarea
          :value="config.ModuleSources.join('\n')"
          @input="(e) => updateField('ModuleSources', (e.target as HTMLInputElement).value.split('\n').filter(s => s.trim()))"
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
