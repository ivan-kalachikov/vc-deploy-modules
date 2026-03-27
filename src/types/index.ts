// Keep ModuleBase for JSON.parse() compatibility (the raw data has optional fields)
export interface ModuleBase {
  Id?: string
  Version?: string
  BlobName?: string
}

export interface AzureBlobSource {
  Name: 'AzureBlob'
  Container: string
  ServiceUri: string
  Modules: ModuleBase[]
}

export interface GithubReleasesSource {
  Name: 'GithubReleases'
  ModuleSources: string[]
  Modules: ModuleBase[]
}

export type Source = AzureBlobSource | GithubReleasesSource

export interface ConfigurationData {
  ManifestVersion: string
  PlatformVersion: string
  PlatformImage: string
  PlatformImageTag: string
  PlatformAssetUrl: string
  ModuleSources: string[]
  Sources: Source[]
}

export type ModuleType = 'AzureBlob' | 'GithubReleases'

// View model for module list
export interface ModuleViewModel {
  id: string
  value: string
  sourceType: ModuleType
  originalValue?: string
  originalSourceType?: ModuleType
  tags?: string[]
  isLoadingTags?: boolean
}

// Structured diff change (replaces v-html DiffItem)
export interface DiffChange {
  type: 'platform' | 'module'
  field?: string          // for platform changes (e.g., 'Platform Version')
  moduleId?: string       // for module changes
  action: 'changed' | 'added' | 'moved'
  oldValue?: string
  newValue?: string
  fromSource?: string     // for moved modules
  toSource?: string       // for moved modules
}

// Toast notification
export interface Toast {
  id: number
  message: string
  type: 'success' | 'error' | 'info'
  duration?: number
}

// Tag cache entry
export interface CachedTags {
  tags: string[]
  timestamp: number
}
