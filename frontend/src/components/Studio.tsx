import { useState, useEffect, useMemo } from 'react';
import { api, type Technique } from '../services/api';
import { savePromptToLibrary } from './PromptLibrary';
import { Button } from './ui/Button';

const TASK_TYPES = [
    { label: 'General', value: 'General' },
    { label: 'Reasoning', value: 'Reasoning' },
    { label: 'Coding', value: 'Coding' },
    { label: 'Summary', value: 'Summarization' },
    { label: 'Writing', value: 'Creative Writing' },
    { label: 'Translation', value: 'Translation' },
    { label: 'Extraction', value: 'Data Extraction' },
] as const;
type TaskType = (typeof TASK_TYPES)[number]['value'];

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

const normalizeTechniqueKey = (name: string) => name.toLowerCase().replace(/[^a-z0-9]/g, '');

const TECH_ALIASES: Record<string, string> = {
    chainofthought: 'CoT',
    chainofthoughtprompting: 'CoT',
    chainofverification: 'CoVe',
    treeofthoughts: 'ToT',
    graphofthoughts: 'GoT',
    reaction: 'ReAct',
    chainofdensity: 'CoD',
    chainofcode: 'CoC',
    programofthoughts: 'PoT',
    programaided: 'PAL',
    system2attention: 'S2A',
    leasttomost: 'LtM',
    selfconsistency: 'SC',
};

const getTechniqueHints = (techKey: string, tech: Technique & { name: string }, techniques: Record<string, Technique>): string[] => {
    // First, try to get structure_hint from the current technique
    const currentTech = techniques[techKey];
    if (currentTech?.structure_hint) {
        return [currentTech.structure_hint];
    }

    // Fallback: try to find by name
    const byName = Object.values(techniques).find(t =>
        normalizeTechniqueKey(t.name) === normalizeTechniqueKey(tech.name)
    );
    if (byName?.structure_hint) {
        return [byName.structure_hint];
    }

    // If no structure_hint found, return a generic hint
    return [
        'State the goal in one sentence.',
        'List constraints and output format explicitly.',
        'Provide the final answer cleanly without extra chatter.'
    ];
};

const getTechniqueDisplayName = (tech: Technique & { name: string }, key?: string) => {
    const alias =
        (key && TECH_ALIASES[normalizeTechniqueKey(key)]) ||
        TECH_ALIASES[normalizeTechniqueKey(tech.name)];
    if (!alias) return tech.name;

    const nameLower = tech.name.toLowerCase();
    const aliasLower = alias.toLowerCase();
    const alreadyHasAlias = nameLower.includes(`(${aliasLower})`) || nameLower.includes(aliasLower);
    return alreadyHasAlias ? tech.name : `${tech.name} (${alias})`;
};

