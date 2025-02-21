import React, { useState } from 'react';
import { ConfigurationData, ModuleType, ModuleBase } from './types';
import ModuleList from './components/ModuleList';
import JsonInput from './components/JsonInput';
import './App.css';

function App() {
    const [config, setConfig] = useState<ConfigurationData | null>(null);
    const [jsonError, setJsonError] = useState<string>('');

    const handleJsonSubmit = (jsonString: string) => {
        try {
            const parsed = JSON.parse(jsonString);
            setConfig(parsed);
            setJsonError('');
        } catch (e) {
            setJsonError('Invalid JSON format');
        }
    };

    const handleModuleUpdate = (moduleId: string, type: ModuleType, value: string) => {
        if (!config) return;

        const newConfig = { ...config };
        const sourceIndex = newConfig.Sources.findIndex(s => s.Name === type);

        if (sourceIndex === -1) return;

        const source = newConfig.Sources[sourceIndex];
        const moduleIndex = source.Modules.findIndex(m =>
            (type === 'GithubReleases' ? m.Id === moduleId : m.BlobName?.startsWith(moduleId))
        );

        if (moduleIndex === -1) return;

        if (type === 'GithubReleases') {
            (source.Modules[moduleIndex] as ModuleBase).Version = value;
        } else {
            (source.Modules[moduleIndex] as ModuleBase).BlobName = value;
        }

        setConfig(newConfig);
    };

    const generateJson = () => {
        if (!config) return '';

        // Sort modules alphabetically
        const newConfig = { ...config };
        newConfig.Sources = newConfig.Sources.map(source => ({
            ...source,
            Modules: [...source.Modules].sort((a, b) => {
                const aId = a.Id || a.BlobName || '';
                const bId = b.Id || b.BlobName || '';
                return aId.localeCompare(bId);
            })
        }));

        return JSON.stringify(newConfig, null, 2);
    };

    return (
        <div className="app">
            <h1>Module Configuration Manager</h1>

            {!config ? (
                <JsonInput onSubmit={handleJsonSubmit} error={jsonError} />
            ) : (
                <>
                    <ModuleList
                        config={config}
                        onModuleUpdate={handleModuleUpdate}
                    />
                    <div className="json-output">
                        <h2>Generated JSON</h2>
                        <pre>{generateJson()}</pre>
                    </div>
                </>
            )}
        </div>
    );
}

export default App;
