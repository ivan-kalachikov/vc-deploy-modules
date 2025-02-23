<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import type { ConfigurationData, ModuleType } from '../types'
import kebabCase from 'lodash-es/kebabCase'

// Mapping for modules with non-standard repository names
const MODULE_REPO_MAPPING: Record<string, string> = {
  'VirtoCommerce.ApplicationInsights': 'vc-module-app-insights',
  'VirtoCommerce.AuthorizeNetPayment': 'vc-module-authorize-net',
  'VirtoCommerce.AvalaraTax': 'vc-module-avatax',
  'VirtoCommerce.AzureBlobAssets': 'vc-module-azureblob-assets',
  'VirtoCommerce.BulkActionsModule': 'vc-module-bulk-actions',
  'VirtoCommerce.CatalogCsvImportModule': 'vc-module-catalog-csv-export-import',
  'VirtoCommerce.Contracts': 'vc-module-contract',
  'VirtoCommerce.CustomerReviews': 'vc-module-customer-review',
  'VirtoCommerce.DynamicAssociationsModule': 'vc-module-dynamic-associations',
  'VirtoCommerce.FileSystemAssets': 'vc-module-filesystem-assets',
  'VirtoCommerce.Notifications': 'vc-module-notification',
  'VirtoCommerce.OpenIdConnectModule': 'vc-module-openid-connect',
  'VirtoCommerce.Orders': 'vc-module-order',
  'VirtoCommerce.ProfileExperienceApiModule': 'vc-module-profile-experience-api',
  'VirtoCommerce.ShipStation': 'vc-module-shipstation',
  'VirtoCommerce.WebHooks': 'vc-module-webhooks',
  'VirtoCommerce.XCMS': 'vc-module-x-cms',
  // Add more mappings as needed, for example:
  // 'VirtoCommerce.SomeModule': 'vc-module-different-name',
}

interface ModuleViewModel {
  id: string          // Module identifier (always the same as GitHub's Id)
  value: string       // Current input value
  sourceType: string  // 'GithubReleases' or 'AzureBlob'
  tags?: string[]    // Add tags array for GitHub releases
  isLoadingTags?: boolean
}

const props = defineProps<{
  config: ConfigurationData
  sortEnabled: boolean
}>()

const emit = defineEmits<{
  'module-update': [moduleId: string, type: ModuleType, value: string]
}>()

const modules = ref<ModuleViewModel[]>([])

// Helper function to format module ID for display
const formatModuleId = (id: string) => {
  return id.replace(/^VirtoCommerce\./, '')
}

// Convert config data to view models
const updateModules = (config: ConfigurationData) => {
  const viewModels: ModuleViewModel[] = []

  config.Sources.forEach(source => {
    source.Modules.forEach(module => {
      // Consistent ID handling:
      const moduleId = source.Name === 'GithubReleases'
        ? module.Id
        : module.BlobName?.split('_')[0]

      if (!moduleId) return // Skip invalid modules

      // Get the value part (no .zip handling):
      const value = source.Name === 'GithubReleases'
        ? module.Version || ''
        : module.BlobName?.split('_')[1] || ''

      viewModels.push({
        id: moduleId,
        value: value,
        sourceType: source.Name
      })
    })
  })

  // Use spread to trigger reactivity:
  modules.value = [...viewModels]
}

// Watch for config changes
watch(() => props.config, (newConfig) => {
  if (newConfig) {
    updateModules(newConfig)
  }
}, { immediate: true })

// Helper function to validate version format (major.minor.patch)
const isValidVersion = (version: string): boolean => {
  const versionRegex = /^\d+\.\d+\.\d+$/
  return versionRegex.test(version.trim())
}

// Helper function to validate blob filename format (version-suffix.zip)
const isValidBlobName = (name: string): boolean => {
  const blobRegex = /^\d+\.\d+\.\d+(-[\w.-]+)?\.zip$/
  return blobRegex.test(name.trim())
}

// Update hasInvalidInputs to include blob format validation
const hasInvalidInputs = computed(() => {
  return modules.value.some(module => {
    if (!module.value.trim()) return true
    if (module.value.trim()) {
      return module.sourceType === 'GithubReleases'
        ? !isValidVersion(module.value)
        : !isValidBlobName(module.value)
    }
    return false
  })
})

const handleInputChange = (moduleId: string, type: ModuleType, value: string) => {
  const trimmedValue = value.trim()

  // Update local view model:
  const module = modules.value.find(m => m.id === moduleId && m.sourceType === type)
  if (module) {
    module.value = trimmedValue
  }

  // Construct full value for Azure Blob (add prefix):
  const fullValue = type === 'GithubReleases'
    ? trimmedValue
    : `${moduleId}_${trimmedValue}`

  emit('module-update', moduleId, type, fullValue)
}

