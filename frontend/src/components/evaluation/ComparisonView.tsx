import { useState } from 'react';

interface SettingsState {
    provider: string;
    model: string;
    apiKey: string;
    theme: string;
    autoSave: boolean;
}

interface ComparisonViewProps {
    settings: SettingsState;
}

export function ComparisonView({ settings: _settings }: ComparisonViewProps) {
    const [selectedDataset, setSelectedDataset] = useState<string>('');
    const [prompts, setPrompts] = useState<string[]>(['']);
    const [results, setResults] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    const addPrompt = () => setPrompts([...prompts, '']);
    const removePrompt = (idx: number) => setPrompts(prompts.filter((_, i) => i !== idx));
    const updatePrompt = (idx: number, val: string) => {
        const next = [...prompts];
        next[idx] = val;
        setPrompts(next);
    };

    const runComparison = async () => {
        const validPrompts = prompts.filter(p => p.trim());
        if (validPrompts.length < 2) {
            alert('Add at least two prompt variants to compare');
            return;
        }
        if (!selectedDataset) {
            alert('Select a dataset');
            return;
        }

        setLoading(true);
        try {
            // Backend endpoint not wired yet – placeholder structure
            setResults({
                prompts: validPrompts.map((text, idx) => ({
                    id: idx + 1,
                    text,
                    score: 0
                }))
            });
        } catch (error) {
            console.error(error);
            alert('Error running comparison');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-black/20 p-4 rounded-lg border border-white/5 space-y-4">
                <h3 className="text-sm font-medium text-white/90">Prompt Comparison Configuration</h3>

                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-medium text-white/40 mb-2">Dataset</label>
                        <select
                            value={selectedDataset}
                            onChange={(e) => setSelectedDataset(e.target.value)}
                            disabled
                            className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white/60 cursor-not-allowed"
                        >
                            <option value="">Dataset selection will be available soon</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-white/40 mb-2">Prompts to Compare</label>
                        <div className="space-y-3">
                            {prompts.map((p, idx) => (
                                <div key={idx} className="flex gap-2">
                                    <textarea
                                        value={p}
                                        onChange={(e) => updatePrompt(idx, e.target.value)}
                                        placeholder={`Prompt variant #${idx + 1}...`}
                                        className="flex-1 h-20 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white/90 font-mono resize-none focus:outline-none focus:border-[#007AFF]/30"
                                    />
                                    {prompts.length > 1 && (
                                        <button
                                            onClick={() => removePrompt(idx)}
                                            className="text-red-400/70 hover:text-red-400 px-2"
                                        >
                                            ✕
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                        <button
                            onClick={addPrompt}
                            className="mt-2 text-xs text-[#007AFF] hover:text-[#0071E3] font-medium"
                        >
                            + Add Variant
                        </button>
                    </div>

                    <button
                        onClick={runComparison}
                        disabled={loading}
                        className="w-full py-2 bg-[#007AFF] hover:bg-[#0071E3] text-white rounded-lg font-medium disabled:opacity-50 transition-all"
                    >
                        {loading ? 'Running Comparison...' : 'Run Comparison (UI only)'}
                    </button>
                </div>
            </div>

            {results && (
                <div className="bg-black/20 p-4 rounded-lg border border-white/5 space-y-4">
                    <h3 className="text-sm font-medium text-white/90">Comparison Results</h3>

                    <div className="space-y-3">
                        {results.prompts.map((prompt: any, idx: number) => (
                            <div key={idx} className="bg-white/[0.02] p-3 rounded-lg border border-white/5">
                                <div className="flex justify-between items-start mb-2">
                                    <span className="text-sm font-medium text-white/80">Prompt #{idx + 1}</span>
                                    <span className="text-sm font-mono text-[#007AFF]">{prompt.score.toFixed(3)}</span>
                                </div>
                                <div className="text-xs text-white/40 font-mono bg-black/20 p-2 rounded truncate">
                                    {prompt.text.substring(0, 100)}...
                                </div>
                            </div>
                        ))}
                    </div>

                    <details className="text-xs mt-2">
                        <summary className="cursor-pointer text-white/40 hover:text-white/60">View Raw JSON</summary>
                        <pre className="mt-2 text-white/30 overflow-auto max-h-64">
                            {JSON.stringify(results, null, 2)}
                        </pre>
                    </details>
                </div>
            )}
        </div>
    );
}
