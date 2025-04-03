<script setup lang="ts">
import { ref, watch, computed, nextTick } from 'vue'
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
  'VirtoCommerce.PageBuilderModule': 'page-builder',
  'VirtoCommerce.ProfileExperienceApiModule': 'vc-module-profile-experience-api',
  'VirtoCommerce.ShipStation': 'vc-module-shipstation',
  'VirtoCommerce.WebHooks': 'vc-module-webhooks',
  'VirtoCommerce.XCMS': 'vc-module-x-cms',
  'VirtoCommerce.Xapi': 'vc-module-x-api',
  'VirtoCommerce.CyberSourcePayment': 'vc-module-cyber-source',
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
const isUpdatingAllModules = ref(false)
const updateProgress = ref({ current: 0, total: 0 })

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
    const trimmedValue = module.value.trim()

    // Empty value is always invalid
    if (!trimmedValue) return true

    // For GitHub releases with tags loaded, empty select is invalid
    if (module.sourceType === 'GithubReleases' && module.tags?.length) {
      return !trimmedValue || trimmedValue === '' || !isValidVersion(trimmedValue)
    }

    // For other cases, check format based on source type
    if (trimmedValue) {
      return module.sourceType === 'GithubReleases'
        ? !isValidVersion(trimmedValue)
        : !isValidBlobName(trimmedValue)
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

const moveModule = async (moduleId: string, fromType: ModuleType, toType: ModuleType) => {
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

  // If moving to GitHub Releases, fetch tags immediately
  if (toType === 'GithubReleases') {
    // First check cache
    const cached = getCachedTags(moduleId)
    if (cached) {
      newModule.tags = cached.tags
    }
    // Then fetch fresh tags
    fetchGitHubTags(moduleId, true)
  }

  // Add the new module:
  modules.value.push(newModule);

  // Emit updates to the parent:
  emit('module-update', moduleId, fromType, '__DELETE__'); // Remove from old source
  emit('module-update', moduleId, toType, ''); // Add to new source
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

// Local storage key prefix for cached tags
const TAGS_CACHE_PREFIX = 'vc-module-tags-'
const TAGS_CACHE_EXPIRY = 24 * 60 * 60 * 1000 // 24 hours in milliseconds

interface CachedTags {
  tags: string[];
  timestamp: number;
}

// Helper function to get cached tags
const getCachedTags = (moduleId: string): CachedTags | null => {
  try {
    const cached = localStorage.getItem(TAGS_CACHE_PREFIX + moduleId)
    if (!cached) return null

    const data = JSON.parse(cached) as CachedTags
    // Check if cache is expired (older than 24 hours)
    if (Date.now() - data.timestamp > TAGS_CACHE_EXPIRY) {
      localStorage.removeItem(TAGS_CACHE_PREFIX + moduleId)
      return null
    }
    return data
  } catch {
    return null
  }
}

// Helper function to set cached tags
const setCachedTags = (moduleId: string, tags: string[]) => {
  try {
    const data: CachedTags = {
      tags,
      timestamp: Date.now()
    }
    localStorage.setItem(TAGS_CACHE_PREFIX + moduleId, JSON.stringify(data))
  } catch (error) {
    console.error('Error caching tags:', error)
  }
}

// Function to fetch GitHub tags
const fetchGitHubTags = async (moduleId: string, forceRefresh = false) => {
  try {
    const module = modules.value.find(m => m.id === moduleId)
    if (!module) return

    module.isLoadingTags = true

    // Check cache first if not forcing refresh
    const cached = getCachedTags(moduleId)
    if (cached && !forceRefresh) {
      module.tags = cached.tags
      module.isLoadingTags = false
      return
    }

    const repoName = MODULE_REPO_MAPPING[moduleId] || (
      'vc-module-' + kebabCase(moduleId.replace(/^VirtoCommerce\./, ''))
    )

    console.log(`Fetching tags for: ${repoName}`)
    let allTags: Array<{ name: string }> = []
    let currentPage = 1
    let hasNextPage = true

    while (hasNextPage) {
      const response = await fetch(
        `https://api.github.com/repos/VirtoCommerce/${repoName}/tags?per_page=100&page=${currentPage}`,
        {
          headers: GITHUB_TOKEN ? {
            'Authorization': `token ${GITHUB_TOKEN}`,
            'Accept': 'application/vnd.github.v3+json'
          } : {}
        }
      )
      if (!response.ok) {
        throw new Error(`GitHub API returned ${response.status}: ${await response.text()}`)
      }

      const pageTags = await response.json()
      if (pageTags.length === 0) {
        hasNextPage = false
      } else {
        allTags = [...allTags, ...pageTags]
        currentPage++
      }

      if (pageTags.length < 100) {
        hasNextPage = false
      }
    }

    const processedTags = allTags
      .map((tag: { name: string }) => tag.name.replace(/^v/, ''))
      .filter((tag: string) => isValidVersion(tag))
      .sort((a: string, b: string) => b.localeCompare(a))

    // Cache the processed tags
    setCachedTags(moduleId, processedTags)
    module.tags = processedTags

  } catch (error) {
    console.error(`Error fetching tags for ${moduleId}:`, error)
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

// Function to update all GitHub modules at once
const updateAllGitHubModules = async () => {
  try {
    // Get all GitHub modules
    const githubModules = modules.value.filter(m => m.sourceType === 'GithubReleases')

    if (githubModules.length === 0) {
      alert('No GitHub modules found to update')
      return
    }

    isUpdatingAllModules.value = true
    updateProgress.value = { current: 0, total: githubModules.length }

    let updatedCount = 0
    console.log(`Starting update for ${githubModules.length} GitHub modules`)

    // Process modules sequentially to avoid rate limiting
    for (const module of githubModules) {
      try {
        console.log(`Processing module: ${module.id}`)

        // Add a small delay between API calls to avoid rate limiting
        if (updateProgress.value.current > 0) {
          await new Promise(resolve => setTimeout(resolve, 500))
        }

        // Fetch tags for this module
        console.log(`Fetching tags for: ${module.id}`)
        await fetchGitHubTags(module.id, true)

        // Get the latest version if tags were successfully loaded
        if (module.tags?.length) {
          const latestVersion = module.tags[0]
          const currentVersion = module.value

          console.log(`Module ${module.id}: current=${currentVersion}, latest=${latestVersion}`)

          // Always update to latest version
          handleInputChange(module.id, 'GithubReleases', latestVersion)
          console.log(`Updated ${module.id} to ${latestVersion}`)
          updatedCount++
        } else {
          console.log(`No tags found for module: ${module.id}`)
        }
      } catch (error) {
        console.error(`Error updating module ${module.id}:`, error)
      } finally {
        // Update progress
        updateProgress.value.current++
        console.log('--------------------------------');
      }
    }

    // Show completion message
    if (updatedCount > 0) {
      alert(`Successfully updated ${updatedCount} module${updatedCount > 1 ? 's' : ''} to latest versions.`)
    } else {
      alert('No modules were updated. This could be due to API rate limits or no available versions.')
    }
  } catch (error) {
    console.error('Error updating all modules:', error)
    alert('An error occurred while updating modules. Check console for details.')
  } finally {
    isUpdatingAllModules.value = false
  }
}

// Load cached tags on component mount
watch(() => modules.value, (newModules) => {
  newModules.forEach(module => {
    if (module.sourceType === 'GithubReleases') {
      const cached = getCachedTags(module.id)
      if (cached) {
        module.tags = cached.tags
      }
    }
  })
}, { immediate: true })

// Helper function to extract PR URL from blob name
const extractPrUrl = (blobName: string): string | null => {
  const prMatch = blobName.match(/-pr-(\d+)-/)
  if (prMatch) {
    return `https://github.com/VirtoCommerce/vc-platform/pull/${prMatch[1]}`
  }
  return null
}

// Helper function to parse artifact URL from PR description
const parseArtifactUrl = (description: string): { moduleId: string, fileName: string } | null => {
  // Replace all types of line breaks with spaces to handle \r\n
  const normalizedDesc = description.replace(/[\r\n]+/g, ' ')
  const match = normalizedDesc.match(/Artifact URL:\s*https:\/\/vc3prerelease\.blob\.core\.windows\.net\/packages\/([^/\s]+_([\d.]+(?:-[\w.-]+)?\.zip))/i)
  if (match) {
    const [_, fullFileName, version] = match
    const moduleId = fullFileName.split('_')[0]
    console.log('Found artifact info:', { moduleId, fullFileName })
    return {
      moduleId,
      fileName: fullFileName
    }
  }
  console.log('No artifact URL found in description:', normalizedDesc)
  return null
}

const prUrl = ref('')

const handlePrUrlSubmit = async () => {
  try {
    // Extract PR number from URL
    const prMatch = prUrl.value.match(/github\.com\/VirtoCommerce\/([^/]+)\/pull\/(\d+)/)
    if (!prMatch) {
      throw new Error('Invalid PR URL')
    }

    const [_, repo, prNumber] = prMatch
    const response = await fetch(
      `https://api.github.com/repos/VirtoCommerce/${repo}/pulls/${prNumber}`,
      {
        headers: GITHUB_TOKEN ? {
          'Authorization': `token ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json'
        } : {}
      }
    )

    if (!response.ok) {
      throw new Error('Failed to fetch PR description')
    }

    const prData = await response.json()
    const artifactInfo = parseArtifactUrl(prData.body || '')

    if (artifactInfo) {
      // Find the module in either source
      const existingModule = modules.value.find(m => m.id === artifactInfo.moduleId)

      if (existingModule) {
        const fileName = artifactInfo.fileName.split('_')[1]
        console.log(`Found artifact: ${artifactInfo.moduleId} with file ${fileName}`)

        // If module exists in GitHub Releases, move it to Azure Blob
        if (existingModule.sourceType === 'GithubReleases') {
          console.log(`Moving ${artifactInfo.moduleId} from GitHub Releases to Azure Blob`)
          moveModule(artifactInfo.moduleId, 'GithubReleases', 'AzureBlob')
          // Wait for the next tick to ensure module is moved
          await nextTick()
        }

        // Update the blob name after ensuring it's in Azure Blob
        console.log(`Updating ${artifactInfo.moduleId} with version ${fileName}`)
        // Find the module again after potential move
        const updatedModule = modules.value.find(m => m.id === artifactInfo.moduleId)
        if (updatedModule) {
          handleInputChange(artifactInfo.moduleId, 'AzureBlob', fileName)
          updatedModule.value = fileName
        } else {
          throw new Error(`Module ${artifactInfo.moduleId} not found after move`)
        }
      } else {
        console.error(`Module ${artifactInfo.moduleId} not found in the configuration`)
        alert(`Module ${artifactInfo.moduleId} not found in the configuration`)
      }
    } else {
      throw new Error('No artifact URL found in PR description')
    }

    // Clear and hide input
    prUrl.value = ''

  } catch (error) {
    console.error('Error processing PR URL:', error)
    alert(error instanceof Error ? error.message : 'Failed to process PR. Please check the console for details.')
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
        <div class="section-header">
          <h2>{{ sourceType === 'AzureBlob' ? 'Azure Blob Storage' : 'GitHub Releases' }}</h2>
          <template v-if="sourceType === 'AzureBlob'">
            <div class="pr-input-group">
              <input
                v-model="prUrl"
                placeholder="Enter PR URL"
                @keyup.enter="handlePrUrlSubmit"
              />
              <button class="pr-button" @click="handlePrUrlSubmit">Parse</button>
            </div>
          </template>
          <template v-else-if="sourceType === 'GithubReleases'">
            <div class="update-all-group">
              <button
                class="update-all-button"
                @click="updateAllGitHubModules"
                :disabled="isUpdatingAllModules"
              >
                {{ isUpdatingAllModules ? `Updating...` : 'Update All To Latest Versions' }}
              </button>
              <div v-if="isUpdatingAllModules" class="progress-container">
                <div class="progress-bar" :style="{ width: `${(updateProgress.current / updateProgress.total) * 100}%` }"></div>
                <span class="progress-text">{{ updateProgress.current }}/{{ updateProgress.total }}</span>
              </div>
            </div>
          </template>
        </div>
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
                        :data-module-id="module.id.trim()"
                        :class="{ 'error': !module.value || module.value === '' || !isValidVersion(module.value) }"
                        @change="(e: Event) => {
                          const target = e.target as HTMLSelectElement;
                          handleInputChange(module.id, sourceType as ModuleType, target.value);
                        }"
                      >
                        <option value="" disabled>Select version</option>
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
                      @click="fetchGitHubTags(module.id, true)"
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
                  :title="module.value && extractPrUrl(module.value)
                    ? `PR: ${extractPrUrl(module.value)}`
                    : 'Format should be: version[-suffix].zip (e.g., 3.806.0-pr-62-df9c.zip)'"
                  :class="{
                    'error': !module.value.trim() ||
                            (module.value.trim() && (
                              (sourceType === 'AzureBlob' && !isValidBlobName(module.value))
                            ))
                  }"
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

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
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

select.error {
  border-color: #d32f2f;
  background-color: #fff5f5;
}

select.error:focus {
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

.pr-button {
  padding: 8px 12px;
  background: #4a6ee0;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.pr-button:hover {
  background: #3d5bc4;
}

.pr-input-group {
  display: flex;
  gap: 8px;
  align-items: center;
}

.pr-input-group input {
  padding: 8px 12px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 14px;
  min-width: 300px;
}

select.error {
  border-color: #d32f2f;
  background-color: #fff5f5;
}

select.error:focus {
  border-color: #d32f2f;
  box-shadow: 0 0 0 2px rgba(211, 47, 47, 0.1);
}

.update-all-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.update-all-button {
  padding: 8px 12px;
  background: #4a6ee0;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  white-space: nowrap;
}

.update-all-button:hover:not(:disabled) {
  background: #3d5bc4;
}

.update-all-button:disabled {
  background: #a0acd7;
  cursor: not-allowed;
}

.progress-container {
  position: relative;
  height: 24px;
  background: #f0f0f0;
  border-radius: 12px;
  overflow: hidden;
  width: 150px;
  border: 1px solid #ccc;
}

.progress-bar {
  height: 100%;
  background: #4caf50;
  transition: width 0.3s ease;
}

.progress-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 12px;
  color: #333;
  font-weight: 600;
  text-shadow: 0 0 2px rgba(255, 255, 255, 0.8);
}
</style>
