<script setup lang="ts">
import { computed, ref, nextTick } from 'vue'
import type { ConfigurationData } from '../types'
import { isValidVersion, isValidManifestVersion, isValidPlatformImage } from '../utils/validation'

const isExpanded = ref(false)
const props = defineProps<{
  config: ConfigurationData
}>()

const emit = defineEmits<{
  'update': [newConfig: ConfigurationData]
}>()

// Computed property to check for invalid fields
const hasInvalidInputs = computed(() => {
  return !props.config.ManifestVersion.trim() || (props.config.ManifestVersion.trim() && !isValidManifestVersion(props.config.ManifestVersion)) ||
    !props.config.PlatformVersion.trim() || (props.config.PlatformVersion.trim() && !isValidVersion(props.config.PlatformVersion)) ||
    !props.config.PlatformImage.trim() || (props.config.PlatformImage.trim() && !isValidPlatformImage(props.config.PlatformImage)) ||
    !props.config.PlatformImageTag.trim() || (props.config.PlatformImageTag.trim() && !isValidVersion(props.config.PlatformImageTag))
})

// Method to scroll to first invalid input
const scrollToFirstInvalidInput = async () => {
  isExpanded.value = true
  await nextTick()
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

const updateField = <T extends keyof ConfigurationData>(field: T, value: ConfigurationData[T]) => {
  const newConfig = { ...props.config }
  newConfig[field] = value
  emit('update', newConfig)
}
</script>

<template>
  <div class="platform-config">
    <div class="section-header" @click="isExpanded = !isExpanded">
      <h2>Platform Configuration</h2>
      <span class="toggle-icon">{{ isExpanded ? '▼' : '▶' }}</span>
    </div>
    <div class="config-grid" v-show="isExpanded">
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
          @blur="(e: FocusEvent) => {
            const target = e.target as HTMLInputElement
            target.value = target.value.trim()
          }"
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
          @blur="(e: FocusEvent) => {
            const target = e.target as HTMLInputElement
            target.value = target.value.trim()
          }"
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
          @blur="(e: FocusEvent) => {
            const target = e.target as HTMLInputElement
            target.value = target.value.trim()
          }"
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
          @blur="(e: FocusEvent) => {
            const target = e.target as HTMLInputElement
            target.value = target.value.trim()
          }"
        />
      </div>

      <div class="config-item">
        <label>Platform Asset URL:</label>
        <input
          type="text"
          :value="config.PlatformAssetUrl"
          @input="(e) => updateField('PlatformAssetUrl', (e.target as HTMLInputElement).value)"
          @blur="(e: FocusEvent) => {
            const target = e.target as HTMLInputElement
            target.value = target.value.trim()
          }"
        />
      </div>

      <div class="config-item full-width">
        <label>Module Sources:</label>
        <textarea
          :value="(config.ModuleSources || []).join('\n')"
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
  background: var(--surface-secondary);
  border-radius: var(--radius-md);
  width: 100%;
  box-sizing: border-box;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  user-select: none;
  padding-bottom: 4px;
}

.section-header:hover {
  opacity: 0.8;
}

.toggle-icon {
  font-size: 14px;
  color: var(--text-secondary);
}

.platform-config h2 {
  color: var(--text-primary);
  margin: 0;
  font-weight: 600;
}

.config-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-top: 12px;
}

.config-item {
  display: flex;
  flex-direction: column;
  gap: 5px;
  background: var(--surface-card);
  padding: 10px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-primary);
  min-width: 0;
  overflow: hidden;
  max-width: 100%;
}

.config-item.full-width {
  grid-column: 1 / -1;
  max-width: none;
}

label {
  font-weight: 500;
  color: var(--text-primary);
}

input, textarea {
  padding: 8px 12px;
  border: 1px solid var(--border-secondary);
  border-radius: var(--radius-sm);
  font-size: 14px;
  font-family: monospace;
  background: var(--surface-card);
  color: var(--text-primary);
  width: 100%;
  box-sizing: border-box;
  min-width: 0;
  max-width: 100%;
}

input:focus, textarea:focus {
  outline: none;
  border-color: var(--border-focus);
  box-shadow: 0 0 0 2px var(--border-focus-shadow);
}

textarea {
  resize: vertical;
}

input.error {
  border-color: var(--error);
  background-color: var(--error-bg);
}

input.error:focus {
  border-color: var(--error);
  box-shadow: 0 0 0 2px var(--border-focus-shadow);
}
</style>
