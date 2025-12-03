import { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { PromptSelector } from './PromptSelector';
import { DatasetSelector } from './DatasetSelector';
import { Button } from '../ui/Button';

interface QualityTabProps {
    settings: {
        provider: string;
        model: string;
        apiKey?: string;
    };
    datasets: any[];
    onModeChange?: (mode: QualityMode) => void;
    onDatasetCreated?: () => void;
    onResultsChange?: (results: any | null) => void;
}

export type QualityMode = 'reference' | 'judge';

const variantLabel = (index: number) => String.fromCharCode(65 + index);

export function QualityTab({ settings, datasets, onModeChange, onResultsChange }: QualityTabProps) {
    const [mode, setMode] = useState<QualityMode>('reference');
    const [selectedDataset, setSelectedDataset] = useState<string>('');
    const [prompts, setPrompts] = useState<string[]>(['']);
    const [variantModels, setVariantModels] = useState<string[]>(['']);
    const [judgePrompt, setJudgePrompt] = useState('');
    const [judgeResponse, setJudgeResponse] = useState('');
    const [results, setResults] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [logs, setLogs] = useState<string[]>([]);

    // Selector state
    const [showSelector, setShowSelector] = useState(false);
    const [showDatasetSelector, setShowDatasetSelector] = useState(false);
    const [selectorTarget, setSelectorTarget] = useState<'prompt' | 'judge' | 'response'>('prompt');
    const [selectorIndex, setSelectorIndex] = useState(0);

    const selectedDatasetMeta = datasets.find(d => d.id === selectedDataset);

    // Don't auto-select dataset - let user choose

    useEffect(() => {
        if (variantModels.length !== prompts.length) {
            setVariantModels(prev =>
                prompts.map((_, idx) => prev[idx] ?? settings.model ?? '')
            );
        }
    }, [prompts, variantModels.length, settings.model]);

    useEffect(() => {
        if (onModeChange) {
            onModeChange(mode);
        }
        setResults(null);
        onResultsChange?.(null);
    }, [mode, onModeChange, onResultsChange]);

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

    const handleOpenSelector = (target: 'prompt' | 'judge' | 'response', index: number = 0) => {
        setSelectorTarget(target);
        setSelectorIndex(index);
        setShowSelector(true);
    };

    const handleSelectPrompt = (text: string) => {
        if (selectorTarget === 'prompt') {
            updatePrompt(selectorIndex, text);
        } else if (selectorTarget === 'judge') {
            setJudgePrompt(text);
        } else if (selectorTarget === 'response') {
            setJudgeResponse(text);
        }
        setShowSelector(false);
    };

    const runTest = async () => {
        if (mode === 'reference') {
            await runReferenceTest();
        } else {
            await runJudgeTest();
        }
    };

    const runReferenceTest = async () => {
        const dataset = datasets.find(d => d.id === selectedDataset);
        const validPrompts = prompts.filter(p => p.trim());

        if (validPrompts.length === 0) {
            alert('Add at least one prompt');
            return;
        }
        if (!selectedDataset || !dataset?.data) {
            alert('Select a dataset with data');
            return;
        }

        setLoading(true);
        setLogs(['Starting Reference-Based Evaluation...']);

        try {
            const effectiveModel = settings.model;
            setLogs(prev => [...prev, `Testing ${validPrompts.length} prompts on ${dataset.data.length} examples...`]);

            const evalRes = await api.runOfflineEvaluation({
                dataset: dataset.data,
                prompts: validPrompts,
                provider: settings.provider,
                model: effectiveModel
            });

            const processedResults = {
                mode: 'reference',
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
            onResultsChange?.(processedResults);
            setLogs(prev => [...prev, '✓ Evaluation complete']);
        } catch (error) {
            console.error(error);
            setLogs(prev => [...prev, `✗ Error: ${String(error)}`]);
        } finally {
            setLoading(false);
        }
    };

    const hasReferenceInputs = mode === 'reference'
        && !!selectedDatasetMeta?.data
        && prompts.some(p => p.trim());

    const hasJudgeInputs = mode === 'judge'
        && judgePrompt.trim().length > 0
        && judgeResponse.trim().length > 0;

    const canRun = mode === 'reference' ? hasReferenceInputs : hasJudgeInputs;
    const isRunDisabled = loading || !canRun;

    const runJudgeTest = async () => {
        if (!judgePrompt.trim() || !judgeResponse.trim()) {
            alert('Add both prompt and response to evaluate');
            return;
        }

        setLoading(true);
        setLogs(['Starting LLM-as-Judge Evaluation...']);

        try {
            const res = await api.runLLMJudge({
                prompt: judgePrompt,
                response: judgeResponse,
                criteria: 'general',
                provider: settings.provider,
                model: settings.model
            });

            const judgeResults = {
                mode: 'judge',
                ...res
            };
            setResults(judgeResults);
            onResultsChange?.(judgeResults);
            setLogs(prev => [...prev, '✓ Judge evaluation complete']);
        } catch (error) {
            console.error(error);
            setLogs(prev => [...prev, `✗ Error: ${String(error)}`]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Mode Selector */}
            <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                    <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Evaluation Method</span>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setMode('reference')}
                        className={`flex-1 px-4 py-2.5 rounded-lg text-xs font-medium transition-all ${
                            mode === 'reference'
                                ? 'bg-white/10 text-white border border-white/20'
                                : 'bg-white/[0.02] text-white/50 border border-white/5 hover:bg-white/5'
                        }`}
                    >
                        <div className="flex items-center justify-center">
                            Reference-Based
                        </div>
                    </button>
                    <button
                        onClick={() => setMode('judge')}
                        className={`flex-1 px-4 py-2.5 rounded-lg text-xs font-medium transition-all ${
                            mode === 'judge'
                                ? 'bg-white/10 text-white border border-white/20'
                                : 'bg-white/[0.02] text-white/50 border border-white/5 hover:bg-white/5'
                        }`}
                    >
                        <div className="flex items-center justify-center">
                            LLM-as-Judge
                        </div>
                    </button>
                </div>
            </div>

            {/* Reference-Based Mode */}
            {mode === 'reference' && (
                <>
                    {/* Description */}
                    <div className="text-[11px] text-white/50 bg-white/[0.02] border border-white/5 rounded-lg px-3 py-2">
                        Compare model outputs against ground truth labels using BLEU, ROUGE, and Exact Match.
                    </div>

                    {/* Dataset Selection */}
                    <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Dataset</span>
                            <Button
                                onClick={() => setShowDatasetSelector(true)}
                                variant="secondary"
                                size="xs"
                                className="text-[10px] px-2 py-0 h-6 text-white/50"
                            >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                                </svg>
                                Dataset
                            </Button>
                        </div>
                        <textarea
                            readOnly
                            onClick={() => setShowDatasetSelector(true)}
                            value={selectedDatasetMeta?.data ? JSON.stringify(selectedDatasetMeta.data.slice(0, 3), null, 2) : ''}
                            placeholder="Select a dataset to import..."
                            className="w-full bg-black/30 border border-white/5 rounded-xl px-4 py-3 text-sm text-white/90 focus:outline-none focus:border-white/15 hover:border-white/15 cursor-pointer min-h-[80px] resize-none placeholder-white/30 font-mono text-xs"
                        />
                    </div>

                    {/* Prompt Variants */}
                    <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Prompt Variants</span>
                            <button
                                onClick={addPrompt}
                                className="w-5 h-5 flex items-center justify-center rounded bg-white/5 border border-white/10 text-white/40 hover:text-white/70 hover:bg-white/10"
                            >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                            </button>
                        </div>
                        <div className="space-y-3">
                            {prompts.map((p, idx) => (
                                <div key={idx} className="relative">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-medium text-white/50">Variant {variantLabel(idx)}</span>
                                            {prompts.length > 1 && (
                                                <button
                                                    onClick={() => removePrompt(idx)}
                                                    className="text-white/30 hover:text-red-400 text-[10px]"
                                                >
                                                    Remove
                                                </button>
                                            )}
                                        </div>
                                        <Button
                                            onClick={() => handleOpenSelector('prompt', idx)}
                                            variant="secondary"
                                            size="xs"
                                            className="text-[10px] px-2 py-0 h-6 text-white/50"
                                        >
                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" /></svg>
                                            Library
                                        </Button>
                                    </div>
                                    <textarea
                                        value={p}
                                        onChange={e => updatePrompt(idx, e.target.value)}
                                        placeholder="Enter prompt template..."
                                        className="w-full bg-black/30 border border-white/5 rounded-xl px-4 py-3 text-sm text-white/90 focus:outline-none focus:border-white/15 hover:border-white/15 placeholder-white/30 min-h-[80px] resize-none"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                </>
            )}

            {/* LLM-as-Judge Mode */}
            {mode === 'judge' && (
                <>
                    {/* Description */}
                    <div className="text-[11px] text-white/50 bg-white/[0.02] border border-white/5 rounded-lg px-3 py-2">
                        Use an LLM to evaluate outputs on relevance, coherence, and accuracy. No ground truth needed — ideal for creative and open-ended tasks.
                    </div>

                    <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Prompt</span>
                            <Button
                                onClick={() => handleOpenSelector('judge')}
                                variant="secondary"
                                size="xs"
                                className="text-[10px] px-2 py-0 h-6 text-white/50"
                            >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" /></svg>
                                Library
                            </Button>
                        </div>
                        <textarea
                            value={judgePrompt}
                            onChange={e => setJudgePrompt(e.target.value)}
                            placeholder="The prompt that was used..."
                            className="w-full bg-black/30 border border-white/5 rounded-xl px-4 py-3 text-sm text-white/90 focus:outline-none focus:border-white/15 hover:border-white/15 placeholder-white/30 min-h-[80px] resize-none"
                        />
                    </div>

                    <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Response to Evaluate</span>
                        </div>
                        <textarea
                            value={judgeResponse}
                            onChange={e => setJudgeResponse(e.target.value)}
                            placeholder="Paste the model response to evaluate..."
                            className="w-full bg-black/30 border border-white/5 rounded-xl px-4 py-3 text-sm text-white/90 focus:outline-none focus:border-white/15 hover:border-white/15 placeholder-white/30 min-h-[120px] resize-none"
                        />
                    </div>
                </>
            )}

            {/* Run Button */}
            <div className="flex items-center gap-2">
                <Button
                    onClick={runTest}
                    disabled={isRunDisabled}
                    variant="primary"
                    size="sm"
                    className={`min-w-[140px] ${isRunDisabled ? 'opacity-60 cursor-not-allowed' : ''}`}
                >
                    {loading ? 'Evaluating...' : 'Run Evaluation'}
                </Button>
            </div>

            {/* Results */}
            {results && (
                <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-4">
                        <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Results</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                            results.mode === 'reference' ? 'bg-blue-500/20 text-blue-400' : 'bg-purple-500/20 text-purple-400'
                        }`}>
                            {results.mode === 'reference' ? 'Reference-Based' : 'LLM-as-Judge'}
                        </span>
                    </div>

                    {results.mode === 'reference' && (
                        <div className="space-y-4">
                            {/* Metrics Summary */}
                            <div className="grid grid-cols-3 gap-3">
                                <div className="bg-white/5 rounded-lg p-3 text-center">
                                    <div className="text-lg font-semibold text-white">
                                        {(results.metrics?.bleu ?? results.summary?.bleu ?? 0).toFixed(3)}
                                    </div>
                                    <div className="text-[10px] text-white/50 uppercase">BLEU</div>
                                </div>
                                <div className="bg-white/5 rounded-lg p-3 text-center">
                                    <div className="text-lg font-semibold text-white">
                                        {(results.metrics?.rouge_l ?? results.summary?.rouge_l ?? 0).toFixed(3)}
                                    </div>
                                    <div className="text-[10px] text-white/50 uppercase">ROUGE-L</div>
                                </div>
                                <div className="bg-white/5 rounded-lg p-3 text-center">
                                    <div className="text-lg font-semibold text-white">
                                        {((results.metrics?.exact_match ?? results.summary?.exact_match ?? 0) * 100).toFixed(1)}%
                                    </div>
                                    <div className="text-[10px] text-white/50 uppercase">Exact Match</div>
                                </div>
                            </div>

                            {/* Aggregates */}
                            {results.aggregates && (
                                <div className="bg-white/[0.03] rounded-lg p-3">
                                    <div className="text-[10px] font-bold text-white/30 uppercase mb-2">Distribution</div>
                                    <div className="grid grid-cols-3 gap-2 text-xs">
                                        <div>
                                            <span className="text-white/50">Median:</span>
                                            <span className="text-white/80 ml-1">{results.aggregates.median?.toFixed(3) || 'N/A'}</span>
                                        </div>
                                        <div>
                                            <span className="text-white/50">Q5-Q95:</span>
                                            <span className="text-white/80 ml-1">
                                                {results.aggregates.quantiles?.q5?.toFixed(2) || '0'} - {results.aggregates.quantiles?.q95?.toFixed(2) || '0'}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-white/50">Worst 10%:</span>
                                            <span className="text-white/80 ml-1">{results.aggregates.worst_k_percent?.toFixed(3) || 'N/A'}</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {results.mode === 'judge' && (
                        <div className="space-y-4">
                            {/* Score */}
                            <div className="flex items-center gap-4">
                                <div className="bg-white/5 rounded-lg p-4 text-center flex-shrink-0">
                                    <div className="text-2xl font-bold text-white">
                                        {(results.score ?? 0).toFixed(2)}
                                    </div>
                                    <div className="text-[10px] text-white/50 uppercase">Quality Score</div>
                                </div>
                                <div className="flex-1">
                                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500"
                                            style={{ width: `${(results.score ?? 0) * 100}%` }}
                                        />
                                    </div>
                                    <div className="flex justify-between text-[10px] text-white/40 mt-1">
                                        <span>Poor</span>
                                        <span>Excellent</span>
                                    </div>
                                </div>
                            </div>

                            {/* Confidence */}
                            {results.confidence !== undefined && (
                                <div className="bg-white/[0.03] rounded-lg p-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs text-white/50">Confidence</span>
                                        <span className="text-xs text-white/80">{(results.confidence * 100).toFixed(0)}%</span>
                                    </div>
                                </div>
                            )}

                            {/* Reasoning */}
                            {results.reasoning && (
                                <div className="bg-white/[0.03] rounded-lg p-3">
                                    <div className="text-[10px] font-bold text-white/30 uppercase mb-2">Reasoning</div>
                                    <p className="text-xs text-white/70 leading-relaxed">{results.reasoning}</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Logs */}
            {logs.length > 0 && (
                <div className="bg-black/20 rounded-lg p-3 font-mono text-[10px] text-white/50 max-h-32 overflow-y-auto">
                    {logs.map((log, i) => (
                        <div key={i}>{log}</div>
                    ))}
                </div>
            )}

            {/* Prompt Selector Modal */}
            {showSelector && (
                <PromptSelector
                    onSelect={handleSelectPrompt}
                    onClose={() => setShowSelector(false)}
                />
            )}

            {/* Dataset Selector Modal */}
            {showDatasetSelector && (
                <DatasetSelector
                    datasets={datasets}
                    onSelect={(dataset) => { setSelectedDataset(dataset.id); setShowDatasetSelector(false); }}
                    onClose={() => setShowDatasetSelector(false)}
                />
            )}
        </div>
    );
}
