import { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { PromptSelector } from './PromptSelector';
import { Button } from '../ui/Button';

interface PerformanceTabProps {
    settings: {
        provider: string;
        model: string;
        apiKey?: string;
    };
    onModeChange?: (mode: PerformanceMode) => void;
}

export type PerformanceMode = 'latency' | 'cost' | 'reliability';

// Icons
const Icons = {
    clock: () => (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    ),
    dollar: () => (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    ),
    shield: () => (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
    ),
    library: () => (
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
        </svg>
    ),
    plus: () => (
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
    ),
};

export function PerformanceTab({ settings, onModeChange }: PerformanceTabProps) {
    const [mode, setMode] = useState<PerformanceMode>('latency');
    const [prompt, setPrompt] = useState('');
    const [testInput, setTestInput] = useState('');
    const [nRuns, setNRuns] = useState(10);
    const [results, setResults] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [showSelector, setShowSelector] = useState(false);

    useEffect(() => {
        onModeChange?.(mode);
    }, [mode, onModeChange]);

    const handleModeChange = (newMode: PerformanceMode) => {
        setMode(newMode);
        setResults(null);
    };

    const runTest = async () => {
        if (!prompt.trim()) {
            alert('Add a prompt to test');
            return;
        }

        setLoading(true);
        const startTime = Date.now();
        const latencies: number[] = [];
        const tokenCounts: { input: number; output: number }[] = [];
        const failures: { index: number; error: string }[] = [];
        const responses: string[] = [];

        try {
            for (let i = 0; i < nRuns; i++) {
                const runStart = Date.now();
                try {
                    const fullPrompt = testInput ? `${prompt}\n\nInput: ${testInput}` : prompt;
                    const res = await api.generatePrompts({
                        prompt: fullPrompt,
                        provider: settings.provider,
                        model: settings.model,
                        techniques: ['none']
                    });

                    const runEnd = Date.now();
                    latencies.push(runEnd - runStart);
                    
                    const firstResult = res.results?.[0];
                    const responseText = firstResult?.response || '';
                    
                    const inputTokens = Math.ceil(fullPrompt.length / 4);
                    const outputTokens = firstResult?.tokens || Math.ceil(responseText.length / 4);
                    tokenCounts.push({ input: inputTokens, output: outputTokens });
                    responses.push(responseText);
                } catch (error) {
                    failures.push({ index: i, error: String(error) });
                }
            }

            const totalTime = Date.now() - startTime;
            
            const avgLatency = latencies.length > 0 
                ? latencies.reduce((a, b) => a + b, 0) / latencies.length 
                : 0;
            const minLatency = latencies.length > 0 ? Math.min(...latencies) : 0;
            const maxLatency = latencies.length > 0 ? Math.max(...latencies) : 0;
            const p50 = latencies.length > 0 ? percentile(latencies, 50) : 0;
            const p95 = latencies.length > 0 ? percentile(latencies, 95) : 0;
            const p99 = latencies.length > 0 ? percentile(latencies, 99) : 0;

            const totalInputTokens = tokenCounts.reduce((a, b) => a + b.input, 0);
            const totalOutputTokens = tokenCounts.reduce((a, b) => a + b.output, 0);
            const avgInputTokens = tokenCounts.length > 0 ? totalInputTokens / tokenCounts.length : 0;
            const avgOutputTokens = tokenCounts.length > 0 ? totalOutputTokens / tokenCounts.length : 0;

            const inputCostPer1k = 0.03;
            const outputCostPer1k = 0.06;
            const estimatedCost = (totalInputTokens / 1000 * inputCostPer1k) + 
                                  (totalOutputTokens / 1000 * outputCostPer1k);

            const failureRate = failures.length / nRuns;

            setResults({
                mode,
                nRuns,
                successfulRuns: nRuns - failures.length,
                totalTime,
                latency: { avg: avgLatency, min: minLatency, max: maxLatency, p50, p95, p99, all: latencies },
                tokens: { totalInput: totalInputTokens, totalOutput: totalOutputTokens, avgInput: avgInputTokens, avgOutput: avgOutputTokens },
                cost: { estimated: estimatedCost, perRequest: estimatedCost / (nRuns - failures.length || 1) },
                reliability: { failureRate, failures, successRate: 1 - failureRate },
                responses: responses.slice(0, 3)
            });
        } catch (error) {
            console.error(error);
            alert('Error running performance test');
        } finally {
            setLoading(false);
        }
    };

    const percentile = (arr: number[], p: number): number => {
        const sorted = [...arr].sort((a, b) => a - b);
        const index = Math.ceil((p / 100) * sorted.length) - 1;
        return sorted[Math.max(0, index)];
    };

    const getScoreColor = (score: number) => {
        if (score >= 95) return 'text-green-400';
        if (score >= 80) return 'text-yellow-400';
        return 'text-red-400';
    };

    const getScoreBg = (score: number) => {
        if (score >= 95) return 'bg-green-500/20 border-green-500/30';
        if (score >= 80) return 'bg-yellow-500/20 border-yellow-500/30';
        return 'bg-red-500/20 border-red-500/30';
    };

    return (
        <div className="space-y-6">
            {/* Mode Selector */}
            <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                    <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Metric Focus</span>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => handleModeChange('latency')}
                        className={`flex-1 px-4 py-2.5 rounded-lg text-xs font-medium transition-all ${
                            mode === 'latency'
                                ? 'bg-white/10 text-white border border-white/20'
                                : 'bg-white/[0.02] text-white/50 border border-white/5 hover:bg-white/5'
                        }`}
                    >
                        <div className="flex items-center justify-center gap-2">
                            <Icons.clock />
                            Latency
                        </div>
                        <div className="text-[10px] text-white/40 mt-1">Response time</div>
                    </button>
                    <button
                        onClick={() => handleModeChange('cost')}
                        className={`flex-1 px-4 py-2.5 rounded-lg text-xs font-medium transition-all ${
                            mode === 'cost'
                                ? 'bg-white/10 text-white border border-white/20'
                                : 'bg-white/[0.02] text-white/50 border border-white/5 hover:bg-white/5'
                        }`}
                    >
                        <div className="flex items-center justify-center gap-2">
                            <Icons.dollar />
                            Cost
                        </div>
                        <div className="text-[10px] text-white/40 mt-1">Token usage</div>
                    </button>
                    <button
                        onClick={() => handleModeChange('reliability')}
                        className={`flex-1 px-4 py-2.5 rounded-lg text-xs font-medium transition-all ${
                            mode === 'reliability'
                                ? 'bg-white/10 text-white border border-white/20'
                                : 'bg-white/[0.02] text-white/50 border border-white/5 hover:bg-white/5'
                        }`}
                    >
                        <div className="flex items-center justify-center gap-2">
                            <Icons.shield />
                            Reliability
                        </div>
                        <div className="text-[10px] text-white/40 mt-1">Failure rate</div>
                    </button>
                </div>
            </div>

            {/* Prompt Input */}
            <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Prompt</span>
                    <button
                        onClick={() => setShowSelector(true)}
                        className="text-[10px] text-white/40 hover:text-white/70 flex items-center gap-1"
                    >
                        <Icons.library />
                        From Library
                    </button>
                </div>
                <textarea
                    value={prompt}
                    onChange={e => setPrompt(e.target.value)}
                    placeholder="Enter prompt to benchmark..."
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white/80 placeholder-white/30 min-h-[100px] resize-none"
                />
            </div>

            {/* Test Input */}
            <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Test Input</span>
                    <span className="text-[10px] text-white/30">Optional</span>
                </div>
                <textarea
                    value={testInput}
                    onChange={e => setTestInput(e.target.value)}
                    placeholder="Sample input to use for testing..."
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white/80 placeholder-white/30 min-h-[60px] resize-none"
                />
            </div>

            {/* Number of Runs */}
            <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Number of Runs</span>
                    <span className="text-xs text-white/60 font-medium">{nRuns} requests</span>
                </div>
                <input
                    type="range"
                    min={5}
                    max={50}
                    value={nRuns}
                    onChange={e => setNRuns(Number(e.target.value))}
                    className="w-full accent-white/50"
                />
                <div className="flex justify-between text-[10px] text-white/30 mt-1">
                    <span>5 (quick)</span>
                    <span>50 (thorough)</span>
                </div>
            </div>

            {/* Run Button */}
            <Button onClick={runTest} disabled={loading} className="w-full">
                {loading ? `Running ${nRuns} requests...` : 'Run Performance Test'}
            </Button>

            {/* Results */}
            {results && (
                <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-4">
                        <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Results</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 border border-green-500/30">
                            {results.successfulRuns}/{results.nRuns} successful
                        </span>
                    </div>

                    {/* Latency Results */}
                    {mode === 'latency' && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-3 gap-3">
                                <div className="bg-white/[0.03] border border-white/5 rounded-lg p-3 text-center">
                                    <div className="text-xl font-semibold text-white">{results.latency.avg.toFixed(0)}ms</div>
                                    <div className="text-[10px] text-white/40 uppercase mt-1">Avg Latency</div>
                                </div>
                                <div className="bg-white/[0.03] border border-white/5 rounded-lg p-3 text-center">
                                    <div className="text-xl font-semibold text-white">{results.latency.p95.toFixed(0)}ms</div>
                                    <div className="text-[10px] text-white/40 uppercase mt-1">P95</div>
                                </div>
                                <div className="bg-white/[0.03] border border-white/5 rounded-lg p-3 text-center">
                                    <div className="text-xl font-semibold text-white">{results.latency.p99.toFixed(0)}ms</div>
                                    <div className="text-[10px] text-white/40 uppercase mt-1">P99</div>
                                </div>
                            </div>

                            <div className="bg-white/[0.03] border border-white/5 rounded-lg p-3">
                                <div className="text-[10px] font-bold text-white/30 uppercase mb-2">Distribution</div>
                                <div className="grid grid-cols-4 gap-2 text-xs">
                                    <div><span className="text-white/40">Min:</span> <span className="text-white/80">{results.latency.min}ms</span></div>
                                    <div><span className="text-white/40">P50:</span> <span className="text-white/80">{results.latency.p50}ms</span></div>
                                    <div><span className="text-white/40">Max:</span> <span className="text-white/80">{results.latency.max}ms</span></div>
                                    <div><span className="text-white/40">Total:</span> <span className="text-white/80">{(results.totalTime / 1000).toFixed(1)}s</span></div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Cost Results */}
                    {mode === 'cost' && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-white/[0.03] border border-white/5 rounded-lg p-3 text-center">
                                    <div className="text-xl font-semibold text-white">${results.cost.estimated.toFixed(4)}</div>
                                    <div className="text-[10px] text-white/40 uppercase mt-1">Total Cost</div>
                                </div>
                                <div className="bg-white/[0.03] border border-white/5 rounded-lg p-3 text-center">
                                    <div className="text-xl font-semibold text-white">${results.cost.perRequest.toFixed(5)}</div>
                                    <div className="text-[10px] text-white/40 uppercase mt-1">Per Request</div>
                                </div>
                            </div>

                            <div className="bg-white/[0.03] border border-white/5 rounded-lg p-3">
                                <div className="text-[10px] font-bold text-white/30 uppercase mb-2">Token Usage</div>
                                <div className="grid grid-cols-2 gap-4 text-xs">
                                    <div>
                                        <div className="text-white/40 mb-1">Input Tokens</div>
                                        <div className="text-white/80">Total: {results.tokens.totalInput} | Avg: {results.tokens.avgInput.toFixed(0)}</div>
                                    </div>
                                    <div>
                                        <div className="text-white/40 mb-1">Output Tokens</div>
                                        <div className="text-white/80">Total: {results.tokens.totalOutput} | Avg: {results.tokens.avgOutput.toFixed(0)}</div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
                                <div className="flex items-center gap-2 text-xs text-yellow-400">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    Cost is estimated based on GPT-4 pricing. Actual costs vary by provider.
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Reliability Results */}
                    {mode === 'reliability' && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <div className={`rounded-lg p-3 text-center border ${getScoreBg(results.reliability.successRate * 100)}`}>
                                    <div className={`text-xl font-semibold ${getScoreColor(results.reliability.successRate * 100)}`}>
                                        {(results.reliability.successRate * 100).toFixed(1)}%
                                    </div>
                                    <div className="text-[10px] text-white/40 uppercase mt-1">Success Rate</div>
                                </div>
                                <div className={`rounded-lg p-3 text-center border ${getScoreBg(100 - results.reliability.failureRate * 100)}`}>
                                    <div className={`text-xl font-semibold ${results.reliability.failureRate <= 0.05 ? 'text-green-400' : results.reliability.failureRate <= 0.2 ? 'text-yellow-400' : 'text-red-400'}`}>
                                        {(results.reliability.failureRate * 100).toFixed(1)}%
                                    </div>
                                    <div className="text-[10px] text-white/40 uppercase mt-1">Failure Rate</div>
                                </div>
                            </div>

                            {results.reliability.failures.length > 0 && (
                                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                                    <div className="text-[10px] font-bold text-red-400 uppercase mb-2">Failures</div>
                                    <div className="space-y-1 max-h-32 overflow-y-auto">
                                        {results.reliability.failures.map((f: any, i: number) => (
                                            <div key={i} className="text-xs text-white/60">
                                                Run #{f.index + 1}: {f.error.slice(0, 100)}
                                            </div>
                                        ))}
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
                    onSelect={(text) => { setPrompt(text); setShowSelector(false); }}
                    onClose={() => setShowSelector(false)}
                />
            )}
        </div>
    );
}
