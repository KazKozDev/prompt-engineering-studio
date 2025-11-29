import { useState, useEffect } from 'react';
import { api } from '../services/api';

export function History() {
    const [history, setHistory] = useState<any[]>([]);
    const [historyStats, setHistoryStats] = useState<any>(null);

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

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-3xl font-bold text-slate-100">Generation History</h2>
                <button
                    onClick={loadHistory}
                    className="text-xs px-3 py-1.5 rounded-md border border-gray-700 bg-gray-800 text-slate-200 hover:bg-gray-700"
                >
                    Refresh
                </button>
            </div>

            {historyStats && (
                <div className="grid grid-cols-4 gap-4 mb-6">
                    <div className="border border-gray-700 rounded-lg p-3 bg-gray-800/30">
                        <div className="text-xs text-slate-400">Total Generations</div>
                        <div className="text-xl font-semibold text-slate-100">{historyStats.total_generations}</div>
                    </div>
                    <div className="border border-gray-700 rounded-lg p-3 bg-gray-800/30">
                        <div className="text-xs text-slate-400">Total Tokens</div>
                        <div className="text-xl font-semibold text-slate-100">{historyStats.total_tokens.toLocaleString()}</div>
                    </div>
                    <div className="border border-gray-700 rounded-lg p-3 bg-gray-800/30">
                        <div className="text-xs text-slate-400">Most Used</div>
                        <div className="text-sm font-semibold text-slate-100 truncate">{historyStats.most_used_technique || 'N/A'}</div>
                    </div>
                    <div className="border border-gray-700 rounded-lg p-3 bg-gray-800/30">
                        <div className="text-xs text-slate-400">Providers</div>
                        <div className="text-sm font-semibold text-slate-100">{Object.keys(historyStats.providers || {}).join(', ')}</div>
                    </div>
                </div>
            )}

            <div className="space-y-3">
                {history.length === 0 ? (
                    <div className="text-center py-12 text-slate-400">
                        <div className="text-sm font-medium mb-2">No history yet</div>
                        <div className="text-xs">Your generations will appear here</div>
                    </div>
                ) : (
                    history.map((item) => (
                        <div key={item.id} className="border border-gray-700 rounded-lg p-4 bg-gray-800/30">
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <div className="text-sm font-semibold text-slate-100">{new Date(item.timestamp).toLocaleString()}</div>
                                    <div className="text-xs text-slate-400 mt-1">
                                        {item.provider} • {item.model} • {item.techniques.length} techniques • {item.total_tokens} tokens
                                    </div>
                                </div>
                                <button
                                    onClick={() => deleteHistory(item.id)}
                                    className="text-xs px-2 py-1 rounded border border-red-700 bg-red-900/30 text-red-200 hover:bg-red-900/50"
                                >
                                    Delete
                                </button>
                            </div>
                            <div className="text-xs text-slate-300 mt-2 line-clamp-2">{item.prompt}</div>
                            <div className="flex gap-2 mt-2">
                                {item.techniques.map((tech: string) => (
                                    <span key={tech} className="text-xs px-2 py-0.5 rounded bg-gray-700 text-slate-300">{tech}</span>
                                ))}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
