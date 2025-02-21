import React, { useState } from 'react';

interface Props {
    onSubmit: (json: string) => void;
    error: string;
}

function JsonInput({ onSubmit, error }: Props) {
    const [jsonInput, setJsonInput] = useState('');

    return (
        <div className="json-input">
            <h2>Paste your JSON configuration</h2>
            <textarea
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
                rows={20}
                placeholder="Paste your JSON here..."
            />
            {error && <div className="error">{error}</div>}
            <button onClick={() => onSubmit(jsonInput)}>Load Configuration</button>
        </div>
    );
}

export default JsonInput;
