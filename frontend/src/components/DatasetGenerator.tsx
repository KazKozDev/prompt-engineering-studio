import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { api } from '../services/api';
import { Button } from './ui/Button';
import { MethodologyIcon } from './icons/MethodologyIcon';

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

const modeInfo: Record<GenerationMode, { title: string; description: string }> = {
    from_task: {
        title: 'From Task Description',
        description: 'Describe the real-world task you care about, and AI will synthesize diverse input/output pairs that match it. Best when you know the goal but don’t yet have examples. Recommended for: early prototypes, Quality / Performance benchmarks, and quick sanity-check datasets.'
    },
    from_examples: {
        title: 'From Examples',
        description: 'Provide 2–5 high-quality input/output examples and let AI expand them into a larger dataset. Best when you already have a few “golden” cases that show desired behavior. Recommended for: DSPy optimization datasets, Offline Benchmarks, and production-grade Evaluation Lab runs.'
    },
    from_prompt: {
        title: 'From Prompt',
        description: 'Paste a specific prompt and generate targeted test cases to evaluate and regress it. Useful for comparing prompt versions and catching failures before production. Recommended for: Evaluation Lab (Quality, Consistency) and prompt A/B testing.'
    },
    edge_cases: {
        title: 'Edge Cases',
        description: 'Generates adversarial and boundary inputs: format variations, long/short extremes, special characters, ambiguous phrasing, and prompt-injection attempts to stress-test robustness. Recommended for: Robustness tab, security / jailbreak checks, and red-teaming prompts.'
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
    const [guideOpen, setGuideOpen] = useState(false);
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

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

            // Auto-generate dataset name using LLM (same logic as prompt titles)
            if (!datasetName) {
                try {
                    // Build context text for title generation based on mode
                    let contextText = '';
                    if (mode === 'from_task' && taskDescription) {
                        contextText = `Dataset for task: ${taskDescription}`;
                    } else if (mode === 'from_prompt' && promptToTest) {
                        contextText = `Test dataset for prompt: ${promptToTest.substring(0, 200)}`;
                    } else if (mode === 'from_examples' && seedExamples.length > 0) {
                        const exampleText = seedExamples
                            .filter(e => e.input.trim())
                            .map(e => e.input)
                            .slice(0, 2)
                            .join('; ');
                        contextText = `Dataset based on examples: ${exampleText}`;
                    } else if (mode === 'edge_cases') {
                        contextText = `Edge cases and adversarial inputs for ${domain || taskType} testing`;
                    }

                    if (contextText) {
                        const titleResponse = await api.generateTitle({
                            prompt_text: contextText,
                            provider: 'local',
                            model: 'google/flan-t5-small'
                        });
                        if (titleResponse.title) {
                            setDatasetName(titleResponse.title);
                        } else {
                            // Fallback to simple name
                            const modeLabel = modeInfo[mode].title;
                            setDatasetName(`${modeLabel} Dataset`);
                        }
                    } else {
                        const modeLabel = modeInfo[mode].title;
                        setDatasetName(`${modeLabel} Dataset`);
                    }
                } catch {
                    // Fallback if title generation fails
                    const modeLabel = modeInfo[mode].title;
                    setDatasetName(`${modeLabel} Dataset`);
                }
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

    const hasRequiredInputs = (() => {
        if (mode === 'from_task') {
            return taskDescription.trim().length > 0;
        }
        if (mode === 'from_examples') {
            const filled = seedExamples.filter(
                (ex) => ex.input.trim().length > 0 && ex.output.trim().length > 0
            );
            return filled.length >= 2;
        }
        if (mode === 'from_prompt') {
            return promptToTest.trim().length > 0;
        }
        if (mode === 'edge_cases') {
            return promptToTest.trim().length > 0;
        }
        return false;
    })();

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
                <div>
                    <h2 className="text-xl font-semibold text-white/90 mb-1">
                        Generate Dataset
                    </h2>
                    <p className="text-[11px] text-white/45 mt-1">
                        {description || 'Use AI to create test data for benchmarks and optimization.'}
                    </p>
                </div>
                {onClose && (
                    <Button
                        onClick={onClose}
                        variant="ghost"
                        size="icon"
                        className="p-2 text-white/60 hover:text-white"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </Button>
                )}
            </div>

            <div className="flex-1 overflow-y-auto">
                <div className="p-6 space-y-6">
                    {/* Context hint */}
                    {context !== 'general' && (
                        <div className="bg-white/[0.03] border border-white/10 rounded-lg p-3">
                            <p className="text-xs text-white/50">{config.hint}</p>
                        </div>
                    )}

                    {/* Mode Selection */}
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest">
                                Generation Mode
                            </label>
                            <button
                                onClick={() => setGuideOpen(true)}
                                className="px-2 py-1.5 rounded-lg border border-amber-500/30 bg-amber-900/20 text-amber-300 hover:bg-amber-900/30 transition-all"
                                title="Generation Mode Guide"
                            >
                                <MethodologyIcon className="w-3.5 h-3.5" />
                            </button>
                        </div>
                        <div className={`grid gap-2 ${config.availableModes.length <= 2 ? 'grid-cols-2' : 'grid-cols-2'}`}>
                            {config.availableModes.map((m) => (
                                <button
                                    key={m}
                                    onClick={() => setMode(m)}
                                    className={`w-full text-left px-3 py-2.5 rounded-lg border transition-all ${mode === m
                                        ? 'bg-white/10 border-white/20'
                                        : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.04] hover:border-white/10'
                                        }`}
                                >
                                    <div>
                                        <span className={`text-[13px] font-medium ${mode === m ? 'text-white/90' : 'text-white/60'}`}>
                                            {modeInfo[m].title}
                                        </span>
                                    </div>
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
                                className="w-full min-h-[100px] bg-white/[0.02] border border-white/10 rounded-lg px-4 py-3 text-sm text-white/80 placeholder:text-white/30 resize-none focus:outline-none focus:border-white/20 transition-colors"
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
                                    className="text-xs text-white/50 hover:text-white/80 transition-colors"
                                >
                                    + Add Example
                                </button>
                            </div>
                            <div className="space-y-2">
                                {seedExamples.map((example, index) => (
                                    <div key={index} className="bg-white/[0.02] p-3 rounded-lg border border-white/5 group hover:border-white/10 transition-colors">
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
                                                    className="w-full min-h-[60px] bg-white/[0.02] border border-white/10 rounded-lg px-3 py-2 text-xs text-white/80 placeholder:text-white/30 resize-none focus:outline-none focus:border-white/20 transition-colors"
                                                    placeholder="Example input..."
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[10px] text-white/30 uppercase tracking-wider block mb-1">Output</label>
                                                <textarea
                                                    value={example.output}
                                                    onChange={(e) => updateSeedExample(index, 'output', e.target.value)}
                                                    className="w-full min-h-[60px] bg-white/[0.02] border border-white/10 rounded-lg px-3 py-2 text-xs text-white/80 placeholder:text-white/30 resize-none focus:outline-none focus:border-white/20 transition-colors"
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
                                placeholder="Paste the prompt you want to generate test cases for evaluation and regression testing..."
                                className="w-full min-h-[120px] bg-white/[0.02] border border-white/10 rounded-lg px-4 py-3 text-xs text-white/80 placeholder:text-white/30 resize-none focus:outline-none focus:border-white/20 font-mono transition-colors"
                            />
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
                                    className="w-full bg-white/[0.02] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white/80 appearance-none focus:outline-none focus:border-white/20 transition-colors"
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
                                className="w-full bg-white/[0.02] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white/80 focus:outline-none focus:border-white/20 transition-colors"
                            />
                        </div>

                        {/* Difficulty */}
                        <div>
                            <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2">
                                Difficulty
                            </label>
                            <div className="flex gap-1.5">
                                {difficulties.map((d) => (
                                    <button
                                        key={d.id}
                                        onClick={() => setDifficulty(d.id)}
                                        className={`flex-1 py-2 text-xs font-medium rounded-lg border transition-all ${difficulty === d.id
                                            ? 'bg-white/10 border-white/20 text-white/90'
                                            : 'bg-white/[0.02] border-white/5 text-white/50 hover:bg-white/[0.04] hover:border-white/10'
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
                                className="w-full bg-white/[0.02] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white/80 placeholder:text-white/30 focus:outline-none focus:border-white/20 transition-colors"
                            />
                        </div>
                    </div>

                    {/* Include Edge Cases Toggle */}
                    {mode !== 'edge_cases' && (
                        <label className="flex items-center justify-end gap-3 cursor-pointer group">
                            <span className="text-[13px] text-white/50 group-hover:text-white/70 transition-colors">
                                Include edge cases in generation
                            </span>
                            <button
                                type="button"
                                onClick={() => setIncludeEdgeCases(!includeEdgeCases)}
                                className={`w-10 h-5 rounded-full transition-colors relative ${includeEdgeCases ? 'bg-white/20' : 'bg-white/10'}`}
                            >
                                <div className={`w-4 h-4 rounded-full bg-white shadow-sm absolute top-0.5 transition-all ${includeEdgeCases ? 'left-5' : 'left-0.5'}`} />
                            </button>
                        </label>
                    )}

                    {/* Generate Button */}
                    <div className="flex justify-start">
                        <Button
                            onClick={handleGenerate}
                            disabled={isGenerating || !hasRequiredInputs}
                            variant="primary"
                            size="md"
                            className={`${(isGenerating || !hasRequiredInputs) ? 'opacity-60 cursor-not-allowed' : ''}`}
                        >
                            {isGenerating ? 'Generating...' : `Generate ${count} Examples`}
                        </Button>
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="p-3 bg-red-500/5 border border-red-500/10 rounded-lg text-red-300/80 text-sm flex items-start gap-2">
                            <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>{error}</span>
                        </div>
                    )}

                    {/* Generated Results */}
                    {generatedData.length > 0 && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                <svg className="w-4 h-4 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                <span className="text-[13px] font-medium text-white/70">
                                    Generated {generatedData.length} examples
                                </span>
                            </div>

                            {/* Save Options */}
                            <div className="bg-white/[0.02] border border-white/10 rounded-lg p-4 space-y-3">
                                <div>
                                    <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2">
                                        Dataset Name
                                    </label>
                                    <input
                                        type="text"
                                        value={datasetName}
                                        onChange={(e) => setDatasetName(e.target.value)}
                                        placeholder="Name for the new dataset"
                                        className="w-full bg-white/[0.02] border border-white/10 rounded-lg px-3 py-2 text-sm text-white/80 placeholder:text-white/30 focus:outline-none focus:border-white/20 transition-colors"
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
                                        className="w-full bg-white/[0.02] border border-white/10 rounded-lg px-3 py-2 text-sm text-white/80 placeholder:text-white/30 focus:outline-none focus:border-white/20 transition-colors"
                                    />
                                </div>
                                <Button
                                    onClick={handleSave}
                                    variant="primary"
                                    size="sm"
                                    fullWidth
                                    className="gap-2"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    Use This Dataset
                                </Button>
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
                                                    <div className="text-[10px] text-white/40 uppercase tracking-wider mb-1">Output</div>
                                                    <div className="text-xs text-white/60 line-clamp-3">{item.output}</div>
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
            <div className="px-6 py-3 border-t border-white/10">
                <div className="flex items-center justify-between text-[11px] text-white/30">
                    <span>Using: {settings.provider} / {settings.model}</span>
                    <span>Max 100 examples per generation</span>
                </div>
            </div>

            {/* Generation Mode Guide (right-side panel, like Evaluation Lab) */}
            {isClient &&
                typeof document !== 'undefined' &&
                guideOpen &&
                createPortal(
                    <div
                        className="fixed inset-0 z-[60] flex justify-end bg-black/60 backdrop-blur-sm"
                        onClick={() => setGuideOpen(false)}
                    >
                        <div
                            className="w-[380px] max-w-full h-full bg-[#0f1115] border-l border-white/10 shadow-2xl shadow-black/60 flex flex-col"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
                                <div className="flex items-start gap-2">
                                    <MethodologyIcon className="w-4 h-4 text-amber-300/80 mt-0.5" />
                                    <div>
                                        <p className="text-[10px] uppercase tracking-[0.2em] text-white/30 font-semibold mb-1">
                                            Generation Modes
                                        </p>
                                        <h3 className="text-sm font-semibold text-white/90">
                                            When to use each dataset mode
                                        </h3>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setGuideOpen(false)}
                                    className="p-1.5 rounded-lg border border-white/10 text-white/60 hover:text-white hover:border-white/30 transition-colors"
                                    aria-label="Close guide"
                                >
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar text-[11px] text-white/65 leading-relaxed">
                                {(Object.keys(modeInfo) as GenerationMode[]).map((m) => (
                                    <div
                                        key={m}
                                        className={`bg-white/[0.02] border rounded-lg px-3 py-3 ${
                                            mode === m ? 'border-amber-400/40' : 'border-white/8'
                                        }`}
                                    >
                                        <div className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-1">
                                            {modeInfo[m].title}
                                        </div>
                                        <p>{modeInfo[m].description}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>,
                    document.body,
                )}
        </div>
    );
}
