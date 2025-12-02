import { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { PromptSelector } from './PromptSelector';
import { DatasetSelector } from './DatasetSelector';
import { Button } from '../ui/Button';

interface RobustnessLabProps {
    settings: {
        provider: string;
        model: string;
        apiKey?: string;
    };
    datasets: any[];
    onTestTypeChange?: (testType: 'format' | 'length' | 'adversarial') => void;
    onDatasetCreated?: () => void;
}

type TestType = 'format' | 'length' | 'adversarial';

// Icons
const Icons = {
    format: () => (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
        </svg>
    ),
    length: () => (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
        </svg>
    ),
    adversarial: () => (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
    ),
    library: () => (
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
        </svg>
    ),
};

export function RobustnessLab({ settings, datasets, onTestTypeChange }: RobustnessLabProps) {
    const [selectedDataset, setSelectedDataset] = useState<string>('');
    const [prompt, setPrompt] = useState('');
    const [results, setResults] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [testType, setTestType] = useState<TestType>('format');
    const [contextLength, setContextLength] = useState(1000);
    const [adversarialLevel, setAdversarialLevel] = useState<'light' | 'medium' | 'heavy'>('medium');
    const [showSelector, setShowSelector] = useState(false);
    const [showDatasetSelector, setShowDatasetSelector] = useState(false);

    const selectedDatasetMeta = datasets.find(d => d.id === selectedDataset);

    // Don't auto-select dataset - let user choose

    useEffect(() => {
        onTestTypeChange?.(testType);
        setResults(null);
    }, [testType, onTestTypeChange]);

    const handleModeChange = (newMode: TestType) => {
        setTestType(newMode);
        setResults(null);
    };

    const runTest = async () => {
        if (!selectedDataset || !prompt.trim()) {
            alert('Please select dataset and add a prompt.');
            return;
        }
        setLoading(true);
        try {
            const dataset = datasets.find(d => d.id === selectedDataset);
            if (!dataset?.data) throw new Error('No data');

            let res;
            if (testType === 'format') {
                res = await api.runFormatRobustnessTest({
                    prompt,
                    dataset: dataset.data.slice(0, 10),
                    provider: settings.provider,
                    model: settings.model
                });
            } else if (testType === 'length') {
                res = await api.runLengthRobustnessTest({
                    prompt,
                    dataset: dataset.data.slice(0, 5),
                    max_context_length: contextLength,
                    provider: settings.provider,
                    model: settings.model
                });
            } else {
                res = await api.runAdversarialRobustnessTest({
                    prompt,
                    dataset: dataset.data.slice(0, 5),
                    level: adversarialLevel,
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

    const getScoreColor = (score: number) => {
        if (score >= 0.8) return 'text-green-400';
        if (score >= 0.5) return 'text-yellow-400';
        return 'text-red-400';
    };

    const getScoreBg = (score: number) => {
        if (score >= 0.8) return 'bg-green-500/20 border-green-500/30';
        if (score >= 0.5) return 'bg-yellow-500/20 border-yellow-500/30';
        return 'bg-red-500/20 border-red-500/30';
    };

    return (
        <div className="space-y-6">
            {/* Mode Selector */}
            <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                    <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Test Type</span>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => handleModeChange('format')}
                        className={`flex-1 px-4 py-2.5 rounded-lg text-xs font-medium transition-all ${
                            testType === 'format'
                                ? 'bg-white/10 text-white border border-white/20'
                                : 'bg-white/[0.02] text-white/50 border border-white/5 hover:bg-white/5'
                        }`}
                    >
                        <div className="flex items-center justify-center gap-2">
                            <Icons.format />
                            Format
                        </div>
                        <div className="text-[10px] text-white/40 mt-1">JSON, text, markdown</div>
                    </button>
                    <button
                        onClick={() => handleModeChange('length')}
                        className={`flex-1 px-4 py-2.5 rounded-lg text-xs font-medium transition-all ${
                            testType === 'length'
                                ? 'bg-white/10 text-white border border-white/20'
                                : 'bg-white/[0.02] text-white/50 border border-white/5 hover:bg-white/5'
                        }`}
                    >
                        <div className="flex items-center justify-center gap-2">
                            <Icons.length />
                            Length
                        </div>
                        <div className="text-[10px] text-white/40 mt-1">Context window</div>
                    </button>
                    <button
                        onClick={() => handleModeChange('adversarial')}
                        className={`flex-1 px-4 py-2.5 rounded-lg text-xs font-medium transition-all ${
                            testType === 'adversarial'
                                ? 'bg-white/10 text-white border border-white/20'
                                : 'bg-white/[0.02] text-white/50 border border-white/5 hover:bg-white/5'
                        }`}
                    >
                        <div className="flex items-center justify-center gap-2">
                            <Icons.adversarial />
                            Adversarial
                        </div>
                        <div className="text-[10px] text-white/40 mt-1">Attack resistance</div>
                    </button>
                </div>
            </div>

            {/* Description based on test type */}
            <div className="text-[11px] text-white/50 bg-white/[0.02] border border-white/5 rounded-lg px-3 py-2">
                {testType === 'format' && 'Test how your prompt handles different output formats (JSON, markdown, plain text). Reveals format-dependent failures in structured output tasks.'}
                {testType === 'length' && 'Test how quality degrades with longer contexts. Find the point where your prompt starts losing information — critical for RAG and document processing.'}
                {testType === 'adversarial' && 'Test resistance to prompt injection, jailbreaks, and malicious inputs. Essential security check before deploying user-facing applications.'}
            </div>

            {/* Dataset Selection */}
            <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Dataset</span>
                    <Button
                        onClick={() => setShowDatasetSelector(true)}
                        variant="secondary"
                        size="xs"
                        className="text-[10px] px-2 py-1 text-white/50"
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
                    className="w-full bg-black/30 border border-white/5 rounded-xl px-4 py-3 text-sm text-white/90 focus:outline-none focus:border-white/15 hover:border-white/15 cursor-pointer min-h-[100px] resize-none placeholder-white/30 font-mono text-xs"
                />
            </div>

            {/* Prompt Input */}
            <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Prompt</span>
                    <Button
                        onClick={() => setShowSelector(true)}
                        variant="secondary"
                        size="xs"
                        className="text-[10px] px-2 py-1 text-white/50"
                    >
                        <Icons.library />
                        Library
                    </Button>
                </div>
                <textarea
                    value={prompt}
                    onChange={e => setPrompt(e.target.value)}
                    placeholder="Enter prompt to test for robustness..."
                    className="w-full bg-black/30 border border-white/5 rounded-xl px-4 py-3 text-sm text-white/90 focus:outline-none focus:border-white/15 hover:border-white/15 placeholder-white/30 min-h-[100px] resize-none"
                />
            </div>

            {/* Test-specific Options */}
            {testType === 'length' && (
                <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Max Context Length</span>
                        <span className="text-xs text-white/60 font-medium">{contextLength} tokens</span>
                    </div>
                    <input
                        type="range"
                        min={500}
                        max={8000}
                        step={500}
                        value={contextLength}
                        onChange={e => setContextLength(Number(e.target.value))}
                        className="w-full accent-white/50"
                    />
                    <div className="flex justify-between text-[10px] text-white/30 mt-1">
                        <span>500</span>
                        <span>8000</span>
                    </div>
                </div>
            )}

            {testType === 'adversarial' && (
                <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Attack Level</span>
                    </div>
                    <div className="flex gap-2">
                        {(['light', 'medium', 'heavy'] as const).map(level => (
                            <button
                                key={level}
                                onClick={() => setAdversarialLevel(level)}
                                className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                                    adversarialLevel === level
                                        ? 'bg-white/10 text-white border border-white/20'
                                        : 'bg-white/[0.02] text-white/50 border border-white/5 hover:bg-white/5'
                                }`}
                            >
                                {level.charAt(0).toUpperCase() + level.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>
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
                    {loading ? 'Running...' : 'Run Test'}
                </Button>
            </div>

            {/* Results */}
            {results && (
                <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-4">
                        <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Results</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border ${getScoreBg(results.robustness_score || 0)}`}>
                            <span className={getScoreColor(results.robustness_score || 0)}>
                                {((results.robustness_score || 0) * 100).toFixed(0)}% robust
                            </span>
                        </span>
                    </div>

                    {/* Summary Metrics */}
                    <div className="grid grid-cols-3 gap-3 mb-4">
                        <div className="bg-white/[0.03] border border-white/5 rounded-lg p-3 text-center">
                            <div className={`text-xl font-semibold ${getScoreColor(results.robustness_score || 0)}`}>
                                {((results.robustness_score || 0) * 100).toFixed(0)}%
                            </div>
                            <div className="text-[10px] text-white/40 uppercase mt-1">Robustness</div>
                        </div>
                        <div className="bg-white/[0.03] border border-white/5 rounded-lg p-3 text-center">
                            <div className="text-xl font-semibold text-amber-400">
                                {((results.performance_delta || 0) * 100).toFixed(1)}%
                            </div>
                            <div className="text-[10px] text-white/40 uppercase mt-1">Delta</div>
                        </div>
                        <div className="bg-white/[0.03] border border-white/5 rounded-lg p-3 text-center">
                            <div className="text-xl font-semibold text-white">
                                {results.variations?.length || results.format_variations?.length || results.length_tests?.length || results.adversarial_tests?.length || 0}
                            </div>
                            <div className="text-[10px] text-white/40 uppercase mt-1">Variations</div>
                        </div>
                    </div>

                    {/* Format Results */}
                    {testType === 'format' && results.format_variations && (
                        <div className="space-y-2">
                            <div className="text-[10px] font-bold text-white/30 uppercase mb-2">Format Variations</div>
                            {results.format_variations.map((v: any, i: number) => (
                                <div key={i} className="bg-white/[0.03] border border-white/5 rounded-lg p-3">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-xs text-white/70">{v.name}</span>
                                        <span className={`text-xs font-medium ${getScoreColor(v.score)}`}>
                                            {(v.score * 100).toFixed(0)}%
                                        </span>
                                    </div>
                                    <div className="text-[10px] text-white/40">
                                        Delta: {(v.delta * 100).toFixed(1)}%
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Length Results */}
                    {testType === 'length' && results.length_tests && (
                        <div className="space-y-2">
                            <div className="text-[10px] font-bold text-white/30 uppercase mb-2">Length Tests</div>
                            {results.length_tests.map((t: any, i: number) => (
                                <div key={i} className="bg-white/[0.03] border border-white/5 rounded-lg p-3 flex items-center justify-between">
                                    <span className="text-xs text-white/70">{t.context_length} tokens</span>
                                    <span className={`text-xs font-medium ${getScoreColor(t.score)}`}>
                                        {(t.score * 100).toFixed(0)}%
                                    </span>
                                </div>
                            ))}
                            {results.degradation_point && (
                                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
                                    <div className="text-xs text-yellow-400">
                                        Performance degrades beyond {results.degradation_point} tokens
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Adversarial Results */}
                    {testType === 'adversarial' && results.adversarial_tests && (
                        <div className="space-y-2">
                            <div className="text-[10px] font-bold text-white/30 uppercase mb-2">Attack Results</div>
                            {results.adversarial_tests.map((a: any, i: number) => (
                                <div key={i} className="bg-white/[0.03] border border-white/5 rounded-lg p-3">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-xs text-white/70">{a.type}</span>
                                        <span className={`text-xs font-medium ${getScoreColor(a.score)}`}>
                                            {(a.score * 100).toFixed(0)}%
                                        </span>
                                    </div>
                                    <div className="text-[10px] text-white/40">{a.description}</div>
                                </div>
                            ))}
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
