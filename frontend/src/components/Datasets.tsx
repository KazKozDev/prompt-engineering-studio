import { useState, useEffect, useMemo } from 'react';
import { api } from '../services/api';

export interface Dataset {
    id: string;
    name: string;
    description: string;
    category: string;
    size: number;
    data?: DatasetItem[];
    createdAt: string;
    updatedAt: string;
}

export interface DatasetItem {
    input: string;
    output: string;
}

// Helper to load datasets for use in other components
export async function loadAllDatasets(): Promise<Dataset[]> {
    try {
        const response = await api.listDatasets();
        return response.datasets || [];
    } catch (error) {
        console.error('Error loading datasets:', error);
        return [];
    }
}

export async function getDatasetById(id: string): Promise<Dataset | null> {
    try {
        return await api.getDataset(id);
    } catch (error) {
        console.error('Error loading dataset:', error);
        return null;
    }
}

export function Datasets() {
    const [datasets, setDatasets] = useState<Dataset[]>([]);
    const [examples, setExamples] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'my-datasets' | 'examples'>('my-datasets');
    const [selectedDatasetId, setSelectedDatasetId] = useState<string | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // Create form state
    const [newDatasetName, setNewDatasetName] = useState('');
    const [newDatasetDescription, setNewDatasetDescription] = useState('');
    const [newDatasetItems, setNewDatasetItems] = useState<DatasetItem[]>([
        { input: '', output: '' }
    ]);

    // Detailed dataset view state
    const [detailedDataset, setDetailedDataset] = useState<Dataset | null>(null);
    const [loadingDetail, setLoadingDetail] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    // Load detailed dataset when selection changes
    useEffect(() => {
        if (selectedDatasetId && !isCreating) {
            loadDatasetDetail(selectedDatasetId);
        } else {
            setDetailedDataset(null);
        }
    }, [selectedDatasetId, isCreating]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [datasetsRes, examplesRes] = await Promise.all([
                api.listDatasets(),
                api.getExampleDatasets()
            ]);
            setDatasets(datasetsRes.datasets || []);
            setExamples(examplesRes.examples || []);
        } catch (error) {
            console.error('Error loading datasets:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadDatasetDetail = async (id: string) => {
        setLoadingDetail(true);
        try {
            // Check if it's an example first (they are loaded in memory)
            const example = examples.find(e => e.id === id);
            if (example) {
                setDetailedDataset(example);
            } else {
                const dataset = await api.getDataset(id);
                setDetailedDataset(dataset);
            }
        } catch (error) {
            console.error('Error loading dataset detail:', error);
        } finally {
            setLoadingDetail(false);
        }
    };

    const filteredList = useMemo(() => {
        const list = activeTab === 'my-datasets' ? datasets : examples;
        if (!searchQuery) return list;
        return list.filter(d =>
            d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            d.description?.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [activeTab, datasets, examples, searchQuery]);

    const handleCreateDataset = async () => {
        if (!newDatasetName.trim()) {
            alert('Please enter a dataset name');
            return;
        }

        const validItems = newDatasetItems.filter(item => item.input.trim() && item.output.trim());
        if (validItems.length === 0) {
            alert('Please add at least one input/output pair');
            return;
        }

        try {
            await api.createDataset({
                name: newDatasetName,
                description: newDatasetDescription,
                category: 'custom',
                data: validItems
            });

            // Reset form
            setNewDatasetName('');
            setNewDatasetDescription('');
            setNewDatasetItems([{ input: '', output: '' }]);
            setIsCreating(false);
            setActiveTab('my-datasets');

            // Reload datasets
            await loadData();
        } catch (error: any) {
            alert(`Error creating dataset: ${error.message}`);
        }
    };

    const handleDeleteDataset = async (datasetId: string) => {
        if (!confirm('Are you sure you want to delete this dataset?')) {
            return;
        }

        try {
            await api.deleteDataset(datasetId);
            await loadData();
            if (selectedDatasetId === datasetId) {
                setSelectedDatasetId(null);
                setDetailedDataset(null);
            }
        } catch (error: any) {
            alert(`Error deleting dataset: ${error.message}`);
        }
    };

    const handleImportExample = async (exampleId: string) => {
        try {
            const example = examples.find(e => e.id === exampleId);
            if (!example) return;

            await api.createDataset({
                name: `${example.name} (Copy)`,
                description: example.description,
                category: 'imported',
                data: example.data
            });

            setActiveTab('my-datasets');
            await loadData();
        } catch (error: any) {
            alert(`Error importing example: ${error.message}`);
        }
    };

    const addDatasetItem = () => {
        setNewDatasetItems([...newDatasetItems, { input: '', output: '' }]);
    };

    const removeDatasetItem = (index: number) => {
        setNewDatasetItems(newDatasetItems.filter((_, i) => i !== index));
    };

    const updateDatasetItem = (index: number, field: 'input' | 'output', value: string) => {
        const updated = [...newDatasetItems];
        updated[index][field] = value;
        setNewDatasetItems(updated);
    };

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        try {
            const text = await file.text();
            const data = JSON.parse(text);

            if (!Array.isArray(data)) {
                alert('Invalid format: file must contain an array of objects');
                return;
            }

            const validData = data.filter(item =>
                item.input && item.output &&
                typeof item.input === 'string' &&
                typeof item.output === 'string'
            );

            if (validData.length === 0) {
                alert('No valid input/output pairs found in file');
                return;
            }

            setNewDatasetItems(validData);
            setNewDatasetName(file.name.replace('.json', ''));
            setIsCreating(true);
            setActiveTab('my-datasets'); // Switch to my datasets context for creation
        } catch (error) {
            alert('Error parsing file. Please ensure it\'s valid JSON.');
        }
    };

    if (loading) {
        return (
            <div className="h-full flex items-center justify-center">
                <div className="flex flex-col items-center text-white/40">
                    <svg className="animate-spin h-8 w-8 mb-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span className="text-sm">Loading datasets...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full flex gap-6 p-6 overflow-hidden">
            {/* Left Sidebar: List */}
            <div className="w-80 flex flex-col shrink-0 gap-4">
                {/* Header & Actions */}
                <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-[11px] font-bold text-white/30 uppercase tracking-widest">DATASETS</h2>
                        <button
                            onClick={() => { setIsCreating(true); setSelectedDatasetId(null); }}
                            className="p-2 rounded-lg bg-[#007AFF]/10 text-[#007AFF] hover:bg-[#007AFF]/20 transition-colors"
                            title="New Dataset"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                        </button>
                    </div>

                    {/* Tabs */}
                    <div className="flex p-1 bg-black/40 rounded-lg border border-white/5">
                        <button
                            onClick={() => { setActiveTab('my-datasets'); setSelectedDatasetId(null); setIsCreating(false); }}
                            className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${activeTab === 'my-datasets' ? 'bg-white/10 text-white shadow-sm' : 'text-white/40 hover:text-white/60'}`}
                        >
                            My Datasets
                        </button>
                        <button
                            onClick={() => { setActiveTab('examples'); setSelectedDatasetId(null); setIsCreating(false); }}
                            className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${activeTab === 'examples' ? 'bg-white/10 text-white shadow-sm' : 'text-white/40 hover:text-white/60'}`}
                        >
                            Examples
                        </button>
                    </div>

                    {/* Search */}
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
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto min-h-0 space-y-2 pr-2 custom-scrollbar">
                    {filteredList.map(dataset => (
                        <button
                            key={dataset.id}
                            onClick={() => { setSelectedDatasetId(dataset.id); setIsCreating(false); }}
                            className={`w-full text-left p-3 rounded-xl border transition-all group ${selectedDatasetId === dataset.id
                                ? 'bg-[#007AFF]/10 border-[#007AFF]/30'
                                : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.04] hover:border-white/10'
                                }`}
                        >
                            <div className="flex justify-between items-start mb-1">
                                <span className={`text-sm font-medium truncate ${selectedDatasetId === dataset.id ? 'text-white' : 'text-white/80'}`}>
                                    {dataset.name}
                                </span>
                                <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${selectedDatasetId === dataset.id
                                    ? 'bg-[#007AFF]/20 text-[#007AFF] border-[#007AFF]/20'
                                    : 'bg-white/5 text-white/30 border-white/5'
                                    }`}>
                                    {dataset.size}
                                </span>
                            </div>
                            {dataset.description && (
                                <p className="text-xs text-white/40 line-clamp-2">{dataset.description}</p>
                            )}
                        </button>
                    ))}

                    {filteredList.length === 0 && (
                        <div className="text-center py-8 text-white/20 text-xs">
                            No datasets found
                        </div>
                    )}
                </div>
            </div>

            {/* Middle Panel: Content */}
            <div className="flex-1 min-w-0 bg-black/20 border border-white/5 rounded-2xl overflow-hidden flex flex-col relative">
                {isCreating ? (
                    // Create Form
                    <div className="flex flex-col h-full">
                        <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                            <div>
                                <h2 className="text-lg font-semibold text-white/90">Create New Dataset</h2>
                                <p className="text-xs text-white/40">Add input/output pairs manually or upload JSON</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <label className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-medium text-white/70 transition-all border border-white/10 cursor-pointer">
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                                    Upload JSON
                                    <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
                                </label>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-xs font-medium text-white/50 mb-2">Dataset Name</label>
                                    <input
                                        type="text"
                                        value={newDatasetName}
                                        onChange={(e) => setNewDatasetName(e.target.value)}
                                        className="w-full rounded-lg border border-white/10 bg-black/40 px-4 py-2.5 text-sm text-white/90 placeholder:text-white/20 focus:outline-none focus:border-[#007AFF]/30 transition-colors"
                                        placeholder="e.g., Customer Support FAQ"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-white/50 mb-2">Description</label>
                                    <input
                                        type="text"
                                        value={newDatasetDescription}
                                        onChange={(e) => setNewDatasetDescription(e.target.value)}
                                        className="w-full rounded-lg border border-white/10 bg-black/40 px-4 py-2.5 text-sm text-white/90 placeholder:text-white/20 focus:outline-none focus:border-[#007AFF]/30 transition-colors"
                                        placeholder="Brief description..."
                                    />
                                </div>
                            </div>

                            <div>
                                <div className="flex justify-between items-center mb-3">
                                    <label className="text-xs font-medium text-white/50">Input/Output Pairs ({newDatasetItems.length})</label>
                                    <button onClick={addDatasetItem} className="text-xs text-[#007AFF] hover:text-[#0071E3] font-medium">+ Add Item</button>
                                </div>

                                <div className="space-y-3">
                                    {newDatasetItems.map((item, index) => (
                                        <div key={index} className="bg-black/30 p-4 rounded-xl border border-white/5 group hover:border-white/10 transition-colors">
                                            <div className="flex justify-between items-center mb-3">
                                                <span className="text-[10px] text-white/30 font-mono">#{index + 1}</span>
                                                {newDatasetItems.length > 1 && (
                                                    <button onClick={() => removeDatasetItem(index)} className="text-[10px] text-red-400/50 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all">Remove</button>
                                                )}
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-1">
                                                    <label className="text-[10px] text-white/30 uppercase tracking-wider">Input</label>
                                                    <textarea
                                                        value={item.input}
                                                        onChange={(e) => updateDatasetItem(index, 'input', e.target.value)}
                                                        className="w-full rounded-lg border border-white/5 bg-black/40 px-3 py-2 text-sm text-white/90 placeholder:text-white/20 focus:outline-none focus:border-white/20 min-h-[80px] resize-none"
                                                        placeholder="Enter input prompt..."
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-[10px] text-white/30 uppercase tracking-wider">Output</label>
                                                    <textarea
                                                        value={item.output}
                                                        onChange={(e) => updateDatasetItem(index, 'output', e.target.value)}
                                                        className="w-full rounded-lg border border-white/5 bg-black/40 px-3 py-2 text-sm text-white/90 placeholder:text-white/20 focus:outline-none focus:border-white/20 min-h-[80px] resize-none"
                                                        placeholder="Enter expected output..."
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="p-6 border-t border-white/5 bg-black/20 flex justify-end gap-3">
                            <button
                                onClick={() => setIsCreating(false)}
                                className="px-4 py-2 text-sm font-medium text-white/60 hover:text-white transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCreateDataset}
                                className="px-6 py-2 bg-[#007AFF] hover:bg-[#0071E3] text-white rounded-lg text-sm font-semibold shadow-lg shadow-blue-500/20 transition-all"
                            >
                                Create Dataset
                            </button>
                        </div>
                    </div>
                ) : detailedDataset ? (
                    // Detailed View
                    <div className="flex flex-col h-full">
                        <div className="px-6 py-5 border-b border-white/5 bg-white/[0.02] flex justify-between items-start">
                            <div>
                                <div className="flex items-center gap-3 mb-1">
                                    <h2 className="text-xl font-semibold text-white/90">{detailedDataset.name}</h2>
                                    <span className="text-[10px] font-mono text-white/30 bg-white/5 px-2 py-0.5 rounded-full border border-white/5">
                                        {detailedDataset.category}
                                    </span>
                                </div>
                                <p className="text-sm text-white/50">{detailedDataset.description || 'No description provided'}</p>
                            </div>
                            <div className="flex gap-2">
                                {activeTab === 'examples' ? (
                                    <button
                                        onClick={() => handleImportExample(detailedDataset.id)}
                                        className="px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded-lg text-sm font-medium transition-all flex items-center gap-2"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
                                        Import to My Datasets
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => handleDeleteDataset(detailedDataset.id)}
                                        className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-lg text-sm font-medium transition-all flex items-center gap-2"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                        Delete
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6">
                            {loadingDetail ? (
                                <div className="flex items-center justify-center h-40 text-white/30">
                                    <svg className="animate-spin h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                    Loading details...
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {detailedDataset.data?.map((item, index) => (
                                        <div key={index} className="bg-white/[0.02] p-4 rounded-xl border border-white/5 hover:bg-white/[0.04] transition-colors">
                                            <div className="text-[10px] text-white/20 font-mono mb-3">#{index + 1}</div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div>
                                                    <div className="text-[10px] text-white/40 uppercase tracking-wider mb-2 font-medium">Input</div>
                                                    <div className="text-sm text-white/80 leading-relaxed whitespace-pre-wrap font-mono bg-black/20 p-3 rounded-lg border border-white/5">
                                                        {item.input}
                                                    </div>
                                                </div>
                                                <div>
                                                    <div className="text-[10px] text-emerald-400/40 uppercase tracking-wider mb-2 font-medium">Output</div>
                                                    <div className="text-sm text-emerald-400/80 leading-relaxed whitespace-pre-wrap font-mono bg-emerald-900/10 p-3 rounded-lg border border-emerald-500/10">
                                                        {item.output}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    // Empty State (Simple)
                    <div className="flex flex-col items-center justify-center h-full text-white/20">
                        <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
                            <svg className="w-8 h-8 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" /></svg>
                        </div>
                        <p className="text-sm font-medium">Select a dataset to view details</p>
                        <p className="text-xs mt-1 opacity-50">or create a new one</p>
                    </div>
                )}
            </div>

            {/* Right Panel: Workflow Guide (Always Visible) */}
            <div className="w-80 shrink-0 flex flex-col bg-gradient-to-b from-black/20 to-transparent border border-white/5 rounded-2xl overflow-hidden">
                <div className="px-5 py-4 border-b border-white/5 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#007AFF]/20 to-[#007AFF]/5 flex items-center justify-center">
                        <svg className="w-4 h-4 text-[#007AFF]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                    </div>
                    <div>
                        <h2 className="text-sm font-semibold text-white/90">Dataset Guide</h2>
                        <p className="text-[10px] text-white/40">Best practices for evaluation</p>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-6">
                    {/* 0. Goal & Purpose */}
                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">00. Goal & Purpose</span>
                        </div>
                        <div className="space-y-2">
                            <div className="bg-white/[0.03] border border-white/5 rounded-lg p-3">
                                <div className="flex items-center gap-2 mb-1">
                                    <svg className="w-3.5 h-3.5 text-[#007AFF]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                                    <span className="text-xs font-medium text-white/80">Goal</span>
                                </div>
                                <p className="text-[11px] text-white/50 leading-relaxed">
                                    Create a reliable test set to measure prompt quality objectively.
                                </p>
                            </div>
                            <div className="bg-white/[0.03] border border-white/5 rounded-lg p-3">
                                <div className="flex items-center gap-2 mb-1">
                                    <svg className="w-3.5 h-3.5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                                    <span className="text-xs font-medium text-white/80">Purpose</span>
                                </div>
                                <p className="text-[11px] text-white/50 leading-relaxed">
                                    Use datasets to optimize prompts, benchmark performance, and prevent regressions.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* 1. Curation Strategy */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">01. Strategy</span>
                        </div>

                        <div className="bg-white/[0.03] border border-white/5 rounded-lg p-3">
                            <div className="flex items-center gap-2 mb-1">
                                <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                <span className="text-xs font-medium text-white/80">The Golden Set</span>
                            </div>
                            <p className="text-[11px] text-white/50 leading-relaxed">
                                Aim for <span className="text-white/80">20-50 high-quality examples</span>. This is your "ground truth".
                            </p>
                        </div>

                        <div className="bg-white/[0.03] border border-white/5 rounded-lg p-3">
                            <div className="flex items-center gap-2 mb-1">
                                <svg className="w-3.5 h-3.5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                                <span className="text-xs font-medium text-white/80">Edge Cases</span>
                            </div>
                            <p className="text-[11px] text-white/50 leading-relaxed">
                                Include <span className="text-white/80">5-10 difficult examples</span> (ambiguity, injection).
                            </p>
                        </div>
                    </div>

                    {/* 2. Quality Assurance */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">02. Quality Check</span>
                        </div>
                        <div className="bg-black/40 border border-white/5 rounded-lg p-3 space-y-2">
                            <div className="flex items-start gap-2">
                                <div className="w-3 h-3 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shrink-0 mt-0.5">
                                    <svg className="w-2 h-2 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                </div>
                                <p className="text-[11px] text-white/60"><span className="text-white/80 font-medium">No PII:</span> Ensure no sensitive user data is included.</p>
                            </div>
                            <div className="flex items-start gap-2">
                                <div className="w-3 h-3 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shrink-0 mt-0.5">
                                    <svg className="w-2 h-2 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                </div>
                                <p className="text-[11px] text-white/60"><span className="text-white/80 font-medium">Deterministic:</span> Outputs should be factual and verifiable.</p>
                            </div>
                            <div className="flex items-start gap-2">
                                <div className="w-3 h-3 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shrink-0 mt-0.5">
                                    <svg className="w-2 h-2 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                </div>
                                <p className="text-[11px] text-white/60"><span className="text-white/80 font-medium">Representative:</span> Covers common user intents.</p>
                            </div>
                        </div>
                    </div>

                    {/* 3. Data Structure */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">03. Format</span>
                        </div>
                        <div className="bg-black/40 border border-white/5 rounded-lg p-3 font-mono text-[10px] text-white/60 overflow-x-auto">
                            <pre>{`[
  {
    "input": "...",
    "output": "..."
  }
]`}</pre>
                        </div>
                    </div>

                    {/* 4. Lifecycle */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">04. Lifecycle</span>
                        </div>
                        <div className="relative pl-4 border-l border-white/10 space-y-4">
                            <div className="relative">
                                <div className="absolute -left-[21px] w-3 h-3 rounded-full bg-[#007AFF] border-2 border-[#0a0a0a]"></div>
                                <p className="text-xs text-white/85 font-medium">Draft & Collect</p>
                                <p className="text-[11px] text-white/45">Create manually or import logs.</p>
                            </div>
                            <div className="relative">
                                <div className="absolute -left-[21px] w-3 h-3 rounded-full bg-[#007AFF] border-2 border-[#0a0a0a] opacity-70"></div>
                                <p className="text-xs text-white/85 font-medium">Refine & Verify</p>
                                <p className="text-[11px] text-white/45">Ensure "Ideal Output" is precise.</p>
                            </div>
                            <div className="relative">
                                <div className="absolute -left-[21px] w-3 h-3 rounded-full bg-[#007AFF] border-2 border-[#0a0a0a] opacity-40"></div>
                                <p className="text-xs text-white/85 font-medium">Optimize</p>
                                <p className="text-[11px] text-white/45">Use in Prompt Optimizer.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