export function Studio({ settings }: StudioProps) {
    const [userPrompt, setUserPrompt] = useState('');
    const [techniques, setTechniques] = useState<Record<string, Technique>>({});
    const [selectedTechniques, setSelectedTechniques] = useState<string[]>([]);
    const [searchQuery] = useState('');
    const [activeTaskType, setActiveTaskType] = useState<TaskType | 'All Categories'>('Reasoning');
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedResults, setGeneratedResults] = useState<GeneratedPromptResult[]>([]);
    const [showSaveSuccess, setShowSaveSuccess] = useState(false);
    const [previewTechniqueKey, setPreviewTechniqueKey] = useState<string | null>(null);
    const [uploadError] = useState<string | null>(null);
    const [editingIdx, setEditingIdx] = useState<number | null>(null);
    const [editText, setEditText] = useState('');

    // Shortcut: Cmd/Ctrl + Enter to generate
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            const isEnter = e.key === 'Enter';
            const hasModifier = e.metaKey || e.ctrlKey;
            const canGenerate = !isGenerating && userPrompt && selectedTechniques.length > 0;
            if (isEnter && hasModifier && canGenerate) {
                e.preventDefault();
                handleGenerate();
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isGenerating, userPrompt, selectedTechniques]);

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

        try {
            const response = await api.generatePrompts({
                prompt: userPrompt,
                provider: settings.provider,
                model: settings.model,
                api_key: settings.apiKey || undefined,
                techniques: selectedTechniques,
            });

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
        setSelectedTechniques(prev => {
            const next = prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key];
            setPreviewTechniqueKey(next.includes(key) ? key : next[next.length - 1] || null);
            return next;
        });
    };

    const handleSaveToLibrary = async (index: number) => {
        const result = generatedResults[index];
        if (result.saved) return;

        // Generate title using local model (fast, no API needed)
        let title = userPrompt.length > 50 ? `${userPrompt.substring(0, 50)}...` : userPrompt;
        try {
            const response = await api.generateTitle({
                prompt_text: result.text,
                provider: 'local',
                model: 'google/flan-t5-small',
            });
            if (response.title) {
                // Remove trailing period from title
                title = response.title.replace(/\.+$/, '');
            }
        } catch (error) {
            console.error('Failed to generate title, using fallback:', error);
        }

        savePromptToLibrary({
            name: title,
            text: result.text,
            technique: result.technique,
            techniqueName: result.techniqueName,
            status: 'draft',
            category: activeTaskType === 'All Categories' ? 'General' : activeTaskType,
            tags: [result.technique, (activeTaskType === 'All Categories' ? 'General' : activeTaskType).toLowerCase()],
            description: `Generated using ${result.techniqueName}`,
            sourceType: 'generated'
        });

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
        const seen = new Set<string>();

        const alreadySeen = (key: string, name: string) => {
            const sig = `${key}::${normalizeTechniqueKey(name)}`;
            if (seen.has(sig)) return true;
            seen.add(sig);
            return false;
        };

        if (activeTaskType !== 'All Categories') {
            const unique = filtered.filter(([key, tech]) => !alreadySeen(key, (tech as any).name));
            return { [activeTaskType]: unique };
        }

        const groups: Record<string, typeof filtered> = {};
        TASK_TYPES.forEach(type => {
            groups[type.value] = [];
        });
        groups['Other'] = [];

        filtered.forEach(item => {
            const [key, tech] = item;
            if (alreadySeen(key, (tech as any).name)) return;

            const primaryCat = (tech as any).categories?.[0];

            let assigned = false;
            if (primaryCat && TASK_TYPES.some(t => t.value === primaryCat)) {
                groups[primaryCat].push(item);
                assigned = true;
            } else {
                const cats = (tech as any).categories || [];
                for (const cat of cats) {
                    if (TASK_TYPES.some(t => t.value === cat)) {
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

    const labelMap = useMemo(
        () => Object.fromEntries(TASK_TYPES.map(t => [t.value, t.label])),
        []
    );

    return (
        <div className="h-full flex gap-6 p-6 overflow-hidden">
            {/* Left: Techniques / Filters */}
            <div className="w-96 flex flex-col shrink-0 gap-4">
                <div>
                    <h2 className="text-[11px] font-bold text-white/30 uppercase tracking-widest mb-1">Techniques</h2>
                    <p className="text-xs text-white/40 mb-4 mt-1">Choose categories and techniques to generate variants.</p>
                </div>

                <div className="flex-1 bg-black/20 border border-white/5 rounded-2xl overflow-hidden flex flex-col">
                    <div className="p-3 border-b border-white/5 space-y-2">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-2 gap-y-3">
                            <Button
                                onClick={() => setActiveTaskType('All Categories')}
                                variant={activeTaskType === 'All Categories' ? 'secondary' : 'outline'}
                                size="xs"
                                fullWidth
                                className="px-3 py-1.5 text-xs font-medium whitespace-nowrap"
                            >
                                All
                            </Button>
                            {TASK_TYPES.map(({ label, value }) => (
                                <Button
                                    key={value}
                                    onClick={() => setActiveTaskType(value)}
                                    variant={value === activeTaskType ? 'secondary' : 'outline'}
                                    size="xs"
                                    fullWidth
                                    className="px-3 py-1.5 text-xs font-medium whitespace-nowrap"
                                >
                                    {label}
                                </Button>
                            ))}
                        </div>
                        {/* Search hidden for compact layout */}
                    </div>

                    <div className="flex-1 overflow-y-auto p-3 custom-scrollbar">
                        {Object.entries(groupedTechniques).map(([category, items]) => {
                            if (items.length === 0) return null;
                            return (
                                <div key={category} className="mb-4 last:mb-0">
                                    {activeTaskType === 'All Categories' && (
                                        <h3 className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-2 px-2">
                                            {(labelMap as Record<string, string>)[category] || category} ({items.length})
                                        </h3>
                                    )}
                                    <div className="space-y-1">
                                        {items.map(([key, tech]) => {
                                            const isSelected = selectedTechniques.includes(key);
                                            return (
                                                <div
                                                    key={key}
                                                    onClick={() => toggleTechnique(key)}
                                                    className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-all ${isSelected ? 'bg-white/10 text-white font-semibold border border-white/20' : 'hover:bg-white/5 text-white/70 hover:text-white/90'}`}
                                                >
                                                    <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-all ${isSelected ? 'bg-pro-btn border-pro-border-light' : 'border-white/20'}`}>
                                                        {isSelected && <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="text-sm font-medium truncate">{getTechniqueDisplayName(tech as any, key)}</div>
                                                        <div className="text-[11px] text-white/50 truncate">{tech.description}</div>
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

                    <div className="px-3 py-2 border-t border-white/5 text-[10px] text-white/30 flex justify-between">
                        <span>{Object.values(groupedTechniques).flat().length} techniques</span>
                        <span className="text-white/50">{selectedTechniques.length} techniques selected</span>
                    </div>
                </div>
            </div>

            {/* Middle: Generator */}
            <div className="flex-1 min-w-0 bg-black/20 border border-white/5 rounded-2xl overflow-hidden flex flex-col">
                <div className="px-6 py-5 border-b border-white/5 bg-white/[0.02] flex items-start justify-between gap-4">
                    <div>
                        <h2 className="text-xl font-semibold text-white/90 mb-1">Prompt Generator</h2>
                        <p className="text-xs text-white/45 mt-1">Pick techniques, paste your task, and generate variants.</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="text-[11px] px-2 py-1 rounded-md border border-white/10 text-white/50 bg-black/30">
                            {settings.provider} · {settings.model}
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    <div className="space-y-2 flex-1 flex flex-col">
                        <div className="flex items-center justify-between">
                            <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Task Description</label>
                            <label className="flex items-center gap-2 px-3 py-0.5 rounded-lg text-[11px] font-medium transition-all cursor-pointer bg-white/5 hover:bg-white/10 border border-white/10 text-white/50">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                </svg>
                                <span className="text-[11px]">Upload</span>
                                <input
                                    type="file"
                                    accept=".txt,.md,.json,.csv,.pdf,.doc,.docx,.xls,.xlsx"
                                    className="hidden"
                                    onChange={async (e) => {
                                        setUploadError(null);
                                        const file = e.target.files?.[0];
                                        if (!file) return;
                                        const ext = file.name.toLowerCase().split('.').pop() || '';
                                        const textLike = ['txt', 'md', 'json', 'csv'];
                                        if (textLike.includes(ext) || file.type.startsWith('text/')) {
                                            const text = await file.text();
                                            setUserPrompt(prev => prev ? `${prev}\n\n${text}` : text);
                                        } else {
                                            setUploadError('Unsupported file type for inline extraction. Please convert to text.');
                                        }
                                        e.target.value = '';
                                    }}
                                />
                            </label>
                        </div>
                        <textarea
                            value={userPrompt}
                            onChange={(e) => setUserPrompt(e.target.value)}
                            className="w-full flex-1 bg-black/30 border border-white/5 rounded-xl px-4 py-3 text-sm text-white/90 placeholder:text-white/30 resize-none focus:outline-none focus:border-white/15 hover:border-white/15 min-h-[320px]"
                            placeholder="Describe your task... (e.g., 'Create a customer support chatbot that handles refund requests')"
                        />
                        {uploadError && (
                            <div className="text-[11px] text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-2 rounded-lg">
                                {uploadError}
                            </div>
                        )}
                        <div className="flex items-center text-[11px] text-white/40">
                            <Button
                                onClick={handleGenerate}
                                disabled={isGenerating || !userPrompt || selectedTechniques.length === 0}
                                variant="primary"
                                size="sm"
                                className={`min-w-[140px] ${isGenerating || !userPrompt || selectedTechniques.length === 0 ? 'opacity-60 cursor-not-allowed' : ''}`}
                            >
                                {isGenerating ? 'Generating...' : 'Generate'}
                            </Button>
                            <span className="ml-auto text-white/50 font-mono">{Math.max(userPrompt.trim().split(/\s+/).filter(Boolean).length, userPrompt ? 1 : 0)} tokens (approx)</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right: Results */}
            <div className="w-[420px] bg-[#0a0a0a] border border-white/10 rounded-2xl flex flex-col shrink-0 overflow-hidden">
                <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                    <div className="flex items-center gap-3">
                        <h2 className="text-sm font-semibold text-white/80">Results</h2>
                        <span className="text-xs text-white/30 bg-white/5 px-2 py-0.5 rounded-full">{generatedResults.length}</span>
                    </div>
                    {generatedResults.length > 0 && !generatedResults.every(r => r.saved) && (
                        <Button
                            onClick={handleSaveAllToLibrary}
                            variant="secondary"
                            size="xs"
                            className="text-xs text-white/70 px-3 py-1 bg-white/[0.08]"
                        >
                            Save All
                        </Button>
                    )}
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
                        previewTechniqueKey && techniques[previewTechniqueKey] ? (
                            <div className="flex flex-col gap-3 p-4 text-white/70">
                                <div className="flex items-center justify-between">
                                    <div className="text-sm font-semibold text-white/85">Preview structure</div>
                                    {selectedTechniques.length > 1 && (
                                        <div className="flex items-center gap-2 text-[11px] text-white/50">
                                            <span>Viewing:</span>
                                            <select
                                                value={previewTechniqueKey}
                                                onChange={(e) => setPreviewTechniqueKey(e.target.value)}
                                                className="bg-black/40 border border-white/10 rounded px-2 py-1 text-[11px] text-white/80 focus:outline-none"
                                            >
                                                {selectedTechniques.map(key => (
                                                    <option key={key} value={key}>
                                                        {techniques[key]?.name || key}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    )}
                                </div>
                                <div className="bg-white/[0.03] border border-white/10 rounded-lg p-3 space-y-2 text-[12px]">
                                    <div className="flex items-center justify-between">
                                        <span className="font-semibold text-white/90">{techniques[previewTechniqueKey].name}</span>
                                        <span className="text-[11px] text-white/40 font-mono">{techniques[previewTechniqueKey].year}</span>
                                    </div>
                                    <p className="text-white/50 leading-relaxed">{techniques[previewTechniqueKey].description}</p>
                                </div>
                                <div className="bg-black/30 border border-white/10 rounded-lg p-3 text-[12px] font-mono text-white/80 leading-relaxed space-y-2">
                                    <div className="text-[11px] uppercase tracking-wide text-white/40">Prompt skeleton</div>
                                    <pre className="whitespace-pre-wrap">
                                        {`Technique: ${techniques[previewTechniqueKey].name}
Task:
${userPrompt || '[enter your task here]'}

Structure hints:
${getTechniqueHints(previewTechniqueKey, techniques[previewTechniqueKey], techniques).map(h => `- ${h}`).join('\n')}`}
                                    </pre>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-20 text-white/35 text-center gap-2">
                                <span className="text-sm">No prompts generated yet</span>
                                <span className="text-xs text-white/30">Enter your task and select techniques to get started</span>
                            </div>
                        )
                    ) : (
                        generatedResults.map((result, idx) => {
                            const tokens = result.tokens || Math.max(result.text.trim().split(/\s+/).filter(Boolean).length, 0);
                            const baseTokens = Math.max(userPrompt.trim().split(/\s+/).filter(Boolean).length, 1);
                            const ratio = (tokens / baseTokens).toFixed(1);
                            return (
                                <div key={idx} className="border border-white/10 rounded-xl bg-white/5 overflow-hidden">
                                    <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                                        <div className="text-sm font-semibold text-white/85">Generated Prompt</div>
                                        <div className="text-[11px] text-white/60 font-mono">{tokens} tokens — {ratio}x</div>
                                    </div>
                                    <div className="flex items-center gap-2 px-4 py-2 border-b border-white/10 text-[11px] text-white/60">
                                        <Button
                                            onClick={() => navigator.clipboard.writeText(result.text)}
                                            variant="secondary"
                                            size="xs"
                                            className="px-2 py-1"
                                        >
                                            Copy
                                        </Button>
                                        <Button
                                            onClick={() => handleSaveToLibrary(idx)}
                                            disabled={result.saved}
                                            variant="secondary"
                                            size="xs"
                                            className={`px-2 py-1 ${result.saved ? 'bg-white/5 text-white/70 border-emerald-500/30' : ''}`}
                                        >
                                            {result.saved ? 'Saved' : 'Save'}
                                        </Button>
                                        <Button
                                            onClick={() => {
                                                if (editingIdx === idx) {
                                                    // Save edit
                                                    const updated = [...generatedResults];
                                                    updated[idx] = { ...updated[idx], text: editText };
                                                    setGeneratedResults(updated);
                                                    setEditingIdx(null);
                                                } else {
                                                    // Start editing
                                                    setEditingIdx(idx);
                                                    setEditText(result.text);
                                                }
                                            }}
                                            variant="secondary"
                                            size="xs"
                                            className={`px-2 py-1 ${editingIdx === idx ? 'border-white/30 text-white hover:bg-white/10' : ''}`}
                                        >
                                            {editingIdx === idx ? 'Save' : 'Edit'}
                                        </Button>
                                        {editingIdx === idx && (
                                            <Button
                                                onClick={() => setEditingIdx(null)}
                                                variant="ghost"
                                                size="xs"
                                                className="px-2 py-1 text-white/60 hover:text-white"
                                            >
                                                Cancel
                                            </Button>
                                        )}
                                    </div>
                                    {editingIdx === idx ? (
                                        <textarea
                                            value={editText}
                                            onChange={(e) => setEditText(e.target.value)}
                                            className="w-full p-4 text-[13px] text-white/80 font-mono bg-black/40 leading-relaxed min-h-[200px] max-h-[420px] resize-y border-none focus:outline-none focus:ring-1 focus:ring-white/20"
                                        />
                                    ) : (
                                        <div className="p-4 text-[13px] text-white/80 whitespace-pre-wrap font-mono bg-black/40 leading-relaxed max-h-[420px] overflow-y-auto">
                                            {result.text}
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

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
