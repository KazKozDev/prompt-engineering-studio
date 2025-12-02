import { useState, useEffect, useMemo } from 'react';
import { api } from '../services/api';
import { savePromptToLibrary, type LibraryPrompt } from './PromptLibrary';
import { loadAllDatasets, getDatasetById, type Dataset } from './Datasets';
import { DatasetGenerator } from './DatasetGenerator';
import { Button } from './ui/Button';

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
    const [searchQuery, setSearchQuery] = useState('');
    const [showGenerator, setShowGenerator] = useState(false);
    const [showLibraryPicker, setShowLibraryPicker] = useState(false);
    const [showDatasetPicker, setShowDatasetPicker] = useState(false);
    const [libraryPrompts, setLibraryPrompts] = useState<LibraryPrompt[]>([]);
    const [librarySearch, setLibrarySearch] = useState('');
    const [datasetPickerSearch, setDatasetPickerSearch] = useState('');

    const refreshDatasets = async () => {
        const allDatasets = await loadAllDatasets();
        setDatasets(allDatasets);
    };

    useEffect(() => {
        refreshDatasets();
        loadLibraryPrompts();
    }, []);

    const loadLibraryPrompts = () => {
        try {
            const saved = localStorage.getItem('prompt-library');
            if (saved) {
                setLibraryPrompts(JSON.parse(saved));
            }
        } catch (e) {
            console.error('Error loading library prompts:', e);
        }
    };

    const filteredLibraryPrompts = useMemo(() => {
        if (!librarySearch) return libraryPrompts;
        const query = librarySearch.toLowerCase();
        return libraryPrompts.filter(p =>
            p.name.toLowerCase().includes(query) ||
            p.text.toLowerCase().includes(query) ||
            p.tags.some(t => t.toLowerCase().includes(query))
        );
    }, [libraryPrompts, librarySearch]);

    const filteredPickerDatasets = useMemo(() => {
        if (!datasetPickerSearch) return datasets;
        const query = datasetPickerSearch.toLowerCase();
        return datasets.filter(d =>
            d.name.toLowerCase().includes(query) ||
            d.description?.toLowerCase().includes(query)
        );
    }, [datasets, datasetPickerSearch]);

    const handleSelectFromLibrary = (prompt: LibraryPrompt) => {
        setBasePrompt(prompt.text);
        setShowLibraryPicker(false);
        setLibrarySearch('');
    };

    const handleSelectDatasetFromPicker = async (dataset: Dataset) => {
        setSelectedDatasetId(dataset.id);
        if (dataset.data) {
            setDatasetText(JSON.stringify(dataset.data, null, 2));
        } else {
            const fullDataset = await getDatasetById(dataset.id);
            if (fullDataset?.data) {
                setDatasetText(JSON.stringify(fullDataset.data, null, 2));
            }
        }
        setShowDatasetPicker(false);
        setDatasetPickerSearch('');
    };

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

    const handleSaveToLibrary = async () => {
        if (!results) return;

        // Generate title using local model (fast, no API needed)
        let title = basePrompt.length > 50 ? `${basePrompt.substring(0, 50)}...` : basePrompt;
        try {
            const response = await api.generateTitle({
                prompt_text: results.best_prompt,
                provider: 'local',
                model: 'google/flan-t5-small',
            });
            if (response.title) {
                title = response.title;
            }
        } catch (error) {
            console.error('Failed to generate title, using fallback:', error);
        }

        savePromptToLibrary({
            name: title,
            text: results.best_prompt,
            technique: 'optimizer',
            techniqueName: 'Auto-Optimized',
            status: 'testing',
            category: 'General',
            tags: ['optimized', 'auto-generated'],
            description: `Optimized prompt. Score: ${(results.best_score * 100).toFixed(1)}%`,
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
        if (!searchQuery) return datasets;
        return datasets.filter(d =>
            d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            d.description?.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [datasets, searchQuery]);

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
                    <p className="text-xs text-white/40 mb-4 mt-1">Select a dataset or paste JSON below</p>
                </div>

                <div className="relative group">
                    <svg className="absolute left-3 top-2.5 w-4 h-4 text-white/20 group-focus-within:text-white/40 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search datasets..."
                        className="w-full bg-black/20 border border-white/5 rounded-lg pl-9 pr-9 py-2 text-sm text-white/80 placeholder:text-white/20 focus:outline-none focus:border-white/20 focus:bg-black/40 transition-all"
                    />
                </div>

                <Button
                    onClick={() => setShowGenerator(true)}
                    variant="primary"
                    size="sm"
                    className="text-sm font-medium px-4 self-start min-w-[140px]"
                >
                    Generate Dataset
                </Button>

                <div className="flex-1 overflow-y-auto min-h-0 space-y-1.5 pr-1 custom-scrollbar">
                    {filteredDatasets.length === 0 ? (
                        <div className="text-center py-8 text-white/30 text-xs">
                            No datasets found
                        </div>
                    ) : (
                        filteredDatasets.map(ds => (
                            <button
                                key={ds.id}
                                onClick={() => handleDatasetSelect(ds.id)}
                                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg border transition-all ${selectedDatasetId === ds.id
                                    ? 'bg-white/10 border-white/20'
                                    : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.05] hover:border-white/10'
                                    }`}
                            >
                                <span className={`text-[13px] font-medium truncate ${selectedDatasetId === ds.id ? 'text-white' : 'text-white/70'}`}>
                                    {ds.name}
                                </span>
                                <span className={`text-[10px] min-w-[24px] h-5 px-1.5 rounded-md flex items-center justify-center shrink-0 font-mono ${selectedDatasetId === ds.id
                                    ? 'bg-white/20 text-white'
                                    : 'bg-white/5 text-white/40'
                                    }`}>
                                    {ds.size}
                                </span>
                            </button>
                        ))
                    )}
                </div>
            </div>

            {/* Middle Column: Prompt + actions */}
            <div className="flex-1 min-w-0 bg-black/20 border border-white/5 rounded-2xl overflow-hidden flex flex-col">
                <div className="px-6 py-5 border-b border-white/5 bg-white/[0.02] flex items-start justify-between gap-4">
                    <div>
                        <h2 className="text-xl font-semibold text-white/90">Prompt Optimizer</h2>
                        <p className="text-xs text-white/45">Optimize your baseline prompt against the selected dataset.</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="text-[11px] px-2 py-1 rounded-md border border-white/10 text-white/50 bg-black/30">
                            {settings.provider} · {settings.model}
                        </div>
                        <Button
                            onClick={() => {
                                refreshDatasets();
                                setShowDatasetPicker(true);
                            }}
                            variant="secondary"
                            size="xs"
                            className="inline-flex items-center gap-1 text-[11px] text-white/50"
                        >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" /></svg>
                            Datasets
                        </Button>
                        <Button
                            onClick={() => {
                                loadLibraryPrompts();
                                setShowLibraryPicker(true);
                            }}
                            variant="secondary"
                            size="xs"
                            className="inline-flex items-center gap-1 text-[11px] text-white/50"
                        >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                            Library
                        </Button>
                    </div>
                </div>

                <div className="flex-1 flex flex-col p-6 gap-4 overflow-hidden">
                    <div className="flex-1 flex flex-col min-h-0">
                        <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2">Baseline Prompt</label>
                        <textarea
                            value={basePrompt}
                            onChange={(e) => setBasePrompt(e.target.value)}
                        className="w-full flex-1 bg-black/30 border border-white/5 rounded-xl px-4 py-3 text-sm text-white/90 placeholder:text-white/30 resize-none focus:outline-none focus:border-white/15 hover:border-white/15 custom-scrollbar custom-scrollbar-tight overflow-auto"
                            placeholder="Enter your starting prompt to optimize..."
                        />
                    </div>

                    <div className="flex-1 flex flex-col min-h-0">
                        <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2">Dataset</label>
                        <textarea
                            value={datasetText}
                            onChange={(e) => { setDatasetText(e.target.value); if (selectedDatasetId && !e.target.value) { setSelectedDatasetId(''); } }}
                            className="w-full flex-1 bg-black/30 border border-white/5 rounded-xl px-4 py-3 text-xs font-mono text-white/90 placeholder:text-white/25 leading-relaxed resize-none focus:outline-none focus:border-white/15 hover:border-white/15 custom-scrollbar custom-scrollbar-tight overflow-auto"
                            placeholder='[{"input": "...", "output": "..."}]'
                        />
                    </div>

                    <div className="flex items-center gap-3 flex-wrap shrink-0">
                        <Button
                            onClick={handleRun}
                            disabled={isRunning || !basePrompt || !datasetText}
                            variant="primary"
                            size="sm"
                            className={`min-w-[140px] ${isRunning || !basePrompt || !datasetText ? 'opacity-60 cursor-not-allowed' : ''}`}
                        >
                            {isRunning ? 'Optimizing...' : 'Optimize'}
                        </Button>
                        <div className="flex items-center gap-3 text-[11px] text-white/50 ml-auto">
                            <span className="font-mono">{promptTokenApprox} tokens (approx)</span>
                            <span className="text-white/50">
                                {datasetText ? `${datasetCount} pairs loaded` : 'Add a dataset to score variants'}
                            </span>
                        </div>
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
                        <span className="text-xs text-white/60 bg-white/10 px-2 py-0.5 rounded-full border border-white/20">
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
                            <div className="border border-white/20 rounded-xl p-4 bg-white/5">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                                            <svg className="w-3.5 h-3.5 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                        </div>
                                        <span className="text-sm font-medium text-white/70">Best Prompt</span>
                                    </div>
                                    <span className="text-lg font-bold text-white/70">{(results.best_score * 100).toFixed(0)}%</span>
                                </div>
                                <div className="text-[13px] text-white/80 whitespace-pre-wrap font-mono bg-black/30 p-3 rounded-lg border border-white/5 leading-relaxed max-h-[300px] overflow-y-auto">
                                    {results.best_prompt}
                                </div>
                                {results.improvement > 0 && (
                                    <div className="mt-2 text-xs text-white/60 flex items-center gap-1.5">
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                                        +{(results.improvement * 100).toFixed(1)}% improvement
                                    </div>
                                )}
                                <Button
                                    onClick={handleSaveToLibrary}
                                    disabled={savedToLibrary}
                                    variant="secondary"
                                    size="sm"
                                    fullWidth
                                    className={`mt-3 gap-2 ${savedToLibrary ? 'bg-white/5 text-white/70 border-emerald-500/30' : ''}`}
                                >
                                    {savedToLibrary ? (
                                        <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg> Saved to Library</>
                                    ) : (
                                        <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg> Save to Library</>
                                    )}
                                </Button>
                            </div>

                            {results.candidates && results.candidates.length > 0 && (
                                <div className="space-y-2">
                                    <h4 className="text-[10px] font-bold text-white/30 uppercase tracking-widest px-1">All Candidates</h4>
                                    {results.candidates.map((candidate: any, idx: number) => (
                                        <div key={idx} className="border border-white/10 rounded-lg p-3 bg-white/5 hover:bg-white/[0.07] transition-all">
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="text-[10px] font-mono text-white/40 bg-black/30 px-2 py-0.5 rounded">#{idx + 1}</span>
                                                <span className={`text-sm font-bold ${candidate.score > 0.8 ? 'text-white/70' : candidate.score > 0.5 ? 'text-yellow-400' : 'text-white/50'}`}>
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

            {/* Library Picker Modal */}
            {showLibraryPicker && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowLibraryPicker(false)}>
                    <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
                        <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-semibold text-white">Select from Library</h3>
                                <p className="text-xs text-white/40 mt-1">Choose a prompt as your baseline</p>
                            </div>
                            <Button onClick={() => setShowLibraryPicker(false)} variant="ghost" size="icon" className="p-2 text-white/60 hover:text-white">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </Button>
                        </div>
                        <div className="px-5 py-3 border-b border-white/5">
                            <div className="relative">
                                <svg className="absolute left-3 top-2.5 w-4 h-4 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                                <input
                                    type="text"
                                    value={librarySearch}
                                    onChange={(e) => setLibrarySearch(e.target.value)}
                                    placeholder="Search prompts..."
                                    className="w-full bg-black/30 border border-white/10 rounded-lg pl-9 pr-3 py-2 text-sm text-white/80 placeholder:text-white/30 focus:outline-none focus:border-white/20"
                                    autoFocus
                                />
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-0">
                            {filteredLibraryPrompts.length === 0 ? (
                                <div className="text-center py-12 text-white/30 text-sm">
                                    {libraryPrompts.length === 0 ? 'Your library is empty. Generate some prompts first!' : 'No prompts match your search'}
                                </div>
                            ) : (
                                filteredLibraryPrompts.map((prompt) => (
                                    <button
                                        key={prompt.id}
                                        onClick={() => handleSelectFromLibrary(prompt)}
                                        className="w-full text-left p-4 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.06] hover:border-white/15 transition-all group"
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex-1 min-w-0">
                                                <div className="text-sm font-medium text-white/90 truncate group-hover:text-white">{prompt.name}</div>
                                                <div className="text-[11px] text-white/40 mt-0.5">{prompt.techniqueName || prompt.technique} • {prompt.category}</div>
                                            </div>
                                            <div className="flex items-center gap-2 shrink-0">
                                                <span className="text-[10px] px-2 py-0.5 rounded bg-white/5 text-white/40">{prompt.tags[0]}</span>
                                                <span className="text-[10px] px-2 py-0.5 rounded bg-white/5 text-white/40">{prompt.category.toLowerCase().replace(' ', '_')}</span>
                                            </div>
                                        </div>
                                        <div className="text-[12px] text-white/50 line-clamp-2 font-mono leading-relaxed mt-2">
                                            {prompt.text.substring(0, 120)}...
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                        <div className="px-5 py-3 border-t border-white/5 text-[11px] text-white/40 flex justify-between">
                            <span>{filteredLibraryPrompts.length} prompts available</span>
                            <span>Click to select</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Dataset Picker Modal */}
            {showDatasetPicker && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowDatasetPicker(false)}>
                    <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
                        <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-semibold text-white">Select Dataset</h3>
                                <p className="text-xs text-white/40 mt-1">Choose a dataset for optimization</p>
                            </div>
                            <Button onClick={() => setShowDatasetPicker(false)} variant="ghost" size="icon" className="p-2 text-white/60 hover:text-white">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </Button>
                        </div>
                        <div className="px-5 py-3 border-b border-white/5">
                            <div className="relative">
                                <svg className="absolute left-3 top-2.5 w-4 h-4 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                                <input
                                    type="text"
                                    value={datasetPickerSearch}
                                    onChange={(e) => setDatasetPickerSearch(e.target.value)}
                                    placeholder="Search datasets..."
                                    className="w-full bg-black/30 border border-white/10 rounded-lg pl-9 pr-3 py-2 text-sm text-white/80 placeholder:text-white/30 focus:outline-none focus:border-white/20"
                                    autoFocus
                                />
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-0">
                            {filteredPickerDatasets.length === 0 ? (
                                <div className="text-center py-12 text-white/30 text-sm">
                                    {datasets.length === 0 ? 'No datasets available. Create one first!' : 'No datasets match your search'}
                                </div>
                            ) : (
                                filteredPickerDatasets.map((dataset) => (
                                    <button
                                        key={dataset.id}
                                        onClick={() => handleSelectDatasetFromPicker(dataset)}
                                        className="w-full text-left p-4 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.06] hover:border-white/15 transition-all group"
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex-1 min-w-0">
                                                <div className="text-sm font-medium text-white/90 truncate group-hover:text-white">{dataset.name}</div>
                                                <div className="text-[11px] text-white/40 mt-0.5">{dataset.description || 'No description'}</div>
                                            </div>
                                            <div className="flex items-center gap-2 shrink-0">
                                                <span className="text-[10px] px-2 py-0.5 rounded bg-white/5 text-white/40">{dataset.size} items</span>
                                                <span className="text-[10px] px-2 py-0.5 rounded bg-white/5 text-white/40">{dataset.category}</span>
                                            </div>
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                        <div className="px-5 py-3 border-t border-white/5 text-[11px] text-white/40 flex justify-between">
                            <span>{filteredPickerDatasets.length} datasets available</span>
                            <span>Click to select</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
