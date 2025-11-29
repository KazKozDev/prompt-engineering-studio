import { useState, useEffect, useMemo } from 'react';
import { api, type Technique } from '../services/api';
import { savePromptToLibrary } from './PromptLibrary';

const TASK_TYPES = ['General', 'Reasoning', 'Coding', 'Summarization', 'Creative Writing', 'Data Extraction'] as const;
type TaskType = (typeof TASK_TYPES)[number];

function getArxivId(url?: string): string | null {
    if (!url) return null;
    const parts = url.split('/abs/');
    return parts[1] || null;
}

interface StudioProps {
    settings: {
        provider: string;
        model: string;
        apiKey: string;
    };
}

interface GeneratedPromptResult {
    technique: string;
    techniqueName: string;
    text: string;
    tokens?: number;
    saved: boolean;
}

export function Studio({ settings }: StudioProps) {
    const [userPrompt, setUserPrompt] = useState('');
    const [techniques, setTechniques] = useState<Record<string, Technique>>({});
    const [selectedTechniques, setSelectedTechniques] = useState<string[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTaskType, setActiveTaskType] = useState<TaskType | 'All Categories'>('Reasoning');
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedResults, setGeneratedResults] = useState<GeneratedPromptResult[]>([]);
    const [showSaveSuccess, setShowSaveSuccess] = useState(false);
    const [showResultsPanel, setShowResultsPanel] = useState(false);

    useEffect(() => {
        loadTechniques();
    }, []);

    const loadTechniques = async () => {
        try {
            const data = await api.getTechniques();
            setTechniques(data.techniques);
        } catch (error) {
            console.error('Failed to load techniques:', error);
        }
    };

    const handleGenerate = async () => {
        if (!userPrompt || selectedTechniques.length === 0) {
            return;
        }

        if (['gemini', 'openai'].includes(settings.provider) && !settings.apiKey) {
            return;
        }

        setIsGenerating(true);
        setShowResultsPanel(true);

        try {
            const response = await api.generatePrompts({
                prompt: userPrompt,
                provider: settings.provider,
                model: settings.model,
                api_key: settings.apiKey || undefined,
                techniques: selectedTechniques,
            });

            // Store results for saving to library
            const newResults: GeneratedPromptResult[] = response.results.map(r => ({
                technique: Object.keys(techniques).find(k => techniques[k].name === r.technique.name) || '',
                techniqueName: r.technique.name,
                text: r.response,
                tokens: r.tokens,
                saved: false
            }));
            setGeneratedResults(newResults);
        } catch (error: any) {
            console.error('Generation failed:', error);
        } finally {
            setIsGenerating(false);
        }
    };

    const toggleTechnique = (key: string) => {
        setSelectedTechniques(prev =>
            prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
        );
    };

    const handleSaveToLibrary = (index: number) => {
        const result = generatedResults[index];
        if (result.saved) return;

        savePromptToLibrary({
            name: `${result.techniqueName} - ${userPrompt.substring(0, 30)}...`,
            text: result.text,
            technique: result.technique,
            techniqueName: result.techniqueName,
            status: 'draft',
            category: activeTaskType === 'All Categories' ? 'General' : activeTaskType,
            tags: [result.technique, (activeTaskType === 'All Categories' ? 'General' : activeTaskType).toLowerCase()],
            description: `Generated from: "${userPrompt.substring(0, 100)}..."`,
            sourceType: 'generated'
        });

        // Mark as saved
        setGeneratedResults(prev => prev.map((r, i) =>
            i === index ? { ...r, saved: true } : r
        ));

        setShowSaveSuccess(true);
        setTimeout(() => setShowSaveSuccess(false), 2000);
    };

    const handleSaveAllToLibrary = () => {
        generatedResults.forEach((result, index) => {
            if (!result.saved) {
                handleSaveToLibrary(index);
            }
        });
    };

    const getFilteredTechniques = () => {
        const techArray = Object.entries(techniques);
        let filtered = techArray;

        if (activeTaskType !== 'All Categories') {
            filtered = filtered.filter(([_, tech]) => {
                const categories = (tech as any).categories || [];
                return categories.includes(activeTaskType);
            });
        }

        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(([_, tech]) =>
                tech.name.toLowerCase().includes(query) || tech.description.toLowerCase().includes(query)
            );
        }

        return filtered;
    };

    const groupedTechniques = useMemo(() => {
        const filtered = getFilteredTechniques();

        // If specific category selected, return as single group
        if (activeTaskType !== 'All Categories') {
            return { [activeTaskType]: filtered };
        }

        // Group by primary category
        const groups: Record<string, typeof filtered> = {};

        // Initialize with predefined order
        TASK_TYPES.forEach(type => {
            groups[type] = [];
        });
        groups['Other'] = [];

        filtered.forEach(item => {
            const [_, tech] = item;
            const primaryCat = (tech as any).categories?.[0];

            // Find which group this belongs to
            // We prioritize the TASK_TYPES order
            let assigned = false;
            if (primaryCat && TASK_TYPES.includes(primaryCat as any)) {
                groups[primaryCat].push(item);
                assigned = true;
            } else {
                // Try other categories if primary isn't in TASK_TYPES
                const cats = (tech as any).categories || [];
                for (const cat of cats) {
                    if (TASK_TYPES.includes(cat as any)) {
                        groups[cat].push(item);
                        assigned = true;
                        break;
                    }
                }
            }

            if (!assigned) {
                groups['Other'].push(item);
            }
        });

        return groups;
    }, [techniques, activeTaskType, searchQuery]);

    return (
        <div className="h-full flex">
            {/* Main content */}
            <div className={`flex-1 flex flex-col p-4 transition-all duration-300 ${showResultsPanel ? 'pr-0' : ''}`}>
                {/* Top bar: Input + Actions */}
                <div className="flex gap-3 mb-3 shrink-0">
                    <textarea
                        value={userPrompt}
                        onChange={(e) => setUserPrompt(e.target.value)}
                        rows={2}
                        className="flex-1 bg-black/30 border border-white/10 rounded-lg px-4 py-3 text-white/90 placeholder:text-white/30 resize-none focus:outline-none focus:border-white/20 text-sm"
                        placeholder="Describe your task... (e.g., 'Create a customer support chatbot that handles refund requests')"
                    />
                    <div className="flex flex-col gap-2 shrink-0">
                        <button
                            onClick={handleGenerate}
                            disabled={isGenerating || !userPrompt || selectedTechniques.length === 0}
                            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${isGenerating || !userPrompt || selectedTechniques.length === 0 ? 'bg-white/5 text-white/30 cursor-not-allowed' : 'bg-[#007AFF] hover:bg-[#0071E3] text-white'}`}
                        >
                            {isGenerating ? 'Generating...' : 'Generate'}
                        </button>
                        {generatedResults.length > 0 && !showResultsPanel && (
                            <button
                                onClick={() => setShowResultsPanel(true)}
                                className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-white/60 transition-all"
                            >
                                Results ({generatedResults.length})
                            </button>
                        )}
                    </div>
                </div>

                {/* Main area: Techniques + Workflow */}
                <div className="flex-1 flex gap-4 min-h-0">
                    {/* Left: Techniques */}
                    <div className="flex-1 flex flex-col min-h-0 bg-black/20 border border-white/10 rounded-lg overflow-hidden">
                        {/* Toolbar */}
                        <div className="p-3 border-b border-white/5 space-y-2">
                            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
                                <button
                                    onClick={() => setActiveTaskType('All Categories')}
                                    className={`px-3 py-1 rounded text-[11px] font-medium whitespace-nowrap transition-all ${activeTaskType === 'All Categories' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/70'}`}
                                >
                                    All
                                </button>
                                {TASK_TYPES.map((label) => (
                                    <button
                                        key={label}
                                        onClick={() => setActiveTaskType(label)}
                                        className={`px-3 py-1 rounded text-[11px] font-medium whitespace-nowrap transition-all ${label === activeTaskType ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/70'}`}
                                    >
                                        {label}
                                    </button>
                                ))}
                            </div>
                            <div className="relative">
                                <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                                <input
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full bg-black/30 border border-white/5 rounded-md pl-8 pr-3 py-1.5 text-xs text-white/90 placeholder:text-white/20 focus:outline-none focus:border-white/10"
                                    placeholder="Search..."
                                />
                            </div>
                        </div>

                        {/* Techniques List */}
                        <div className="flex-1 overflow-y-auto p-3 custom-scrollbar">
                            {Object.entries(groupedTechniques).map(([category, items]) => {
                                if (items.length === 0) return null;
                                return (
                                    <div key={category} className="mb-4 last:mb-0">
                                        {activeTaskType === 'All Categories' && (
                                            <h3 className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-2 px-2">
                                                {category} ({items.length})
                                            </h3>
                                        )}
                                        <div className="space-y-1">
                                            {items.map(([key, tech]) => {
                                                const isSelected = selectedTechniques.includes(key);
                                                return (
                                                    <div
                                                        key={key}
                                                        onClick={() => toggleTechnique(key)}
                                                        className={`
                                                            flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-all
                                                            ${isSelected
                                                                ? 'bg-[#007AFF]/15 text-white'
                                                                : 'hover:bg-white/5 text-white/70 hover:text-white/90'
                                                            }
                                                        `}
                                                    >
                                                        <div className={`
                                                            w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-all
                                                            ${isSelected
                                                                ? 'bg-[#007AFF] border-[#007AFF]'
                                                                : 'border-white/20'
                                                            }
                                                        `}>
                                                            {isSelected && <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="text-sm font-medium truncate">{tech.name}</div>
                                                            <div className="text-[11px] text-white/40 truncate">{tech.description}</div>
                                                        </div>
                                                        <span className="text-[10px] text-white/30 shrink-0">{tech.year}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Footer Stats */}
                        <div className="px-3 py-2 border-t border-white/5 text-[10px] text-white/30 flex justify-between">
                            <span>{Object.values(groupedTechniques).flat().length} techniques</span>
                            <span className="text-white/50">{selectedTechniques.length} selected</span>
                        </div>
                    </div>

                    {/* Right: Workflow Guide */}
                    <div className="flex-1 flex flex-col min-h-0 bg-gradient-to-b from-black/20 to-transparent border border-white/5 rounded-lg overflow-hidden">
                        <div className="px-5 py-4 border-b border-white/5 flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#007AFF]/20 to-[#007AFF]/5 flex items-center justify-center">
                                <svg className="w-4 h-4 text-[#007AFF]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
                            </div>
                            <div>
                                <h2 className="text-sm font-semibold text-white/90">Workflow Guide</h2>
                                <p className="text-[10px] text-white/40">How to use Prompt Generator</p>
                            </div>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            
                            {/* When to use - compact card */}
                            <div className="bg-white/[0.03] border border-white/10 rounded-lg p-3">
                                <div className="flex items-center gap-2 mb-2">
                                    <svg className="w-3.5 h-3.5 text-[#007AFF]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                    <span className="text-[11px] font-semibold text-white/70 uppercase tracking-wide">When to use</span>
                                </div>
                                <ul className="text-xs text-white/60 space-y-1">
                                    <li>• Create prompts <span className="text-white/80">from scratch</span></li>
                                    <li>• Make rough prompts <span className="text-white/80">more structured</span></li>
                                    <li>• Try <span className="text-white/80">different techniques</span></li>
                                    <li>• No dataset yet for testing</li>
                                </ul>
                            </div>

                            {/* Steps - vertical timeline */}
                            <div>
                                <div className="flex items-center gap-2 mb-3">
                                    <svg className="w-3.5 h-3.5 text-[#007AFF]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                                    <span className="text-[11px] font-semibold text-white/70 uppercase tracking-wide">How to use</span>
                                </div>
                                <div className="relative pl-4 border-l border-white/10 space-y-4">
                                    <div className="relative">
                                        <div className="absolute -left-[21px] w-3 h-3 rounded-full bg-[#007AFF] border-2 border-[#0a0a0a]"></div>
                                        <p className="text-xs text-white/85 font-medium">Describe your task</p>
                                        <p className="text-[11px] text-white/45">Context, format, constraints</p>
                                    </div>
                                    <div className="relative">
                                        <div className="absolute -left-[21px] w-3 h-3 rounded-full bg-[#007AFF] border-2 border-[#0a0a0a] opacity-80"></div>
                                        <p className="text-xs text-white/85 font-medium">Select 1-3 techniques</p>
                                        <p className="text-[11px] text-white/45">Reasoning, Few-Shot, Guardrails...</p>
                                    </div>
                                    <div className="relative">
                                        <div className="absolute -left-[21px] w-3 h-3 rounded-full bg-[#007AFF] border-2 border-[#0a0a0a] opacity-65"></div>
                                        <p className="text-xs text-white/85 font-medium">Run generation</p>
                                        <p className="text-[11px] text-white/45">Creates variant per technique</p>
                                    </div>
                                    <div className="relative">
                                        <div className="absolute -left-[21px] w-3 h-3 rounded-full bg-[#007AFF] border-2 border-[#0a0a0a] opacity-50"></div>
                                        <p className="text-xs text-white/85 font-medium">Compare & save</p>
                                        <p className="text-[11px] text-white/45">Best ones → Library v1</p>
                                    </div>
                                </div>
                            </div>

                            {/* Output */}
                            <div className="bg-white/[0.02] border border-white/10 rounded-lg p-3">
                                <div className="flex items-center gap-2 mb-2">
                                    <svg className="w-3.5 h-3.5 text-[#007AFF]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                                    <span className="text-[11px] font-semibold text-white/70 uppercase tracking-wide">Output</span>
                                </div>
                                <div className="flex gap-2 text-[10px] text-white/65 flex-wrap">
                                    <span className="px-2 py-1 bg-white/5 rounded">Multiple variants</span>
                                    <span className="px-2 py-1 bg-white/5 rounded">Versioned</span>
                                    <span className="px-2 py-1 bg-white/5 rounded">Ready to use</span>
                                </div>
                            </div>

                            {/* Pipeline visual */}
                            <div>
                                <div className="flex items-center gap-2 mb-3">
                                    <svg className="w-3.5 h-3.5 text-[#007AFF]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" /></svg>
                                    <span className="text-[11px] font-semibold text-white/70 uppercase tracking-wide">Full Pipeline</span>
                                </div>
                                <div className="flex items-center gap-1 text-[10px] flex-wrap">
                                    <span className="px-2 py-1.5 bg-[#007AFF]/20 text-[#007AFF] rounded font-medium">Generator</span>
                                    <span className="text-white/25">→</span>
                                    <span className="px-2 py-1.5 bg-white/5 text-white/60 rounded">Library</span>
                                    <span className="text-white/25">→</span>
                                    <span className="px-2 py-1.5 bg-white/5 text-white/60 rounded">Optimizer</span>
                                    <span className="text-white/25">→</span>
                                    <span className="px-2 py-1.5 bg-white/5 text-white/60 rounded">Eval Lab</span>
                                    <span className="text-white/25">→</span>
                                    <span className="px-2 py-1.5 bg-white/5 text-white/70 rounded font-medium">Production</span>
                                </div>
                            </div>

                            {/* Next steps */}
                            <div className="pt-3 border-t border-white/5">
                                <p className="text-[10px] text-white/35 uppercase tracking-wide mb-2">Next steps</p>
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-xs text-white/55 hover:text-white/75 cursor-pointer transition-colors">
                                        <span className="text-[#007AFF]">→</span>
                                        <span><span className="text-white/75">Optimizer</span> — auto-improve on dataset</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-white/55 hover:text-white/75 cursor-pointer transition-colors">
                                        <span className="text-[#007AFF]">→</span>
                                        <span><span className="text-white/75">Evaluation Lab</span> — quality, robustness, consistency</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-white/55 hover:text-white/75 cursor-pointer transition-colors">
                                        <span className="text-[#007AFF]">→</span>
                                        <span><span className="text-white/75">Library</span> — versions, metrics, deploy</span>
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
            </div>

            {/* Results Panel - Slide in from right */}
            {showResultsPanel && (
                <div className="w-[420px] bg-[#0a0a0a] border-l border-white/10 flex flex-col shrink-0">
                    <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                        <div className="flex items-center gap-3">
                            <h2 className="text-sm font-semibold text-white/80">Results</h2>
                            <span className="text-xs text-white/30 bg-white/5 px-2 py-0.5 rounded-full">{generatedResults.length}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            {generatedResults.length > 0 && !generatedResults.every(r => r.saved) && (
                                <button
                                    onClick={handleSaveAllToLibrary}
                                    className="text-xs text-white/50 hover:text-white/80 transition-colors px-2 py-1 rounded hover:bg-white/5"
                                >
                                    Save All
                                </button>
                            )}
                            <button
                                onClick={() => setShowResultsPanel(false)}
                                className="p-1.5 rounded-md hover:bg-white/10 text-white/30 hover:text-white/60 transition-colors"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {isGenerating ? (
                            <div className="flex flex-col items-center justify-center py-16 text-white/40">
                                <svg className="animate-spin h-8 w-8 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                <span className="text-sm">Generating prompts...</span>
                            </div>
                        ) : generatedResults.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16 text-white/30">
                                <svg className="w-10 h-10 mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
                                <span className="text-sm">No results yet</span>
                            </div>
                        ) : (
                            generatedResults.map((result, idx) => (
                                <div key={idx} className="border border-white/10 rounded-xl p-4 bg-white/5 hover:bg-white/[0.07] transition-all">
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="font-medium text-sm text-white/90">{result.techniqueName}</div>
                                        <div className="flex items-center gap-2">
                                            {result.tokens && (
                                                <span className="text-[10px] font-mono text-emerald-400/70 bg-black/30 px-2 py-0.5 rounded">
                                                    {result.tokens} tok
                                                </span>
                                            )}
                                            <button
                                                onClick={() => handleSaveToLibrary(idx)}
                                                disabled={result.saved}
                                                className={`p-1 rounded transition-colors ${result.saved ? 'text-emerald-400' : 'text-white/30 hover:text-white/60 hover:bg-white/5'}`}
                                                title={result.saved ? 'Saved' : 'Save to Library'}
                                            >
                                                {result.saved ? (
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                                ) : (
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                    <div className="text-[13px] text-white/70 whitespace-pre-wrap font-mono bg-black/30 p-3 rounded-lg border border-white/5 leading-relaxed max-h-[300px] overflow-y-auto">
                                        {result.text}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            {/* Save Success Toast */}
            {showSaveSuccess && (
                <div className="fixed bottom-8 right-8 bg-black/80 backdrop-blur-xl border border-white/10 text-white px-5 py-3 rounded-2xl shadow-2xl z-50 flex items-center gap-3">
                    <div className="bg-[#34C759] rounded-full p-1 text-white">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                    </div>
                    <span className="font-medium text-sm">Saved to Library</span>
                </div>
            )}
        </div>
    );
}
