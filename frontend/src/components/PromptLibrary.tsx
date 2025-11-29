import { useState, useEffect } from 'react';
import { api } from '../services/api';

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
    onSelectPrompt?: (prompt: LibraryPrompt) => void;
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
        color: 'bg-green-500',
        textColor: 'text-green-300',
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

export function PromptLibrary({ onSelectPrompt, onEvaluatePrompt }: PromptLibraryProps) {
    const [prompts, setPrompts] = useState<LibraryPrompt[]>([]);
    const [filteredPrompts, setFilteredPrompts] = useState<LibraryPrompt[]>([]);
    const [selectedPrompt, setSelectedPrompt] = useState<LibraryPrompt | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<PromptStatus | 'all'>('all');
    const [categoryFilter, setCategoryFilter] = useState('All');
    const [sortBy, setSortBy] = useState<'date' | 'score' | 'name' | 'usage'>('date');

    // UI state
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingPrompt, setEditingPrompt] = useState<LibraryPrompt | null>(null);
    
    // Edit mode state
    const [isEditing, setIsEditing] = useState(false);
    const [editedText, setEditedText] = useState('');
    const [editDescription, setEditDescription] = useState('');

    useEffect(() => {
        loadPrompts();
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
        navigator.clipboard.writeText(text);
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
        if (score >= 80) return 'text-green-400';
        if (score >= 60) return 'text-yellow-400';
        return 'text-red-400';
    };

    const getScoreBg = (score: number) => {
        if (score >= 80) return 'bg-green-900/30 border-green-700';
        if (score >= 60) return 'bg-yellow-900/30 border-yellow-700';
        return 'bg-red-900/30 border-red-700';
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
        <div className="p-6 h-full flex flex-col overflow-hidden">
            {/* Header */}
            <div className="mb-6">
                <h2 className="text-3xl font-bold text-slate-100 mb-2">Prompt Library</h2>
                <p className="text-slate-400">
                    Central repository for all your prompts. Track status, scores, and deploy to production.
                </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-5 gap-4 mb-6">
                <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                    <div className="text-2xl font-bold text-slate-100">{stats.total}</div>
                    <div className="text-sm text-slate-400">Total Prompts</div>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                    <div className="text-2xl font-bold text-gray-400">{stats.draft}</div>
                    <div className="text-sm text-slate-400 flex items-center gap-1"><Icons.draft /> Drafts</div>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                    <div className="text-2xl font-bold text-yellow-400">{stats.testing}</div>
                    <div className="text-sm text-slate-400 flex items-center gap-1"><Icons.testing /> Testing</div>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                    <div className="text-2xl font-bold text-green-400">{stats.production}</div>
                    <div className="text-sm text-slate-400 flex items-center gap-1"><Icons.production /> Production</div>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                    <div className={`text-2xl font-bold ${getScoreColor(stats.avgScore)}`}>
                        {stats.avgScore > 0 ? `${stats.avgScore}%` : '—'}
                    </div>
                    <div className="text-sm text-slate-400">Avg Score</div>
                </div>
            </div>

            {/* Filters */}
            <div className="flex gap-4 mb-4 flex-wrap">
                <input
                    type="text"
                    placeholder="Search prompts..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1 min-w-[200px] rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-slate-200"
                />
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as PromptStatus | 'all')}
                    className="rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-slate-200"
                >
                    <option value="all">All Status</option>
                    <option value="draft">Draft</option>
                    <option value="testing">Testing</option>
                    <option value="production">Production</option>
                </select>
                <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-slate-200"
                >
                    {CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                    ))}
                </select>
                <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as 'date' | 'score' | 'name' | 'usage')}
                    className="rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-slate-200"
                >
                    <option value="date">Sort by Date</option>
                    <option value="score">Sort by Score</option>
                    <option value="name">Sort by Name</option>
                    <option value="usage">Sort by Usage</option>
                </select>
            </div>

            {/* Prompts List */}
            <div className="flex-1 overflow-y-auto">
                {isLoading ? (
                    <div className="text-center py-12 text-slate-400">Loading...</div>
                ) : filteredPrompts.length === 0 ? (
                    <div className="text-center py-12 bg-gray-800/30 rounded-lg border border-gray-700">
                        <div className="text-slate-500 mb-4"><Icons.library /></div>
                        <p className="text-slate-400 mb-2">
                            {prompts.length === 0
                                ? 'Your prompt library is empty'
                                : 'No prompts match your filters'}
                        </p>
                        <p className="text-sm text-slate-500">
                            Generate prompts in Prompt Generator and save them here
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {filteredPrompts.map((prompt) => (
                            <div
                                key={prompt.id}
                                className={`bg-gray-800/50 rounded-lg border transition-colors cursor-pointer ${selectedPrompt?.id === prompt.id
                                    ? 'border-purple-500'
                                    : 'border-gray-700 hover:border-gray-600'
                                    }`}
                                onClick={() => setSelectedPrompt(prompt)}
                            >
                                <div className="p-4">
                                    <div className="flex items-start justify-between gap-4">
                                        {/* Left: Info */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-slate-300">{STATUS_CONFIG[prompt.status].Icon()}</span>
                                                <h3 className="font-semibold text-slate-100 truncate">{prompt.name}</h3>
                                                <span className={`text-xs px-2 py-0.5 rounded ${STATUS_CONFIG[prompt.status].color} text-white`}>
                                                    {STATUS_CONFIG[prompt.status].label}
                                                </span>
                                                <span className="text-xs px-2 py-0.5 rounded bg-gray-700 text-gray-300">
                                                    v{prompt.currentVersion}
                                                </span>
                                            </div>
                                            <p className="text-sm text-slate-400 line-clamp-1 mb-2">
                                                {prompt.text.substring(0, 150)}...
                                            </p>
                                            <div className="flex items-center gap-3 text-xs text-slate-500">
                                                <span className="flex items-center gap-1"><Icons.target /> {prompt.techniqueName || prompt.technique}</span>
                                                <span className="flex items-center gap-1"><Icons.folder /> {prompt.category}</span>
                                                <span className="flex items-center gap-1"><Icons.calendar /> {new Date(prompt.updatedAt).toLocaleDateString()}</span>
                                                {prompt.usageCount > 0 && <span className="flex items-center gap-1"><Icons.refresh /> {prompt.usageCount} uses</span>}
                                            </div>
                                        </div>

                                        {/* Right: Score */}
                                        <div className="flex-shrink-0">
                                            {prompt.evaluation ? (
                                                <div className={`px-4 py-2 rounded-lg border ${getScoreBg(prompt.evaluation.overallScore)}`}>
                                                    <div className={`text-2xl font-bold ${getScoreColor(prompt.evaluation.overallScore)}`}>
                                                        {prompt.evaluation.overallScore}%
                                                    </div>
                                                    <div className="text-xs text-slate-400">Overall Score</div>
                                                </div>
                                            ) : (
                                                <div className="px-4 py-2 rounded-lg border border-gray-600 bg-gray-700/30">
                                                    <div className="text-2xl font-bold text-gray-500">—</div>
                                                    <div className="text-xs text-slate-500">Not Tested</div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Evaluation Details (if exists) */}
                                    {prompt.evaluation && (
                                        <div className="mt-3 pt-3 border-t border-gray-700 flex gap-4">
                                            <div className="text-xs">
                                                <span className="text-slate-500">Quality:</span>
                                                <span className={`ml-1 ${getScoreColor(prompt.evaluation.qualityScore)}`}>
                                                    {prompt.evaluation.qualityScore}%
                                                </span>
                                            </div>
                                            <div className="text-xs">
                                                <span className="text-slate-500">Robustness:</span>
                                                <span className={`ml-1 ${getScoreColor(prompt.evaluation.robustnessScore)}`}>
                                                    {prompt.evaluation.robustnessScore}%
                                                </span>
                                            </div>
                                            <div className="text-xs">
                                                <span className="text-slate-500">Consistency:</span>
                                                <span className={`ml-1 ${getScoreColor(prompt.evaluation.consistencyScore)}`}>
                                                    {prompt.evaluation.consistencyScore}%
                                                </span>
                                            </div>
                                            {prompt.evaluation.datasetName && (
                                                <div className="text-xs text-slate-500">
                                                    Dataset: {prompt.evaluation.datasetName}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Actions */}
                                    <div className="mt-3 pt-3 border-t border-gray-700 flex gap-2" onClick={e => e.stopPropagation()}>
                                        <button
                                            onClick={() => handleCopyPrompt(prompt.text)}
                                            className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-xs rounded"
                                        >
                                            <span className="flex items-center gap-1"><Icons.copy /> Copy</span>
                                        </button>
                                        {onEvaluatePrompt && (
                                            <button
                                                onClick={() => onEvaluatePrompt(prompt)}
                                                className="px-3 py-1.5 bg-purple-900/50 hover:bg-purple-900/70 text-purple-300 text-xs rounded"
                                            >
                                                <span className="flex items-center gap-1"><Icons.evaluate /> Evaluate</span>
                                            </button>
                                        )}
                                        <button
                                            onClick={() => handleDuplicatePrompt(prompt)}
                                            className="px-3 py-1.5 bg-blue-900/50 hover:bg-blue-900/70 text-blue-300 text-xs rounded"
                                        >
                                            <span className="flex items-center gap-1"><Icons.duplicate /> Duplicate</span>
                                        </button>
                                        {prompt.status !== 'production' && (
                                            <button
                                                onClick={() => handleUpdateStatus(prompt.id, 'production')}
                                                className="px-3 py-1.5 bg-green-900/50 hover:bg-green-900/70 text-green-300 text-xs rounded"
                                            >
                                                <span className="flex items-center gap-1"><Icons.deploy /> Mark Production</span>
                                            </button>
                                        )}
                                        <button
                                            onClick={() => handleDeletePrompt(prompt.id)}
                                            className="px-3 py-1.5 bg-red-900/50 hover:bg-red-900/70 text-red-300 text-xs rounded ml-auto"
                                        >
                                            <span className="flex items-center gap-1"><Icons.delete /> Delete</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Selected Prompt Detail Modal */}
            {selectedPrompt && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => { setSelectedPrompt(null); setIsEditing(false); }}>
                    <div className="bg-gray-800 rounded-lg max-w-4xl w-full max-h-[85vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
                        <div className="p-6 border-b border-gray-700">
                            <div className="flex justify-between items-start">
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="text-slate-300">{STATUS_CONFIG[selectedPrompt.status].Icon()}</span>
                                        <h3 className="text-xl font-semibold text-slate-100">{selectedPrompt.name}</h3>
                                        <span className={`text-xs px-2 py-0.5 rounded ${STATUS_CONFIG[selectedPrompt.status].color} text-white`}>
                                            {STATUS_CONFIG[selectedPrompt.status].label}
                                        </span>
                                    </div>
                                    <div className="flex gap-3 text-sm text-slate-400">
                                        <span className="flex items-center gap-1"><Icons.target /> {selectedPrompt.techniqueName}</span>
                                        <span className="flex items-center gap-1"><Icons.folder /> {selectedPrompt.category}</span>
                                        <span className="flex items-center gap-1"><Icons.calendar /> Created: {new Date(selectedPrompt.createdAt).toLocaleDateString()}</span>
                                    </div>
                                </div>
                                <button onClick={() => { setSelectedPrompt(null); setIsEditing(false); }} className="text-slate-400 hover:text-slate-200">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        <div className="p-6 overflow-y-auto flex-1">
                            {/* Evaluation Scores */}
                            {selectedPrompt.evaluation && (
                                <div className="mb-6 grid grid-cols-4 gap-4">
                                    <div className={`p-4 rounded-lg border ${getScoreBg(selectedPrompt.evaluation.overallScore)}`}>
                                        <div className={`text-3xl font-bold ${getScoreColor(selectedPrompt.evaluation.overallScore)}`}>
                                            {selectedPrompt.evaluation.overallScore}%
                                        </div>
                                        <div className="text-sm text-slate-400">Overall Score</div>
                                    </div>
                                    <div className="p-4 rounded-lg border border-gray-700 bg-gray-700/30">
                                        <div className={`text-2xl font-bold ${getScoreColor(selectedPrompt.evaluation.qualityScore)}`}>
                                            {selectedPrompt.evaluation.qualityScore}%
                                        </div>
                                        <div className="text-sm text-slate-400">Quality</div>
                                    </div>
                                    <div className="p-4 rounded-lg border border-gray-700 bg-gray-700/30">
                                        <div className={`text-2xl font-bold ${getScoreColor(selectedPrompt.evaluation.robustnessScore)}`}>
                                            {selectedPrompt.evaluation.robustnessScore}%
                                        </div>
                                        <div className="text-sm text-slate-400">Robustness</div>
                                    </div>
                                    <div className="p-4 rounded-lg border border-gray-700 bg-gray-700/30">
                                        <div className={`text-2xl font-bold ${getScoreColor(selectedPrompt.evaluation.consistencyScore)}`}>
                                            {selectedPrompt.evaluation.consistencyScore}%
                                        </div>
                                        <div className="text-sm text-slate-400">Consistency</div>
                                    </div>
                                </div>
                            )}

                            {/* Prompt Text */}
                            <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700">
                                <div className="flex justify-between items-center mb-2">
                                    <div className="text-sm font-medium text-slate-300">
                                        Prompt Text
                                        <span className="ml-2 text-xs text-slate-500">v{selectedPrompt.currentVersion}</span>
                                    </div>
                                    <div className="flex gap-2">
                                        {!isEditing && (
                                            <button
                                                onClick={() => {
                                                    setIsEditing(true);
                                                    setEditedText(selectedPrompt.text);
                                                    setEditDescription('');
                                                }}
                                                className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
                                            >
                                                ✏️ Edit
                                            </button>
                                        )}
                                        <button
                                            onClick={() => handleCopyPrompt(selectedPrompt.text)}
                                            className="text-xs text-green-400 hover:text-green-300"
                                        >
                                            📋 Copy
                                        </button>
                                    </div>
                                </div>
                                
                                {isEditing ? (
                                    <div className="space-y-3">
                                        <textarea
                                            value={editedText}
                                            onChange={(e) => setEditedText(e.target.value)}
                                            className="w-full h-48 bg-gray-800 border border-gray-600 rounded-lg p-3 text-sm text-slate-200 font-mono focus:outline-none focus:border-blue-500 resize-none"
                                            placeholder="Edit prompt text..."
                                        />
                                        <div>
                                            <label className="block text-xs text-slate-400 mb-1">Version description (what changed?)</label>
                                            <input
                                                type="text"
                                                value={editDescription}
                                                onChange={(e) => setEditDescription(e.target.value)}
                                                className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                                                placeholder="e.g., Added few-shot examples, Fixed formatting..."
                                            />
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => {
                                                    if (editedText.trim() === selectedPrompt.text) {
                                                        alert('No changes detected');
                                                        return;
                                                    }
                                                    if (!editDescription.trim()) {
                                                        alert('Please describe what changed');
                                                        return;
                                                    }
                                                    createNewVersion(selectedPrompt.id, editedText, editDescription);
                                                    loadPrompts();
                                                    setIsEditing(false);
                                                    setSelectedPrompt({
                                                        ...selectedPrompt,
                                                        text: editedText,
                                                        currentVersion: selectedPrompt.currentVersion + 1,
                                                        versions: [
                                                            ...selectedPrompt.versions,
                                                            {
                                                                versionNumber: selectedPrompt.currentVersion + 1,
                                                                text: editedText,
                                                                description: editDescription,
                                                                createdAt: new Date().toISOString()
                                                            }
                                                        ]
                                                    });
                                                }}
                                                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded-lg font-medium"
                                            >
                                                💾 Save as v{selectedPrompt.currentVersion + 1}
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setIsEditing(false);
                                                    setEditedText('');
                                                    setEditDescription('');
                                                }}
                                                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded-lg"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <pre className="text-sm text-slate-200 whitespace-pre-wrap font-mono">
                                        {selectedPrompt.text}
                                    </pre>
                                )}
                            </div>

                            {/* Tags */}
                            {selectedPrompt.tags.length > 0 && (
                                <div className="mt-4">
                                    <div className="text-sm font-medium text-slate-300 mb-2">Tags</div>
                                    <div className="flex gap-2 flex-wrap">
                                        {selectedPrompt.tags.map(tag => (
                                            <span key={tag} className="px-2 py-1 bg-gray-700 text-slate-300 text-xs rounded">
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Version History */}
                            <div className="mt-6">
                                <div className="text-sm font-medium text-slate-300 mb-3">📁 Version History</div>
                                <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700">
                                    {selectedPrompt.versions.slice().reverse().map((version, idx) => {
                                        const isCurrentVersion = version.versionNumber === selectedPrompt.currentVersion;
                                        const isLatest = idx === 0;

                                        return (
                                            <div key={version.versionNumber} className="relative">
                                                {/* Version Node */}
                                                <div className={`flex items-start gap-3 ${!isLatest ? 'pb-4' : ''}`}>
                                                    {/* Tree Line */}
                                                    <div className="flex flex-col items-center">
                                                        <div className={`w-3 h-3 rounded-full ${isCurrentVersion ? 'bg-green-500' : 'bg-gray-600'}`} />
                                                        {!isLatest && <div className="w-0.5 h-full bg-gray-700 mt-1" />}
                                                    </div>

                                                    {/* Version Info */}
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className="text-sm font-medium text-slate-200">
                                                                v{version.versionNumber}
                                                            </span>
                                                            {isCurrentVersion && (
                                                                <span className="px-2 py-0.5 bg-green-900/50 text-green-300 text-xs rounded">
                                                                    current
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className="text-sm text-slate-400 mb-1">
                                                            {version.description}
                                                        </p>
                                                        <p className="text-xs text-slate-500">
                                                            {new Date(version.createdAt).toLocaleString()}
                                                        </p>

                                                        {/* Version Actions */}
                                                        <div className="mt-2 flex gap-2">
                                                            <button
                                                                onClick={() => {
                                                                    alert(`Version ${version.versionNumber} text:\n\n${version.text}`);
                                                                }}
                                                                className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-slate-300 text-xs rounded"
                                                            >
                                                                👁️ View Text
                                                            </button>
                                                            {!isCurrentVersion && (
                                                                <button
                                                                    onClick={() => {
                                                                        if (confirm(`Rollback to v${version.versionNumber}? This will create a new version.`)) {
                                                                            rollbackToVersion(selectedPrompt.id, version.versionNumber, `Rolled back to v${version.versionNumber}`);
                                                                            loadPrompts();
                                                                            setSelectedPrompt(null);
                                                                            setIsEditing(false);
                                                                        }
                                                                    }}
                                                                    className="px-3 py-1 bg-blue-900/50 hover:bg-blue-900/70 text-blue-300 text-xs rounded"
                                                                >
                                                                    ↩️ Rollback
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* Modal Actions */}
                        <div className="p-6 border-t border-gray-700 flex gap-3">
                            {onEvaluatePrompt && (
                                <button
                                    onClick={() => {
                                        onEvaluatePrompt(selectedPrompt);
                                        setSelectedPrompt(null);
                                    }}
                                    className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-md text-sm font-medium"
                                >
                                    <span className="flex items-center gap-1"><Icons.evaluate /> Run Evaluation</span>
                                </button>
                            )}
                            <button
                                onClick={() => handleDuplicatePrompt(selectedPrompt)}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-md text-sm font-medium"
                            >
                                <span className="flex items-center gap-1"><Icons.duplicate /> Duplicate</span>
                            </button>
                            {selectedPrompt.status !== 'production' && (
                                <button
                                    onClick={() => {
                                        handleUpdateStatus(selectedPrompt.id, 'production');
                                        setSelectedPrompt({ ...selectedPrompt, status: 'production' });
                                    }}
                                    className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-md text-sm font-medium"
                                >
                                    <span className="flex items-center gap-1"><Icons.deploy /> Deploy to Production</span>
                                </button>
                            )}
                            <button
                                onClick={() => setSelectedPrompt(null)}
                                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-md text-sm font-medium ml-auto"
                            >
                                Close
                            </button>
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
