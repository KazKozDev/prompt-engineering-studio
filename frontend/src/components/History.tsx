import { useState, useEffect } from 'react';
import { api } from '../services/api';

export function History() {
    const [history, setHistory] = useState<any[]>([]);
    const [historyStats, setHistoryStats] = useState<any>(null);
    const [modelsFilter, setModelsFilter] = useState<string[]>([]);
    const [statusFilter, setStatusFilter] = useState<'all' | 'success' | 'failed'>('all');
    const [dateRange, setDateRange] = useState<'all' | '24h' | '7d' | '30d'>('all');
    const [selectedItem, setSelectedItem] = useState<any>(null);

    useEffect(() => {
        loadHistory();
    }, []);

    const loadHistory = async () => {
        try {
            const data = await api.getHistory(50);
            setHistory(data.history);
            setHistoryStats(data.stats);
        } catch (error) {
            console.error('Failed to load history:', error);
        }
    };

    const deleteHistory = async (id: string) => {
        try {
            await api.deleteHistoryItem(id);
            loadHistory(); // Reload after delete
        } catch (error) {
            console.error('Failed to delete history item:', error);
        }
    };

    const filteredHistory = history.filter(item => {
        const status = item.status || (item.error ? 'failed' : 'success');
        if (statusFilter !== 'all' && status !== statusFilter) return false;
        if (modelsFilter.length > 0 && !modelsFilter.includes(item.model)) return false;
        if (dateRange !== 'all') {
            const ts = new Date(item.timestamp).getTime();
            const now = Date.now();
            const rangeMs = dateRange === '24h' ? 24 * 60 * 60 * 1000 : dateRange === '7d' ? 7 * 24 * 60 * 60 * 1000 : 30 * 24 * 60 * 60 * 1000;
            if (now - ts > rangeMs) return false;
        }
        return true;
    });

    const uniqueModels = Array.from(new Set(history.map(h => h.model).filter(Boolean)));

    const formatTime = (timestamp: string) => {
        const date = new Date(timestamp);
        const today = new Date();
        const isToday = date.toDateString() === today.toDateString();
        return `${isToday ? 'Today' : date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    };

    const handleCopy = (text: string) => navigator.clipboard.writeText(text);

    return (
        <div className="h-full flex gap-6 p-6 overflow-hidden">
            {/* Left Sidebar */}
            <div className="w-80 flex flex-col shrink-0 gap-4">
                <div>
                    <h2 className="text-[11px] font-bold text-white/30 uppercase tracking-widest mb-1">GENERATION HISTORY</h2>
                    <p className="text-xs text-white/40 mb-4 mt-1">Track your prompt generation history and usage statistics</p>
                </div>

                <button
                    onClick={loadHistory}
                    className="px-4 py-2 bg-white/[0.05] hover:bg-white/[0.08] border border-white/10 text-white/80 rounded-lg font-medium text-sm transition-all"
                >
                    Refresh
                </button>

                <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-2">
                    {historyStats && (
                        <div className="bg-white/[0.02] border border-white/5 rounded-lg p-4">
                            <h3 className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-3">Statistics</h3>
                            <div className="space-y-3">
                                <div>
                                    <div className="text-[10px] text-white/40 mb-1">Total Generations</div>
                                    <div className="text-xl font-semibold text-white/80">{historyStats.total_generations}</div>
                                </div>
                                <div>
                                    <div className="text-[10px] text-white/40 mb-1">Total Tokens</div>
                                    <div className="text-xl font-semibold text-white/80">{historyStats.total_tokens.toLocaleString()}</div>
                                </div>
                                <div>
                                    <div className="text-[10px] text-white/40 mb-1">Most Used Technique</div>
                                    <div className="text-sm font-semibold text-white/70 truncate">{historyStats.most_used_technique || 'N/A'}</div>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="bg-white/[0.02] border border-white/5 rounded-lg p-4 space-y-4">
                        <div className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Filters</div>

                        <div className="space-y-2">
                            <div className="text-[11px] text-white/50">By Model</div>
                            <div className="space-y-1 max-h-24 overflow-y-auto custom-scrollbar">
                                {uniqueModels.length === 0 && <div className="text-[11px] text-white/30">No models yet</div>}
                                {uniqueModels.map(model => (
                                    <label key={model} className="flex items-center gap-2 text-xs text-white/70">
                                        <input
                                            type="checkbox"
                                            className="form-checkbox bg-black/50 border-white/20 text-[#007AFF]"
                                            checked={modelsFilter.includes(model)}
                                            onChange={(e) => {
                                                setModelsFilter(prev => e.target.checked ? [...prev, model] : prev.filter(m => m !== model));
                                            }}
                                        />
                                        <span className="font-mono">{model}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="text-[11px] text-white/50">By Status</div>
                            <div className="flex gap-2">
                                {['all', 'success', 'failed'].map(s => (
                                    <button
                                        key={s}
                                        onClick={() => setStatusFilter(s as any)}
                                        className={`px-3 py-1.5 rounded-lg text-[11px] border ${statusFilter === s
                                            ? 'border-[#007AFF]/40 bg-[#007AFF]/15 text-white'
                                            : 'border-white/10 text-white/60 hover:text-white hover:border-white/30'}`}
                                    >
                                        {s === 'all' ? 'All' : s === 'success' ? 'Success' : 'Failed'}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="text-[11px] text-white/50">Date Range</div>
                            <div className="grid grid-cols-2 gap-2">
                                {['all', '24h', '7d', '30d'].map(r => (
                                    <button
                                        key={r}
                                        onClick={() => setDateRange(r as any)}
                                        className={`px-3 py-1.5 rounded-lg text-[11px] border ${dateRange === r
                                            ? 'border-[#007AFF]/40 bg-[#007AFF]/15 text-white'
                                            : 'border-white/10 text-white/60 hover:text-white hover:border-white/30'}`}
                                    >
                                        {r === 'all' ? 'All time' : r}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Panel: History List */}
            <div className="flex-1 flex flex-col bg-gradient-to-b from-black/20 to-transparent border border-white/5 rounded-2xl overflow-hidden">
                <div className="px-6 py-5 border-b border-white/5 bg-white/[0.02]">
                    <h2 className="text-xl font-semibold text-white/90 leading-tight mb-1">Recent Prompt Generations</h2>
                    <p className="text-xs text-white/45 mt-1">Browse runs, outcomes, and models in one place.</p>
                </div>

                <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
                    {history.length === 0 ? (
                        <div className="text-center py-12 text-white/40">
                            <div className="text-sm font-medium mb-2">No history yet</div>
                            <div className="text-xs text-white/30">Your generations will appear here</div>
                        </div>
                    ) : (
                        <div className="bg-white/[0.02] border border-white/5 rounded-xl overflow-hidden">
                            <div className="grid grid-cols-[60px_160px_200px_1fr_100px_120px] gap-0 text-[11px] text-white/50 border-b border-white/5 px-3 py-2">
                                <div>Status</div>
                                <div>Time</div>
                                <div>Model</div>
                                <div>Prompt Preview</div>
                                <div className="text-right pr-4">Tokens</div>
                                <div className="text-right pr-2">Actions</div>
                            </div>
                            <div className="divide-y divide-white/5">
                                {filteredHistory.map((item) => {
                                    const status = item.status || (item.error ? 'failed' : 'success');
                                    return (
                                        <button
                                            key={item.id}
                                            onClick={() => setSelectedItem(item)}
                                            className="w-full text-left grid grid-cols-[60px_160px_200px_1fr_100px_120px] items-center px-3 py-3 hover:bg-white/[0.04] transition-colors text-xs"
                                        >
                                            <div className="flex items-center">
                                                <span className={`w-2 h-2 rounded-full ${status === 'success' ? 'bg-emerald-400' : 'bg-red-400'}`}></span>
                                            </div>
                                            <div className="text-white/60">{formatTime(item.timestamp)}</div>
                                            <div>
                                                <span className="px-2 py-1 rounded bg-white/[0.05] border border-white/10 text-white/70 text-[11px] font-mono">
                                                    {item.model || 'model'}
                                                </span>
                                            </div>
                                            <div className="text-white/80 truncate">
                                                {item.prompt?.split(' ').slice(0, 15).join(' ') || '—'}
                                            </div>
                                            <div className="text-right pr-4 font-mono text-white/70">
                                                {item.total_tokens ?? '–'}
                                            </div>
                                            <div className="flex justify-end gap-2 pr-2 opacity-80">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleCopy(item.prompt || ''); }}
                                                    className="p-1 rounded bg-white/[0.04] border border-white/10 hover:border-white/30 text-white/70"
                                                    title="Copy prompt"
                                                >
                                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                                                </button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); console.log('Rerun prompt', item.id); }}
                                                    className="p-1 rounded bg-white/[0.04] border border-white/10 hover:border-white/30 text-white/70"
                                                    title="Rerun (open in generator)"
                                                >
                                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v6h6M20 20v-6h-6M5 19a9 9 0 0114-7.5M19 5a9 9 0 00-14 7.5" /></svg>
                                                </button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); deleteHistory(item.id); }}
                                                    className="p-1 rounded bg-red-900/20 border border-red-800/30 hover:bg-red-900/30 text-red-400"
                                                    title="Delete"
                                                >
                                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                                </button>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>

                {selectedItem && (
                    <div className="absolute top-0 right-0 h-full w-96 bg-[#0b0d10] border-l border-white/10 shadow-2xl shadow-black/50 flex flex-col">
                        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                            <div className="flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full ${selectedItem.status === 'failed' || selectedItem.error ? 'bg-red-400' : 'bg-emerald-400'}`}></span>
                                <div>
                                    <div className="text-sm font-semibold text-white">Details</div>
                                    <div className="text-[11px] text-white/50">{formatTime(selectedItem.timestamp)}</div>
                                </div>
                            </div>
                            <button onClick={() => setSelectedItem(null)} className="text-white/40 hover:text-white/70">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                            <div className="text-[11px] text-white/60">Model</div>
                            <div className="px-2 py-1 rounded bg-white/[0.05] border border-white/10 text-white/80 text-xs font-mono inline-block">
                                {selectedItem.model || 'model'}
                            </div>

                            <div>
                                <div className="text-[11px] text-white/60 mb-1">Prompt</div>
                                <div className="bg-white/[0.03] border border-white/10 rounded-lg p-3 max-h-48 overflow-y-auto font-mono text-[12px] text-white/80 whitespace-pre-wrap custom-scrollbar">
                                    {selectedItem.prompt || '—'}
                                </div>
                            </div>

                            {selectedItem.response && (
                                <div>
                                    <div className="text-[11px] text-white/60 mb-1">Response</div>
                                    <div className="bg-white/[0.03] border border-white/10 rounded-lg p-3 max-h-48 overflow-y-auto text-sm text-white/80 whitespace-pre-wrap custom-scrollbar">
                                        {selectedItem.response}
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-2 text-xs text-white/70">
                                <div className="bg-white/[0.03] border border-white/10 rounded-lg p-2">
                                    <div className="text-[10px] text-white/40">Tokens</div>
                                    <div className="font-mono text-white/80">{selectedItem.total_tokens ?? '–'}</div>
                                </div>
                                <div className="bg-white/[0.03] border border-white/10 rounded-lg p-2">
                                    <div className="text-[10px] text-white/40">Provider</div>
                                    <div className="text-white/80">{selectedItem.provider || '—'}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
