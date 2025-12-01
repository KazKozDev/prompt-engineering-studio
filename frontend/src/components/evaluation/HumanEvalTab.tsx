import { useState } from 'react';
import { PromptSelector } from './PromptSelector';
import { Button } from '../ui/Button';

interface HumanEvalTabProps {
    settings: {
        provider: string;
        model: string;
        apiKey?: string;
    };
    onModeChange?: (mode: HumanEvalMode) => void;
}

export type HumanEvalMode = 'rating' | 'ranking' | 'ab';

interface RatingCriteria {
    id: string;
    name: string;
    description: string;
    weight: number;
}

interface EvaluationItem {
    id: string;
    prompt: string;
    response: string;
    ratings: { [criteriaId: string]: number };
    notes: string;
}

const DEFAULT_CRITERIA: RatingCriteria[] = [
    { id: 'relevance', name: 'Relevance', description: 'How well does the response address the prompt?', weight: 1 },
    { id: 'accuracy', name: 'Accuracy', description: 'Is the information factually correct?', weight: 1 },
    { id: 'coherence', name: 'Coherence', description: 'Is the response logical and well-structured?', weight: 1 },
    { id: 'completeness', name: 'Completeness', description: 'Does it cover all aspects of the request?', weight: 1 },
    { id: 'tone', name: 'Tone/Style', description: 'Does it match the expected style?', weight: 0.5 },
];

