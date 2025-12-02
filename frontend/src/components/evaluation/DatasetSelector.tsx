import { useState } from 'react';
import { Button } from '../ui/Button';

interface DatasetSelectorProps {
    datasets: any[];
    onSelect: (dataset: any) => void;
    onClose: () => void;
}

export function DatasetSelector({ datasets, onSelect, onClose }: DatasetSelectorProps) {
    const [searchQuery, setSearchQuery] = useState('');

    const filteredDatasets = datasets.filter(d =>
        d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-[#1c1c1e] w-full max-w-2xl rounded-2xl border border-white/10 shadow-2xl flex flex-col max-h-[80vh] overflow-hidden">
                {/* Header */}
                <div className="px-6 py-4 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                    <h3 className="text-lg font-semibold text-white/90">Select Dataset</h3>
                    <Button onClick={onClose} variant="ghost" size="icon" className="text-white/60 hover:text-white transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </Button>
                </div>

                {/* Search */}
                <div className="p-4 border-b border-white/5">
                    <div className="relative">
                        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            placeholder="Search datasets..."
                            className="w-full bg-black/30 border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white/90 placeholder-white/30 focus:outline-none focus:border-white/20"
                        />
                    </div>
                </div>

                {/* Dataset List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
                    {filteredDatasets.length === 0 ? (
                        <div className="text-center py-12 text-white/40 text-sm">
                            No datasets found
                        </div>
                    ) : (
                        filteredDatasets.map(dataset => (
                            <button
                                key={dataset.id}
                                onClick={() => onSelect(dataset)}
                                className="w-full text-left p-4 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.06] hover:border-white/15 transition-all group"
                            >
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-sm font-medium text-white/90 group-hover:text-white transition-colors truncate">
                                        {dataset.name}
                                    </span>
                                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-white/50 border border-white/5 shrink-0">
                                        {dataset.size || dataset.data?.length || 0} samples
                                    </span>
                                </div>
                                {dataset.description && (
                                    <p className="text-xs text-white/40 truncate">{dataset.description}</p>
                                )}
                            </button>
                        ))
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-3 border-t border-white/5 bg-white/[0.02] flex justify-between items-center">
                    <span className="text-xs text-white/40">{filteredDatasets.length} datasets</span>
                    <Button onClick={onClose} variant="ghost" size="sm" className="text-xs">
                        Cancel
                    </Button>
                </div>
            </div>
        </div>
    );
}
