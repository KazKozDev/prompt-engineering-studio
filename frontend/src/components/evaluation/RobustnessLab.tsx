import { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { PromptSelector } from './PromptSelector';
import { DatasetGenerator } from '../DatasetGenerator';

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

export function RobustnessLab({ settings, datasets, onTestTypeChange, onDatasetCreated }: RobustnessLabProps) {
    const [selectedDataset, setSelectedDataset] = useState<string>('');
    const [prompt, setPrompt] = useState('');
    const [results, setResults] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [testType, setTestType] = useState<TestType>('format');
    const [contextLength, setContextLength] = useState(1000);
    const [adversarialLevel, setAdversarialLevel] = useState<'light' | 'medium' | 'heavy'>('medium');

    // Selector state
    const [showSelector, setShowSelector] = useState(false);
    const [showGenerator, setShowGenerator] = useState(false);

    useEffect(() => {
        if (datasets.length > 0 && !selectedDataset) {
            setSelectedDataset(datasets[0].id);
        }
    }, [datasets, selectedDataset]);

    useEffect(() => {
        if (onTestTypeChange) {
            onTestTypeChange(testType);
        }
        setResults(null);
    }, [testType, onTestTypeChange]);

    const selectedDatasetMeta = datasets.find(d => d.id === selectedDataset);
    const datasetSize = selectedDatasetMeta?.size ?? selectedDatasetMeta?.data?.length ?? 0;
    const datasetName = selectedDatasetMeta?.name || 'Not set';

    const handleSelectPrompt = (text: string) => {
        setPrompt(text);
        setShowSelector(false);
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
                            context="robustness"
                            title="Generate Robustness Dataset"
                            description="Create edge cases and adversarial inputs to stress-test your prompt"
                            initialPrompt={prompt || ''}
                            onGenerated={async (data, name) => {
                                try {
                                    const result = await api.createDataset({
                                        name: name || `Robustness Dataset ${new Date().toLocaleDateString()}`,
                                        description: 'Generated for robustness testing',
                                        category: 'robustness',
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

            <div className="flex p-1 bg-black/40 rounded-lg border border-white/5 w-fit">
                <button
                    onClick={() => setTestType('format')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${testType === 'format' ? 'bg-white/10 text-white shadow-sm' : 'text-white/40 hover:text-white/60'}`}
                >
                    Format Sensitivity
                </button>
                <button
                    onClick={() => setTestType('length')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${testType === 'length' ? 'bg-white/10 text-white shadow-sm' : 'text-white/40 hover:text-white/60'}`}
                >
                    Context Length
                </button>
                <button
                    onClick={() => setTestType('adversarial')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${testType === 'adversarial' ? 'bg-white/10 text-white shadow-sm' : 'text-white/40 hover:text-white/60'}`}
                >
                    Adversarial Tests
                </button>
            </div>

            <div className="bg-black/25 p-5 rounded-xl border border-white/5 shadow-lg shadow-black/30 space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-[11px] uppercase tracking-[0.2em] text-white/30 font-semibold mb-1">Test Configuration</p>
                        <h3 className="text-lg font-semibold text-white">
                            {testType === 'format' ? 'Format Sensitivity' : testType === 'length' ? 'Context Length Robustness' : 'Adversarial Tests'}
                        </h3>
                    </div>
                </div>

                <div className="bg-white/[0.02] border border-white/5 rounded-lg p-4 flex flex-col gap-4">
                    <div className="flex items-center justify-between gap-3">
                        <div>
                            <p className="text-[11px] uppercase tracking-[0.18em] text-white/30 font-semibold">Dataset</p>
                            <p className="text-sm text-white/70">Labeled set used to probe robustness.</p>
                        </div>
                        <div className="flex items-center gap-2">
                            {selectedDataset && (
                                <span className="px-3 py-1 rounded-full text-[11px] bg-white/[0.06] border border-white/10 text-white/70">
                                    {datasetSize} items
                                </span>
                            )}
                            <button
                                onClick={() => setShowGenerator(true)}
                                className="px-3 py-1.5 rounded-lg text-[11px] font-medium bg-[#2563EB]/10 border border-[#2563EB]/20 text-[#60a5fa] hover:bg-[#2563EB]/20 transition-colors"
                            >
                                Generate
                            </button>
                        </div>
                    </div>
                    <select
                        value={selectedDataset}
                        onChange={(e) => setSelectedDataset(e.target.value)}
                        className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-3 text-sm text-white/90 focus:outline-none focus:border-[#007AFF]/40"
                    >
                        {datasets.map(d => (
                            <option key={d.id} value={d.id}>{d.name}</option>
                        ))}
                    </select>
                </div>

                <div className="bg-black/50 border border-white/10 rounded-xl p-4 flex flex-col gap-3 shadow-inner shadow-black/30">
                    <div className="flex items-center justify-between gap-3">
                        <div>
                            <p className="text-[11px] uppercase tracking-[0.16em] text-white/30 font-semibold">Base Prompt</p>
                            <h4 className="text-sm font-semibold text-white">Instruction to test</h4>
                        </div>
                        <button
                            onClick={() => setShowSelector(true)}
                            className="inline-flex items-center gap-1 text-[11px] px-2 py-1.5 rounded-lg border border-white/10 text-white/60 hover:text-white hover:border-[#007AFF]/50 transition-colors"
                        >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                            Library
                        </button>
                    </div>
                    <textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        className="w-full min-h-[180px] bg-black/60 border border-white/10 rounded-lg px-3 py-3 text-sm text-white/90 font-mono resize-none focus:outline-none focus:border-[#007AFF]/40"
                        placeholder="Enter prompt to test for robustness..."
                    />

                    {testType === 'length' && (
                        <div className="flex items-center gap-3 flex-wrap">
                            <span className="text-[11px] text-white/40">Max context length</span>
                            <input
                                type="number"
                                min={100}
                                max={8000}
                                step={100}
                                value={contextLength}
                                onChange={(e) => setContextLength(parseInt(e.target.value) || 1000)}
                                className="bg-black/60 border border-white/10 rounded-lg px-3 py-2 text-xs text-white/80 focus:outline-none focus:border-[#007AFF]/40"
                            />
                        </div>
                    )}

                    {testType === 'adversarial' && (
                        <div className="flex items-center gap-3 flex-wrap">
                            <span className="text-[11px] text-white/40">Adversarial level</span>
                            <div className="flex items-center gap-2">
                                {['light', 'medium', 'heavy'].map(level => (
                                    <button
                                        key={level}
                                        onClick={() => setAdversarialLevel(level as any)}
                                        className={`px-3 py-1.5 text-xs rounded-lg border ${adversarialLevel === level
                                            ? 'border-[#007AFF]/50 bg-[#007AFF]/15 text-white'
                                            : 'border-white/10 text-white/60 hover:text-white hover:border-white/30'
                                            } transition-colors`}
                                    >
                                        {level.charAt(0).toUpperCase() + level.slice(1)}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {results && (
                <div className="bg-black/30 p-4 rounded-lg border border-white/10">
                    <h3 className="text-lg font-medium text-white/90 mb-4">
                        {testType === 'format' ? 'Format Sensitivity Results' :
                            testType === 'length' ? 'Context Length Robustness Results' :
                                'Adversarial Robustness Results'}
                    </h3>

                    {/* Summary Metrics */}
                    <div className="grid grid-cols-3 gap-4 mb-6">
                        <div className="bg-black/40 p-3 rounded">
                            <div className="text-xs text-white/40">Robustness Score</div>
                            <div className="text-lg font-mono text-[#007AFF]">
                                {results.robustness_score?.toFixed(3) || 'N/A'}
                            </div>
                        </div>
                        <div className="bg-black/40 p-3 rounded">
                            <div className="text-xs text-white/40">Performance Delta</div>
                            <div className="text-lg font-mono text-amber-400">
                                {results.performance_delta?.toFixed(3) || 'N/A'}
                            </div>
                        </div>
                        <div className="bg-black/40 p-3 rounded">
                            <div className="text-xs text-white/40">Variations Tested</div>
                            <div className="text-lg font-mono text-emerald-400">
                                {results.variations?.length || results.format_variations?.length || results.length_tests?.length || results.adversarial_tests?.length || 0}
                            </div>
                        </div>
                    </div>

                    {/* Detailed Results */}
                    {testType === 'format' && results.format_variations && (
                        <div className="space-y-4">
                            <h4 className="text-sm font-medium text-white/80 mb-3">Format Variations</h4>
                            <div className="space-y-2 max-h-64 overflow-y-auto">
                                {results.format_variations.map((variation: any, idx: number) => (
                                    <div key={idx} className="bg-black/20 p-3 rounded border border-white/10">
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="text-sm font-medium text-white/80">{variation.name}</span>
                                            <span className="text-sm font-mono text-[#007AFF]">{variation.score.toFixed(3)}</span>
                                        </div>
                                        <div className="text-xs text-white/40 font-mono bg-black/30 p-2 rounded truncate">
                                            {variation.example?.substring(0, 100)}...
                                        </div>
                                        <div className="mt-2 text-xs text-white/30">
                                            Delta: {variation.delta?.toFixed(3)} ({variation.delta_percent?.toFixed(1)}%)
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {testType === 'length' && results.length_tests && (
                        <div className="space-y-4">
                            <h4 className="text-sm font-medium text-white/80 mb-3">Context Length Tests</h4>
                            <div className="bg-black/20 p-3 rounded">
                                <div className="text-xs text-white/40 mb-2">Performance by Context Length</div>
                                <div className="space-y-1">
                                    {results.length_tests.map((test: any, idx: number) => (
                                        <div key={idx} className="flex justify-between text-xs">
                                            <span className="text-white/80">{test.context_length} tokens</span>
                                            <span className="text-[#007AFF] font-mono">{test.score.toFixed(3)}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="bg-yellow-900/20 p-3 rounded border border-yellow-700">
                                <div className="text-xs text-amber-400">
                                    ⚠️ Performance degrades significantly beyond {results.degradation_point || 'N/A'} tokens
                                </div>
                            </div>
                        </div>
                    )}

                    {testType === 'adversarial' && results.adversarial_tests && (
                        <div className="space-y-4">
                            <h4 className="text-sm font-medium text-white/80 mb-3">Adversarial Attack Results</h4>
                            <div className="space-y-2 max-h-64 overflow-y-auto">
                                {results.adversarial_tests.map((attack: any, idx: number) => (
                                    <div key={idx} className="bg-black/20 p-3 rounded border border-white/10">
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="text-sm font-medium text-white/80">{attack.type}</span>
                                            <span className="text-sm font-mono text-red-400">{attack.score.toFixed(3)}</span>
                                        </div>
                                        <div className="text-xs text-white/40 mb-2">{attack.description}</div>
                                        <div className="text-xs text-white/30">
                                            Impact: {attack.impact?.toFixed(1)}% degradation
                                        </div>
                                    </div>
                                ))}
                            </div>
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
                    <div className="flex items-center gap-3 text-xs text-white/60 flex-wrap">
                        <div className="px-2 py-1 rounded-lg bg-white/[0.02] border border-white/5">
                            Dataset: {datasetName}
                        </div>
                        <div className="px-2 py-1 rounded-lg bg-white/[0.02] border border-white/5">
                            Mode: {testType === 'format' ? 'Format' : testType === 'length' ? 'Length' : 'Adversarial'}
                        </div>
                        {testType === 'length' && (
                            <div className="px-2 py-1 rounded-lg bg-white/[0.02] border border-white/5">
                                Max ctx: {contextLength} tokens
                            </div>
                        )}
                        {testType === 'adversarial' && (
                            <div className="px-2 py-1 rounded-lg bg-white/[0.02] border border-white/5">
                                Level: {adversarialLevel}
                            </div>
                        )}
                        <div className="px-2 py-1 rounded-lg bg-white/[0.02] border border-white/5">
                            Variations: {results?.variations?.length || datasetSize || 0}
                        </div>
                    </div>
                    <button
                        onClick={runTest}
                        disabled={loading}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-[#4F46E5] to-[#007AFF] text-sm font-semibold text-white shadow-[0_10px_30px_-12px_rgba(0,122,255,0.8)] hover:opacity-95 disabled:opacity-50 transition-all"
                    >
                        {loading ? (
                            <>
                                <span className="w-2 h-2 rounded-full bg-white/80 animate-ping" />
                                Running...
                            </>
                        ) : (
                            <>
                                Run Test
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" /></svg>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
