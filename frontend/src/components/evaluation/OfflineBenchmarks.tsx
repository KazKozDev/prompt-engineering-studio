import { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { PromptSelector } from './PromptSelector';
import { DatasetGenerator } from '../DatasetGenerator';
import { Button } from '../ui/Button';

interface OfflineBenchmarksProps {
    settings: {
        provider: string;
        model: string;
        apiKey?: string;
    };
    datasets: any[];
    onOpenGuide?: () => void;
    onDatasetCreated?: () => void;
}

const variantLabel = (index: number) => String.fromCharCode(65 + index);

export function OfflineBenchmarks({ settings, datasets, onDatasetCreated }: OfflineBenchmarksProps) {
    const [selectedDataset, setSelectedDataset] = useState<string>('');
    const [prompts, setPrompts] = useState<string[]>(['']);
    const [variantModels, setVariantModels] = useState<string[]>(['']);
    const [results, setResults] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [showGenerator, setShowGenerator] = useState(false);
    const [logs, setLogs] = useState<string[]>([]);

    // Selector state
    const [showSelector, setShowSelector] = useState(false);
    const [selectorTargetIndex, setSelectorTargetIndex] = useState<number>(0);

    useEffect(() => {
        if (datasets.length > 0 && !selectedDataset) {
            setSelectedDataset(datasets[0].id);
        }
    }, [datasets]);

    useEffect(() => {
        // Keep model selectors aligned with prompts
        if (variantModels.length !== prompts.length) {
            setVariantModels(prev =>
                prompts.map((_, idx) => prev[idx] ?? settings.model ?? '')
            );
        }
    }, [prompts, variantModels.length, settings.model]);

    const addPrompt = () => {
        setPrompts([...prompts, '']);
        setVariantModels([...variantModels, settings.model ?? variantModels[variantModels.length - 1] ?? '']);
    };

    const removePrompt = (idx: number) => {
        setPrompts(prompts.filter((_, i) => i !== idx));
        setVariantModels(variantModels.filter((_, i) => i !== idx));
    };

    const updatePrompt = (idx: number, val: string) => {
        const newPrompts = [...prompts];
        newPrompts[idx] = val;
        setPrompts(newPrompts);
    };

    const updateVariantModel = (idx: number, model: string) => {
        setVariantModels(models => models.map((m, i) => (i === idx ? model : m)));
    };

    const handleOpenSelector = (index: number) => {
        setSelectorTargetIndex(index);
        setShowSelector(true);
    };

    const handleSelectPrompt = (text: string) => {
        updatePrompt(selectorTargetIndex, text);
        setShowSelector(false);
    };

    const selectedDatasetMeta = datasets.find(d => d.id === selectedDataset);
    const datasetSize = selectedDatasetMeta?.size ?? selectedDatasetMeta?.data?.length ?? 0;
    const datasetName = selectedDatasetMeta?.name || 'Not set';

    const runTest = async () => {
        const dataset = datasets.find(d => d.id === selectedDataset);

        const validPrompts = prompts.filter(p => p.trim());
        if (validPrompts.length === 0) {
            alert('Add at least one prompt');
            return;
        }
        if (!selectedDataset) {
            alert('Select a dataset');
            return;
        }
        if (!dataset?.data) {
            alert('Selected dataset has no data');
            return;
        }

        setLoading(true);
        setLogs(['Starting Offline Benchmark...']);

        try {
            const normalizedModels = variantModels.length
                ? variantModels.map(m => m || settings.model).filter(Boolean)
                : [settings.model];
            const uniqueModels = Array.from(new Set(normalizedModels));
            const effectiveModel = uniqueModels[0] || settings.model;

            if (uniqueModels.length > 1) {
                setLogs(prev => [
                    ...prev,
                    `Multiple models selected (${uniqueModels.join(', ')}); offline runner will use ${effectiveModel} for this batch.`,
                ]);
            }

            setLogs(prev => [...prev, `Testing ${validPrompts.length} prompts on ${dataset.data.length} examples...`]);
            setLogs(prev => [...prev, `Provider: ${settings.provider || 'default'}, Model: ${effectiveModel}`]);

            const evalRes = await api.runOfflineEvaluation({
                dataset: dataset.data,
                prompts: validPrompts,
                provider: settings.provider,
                model: effectiveModel
            });

            // Process multi-prompt results with aggregates
            const processedResults = {
                prompts: evalRes.prompts || [],
                metrics: evalRes.metrics || {},
                aggregates: {
                    median: evalRes.median || 0,
                    quantiles: evalRes.quantiles || { q5: 0, q95: 0 },
                    worst_k_percent: evalRes.worst_k_percent || 0
                },
                distribution: evalRes.distribution || [],
                summary: evalRes.summary || {}
            };

            setResults(processedResults);
            setLogs(prev => [...prev, '✓ Benchmark complete']);
        } catch (error) {
            console.error(error);
            setLogs(prev => [...prev, `✗ Error: ${String(error)}`]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
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
                            context="benchmark"
                            title="Generate Benchmark Dataset"
                            description="Create test cases with expected outputs to measure prompt accuracy"
                            initialPrompt={prompts[0] || ''}
                            onGenerated={async (data, name) => {
                                try {
                                    const result = await api.createDataset({
                                        name: name || `Benchmark Dataset ${new Date().toLocaleDateString()}`,
                                        description: 'Generated for offline benchmarks',
                                        category: 'benchmark',
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

            <div className="bg-black/25 p-5 rounded-xl border border-white/5 shadow-lg shadow-black/30">
                <div className="flex items-center gap-3 mb-4">
                    <div>
                        <p className="text-[11px] uppercase tracking-[0.2em] text-white/30 font-semibold mb-1">Test Configuration</p>
                        <h3 className="text-lg font-semibold text-white">Offline Benchmarks</h3>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-white/[0.02] border border-white/5 rounded-lg p-4">
                        <div className="flex items-center justify-between gap-3 mb-3">
                            <div>
                                <p className="text-[11px] uppercase tracking-[0.18em] text-white/30 font-semibold">Dataset</p>
                                <p className="text-sm text-white/70">Pick a labeled set to benchmark against ground truth.</p>
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
                            {datasets.map(d => {
                                const sizeLabel = typeof d.size === 'number' ? `${d.size} items` : '';
                                return (
                                    <option key={d.id} value={d.id}>
                                        {d.name} {sizeLabel ? `(${sizeLabel})` : ''}
                                    </option>
                                );
                            })}
                        </select>
                    </div>

                    <div className="bg-white/[0.02] border border-white/5 rounded-lg p-4">
                        <div className="flex items-center justify-between gap-3 mb-3">
                            <div>
                                <p className="text-[11px] uppercase tracking-[0.18em] text-white/30 font-semibold">Prompt Variants</p>
                                <p className="text-sm text-white/70">Set up a baseline and challengers side by side.</p>
                            </div>
                            <Button
                                onClick={addPrompt}
                                variant="outline"
                                size="xs"
                                className="inline-flex items-center gap-2 text-xs px-3 py-2 border-dashed border-white/15 text-white/70 hover:text-white hover:border-white/40 transition-colors"
                            >
                                <span className="text-white/60 text-base leading-none">+</span>
                                Add Variant
                            </Button>
                        </div>

                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                            {prompts.map((p, idx) => (
                                <div key={idx} className="relative bg-black/50 border border-white/10 rounded-xl p-4 flex flex-col gap-3 shadow-inner shadow-black/30">
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <p className="text-[11px] uppercase tracking-[0.16em] text-white/30 font-semibold">
                                                Variant {variantLabel(idx)}
                                            </p>
                                            <h4 className="text-sm font-semibold text-white">
                                                {idx === 0 ? 'Baseline Prompt' : 'Challenger Prompt'}
                                            </h4>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                onClick={() => handleOpenSelector(idx)}
                                                variant="secondary"
                                                size="xs"
                                                className="inline-flex items-center gap-1 text-[11px] px-2 py-0 h-6 text-white/50"
                                            >
                                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                                                Library
                                            </Button>
                                            {prompts.length > 1 && (
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
                                        placeholder={idx === 0 ? 'Baseline system prompt...' : 'Compare against your baseline...'}
                                        className="w-full min-h-[160px] bg-black/60 border border-white/10 rounded-lg px-3 py-3 text-sm text-white/90 font-mono resize-none focus:outline-none focus:border-white/20"
                                    />

                                    <div className="flex flex-wrap items-center gap-3">
                                        <div className="flex flex-col flex-1 min-w-[140px]">
                                            <span className="text-[11px] text-white/40 mb-1">Model (per variant)</span>
                                            <input
                                                value={variantModels[idx] || ''}
                                                onChange={(e) => updateVariantModel(idx, e.target.value)}
                                                placeholder={settings.model || 'Enter model id'}
                                                className="bg-black/60 border border-white/10 rounded-lg px-3 py-2 text-xs text-white/80 focus:outline-none focus:border-white/20 font-mono"
                                            />
                                        </div>
                                        <div className="text-[11px] text-white/40">
                                            Keep models aligned for apples-to-apples; mixed models will run on the primary selection.
                                        </div>
                                    </div>
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
                                <p className="text-xs text-white/50">Drop in another prompt to visualize the head-to-head run.</p>
                            </Button>
                        </div>
                    </div>

                    <div className="sticky bottom-0 left-0 right-0">
                        <div className="flex items-center justify-between gap-4 bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 shadow-lg shadow-black/30 backdrop-blur">
                            <div className="flex items-center gap-3 text-xs text-white/60">
                                <div className="flex items-center gap-2 px-2 py-1 rounded-lg bg-white/[0.02] border border-white/5">
                                    <span className="w-2 h-2 rounded-full bg-white/60" />
                                    <span>Estimated: ~{Math.max(1, Math.ceil(((datasetSize || 10) * Math.max(prompts.length, 1)) / 40))} mins</span>
                                </div>
                                <div className="px-2 py-1 rounded-lg bg-white/[0.02] border border-white/5">
                                    Variants: {prompts.length}
                                </div>
                                <div className="px-2 py-1 rounded-lg bg-white/[0.02] border border-white/5">
                                    Dataset: {datasetName}
                                </div>
                            </div>
                            <Button
                                onClick={runTest}
                                disabled={loading}
                                variant="primary"
                                size="md"
                                className={loading ? 'opacity-60 cursor-not-allowed' : ''}
                            >
                                {loading ? (
                                    <>
                                        <span className="w-2 h-2 rounded-full bg-white/80 animate-ping" />
                                        Running Benchmark...
                                    </>
                                ) : (
                                    <>
                                        Run Benchmark
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" /></svg>
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Results Display */}
            {results && (
                <div className="bg-black/20 p-4 rounded-lg border border-white/5">
                    <h3 className="text-sm font-medium text-white/90 mb-4">Multi-Prompt Evaluation Results</h3>

                    {/* Aggregate Metrics */}
                    <div className="mb-6">
                        <h4 className="text-xs font-medium text-white/70 mb-3">Aggregate Metrics</h4>
                        <div className="grid grid-cols-4 gap-4">
                            <div className="bg-white/[0.03] border border-white/5 p-3 rounded-lg">
                                <div className="text-[10px] text-white/40">Median Score</div>
                                <div className="text-lg font-mono text-white/70">{results.aggregates.median.toFixed(3)}</div>
                            </div>
                            <div className="bg-white/[0.03] border border-white/5 p-3 rounded-lg">
                                <div className="text-[10px] text-white/40">5th Percentile</div>
                                <div className="text-lg font-mono text-amber-400">{results.aggregates.quantiles.q5.toFixed(3)}</div>
                            </div>
                            <div className="bg-white/[0.03] border border-white/5 p-3 rounded-lg">
                                <div className="text-[10px] text-white/40">95th Percentile</div>
                                <div className="text-lg font-mono text-white/70">{results.aggregates.quantiles.q95.toFixed(3)}</div>
                            </div>
                            <div className="bg-white/[0.03] border border-white/5 p-3 rounded-lg">
                                <div className="text-[10px] text-white/40">Worst 10%</div>
                                <div className="text-lg font-mono text-red-400">{results.aggregates.worst_k_percent.toFixed(3)}</div>
                            </div>
                        </div>
                    </div>

                    {/* Individual Prompt Results */}
                    <div className="mb-6">
                        <h4 className="text-xs font-medium text-white/70 mb-3">Individual Prompt Performance</h4>
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
                                    <div className="grid grid-cols-3 gap-2 mt-2 text-xs">
                                        <div><span className="text-white/30">BLEU:</span> <span className="text-white/70">{prompt.metrics?.bleu?.toFixed(3) || 'N/A'}</span></div>
                                        <div><span className="text-white/30">ROUGE:</span> <span className="text-white/70">{prompt.metrics?.rouge?.toFixed(3) || 'N/A'}</span></div>
                                        <div><span className="text-white/30">Exact Match:</span> <span className="text-white/70">{prompt.metrics?.exact_match?.toFixed(3) || 'N/A'}</span></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Distribution Chart Placeholder */}
                    <div className="mb-6">
                        <h4 className="text-xs font-medium text-white/70 mb-3">Score Distribution</h4>
                        <div className="bg-white/[0.02] p-4 rounded-lg border border-white/5">
                            <div className="text-center text-white/40 text-sm">
                                📊 Distribution chart will be rendered here
                            </div>
                            <div className="mt-2 text-xs text-white/30">
                                Range: {Math.min(...(results.distribution || [])).toFixed(3)} - {Math.max(...(results.distribution || [])).toFixed(3)}
                            </div>
                        </div>
                    </div>

                    {/* Detailed JSON */}
                    <details className="text-xs">
                        <summary className="cursor-pointer text-white/40 hover:text-white/60">View Raw JSON</summary>
                        <pre className="mt-2 text-white/30 overflow-auto max-h-64">
                            {JSON.stringify(results, null, 2)}
                        </pre>
                    </details>
                </div>
            )}

            {logs.length > 0 && (
                <div className="bg-black/30 p-3 rounded-lg border border-white/5 font-mono text-xs text-white/70">
                    {logs.map((l, i) => <div key={i}>{l}</div>)}
                </div>
            )}
        </div>
    );
}
