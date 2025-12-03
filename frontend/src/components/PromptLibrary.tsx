import { useState, useEffect } from 'react';
import { Button } from './ui/Button';

// Prompt status types
type PromptStatus = 'draft' | 'testing' | 'production';

// Version tracking
export interface PromptVersion {
    versionNumber: number;
    text: string;
    description: string;
    createdAt: string;
    createdBy?: string;
}

// Unified Prompt entity
export interface LibraryPrompt {
    id: string;
    name: string;
    text: string;
    technique: string;
    techniqueName: string;

    // Lifecycle status
    status: PromptStatus;

    // Version control
    currentVersion: number;
    versions: PromptVersion[];

    // Evaluation results
    evaluation?: {
        qualityScore: number;      // 0-100
        robustnessScore: number;   // 0-100
        consistencyScore: number;  // 0-100
        overallScore: number;      // 0-100
        lastTested: string;
        datasetId?: string;
        datasetName?: string;
    };

    // Metadata
    category: string;
    tags: string[];
    description: string;
    createdAt: string;
    updatedAt: string;
    usageCount: number;

    // Source tracking
    sourceType: 'generated' | 'manual' | 'optimized' | 'imported';
    sourceGenerationId?: string;
}

interface PromptLibraryProps {
    onEvaluatePrompt?: (prompt: LibraryPrompt) => void;
}

// SVG Icons as React components
const Icons = {
    draft: () => (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
    ),
    testing: () => (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
        </svg>
    ),
    production: () => (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    ),
    copy: () => (
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
    ),
    evaluate: () => (
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
    ),
    duplicate: () => (
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
        </svg>
    ),
    deploy: () => (
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
    ),
    delete: () => (
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
    ),
    target: () => (
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
        </svg>
    ),
    folder: () => (
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
        </svg>
    ),
    calendar: () => (
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
    ),
    refresh: () => (
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
    ),
    library: () => (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
        </svg>
    )
};

const STATUS_CONFIG = {
    draft: {
        label: 'Draft',
        color: 'bg-gray-500',
        textColor: 'text-gray-300',
        Icon: Icons.draft,
        description: 'Not tested yet'
    },
    testing: {
        label: 'Testing',
        color: 'bg-yellow-500',
        textColor: 'text-yellow-300',
        Icon: Icons.testing,
        description: 'Evaluation in progress'
    },
    production: {
        label: 'Production Ready',
        color: 'bg-emerald-500/20',
        textColor: 'text-emerald-300/80',
        Icon: Icons.production,
        description: 'Tested and approved'
    }
};

const CATEGORIES = [
    'All',
    'General',
    'Reasoning',
    'Coding',
    'Creative Writing',
    'Data Extraction',
    'Summarization',
    'Business',
    'Custom'
];

