import React from 'react';
import { ConfigurationData, ModuleType } from '../types';

interface Props {
    config: ConfigurationData;
    onModuleUpdate: (moduleId: string, type: ModuleType, value: string) => void;
}

function ModuleList({ config, onModuleUpdate }: Props) {
    return (
        <div className="module-list">
            {config.Sources.map((source) => (
                <div key={source.Name} className="source-section">
                    <h2>{source.Name}</h2>
                    <div className="modules">
                        {source.Modules.map((module) => {
                            const moduleId = module.Id || module.BlobName?.split('_')[0] || '';
                            const currentValue = source.Name === 'GithubReleases'
                                ? module.Version
                                : module.BlobName;

                            return (
                                <div key={moduleId} className="module-item">
                                    <span className="module-name">{moduleId}</span>
                                    <input
                                        type="text"
                                        value={currentValue || ''}
                                        onChange={(e) => onModuleUpdate(
                                            moduleId,
                                            source.Name as ModuleType,
                                            e.target.value
                                        )}
                                        placeholder={source.Name === 'GithubReleases' ? 'Version' : 'Blob Name'}
                                    />
                                </div>
                            );
                        })}
                    </div>
                </div>
            ))}
        </div>
    );
}

export default ModuleList;
