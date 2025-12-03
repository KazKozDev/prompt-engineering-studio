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
            setHistory(data.history || []);
            setHistoryStats(data.stats || null);
        } catch (error) {
            console.error('Failed to load history:', error);
        }
    };

    const deleteHistory = async (id: string) => {
        try {
            await api.deleteHistoryItem(id);
            if (selectedItem?.id === id) {
                setSelectedItem(null);
            }
            loadHistory();
        } catch (error) {
            console.error('Failed to delete history item:', error);
        }
    };

    const filteredHistory = history.filter((item) => {
        const status = item.status || (item.error ? 'failed' : 'success');
        if (statusFilter !== 'all' && status !== statusFilter) return false;
        if (modelsFilter.length > 0 && !modelsFilter.includes(item.model)) return false;
        if (dateRange !== 'all') {
            const ts = new Date(item.timestamp).getTime();
            const now = Date.now();
            const rangeMs =
                dateRange === '24h'
                    ? 24 * 60 * 60 * 1000
                    : dateRange === '7d'
                    ? 7 * 24 * 60 * 60 * 1000
                    : 30 * 24 * 60 * 60 * 1000;
            if (now - ts > rangeMs) return false;
        }
        return true;
    });

    const uniqueModels = Array.from(new Set(history.map((h) => h.model).filter(Boolean)));

    const formatTime = (timestamp: string) => {
        const date = new Date(timestamp);
        const today = new Date();
        const isToday = date.toDateString() === today.toDateString();
        return `${isToday ? 'Today' : date.toLocaleDateString()} ${date.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
        })}`;
    };

    const handleCopy = (text: string) => navigator.clipboard.writeText(text);

    return (
        <div className="h-full flex flex-col">
            {/* Main content */}
            <div className="flex-1 flex gap-6 p-6 overflow-hidden">
                {/* Left Sidebar */}
                <div className="w-80 flex flex-col shrink-0">
                    <div className="flex-1 flex flex-col gap-4">
                        <div>
                            <h2 className="text-[11px] font-bold text-white/30 uppercase tracking-widest mb-1">
                                GENERATION HISTORY
                            </h2>
                            <p className="text-xs text-white/40 mb-4 mt-1">
                                Track your prompt generation history and usage statistics
                            </p>
                        </div>

                        {/* Filters */}
                        <div className="flex gap-2">
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value as any)}
                                className="flex-1 rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-white/20"
                            >
                                <option value="all">All Status</option>
                                <option value="success">Success</option>
                                <option value="failed">Failed</option>
                            </select>
                            <select
                                value={dateRange}
                                onChange={(e) => setDateRange(e.target.value as any)}
                                className="flex-1 rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-white/20"
                            >
                                <option value="all">All time</option>
                                <option value="24h">Last 24h</option>
                                <option value="7d">Last 7 days</option>
                                <option value="30d">Last 30 days</option>
                            </select>
                        </div>

                        {uniqueModels.length > 0 && (
                            <select
                                value={modelsFilter[0] || ''}
                                onChange={(e) => setModelsFilter(e.target.value ? [e.target.value] : [])}
                                className="rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-white/20"
                            >
                                <option value="">All Models</option>
                                {uniqueModels.map((model) => (
                                    <option key={model} value={model}>
                                        {model}
                                    </option>
                                ))}
                            </select>
                        )}

                        <button
                            onClick={loadHistory}
                            className="self-start px-3 py-1.5 text-xs font-medium rounded-lg border border-white/10 bg-white/[0.04] text-white/70 hover:text-white hover:border-white/30 transition-all"
                        >
                            Refresh
                        </button>
                    </div>

                    {/* Stats Summary (matches Datasets / Library style) */}
                    {historyStats && (
                        <div className="pt-2 border-t border-white/5 flex justify-between text-[10px] text-white/40">
                            <span>{historyStats.total_generations} generations</span>
                            <span>
                                {historyStats.total_tokens.toLocaleString()} tokens
                                {historyStats.most_used_technique && (
                                    <>
                                        <span className="mx-1">•</span>
                                        <span className="truncate max-w-[140px] inline-block align-bottom">
                                            {historyStats.most_used_technique}
                                        </span>
                                    </>
                                )}
                            </span>
                        </div>
                    )}
                </div>

                {/* Middle Panel: History List */}
                <div className="flex-1 flex flex-col bg-gradient-to-b from-black/20 to-transparent border border-white/5 rounded-2xl overflow-hidden">
                    <div className="px-6 py-5 border-b border-white/5 bg-white/[0.02]">
                        <h2 className="text-xl font-semibold text-white/90 leading-tight mb-1">
                            Recent Prompt Generations
                        </h2>
                        <p className="text-xs text-white/45 mt-1">
                            Browse runs, outcomes, and models in one place.
                        </p>
                    </div>

                    <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
                        {history.length === 0 ? (
                            <div className="text-center py-12 text-white/40">
                                <div className="text-sm font-medium mb-2">No history yet</div>
                                <div className="text-xs text-white/30">Your generations will appear here</div>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {filteredHistory.map((item) => (
                                    <button
                                        key={item.id}
                                        onClick={() => setSelectedItem(item)}
                                        className={`w-full text-left p-4 rounded-xl border transition-all ${
                                            selectedItem?.id === item.id
                                                ? 'bg-white/10 border-white/20'
                                                : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.04] hover:border-white/10'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between gap-3 mb-2">
                                            <div className="flex items-center gap-3 min-w-0">
                                                <span className="text-xs text-white/50">
                                                    {formatTime(item.timestamp)}
                                                </span>
                                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-white/40 font-mono shrink-0">
                                                    {item.model || 'model'}
                                                </span>
                                            </div>
                                            <span className="text-[11px] text-white/40">
                                                {item.total_tokens != null
                                                    ? `${item.total_tokens} tokens`
                                                    : '—'}
                                            </span>
                                        </div>
                                        <div className="text-sm text-white/80 line-clamp-2">
                                            {item.prompt || '—'}
                                        </div>
                                        {item.status === 'failed' || item.error ? (
                                            <div className="mt-2 text-[11px] text-red-400">
                                                Failed{item.error ? `: ${item.error}` : ''}
                                            </div>
                                        ) : null}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Panel: Selected Details */}
                <div className="w-96 flex flex-col bg-[#0b0d10] border border-white/10 rounded-2xl shadow-2xl shadow-black/50 overflow-hidden">
                    {selectedItem ? (
                        <>
                            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                                <div className="flex items-center gap-2">
                                    <div>
                                        <div className="text-sm font-semibold text-white">Details</div>
                                        <div className="text-[11px] text-white/50">
                                            {formatTime(selectedItem.timestamp)}
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setSelectedItem(null)}
                                    className="p-2 text-white/60 hover:text-white transition-colors"
                                >
                                    <svg
                                        className="w-4 h-4"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M6 18L18 6M6 6l12 12"
                                        />
                                    </svg>
                                </button>
                            </div>
                            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => handleCopy(selectedItem.prompt || '')}
                                        className="px-3 py-1.5 text-xs font-medium rounded-lg border border-white/10 bg-white/[0.04] text-white/70 hover:text-white hover:border-white/30 transition-all"
                                    >
                                        Copy
                                    </button>
                                    <button
                                        onClick={() => deleteHistory(selectedItem.id)}
                                        className="px-2 py-1.5 rounded-lg border border-red-800/30 bg-red-900/20 text-red-300 hover:bg-red-900/30 transition-all"
                                        title="Delete"
                                    >
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                            />
                                        </svg>
                                    </button>
                                </div>

                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] text-white/40">Model used</span>
                                    <span className="px-2 py-0.5 rounded bg-white/5 text-white/60 text-[11px] font-mono">
                                        {selectedItem.model || 'model'}
                                    </span>
                                    <span className="text-[10px] text-white/40 ml-2">
                                        {selectedItem.total_tokens ?? '–'} tokens
                                    </span>
                                </div>

                                <div>
                                    <div className="text-[10px] text-white/40 uppercase tracking-wider mb-2">
                                        Prompt
                                    </div>
                                    <div className="bg-white/[0.02] border border-white/5 rounded-lg p-3 font-mono text-[12px] text-white/70 whitespace-pre-wrap">
                                        {selectedItem.prompt || '—'}
                                    </div>
                                </div>

                                {selectedItem.response && (
                                    <div>
                                        <div className="text-[10px] text-white/40 uppercase tracking-wider mb-2">
                                            Response
                                        </div>
                                        <div className="bg-white/[0.02] border border-white/5 rounded-lg p-3 text-xs text-white/70 whitespace-pre-wrap">
                                            {selectedItem.response}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center px-4 text-center text-xs text-white/40">
                            <div className="text-sm font-medium text-white/60 mb-1">No generation selected</div>
                            <div>Select a run on the left to see full prompt and response.</div>
                        </div>
                    )}
                </div>
            </div>

        </div>
    );
}
