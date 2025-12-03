import { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { PromptSelector } from './PromptSelector';
import { Button } from '../ui/Button';

interface LabelFreeEvalProps {
    settings: any;
    onModeChange?: (mode: Mode) => void;
}

type Mode = 'consistency' | 'judge' | 'mutual';

const variantLabel = (index: number) => String.fromCharCode(65 + index);

export function LabelFreeEval({ settings, onModeChange }: LabelFreeEvalProps) {
    const [mode, setMode] = useState<Mode>('consistency');
    const [prompt, setPrompt] = useState('');
    const [prompts, setPrompts] = useState<string[]>(['', '']);
    const [response, setResponse] = useState('');
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState<any>(null);
    const [nSamples, setNSamples] = useState(5);

    // Selector state
    const [showSelector, setShowSelector] = useState(false);
    const [selectorTarget, setSelectorTarget] = useState<'single' | 'multi' | 'response'>('single');
    const [selectorIndex, setSelectorIndex] = useState(0);

    const addPrompt = () => setPrompts([...prompts, '']);
    const removePrompt = (idx: number) => setPrompts(prompts.filter((_, i) => i !== idx));
    const updatePrompt = (idx: number, val: string) => {
        const newPrompts = [...prompts];
        newPrompts[idx] = val;
        setPrompts(newPrompts);
    };

    useEffect(() => {
        if (onModeChange) {
            onModeChange(mode);
        }
        setResults(null);
    }, [mode, onModeChange]);

    const handleOpenSelector = (target: 'single' | 'multi' | 'response', index: number = 0) => {
        setSelectorTarget(target);
        setSelectorIndex(index);
        setShowSelector(true);
    };

    const handleSelectPrompt = (text: string) => {
        if (selectorTarget === 'single') {
            setPrompt(text);
        } else if (selectorTarget === 'multi') {
            updatePrompt(selectorIndex, text);
        } else if (selectorTarget === 'response') {
            setResponse(text);
        }
        setShowSelector(false);
    };

    const runTest = async () => {
        if (mode === 'consistency' && !prompt.trim()) {
            alert('Add a prompt to evaluate.');
            return;
        }
        if (mode === 'mutual') {
            const validPrompts = prompts.filter(p => p.trim());
            if (validPrompts.length < 2) {
                alert('Add at least 2 prompts for mutual consistency evaluation');
                return;
            }
        }
        if (mode === 'judge' && (!prompt.trim() || !response.trim())) {
            alert('Add both judge prompt and content to evaluate.');
            return;
        }

        setLoading(true);
        try {
            let res;
            if (mode === 'consistency') {
                res = await api.runConsistencyCheck({
                    prompt,
                    n_samples: nSamples,
                    provider: settings.provider,
                    model: settings.model
                });
            } else if (mode === 'mutual') {
                const validPrompts = prompts.filter(p => p.trim());
                res = await api.runMutualConsistency({
                    prompts: validPrompts,
                    provider: settings.provider,
                    model: settings.model
                });
            } else {
                res = await api.runLLMJudge({
                    prompt,
                    response,
                    criteria: 'general',
                    provider: settings.provider,
                    model: settings.model
                });
            }
            setResults(res);
        } catch (error) {
            console.error(error);
            alert('Error running test');
        } finally {
            setLoading(false);
        }
    };

    const footerBadge = () => {
        if (mode === 'consistency') {
            return (
                <div className="flex items-center gap-2 px-2 py-1 rounded-lg bg-white/[0.02] border border-white/5 text-xs text-white/70">
                    <span className="text-white/40">Samples</span>
                    <input
                        type="number"
                        min={3}
                        max={20}
                        value={nSamples}
                        onChange={(e) => setNSamples(Math.min(20, Math.max(3, parseInt(e.target.value) || 5)))}
                        className="w-16 bg-transparent border border-white/10 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-white/20"
                    />
                </div>
            );
        }
        if (mode === 'mutual') {
            return (
                <div className="px-2 py-1 rounded-lg bg-white/[0.02] border border-white/5 text-xs text-white/70">
                    Variants: {prompts.length}
                </div>
            );
        }
        return (
            <div className="px-2 py-1 rounded-lg bg-white/[0.02] border border-white/5 text-xs text-white/70 flex items-center gap-2">
                <span className="text-white/40">Judge</span>
                <span className="font-mono text-white/80 truncate max-w-[120px]" title={settings.model}>{settings.model || 'model'}</span>
            </div>
        );
    };

    const hasConsistencyInputs = mode === 'consistency' && prompt.trim().length > 0;
    const hasMutualInputs = mode === 'mutual' && prompts.filter(p => p.trim()).length >= 2;
    const hasJudgeInputs = mode === 'judge' && prompt.trim().length > 0 && response.trim().length > 0;
    const canRun =
        mode === 'consistency' ? hasConsistencyInputs :
        mode === 'mutual' ? hasMutualInputs :
        hasJudgeInputs;
    const isRunDisabled = loading || !canRun;

    return (
        <div className="relative space-y-6 pb-20">
            {showSelector && (
                <PromptSelector
                    onSelect={handleSelectPrompt}
                    onClose={() => setShowSelector(false)}
                />
            )}

            <div className="flex p-1 bg-black/40 rounded-lg border border-white/5 w-fit">
                <Button
                    onClick={() => setMode('consistency')}
                    variant={mode === 'consistency' ? 'secondary' : 'ghost'}
                    size="xs"
                    className="px-3 py-1.5 text-xs font-medium rounded-md"
                >
                    Self-Consistency
                </Button>
                <Button
                    onClick={() => setMode('mutual')}
                    variant={mode === 'mutual' ? 'secondary' : 'ghost'}
                    size="xs"
                    className="px-3 py-1.5 text-xs font-medium rounded-md"
                >
                    Mutual-Consistency (GLaPE)
                </Button>
                <Button
                    onClick={() => setMode('judge')}
                    variant={mode === 'judge' ? 'secondary' : 'ghost'}
                    size="xs"
                    className="px-3 py-1.5 text-xs font-medium rounded-md"
                >
                    LLM-as-a-Judge
                </Button>
            </div>

            <div className="bg-black/25 p-5 rounded-xl border border-white/5 shadow-lg shadow-black/30 space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-[11px] uppercase tracking-[0.2em] text-white/30 font-semibold mb-1">Test Configuration</p>
                        <h3 className="text-lg font-semibold text-white">
                            {mode === 'consistency' ? 'Self-Consistency' : mode === 'mutual' ? 'Mutual-Consistency (GLaPE)' : 'LLM-as-a-Judge'}
                        </h3>
                    </div>
                </div>

                {mode === 'consistency' && (
                    <div className="bg-black/50 border border-white/10 rounded-xl p-4 flex flex-col gap-3">
                        <div className="flex items-center justify-between gap-2">
                            <div>
                                <p className="text-[11px] uppercase tracking-[0.16em] text-white/30 font-semibold">Main Prompt</p>
                                <h4 className="text-sm font-semibold text-white">Baseline Instruction</h4>
                            </div>
                            <Button
                                onClick={() => handleOpenSelector('single')}
                                variant="secondary"
                                size="xs"
                                className="inline-flex items-center gap-1 text-[11px]"
                            >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                                Library
                            </Button>
                        </div>
                        <textarea
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="Write the instruction to test for stability..."
                            className="w-full min-h-[180px] bg-black/60 border border-white/10 rounded-lg px-3 py-3 text-sm text-white/90 font-mono resize-none focus:outline-none focus:border-white/20"
                        />
                    </div>
                )}

                {mode === 'mutual' && (
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
                                            {idx === 0 ? 'Variant A' : `Variant ${variantLabel(idx)}`}
                                        </h4>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            onClick={() => handleOpenSelector('multi', idx)}
                                            variant="secondary"
                                            size="xs"
                                            className="inline-flex items-center gap-1 text-[11px] px-2 py-0 h-6"
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
                                <p className="text-xs text-white/50">Add another candidate prompt for consensus.</p>
                            </Button>
                        </div>
                    </div>
                )}

                {mode === 'judge' && (
                    <div className="space-y-4">
                        <div className="bg-black/50 border border-white/10 rounded-xl p-4 flex flex-col gap-3">
                            <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                    <span className="text-lg">⚖️</span>
                                    <div>
                                        <p className="text-[11px] uppercase tracking-[0.16em] text-white/30 font-semibold">The Judge</p>
                                        <h4 className="text-sm font-semibold text-white">System Prompt for Judge</h4>
                                    </div>
                                </div>
                                <Button
                                    onClick={() => handleOpenSelector('single')}
                                    variant="secondary"
                                    size="xs"
                                    className="inline-flex items-center gap-1 text-[11px] px-2 py-0 h-6"
                                >
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                                    Library
                                </Button>
                            </div>
                            <textarea
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                placeholder="Describe the evaluation rubric and persona for the judge..."
                                className="w-full min-h-[140px] bg-black/60 border border-white/10 rounded-lg px-3 py-3 text-sm text-white/90 font-mono resize-none focus:outline-none focus:border-white/20"
                            />
                        </div>

                        <div className="flex items-center justify-center text-white/30 text-sm">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7-7-7" /></svg>
                        </div>

                        <div className="bg-black/50 border border-white/10 rounded-xl p-4 flex flex-col gap-3">
                            <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                    <span className="text-lg">📄</span>
                                    <div>
                                        <p className="text-[11px] uppercase tracking-[0.16em] text-white/30 font-semibold">Content</p>
                                        <h4 className="text-sm font-semibold text-white">Content to Evaluate</h4>
                                    </div>
                                </div>
                            </div>
                            <textarea
                                value={response}
                                onChange={(e) => setResponse(e.target.value)}
                                placeholder="Paste the model output or text to score..."
                                className="w-full min-h-[140px] bg-black/60 border border-white/10 rounded-lg px-3 py-3 text-sm text-white/90 font-mono resize-none focus:outline-none focus:border-white/20"
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Mode-specific guide */}
            {results && (
                <div className="bg-black/30 p-4 rounded-lg border border-white/10">
                    <h3 className="text-lg font-medium text-white/90 mb-4">
                        {mode === 'consistency' ? 'Self-Consistency Results' :
                            mode === 'mutual' ? 'Mutual-Consistency (GLaPE) Results' :
                                'LLM-as-a-Judge Results'}
                    </h3>

                    {mode === 'consistency' && results.samples && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-black/40 p-3 rounded">
                                    <div className="text-xs text-white/40">Consistency Score</div>
                                    <div className="text-lg font-mono text-white/70">
                                        {results.consistency_score !== undefined ? results.consistency_score.toFixed(3) : (results.score !== undefined ? results.score.toFixed(3) : 'N/A')}
                                    </div>
                                </div>
                                <div className="bg-black/40 p-3 rounded">
                                    <div className="text-xs text-white/40">Samples Generated</div>
                                    <div className="text-lg font-mono text-white/70">{results.samples?.length || 0}</div>
                                </div>
                            </div>

                            <div>
                                <h4 className="text-sm font-medium text-white/80 mb-2">Sample Responses</h4>
                                <div className="space-y-2 max-h-64 overflow-y-auto">
                                    {results.samples.map((sample: any, idx: number) => (
                                        <div key={idx} className="bg-black/20 p-2 rounded text-xs">
                                            <div className="text-white/40 mb-1">Sample #{idx + 1}</div>
                                            <div className="text-white/80">
                                                {typeof sample === 'string' ? sample : sample.response}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {mode === 'mutual' && results.consistency_matrix && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-3 gap-4">
                                <div className="bg-black/40 p-3 rounded">
                                    <div className="text-xs text-white/40">Average Consistency</div>
                                    <div className="text-lg font-mono text-white/70">
                                        {results.avg_consistency !== undefined ? results.avg_consistency.toFixed(3) : 'N/A'}
                                    </div>
                                </div>
                                <div className="bg-black/40 p-3 rounded">
                                    <div className="text-xs text-white/40">Prompt Pairs</div>
                                    <div className="text-lg font-mono text-white/70">{results.consistency_matrix?.length || 0}</div>
                                </div>
                                <div className="bg-black/40 p-3 rounded">
                                    <div className="text-xs text-white/40">GLaPE Score</div>
                                    <div className="text-lg font-mono text-white/70">
                                        {results.glape_score !== undefined ? results.glape_score.toFixed(3) : (results.score !== undefined ? results.score.toFixed(3) : 'N/A')}
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h4 className="text-sm font-medium text-white/80 mb-2">Consistency Matrix</h4>
                                <div className="bg-black/20 p-3 rounded overflow-x-auto">
                                    <pre className="text-xs text-white/80">
                                        {results.consistency_matrix.map((row: any[]) =>
                                            row.map(val => (val as number).toFixed(2)).join(' | ')
                                        ).join('\n')}
                                    </pre>
                                </div>
                            </div>
                        </div>
                    )}

                    {mode === 'judge' && results.score !== undefined && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-black/40 p-3 rounded">
                                    <div className="text-xs text-white/40">Judge Score</div>
                                    <div className="text-lg font-mono text-white/70">
                                        {results.score !== undefined ? results.score.toFixed(3) : 'N/A'}
                                    </div>
                                </div>
                                <div className="bg-black/40 p-3 rounded">
                                    <div className="text-xs text-white/40">Confidence</div>
                                    <div className="text-lg font-mono text-amber-400">
                                        {results.confidence !== undefined ? results.confidence.toFixed(3) : 'N/A'}
                                    </div>
                                </div>
                            </div>

                            {results.reasoning && (
                                <div>
                                    <h4 className="text-sm font-medium text-white/80 mb-2">Judge Reasoning</h4>
                                    <div className="bg-black/20 p-3 rounded text-sm text-white/80">
                                        {results.reasoning}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    <details className="text-xs mt-4">
                        <summary className="cursor-pointer text-white/40 hover:text-gray-300">View Raw JSON</summary>
                        <pre className="mt-2 text-white/30 overflow-auto max-h-64">
                            {JSON.stringify(results, null, 2)}
                        </pre>
                    </details>
                </div>
            )}

            <div className="sticky bottom-0 z-10">
                <div className="flex items-center justify-between gap-4 bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 shadow-lg shadow-black/30 backdrop-blur">
                    <div className="flex items-center gap-3 text-xs text-white/60">
                        {footerBadge()}
                        <div className="px-2 py-1 rounded-lg bg-white/[0.02] border border-white/5">
                            Mode: {mode === 'consistency' ? 'Self-Consistency' : mode === 'mutual' ? 'Mutual' : 'Judge'}
                        </div>
                    </div>
                    <Button
                        onClick={runTest}
                        disabled={isRunDisabled}
                        variant="primary"
                        size="md"
                        className={isRunDisabled ? 'opacity-60 cursor-not-allowed' : ''}
                    >
                        {loading ? (
                            <>
                                <span className="w-2 h-2 rounded-full bg-white/80 animate-ping" />
                                Running...
                            </>
                        ) : (
                            <>
                                Run Evaluation
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" /></svg>
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
}
