import { useState, useEffect, useMemo } from 'react';
import { api } from '../services/api';
import { savePromptToLibrary } from './PromptLibrary';
import { loadAllDatasets, getDatasetById, type Dataset } from './Datasets';
import { DatasetGenerator } from './DatasetGenerator';

interface PromptOptimizerProps {
    settings: {
        provider: string;
        model: string;
        apiKey?: string;
    };
}

export function PromptOptimizer({ settings }: PromptOptimizerProps) {
    const [basePrompt, setBasePrompt] = useState('');
    const [datasetText, setDatasetText] = useState<string>('');
    const [results, setResults] = useState<any>(null);
    const [isRunning, setIsRunning] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [savedToLibrary, setSavedToLibrary] = useState(false);

    // Dataset selection
    const [datasets, setDatasets] = useState<Dataset[]>([]);
    const [selectedDatasetId, setSelectedDatasetId] = useState<string>('');
    const [datasetMode, setDatasetMode] = useState<'select' | 'manual'>('select');
    const [searchQuery, setSearchQuery] = useState('');
    const [datasetFilter, setDatasetFilter] = useState<'all' | 'custom' | 'imported'>('all');
    const [showDatasetJson, setShowDatasetJson] = useState(false);
    const [showGenerator, setShowGenerator] = useState(false);

    const refreshDatasets = async () => {
        const allDatasets = await loadAllDatasets();
        setDatasets(allDatasets);
    };

    useEffect(() => {
        refreshDatasets();
    }, []);

    const handleDatasetSelect = async (datasetId: string) => {
        setSelectedDatasetId(datasetId);
        if (datasetId) {
            const dataset = await getDatasetById(datasetId);
            if (dataset?.data) {
                setDatasetText(JSON.stringify(dataset.data, null, 2));
            }
        } else {
            setDatasetText('');
        }
    };

    const handleRun = async () => {
        if (!basePrompt) return;

        setError(null);
        setIsRunning(true);
        setResults(null);

        try {
            let dataset;
            try {
                dataset = JSON.parse(datasetText);
                if (!Array.isArray(dataset)) throw new Error("Dataset must be an array");
            } catch (e) {
                throw new Error("Invalid JSON in dataset");
            }

            const data = await api.optimizePrompt({
                base_prompt: basePrompt,
                dataset,
                provider: settings.provider,
                model: settings.model
            });

            setResults(data);
            setSavedToLibrary(false);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsRunning(false);
        }
    };

    const handleSaveToLibrary = () => {
        if (!results) return;

        savePromptToLibrary({
            name: `Optimized: ${basePrompt.substring(0, 30)}...`,
            text: results.best_prompt,
            technique: 'optimizer',
            techniqueName: 'Auto-Optimized',
            status: 'testing',
            category: 'General',
            tags: ['optimized', 'auto-generated'],
            description: `Optimized from: "${basePrompt.substring(0, 100)}..." Score: ${(results.best_score * 100).toFixed(1)}%`,
            sourceType: 'optimized',
            evaluation: {
                qualityScore: Math.round(results.best_score * 100),
                robustnessScore: 0,
                consistencyScore: 0,
                overallScore: Math.round(results.best_score * 100),
                lastTested: new Date().toISOString()
            }
        });
        setSavedToLibrary(true);
    };

    const filteredDatasets = useMemo(() => {
        let list = datasets;
        if (datasetFilter !== 'all') {
            list = list.filter(d =>
                (datasetFilter === 'custom' && d.category?.toLowerCase() === 'custom') ||
                (datasetFilter === 'imported' && d.category?.toLowerCase() === 'imported')
            );
        }
        if (!searchQuery) return list;
        return list.filter(d =>
            d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            d.description?.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [datasets, searchQuery, datasetFilter]);

    const selectedDataset = useMemo(() =>
        datasets.find(d => d.id === selectedDatasetId) || null,
        [datasets, selectedDatasetId]
    );

    const datasetCount = useMemo(() => {
        try {
            const parsed = JSON.parse(datasetText);
            return Array.isArray(parsed) ? parsed.length : 0;
        } catch {
            return 0;
        }
    }, [datasetText]);

    const promptTokenApprox = useMemo(() => {
        if (!basePrompt.trim()) return 0;
        return Math.max(basePrompt.trim().split(/\s+/).filter(Boolean).length, 1);
    }, [basePrompt]);

    return (
        <div className="h-full flex gap-6 p-6 overflow-hidden">
            {showGenerator && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-8">
                    <div className="bg-[#0d0d0d] border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DatasetGenerator
                            settings={settings}
                            context="optimizer"
                            title="Generate Training Dataset"
                            description="Create examples of desired input/output pairs to train the optimizer"
                            initialPrompt={basePrompt || ''}
                            onGenerated={async (data, name) => {
                                try {
                                    const result = await api.createDataset({
                                        name: name || `Optimizer Dataset ${new Date().toLocaleDateString()}`,
                                        description: 'Generated for prompt optimization',
                                        category: 'optimizer',
                                        data
                                    });
                                    if (result?.id) {
                                        setSelectedDatasetId(result.id);
                                        setDatasetText(JSON.stringify(data, null, 2));
                                        setDatasetMode('select');
                                    }
                                    await refreshDatasets();
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

            {/* Left Column: Dataset selector */}
            <div className="w-80 flex flex-col shrink-0 gap-4">
                <div>
                    <h2 className="text-[11px] font-bold text-white/30 uppercase tracking-widest mb-1">Evaluation Dataset</h2>
                    <p className="text-xs text-white/40 mb-4 mt-1">Pick a dataset or switch to manual JSON input</p>
                </div>

                <div className="flex items-center gap-2">
                    <div className="flex flex-1 p-1 bg-black/40 rounded-lg border border-white/5">
                        <button
                            onClick={() => setDatasetMode('select')}
                            className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${datasetMode === 'select' ? 'bg-white/10 text-white shadow-sm' : 'text-white/40 hover:text-white/60'}`}
                        >
                            Select
                        </button>
                        <button
                            onClick={() => { setDatasetMode('manual'); setSelectedDatasetId(''); setDatasetText(''); setDatasetFilter('all'); }}
                            className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${datasetMode === 'manual' ? 'bg-white/10 text-white shadow-sm' : 'text-white/40 hover:text-white/60'}`}
                        >
                            Manual
                        </button>
                    </div>
                    {datasetMode === 'select' && (
                        <button
                            onClick={refreshDatasets}
                            className="px-3 py-1.5 rounded-lg text-[11px] font-medium text-white/50 hover:text-white/80 border border-white/10 bg-white/[0.02] transition-colors shrink-0"
                            title="Refresh datasets"
                        >
                            ↻
                        </button>
                    )}
                </div>

                {datasetMode === 'select' ? (
                    <>
                        <div className="flex gap-2">
                            {(['all', 'custom', 'imported'] as const).map(f => (
                                <button
                                    key={f}
                                    onClick={() => setDatasetFilter(f)}
                                    className={`flex-1 px-2 py-1.5 text-[11px] font-medium rounded-md border transition-all ${datasetFilter === f
                                        ? 'bg-white/10 text-white border-white/20 shadow-sm'
                                        : 'text-white/50 border-white/10 hover:text-white/80 hover:border-white/20'
                                        }`}
                                >
                                    {f === 'all' ? 'All' : f === 'custom' ? 'Custom' : 'Imported'}
                                </button>
                            ))}
                        </div>
                        <div className="relative group">
                            <svg className="absolute left-3 top-2.5 w-4 h-4 text-white/20 group-focus-within:text-[#007AFF] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search datasets..."
                                className="w-full bg-black/20 border border-white/5 rounded-lg pl-9 pr-3 py-2 text-sm text-white/80 placeholder:text-white/20 focus:outline-none focus:border-[#007AFF]/50 focus:bg-black/40 transition-all"
                            />
                        </div>

                        <button
                            onClick={() => setShowGenerator(true)}
                            className="w-full px-3 py-2 rounded-lg text-xs font-medium bg-[#2563EB] hover:bg-[#1d4fd8] text-white transition-colors shadow-lg shadow-blue-500/10"
                        >
                            Generate Dataset
                        </button>

                        <div className="flex-1 overflow-y-auto min-h-0 space-y-2 pr-1 custom-scrollbar">
                            {filteredDatasets.length === 0 ? (
                                <div className="text-center py-8 text-white/30 text-xs">
                                    No datasets found
                                </div>
                            ) : (
                                filteredDatasets.map(ds => (
                                    <button
                                        key={ds.id}
                                        onClick={() => handleDatasetSelect(ds.id)}
                                        className={`w-full text-left p-3 rounded-xl border transition-all group ${selectedDatasetId === ds.id
                                            ? 'bg-[#007AFF]/10 border-[#007AFF]/30'
                                            : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.04] hover:border-white/10'
                                            }`}
                                    >
                                        <div className="flex justify-between items-start mb-1 gap-2">
                                            <div className="flex items-center gap-2 min-w-0">
                                                <div className="w-6 h-6 rounded-md bg-white/[0.04] border border-white/10 flex items-center justify-center text-white/60">
                                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
                                                </div>
                                                <div className="min-w-0">
                                                    <span className={`text-sm font-medium truncate ${selectedDatasetId === ds.id ? 'text-white' : 'text-white/80'}`}>
                                                        {ds.name}
                                                    </span>
                                                    <div className="text-[11px] text-white/40 truncate">{ds.description}</div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${selectedDatasetId === ds.id
                                                    ? 'bg-[#007AFF]/20 text-[#007AFF] border-[#007AFF]/20'
                                                    : 'bg-white/5 text-white/30 border-white/5'
                                                    }`}>
                                                    {ds.size}
                                                </span>
                                                {ds.category && (
                                                    <span className="text-[10px] text-white/40 border border-white/10 px-1.5 py-0.5 rounded-md capitalize">{ds.category}</span>
                                                )}
                                            </div>
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                    </>
                ) : (
                    <div className="flex-1 rounded-2xl border border-dashed border-white/10 bg-white/[0.03] p-4">
                        <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white/40">✎</div>
                            <div className="space-y-1">
                                <p className="text-sm text-white/80 font-medium">Manual dataset mode</p>
                                <p className="text-[11px] text-white/45 leading-relaxed">
                                    Paste or edit your JSON directly in the Dataset JSON editor in the middle panel.
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Middle Column: Prompt + actions */}
            <div className="flex-1 min-w-0 bg-black/20 border border-white/5 rounded-2xl overflow-hidden flex flex-col">
                <div className="px-6 py-5 border-b border-white/5 bg-white/[0.02] flex items-start justify-between gap-4">
                    <div>
                        <h2 className="text-xl font-semibold text-white/90">Prompt Optimizer</h2>
                        <p className="text-xs text-white/45">Optimize your baseline prompt against the selected dataset.</p>
                    </div>
                    <div className="text-[11px] px-2 py-1 rounded-md border border-white/10 text-white/50 bg-black/30">
                        {settings.provider} · {settings.model}
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    <div className="flex-1 flex flex-col space-y-2">
                        <div className="flex items-center justify-between">
                            <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Baseline Prompt</label>
                            <span className="text-[11px] text-white/40">Starting point for improvements</span>
                        </div>
                        <textarea
                            value={basePrompt}
                            onChange={(e) => setBasePrompt(e.target.value)}
                            className="w-full flex-1 bg-black/30 border border-white/5 rounded-xl px-4 py-3 text-sm text-white/90 placeholder:text-white/30 resize-none focus:outline-none focus:border-white/15 hover:border-white/15 min-h-[360px] lg:min-h-[420px]"
                            placeholder="Enter your starting prompt to optimize..."
                        />
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                            <div className="flex items-center gap-3 text-[11px] text-white/50">
                                <span className="font-mono">{promptTokenApprox} tokens (approx)</span>
                                <span className="text-white/50">
                                    {datasetText ? `${datasetCount} pairs loaded` : 'Add a dataset to score variants'}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setShowDatasetJson(!showDatasetJson)}
                                    className="text-[11px] px-3 py-1.5 rounded-md border border-white/10 text-white/70 hover:text-white hover:border-white/20 transition-colors"
                                >
                                    {showDatasetJson ? 'Hide JSON' : 'Show JSON'}
                                </button>
                                <button
                                    onClick={handleRun}
                                    disabled={isRunning || !basePrompt || !datasetText}
                                    className={`px-6 py-2 rounded-xl text-sm font-semibold transition-all shadow-lg shadow-blue-500/10 ${isRunning || !basePrompt || !datasetText
                                        ? 'bg-[#2563EB]/50 text-white/50 cursor-not-allowed'
                                        : 'bg-[#2563EB] hover:bg-[#1d4fd8] text-white'
                                        }`}
                                >
                                    {isRunning ? 'Optimizing...' : 'Optimize'}
                                </button>
                            </div>
                        </div>
                        {showDatasetJson && (
                            <textarea
                                value={datasetText}
                                onChange={(e) => { setDatasetText(e.target.value); if (datasetMode === 'select' && !e.target.value) { setSelectedDatasetId(''); } }}
                                className="w-full min-h-[200px] bg-black/30 border border-white/5 rounded-xl px-4 py-3 text-xs font-mono text-white/90 placeholder:text-white/25 leading-relaxed resize-none focus:outline-none focus:border-white/15 hover:border-white/15"
                                placeholder={`[\n  {"input": "...", "output": "..."},\n  {"input": "...", "output": "..."}\n]`}
                            />
                        )}
                    </div>
                </div>
            </div>

            {/* Right Column: Results */}
            <div className="w-[380px] bg-[#0a0a0a] border border-white/10 rounded-2xl flex flex-col shrink-0 overflow-hidden">
                <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                    <div>
                        <h2 className="text-sm font-semibold text-white/80">Optimization Results</h2>
                        <p className="text-[10px] text-white/40">Best prompt and candidates</p>
                    </div>
                    {results && (
                        <span className="text-xs text-emerald-400/80 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                            {(results.best_score * 100).toFixed(0)}% best
                        </span>
                    )}
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {isRunning ? (
                        <div className="flex flex-col items-center justify-center py-16 text-white/40">
                            <svg className="animate-spin h-8 w-8 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span className="text-sm">Optimizing prompt...</span>
                            <span className="text-xs text-white/20 mt-1">This may take 1-2 minutes</span>
                        </div>
                    ) : error ? (
                        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm flex items-start gap-2">
                            <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            <span>{error}</span>
                        </div>
                    ) : !results ? (
                        <div className="flex flex-col items-center justify-center py-20 text-white/35 text-center gap-2">
                            <span className="text-sm">No prompts generated yet</span>
                            <span className="text-xs text-white/30">Enter your baseline and dataset, then run Optimize</span>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="border border-emerald-500/20 rounded-xl p-4 bg-emerald-500/5">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
                                            <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                        </div>
                                        <span className="text-sm font-medium text-emerald-400">Best Prompt</span>
                                    </div>
                                    <span className="text-lg font-bold text-emerald-400">{(results.best_score * 100).toFixed(0)}%</span>
                                </div>
                                <div className="text-[13px] text-white/80 whitespace-pre-wrap font-mono bg-black/30 p-3 rounded-lg border border-white/5 leading-relaxed max-h-[300px] overflow-y-auto">
                                    {results.best_prompt}
                                </div>
                                {results.improvement > 0 && (
                                    <div className="mt-2 text-xs text-emerald-400/70 flex items-center gap-1.5">
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                                        +{(results.improvement * 100).toFixed(1)}% improvement
                                    </div>
                                )}
                                <button
                                    onClick={handleSaveToLibrary}
                                    disabled={savedToLibrary}
                                    className={`mt-3 w-full py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${savedToLibrary
                                        ? 'bg-white/5 text-emerald-400 border border-emerald-500/20'
                                        : 'bg-white/10 hover:bg-white/15 text-white border border-white/10'
                                        }`}
                                >
                                    {savedToLibrary ? (
                                        <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg> Saved to Library</>
                                    ) : (
                                        <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg> Save to Library</>
                                    )}
                                </button>
                            </div>

                            {results.candidates && results.candidates.length > 0 && (
                                <div className="space-y-2">
                                    <h4 className="text-[10px] font-bold text-white/30 uppercase tracking-widest px-1">All Candidates</h4>
                                    {results.candidates.map((candidate: any, idx: number) => (
                                        <div key={idx} className="border border-white/10 rounded-lg p-3 bg-white/5 hover:bg-white/[0.07] transition-all">
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="text-[10px] font-mono text-white/40 bg-black/30 px-2 py-0.5 rounded">#{idx + 1}</span>
                                                <span className={`text-sm font-bold ${candidate.score > 0.8 ? 'text-emerald-400' : candidate.score > 0.5 ? 'text-yellow-400' : 'text-white/50'}`}>
                                                    {(candidate.score * 100).toFixed(0)}%
                                                </span>
                                            </div>
                                            <div className="text-xs text-white/50 line-clamp-2">{candidate.prompt}</div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