const moveModule = (moduleId: string, fromType: ModuleType, toType: ModuleType) => {
    // Find the index of the module in our view models:
    const existingModuleIndex = modules.value.findIndex(m => m.id === moduleId && m.sourceType === fromType);
    if (existingModuleIndex !== -1) {
        // Remove from the old source, using splice to trigger reactivity:
        modules.value.splice(existingModuleIndex, 1);
    }
    // Create a new module object for the target source with an empty value:
    const newModule: ModuleViewModel = {
        id: moduleId,
        value: '',
        sourceType: toType,
    };
    // Add the new module:
    modules.value.push(newModule);

    // Emit updates to the parent:
    emit('module-update', moduleId, fromType, '__DELETE__'); // Remove from old source
    emit('module-update', moduleId, toType, '');               // Add to new source (will store BlobName as moduleId_ if empty)
};

// Method to scroll to first invalid input
const scrollToFirstInvalidInput = () => {
  const firstInvalidInput = document.querySelector('.error') as HTMLElement
  if (firstInvalidInput) {
    firstInvalidInput.scrollIntoView({ behavior: 'smooth', block: 'center' })
    firstInvalidInput.focus()
  }
}

// Computed property for filtered and sorted modules
const sortedModules = computed(() => {
  if (!props.sortEnabled) {
    return modules.value
  }
  return [...modules.value].sort((a, b) => a.id.localeCompare(b.id))
})

// GitHub token will be provided via environment variable
const GITHUB_TOKEN = import.meta.env.VITE_GITHUB_TOKEN

// Helper function to create fetch options with auth
const createGitHubRequestOptions = (): RequestInit => ({
  headers: GITHUB_TOKEN ? {
    'Authorization': `token ${GITHUB_TOKEN}`,
    'Accept': 'application/vnd.github.v3+json'
  } : {}
})

// Function to fetch GitHub tags
const fetchGitHubTags = async (moduleId: string) => {
  try {
    const module = modules.value.find(m => m.id === moduleId)
    if (!module) return

    module.isLoadingTags = true
    const repoName = MODULE_REPO_MAPPING[moduleId] || (
      'vc-module-' + kebabCase(moduleId.replace(/^VirtoCommerce\./, ''))
    )

    console.log(`Fetching tags for: ${repoName}`)
    const response = await fetch(
      `https://api.github.com/repos/VirtoCommerce/${repoName}/tags?per_page=100`,
      createGitHubRequestOptions()
    )
    if (!response.ok) {
      throw new Error(`GitHub API returned ${response.status}: ${await response.text()}`)
    }

    let allTags = await response.json()

    module.tags = allTags
      .map((tag: { name: string }) => tag.name.replace(/^v/, ''))
      .filter((tag: string) => isValidVersion(tag))
      .sort((a: string, b: string) => b.localeCompare(a)) // Sort descending

  } catch (error) {
    console.error(`Error fetching tags for ${moduleId}:`, error)
    // Clear tags if there was an error
    const module = modules.value.find(m => m.id === moduleId)
    if (module) {
      module.tags = undefined
    }
  } finally {
    const module = modules.value.find(m => m.id === moduleId)
    if (module) {
      module.isLoadingTags = false
    }
  }
}

// Expose these to parent
defineExpose({
  hasInvalidInputs,
  scrollToFirstInvalidInput
})
</script>

