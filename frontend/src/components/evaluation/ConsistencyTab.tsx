import { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { PromptSelector } from './PromptSelector';
import { Button } from '../ui/Button';

interface ConsistencyTabProps {
    settings: {
        provider: string;
        model: string;
        apiKey?: string;
    };
    onModeChange?: (mode: ConsistencyMode) => void;
}

export type ConsistencyMode = 'self' | 'mutual';

const variantLabel = (index: number) => String.fromCharCode(65 + index);

export function ConsistencyTab({ settings, onModeChange }: ConsistencyTabProps) {
    const [mode, setMode] = useState<ConsistencyMode>('self');
    const [prompt, setPrompt] = useState('');
    const [prompts, setPrompts] = useState<string[]>(['', '']);
    const [nSamples, setNSamples] = useState(5);
    const [results, setResults] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    // Selector state
    const [showSelector, setShowSelector] = useState(false);
    const [selectorTarget, setSelectorTarget] = useState<'single' | 'multi'>('single');
    const [selectorIndex, setSelectorIndex] = useState(0);

    useEffect(() => {
        if (onModeChange) {
            onModeChange(mode);
        }
        setResults(null);
    }, [mode, onModeChange]);

    const addPrompt = () => setPrompts([...prompts, '']);
    const removePrompt = (idx: number) => setPrompts(prompts.filter((_, i) => i !== idx));
    const updatePrompt = (idx: number, val: string) => {
        const newPrompts = [...prompts];
        newPrompts[idx] = val;
        setPrompts(newPrompts);
    };

    const handleOpenSelector = (target: 'single' | 'multi', index: number = 0) => {
        setSelectorTarget(target);
        setSelectorIndex(index);
        setShowSelector(true);
    };

    const handleSelectPrompt = (text: string) => {
        if (selectorTarget === 'single') {
            setPrompt(text);
        } else {
            updatePrompt(selectorIndex, text);
        }
        setShowSelector(false);
    };

    const runTest = async () => {
        if (mode === 'self') {
            await runSelfConsistency();
        } else {
            await runMutualConsistency();
        }
    };

    const runSelfConsistency = async () => {
        if (!prompt.trim()) {
            alert('Add a prompt to evaluate');
            return;
        }

        setLoading(true);
        try {
            const res = await api.runConsistencyCheck({
                prompt,
                n_samples: nSamples,
                provider: settings.provider,
                model: settings.model
            });

            setResults({
                mode: 'self',
                ...res
            });
        } catch (error) {
            console.error(error);
            alert('Error running consistency check');
        } finally {
            setLoading(false);
        }
    };

    const runMutualConsistency = async () => {
        const validPrompts = prompts.filter(p => p.trim());
        if (validPrompts.length < 2) {
            alert('Add at least 2 prompts for mutual consistency');
            return;
        }

        setLoading(true);
        try {
            const res = await api.runMutualConsistency({
                prompts: validPrompts,
                provider: settings.provider,
                model: settings.model
            });

            setResults({
                mode: 'mutual',
                ...res
            });
        } catch (error) {
            console.error(error);
            alert('Error running mutual consistency');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Mode Selector */}
            <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                    <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Consistency Type</span>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setMode('self')}
                        className={`flex-1 px-4 py-2.5 rounded-lg text-xs font-medium transition-all ${
                            mode === 'self'
                                ? 'bg-white/10 text-white border border-white/20'
                                : 'bg-white/[0.02] text-white/50 border border-white/5 hover:bg-white/5'
                        }`}
                    >
                        <div className="flex items-center justify-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            Self-Consistency
                        </div>
                        <div className="text-[10px] text-white/40 mt-1">Same prompt, N runs</div>
                    </button>
                    <button
                        onClick={() => setMode('mutual')}
                        className={`flex-1 px-4 py-2.5 rounded-lg text-xs font-medium transition-all ${
                            mode === 'mutual'
                                ? 'bg-white/10 text-white border border-white/20'
                                : 'bg-white/[0.02] text-white/50 border border-white/5 hover:bg-white/5'
                        }`}
                    >
                        <div className="flex items-center justify-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                            </svg>
                            Mutual-Consistency
                        </div>
                        <div className="text-[10px] text-white/40 mt-1">Compare prompt variants (GLaPE)</div>
                    </button>
                </div>
            </div>

            {/* Self-Consistency Mode */}
            {mode === 'self' && (
                <>
                    {/* Description */}
                    <div className="text-[11px] text-white/50 bg-white/[0.02] border border-white/5 rounded-lg px-3 py-2">
                        Run the same prompt multiple times to measure output stability. High variance = unreliable prompt. Use before production deployment.
                    </div>

                    <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Prompt</span>
                            <Button
                                onClick={() => handleOpenSelector('single')}
                                variant="secondary"
                                size="xs"
                                className="text-[10px] px-2 py-1 text-white/50"
                            >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" /></svg>
                                Library
                            </Button>
                        </div>
                        <textarea
                            value={prompt}
                            onChange={e => setPrompt(e.target.value)}
                            placeholder="Enter prompt to test for consistency..."
                            className="w-full bg-black/30 border border-white/5 rounded-xl px-4 py-3 text-sm text-white/90 focus:outline-none focus:border-white/15 hover:border-white/15 placeholder-white/30 min-h-[100px] resize-none"
                        />
                    </div>

                    <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Number of Samples</span>
                            <span className="text-xs text-white/60">{nSamples} runs</span>
                        </div>
                        <input
                            type="range"
                            min={3}
                            max={20}
                            value={nSamples}
                            onChange={e => setNSamples(Number(e.target.value))}
                            className="w-full mt-2 accent-white/50"
                        />
                        <div className="flex justify-between text-[10px] text-white/30 mt-1">
                            <span>3 (fast)</span>
                            <span>20 (accurate)</span>
                        </div>
                    </div>
                </>
            )}

            {/* Mutual-Consistency Mode */}
            {mode === 'mutual' && (
                <>
                {/* Description */}
                <div className="text-[11px] text-white/50 bg-white/[0.02] border border-white/5 rounded-lg px-3 py-2">
                    Compare multiple prompt variants on the same inputs (GLaPE method). Find which prompt produces more consistent results without ground truth labels.
                </div>

                <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Prompt Variants to Compare</span>
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
                                        {prompts.length > 2 && (
                                            <button
                                                onClick={() => removePrompt(idx)}
                                                className="text-white/30 hover:text-red-400 text-[10px]"
                                            >
                                                Remove
                                            </button>
                                        )}
                                    </div>
                                    <Button
                                        onClick={() => handleOpenSelector('multi', idx)}
                                        variant="secondary"
                                        size="xs"
                                        className="text-[10px] px-2 py-1 text-white/50"
                                    >
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" /></svg>
                                        Library
                                    </Button>
                                </div>
                                <textarea
                                    value={p}
                                    onChange={e => updatePrompt(idx, e.target.value)}
                                    placeholder={`Enter prompt variant ${variantLabel(idx)}...`}
                                    className="w-full bg-black/30 border border-white/5 rounded-xl px-4 py-3 text-sm text-white/90 focus:outline-none focus:border-white/15 hover:border-white/15 placeholder-white/30 min-h-[80px] resize-none"
                                />
                            </div>
                        ))}
                    </div>
                </div>
                </>
            )}

            {/* Run Button */}
            <div className="flex items-center gap-2">
                <Button
                    onClick={runTest}
                    disabled={loading}
                    variant="primary"
                    size="sm"
                    className={`min-w-[140px] ${loading ? 'opacity-60 cursor-not-allowed' : ''}`}
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
                            results.mode === 'self' ? 'bg-cyan-500/20 text-cyan-400' : 'bg-orange-500/20 text-orange-400'
                        }`}>
                            {results.mode === 'self' ? 'Self-Consistency' : 'Mutual-Consistency'}
                        </span>
                    </div>

                    {results.mode === 'self' && (
                        <div className="space-y-4">
                            {/* Main Score */}
                            <div className="flex items-center gap-4">
                                <div className="bg-white/5 rounded-lg p-4 text-center flex-shrink-0">
                                    <div className="text-2xl font-bold text-white">
                                        {((results.consistency_score ?? results.score ?? 0) * 100).toFixed(0)}%
                                    </div>
                                    <div className="text-[10px] text-white/50 uppercase">Consistency</div>
                                </div>
                                <div className="flex-1">
                                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full ${
                                                (results.consistency_score ?? results.score ?? 0) > 0.8
                                                    ? 'bg-green-500'
                                                    : (results.consistency_score ?? results.score ?? 0) > 0.5
                                                        ? 'bg-yellow-500'
                                                        : 'bg-red-500'
                                            }`}
                                            style={{ width: `${(results.consistency_score ?? results.score ?? 0) * 100}%` }}
                                        />
                                    </div>
                                    <div className="flex justify-between text-[10px] text-white/40 mt-1">
                                        <span>Unstable</span>
                                        <span>Highly Consistent</span>
                                    </div>
                                </div>
                            </div>

                            {/* Stats */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-white/[0.03] rounded-lg p-3">
                                    <div className="text-xs text-white/50">Samples</div>
                                    <div className="text-sm font-medium text-white/80">{results.n_samples || nSamples}</div>
                                </div>
                                <div className="bg-white/[0.03] rounded-lg p-3">
                                    <div className="text-xs text-white/50">Unique Answers</div>
                                    <div className="text-sm font-medium text-white/80">{results.unique_answers || 'N/A'}</div>
                                </div>
                            </div>

                            {/* Sample Responses */}
                            {results.responses && results.responses.length > 0 && (
                                <div className="bg-white/[0.03] rounded-lg p-3">
                                    <div className="text-[10px] font-bold text-white/30 uppercase mb-2">Sample Responses</div>
                                    <div className="space-y-2 max-h-40 overflow-y-auto">
                                        {results.responses.slice(0, 5).map((r: string, i: number) => (
                                            <div key={i} className="text-xs text-white/60 bg-white/[0.02] rounded p-2">
                                                {r.slice(0, 200)}{r.length > 200 ? '...' : ''}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {results.mode === 'mutual' && (
                        <div className="space-y-4">
                            {/* GLaPE Score */}
                            <div className="flex items-center gap-4">
                                <div className="bg-white/5 rounded-lg p-4 text-center flex-shrink-0">
                                    <div className="text-2xl font-bold text-white">
                                        {((results.glape_score ?? results.agreement_score ?? 0) * 100).toFixed(0)}%
                                    </div>
                                    <div className="text-[10px] text-white/50 uppercase">GLaPE Score</div>
                                </div>
                                <div className="flex-1">
                                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full ${
                                                (results.glape_score ?? results.agreement_score ?? 0) > 0.8
                                                    ? 'bg-green-500'
                                                    : (results.glape_score ?? results.agreement_score ?? 0) > 0.5
                                                        ? 'bg-yellow-500'
                                                        : 'bg-red-500'
                                            }`}
                                            style={{ width: `${(results.glape_score ?? results.agreement_score ?? 0) * 100}%` }}
                                        />
                                    </div>
                                    <div className="flex justify-between text-[10px] text-white/40 mt-1">
                                        <span>Low Agreement</span>
                                        <span>High Agreement</span>
                                    </div>
                                </div>
                            </div>

                            {/* Per-Prompt Scores */}
                            {results.prompt_scores && (
                                <div className="bg-white/[0.03] rounded-lg p-3">
                                    <div className="text-[10px] font-bold text-white/30 uppercase mb-2">Per-Variant Scores</div>
                                    <div className="space-y-2">
                                        {results.prompt_scores.map((score: number, i: number) => (
                                            <div key={i} className="flex items-center gap-2">
                                                <span className="text-xs text-white/50 w-16">Variant {variantLabel(i)}</span>
                                                <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-white/50"
                                                        style={{ width: `${score * 100}%` }}
                                                    />
                                                </div>
                                                <span className="text-xs text-white/60 w-12 text-right">{(score * 100).toFixed(0)}%</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Recommendation */}
                            {results.best_prompt_index !== undefined && (
                                <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
                                    <div className="flex items-center gap-2">
                                        <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <span className="text-xs text-green-400">
                                            Recommended: <span className="font-medium">Variant {variantLabel(results.best_prompt_index)}</span>
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Prompt Selector Modal */}
            {showSelector && (
                <PromptSelector
                    onSelect={handleSelectPrompt}
                    onClose={() => setShowSelector(false)}
                />
            )}
        </div>
    );
}
