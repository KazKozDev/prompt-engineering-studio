import { useState, useEffect } from 'react';
import { api } from '../../services/api';

interface OfflineBenchmarksProps {
    settings: any;
    datasets: any[];
}

export function OfflineBenchmarks({ settings, datasets }: OfflineBenchmarksProps) {
    const [selectedDataset, setSelectedDataset] = useState<string>('');
    const [prompts, setPrompts] = useState<string[]>(['']);
    const [results, setResults] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [logs, setLogs] = useState<string[]>([]);

    useEffect(() => {
        if (datasets.length > 0 && !selectedDataset) {
            setSelectedDataset(datasets[0].id);
        }
    }, [datasets]);

    const addPrompt = () => setPrompts([...prompts, '']);
    const removePrompt = (idx: number) => setPrompts(prompts.filter((_, i) => i !== idx));
    const updatePrompt = (idx: number, val: string) => {
        const newPrompts = [...prompts];
        newPrompts[idx] = val;
        setPrompts(newPrompts);
    };

    const runTest = async () => {
        const validPrompts = prompts.filter(p => p.trim());
        if (validPrompts.length === 0) {
            alert('Add at least one prompt');
            return;
        }
        if (!selectedDataset) {
            alert('Select a dataset');
            return;
        }

        setLoading(true);
        setLogs(['Starting Offline Benchmark...']);

        try {
            const dataset = datasets.find(d => d.id === selectedDataset);
            if (!dataset?.data) throw new Error('Dataset has no data');

            setLogs(prev => [...prev, `Testing ${validPrompts.length} prompts on ${dataset.data.length} examples...`]);

            const evalRes = await api.runOfflineEvaluation({
                dataset: dataset.data,
                prompts: validPrompts,
                provider: settings.provider,
                model: settings.model
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
            <div className="bg-black/20 p-4 rounded-lg border border-white/5">
                <h3 className="text-sm font-medium text-white/90 mb-4">Configuration</h3>

                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-medium text-white/40 mb-2">Dataset</label>
                        <select
                            value={selectedDataset}
                            onChange={(e) => setSelectedDataset(e.target.value)}
                            className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white/90 focus:outline-none focus:border-[#007AFF]/30"
                        >
                            {datasets.map(d => (
                                <option key={d.id} value={d.id}>{d.name} ({d.size} items)</option>
                            ))}
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
                                        <button onClick={() => removePrompt(idx)} className="text-red-400/70 hover:text-red-400 px-2">✕</button>
                                    )}
                                </div>
                            ))}
                        </div>
                        <button onClick={addPrompt} className="mt-2 text-xs text-[#007AFF] hover:text-[#0071E3] font-medium">+ Add Variant</button>
                    </div>

                    <button
                        onClick={runTest}
                        disabled={loading}
                        className="w-full py-2 bg-[#007AFF] hover:bg-[#0071E3] text-white rounded-lg font-medium disabled:opacity-50 transition-all"
                    >
                        {loading ? 'Running Benchmark...' : 'Run Benchmark'}
                    </button>
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
                                <div className="text-lg font-mono text-[#007AFF]">{results.aggregates.median.toFixed(3)}</div>
                            </div>
                            <div className="bg-white/[0.03] border border-white/5 p-3 rounded-lg">
                                <div className="text-[10px] text-white/40">5th Percentile</div>
                                <div className="text-lg font-mono text-amber-400">{results.aggregates.quantiles.q5.toFixed(3)}</div>
                            </div>
                            <div className="bg-white/[0.03] border border-white/5 p-3 rounded-lg">
                                <div className="text-[10px] text-white/40">95th Percentile</div>
                                <div className="text-lg font-mono text-emerald-400">{results.aggregates.quantiles.q95.toFixed(3)}</div>
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
                                        <span className="text-sm font-mono text-[#007AFF]">{prompt.score.toFixed(3)}</span>
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
                <div className="bg-black/30 p-3 rounded-lg border border-white/5 font-mono text-xs text-emerald-400">
                    {logs.map((l, i) => <div key={i}>{l}</div>)}
                </div>
            )}
        </div>
    );
}
