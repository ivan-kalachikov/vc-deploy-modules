import type { ModuleBase } from '../types'

// Replace lodash-es kebabCase. Must handle:
// - VirtoCommerce.Orders -> orders (after prefix strip)
// - PageBuilderModule -> page-builder-module
// - XCMS -> x-c-m-s (edge case, but MODULE_REPO_MAPPING handles these)
// - DynamicAssociationsModule -> dynamic-associations-module
export const kebabCase = (s: string): string =>
  s
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/([A-Z])([A-Z][a-z])/g, '$1-$2')
    .toLowerCase()

// Extract module ID from a ModuleBase (works for both source types)
export const getModuleId = (module: ModuleBase): string =>
  module.Id || module.BlobName?.split('_')[0] || ''

// Format module ID for display (strip VirtoCommerce. prefix)
export const formatModuleId = (id: string): string =>
  id.replace(/^VirtoCommerce\./, '')
