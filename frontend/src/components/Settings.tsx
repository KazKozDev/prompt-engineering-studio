import { useState, useEffect } from 'react';
import { api } from '../services/api';

interface SettingsProps {
    settings: {
        provider: string;
        model: string;
        autoSave: boolean;
        apiKeys: {
            openai?: string;
            gemini?: string;
            anthropic?: string;
        };
    };
    onSettingsChange: (newSettings: any) => void;
}

export function Settings({ settings, onSettingsChange }: SettingsProps) {
    const [availableModels, setAvailableModels] = useState<string[]>([]);
    const [showApiKeys, setShowApiKeys] = useState(true);
    const [apiKeyInputs, setApiKeyInputs] = useState(settings.apiKeys || {});

    useEffect(() => {
        loadModels(settings.provider);
    }, [settings.provider]);

    const loadModels = async (provider: string) => {
        try {
            const data = await api.getModels(provider);
            setAvailableModels(data.models);
            if (data.models.length > 0 && !data.models.includes(settings.model)) {
                onSettingsChange({ ...settings, model: data.models[0] });
            }
        } catch (error) {
            console.error('Failed to load models:', error);
        }
    };

    const updateApiKey = (provider: string, key: string) => {
        const newApiKeys = { ...apiKeyInputs, [provider]: key };
        setApiKeyInputs(newApiKeys);
        onSettingsChange({ ...settings, apiKeys: newApiKeys });
    };

    const testApiKey = async (provider: string) => {
        try {
            const apiKey = apiKeyInputs[provider as keyof typeof apiKeyInputs];
            if (!apiKey) {
                alert('No API key to test');
                return;
            }
            await api.testApiKey(provider, apiKey);
            alert('✓ API key is valid');
        } catch (error) {
            alert('✗ Invalid API key: ' + String(error));
        }
    };

    return (
        <div className="p-6">
            <h2 className="text-3xl font-bold text-slate-100 mb-4">Settings</h2>
            <div className="space-y-6">
                <div>
                    <h3 className="text-sm font-semibold text-slate-200 mb-3">Model Configuration</h3>
                    <div className="space-y-3">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Provider</label>
                            <select
                                value={settings.provider}
                                onChange={(e) => onSettingsChange({ ...settings, provider: e.target.value })}
                                className="w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-slate-200"
                            >
                                <option value="ollama">Ollama (Local)</option>
                                <option value="gemini">Google Gemini</option>
                                <option value="openai">OpenAI (Coming Soon)</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Model</label>
                            <select
                                value={settings.model}
                                onChange={(e) => onSettingsChange({ ...settings, model: e.target.value })}
                                className="w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-slate-200"
                            >
                                {availableModels.map(model => (
                                    <option key={model} value={model}>{model}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                <div>
                    <h3 className="text-sm font-semibold text-slate-200 mb-3">API Keys</h3>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-slate-300">Manage API keys for different providers</span>
                            <button
                                onClick={() => setShowApiKeys(!showApiKeys)}
                                className="text-sm text-blue-400 hover:text-blue-300"
                            >
                                {showApiKeys ? 'Hide' : 'Show'} API Keys
                            </button>
                        </div>
                        
                        {showApiKeys && (
                            <div className="space-y-3">
                                {/* OpenAI API Key */}
                                <div className="bg-gray-800/50 p-3 rounded-lg border border-gray-700">
                                    <div className="flex items-center justify-between mb-2">
                                        <label className="text-sm font-medium text-slate-300">OpenAI API Key</label>
                                        <button
                                            onClick={() => testApiKey('openai')}
                                            className="text-xs text-green-400 hover:text-green-300"
                                        >
                                            Test
                                        </button>
                                    </div>
                                    <input
                                        type="password"
                                        value={apiKeyInputs.openai || ''}
                                        onChange={(e) => updateApiKey('openai', e.target.value)}
                                        placeholder="sk-..."
                                        className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-sm text-slate-200 font-mono"
                                    />
                                    <div className="text-xs text-gray-400 mt-1">Used for GPT models, embeddings, and fine-tuning</div>
                                </div>

                                {/* Gemini API Key */}
                                <div className="bg-gray-800/50 p-3 rounded-lg border border-gray-700">
                                    <div className="flex items-center justify-between mb-2">
                                        <label className="text-sm font-medium text-slate-300">Google Gemini API Key</label>
                                        <button
                                            onClick={() => testApiKey('gemini')}
                                            className="text-xs text-green-400 hover:text-green-300"
                                        >
                                            Test
                                        </button>
                                    </div>
                                    <input
                                        type="password"
                                        value={apiKeyInputs.gemini || ''}
                                        onChange={(e) => updateApiKey('gemini', e.target.value)}
                                        placeholder="AIza..."
                                        className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-sm text-slate-200 font-mono"
                                    />
                                    <div className="text-xs text-gray-400 mt-1">Used for Gemini models and Google services</div>
                                </div>

                                {/* Anthropic API Key */}
                                <div className="bg-gray-800/50 p-3 rounded-lg border border-gray-700">
                                    <div className="flex items-center justify-between mb-2">
                                        <label className="text-sm font-medium text-slate-300">Anthropic API Key</label>
                                        <button
                                            onClick={() => testApiKey('anthropic')}
                                            className="text-xs text-green-400 hover:text-green-300"
                                        >
                                            Test
                                        </button>
                                    </div>
                                    <input
                                        type="password"
                                        value={apiKeyInputs.anthropic || ''}
                                        onChange={(e) => updateApiKey('anthropic', e.target.value)}
                                        placeholder="sk-ant-..."
                                        className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-sm text-slate-200 font-mono"
                                    />
                                    <div className="text-xs text-gray-400 mt-1">Used for Claude models and evaluation</div>
                                </div>

                                <div className="bg-yellow-900/20 p-3 rounded border border-yellow-700">
                                    <div className="text-xs text-yellow-400">
                                        ⚠️ API keys are stored locally in your browser. Never share your API keys with others.
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div>
                    <h3 className="text-sm font-semibold text-slate-200 mb-3">Preferences</h3>
                    <div className="space-y-2">
                        <label className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                checked={settings.autoSave}
                                onChange={(e) => onSettingsChange({ ...settings, autoSave: e.target.checked })}
                                className="h-4 w-4 rounded border-gray-500"
                            />
                            <span className="text-sm text-slate-300">Auto-save generations to history</span>
                        </label>
                    </div>
                </div>
            </div>
        </div>
    );
}
