import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Button } from './ui/Button';

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
        <div className="h-full flex gap-6 p-6 overflow-hidden">
            {/* Left Sidebar */}
            <div className="w-80 flex flex-col shrink-0 gap-4">
                <div>
                    <h2 className="text-[11px] font-bold text-white/30 uppercase tracking-widest mb-1">SETTINGS</h2>
                    <p className="text-xs text-white/40 mb-4 mt-1">Configure your application preferences and API keys</p>
                </div>

                {/* Info Panel */}
                <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 pr-2">
                    <div className="bg-white/[0.02] border border-white/5 rounded-lg p-4">
                        <h3 className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-3">Configuration</h3>
                        <ul className="text-[11px] text-white/50 space-y-2">
                            <li className="leading-relaxed">
                                <strong className="text-white/70">Provider</strong> - Select AI model provider
                            </li>
                            <li className="leading-relaxed">
                                <strong className="text-white/70">Model</strong> - Choose specific model version
                            </li>
                            <li className="leading-relaxed">
                                <strong className="text-white/70">API Keys</strong> - Manage provider credentials
                            </li>
                        </ul>
                    </div>

                    <div className="bg-yellow-900/10 rounded-lg p-3 border border-yellow-800/20">
                        <div className="flex items-start gap-2">
                            <svg className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            <div className="text-[11px] text-yellow-400/80 leading-relaxed">
                                API keys are stored locally in your browser
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Panel: Settings Form */}
            <div className="flex-1 flex flex-col bg-gradient-to-b from-black/20 to-transparent border border-white/5 rounded-2xl overflow-hidden">
                <div className="px-6 py-5 border-b border-white/5 bg-white/[0.02] flex items-start justify-between gap-4">
                    <div>
                        <h2 className="text-xl font-semibold text-white/90 mb-1">Configuration</h2>
                        <p className="text-xs text-white/45 mt-1">Manage your application settings</p>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar">
                    {/* Model Configuration */}
                    <div>
                        <h3 className="text-xs font-semibold text-white/70 mb-3">Model Configuration</h3>
                        <div className="space-y-3">
                            <div>
                                <label className="block text-[10px] font-medium text-white/50 mb-2 uppercase tracking-wider">Provider</label>
                                <select
                                    value={settings.provider}
                                    onChange={(e) => onSettingsChange({ ...settings, provider: e.target.value })}
                                    className="w-full rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2 text-sm text-white/80 focus:outline-none focus:border-white/20"
                                >
                                    <option value="ollama">Ollama (Local)</option>
                                    <option value="gemini">Google Gemini</option>
                                    <option value="openai">OpenAI (Coming Soon)</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-[10px] font-medium text-white/50 mb-2 uppercase tracking-wider">Model</label>
                                <select
                                    value={settings.model}
                                    onChange={(e) => onSettingsChange({ ...settings, model: e.target.value })}
                                    className="w-full rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2 text-sm text-white/80 focus:outline-none focus:border-white/20"
                                >
                                    {availableModels.map(model => (
                                        <option key={model} value={model}>{model}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* API Keys */}
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-xs font-semibold text-white/70">API Keys</h3>
                            <Button
                                onClick={() => setShowApiKeys(!showApiKeys)}
                                variant="ghost"
                                size="xs"
                                className="text-xs text-white/60 hover:text-white px-0"
                            >
                                {showApiKeys ? 'Hide' : 'Show'}
                            </Button>
                        </div>

                        {showApiKeys && (
                            <div className="space-y-3">
                                {/* OpenAI API Key */}
                                <div className="bg-white/[0.02] p-3 rounded-lg border border-white/5">
                                    <div className="flex items-center justify-between mb-2">
                                        <label className="text-xs font-medium text-white/70">OpenAI API Key</label>
                                        <Button
                                            onClick={() => testApiKey('openai')}
                                            variant="secondary"
                                            size="xs"
                                            className="text-[10px] px-2 py-1"
                                        >
                                            Test
                                        </Button>
                                    </div>
                                    <input
                                        type="password"
                                        value={apiKeyInputs.openai || ''}
                                        onChange={(e) => updateApiKey('openai', e.target.value)}
                                        placeholder="sk-..."
                                        className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-xs text-white/80 font-mono focus:outline-none focus:border-white/20"
                                    />
                                    <div className="text-[10px] text-white/40 mt-1">Used for GPT models and embeddings</div>
                                </div>

                                {/* Gemini API Key */}
                                <div className="bg-white/[0.02] p-3 rounded-lg border border-white/5">
                                    <div className="flex items-center justify-between mb-2">
                                        <label className="text-xs font-medium text-white/70">Google Gemini API Key</label>
                                        <Button
                                            onClick={() => testApiKey('gemini')}
                                            variant="secondary"
                                            size="xs"
                                            className="text-[10px] px-2 py-1"
                                        >
                                            Test
                                        </Button>
                                    </div>
                                    <input
                                        type="password"
                                        value={apiKeyInputs.gemini || ''}
                                        onChange={(e) => updateApiKey('gemini', e.target.value)}
                                        placeholder="AIza..."
                                        className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-xs text-white/80 font-mono focus:outline-none focus:border-white/20"
                                    />
                                    <div className="text-[10px] text-white/40 mt-1">Used for Gemini models and services</div>
                                </div>

                                {/* Anthropic API Key */}
                                <div className="bg-white/[0.02] p-3 rounded-lg border border-white/5">
                                    <div className="flex items-center justify-between mb-2">
                                        <label className="text-xs font-medium text-white/70">Anthropic API Key</label>
                                        <Button
                                            onClick={() => testApiKey('anthropic')}
                                            variant="secondary"
                                            size="xs"
                                            className="text-[10px] px-2 py-1"
                                        >
                                            Test
                                        </Button>
                                    </div>
                                    <input
                                        type="password"
                                        value={apiKeyInputs.anthropic || ''}
                                        onChange={(e) => updateApiKey('anthropic', e.target.value)}
                                        placeholder="sk-ant-..."
                                        className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-xs text-white/80 font-mono focus:outline-none focus:border-white/20"
                                    />
                                    <div className="text-[10px] text-white/40 mt-1">Used for Claude models and evaluation</div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Preferences */}
                    <div>
                        <h3 className="text-xs font-semibold text-white/70 mb-3">Preferences</h3>
                        <label className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                checked={settings.autoSave}
                                onChange={(e) => onSettingsChange({ ...settings, autoSave: e.target.checked })}
                                className="h-4 w-4 rounded border-white/20"
                            />
                            <span className="text-xs text-white/70">Auto-save generations to history</span>
                        </label>
                    </div>
                </div>
            </div>
        </div>
    );
}
