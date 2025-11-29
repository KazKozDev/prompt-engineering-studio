import { useState, useEffect } from 'react';
import { api } from '../../services/api';

interface LabelFreeEvalProps {
    settings: any;
    onModeChange?: (mode: Mode) => void;
}

type Mode = 'consistency' | 'judge' | 'mutual';

export function LabelFreeEval({ settings, onModeChange }: LabelFreeEvalProps) {
    const [mode, setMode] = useState<Mode>('consistency');
    const [prompt, setPrompt] = useState('');
    const [prompts, setPrompts] = useState<string[]>(['']);
    const [response, setResponse] = useState('');
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState<any>(null);
    const [nSamples, setNSamples] = useState(5);

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
    }, [mode, onModeChange]);

    const runTest = async () => {
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
                if (validPrompts.length < 2) {
                    alert('Add at least 2 prompts for mutual consistency evaluation');
                    return;
                }
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

    return (
        <div className="space-y-6">
            <div className="flex p-1 bg-black/40 rounded-lg border border-white/5 mb-6 w-fit">
                <button
                    onClick={() => setMode('consistency')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${mode === 'consistency' ? 'bg-white/10 text-white shadow-sm' : 'text-white/40 hover:text-white/60'}`}
                >
                    Self-Consistency
                </button>
                <button
                    onClick={() => setMode('mutual')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${mode === 'mutual' ? 'bg-white/10 text-white shadow-sm' : 'text-white/40 hover:text-white/60'}`}
                >
                    Mutual-Consistency (GLaPE)
                </button>
                <button
                    onClick={() => setMode('judge')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${mode === 'judge' ? 'bg-white/10 text-white shadow-sm' : 'text-white/40 hover:text-white/60'}`}
                >
                    LLM-as-a-Judge
                </button>
            </div>

            <div className="bg-black/20 p-4 rounded-lg border border-white/5 space-y-4">
                {mode === 'mutual' ? (
                    <div>
                        <label className="block text-sm font-medium text-white/40 mb-2">Prompts for Mutual Consistency</label>
                        <div className="space-y-3">
                            {prompts.map((p, idx) => (
                                <div key={idx} className="flex gap-2">
                                    <textarea
                                        value={p}
                                        onChange={(e) => updatePrompt(idx, e.target.value)}
                                        placeholder={`Prompt variant #${idx + 1}...`}
                                        className="flex-1 h-20 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white/90 font-mono resize-none"
                                    />
                                    {prompts.length > 1 && (
                                        <button onClick={() => removePrompt(idx)} className="text-red-400 hover:text-red-300 px-2">✕</button>
                                    )}
                                </div>
                            ))}
                        </div>
                        <button onClick={addPrompt} className="mt-2 text-sm text-[#007AFF] hover:text-blue-300">+ Add Variant</button>
                    </div>
                ) : (
                    <div>
                        <label className="block text-sm font-medium text-white/40 mb-2">Prompt</label>
                        <textarea
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            className="w-full h-24 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white/90 font-mono resize-none"
                            placeholder="Enter prompt..."
                        />
                    </div>
                )}

                {mode === 'consistency' && (
                    <div>
                        <label className="block text-sm font-medium text-white/40 mb-2">Number of Samples</label>
                        <input
                            type="number"
                            min="3"
                            max="20"
                            value={nSamples}
                            onChange={(e) => setNSamples(parseInt(e.target.value) || 5)}
                            className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white/90"
                        />
                    </div>
                )}

                {mode === 'judge' && (
                    <div>
                        <label className="block text-sm font-medium text-white/40 mb-2">Response to Evaluate</label>
                        <textarea
                            value={response}
                            onChange={(e) => setResponse(e.target.value)}
                            className="w-full h-24 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white/90 font-mono resize-none"
                            placeholder="Enter model response..."
                        />
                    </div>
                )}

                <button
                    onClick={runTest}
                    disabled={loading}
                    className="w-full py-2 bg-[#007AFF] hover:bg-[#0071E3] text-white rounded-lg font-medium disabled:opacity-50"
                >
                    {loading ? 'Running...' : 'Run Evaluation'}
                </button>
            </div>

            {/* Mode-specific guide */}
            {results && (
                <div className="bg-black/30/50 p-4 rounded-lg border border-white/10">
                    <h3 className="text-lg font-medium text-white/90 mb-4">
                        {mode === 'consistency' ? 'Self-Consistency Results' :
                            mode === 'mutual' ? 'Mutual-Consistency (GLaPE) Results' :
                                'LLM-as-a-Judge Results'}
                    </h3>

                    {mode === 'consistency' && results.samples && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-black/40/50 p-3 rounded">
                                    <div className="text-xs text-white/40">Consistency Score</div>
                                    <div className="text-lg font-mono text-[#007AFF]">{results.consistency_score?.toFixed(3) || 'N/A'}</div>
                                </div>
                                <div className="bg-black/40/50 p-3 rounded">
                                    <div className="text-xs text-white/40">Samples Generated</div>
                                    <div className="text-lg font-mono text-emerald-400">{results.samples?.length || 0}</div>
                                </div>
                            </div>

                            <div>
                                <h4 className="text-sm font-medium text-white/80 mb-2">Sample Responses</h4>
                                <div className="space-y-2 max-h-64 overflow-y-auto">
                                    {results.samples.map((sample: any, idx: number) => (
                                        <div key={idx} className="bg-black/20 p-2 rounded text-xs">
                                            <div className="text-white/40 mb-1">Sample #{idx + 1}</div>
                                            <div className="text-white/80">{sample.response}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {mode === 'mutual' && results.consistency_matrix && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-3 gap-4">
                                <div className="bg-black/40/50 p-3 rounded">
                                    <div className="text-xs text-white/40">Average Consistency</div>
                                    <div className="text-lg font-mono text-[#007AFF]">{results.avg_consistency?.toFixed(3) || 'N/A'}</div>
                                </div>
                                <div className="bg-black/40/50 p-3 rounded">
                                    <div className="text-xs text-white/40">Prompt Pairs</div>
                                    <div className="text-lg font-mono text-emerald-400">{results.consistency_matrix?.length || 0}</div>
                                </div>
                                <div className="bg-black/40/50 p-3 rounded">
                                    <div className="text-xs text-white/40">GLaPE Score</div>
                                    <div className="text-lg font-mono text-purple-400">{results.glape_score?.toFixed(3) || 'N/A'}</div>
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
                                <div className="bg-black/40/50 p-3 rounded">
                                    <div className="text-xs text-white/40">Judge Score</div>
                                    <div className="text-lg font-mono text-[#007AFF]">{results.score?.toFixed(3) || 'N/A'}</div>
                                </div>
                                <div className="bg-black/40/50 p-3 rounded">
                                    <div className="text-xs text-white/40">Confidence</div>
                                    <div className="text-lg font-mono text-amber-400">{results.confidence?.toFixed(3) || 'N/A'}</div>
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
        </div>
    );
}
