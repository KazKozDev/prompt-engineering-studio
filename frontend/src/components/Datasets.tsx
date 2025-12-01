import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { api } from '../services/api';
import { MethodologyIcon } from './icons/MethodologyIcon';
import { DatasetGenerator } from './DatasetGenerator';
import { Button } from './ui/Button';

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
    // Track which datasets are examples (by id)
    const [selectedDatasetId, setSelectedDatasetId] = useState<string | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [editingDatasetId, setEditingDatasetId] = useState<string | null>(null);
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
    const [_uploadError, setUploadError] = useState<string | null>(null);
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

    // Combine datasets and examples into a single list, marking examples
    const allDatasets = useMemo(() => {
        const markedExamples = examples.map(e => ({ ...e, isExample: true }));
        const markedDatasets = datasets.map(d => ({ ...d, isExample: false }));
        // User datasets first, then examples
        return [...markedDatasets, ...markedExamples];
    }, [datasets, examples]);

    const filteredList = useMemo(() => {
        if (!searchQuery) return allDatasets;
        return allDatasets.filter(d =>
            d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            d.description?.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [allDatasets, searchQuery]);

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
            if (editingDatasetId) {
                // Update existing dataset
                await api.updateDataset(editingDatasetId, {
                    name: newDatasetName,
                    description: newDatasetDescription,
                    data: validItems
                });
            } else {
                // Create new dataset
                await api.createDataset({
                    name: newDatasetName,
                    description: newDatasetDescription,
                    category: 'custom',
                    data: validItems
                });
            }

            // Reset form
            const savedName = newDatasetName;
            const wasEditing = !!editingDatasetId;
            setNewDatasetName('');
            setNewDatasetDescription('');
            setNewDatasetItems([{ input: '', output: '' }]);
            setEditingDatasetId(null);
            setIsCreating(false);

            // Wait a moment for file system to sync, then reload
            await new Promise(resolve => setTimeout(resolve, 300));
            await loadData();

            // Reload detail if we were editing
            if (wasEditing && selectedDatasetId) {
                await loadDatasetDetail(selectedDatasetId);
            }

            // Show success message
            alert(`Dataset "${savedName}" ${wasEditing ? 'updated' : 'created'} successfully!`);
        } catch (error: any) {
            alert(`Error ${editingDatasetId ? 'updating' : 'creating'} dataset: ${error.message}`);
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

                {/* Search */}
                <div className="flex flex-col gap-4">
                    {/* Search */}
                    <div className="relative group">
                        <svg className="absolute left-3 top-2.5 w-4 h-4 text-white/20 group-focus-within:text-white/40 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search datasets..."
                            className="w-full bg-black/20 border border-white/5 rounded-lg pl-9 pr-3 py-2 text-sm text-white/80 placeholder:text-white/20 focus:outline-none focus:border-white/20 focus:bg-black/40 transition-all"
                        />
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                    <Button
                        onClick={() => { setIsCreating(true); setIsGenerating(false); setSelectedDatasetId(null); setEditingDatasetId(null); setNewDatasetName(''); setNewDatasetDescription(''); setNewDatasetItems([{ input: '', output: '' }]); }}
                        variant="primary"
                        size="sm"
                        fullWidth
                    >
                        Create
                    </Button>
                    {settings && (
                        <Button
                            onClick={() => { setIsGenerating(true); setIsCreating(false); setSelectedDatasetId(null); }}
                            variant="primary"
                            size="sm"
                            fullWidth
                        >
                            Generate
                        </Button>
                    )}
                </div>

                {/* Stats Summary */}
                <div className="flex gap-2 text-[10px] text-white/40">
                    <span>{datasets.length} datasets</span>
                    <span>•</span>
                    <span>{datasets.reduce((sum, d) => sum + (d.size || 0), 0).toLocaleString()} items</span>
                    <span>•</span>
                    <span>{examples.length} examples</span>
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto min-h-0 space-y-1.5 custom-scrollbar">
                    {filteredList.map((dataset: any) => (
                        <button
                            key={dataset.id}
                            onClick={() => { setSelectedDatasetId(dataset.id); setIsCreating(false); setIsGenerating(false); }}
                            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg border transition-all ${selectedDatasetId === dataset.id
                                ? 'bg-white/10 border-white/20'
                                : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.05] hover:border-white/10'
                                }`}
                        >
                            <span className={`text-[13px] font-medium truncate text-left ${selectedDatasetId === dataset.id ? 'text-white' : 'text-white/70'}`}>
                                {dataset.name}
                            </span>
                            <span className={`text-[10px] min-w-[24px] h-5 px-1.5 rounded-md flex items-center justify-center shrink-0 font-mono ${selectedDatasetId === dataset.id
                                ? 'bg-white/20 text-white'
                                : 'bg-white/5 text-white/40'
                                }`}>
                                {dataset.size}
                            </span>
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
            <div className="flex-1 min-w-0 bg-black/20 border border-white/5 rounded-2xl overflow-hidden flex flex-col">
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
                                        className="w-full rounded-lg border border-white/10 bg-black/40 px-4 py-2.5 text-sm text-white/90 placeholder:text-white/20 focus:outline-none focus:border-white/20 transition-colors"
                                        placeholder="e.g., Customer Support FAQ"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-white/50 mb-2">Description</label>
                                    <input
                                        type="text"
                                        value={newDatasetDescription}
                                        onChange={(e) => setNewDatasetDescription(e.target.value)}
                                        className="w-full rounded-lg border border-white/10 bg-black/40 px-4 py-2.5 text-sm text-white/90 placeholder:text-white/20 focus:outline-none focus:border-white/20 transition-colors"
                                        placeholder="Brief description..."
                                    />
                                </div>
                            </div>

                            <div>
                                <div className="flex justify-between items-center mb-3">
                                    <label className="text-xs font-medium text-white/50">Input/Output Pairs ({newDatasetItems.length})</label>
                                    <Button onClick={addDatasetItem} variant="ghost" size="xs" className="text-xs text-white/60 hover:text-white px-0">+ Add Item</Button>
                                </div>

                                <div className="space-y-3">
                                    {newDatasetItems.map((item, index) => (
                                        <div key={index} className="bg-black/30 p-4 rounded-xl border border-white/5 group hover:border-white/10 transition-colors">
                                            <div className="flex justify-between items-center mb-3">
                                                <span className="text-[10px] text-white/30 font-mono">#{index + 1}</span>
                                                {newDatasetItems.length > 1 && (
                                                    <Button
                                                        onClick={() => removeDatasetItem(index)}
                                                        variant="ghost"
                                                        size="xs"
                                                        className="text-[10px] text-red-400/50 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all px-1"
                                                    >
                                                        Remove
                                                    </Button>
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
                            <Button
                                onClick={() => { setIsCreating(false); setEditingDatasetId(null); }}
                                variant="ghost"
                                size="sm"
                                className="px-4 text-sm text-white/70 hover:text-white"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleCreateDataset}
                                variant="primary"
                                size="sm"
                            >
                                {editingDatasetId ? 'Save Changes' : 'Create Dataset'}
                            </Button>
                        </div>
                    </div>
                ) : detailedDataset ? (
                    // Detailed View
                    <div className="flex flex-col h-full">
                        <div className="px-5 py-4 border-b border-white/5 flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0 space-y-2">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <h2 className="text-lg font-semibold text-white truncate">
                                        {detailedDataset.name}
                                    </h2>
                                    <span className="text-[11px] px-2 py-1 rounded-full bg-white/10 text-white/60 capitalize">
                                        {detailedDataset.category}
                                    </span>
                                    <span className="text-[11px] px-2 py-1 rounded-full bg-white/5 text-white/40">
                                        {detailedDataset.size} items
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-white/50 flex-wrap">
                                    <span>{detailedDataset.description || 'No description'}</span>
                                    <span>•</span>
                                    <span>Updated {new Date(detailedDataset.updatedAt).toLocaleDateString()}</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                                <button
                                    onClick={() => handleExportDataset(detailedDataset)}
                                    className="px-3 py-1.5 text-xs font-medium rounded-lg border border-white/10 bg-white/[0.04] text-white/70 hover:text-white hover:border-white/30 transition-all"
                                >
                                    Export
                                </button>
                                <button
                                    onClick={() => examples.some(e => e.id === detailedDataset.id) ? handleImportExample(detailedDataset.id) : handleDuplicateDataset(detailedDataset)}
                                    className="px-3 py-1.5 text-xs font-medium rounded-lg border border-white/10 bg-white/[0.04] text-white/70 hover:text-white hover:border-white/30 transition-all"
                                >
                                    Duplicate
                                </button>
                                <button
                                    onClick={() => {
                                        setNewDatasetName(detailedDataset.name);
                                        setNewDatasetDescription(detailedDataset.description || '');
                                        setNewDatasetItems(detailedDataset.data || [{ input: '', output: '' }]);
                                        setEditingDatasetId(detailedDataset.id);
                                        setIsCreating(true);
                                    }}
                                    className="px-3 py-1.5 text-xs font-medium rounded-lg border border-white/10 bg-white/[0.04] text-white/70 hover:text-white hover:border-white/30 transition-all"
                                >
                                    Edit
                                </button>
                                <button
                                    onClick={() => handleDeleteDataset(detailedDataset.id)}
                                    className="px-2 py-1.5 rounded-lg border border-red-800/30 bg-red-900/20 text-red-300 hover:bg-red-900/30 transition-all"
                                    title="Delete"
                                >
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                </button>
                                <button
                                    onClick={() => setShowGuide(true)}
                                    className="px-2 py-1.5 rounded-lg border border-amber-500/30 bg-amber-900/20 text-amber-300 hover:bg-amber-900/30 transition-all"
                                    title="Guide"
                                >
                                    <MethodologyIcon className="w-3.5 h-3.5" />
                                </button>
                                <button
                                    onClick={() => setSelectedDatasetId(null)}
                                    className="p-2 text-white/60 hover:text-white transition-all"
                                    title="Close"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4">
                            {loadingDetail ? (
                                <div className="flex items-center justify-center h-40 text-white/30">
                                    <svg className="animate-spin h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                    Loading details...
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {detailedDataset.data?.map((item, index) => (
                                        <div key={index} className="bg-white/[0.02] rounded-lg border border-white/5 hover:bg-white/[0.04] transition-colors">
                                            <div className="grid grid-cols-2 gap-3 p-3">
                                                <div>
                                                    <div className="text-[9px] text-white/30 uppercase tracking-wider mb-1 font-medium flex items-center gap-2">
                                                        <span className="text-white/20 font-mono">#{index + 1}</span>
                                                        Input
                                                    </div>
                                                    <div className="text-[12px] text-white/70 whitespace-pre-wrap font-mono bg-black/20 px-2.5 py-2 rounded-md border border-white/5 leading-relaxed">
                                                        {item.input}
                                                    </div>
                                                </div>
                                                <div>
                                                    <div className="text-[9px] text-white/30 uppercase tracking-wider mb-1 font-medium">Output</div>
                                                    <div className="text-[12px] text-white/70 whitespace-pre-wrap font-mono bg-white/5 px-2.5 py-2 rounded-md border border-white/10 leading-relaxed">
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
                    // Empty State - minimal with icon
                    <div className="flex flex-col items-center justify-center h-full">
                        <div className="w-16 h-16 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-center mb-4 text-white/20">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                            </svg>
                        </div>
                        <p className="text-sm text-white/40">Select a dataset from the list</p>
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
                            <Button
                                onClick={() => setShowGuide(false)}
                                variant="ghost"
                                size="icon"
                                className="p-2 text-white/70 hover:text-white"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </Button>
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
                            <Button
                                onClick={() => setShowGuide(false)}
                                variant="secondary"
                                size="sm"
                                className="px-4"
                            >
                                Close
                            </Button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}
