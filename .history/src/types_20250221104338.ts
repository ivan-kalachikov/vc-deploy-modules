export interface ModuleBase {
    Id?: string;
    Version?: string;
    BlobName?: string;
}

export interface AzureBlobSource {
    Name: "AzureBlob";
    Container: string;
    ServiceUri: string;
    Modules: ModuleBase[];
}

export interface GithubReleasesSource {
    Name: "GithubReleases";
    ModuleSources: string[];
    Modules: ModuleBase[];
}

export type Source = AzureBlobSource | GithubReleasesSource;

export interface ConfigurationData {
    ManifestVersion: string;
    PlatformVersion: string;
    PlatformImage: string;
    PlatformImageTag: string;
    PlatformAssetUrl: string;
    ModuleSources: string[];
    Sources: Source[];
}

export type ModuleType = "AzureBlob" | "GithubReleases";
