<script setup lang="ts">
import { computed, ref } from 'vue'
import { ConfigurationData } from '../types'

const props = defineProps<{
  config: ConfigurationData
}>()

const emit = defineEmits<{
  'update': [newConfig: ConfigurationData]
}>()

// Helper function to validate version format (major.minor.patch)
const isValidVersion = (version: string): boolean => {
  const versionRegex = /^\d+\.\d+\.\d+$/
  return versionRegex.test(version.trim())
}

// Helper function to validate manifest version format (major.minor)
const isValidManifestVersion = (version: string): boolean => {
  const versionRegex = /^\d+\.\d+$/
  return versionRegex.test(version.trim())
}

// Helper function to validate platform image format (ghcr.io/virtocommerce/platform)
const isValidPlatformImage = (image: string): boolean => {
  const imageRegex = /^[\w.-]+\.\w+\/[\w.-]+(\/[\w.-]+)?$/
  return imageRegex.test(image.trim())
}

// Computed property to check for invalid fields
const hasInvalidInputs = computed(() => {
  return !props.config.ManifestVersion.trim() || (props.config.ManifestVersion.trim() && !isValidManifestVersion(props.config.ManifestVersion)) ||
    !props.config.PlatformVersion.trim() || (props.config.PlatformVersion.trim() && !isValidVersion(props.config.PlatformVersion)) ||
    !props.config.PlatformImage.trim() || (props.config.PlatformImage.trim() && !isValidPlatformImage(props.config.PlatformImage)) ||
    !props.config.PlatformImageTag.trim() || (props.config.PlatformImageTag.trim() && !isValidVersion(props.config.PlatformImageTag))
})

// Method to scroll to first invalid input
const scrollToFirstInvalidInput = () => {
  const firstInvalidInput = document.querySelector('.platform-config .error') as HTMLElement
  if (firstInvalidInput) {
    firstInvalidInput.scrollIntoView({ behavior: 'smooth', block: 'center' })
    firstInvalidInput.focus()
  }
}

// Expose these to parent
defineExpose({
  hasInvalidInputs,
  scrollToFirstInvalidInput
})

const updateField = (field: keyof ConfigurationData, value: any) => {
  const trimmedValue = value.trim()

  const newConfig = { ...props.config }
  if (field === 'ModuleSources') {
    newConfig[field] = value
  } else {
    newConfig[field] = trimmedValue
  }
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
          :class="{
            'error': !config.ManifestVersion.trim() ||
                    (config.ManifestVersion.trim() && !isValidManifestVersion(config.ManifestVersion))
          }"
          :title="config.ManifestVersion.trim() && !isValidManifestVersion(config.ManifestVersion) ? 'Format should be: major.minor (e.g., 2.0)' : ''"
          @input="(e) => updateField('ManifestVersion', (e.target as HTMLInputElement).value)"
          @blur="(e) => e.target.value = e.target.value.trim()"
        />
      </div>

      <div class="config-item">
        <label>Platform Version:</label>
        <input
          type="text"
          :value="config.PlatformVersion"
          :class="{
            'error': !config.PlatformVersion.trim() ||
                    (config.PlatformVersion.trim() && !isValidVersion(config.PlatformVersion))
          }"
          :title="config.PlatformVersion.trim() && !isValidVersion(config.PlatformVersion) ? 'Format should be: major.minor.patch (e.g., 3.809.0)' : ''"
          @input="(e) => updateField('PlatformVersion', (e.target as HTMLInputElement).value)"
          @blur="(e) => e.target.value = e.target.value.trim()"
        />
      </div>

      <div class="config-item">
        <label>Platform Image:</label>
        <input
          type="text"
          :value="config.PlatformImage"
          :class="{
            'error': !config.PlatformImage.trim() ||
                    (config.PlatformImage.trim() && !isValidPlatformImage(config.PlatformImage))
          }"
          :title="config.PlatformImage.trim() && !isValidPlatformImage(config.PlatformImage) ? 'Format should be: domain/org or domain/org/repo (e.g., ghcr.io/virtocommerce or ghcr.io/virtocommerce/platform)' : ''"
          @input="(e) => updateField('PlatformImage', (e.target as HTMLInputElement).value)"
          @blur="(e) => e.target.value = e.target.value.trim()"
        />
      </div>

      <div class="config-item">
        <label>Platform Image Tag:</label>
        <input
          type="text"
          :value="config.PlatformImageTag"
          :class="{
            'error': !config.PlatformImageTag.trim() ||
                    (config.PlatformImageTag.trim() && !isValidVersion(config.PlatformImageTag))
          }"
          :title="config.PlatformImageTag.trim() && !isValidVersion(config.PlatformImageTag) ? 'Format should be: major.minor.patch (e.g., 3.809.0)' : ''"
          @input="(e) => updateField('PlatformImageTag', (e.target as HTMLInputElement).value)"
          @blur="(e) => e.target.value = e.target.value.trim()"
        />
      </div>

      <div class="config-item">
        <label>Platform Asset URL:</label>
        <input
          type="text"
          :value="config.PlatformAssetUrl"
          @input="(e) => updateField('PlatformAssetUrl', (e.target as HTMLInputElement).value)"
          @blur="(e) => e.target.value = e.target.value.trim()"
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
  margin-bottom: 20px;
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
  gap: 12px;
}

.config-item {
  display: flex;
  flex-direction: column;
  gap: 5px;
  background: white;
  padding: 10px;
  border-radius: 4px;
  border: 1px solid #ddd;
}

.config-item.full-width {
  grid-column: 1 / -1;
}

label {
  font-weight: 500;
  color: #333;
}

input, textarea {
  padding: 8px 12px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 14px;
  font-family: monospace;
  background: white;
}

input:focus, textarea:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 2px rgba(0,123,255,0.1);
}

textarea {
  resize: vertical;
}

input.error {
  border-color: #d32f2f;
  background-color: #fff5f5;
}

input.error:focus {
  border-color: #d32f2f;
  box-shadow: 0 0 0 2px rgba(211, 47, 47, 0.1);
}
</style>
