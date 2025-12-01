import { useState, useEffect } from 'react';
import { api } from '../services/api';

type GenerationMode = 'from_task' | 'from_examples' | 'from_prompt' | 'edge_cases';
type TaskType = 'classification' | 'extraction' | 'generation' | 'qa' | 'summarization' | 'translation' | 'custom';
type Difficulty = 'easy' | 'medium' | 'hard' | 'mixed';

interface GeneratedItem {
    input: string;
    output: string;
}

type GeneratorContext = 'benchmark' | 'robustness' | 'comparison' | 'optimizer' | 'general';

interface DatasetGeneratorProps {
    settings: {
        provider: string;
        model: string;
        apiKey?: string;
    };
    onGenerated?: (data: GeneratedItem[], name?: string) => void;
    onClose?: () => void;
    initialPrompt?: string;
    title?: string;
    description?: string;
    context?: GeneratorContext;
}

// Context-specific configuration
const contextConfig: Record<GeneratorContext, {
    defaultMode: GenerationMode;
    availableModes: GenerationMode[];
    hint: string;
}> = {
    benchmark: {
        defaultMode: 'from_task',
        availableModes: ['from_task', 'from_examples', 'from_prompt'],
        hint: 'Describe your task or provide 2-3 seed examples → AI will generate a full test set with expected outputs'
    },
    robustness: {
        defaultMode: 'edge_cases',
        availableModes: ['edge_cases', 'from_prompt'],
        hint: 'Paste your prompt → AI will generate edge cases, format variations, and adversarial inputs to stress-test it'
    },
    comparison: {
        defaultMode: 'from_task',
        availableModes: ['from_task', 'from_examples', 'from_prompt'],
        hint: 'Describe your task or provide examples → AI will create diverse test cases to compare prompt variants'
    },
    optimizer: {
        defaultMode: 'from_examples',
        availableModes: ['from_examples', 'from_task', 'from_prompt'],
        hint: 'Fill in 2-3 input/output examples showing desired behavior → AI will expand them into a training dataset'
    },
    general: {
        defaultMode: 'from_task',
        availableModes: ['from_task', 'from_examples', 'from_prompt', 'edge_cases'],
        hint: 'Choose a mode and provide context → AI will generate synthetic data'
    }
};

// SVG Icon components
const ModeIcons: Record<GenerationMode, React.ReactNode> = {
    from_task: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
    ),
    from_examples: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
    ),
    from_prompt: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
        </svg>
    ),
    edge_cases: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
    )
};

const modeInfo: Record<GenerationMode, { title: string; description: string }> = {
    from_task: {
        title: 'From Task Description',
        description: 'Describe your task and AI will generate diverse input/output pairs'
    },
    from_examples: {
        title: 'From Examples',
        description: 'Provide 2-5 seed examples to expand into a full dataset'
    },
    from_prompt: {
        title: 'From Prompt',
        description: 'Generate test cases to evaluate a specific prompt'
    },
    edge_cases: {
        title: 'Edge Cases',
        description: 'Generate adversarial inputs for robustness testing'
    }
};

const taskTypes: { id: TaskType; name: string }[] = [
    { id: 'classification', name: 'Classification' },
    { id: 'extraction', name: 'Extraction' },
    { id: 'generation', name: 'Generation' },
    { id: 'qa', name: 'Q&A' },
    { id: 'summarization', name: 'Summarization' },
    { id: 'translation', name: 'Translation' },
    { id: 'custom', name: 'Custom' }
];

const difficulties: { id: Difficulty; name: string }[] = [
    { id: 'easy', name: 'Easy' },
    { id: 'medium', name: 'Medium' },
    { id: 'hard', name: 'Hard' },
    { id: 'mixed', name: 'Mixed' }
];

