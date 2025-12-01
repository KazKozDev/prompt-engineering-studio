import { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { type LibraryPrompt } from '../PromptLibrary';
import { Button } from '../ui/Button';

interface PromptSelectorProps {
    onSelect: (text: string) => void;
    onClose: () => void;
}

type Source = 'library' | 'history';

export function PromptSelector({ onSelect, onClose }: PromptSelectorProps) {
    const [activeSource, setActiveSource] = useState<Source>('library');
    const [libraryPrompts, setLibraryPrompts] = useState<LibraryPrompt[]>([]);
    const [historyPrompts, setHistoryPrompts] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        loadData();
    }, [activeSource]);

    const loadData = async () => {
        setLoading(true);
        try {
            if (activeSource === 'library') {
                const saved = localStorage.getItem('prompt-library');
                if (saved) {
                    setLibraryPrompts(JSON.parse(saved));
                }
            } else {
                const data = await api.getHistory(50);
                setHistoryPrompts(data.history || []);
            }
        } catch (error) {
            console.error('Error loading prompts:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredLibrary = libraryPrompts.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.text.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredHistory = historyPrompts.filter(p =>
        p.prompt.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-[#1c1c1e] w-full max-w-2xl rounded-2xl border border-white/10 shadow-2xl flex flex-col max-h-[80vh] overflow-hidden">
                {/* Header */}
                <div className="px-6 py-4 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                    <h3 className="text-lg font-semibold text-white/90">Select Prompt</h3>
                    <Button onClick={onClose} variant="ghost" size="icon" className="text-white/60 hover:text-white transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </Button>
                </div>

                {/* Tabs & Search */}
                <div className="p-4 border-b border-white/5 space-y-4">
                    <div className="flex p-1 bg-black/40 rounded-lg border border-white/5">
                        <Button
                            onClick={() => setActiveSource('library')}
                            variant={activeSource === 'library' ? 'secondary' : 'ghost'}
                            size="xs"
                            className="flex-1 py-1.5 text-xs font-medium rounded-md"
                        >
                            Prompt Library
                        </Button>
                        <Button
                            onClick={() => setActiveSource('history')}
                            variant={activeSource === 'history' ? 'secondary' : 'ghost'}
                            size="xs"
                            className="flex-1 py-1.5 text-xs font-medium rounded-md"
                        >
                            History
                        </Button>
                    </div>

                    <div className="relative">
                        <svg className="absolute left-3 top-2.5 w-4 h-4 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search prompts..."
                            className="w-full bg-black/20 border border-white/5 rounded-lg pl-9 pr-3 py-2 text-sm text-white/80 placeholder:text-white/20 focus:outline-none focus:border-white/20 transition-all"
                        />
                    </div>
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
                    {loading ? (
                        <div className="text-center py-8 text-white/30 text-xs">Loading...</div>
                    ) : activeSource === 'library' ? (
                        filteredLibrary.length === 0 ? (
                            <div className="text-center py-8 text-white/30 text-xs">No prompts found in library</div>
                        ) : (
                            filteredLibrary.map(p => (
                                <button
                                    key={p.id}
                                    onClick={() => onSelect(p.text)}
                                    className="w-full text-left p-3 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/10 transition-all group"
                                >
                                    <div className="flex justify-between items-start gap-2 mb-1">
                                        <span className="text-sm font-medium text-white/90 group-hover:text-white transition-colors truncate">{p.name}</span>
                                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-white/40 border border-white/5 shrink-0">{p.category}</span>
                                    </div>
                                    <p className="text-xs text-white/50 line-clamp-2 font-mono text-left">{p.text}</p>
                                </button>
                            ))
                        )
                    ) : (
                        filteredHistory.length === 0 ? (
                            <div className="text-center py-8 text-white/30 text-xs">No history found</div>
                        ) : (
                            filteredHistory.map(h => (
                                <button
                                    key={h.id}
                                    onClick={() => onSelect(h.prompt)}
                                    className="w-full text-left p-3 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/10 transition-all group"
                                >
                                    <div className="flex justify-between items-start gap-2 mb-1">
                                        <span className="text-xs font-medium text-white/60 shrink-0">{new Date(h.timestamp).toLocaleString()}</span>
                                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-white/30 shrink-0">{h.techniques?.[0] || ''}</span>
                                    </div>
                                    <p className="text-xs text-white/50 line-clamp-2 font-mono text-left group-hover:text-white/70 transition-colors">{h.prompt}</p>
                                </button>
                            ))
                        )
                    )}
                </div>
            </div>
        </div>
    );
}
