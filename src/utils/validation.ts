// Version format: major.minor.patch (e.g., 3.809.0)
export const isValidVersion = (version: string): boolean =>
  /^\d+\.\d+\.\d+$/.test(version.trim())

// Manifest version format: major.minor (e.g., 2.0)
export const isValidManifestVersion = (version: string): boolean =>
  /^\d+\.\d+$/.test(version.trim())

// Azure blob name format: version[-suffix].zip (e.g., 3.806.0-pr-62-df9c.zip)
export const isValidBlobName = (name: string): boolean =>
  /^\d+\.\d+\.\d+(-[\w.-]+)?\.zip$/.test(name.trim())

// Platform image format: domain/org or domain/org/repo (e.g., ghcr.io/virtocommerce/platform)
export const isValidPlatformImage = (image: string): boolean =>
  /^[\w.-]+\.\w+\/[\w.-]+(\/[\w.-]+)?$/.test(image.trim())