export function DatasetGenerator({ settings, onGenerated, onClose, initialPrompt, title, description, context = 'general' }: DatasetGeneratorProps) {
    const config = contextConfig[context];
    
    // Generation config
    const [mode, setMode] = useState<GenerationMode>(config.defaultMode);
    const [taskType, setTaskType] = useState<TaskType>('custom');
    const [count, setCount] = useState(10);
    const [difficulty, setDifficulty] = useState<Difficulty>('mixed');
    const [domain, setDomain] = useState('');
    const [includeEdgeCases, setIncludeEdgeCases] = useState(false);

    // Mode-specific inputs
    const [taskDescription, setTaskDescription] = useState('');
    const [promptToTest, setPromptToTest] = useState(initialPrompt || '');
    const [seedExamples, setSeedExamples] = useState<GeneratedItem[]>([
        { input: '', output: '' },
        { input: '', output: '' }
    ]);

    // Generation state
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedData, setGeneratedData] = useState<GeneratedItem[]>([]);
    const [error, setError] = useState<string | null>(null);

    // Save options
    const [datasetName, setDatasetName] = useState('');
    const [datasetDescription, setDatasetDescription] = useState('');

    useEffect(() => {
        if (initialPrompt) {
            setMode('from_prompt');
            setPromptToTest(initialPrompt);
        }
    }, [initialPrompt]);

    const handleGenerate = async () => {
        setError(null);
        setIsGenerating(true);
        setGeneratedData([]);

        try {
            const request: any = {
                mode,
                task_type: taskType,
                count,
                difficulty,
                domain,
                include_edge_cases: includeEdgeCases,
                provider: settings.provider,
                model: settings.model,
                api_key: settings.apiKey
            };

            // Add mode-specific fields
            if (mode === 'from_task') {
                if (!taskDescription.trim()) {
                    throw new Error('Please provide a task description');
                }
                request.task_description = taskDescription;
            } else if (mode === 'from_examples') {
                const validExamples = seedExamples.filter(e => e.input.trim() && e.output.trim());
                if (validExamples.length < 2) {
                    throw new Error('Please provide at least 2 complete examples');
                }
                request.seed_examples = validExamples;
            } else if (mode === 'from_prompt') {
                if (!promptToTest.trim()) {
                    throw new Error('Please provide a prompt to test');
                }
                request.prompt_to_test = promptToTest;
            }
            // edge_cases mode doesn't require additional fields

            const result = await api.generateDataset(request);
            setGeneratedData(result.data);

            // Auto-generate dataset name if not set
            if (!datasetName) {
                const modeLabel = modeInfo[mode].title;
                setDatasetName(`Generated: ${modeLabel} (${result.generated_count} items)`);
            }
        } catch (err: any) {
            setError(err.message || 'Failed to generate dataset');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSave = () => {
        if (generatedData.length > 0 && onGenerated) {
            onGenerated(generatedData, datasetName || undefined);
        }
    };

    const addSeedExample = () => {
        setSeedExamples([...seedExamples, { input: '', output: '' }]);
    };

    const removeSeedExample = (index: number) => {
        if (seedExamples.length > 2) {
            setSeedExamples(seedExamples.filter((_, i) => i !== index));
        }
    };

    const updateSeedExample = (index: number, field: 'input' | 'output', value: string) => {
        const updated = [...seedExamples];
        updated[index][field] = value;
        setSeedExamples(updated);
    };

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="px-6 py-4 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-semibold text-white/90">{title || 'Generate Dataset'}</h2>
                    <p className="text-xs text-white/40">{description || 'Use AI to create test data for benchmarks and optimization'}</p>
                </div>
                {onClose && (
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                )}
            </div>

            <div className="flex-1 overflow-y-auto">
                <div className="p-6 space-y-6">
                    {/* Context hint */}
                    {context !== 'general' && (
                        <div className="bg-[#007AFF]/5 border border-[#007AFF]/10 rounded-xl p-3">
                            <p className="text-xs text-[#60a5fa]">{config.hint}</p>
                        </div>
                    )}

                    {/* Mode Selection */}
                    <div>
                        <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest mb-3">
                            Generation Mode
                        </label>
                        <div className={`grid gap-3 ${config.availableModes.length <= 2 ? 'grid-cols-2' : 'grid-cols-2'}`}>
                            {config.availableModes.map((m) => (
                                <button
                                    key={m}
                                    onClick={() => setMode(m)}
                                    className={`p-4 rounded-xl border text-left transition-all ${mode === m
                                        ? 'bg-[#007AFF]/10 border-[#007AFF]/30'
                                        : 'bg-white/[0.02] border-white/5 hover:border-white/10'
                                        }`}
                                >
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className={`${mode === m ? 'text-[#007AFF]' : 'text-white/50'}`}>{ModeIcons[m]}</span>
                                        <span className={`text-sm font-medium ${mode === m ? 'text-white' : 'text-white/70'}`}>
                                            {modeInfo[m].title}
                                        </span>
                                    </div>
                                    <p className="text-[11px] text-white/40 leading-relaxed">
                                        {modeInfo[m].description}
                                    </p>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Mode-specific inputs */}
                    {mode === 'from_task' && (
                        <div>
                            <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2">
                                Task Description
                            </label>
                            <textarea
                                value={taskDescription}
                                onChange={(e) => setTaskDescription(e.target.value)}
                                placeholder="Describe the task you want to generate data for. E.g., 'Classify customer support tickets into categories: billing, technical, general inquiry'"
                                className="w-full min-h-[120px] bg-black/30 border border-white/5 rounded-xl px-4 py-3 text-sm text-white/90 placeholder:text-white/25 resize-none focus:outline-none focus:border-[#007AFF]/30"
                            />
                        </div>
                    )}

                    {mode === 'from_examples' && (
                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">
                                    Seed Examples ({seedExamples.length})
                                </label>
                                <button
                                    onClick={addSeedExample}
                                    className="text-xs text-[#007AFF] hover:text-[#0071E3] font-medium"
                                >
                                    + Add Example
                                </button>
                            </div>
                            <div className="space-y-3">
                                {seedExamples.map((example, index) => (
                                    <div key={index} className="bg-black/30 p-4 rounded-xl border border-white/5 group">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-[10px] text-white/30 font-mono">#{index + 1}</span>
                                            {seedExamples.length > 2 && (
                                                <button
                                                    onClick={() => removeSeedExample(index)}
                                                    className="text-[10px] text-red-400/50 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                                                >
                                                    Remove
                                                </button>
                                            )}
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="text-[10px] text-white/30 uppercase tracking-wider block mb-1">Input</label>
                                                <textarea
                                                    value={example.input}
                                                    onChange={(e) => updateSeedExample(index, 'input', e.target.value)}
                                                    className="w-full min-h-[60px] bg-black/40 border border-white/5 rounded-lg px-3 py-2 text-xs text-white/90 placeholder:text-white/20 resize-none focus:outline-none focus:border-white/20"
                                                    placeholder="Example input..."
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[10px] text-white/30 uppercase tracking-wider block mb-1">Output</label>
                                                <textarea
                                                    value={example.output}
                                                    onChange={(e) => updateSeedExample(index, 'output', e.target.value)}
                                                    className="w-full min-h-[60px] bg-black/40 border border-white/5 rounded-lg px-3 py-2 text-xs text-white/90 placeholder:text-white/20 resize-none focus:outline-none focus:border-white/20"
                                                    placeholder="Expected output..."
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {mode === 'from_prompt' && (
                        <div>
                            <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2">
                                Prompt to Test
                            </label>
                            <textarea
                                value={promptToTest}
                                onChange={(e) => setPromptToTest(e.target.value)}
                                placeholder="Paste the prompt you want to generate test cases for..."
                                className="w-full min-h-[150px] bg-black/30 border border-white/5 rounded-xl px-4 py-3 text-sm text-white/90 placeholder:text-white/25 resize-none focus:outline-none focus:border-[#007AFF]/30 font-mono"
                            />
                        </div>
                    )}

                    {mode === 'edge_cases' && (
                        <div className="bg-amber-500/5 border border-amber-500/10 rounded-xl p-4">
                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
                                    <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-sm text-white/80 font-medium mb-1">Edge Case Generation</p>
                                    <p className="text-xs text-white/50 leading-relaxed">
                                        This mode generates adversarial inputs including: format variations, boundary cases,
                                        special characters, ambiguous inputs, and potential prompt injection attempts.
                                        Useful for robustness testing before production deployment.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Configuration */}
                    <div className="grid grid-cols-2 gap-4">
                        {/* Task Type */}
                        <div>
                            <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2">
                                Task Type
                            </label>
                            <div className="relative">
                                <select
                                    value={taskType}
                                    onChange={(e) => setTaskType(e.target.value as TaskType)}
                                    className="w-full bg-black/30 border border-white/5 rounded-lg px-3 py-2.5 text-sm text-white/90 appearance-none focus:outline-none focus:border-[#007AFF]/30"
                                >
                                    {taskTypes.map((t) => (
                                        <option key={t.id} value={t.id}>
                                            {t.name}
                                        </option>
                                    ))}
                                </select>
                                <svg className="absolute right-3 top-3 w-4 h-4 text-white/30 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </div>
                        </div>

                        {/* Count */}
                        <div>
                            <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2">
                                Number of Examples
                            </label>
                            <input
                                type="number"
                                min={5}
                                max={100}
                                value={count}
                                onChange={(e) => setCount(Math.min(100, Math.max(5, parseInt(e.target.value) || 10)))}
                                className="w-full bg-black/30 border border-white/5 rounded-lg px-3 py-2.5 text-sm text-white/90 focus:outline-none focus:border-[#007AFF]/30"
                            />
                        </div>

                        {/* Difficulty */}
                        <div>
                            <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2">
                                Difficulty
                            </label>
                            <div className="flex gap-2">
                                {difficulties.map((d) => (
                                    <button
                                        key={d.id}
                                        onClick={() => setDifficulty(d.id)}
                                        className={`flex-1 py-2 text-xs font-medium rounded-lg border transition-all ${difficulty === d.id
                                            ? 'bg-white/10 border-white/20 text-white'
                                            : 'border-white/5 text-white/40 hover:border-white/10'
                                            }`}
                                    >
                                        {d.name}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Domain */}
                        <div>
                            <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2">
                                Domain (Optional)
                            </label>
                            <input
                                type="text"
                                value={domain}
                                onChange={(e) => setDomain(e.target.value)}
                                placeholder="e.g., Healthcare, Finance, E-commerce"
                                className="w-full bg-black/30 border border-white/5 rounded-lg px-3 py-2.5 text-sm text-white/90 placeholder:text-white/25 focus:outline-none focus:border-[#007AFF]/30"
                            />
                        </div>
                    </div>

                    {/* Include Edge Cases Toggle */}
                    {mode !== 'edge_cases' && (
                        <label className="flex items-center gap-3 cursor-pointer group">
                            <button
                                type="button"
                                onClick={() => setIncludeEdgeCases(!includeEdgeCases)}
                                className={`w-10 h-6 rounded-full transition-colors ${includeEdgeCases ? 'bg-[#007AFF]' : 'bg-white/10'}`}
                            >
                                <div className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform mt-0.5 ${includeEdgeCases ? 'translate-x-4.5 ml-0.5' : 'translate-x-0.5'}`} />
                            </button>
                            <span className="text-sm text-white/70 group-hover:text-white/90 transition-colors">
                                Include edge cases in generation
                            </span>
                        </label>
                    )}

                    {/* Generate Button */}
                    <div className="flex justify-end">
                        <button
                            onClick={handleGenerate}
                            disabled={isGenerating}
                            className={`px-6 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-lg shadow-blue-500/10 ${isGenerating
                                ? 'bg-[#2563EB]/50 text-white/50 cursor-not-allowed'
                                : 'bg-[#2563EB] hover:bg-[#1d4fd8] text-white'
                                }`}
                        >
                        {isGenerating ? 'Generating...' : `Generate ${count} Examples`}
                        </button>
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm flex items-start gap-2">
                            <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>{error}</span>
                        </div>
                    )}

                    {/* Generated Results */}
                    {generatedData.length > 0 && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="text-emerald-400">✓</span>
                                    <span className="text-sm font-medium text-white/80">
                                        Generated {generatedData.length} examples
                                    </span>
                                </div>
                            </div>

                            {/* Save Options */}
                            <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-4 space-y-3">
                                <div>
                                    <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2">
                                        Dataset Name
                                    </label>
                                    <input
                                        type="text"
                                        value={datasetName}
                                        onChange={(e) => setDatasetName(e.target.value)}
                                        placeholder="Name for the new dataset"
                                        className="w-full bg-black/30 border border-white/5 rounded-lg px-3 py-2 text-sm text-white/90 placeholder:text-white/25 focus:outline-none focus:border-emerald-500/30"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2">
                                        Description (Optional)
                                    </label>
                                    <input
                                        type="text"
                                        value={datasetDescription}
                                        onChange={(e) => setDatasetDescription(e.target.value)}
                                        placeholder="Brief description..."
                                        className="w-full bg-black/30 border border-white/5 rounded-lg px-3 py-2 text-sm text-white/90 placeholder:text-white/25 focus:outline-none focus:border-emerald-500/30"
                                    />
                                </div>
                                <button
                                    onClick={handleSave}
                                    className="w-full py-2.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    Use This Dataset
                                </button>
                            </div>

                            {/* Preview */}
                            <div>
                                <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest mb-3">
                                    Preview (First 5)
                                </label>
                                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                    {generatedData.slice(0, 5).map((item, index) => (
                                        <div key={index} className="bg-white/[0.02] p-3 rounded-lg border border-white/5">
                                            <div className="text-[10px] text-white/20 font-mono mb-2">#{index + 1}</div>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <div className="text-[10px] text-white/40 uppercase tracking-wider mb-1">Input</div>
                                                    <div className="text-xs text-white/70 line-clamp-3">{item.input}</div>
                                                </div>
                                                <div>
                                                    <div className="text-[10px] text-emerald-400/40 uppercase tracking-wider mb-1">Output</div>
                                                    <div className="text-xs text-emerald-400/70 line-clamp-3">{item.output}</div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {generatedData.length > 5 && (
                                        <div className="text-center text-xs text-white/30 py-2">
                                            + {generatedData.length - 5} more examples
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Footer with model info */}
            <div className="px-6 py-3 border-t border-white/5 bg-black/20">
                <div className="flex items-center justify-between text-[11px] text-white/40">
                    <span>Using: {settings.provider} / {settings.model}</span>
                    <span>Max 100 examples per generation</span>
                </div>
            </div>
        </div>
    );
}