export function HumanEvalTab({ onModeChange }: HumanEvalTabProps) {
    const [mode, setMode] = useState<HumanEvalMode>('rating');
    const [criteria, setCriteria] = useState<RatingCriteria[]>(DEFAULT_CRITERIA);
    const [items, setItems] = useState<EvaluationItem[]>([]);
    const [currentItem, setCurrentItem] = useState<EvaluationItem | null>(null);
    const [showSelector, setShowSelector] = useState(false);
    const [selectorTarget, setSelectorTarget] = useState<'prompt' | 'response'>('prompt');

    // A/B Testing state
    const [variantA, setVariantA] = useState({ prompt: '', response: '' });
    const [variantB, setVariantB] = useState({ prompt: '', response: '' });
    const [abResults, setAbResults] = useState<{ winner: 'A' | 'B' | 'tie' | null; reason: string }>({ winner: null, reason: '' });

    // Ranking state
    const [rankingItems, setRankingItems] = useState<{ id: string; prompt: string; response: string; rank: number }[]>([]);

    const handleModeChange = (newMode: HumanEvalMode) => {
        setMode(newMode);
        onModeChange?.(newMode);
    };

    const addEvaluationItem = () => {
        const newItem: EvaluationItem = {
            id: Date.now().toString(),
            prompt: '',
            response: '',
            ratings: {},
            notes: ''
        };
        setItems([...items, newItem]);
        setCurrentItem(newItem);
    };

    const updateCurrentItem = (field: keyof EvaluationItem, value: any) => {
        if (!currentItem) return;
        const updated = { ...currentItem, [field]: value };
        setCurrentItem(updated);
        setItems(items.map(i => i.id === updated.id ? updated : i));
    };

    const updateRating = (criteriaId: string, value: number) => {
        if (!currentItem) return;
        const updated = {
            ...currentItem,
            ratings: { ...currentItem.ratings, [criteriaId]: value }
        };
        setCurrentItem(updated);
        setItems(items.map(i => i.id === updated.id ? updated : i));
    };

    const calculateAverageScore = (item: EvaluationItem): number => {
        const ratedCriteria = criteria.filter(c => item.ratings[c.id] !== undefined);
        if (ratedCriteria.length === 0) return 0;
        
        const totalWeight = ratedCriteria.reduce((sum, c) => sum + c.weight, 0);
        const weightedSum = ratedCriteria.reduce((sum, c) => sum + (item.ratings[c.id] * c.weight), 0);
        return weightedSum / totalWeight;
    };

    const exportResults = () => {
        const data = {
            mode,
            criteria,
            items: items.map(item => ({
                ...item,
                averageScore: calculateAverageScore(item)
            })),
            exportedAt: new Date().toISOString()
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `human-eval-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleSelectPrompt = (text: string) => {
        if (mode === 'rating' && currentItem) {
            if (selectorTarget === 'prompt') {
                updateCurrentItem('prompt', text);
            } else {
                updateCurrentItem('response', text);
            }
        } else if (mode === 'ab') {
            if (selectorTarget === 'prompt') {
                setVariantA({ ...variantA, prompt: text });
            }
        }
        setShowSelector(false);
    };

    return (
        <div className="space-y-6">
            {/* Mode Selector */}
            <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                    <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Evaluation Type</span>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => handleModeChange('rating')}
                        className={`flex-1 px-4 py-2.5 rounded-lg text-xs font-medium transition-all ${
                            mode === 'rating'
                                ? 'bg-white/10 text-white border border-white/20'
                                : 'bg-white/[0.02] text-white/50 border border-white/5 hover:bg-white/5'
                        }`}
                    >
                        <div className="flex items-center justify-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                            </svg>
                            Rating Scale
                        </div>
                        <div className="text-[10px] text-white/40 mt-1">Likert 1-5 scoring</div>
                    </button>
                    <button
                        onClick={() => handleModeChange('ranking')}
                        className={`flex-1 px-4 py-2.5 rounded-lg text-xs font-medium transition-all ${
                            mode === 'ranking'
                                ? 'bg-white/10 text-white border border-white/20'
                                : 'bg-white/[0.02] text-white/50 border border-white/5 hover:bg-white/5'
                        }`}
                    >
                        <div className="flex items-center justify-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                            </svg>
                            Ranking
                        </div>
                        <div className="text-[10px] text-white/40 mt-1">Order by preference</div>
                    </button>
                    <button
                        onClick={() => handleModeChange('ab')}
                        className={`flex-1 px-4 py-2.5 rounded-lg text-xs font-medium transition-all ${
                            mode === 'ab'
                                ? 'bg-white/10 text-white border border-white/20'
                                : 'bg-white/[0.02] text-white/50 border border-white/5 hover:bg-white/5'
                        }`}
                    >
                        <div className="flex items-center justify-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                            </svg>
                            A/B Testing
                        </div>
                        <div className="text-[10px] text-white/40 mt-1">Compare two variants</div>
                    </button>
                </div>
            </div>

            {/* Rating Mode */}
            {mode === 'rating' && (
                <>
                    {/* Criteria Configuration */}
                    <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Evaluation Criteria</span>
                            <button
                                onClick={() => setCriteria([...criteria, {
                                    id: Date.now().toString(),
                                    name: 'New Criterion',
                                    description: '',
                                    weight: 1
                                }])}
                                className="text-[10px] text-white/40 hover:text-white/70"
                            >
                                + Add Criterion
                            </button>
                        </div>
                        <div className="space-y-2">
                            {criteria.map((c, idx) => (
                                <div key={c.id} className="flex items-center gap-2 bg-white/[0.03] rounded-lg p-2">
                                    <span className="text-xs text-white/70 flex-1">{c.name}</span>
                                    <span className="text-[10px] text-white/40">{c.description.slice(0, 30)}...</span>
                                    <span className="text-[10px] text-white/50">w:{c.weight}</span>
                                    {idx >= 5 && (
                                        <button
                                            onClick={() => setCriteria(criteria.filter(x => x.id !== c.id))}
                                            className="text-white/30 hover:text-red-400"
                                        >
                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Items List */}
                    <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Evaluation Items</span>
                            <button
                                onClick={addEvaluationItem}
                                className="text-[10px] text-white/40 hover:text-white/70 flex items-center gap-1"
                            >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                Add Item
                            </button>
                        </div>

                        {items.length === 0 ? (
                            <div className="text-center py-8 text-white/30 text-sm">
                                No items yet. Click "Add Item" to start evaluating.
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {items.map((item, idx) => (
                                    <button
                                        key={item.id}
                                        onClick={() => setCurrentItem(item)}
                                        className={`w-full text-left p-3 rounded-lg transition-all ${
                                            currentItem?.id === item.id
                                                ? 'bg-white/10 border border-white/20'
                                                : 'bg-white/[0.03] border border-white/5 hover:bg-white/[0.05]'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs text-white/70">Item #{idx + 1}</span>
                                            <span className="text-xs text-white/50">
                                                Score: {calculateAverageScore(item).toFixed(1)}/5
                                            </span>
                                        </div>
                                        <div className="text-[10px] text-white/40 mt-1 truncate">
                                            {item.prompt || 'No prompt set'}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Current Item Editor */}
                    {currentItem && (
                        <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4 space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Evaluate Item</span>
                                <span className="text-xs text-white/50">
                                    Avg: {calculateAverageScore(currentItem).toFixed(2)}/5
                                </span>
                            </div>

                            <div>
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-[10px] text-white/50">Prompt</span>
                                    <button
                                        onClick={() => { setSelectorTarget('prompt'); setShowSelector(true); }}
                                        className="text-[10px] text-white/40 hover:text-white/70"
                                    >
                                        From Library
                                    </button>
                                </div>
                                <textarea
                                    value={currentItem.prompt}
                                    onChange={e => updateCurrentItem('prompt', e.target.value)}
                                    placeholder="Enter the prompt..."
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white/80 placeholder-white/30 min-h-[60px] resize-none"
                                />
                            </div>

                            <div>
                                <span className="text-[10px] text-white/50 block mb-1">Response</span>
                                <textarea
                                    value={currentItem.response}
                                    onChange={e => updateCurrentItem('response', e.target.value)}
                                    placeholder="Paste the model response..."
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white/80 placeholder-white/30 min-h-[100px] resize-none"
                                />
                            </div>

                            {/* Rating Sliders */}
                            <div className="space-y-3">
                                {criteria.map(c => (
                                    <div key={c.id} className="bg-white/[0.03] rounded-lg p-3">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-xs text-white/70">{c.name}</span>
                                            <span className="text-xs text-white/50">
                                                {currentItem.ratings[c.id] || 0}/5
                                            </span>
                                        </div>
                                        <div className="flex gap-2">
                                            {[1, 2, 3, 4, 5].map(score => (
                                                <button
                                                    key={score}
                                                    onClick={() => updateRating(c.id, score)}
                                                    className={`flex-1 py-2 rounded text-xs font-medium transition-all ${
                                                        currentItem.ratings[c.id] === score
                                                            ? 'bg-white/20 text-white'
                                                            : 'bg-white/5 text-white/50 hover:bg-white/10'
                                                    }`}
                                                >
                                                    {score}
                                                </button>
                                            ))}
                                        </div>
                                        <div className="text-[10px] text-white/30 mt-1">{c.description}</div>
                                    </div>
                                ))}
                            </div>

                            <div>
                                <span className="text-[10px] text-white/50 block mb-1">Notes</span>
                                <textarea
                                    value={currentItem.notes}
                                    onChange={e => updateCurrentItem('notes', e.target.value)}
                                    placeholder="Additional observations..."
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white/80 placeholder-white/30 min-h-[60px] resize-none"
                                />
                            </div>
                        </div>
                    )}

                    {items.length > 0 && (
                        <Button onClick={exportResults} variant="outline" className="w-full">
                            Export Results
                        </Button>
                    )}
                </>
            )}

            {/* A/B Testing Mode */}
            {mode === 'ab' && (
                <>
                    <div className="grid grid-cols-2 gap-4">
                        {/* Variant A */}
                        <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4">
                            <div className="flex items-center gap-2 mb-3">
                                <span className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-xs font-bold">A</span>
                                <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Variant A</span>
                            </div>
                            <div className="space-y-3">
                                <textarea
                                    value={variantA.prompt}
                                    onChange={e => setVariantA({ ...variantA, prompt: e.target.value })}
                                    placeholder="Prompt A..."
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white/80 placeholder-white/30 min-h-[80px] resize-none"
                                />
                                <textarea
                                    value={variantA.response}
                                    onChange={e => setVariantA({ ...variantA, response: e.target.value })}
                                    placeholder="Response A..."
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white/80 placeholder-white/30 min-h-[120px] resize-none"
                                />
                            </div>
                        </div>

                        {/* Variant B */}
                        <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4">
                            <div className="flex items-center gap-2 mb-3">
                                <span className="w-6 h-6 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center text-xs font-bold">B</span>
                                <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Variant B</span>
                            </div>
                            <div className="space-y-3">
                                <textarea
                                    value={variantB.prompt}
                                    onChange={e => setVariantB({ ...variantB, prompt: e.target.value })}
                                    placeholder="Prompt B..."
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white/80 placeholder-white/30 min-h-[80px] resize-none"
                                />
                                <textarea
                                    value={variantB.response}
                                    onChange={e => setVariantB({ ...variantB, response: e.target.value })}
                                    placeholder="Response B..."
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white/80 placeholder-white/30 min-h-[120px] resize-none"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Winner Selection */}
                    <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4">
                        <div className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-3">Select Winner</div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setAbResults({ ...abResults, winner: 'A' })}
                                className={`flex-1 py-3 rounded-lg text-sm font-medium transition-all ${
                                    abResults.winner === 'A'
                                        ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                                        : 'bg-white/5 text-white/50 border border-white/10 hover:bg-white/10'
                                }`}
                            >
                                A Wins
                            </button>
                            <button
                                onClick={() => setAbResults({ ...abResults, winner: 'tie' })}
                                className={`flex-1 py-3 rounded-lg text-sm font-medium transition-all ${
                                    abResults.winner === 'tie'
                                        ? 'bg-white/20 text-white border border-white/30'
                                        : 'bg-white/5 text-white/50 border border-white/10 hover:bg-white/10'
                                }`}
                            >
                                Tie
                            </button>
                            <button
                                onClick={() => setAbResults({ ...abResults, winner: 'B' })}
                                className={`flex-1 py-3 rounded-lg text-sm font-medium transition-all ${
                                    abResults.winner === 'B'
                                        ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                                        : 'bg-white/5 text-white/50 border border-white/10 hover:bg-white/10'
                                }`}
                            >
                                B Wins
                            </button>
                        </div>
                        <textarea
                            value={abResults.reason}
                            onChange={e => setAbResults({ ...abResults, reason: e.target.value })}
                            placeholder="Reason for your choice..."
                            className="w-full mt-3 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white/80 placeholder-white/30 min-h-[60px] resize-none"
                        />
                    </div>
                </>
            )}

            {/* Ranking Mode */}
            {mode === 'ranking' && (
                <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Rank Responses</span>
                        <button
                            onClick={() => setRankingItems([...rankingItems, {
                                id: Date.now().toString(),
                                prompt: '',
                                response: '',
                                rank: rankingItems.length + 1
                            }])}
                            className="text-[10px] text-white/40 hover:text-white/70"
                        >
                            + Add Response
                        </button>
                    </div>

                    {rankingItems.length === 0 ? (
                        <div className="text-center py-8 text-white/30 text-sm">
                            Add responses to rank them by preference.
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {rankingItems
                                .sort((a, b) => a.rank - b.rank)
                                .map((item) => (
                                    <div key={item.id} className="bg-white/[0.03] rounded-lg p-3">
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className="w-6 h-6 rounded-full bg-white/10 text-white/70 flex items-center justify-center text-xs font-bold">
                                                #{item.rank}
                                            </span>
                                            <div className="flex gap-1">
                                                <button
                                                    onClick={() => {
                                                        if (item.rank > 1) {
                                                            const updated = rankingItems.map(i => {
                                                                if (i.id === item.id) return { ...i, rank: i.rank - 1 };
                                                                if (i.rank === item.rank - 1) return { ...i, rank: i.rank + 1 };
                                                                return i;
                                                            });
                                                            setRankingItems(updated);
                                                        }
                                                    }}
                                                    className="text-white/30 hover:text-white/70"
                                                    disabled={item.rank === 1}
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                                    </svg>
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        if (item.rank < rankingItems.length) {
                                                            const updated = rankingItems.map(i => {
                                                                if (i.id === item.id) return { ...i, rank: i.rank + 1 };
                                                                if (i.rank === item.rank + 1) return { ...i, rank: i.rank - 1 };
                                                                return i;
                                                            });
                                                            setRankingItems(updated);
                                                        }
                                                    }}
                                                    className="text-white/30 hover:text-white/70"
                                                    disabled={item.rank === rankingItems.length}
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                    </svg>
                                                </button>
                                            </div>
                                            <button
                                                onClick={() => setRankingItems(rankingItems.filter(i => i.id !== item.id))}
                                                className="ml-auto text-white/30 hover:text-red-400"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            </button>
                                        </div>
                                        <textarea
                                            value={item.response}
                                            onChange={e => setRankingItems(rankingItems.map(i => 
                                                i.id === item.id ? { ...i, response: e.target.value } : i
                                            ))}
                                            placeholder="Paste response to rank..."
                                            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white/80 placeholder-white/30 min-h-[80px] resize-none"
                                        />
                                    </div>
                                ))}
                        </div>
                    )}
                </div>
            )}

            {/* Prompt Selector Modal */}
            {showSelector && (
                <PromptSelector
                    onSelect={handleSelectPrompt}
                    onClose={() => setShowSelector(false)}
                />
            )}
        </div>
    );
}