export function PromptLibrary({ onEvaluatePrompt }: PromptLibraryProps) {
    const [prompts, setPrompts] = useState<LibraryPrompt[]>([]);
    const [filteredPrompts, setFilteredPrompts] = useState<LibraryPrompt[]>([]);
    const [selectedPrompt, setSelectedPrompt] = useState<LibraryPrompt | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<PromptStatus | 'all'>('all');
    const [categoryFilter, setCategoryFilter] = useState('All');
    const [sortBy, setSortBy] = useState<'date' | 'score' | 'name' | 'usage'>('date');


    useEffect(() => {
        loadPrompts();
        
        // Listen for prompt library updates from other components
        const handleLibraryUpdate = () => loadPrompts();
        window.addEventListener('prompt-library-updated', handleLibraryUpdate);
        return () => window.removeEventListener('prompt-library-updated', handleLibraryUpdate);
    }, []);

    useEffect(() => {
        filterAndSortPrompts();
    }, [prompts, searchQuery, statusFilter, categoryFilter, sortBy]);

    const loadPrompts = () => {
        setIsLoading(true);
        try {
            const saved = localStorage.getItem('prompt-library');
            if (saved) {
                setPrompts(JSON.parse(saved));
            }
        } catch (e) {
            console.error('Error loading prompts:', e);
        }
        setIsLoading(false);
    };

    const savePrompts = (newPrompts: LibraryPrompt[]) => {
        localStorage.setItem('prompt-library', JSON.stringify(newPrompts));
        setPrompts(newPrompts);
    };

    const filterAndSortPrompts = () => {
        let result = [...prompts];

        // Search filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            result = result.filter(p =>
                p.name.toLowerCase().includes(query) ||
                p.text.toLowerCase().includes(query) ||
                p.tags.some(t => t.toLowerCase().includes(query))
            );
        }

        // Status filter
        if (statusFilter !== 'all') {
            result = result.filter(p => p.status === statusFilter);
        }

        // Category filter
        if (categoryFilter !== 'All') {
            result = result.filter(p => p.category === categoryFilter);
        }

        // Sort
        result.sort((a, b) => {
            switch (sortBy) {
                case 'date':
                    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
                case 'score':
                    return (b.evaluation?.overallScore || 0) - (a.evaluation?.overallScore || 0);
                case 'name':
                    return a.name.localeCompare(b.name);
                case 'usage':
                    return b.usageCount - a.usageCount;
                default:
                    return 0;
            }
        });

        setFilteredPrompts(result);
    };

    const handleDeletePrompt = (promptId: string) => {
        if (!confirm('Delete this prompt from library?')) return;
        const updated = prompts.filter(p => p.id !== promptId);
        savePrompts(updated);
        if (selectedPrompt?.id === promptId) {
            setSelectedPrompt(null);
        }
    };

    const handleUpdateStatus = (promptId: string, newStatus: PromptStatus) => {
        const updated = prompts.map(p =>
            p.id === promptId
                ? { ...p, status: newStatus, updatedAt: new Date().toISOString() }
                : p
        );
        savePrompts(updated);
    };

    const handleCopyPrompt = (text: string) => {
        if (navigator?.clipboard?.writeText) {
            navigator.clipboard.writeText(text).catch(err => {
                console.error('Clipboard copy failed:', err);
            });
        } else {
            console.warn('Clipboard API not available');
        }
    };

    const handleExportPrompt = (prompt: LibraryPrompt) => {
        try {
            const safeName = (prompt.name || 'prompt')
                .toLowerCase()
                .replace(/[^a-z0-9]+/gi, '-')
                .replace(/^-+|-+$/g, '');
            const blob = new Blob([JSON.stringify(prompt, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${safeName || 'prompt'}.json`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (e) {
            console.error('Error exporting prompt:', e);
            alert('Failed to export prompt. Please try again.');
        }
    };

    const handleDuplicatePrompt = (prompt: LibraryPrompt) => {
        const duplicate: LibraryPrompt = {
            ...prompt,
            id: `prompt-${Date.now()}`,
            name: `${prompt.name} (Copy)`,
            status: 'draft',
            evaluation: undefined,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            usageCount: 0,
            sourceType: 'manual'
        };
        savePrompts([...prompts, duplicate]);
    };

    const getScoreColor = (score: number) => {
        if (score >= 80) return 'text-white/80';
        if (score >= 60) return 'text-white/60';
        return 'text-white/40';
    };

    const getScoreBg = (score: number) => {
        if (score >= 80) return 'bg-white/10 border-white/20';
        if (score >= 60) return 'bg-white/5 border-white/15';
        return 'bg-white/5 border-white/10';
    };

    // Stats
    const stats = {
        total: prompts.length,
        draft: prompts.filter(p => p.status === 'draft').length,
        testing: prompts.filter(p => p.status === 'testing').length,
        production: prompts.filter(p => p.status === 'production').length,
        avgScore: prompts.filter(p => p.evaluation).length > 0
            ? Math.round(prompts.filter(p => p.evaluation).reduce((acc, p) => acc + (p.evaluation?.overallScore || 0), 0) / prompts.filter(p => p.evaluation).length)
            : 0
    };

    return (
        <div className="h-full flex gap-6 p-6 overflow-hidden">
            {/* Left Sidebar: Prompts List */}
            <div className="w-80 flex flex-col shrink-0 gap-4">
                {/* Header */}
                <div>
                    <h2 className="text-[11px] font-bold text-white/30 uppercase tracking-widest mb-1">PROMPT LIBRARY</h2>
                    <p className="text-xs text-white/40 mb-4 mt-1">Manage and organize your production-ready prompts</p>
                </div>

                {/* Search */}
                <div className="relative group">
                    <svg className="absolute left-3 top-2.5 w-4 h-4 text-white/20 group-focus-within:text-white/40 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search prompts..."
                        className="w-full bg-black/20 border border-white/5 rounded-lg pl-9 pr-3 py-2 text-sm text-white/80 placeholder:text-white/20 focus:outline-none focus:border-white/20 focus:bg-black/40 transition-all"
                    />
                </div>

                {/* Filters */}
                <div className="flex gap-2">
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as PromptStatus | 'all')}
                        className="flex-1 rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-white/20"
                    >
                        <option value="all">All Status</option>
                        <option value="draft">Draft</option>
                        <option value="testing">Testing</option>
                        <option value="production">Production</option>
                    </select>
                    <select
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        className="flex-1 rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-white/20"
                    >
                        {CATEGORIES.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </select>
                </div>

                <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as 'date' | 'score' | 'name' | 'usage')}
                    className="w-full rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-white/20"
                >
                    <option value="date">Sort by Date</option>
                    <option value="score">Sort by Score</option>
                    <option value="name">Sort by Name</option>
                    <option value="usage">Sort by Usage</option>
                </select>

                {/* Prompts List */}
                <div className="flex-1 overflow-y-auto min-h-0 space-y-1.5 pr-2 custom-scrollbar mt-2 pt-5 border-t border-white/5">
                    {isLoading ? (
                        <div className="text-center py-12 text-white/40 text-xs">Loading...</div>
                    ) : filteredPrompts.length === 0 ? (
                        <div className="text-center py-12 text-white/20 text-xs">
                            {prompts.length === 0
                                ? 'Your prompt library is empty'
                                : 'No prompts match your filters'}
                        </div>
                    ) : (
                        filteredPrompts.map((prompt) => (
                            <button
                                key={prompt.id}
                                onClick={() => setSelectedPrompt(prompt)}
                                className={`w-full text-left px-3 py-2.5 rounded-lg border transition-all ${selectedPrompt?.id === prompt.id
                                    ? 'bg-white/10 border-white/20'
                                    : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.05] hover:border-white/10'
                                }`}
                            >
                                <span className={`block text-[13px] font-medium truncate text-left ${selectedPrompt?.id === prompt.id ? 'text-white' : 'text-white/70'}`}>
                                    {prompt.name}
                                </span>
                            </button>
                        ))
                    )}
                </div>

                {/* Stats Summary */}
                <div className="mt-2 pt-2 border-t border-white/5 flex justify-between text-[10px] text-white/40">
                    <span>{stats.total} total</span>
                    <span>
                        <span className="text-gray-400">{stats.draft} drafts</span>
                        <span className="mx-1">•</span>
                        <span className="text-yellow-400">{stats.testing} testing</span>
                        <span className="mx-1">•</span>
                        <span className="text-white/40">{stats.production} prod</span>
                    </span>
                </div>
            </div>

            {/* Right Panel: Selected Prompt Details */}
            {selectedPrompt ? (
                <div className="flex-1 flex flex-col bg-gradient-to-b from-black/20 to-transparent border border-white/5 rounded-2xl overflow-hidden">
                    <div className="px-5 py-4 border-b border-white/5 flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0 space-y-2">
                            <div className="flex items-center gap-2 flex-wrap">
                                <h2 className="text-lg font-semibold text-white truncate flex items-center gap-2">
                                    {selectedPrompt.name}
                                    <span className="text-[11px] text-white/50">v{selectedPrompt.currentVersion}</span>
                                </h2>
                                <span className={`text-[11px] px-2 py-1 rounded-full ${STATUS_CONFIG[selectedPrompt.status].color} ${STATUS_CONFIG[selectedPrompt.status].textColor}`}>
                                    {STATUS_CONFIG[selectedPrompt.status].label}
                                </span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-white/50 flex-wrap">
                                <span>{selectedPrompt.techniqueName || selectedPrompt.technique}</span>
                                <span>•</span>
                                <span>{selectedPrompt.category}</span>
                                <span>•</span>
                                <span>Updated {new Date(selectedPrompt.updatedAt).toLocaleDateString()}</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                            <button
                                onClick={() => handleExportPrompt(selectedPrompt)}
                                className="px-3 py-1.5 text-xs font-medium rounded-lg border border-white/10 bg-white/[0.04] text-white/70 hover:text-white hover:border-white/30 transition-all"
                            >
                                Export
                            </button>
                            <button
                                onClick={() => handleDuplicatePrompt(selectedPrompt)}
                                className="px-3 py-1.5 text-xs font-medium rounded-lg border border-white/10 bg-white/[0.04] text-white/70 hover:text-white hover:border-white/30 transition-all"
                            >
                                Duplicate
                            </button>
                            {selectedPrompt.status !== 'production' && (
                                <button
                                    onClick={() => {
                                        handleUpdateStatus(selectedPrompt.id, 'production');
                                        setSelectedPrompt({ ...selectedPrompt, status: 'production' });
                                    }}
                                    className="px-3 py-1.5 text-xs font-medium rounded-lg border border-white/10 bg-white/[0.04] text-white/70 hover:text-white hover:border-white/30 transition-all"
                                >
                                    Deploy
                                </button>
                            )}
                            <button
                                onClick={() => handleDeletePrompt(selectedPrompt.id)}
                                className="px-2 py-1.5 rounded-lg border border-red-800/30 bg-red-900/20 text-red-300 hover:bg-red-900/30 transition-all"
                                title="Delete"
                            >
                                <Icons.delete />
                            </button>
                            <Button onClick={() => setSelectedPrompt(null)} variant="ghost" size="icon" className="p-2 text-white/60 hover:text-white">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </Button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-5 space-y-4">
                        {selectedPrompt.evaluation && (
                            <div className="grid grid-cols-4 gap-3">
                                <div className={`p-3 rounded-lg border ${getScoreBg(selectedPrompt.evaluation.overallScore)}`}>
                                    <div className={`text-xl font-bold ${getScoreColor(selectedPrompt.evaluation.overallScore)}`}>
                                        {selectedPrompt.evaluation.overallScore}%
                                    </div>
                                    <div className="text-[11px] text-white/40">Overall</div>
                                </div>
                                <div className="bg-white/[0.03] border border-white/5 rounded-lg p-3">
                                    <div className={`text-sm font-bold ${getScoreColor(selectedPrompt.evaluation.qualityScore)}`}>
                                        {selectedPrompt.evaluation.qualityScore}%
                                    </div>
                                    <div className="text-[10px] text-white/40">Quality</div>
                                </div>
                                <div className="bg-white/[0.03] border border-white/5 rounded-lg p-3">
                                    <div className={`text-sm font-bold ${getScoreColor(selectedPrompt.evaluation.robustnessScore)}`}>
                                        {selectedPrompt.evaluation.robustnessScore}%
                                    </div>
                                    <div className="text-[10px] text-white/40">Robust</div>
                                </div>
                                <div className="bg-white/[0.03] border border-white/5 rounded-lg p-3">
                                    <div className={`text-sm font-bold ${getScoreColor(selectedPrompt.evaluation.consistencyScore)}`}>
                                        {selectedPrompt.evaluation.consistencyScore}%
                                    </div>
                                    <div className="text-[10px] text-white/40">Consist</div>
                                </div>
                            </div>
                        )}

                        <div className="rounded-xl border border-white/5 bg-[#0B0D10]">
                            <div className="flex items-center justify-between px-4 py-2 border-b border-white/5">
                                <div className="text-[11px] uppercase tracking-[0.16em] text-white/40">Prompt</div>
                                {selectedPrompt.usageCount > 0 && (
                                    <div className="text-[11px] text-white/50 flex items-center gap-1">
                                        <Icons.refresh />
                                        <span>{selectedPrompt.usageCount} uses</span>
                                    </div>
                                )}
                            </div>
                            <div className="max-h-[520px] overflow-y-auto font-mono text-[12px] text-white/80 custom-scrollbar">
                                {selectedPrompt.text.split('\n').map((line, idx) => {
                                    const segments = line.split(/(\{\{.*?\}\})/g);
                                    return (
                                        <div key={idx} className="flex">
                                            <div className="w-12 shrink-0 text-right pr-3 pl-4 text-white/30 select-none">
                                                {idx + 1}
                                            </div>
                                            <div className="flex-1 whitespace-pre-wrap pr-4">
                                                {segments.map((part, i) =>
                                                    part.startsWith('{{') && part.endsWith('}}') ? (
                                                        <span key={i} className="text-amber-300">{part}</span>
                                                    ) : (
                                                        <span key={i}>{part}</span>
                                                    )
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="flex-1 flex flex-col bg-gradient-to-b from-black/20 to-transparent border border-white/5 rounded-2xl overflow-hidden">
                    <div className="flex-1 flex items-center justify-center p-8">
                        <div className="text-center">
                            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-center text-white/20">
                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </div>
                            <p className="text-sm text-white/40">Select a prompt from the list</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// Helper function to save prompt to library (used by other components)
export function savePromptToLibrary(prompt: Omit<LibraryPrompt, 'id' | 'createdAt' | 'updatedAt' | 'usageCount' | 'currentVersion' | 'versions'>): LibraryPrompt {
    const saved = localStorage.getItem('prompt-library');
    const prompts: LibraryPrompt[] = saved ? JSON.parse(saved) : [];

    const now = new Date().toISOString();
    const initialVersion: PromptVersion = {
        versionNumber: 1,
        text: prompt.text,
        description: 'Initial version',
        createdAt: now
    };

    const newPrompt: LibraryPrompt = {
        ...prompt,
        id: `prompt-${Date.now()}`,
        currentVersion: 1,
        versions: [initialVersion],
        createdAt: now,
        updatedAt: now,
        usageCount: 0
    };

    prompts.push(newPrompt);
    localStorage.setItem('prompt-library', JSON.stringify(prompts));
    
    // Notify PromptLibrary component to refresh
    window.dispatchEvent(new CustomEvent('prompt-library-updated'));

    return newPrompt;
}

// Helper function to update prompt evaluation in library
export function updatePromptEvaluation(promptId: string, evaluation: LibraryPrompt['evaluation']): void {
    const saved = localStorage.getItem('prompt-library');
    if (!saved) return;

    const prompts: LibraryPrompt[] = JSON.parse(saved);
    const updated = prompts.map(p =>
        p.id === promptId
            ? {
                ...p,
                evaluation,
                status: 'testing' as PromptStatus,
                updatedAt: new Date().toISOString()
            }
            : p
    );

    localStorage.setItem('prompt-library', JSON.stringify(updated));
}

// Helper function to create a new version of a prompt
export function createNewVersion(promptId: string, newText: string, description: string): void {
    const saved = localStorage.getItem('prompt-library');
    if (!saved) return;

    const prompts: LibraryPrompt[] = JSON.parse(saved);
    const updated = prompts.map(p => {
        if (p.id === promptId) {
            const newVersionNumber = p.currentVersion + 1;
            const newVersion: PromptVersion = {
                versionNumber: newVersionNumber,
                text: newText,
                description,
                createdAt: new Date().toISOString()
            };

            return {
                ...p,
                text: newText,
                currentVersion: newVersionNumber,
                versions: [...p.versions, newVersion],
                updatedAt: new Date().toISOString()
            };
        }
        return p;
    });

    localStorage.setItem('prompt-library', JSON.stringify(updated));
}

// Helper function to rollback to a previous version
export function rollbackToVersion(promptId: string, versionNumber: number, description: string): void {
    const saved = localStorage.getItem('prompt-library');
    if (!saved) return;

    const prompts: LibraryPrompt[] = JSON.parse(saved);
    const updated = prompts.map(p => {
        if (p.id === promptId) {
            const targetVersion = p.versions.find(v => v.versionNumber === versionNumber);
            if (!targetVersion) return p;

            // Create new version from rollback
            const newVersionNumber = p.currentVersion + 1;
            const newVersion: PromptVersion = {
                versionNumber: newVersionNumber,
                text: targetVersion.text,
                description: description || `Rolled back to v${versionNumber}`,
                createdAt: new Date().toISOString()
            };

            return {
                ...p,
                text: targetVersion.text,
                currentVersion: newVersionNumber,
                versions: [...p.versions, newVersion],
                updatedAt: new Date().toISOString()
            };
        }
        return p;
    });

    localStorage.setItem('prompt-library', JSON.stringify(updated));
}
