interface APIKeysProps {
    settings: {
        provider: string;
        apiKey: string;
    };
    onSettingsChange: (newSettings: any) => void;
}

export function APIKeys({ settings, onSettingsChange }: APIKeysProps) {
    return (
        <div className="p-6">
            <h2 className="text-3xl font-bold text-slate-100 mb-4">API Keys Management</h2>
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Gemini API Key</label>
                    <input
                        type="password"
                        value={settings.provider === 'gemini' ? settings.apiKey : ''}
                        onChange={(e) => onSettingsChange({ ...settings, apiKey: e.target.value })}
                        className="w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-slate-200"
                        placeholder="Enter your Gemini API key"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">OpenAI API Key</label>
                    <input
                        type="password"
                        className="w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-slate-200"
                        placeholder="Enter your OpenAI API key"
                    />
                    <p className="text-xs text-slate-500 mt-1">OpenAI integration coming soon</p>
                </div>
                <div className="border border-gray-700 rounded-lg p-4 bg-gray-800/30 mt-4">
                    <p className="text-xs text-slate-400">
                        <strong>Note:</strong> API keys are stored locally in your browser and never sent to our servers.
                        For Ollama, no API key is required.
                    </p>
                </div>
            </div>
        </div>
    );
}
