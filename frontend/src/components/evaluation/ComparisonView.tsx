import { useState, useEffect } from 'react';
import { PromptSelector } from './PromptSelector';
import { api } from '../../services/api';
import { DatasetGenerator } from '../DatasetGenerator';
import { Button } from '../ui/Button';

interface ComparisonViewProps {
    settings: {
        provider: string;
        model: string;
        apiKey?: string;
    };
    datasets: any[];
    onDatasetCreated?: () => void;
}

export function ComparisonView({ settings, datasets, onDatasetCreated }: ComparisonViewProps) {
    const [selectedDataset, setSelectedDataset] = useState<string>('');
    const [prompts, setPrompts] = useState<string[]>(['', '']);
    const [results, setResults] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    // Selector state
    const [showSelector, setShowSelector] = useState(false);
    const [selectorTargetIndex, setSelectorTargetIndex] = useState<number>(0);
    const [showGenerator, setShowGenerator] = useState(false);

    useEffect(() => {
        if (datasets.length > 0 && !selectedDataset) {
            setSelectedDataset(datasets[0].id);
        }
    }, [datasets]);

    const addPrompt = () => setPrompts([...prompts, '']);
    const removePrompt = (idx: number) => setPrompts(prompts.filter((_, i) => i !== idx));
    const updatePrompt = (idx: number, val: string) => {
        const next = [...prompts];
        next[idx] = val;
        setPrompts(next);
    };

    const handleOpenSelector = (index: number) => {
        setSelectorTargetIndex(index);
        setShowSelector(true);
    };

    const handleSelectPrompt = (text: string) => {
        updatePrompt(selectorTargetIndex, text);
        setShowSelector(false);
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
            const datasetRes = await api.getDataset(selectedDataset);
            if (!datasetRes || !datasetRes.data) {
                throw new Error('Failed to load dataset data');
            }

            const evalRes = await api.runOfflineEvaluation({
                dataset: datasetRes.data,
                prompts: validPrompts,
                provider: settings.provider,
                model: settings.model
            });

            setResults(evalRes);
        } catch (error) {
            console.error(error);
            alert('Error running comparison: ' + String(error));
        } finally {
            setLoading(false);
        }
    };

    const selectedDatasetMeta = datasets.find(d => d.id === selectedDataset);
    const datasetSize = selectedDatasetMeta?.size ?? selectedDatasetMeta?.data?.length ?? 0;
    const datasetName = selectedDatasetMeta?.name || 'Not set';
    const variantLabel = (index: number) => String.fromCharCode(65 + index);

    return (
        <div className="relative space-y-6 pb-20">
            {showSelector && (
                <PromptSelector
                    onSelect={handleSelectPrompt}
                    onClose={() => setShowSelector(false)}
                />
            )}

            {showGenerator && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-8">
                    <div className="bg-[#0d0d0d] border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DatasetGenerator
                            settings={settings}
                            context="comparison"
                            title="Generate Comparison Dataset"
                            description="Create test cases to compare multiple prompt variants side by side"
                            initialPrompt={prompts[0] || ''}
                            onGenerated={async (data, name) => {
                                try {
                                    const result = await api.createDataset({
                                        name: name || `Comparison Dataset ${new Date().toLocaleDateString()}`,
                                        description: 'Generated for prompt comparison',
                                        category: 'comparison',
                                        data
                                    });
                                    if (result?.id) {
                                        setSelectedDataset(result.id);
                                    }
                                    onDatasetCreated?.();
                                    setShowGenerator(false);
                                } catch (err) {
                                    console.error('Failed to save dataset:', err);
                                }
                            }}
                            onClose={() => setShowGenerator(false)}
                        />
                    </div>
                </div>
            )}

            <div className="bg-black/25 p-5 rounded-xl border border-white/5 shadow-lg shadow-black/30 space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-[11px] uppercase tracking-[0.2em] text-white/30 font-semibold mb-1">Test Configuration</p>
                        <h3 className="text-lg font-semibold text-white">Prompt Comparison</h3>
                    </div>
                </div>

                <div className="bg-white/[0.02] border border-white/5 rounded-lg p-4 flex flex-col gap-4">
                    <div className="flex items-center justify-between gap-3">
                        <div>
                            <p className="text-[11px] uppercase tracking-[0.18em] text-white/30 font-semibold">Dataset</p>
                            <p className="text-sm text-white/70">Choose examples to benchmark both prompts on.</p>
                        </div>
                        <div className="flex items-center gap-2">
                            {selectedDataset && (
                                <span className="px-3 py-1 rounded-full text-[11px] bg-white/[0.06] border border-white/10 text-white/70">
                                    {datasetSize} items
                                </span>
                            )}
                            <Button
                                onClick={() => setShowGenerator(true)}
                                variant="secondary"
                                size="xs"
                                className="px-3 py-1.5 text-[11px] font-medium"
                            >
                                Generate
                            </Button>
                        </div>
                    </div>
                    <select
                        value={selectedDataset}
                        onChange={(e) => setSelectedDataset(e.target.value)}
                        className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-3 text-sm text-white/90 focus:outline-none focus:border-white/20"
                    >
                        {datasets.map(d => (
                            <option key={d.id} value={d.id}>{d.name} ({d.size} items)</option>
                        ))}
                        {datasets.length === 0 && <option value="">No datasets available</option>}
                    </select>
                </div>

                <div className="space-y-3">
                    <p className="text-[11px] uppercase tracking-[0.16em] text-white/30 font-semibold">Prompt Variants</p>
                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                        {prompts.map((p, idx) => (
                            <div key={idx} className="relative bg-black/50 border border-white/10 rounded-xl p-4 flex flex-col gap-3 shadow-inner shadow-black/30">
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <p className="text-[11px] uppercase tracking-[0.16em] text-white/30 font-semibold">
                                            Variant {variantLabel(idx)}
                                        </p>
                                        <h4 className="text-sm font-semibold text-white">
                                            {idx === 0 ? 'Baseline' : `Variant ${variantLabel(idx)}`}
                                        </h4>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            onClick={() => handleOpenSelector(idx)}
                                            variant="secondary"
                                            size="xs"
                                            className="inline-flex items-center gap-1 text-[11px]"
                                        >
                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                                            Library
                                        </Button>
                                        {prompts.length > 2 && (
                                            <Button
                                                onClick={() => removePrompt(idx)}
                                                variant="ghost"
                                                size="icon"
                                                className="text-white/40 hover:text-red-400 transition-colors"
                                                title="Remove variant"
                                            >
                                                ✕
                                            </Button>
                                        )}
                                    </div>
                                </div>

                                <textarea
                                    value={p}
                                    onChange={(e) => updatePrompt(idx, e.target.value)}
                                    placeholder="Prompt variant..."
                                    className="w-full min-h-[160px] bg-black/60 border border-white/10 rounded-lg px-3 py-3 text-sm text-white/90 font-mono resize-none focus:outline-none focus:border-white/20"
                                />
                            </div>
                        ))}

                        <Button
                            onClick={addPrompt}
                            variant="outline"
                            size="md"
                            fullWidth
                            className="border-2 border-dashed border-white/10 rounded-xl h-full min-h-[180px] flex flex-col items-center justify-center gap-2 text-white/70 hover:border-white/20 hover:text-white transition-colors"
                        >
                            <span className="text-lg">+ Add Variant to Compare</span>
                            <p className="text-xs text-white/50">Add another candidate prompt for side-by-side.</p>
                        </Button>
                    </div>
                </div>
            </div>

            {results && (
                <div className="bg-black/30 p-4 rounded-lg border border-white/10 space-y-4">
                    <h3 className="text-sm font-medium text-white/90">Comparison Results</h3>

                    <div className="space-y-3">
                        {results.prompts.map((prompt: any, idx: number) => (
                            <div key={idx} className="bg-white/[0.02] p-3 rounded-lg border border-white/5">
                                <div className="flex justify-between items-start mb-2">
                                    <span className="text-sm font-medium text-white/80">Prompt #{idx + 1}</span>
                                    <span className="text-sm font-mono text-white/70">{prompt.score.toFixed(3)}</span>
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

            <div className="sticky bottom-0 z-10">
                    <div className="flex items-center justify-between gap-4 bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 shadow-lg shadow-black/30 backdrop-blur">
                        <div className="flex items-center gap-3 text-xs text-white/60 flex-wrap">
                            <div className="px-2 py-1 rounded-lg bg-white/[0.02] border border-white/5">
                                Dataset: {datasetName}
                            </div>
                            <div className="px-2 py-1 rounded-lg bg-white/[0.02] border border-white/5">
                                Variants: {prompts.length}
                            </div>
                        </div>
                    <Button
                        onClick={runComparison}
                        disabled={loading}
                        variant="primary"
                        size="md"
                        className={loading ? 'opacity-60 cursor-not-allowed' : ''}
                    >
                        {loading ? (
                            <>
                                <span className="w-2 h-2 rounded-full bg-white/80 animate-ping" />
                                Running...
                            </>
                        ) : (
                            <>
                                Run Comparison
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" /></svg>
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
}
