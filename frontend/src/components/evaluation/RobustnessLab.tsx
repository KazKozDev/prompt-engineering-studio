import { useState, useEffect } from 'react';
import { api } from '../../services/api';

interface RobustnessLabProps {
    settings: any;
    datasets: any[];
    onTestTypeChange?: (testType: 'format' | 'length' | 'adversarial') => void;
}

export function RobustnessLab({ settings, datasets, onTestTypeChange }: RobustnessLabProps) {
    const [selectedDataset, setSelectedDataset] = useState<string>('');
    const [prompt, setPrompt] = useState('');
    const [results, setResults] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [testType, setTestType] = useState<'format' | 'length' | 'adversarial'>('format');
    const [contextLength, setContextLength] = useState(1000);
    const [adversarialLevel, setAdversarialLevel] = useState<'light' | 'medium' | 'heavy'>('medium');

    useEffect(() => {
        if (datasets.length > 0 && !selectedDataset) {
            setSelectedDataset(datasets[0].id);
        }
    }, [datasets, selectedDataset]);

    useEffect(() => {
        if (onTestTypeChange) {
            onTestTypeChange(testType);
        }
    }, [testType, onTestTypeChange]);

    const runTest = async () => {
        if (!selectedDataset || !prompt) return;
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
        <div className="space-y-6">
            <div className="flex p-1 bg-black/40 rounded-lg border border-white/5 mb-6 w-fit">
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

            <div className="bg-black/30/50 p-4 rounded-lg border border-white/10 space-y-4">
                <div>
                    <label className="block text-sm font-medium text-white/40 mb-2">Dataset</label>
                    <select
                        value={selectedDataset}
                        onChange={(e) => setSelectedDataset(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white/90"
                    >
                        {datasets.map(d => (
                            <option key={d.id} value={d.id}>{d.name}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-white/40 mb-2">Base Prompt</label>
                    <textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        className="w-full h-24 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white/90 font-mono resize-none"
                        placeholder="Enter prompt to test for robustness..."
                    />
                </div>

                {testType === 'length' && (
                    <div>
                        <label className="block text-sm font-medium text-white/40 mb-2">Max Context Length</label>
                        <input
                            type="number"
                            min="100"
                            max="8000"
                            step="100"
                            value={contextLength}
                            onChange={(e) => setContextLength(parseInt(e.target.value) || 1000)}
                            className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white/90"
                        />
                    </div>
                )}

                {testType === 'adversarial' && (
                    <div>
                        <label className="block text-sm font-medium text-white/40 mb-2">Adversarial Level</label>
                        <select
                            value={adversarialLevel}
                            onChange={(e) => setAdversarialLevel(e.target.value as any)}
                            className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white/90"
                        >
                            <option value="light">Light (synonyms, minor reordering)</option>
                            <option value="medium">Medium (paraphrasing, noise)</option>
                            <option value="heavy">Heavy (complex transformations)</option>
                        </select>
                    </div>
                )}

                <button
                    onClick={runTest}
                    disabled={loading}
                    className="w-full py-2 bg-[#007AFF] hover:bg-[#0071E3] text-white rounded-lg font-medium disabled:opacity-50"
                >
                    {loading ? 'Running Robustness Test...' : 'Run Test'}
                </button>
            </div>

            {results && (
                <div className="bg-black/30/50 p-4 rounded-lg border border-white/10">
                    <h3 className="text-lg font-medium text-white/90 mb-4">
                        {testType === 'format' ? 'Format Sensitivity Results' :
                            testType === 'length' ? 'Context Length Robustness Results' :
                                'Adversarial Robustness Results'}
                    </h3>

                    {/* Summary Metrics */}
                    <div className="grid grid-cols-3 gap-4 mb-6">
                        <div className="bg-black/40/50 p-3 rounded">
                            <div className="text-xs text-white/40">Robustness Score</div>
                            <div className="text-lg font-mono text-[#007AFF]">
                                {results.robustness_score?.toFixed(3) || 'N/A'}
                            </div>
                        </div>
                        <div className="bg-black/40/50 p-3 rounded">
                            <div className="text-xs text-white/40">Performance Delta</div>
                            <div className="text-lg font-mono text-amber-400">
                                {results.performance_delta?.toFixed(3) || 'N/A'}
                            </div>
                        </div>
                        <div className="bg-black/40/50 p-3 rounded">
                            <div className="text-xs text-white/40">Variations Tested</div>
                            <div className="text-lg font-mono text-emerald-400">
                                {results.variations?.length || 0}
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
        </div>
    );
}
