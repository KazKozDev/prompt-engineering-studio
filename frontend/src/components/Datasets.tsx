import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { api } from '../services/api';
import { MethodologyIcon } from './icons/MethodologyIcon';
import { DatasetGenerator } from './DatasetGenerator';

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

interface DatasetsProps {
    settings?: {
        provider: string;
        model: string;
        apiKey?: string;
    };
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

export function Datasets({ settings }: DatasetsProps) {
    const [datasets, setDatasets] = useState<Dataset[]>([]);
    const [examples, setExamples] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'my-datasets' | 'examples'>('my-datasets');
    const [selectedDatasetId, setSelectedDatasetId] = useState<string | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
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
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [showGuide, setShowGuide] = useState(false);
    const [isClient, setIsClient] = useState(false);

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

    // Ensure portal renders only after client mounts (avoids SSR/no-document issues)
    useEffect(() => {
        setIsClient(true);
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [datasetsRes, examplesRes] = await Promise.all([
                api.listDatasets(),
                api.getExampleDatasets()
            ]);
            console.log('Loaded datasets:', datasetsRes.datasets);
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
            const createdName = newDatasetName;
            setNewDatasetName('');
            setNewDatasetDescription('');
            setNewDatasetItems([{ input: '', output: '' }]);
            setIsCreating(false);
            setActiveTab('my-datasets');

            // Wait a moment for file system to sync, then reload
            await new Promise(resolve => setTimeout(resolve, 300));
            await loadData();

            // Show success message
            alert(`Dataset "${createdName}" created successfully!`);
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
        setUploadError(null);
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

    const handleExportDataset = (dataset?: Dataset | null) => {
        const target = dataset || detailedDataset;
        if (!target?.data) return;
        const blob = new Blob([JSON.stringify(target.data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${target.name || 'dataset'}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleDuplicateDataset = async (dataset?: Dataset | null) => {
        const target = dataset || detailedDataset;
        if (!target?.data) return;
        try {
            await api.createDataset({
                name: `${target.name} Copy`,
                description: target.description,
                category: target.category || 'custom',
                data: target.data
            });
            await loadData();
            alert('Dataset duplicated');
        } catch (error: any) {
            alert(`Error duplicating dataset: ${error.message}`);
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
        <div className="relative h-full flex gap-6 p-6 overflow-hidden">
            {/* Left Sidebar: List */}
            <div className="w-80 flex flex-col shrink-0 gap-4">
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <h2 className="text-[11px] font-bold text-white/30 uppercase tracking-widest mb-1">DATASETS</h2>
                        <p className="text-xs text-white/40 mb-4 mt-1">Create and manage test datasets for prompt evaluation</p>
                    </div>
                </div>

                {/* Tabs and Search */}
                <div className="flex flex-col gap-4">
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

                {/* Action Buttons */}
                <div className="flex gap-2">
                    <button
                        onClick={() => { setIsCreating(true); setIsGenerating(false); setSelectedDatasetId(null); }}
                        className="flex-1 px-3 py-2 bg-[#2563EB] hover:bg-[#1d4fd8] text-white rounded-lg font-medium text-sm transition-all flex items-center justify-center shadow-lg shadow-blue-500/10"
                    >
                        Create
                    </button>
                    {settings && (
                        <button
                            onClick={() => { setIsGenerating(true); setIsCreating(false); setSelectedDatasetId(null); }}
                            className="flex-1 px-3 py-2 bg-[#2563EB] hover:bg-[#1d4fd8] text-white rounded-lg font-medium text-sm transition-all flex items-center justify-center shadow-lg shadow-blue-500/10"
                        >
                            Generate
                        </button>
                    )}
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto min-h-0 space-y-2 pr-2 custom-scrollbar">
                    {filteredList.map(dataset => (
                        <button
                            key={dataset.id}
                            onClick={() => { setSelectedDatasetId(dataset.id); setIsCreating(false); setIsGenerating(false); }}
                            className={`w-full text-left p-3 rounded-xl transition-all group border ${selectedDatasetId === dataset.id
                                ? 'bg-[#007AFF]/10 border-[#007AFF]/30'
                                : 'bg-white/[0.02] border-white/5 hover:border-white/10'
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

            {/* Middle Panel: Content (full width) */}
            <div className="flex-1 min-w-0 bg-black/20 border border-white/5 rounded-2xl overflow-hidden flex flex-col relative">
                {!isGenerating && (
                    <div className="absolute top-3 right-3 z-10">
                        <button
                            onClick={() => setShowGuide(true)}
                            className="group flex items-center gap-2 px-3 py-2 rounded-full bg-white/[0.04] border border-white/10 text-[11px] text-white/60 hover:border-[#007AFF]/40 hover:text-white transition-colors shadow-lg shadow-black/30"
                        >
                            <MethodologyIcon className="w-3.5 h-3.5 text-amber-300" />
                        </button>
                    </div>
                )}
                {isGenerating && settings ? (
                    // Generator View
                    <DatasetGenerator
                        settings={{
                            provider: settings.provider,
                            model: settings.model,
                            apiKey: settings.apiKey
                        }}
                        onGenerated={async (data, name) => {
                            // Create dataset from generated data
                            try {
                                await api.createDataset({
                                    name: name || `Generated Dataset ${new Date().toLocaleDateString()}`,
                                    description: 'Auto-generated dataset',
                                    category: 'generated',
                                    data
                                });
                                await loadData();
                                setIsGenerating(false);
                                setActiveTab('my-datasets');
                            } catch (error: any) {
                                alert(`Error saving dataset: ${error.message}`);
                            }
                        }}
                        onClose={() => setIsGenerating(false)}
                    />
                ) : isCreating ? (
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
                            <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-3">
                                    <h2 className="text-2xl font-semibold text-white/90">{detailedDataset.name}</h2>
                                    <span className="text-[10px] font-mono text-white/30 bg-white/5 px-2 py-0.5 rounded-full border border-white/5 capitalize">
                                        {detailedDataset.category}
                                    </span>
                                </div>
                                <p className="text-sm text-white/50">{detailedDataset.description || 'No description provided'}</p>
                                <div className="text-[11px] text-white/40 flex gap-3">
                                    <span>Created: {new Date(detailedDataset.createdAt).toLocaleDateString()}</span>
                                    <span>Updated: {new Date(detailedDataset.updatedAt).toLocaleDateString()}</span>
                                    <span>Items: {detailedDataset.size}</span>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleExportDataset(detailedDataset)}
                                    className="px-3 py-2 bg-white/10 hover:bg-white/15 text-white border border-white/10 rounded-lg text-sm font-medium transition-all"
                                >
                                    Export
                                </button>
                                <button
                                    onClick={() => handleDuplicateDataset(detailedDataset)}
                                    className="px-3 py-2 bg-white/10 hover:bg-white/15 text-white border border-white/10 rounded-lg text-sm font-medium transition-all"
                                >
                                    Duplicate
                                </button>
                                {activeTab === 'examples' ? (
                                    <button
                                        onClick={() => handleImportExample(detailedDataset.id)}
                                        className="px-3 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded-lg text-sm font-medium transition-all"
                                    >
                                        Import
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => handleDeleteDataset(detailedDataset.id)}
                                        className="px-3 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-lg text-sm font-medium transition-all"
                                    >
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
                    // Empty State (Actionable)
                    <div className="flex flex-col items-center justify-center h-full text-white/20 gap-4 px-6">
                        <div className="text-center space-y-2 max-w-xl">
                            <h3 className="text-lg text-white/80 font-semibold">Get started with datasets</h3>
                            <p className="text-sm text-white/50">
                                Datasets are your exam questions for the model. They move you from manual spot-checks to objective, measurable engineering.
                            </p>
                            <button
                                onClick={() => setShowGuide(true)}
                                className="text-xs text-[#4da3ff] hover:text-[#70b6ff] underline underline-offset-4"
                            >
                                Why do I need datasets? Read the full guide →
                            </button>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-3">
                            <button
                                onClick={() => setIsCreating(true)}
                                className="px-6 py-3 bg-[#2563EB] hover:bg-[#1d4fd8] text-white rounded-xl text-sm font-semibold shadow-lg shadow-blue-500/10"
                            >
                                Create New Dataset
                            </button>
                            <label className="px-6 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer border border-white/10 bg-white/10 hover:bg-white/15 text-white flex items-center gap-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                                Import Data
                                <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
                            </label>
                        </div>
                        {uploadError && (
                            <div className="text-[11px] text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-2 rounded-lg">
                                {uploadError}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {showGuide && isClient && typeof document !== 'undefined' && createPortal(
                <div className="fixed inset-0 z-[9999] flex justify-end bg-black/60 backdrop-blur-sm" onClick={() => setShowGuide(false)}>
                    <div
                        className="w-[440px] max-w-full h-full bg-[#0f1115] border-l border-white/10 shadow-2xl shadow-black/60 flex flex-col"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
                            <div>
                                <p className="text-[10px] uppercase tracking-[0.2em] text-white/30 font-semibold mb-1">Dataset Guide</p>
                                <h3 className="text-lg font-semibold text-white/90">How datasets power evaluation</h3>
                            </div>
                            <button
                                onClick={() => setShowGuide(false)}
                                className="p-2 rounded-md hover:bg-white/10 text-white/60 hover:text-white"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-5 space-y-4 text-sm text-white/80 leading-relaxed custom-scrollbar">
                            <p>Datasets turn prompt QA into a measurable, repeatable process. They are the gold set you run before shipping a prompt version.</p>

                            <h4 className="text-white font-semibold text-base">Why</h4>
                            <ul className="list-disc list-inside space-y-2">
                                <li><strong>Quantitative checks:</strong> Compare versions on hundreds of cases, not vibes.</li>
                                <li><strong>Edge coverage:</strong> Include long/empty inputs, mixed languages, adversarial noise.</li>
                                <li><strong>Regression safety:</strong> Re-run the same “golden” set every time you ship.</li>
                            </ul>

                            <h4 className="text-white font-semibold text-base">What’s inside</h4>
                            <ul className="list-disc list-inside space-y-2">
                                <li><strong>Inputs:</strong> Fields matching your prompt variables (e.g., <code className="bg-white/5 px-1 py-0.5 rounded">review_text</code>).</li>
                                <li><strong>Ground Truth:</strong> Expected output to score against (label, reference summary, correct answer).</li>
                            </ul>

                            <h4 className="text-white font-semibold text-base">Format examples</h4>
                            <div className="space-y-2">
                                <div className="text-[11px] text-white/50">CSV</div>
                                <pre className="bg-black/40 border border-white/10 rounded-lg p-3 text-xs font-mono text-white/80 whitespace-pre-wrap">review_text,target_label{"\n"}"The app crashes constantly",Negative</pre>
                                <div className="text-[11px] text-white/50">JSONL</div>
                                <pre className="bg-black/40 border border-white/10 rounded-lg p-3 text-xs font-mono text-white/80 whitespace-pre-wrap">{"{\"review_text\": \"The app crashes constantly\", \"target_label\": \"Negative\"}\n{\"review_text\": \"Best purchase\", \"target_label\": \"Positive\"}"}</pre>
                            </div>

                            <h4 className="text-white font-semibold text-base">Workflow</h4>
                            <ul className="list-disc list-inside space-y-2">
                                <li><strong>Import & Map:</strong> Upload CSV/JSONL; align columns with prompt variables and target.</li>
                                <li><strong>Evaluate:</strong> Select dataset inside Evaluation to benchmark variants.</li>
                                <li><strong>Ship safely:</strong> Use the same dataset for every release to avoid regressions.</li>
                            </ul>
                        </div>
                        <div className="px-5 py-3 border-t border-white/10 flex justify-end">
                            <button
                                onClick={() => setShowGuide(false)}
                                className="px-4 py-2 rounded-lg text-sm font-medium bg-white/10 hover:bg-white/15 text-white border border-white/10 transition-all"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}