<template>
  <div class="module-list">
    <div
      v-for="sourceType in ['AzureBlob', 'GithubReleases']"
      :key="sourceType"
      class="source-section"
    >
      <div class="section-container">
        <h2>{{ sourceType === 'AzureBlob' ? 'Azure Blob Storage' : 'GitHub Releases' }}</h2>
        <div class="modules">
          <div
            v-for="module in sortedModules.filter(m => m.sourceType === sourceType)"
            :key="module.id + '-' + module.sourceType"
            class="module-item"
          >
            <div class="module-info">
              <span class="module-id" :title="formatModuleId(module.id)">{{ formatModuleId(module.id) }}</span>
            </div>
            <div class="module-controls">
              <select
                :value="sourceType"
                @change="(e: Event) => {
                  const target = e.target as HTMLSelectElement;
                  moveModule(module.id, sourceType as ModuleType, target.value as ModuleType);
                }"
              >
                <option value="GithubReleases">GitHub Releases</option>
                <option value="AzureBlob">Azure Blob</option>
              </select>
              <div class="input-container">
                <template v-if="sourceType === 'GithubReleases'">
                  <div class="github-input-group">
                    <template v-if="module.tags">
                      <select
                        :value="module.value"
                        :class="{ 'error': !module.value.trim() || (module.value.trim() && !isValidVersion(module.value)) }"
                        @change="(e: Event) => {
                          const target = e.target as HTMLSelectElement;
                          handleInputChange(module.id, sourceType as ModuleType, target.value);
                        }"
                      >
                        <option value="">Select version</option>
                        <option v-for="tag in module.tags" :key="tag" :value="tag">
                          {{ tag }}
                        </option>
                      </select>
                    </template>
                    <template v-else>
                      <input
                        :data-module-id="module.id.trim()"
                        type="text"
                        :value="module.value"
                        :placeholder="'Version'"
                        :class="{
                          'error': !module.value.trim() || (module.value.trim() && !isValidVersion(module.value))
                        }"
                        :title="'Format should be: major.minor.patch (e.g., 3.809.0)'"
                        @input="(e: Event) => {
                          const target = e.target as HTMLInputElement;
                          handleInputChange(module.id, sourceType as ModuleType, target.value);
                        }"
                        @blur="(e: Event) => {
                          const target = e.target as HTMLInputElement;
                          target.value = target.value.trim();
                        }"
                      />
                    </template>
                    <button
                      class="load-tags-button"
                      @click="fetchGitHubTags(module.id)"
                      :disabled="module.isLoadingTags"
                      :title="module.tags ? 'Reload tags' : 'Load available versions'"
                    >
                      {{ module.isLoadingTags ? '⌛' : '↻' }}
                    </button>
                  </div>
                </template>
                <input
                  v-else
                  :data-module-id="module.id.trim()"
                  type="text"
                  :value="module.value"
                  placeholder="Version with suffix (e.g., 3.806.0-pr-62-df9c.zip)"
                  :class="{
                    'error': !module.value.trim() ||
                            (module.value.trim() && (
                              (sourceType === 'AzureBlob' && !isValidBlobName(module.value))
                            ))
                  }"
                  title="Format should be: version[-suffix].zip (e.g., 3.806.0-pr-62-df9c.zip)"
                  @input="(e: Event) => {
                    const target = e.target as HTMLInputElement;
                    handleInputChange(module.id, sourceType as ModuleType, target.value);
                  }"
                  @blur="(e: Event) => {
                    const target = e.target as HTMLInputElement;
                    target.value = target.value.trim();
                  }"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.module-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.source-section {
  margin-bottom: 10px;
}

.section-container {
  background: #f8f8f8;
  border-radius: 8px;
  padding: 20px;
}

.section-container h2 {
  color: #333;
  margin-bottom: 20px;
  font-weight: 600;
}

.modules {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.module-item {
  display: flex;
  gap: 12px;
  align-items: center;
  padding-right: 12px;
  background: white;
  padding: 10px;
  border-radius: 4px;
  border: 1px solid #ddd;
}

.module-info {
  width: 30%;
  flex-shrink: 0;
  padding: 5px;
}

.module-id {
  font-family: monospace;
  font-size: 14px;
  color: #000;
  font-weight: 500;
  display: block;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.module-controls {
  display: flex;
  gap: 8px;
  align-items: center;
  width: 70%;
  min-width: 0;
}

.module-controls select {
  width: 37%;
  padding: 8px 12px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 14px;
  font-family: monospace;
  background: white;
}

.input-container {
  flex: 1;
  min-width: 0;
}

.module-controls input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 14px;
  font-family: monospace;
  background: white;
  min-width: 0;
}

input:focus, select:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 2px rgba(0,123,255,0.1);
}

select {
  cursor: pointer;
}

input::placeholder {
  color: #999;
}

input.error {
  border-color: #d32f2f;
  background-color: #fff5f5;
}

input.error:focus {
  border-color: #d32f2f;
  box-shadow: 0 0 0 2px rgba(211, 47, 47, 0.1);
}

.github-input-group {
  display: flex;
  gap: 8px;
  width: 100%;
}

.github-input-group input,
.github-input-group select {
  flex: 1;
}

.load-tags-button {
  padding: 8px;
  background: #f0f0f0;
  border: 1px solid #ccc;
  border-radius: 4px;
  cursor: pointer;
  color: #666;
  font-size: 14px;
  min-width: 35px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.load-tags-button:hover:not(:disabled) {
  background: #e0e0e0;
  transform: scale(1.05);
}

.load-tags-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
