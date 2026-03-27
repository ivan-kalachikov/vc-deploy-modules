import { kebabCase } from '../utils/helpers'

// Mapping for modules with non-standard repository names
export const MODULE_REPO_MAPPING: Record<string, string> = {
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
}

// Get GitHub repository name for a module ID
export const getRepoName = (moduleId: string): string =>
  MODULE_REPO_MAPPING[moduleId] ||
  'vc-module-' + kebabCase(moduleId.replace(/^VirtoCommerce\./, ''))

// Get full GitHub repository URL for a module
export const getGitHubRepoUrl = (moduleId: string): string =>
  `https://github.com/VirtoCommerce/${getRepoName(moduleId)}`
