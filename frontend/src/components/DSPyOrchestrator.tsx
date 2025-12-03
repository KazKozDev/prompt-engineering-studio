import { useState, useEffect, useMemo, useRef } from 'react';
import { api } from '../services/api';
import { savePromptToLibrary, type LibraryPrompt } from './PromptLibrary';
import { loadAllDatasets, getDatasetById, type Dataset } from './Datasets';
import { DatasetGenerator } from './DatasetGenerator';
import { DatasetSelector } from './evaluation/DatasetSelector';
import { Button } from './ui/Button';

interface DSPyOrchestratorProps {
    settings: {
        provider: string;
        model: string;
        apiKey?: string;
        apiKeys: {
            openai?: string;
            gemini?: string;
            anthropic?: string;
        };
    };
}

// Provider configurations
const PROVIDER_CONFIGS = [
    { id: 'openai', label: 'OpenAI', apiKeyField: 'openai' },
    { id: 'gemini', label: 'Google Gemini', apiKeyField: 'gemini' },
    { id: 'anthropic', label: 'Anthropic', apiKeyField: 'anthropic' },
    { id: 'ollama', label: 'Ollama (Local)', apiKeyField: null },
] as const;

interface TargetModelOption {
    value: string;
    label: string;
    provider: string;
}

// Optimizer strategies
const OPTIMIZER_STRATEGIES = [
    { value: 'auto', label: 'Auto', tooltip: 'Let the agent analyze your task and pick the best strategy. Good starting point for any task.' },
    { value: 'BootstrapFewShot', label: 'Bootstrap Few-Shot', tooltip: 'Generates exam. from your dataset to teach the model. Fast, works well with 10-50 exam.' },
    { value: 'MIPROv2', label: 'MIPRO v2', tooltip: 'Advanced optimization with instruction tuning. Best quality but slower, needs 50+ exam.' },
    { value: 'COPRO', label: 'COPRO', tooltip: 'Focuses on improving the instruction text itself. Great for complex multi-step tasks.' },
] as const;

// Quality profiles
const QUALITY_PROFILES = [
    { value: 'FAST_CHEAP', label: 'Fast&Cheap', tooltip: 'Minimal iterations, smaller models. Good for prototyping and quick tests.' },
    { value: 'BALANCED', label: 'Balanced', tooltip: 'Moderate optimization with reasonable cost. Best for most production use cases.' },
    { value: 'HIGH_QUALITY', label: 'High Quality', tooltip: 'Maximum iterations, thorough optimization. Use for critical business tasks.' },
] as const;

// ReAct step types
type StepStatus = 'pending' | 'running' | 'success' | 'error' | 'skipped';

interface ReActStep {
    id: string;
    name: string;
    tool: string;
    status: StepStatus;
    thought?: string;
    action?: string;
    observation?: string;
    duration?: number;
    error?: string;
}

interface TaskAnalysis {
    task_type: string;
    domain: string;
    input_roles: string[];
    output_roles: string[];
    needs_retrieval: boolean;
    needs_chain_of_thought: boolean;
    complexity_level: string;
    safety_level: string;
}

interface OrchestratorResult {
    artifact_version_id: string;
    compiled_program_id: string;
    signature_id: string;
    eval_results: {
        metric_name: string;
        metric_value: number;
        num_iterations?: number;
        metric_history?: number[];
        real_dspy?: boolean;
    };
    task_analysis: TaskAnalysis;
    program_code: string;
    deployment_package?: {
        path: string;
        instructions: string;
    };
    react_iterations: number;
    total_cost_usd?: number;
    optimizer_type?: string;
    quality_profile?: string;
    data_splits?: {
        train: number;
        dev: number;
        test: number;
    };
}

export function DSPyOrchestrator({ settings }: DSPyOrchestratorProps) {
    // Input state
    const [businessTask, setBusinessTask] = useState('');
    const [targetLM, setTargetLM] = useState<string>('');
    const [datasetText, setDatasetText] = useState<string>('');

    // Configuration
    const [qualityProfile, setQualityProfile] = useState<string>('BALANCED');
    const [optimizerStrategy, setOptimizerStrategy] = useState<string>('auto');

    // Target model options (dynamically loaded)
    const [targetModelOptions, setTargetModelOptions] = useState<TargetModelOption[]>([]);

    // Process state
    const [isRunning, setIsRunning] = useState(false);
    const [currentPhase, setCurrentPhase] = useState<string>('');
    const [reactSteps, setReactSteps] = useState<ReActStep[]>([]);
    const [result, setResult] = useState<OrchestratorResult | null>(null);
    const [error, setError] = useState<string | null>(null);

    // UI state
    const [datasets, setDatasets] = useState<Dataset[]>([]);
    const [showGenerator, setShowGenerator] = useState(false);
    const [showDatasetPicker, setShowDatasetPicker] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [_showLibraryPicker, _setShowLibraryPicker] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [_libraryPrompts, _setLibraryPrompts] = useState<LibraryPrompt[]>([]);
    const [savedToLibrary, setSavedToLibrary] = useState(false);
    const [activeResultTab, setActiveResultTab] = useState<'overview' | 'code' | 'details' | 'test' | 'deploy'>('overview');
    
    // Test artifact state
    const [testInput, setTestInput] = useState('');
    const [testOutput, setTestOutput] = useState<string | null>(null);
    const [isTesting, setIsTesting] = useState(false);

    const stepsContainerRef = useRef<HTMLDivElement>(null);

    // Load available models from all providers
    const loadAvailableModels = async () => {
        const allOptions: TargetModelOption[] = [];

        for (const providerConfig of PROVIDER_CONFIGS) {
            try {
                // Skip if API key is required but not provided
                if (providerConfig.apiKeyField && !settings.apiKeys[providerConfig.apiKeyField as keyof typeof settings.apiKeys]) {
                    continue;
                }

                const data = await api.getModels(providerConfig.id);
                if (data.models && data.models.length > 0) {
                    data.models.forEach((model: string) => {
                        // Value is fully-qualified LM name for DSPy, e.g. "openai/gpt-5-mini" or "ollama/gemma3:4b"
                        const fqName = `${providerConfig.id}/${model}`;
                        allOptions.push({
                            value: fqName,
                            label: `${model} (${providerConfig.label})`,
                            provider: providerConfig.id,
                        });
                    });
                }
            } catch (error) {
                console.error(`Failed to load models for ${providerConfig.id}:`, error);
            }
        }

        setTargetModelOptions(allOptions);

        // Set default target model
        if (allOptions.length > 0 && !targetLM) {
            setTargetLM(allOptions[0].value);
        }
    };

    // Load datasets and models on mount
    useEffect(() => {
        loadAllDatasets().then(setDatasets);
        loadLibraryPrompts();
        loadAvailableModels();
    }, []);

    // Auto-scroll to latest step
    useEffect(() => {
        if (stepsContainerRef.current) {
            stepsContainerRef.current.scrollTop = stepsContainerRef.current.scrollHeight;
        }
    }, [reactSteps]);

    const loadLibraryPrompts = () => {
        try {
            const saved = localStorage.getItem('prompt-library');
            if (saved) _setLibraryPrompts(JSON.parse(saved));
        } catch (e) {
            console.error('Error loading library prompts:', e);
        }
    };

    const handleDatasetSelect = async (datasetId: string) => {
        if (datasetId) {
            const dataset = await getDatasetById(datasetId);
            if (dataset?.data) {
                setDatasetText(JSON.stringify(dataset.data, null, 2));
            }
        } else {
            setDatasetText('');
        }
    };


    // Ref to store abort function for streaming
    const abortStreamRef = useRef<(() => void) | null>(null);

    const handleRun = async () => {
        if (!businessTask.trim() || !datasetText.trim()) return;

        // Abort any existing stream
        if (abortStreamRef.current) {
            abortStreamRef.current();
            abortStreamRef.current = null;
        }

        setError(null);
        setIsRunning(true);
        setResult(null);
        setReactSteps([]);
        setSavedToLibrary(false);

        // Validate dataset
        let dataset;
        try {
            dataset = JSON.parse(datasetText);
            if (!Array.isArray(dataset)) throw new Error("Dataset must be an array");
            if (dataset.length < 5) throw new Error("Dataset must have at least 5 exam.");
        } catch (e: any) {
            setError(`Invalid dataset: ${e.message}`);
            setIsRunning(false);
            return;
        }

        // Show initial step
        setCurrentPhase('Connecting to agent...');
        const initialStep: ReActStep = {
            id: 'step_init',
            name: 'Initialize Orchestrator',
            tool: 'init',
            status: 'running',
            thought: 'Starting DSPy Agent Orchestrator with ReAct pipeline...',
        };
        setReactSteps([initialStep]);

        // Use SSE streaming for real-time updates
        abortStreamRef.current = api.streamDSPyOrchestrator(
            {
                business_task: businessTask,
                target_lm: targetLM,
                dataset: dataset,
                quality_profile: qualityProfile,
                optimizer_strategy: optimizerStrategy,
                provider: settings.provider,
                model: settings.model,
            },
            {
                onStep: (step) => {
                    // Update phase based on step
                    setCurrentPhase(step.name);
                    
                    // Add or update step in list
                    setReactSteps(prev => {
                        // Check if step already exists (update it)
                        const existingIndex = prev.findIndex(s => s.id === step.id);
                        const newStep: ReActStep = {
                            id: step.id,
                            name: step.name,
                            tool: step.tool,
                            status: step.status as StepStatus,
                            thought: step.thought,
                            action: step.action,
                            observation: step.observation,
                            duration: step.duration_ms,
                            error: step.error,
                        };
                        
                        if (existingIndex >= 0) {
                            // Update existing step
                            const updated = [...prev];
                            updated[existingIndex] = newStep;
                            return updated;
                        } else {
                            // Mark init step as success if this is first real step
                            if (prev.length === 1 && prev[0].id === 'step_init') {
                                return [
                                    { ...prev[0], status: 'success' as StepStatus },
                                    newStep
                                ];
                            }
                            return [...prev, newStep];
                        }
                    });
                },
                onComplete: (response) => {
                    // Mark all steps as complete
                    setReactSteps(prev => prev.map(s => 
                        s.status === 'running' ? { ...s, status: 'success' as StepStatus } : s
                    ));
                    
                    // Set result
                    setResult({
                        artifact_version_id: response.artifact_version_id,
                        compiled_program_id: response.compiled_program_id,
                        signature_id: response.signature_id,
                        eval_results: response.eval_results,
                        task_analysis: response.task_analysis,
                        program_code: response.program_code,
                        deployment_package: response.deployment_package,
                        react_iterations: response.react_iterations,
                        total_cost_usd: response.total_cost_usd,
                        optimizer_type: response.optimizer_type,
                        quality_profile: response.quality_profile,
                        data_splits: response.data_splits,
                    });

                    setCurrentPhase('Complete!');
                    setIsRunning(false);
                    abortStreamRef.current = null;
                },
                onError: (errorMsg) => {
                    setError(errorMsg);
                    setReactSteps(prev => {
                        const lastStep = prev[prev.length - 1];
                        if (lastStep && lastStep.status === 'running') {
                            return prev.map(s => s.id === lastStep.id ? { ...s, status: 'error' as StepStatus, error: errorMsg } : s);
                        }
                        return prev;
                    });
                    setIsRunning(false);
                    abortStreamRef.current = null;
                }
            }
        );
    };

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (abortStreamRef.current) {
                abortStreamRef.current();
            }
        };
    }, []);

    const handleSaveToLibrary = () => {
        if (!result) return;

        savePromptToLibrary({
            name: `DSPy: ${result.task_analysis.task_type} (${result.artifact_version_id})`,
            text: result.program_code,
            technique: 'dspy-orchestrator',
            techniqueName: 'DSPy Orchestrator',
            status: 'production',
            category: result.task_analysis.domain.charAt(0).toUpperCase() + result.task_analysis.domain.slice(1),
            tags: ['dspy', 'optimized', result.task_analysis.task_type, targetLM],
            description: `DSPy-optimized program. Metric: ${(result.eval_results.metric_value * 100).toFixed(1)}%`,
            sourceType: 'optimized',
            evaluation: {
                qualityScore: Math.round(result.eval_results.metric_value * 100),
                robustnessScore: 0,
                consistencyScore: 0,
                overallScore: Math.round(result.eval_results.metric_value * 100),
                lastTested: new Date().toISOString(),
            },
        });
        setSavedToLibrary(true);
    };

    const datasetCount = useMemo(() => {
        try {
            const parsed = JSON.parse(datasetText);
            return Array.isArray(parsed) ? parsed.length : 0;
        } catch {
            return 0;
        }
    }, [datasetText]);

    const getStepIcon = (status: StepStatus) => {
        switch (status) {
            case 'running':
                return (
                    <svg className="w-4 h-4 animate-spin text-blue-400" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                );
            case 'success':
                return (
                    <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                );
            case 'error':
                return (
                    <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                );
            default:
                return <div className="w-4 h-4 rounded-full border-2 border-white/20" />;
        }
    };

    return (
        <div className="h-full flex gap-6 p-6 overflow-hidden">
            {/* Dataset Generator Modal */}
            {showGenerator && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-8">
                    <div className="bg-[#0d0d0d] border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DatasetGenerator
                            settings={settings}
                            context="optimizer"
                            title="Generate Eval Dataset"
                            description="Create input/output exam. for DSPy optimization"
                            initialPrompt={businessTask || ''}
                            onGenerated={async (data, name) => {
                                try {
                                    const result = await api.createDataset({
                                        name: name || `DSPy Dataset ${new Date().toLocaleDateString()}`,
                                        description: 'Generated for DSPy optimization',
                                        category: 'dspy',
                                        data,
                                    });
                                    if (result?.id) {
                                        setDatasetText(JSON.stringify(data, null, 2));
                                    }
                                    const allDatasets = await loadAllDatasets();
                                    setDatasets(allDatasets);
                                    setShowGenerator(false);
                                } catch (err) {
                                    console.error('Failed to save dataset:', err);
                                }
                            }}
                            onClose={() => setShowGenerator(false)}
                        />
                    </div>
                </div>
            )}

            {/* Left Column: Configuration */}
            <div className="w-80 flex flex-col shrink-0 gap-4">
                <div>
                    <h2 className="text-[11px] font-bold text-white/30 uppercase tracking-widest mb-1">DSPy</h2>
                    <p className="text-xs text-white/40 mt-1">Automated prompt optimization</p>
                </div>

                {/* Target LM Selection */}
                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Target Model</label>
                    <select
                        value={targetLM}
                        onChange={(e) => setTargetLM(e.target.value)}
                        className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white/80 focus:outline-none focus:border-white/20 appearance-none cursor-pointer"
                        disabled={targetModelOptions.length === 0}
                    >
                        {targetModelOptions.length === 0 ? (
                            <option value="">No models available - configure providers in Settings</option>
                        ) : (
                            targetModelOptions.map((opt) => (
                                <option key={`${opt.provider}-${opt.value}`} value={opt.value}>
                                    {opt.label}
                                </option>
                            ))
                        )}
                    </select>
                    {targetModelOptions.length === 0 && (
                        <p className="text-[10px] text-yellow-400/60 mt-1">
                            Configure API keys in Settings to enable more models
                        </p>
                    )}
                </div>

                {/* Quality Profile */}
                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Quality Profile</label>
                    <div className="grid grid-cols-3 gap-2">
                        {QUALITY_PROFILES.map(profile => (
                            <button
                                key={profile.value}
                                onClick={() => setQualityProfile(profile.value)}
                                className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${qualityProfile === profile.value
                                    ? 'bg-white/10 border-white/20 text-white'
                                    : 'bg-transparent border-white/10 text-white/60 hover:bg-white/5 hover:text-white/80'
                                    }`}
                            >
                                {profile.label}
                            </button>
                        ))}
                    </div>
                    <p className="text-[10px] text-white/40 leading-relaxed">
                        {QUALITY_PROFILES.find(p => p.value === qualityProfile)?.tooltip}
                    </p>
                </div>

                {/* Optimizer Strategy */}
                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Optimizer Strategy</label>
                    <div className="grid grid-cols-2 gap-2">
                        {OPTIMIZER_STRATEGIES.map(opt => (
                            <button
                                key={opt.value}
                                onClick={() => setOptimizerStrategy(opt.value)}
                                className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${optimizerStrategy === opt.value
                                    ? 'bg-white/10 border-white/20 text-white'
                                    : 'bg-transparent border-white/10 text-white/60 hover:bg-white/5 hover:text-white/80'
                                    }`}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                    <p className="text-[10px] text-white/40 leading-relaxed">
                        {OPTIMIZER_STRATEGIES.find(o => o.value === optimizerStrategy)?.tooltip}
                    </p>
                </div>

                {/* DSPy Suitability Guide */}
                <div className="space-y-2 mt-4">
                    <div className="bg-white/[0.02] border border-white/10 border-l-2 border-l-emerald-300/60 rounded-lg px-3 py-2">
                        <div className="text-[10px] font-bold text-white/60 uppercase tracking-widest mb-1">Best for DSPy</div>
                        <ul className="list-disc list-inside space-y-1 text-[11px] text-white/60">
                            <li>Complex, multi-step pipelines (RAG, CoT, tool use).</li>
                            <li>Enough labeled data (30–50+, ideally 300+ exam.).</li>
                            <li>Clear metrics: accuracy, pass@k, cost, latency.</li>
                            <li>Need to auto-adapt prompts across models.</li>
                        </ul>
                    </div>
                    <div className="bg-white/[0.02] border border-white/10 border-l-2 border-l-rose-300/60 rounded-lg px-3 py-2">
                        <div className="text-[10px] font-bold text-white/60 uppercase tracking-widest mb-1">Avoid DSPy for</div>
                        <ul className="list-disc list-inside space-y-1 text-[11px] text-white/60">
                            <li>Simple, one-off prompts (e.g., “write a poem”).</li>
                            <li>Too little data (&lt; ~30 exam.) or no numeric metric.</li>
                            <li>Highly conversational or open-ended creative apps.</li>
                            <li>Hard compute/budget limits or use of a single DSPy block.</li>
                        </ul>
                    </div>
                </div>

            </div>

            {/* Middle Column: Task Input + ReAct Steps */}
            <div className="flex-1 min-w-0 flex flex-col gap-4 overflow-hidden">
                {/* Task Input Card */}
                <div className="bg-black/20 border border-white/5 rounded-2xl overflow-hidden flex flex-col">
                    <div className="px-6 py-5 border-b border-white/5 bg-white/[0.02] flex items-start justify-between gap-4">
                        <div>
                            <h2 className="text-xl font-semibold text-white/90 mb-1">DSPy Orchestrator</h2>
                            <p className="text-xs text-white/45 mt-1">Describe the business task you want DSPy to optimize.</p>
                        </div>
                        <div className="flex flex-col items-end gap-1 text-[11px]">
                            <div className="px-2 py-1 rounded-md border border-white/10 text-white/50 bg-black/30">
                                Agent: GPT-5 → Target: {targetLM || 'Not selected'}
                            </div>
                            <div className="flex flex-wrap justify-end gap-2 text-white/40">
                                <span>
                                    Profile:{' '}
                                    {QUALITY_PROFILES.find(p => p.value === qualityProfile)?.label || qualityProfile}
                                </span>
                                {result?.optimizer_type && (
                                    <span>
                                        Optimizer: <span className="text-white/60">{result.optimizer_type}</span>
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="p-4 flex flex-col gap-3">
                        <textarea
                            value={businessTask}
                            onChange={(e) => setBusinessTask(e.target.value)}
                            className="w-full h-28 bg-black/30 border border-white/5 rounded-xl px-4 py-3 text-sm text-white/90 placeholder:text-white/30 resize-none focus:outline-none focus:border-white/15"
                            placeholder="Example: Analyze legal contracts for potential risks and provide a risk assessment with explanations for each identified issue..."
                        />
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Button
                                    onClick={handleRun}
                                    disabled={isRunning || !businessTask.trim() || !datasetText.trim()}
                                    variant="primary"
                                    size="sm"
                                    className={`min-w-[160px] ${isRunning ? 'animate-pulse' : ''}`}
                                >
                                    {isRunning ? currentPhase : 'Run DSPy'}
                                </Button>
                                <div className="flex flex-col">
                                    {datasetCount > 0 && (
                                        <span className="text-[11px] text-white/40">{datasetCount} exam. loaded</span>
                                    )}
                                    {datasetCount > 0 && (
                                        <span className="text-[10px] text-white/30">
                                            Recommended for {QUALITY_PROFILES.find(p => p.value === qualityProfile)?.label || qualityProfile}:{' '}
                                            {qualityProfile === 'HIGH_QUALITY' ? '30+' : qualityProfile === 'FAST_CHEAP' ? '5+' : '10+'} examples
                                        </span>
                                    )}
                                </div>
                            </div>
                            <button
                                onClick={async () => {
                                    const allDatasets = await loadAllDatasets();
                                    setDatasets(allDatasets);
                                    setShowDatasetPicker(true);
                                }}
                                className="flex items-center gap-2 px-3 py-0.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-all"
                                title="Select dataset"
                            >
                                <svg className="w-4 h-4 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                                </svg>
                                <span className="text-[11px] text-white/50">Dataset</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* ReAct Steps */}
                <div className="flex-1 bg-[#0a0a0a] border border-white/10 rounded-2xl overflow-hidden flex flex-col">
                    <div className="px-5 py-3 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <h3 className="text-sm font-semibold text-white/80">ReAct Agent Steps</h3>
                            {isRunning && (
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
                                    Running
                                </span>
                            )}
                        </div>
                        <span className="text-[10px] text-white/30">{reactSteps.length} steps</span>
                    </div>
                    {error && (
                        <div className="mx-4 mt-3 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-[11px] text-red-300 flex items-start gap-2">
                            <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>DSPy failed: {error}</span>
                        </div>
                    )}
                    <div ref={stepsContainerRef} className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                        {reactSteps.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-white/30 text-sm">
                                <svg className="w-12 h-12 mb-3 text-amber-300/25" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                </svg>
                                <span>Agent will show reasoning steps here</span>
                            </div>
                        ) : (
                            reactSteps.map((step) => (
                                <div
                                    key={step.id}
                                    className={`border rounded-xl p-3 transition-all ${step.status === 'running' ? 'border-blue-500/30 bg-blue-500/5' :
                                        step.status === 'success' ? 'border-white/10 bg-white/[0.02]' :
                                            step.status === 'error' ? 'border-red-500/30 bg-red-500/5' :
                                                'border-white/5 bg-white/[0.01]'
                                        }`}
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="mt-0.5">{getStepIcon(step.status)}</div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between">
                                                <span className="text-[12px] font-medium text-white/80">{step.name}</span>
                                                <span className="text-[10px] font-mono text-white/30">{step.tool}</span>
                                            </div>
                                            {step.thought && (
                                                <div className="mt-1.5 text-[11px] text-white/50 italic">
                                                    💭 {step.thought}
                                                </div>
                                            )}
                                            {step.action && (
                                                <div className="mt-1 text-[10px] font-mono text-blue-400/70 bg-black/30 px-2 py-1 rounded">
                                                    → {step.action}
                                                </div>
                                            )}
                                            {step.observation && (
                                                <div className="mt-1 text-[10px] font-mono text-emerald-400/70">
                                                    ← {step.observation}
                                                </div>
                                            )}
                                            {step.error && (
                                                <div className="mt-1 text-[10px] text-red-400">
                                                    ✗ {step.error}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Right Column: Results */}
            <div className="w-[380px] bg-[#0a0a0a] border border-white/10 rounded-2xl flex flex-col shrink-0 overflow-hidden">
                <div className="px-5 py-4 border-b border-white/5 bg-white/[0.02]">
                    <div className="flex items-center justify-between">
                        <h2 className="text-sm font-semibold text-white/80">Orchestration Result</h2>
                        {result && (
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => {
                                        const exportData = {
                                            task: businessTask,
                                            target_model: targetLM,
                                            quality_profile: qualityProfile,
                                            optimizer_strategy: optimizerStrategy,
                                            result: result,
                                            exported_at: new Date().toISOString(),
                                        };
                                        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
                                        const url = URL.createObjectURL(blob);
                                        const a = document.createElement('a');
                                        a.href = url;
                                        a.download = `dspy-result-${result.artifact_version_id}.json`;
                                        a.click();
                                        URL.revokeObjectURL(url);
                                    }}
                                    className="text-[10px] px-2 py-1 rounded-md bg-white/5 hover:bg-white/10 text-white/50 hover:text-white/70 border border-white/10 transition-all"
                                    title="Export results as JSON"
                                >
                                    Export
                                </button>
                                <span className="text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                                    {(result.eval_results.metric_value * 100).toFixed(0)}%
                                </span>
                            </div>
                        )}
                    </div>
                    {result && (
                        <div className="flex gap-1 mt-3">
                            {(['overview', 'code', 'details', 'test', 'deploy'] as const).map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveResultTab(tab)}
                                    className={`px-3 py-1 text-[11px] rounded-md transition-all ${activeResultTab === tab
                                        ? 'bg-white/10 text-white'
                                        : 'text-white/40 hover:text-white/60'
                                        }`}
                                >
                                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                    {error ? (
                        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm flex items-start gap-2">
                            <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>{error}</span>
                        </div>
                    ) : !result ? (
                        <div className="flex flex-col items-center justify-center h-full text-white/30 text-center">
                            <svg className="w-16 h-16 mb-4 text-white/10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                            </svg>
                            <span className="text-sm">No results yet</span>
                            <span className="text-xs text-white/20 mt-1">Enter task and run DSPy</span>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {activeResultTab === 'overview' && (
                                <>
                                    {/* Metrics */}
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                                            <div className="text-[10px] text-white/40 uppercase tracking-wider">Metric</div>
                                            <div className="text-lg font-bold text-white/90 mt-1">
                                                {(result.eval_results.metric_value * 100).toFixed(1)}%
                                            </div>
                                            <div className="text-[10px] text-white/30">{result.eval_results.metric_name}</div>
                                        </div>
                                        <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                                            <div className="text-[10px] text-white/40 uppercase tracking-wider">Iterations</div>
                                            <div className="text-lg font-bold text-white/90 mt-1">{result.react_iterations}</div>
                                            <div className="text-[10px] text-white/30">ReAct steps</div>
                                        </div>
                                    </div>

                                    {/* Run Details */}
                                    <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                                        <div className="text-[10px] text-white/40 uppercase tracking-wider mb-2">Run Details</div>
                                        <div className="space-y-1.5 text-[11px] text-white/70">
                                            <div className="flex justify-between">
                                                <span className="text-white/50">Optimizer</span>
                                                <span className="text-white/80">
                                                    {result.optimizer_type || 'Auto (agent-chosen)'}
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-white/50">Profile</span>
                                                <span className="text-white/80">
                                                    {result.quality_profile
                                                        ? QUALITY_PROFILES.find(p => p.value === result.quality_profile)?.label || result.quality_profile
                                                        : QUALITY_PROFILES.find(p => p.value === qualityProfile)?.label || qualityProfile}
                                                </span>
                                            </div>
                                            {result.data_splits && (
                                                <div className="flex justify-between">
                                                    <span className="text-white/50">Train / Dev / Test</span>
                                                    <span className="text-white/80">
                                                        {result.data_splits.train} / {result.data_splits.dev} / {result.data_splits.test}
                                                    </span>
                                                </div>
                                            )}
                                            <div className="flex justify-between">
                                                <span className="text-white/50">Real DSPy</span>
                                                <span className="text-white/80">
                                                    {result.eval_results?.real_dspy ? 'Yes' : 'No'}
                                                </span>
                                            </div>
                                            {result.eval_results?.metric_history && result.eval_results.metric_history.length > 1 && (
                                                <div className="flex justify-between">
                                                    <span className="text-white/50">Metric history</span>
                                                    <span className="text-white/80 text-right">
                                                        {result.eval_results.metric_history
                                                            .slice(0, 4)
                                                            .map((m) => (m * 100).toFixed(0) + '%')
                                                            .join(' → ')}
                                                        {result.eval_results.metric_history.length > 4 && ' → …'}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Task Analysis */}
                                    <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                                        <div className="text-[10px] text-white/40 uppercase tracking-wider mb-2">Task Analysis</div>
                                        <div className="space-y-1.5">
                                            <div className="flex justify-between text-[11px]">
                                                <span className="text-white/50">Type</span>
                                                <span className="text-white/80">{result.task_analysis.task_type}</span>
                                            </div>
                                            <div className="flex justify-between text-[11px]">
                                                <span className="text-white/50">Domain</span>
                                                <span className="text-white/80">{result.task_analysis.domain}</span>
                                            </div>
                                            <div className="flex justify-between text-[11px]">
                                                <span className="text-white/50">Complexity</span>
                                                <span className="text-white/80">{result.task_analysis.complexity_level}</span>
                                            </div>
                                            <div className="flex justify-between text-[11px]">
                                                <span className="text-white/50">Chain of Thought</span>
                                                <span className="text-white/80">{result.task_analysis.needs_chain_of_thought ? 'Yes' : 'No'}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Artifact Info */}
                                    <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                                        <div className="text-[10px] text-white/40 uppercase tracking-wider mb-2">Artifact</div>
                                        <div className="text-[11px] font-mono text-white/60 bg-black/30 px-2 py-1.5 rounded">
                                            {result.artifact_version_id}
                                        </div>
                                        {result.total_cost_usd && (
                                            <div className="text-[10px] text-white/30 mt-2">
                                                Est. cost: ${result.total_cost_usd.toFixed(2)}
                                            </div>
                                        )}
                                    </div>

                                    {/* Save Button */}
                                    <Button
                                        onClick={handleSaveToLibrary}
                                        disabled={savedToLibrary}
                                        variant="secondary"
                                        size="sm"
                                        className={`min-w-[140px] ${savedToLibrary ? 'bg-emerald-500/10 border-emerald-500/30' : ''}`}
                                    >
                                        {savedToLibrary ? '✓ Saved to Library' : 'Save to Library'}
                                    </Button>
                                </>
                            )}

                            {activeResultTab === 'code' && (
                                <div className="space-y-3">
                                    <div className="text-[10px] text-white/40 uppercase tracking-wider">Generated DSPy Program</div>
                                    <pre className="text-[11px] font-mono text-white/70 bg-black/40 p-3 rounded-xl border border-white/5 overflow-x-auto whitespace-pre-wrap leading-relaxed">
                                        {result.program_code}
                                    </pre>
                                    <Button
                                        onClick={() => navigator.clipboard.writeText(result.program_code)}
                                        variant="secondary"
                                        size="sm"
                                        className="min-w-[140px]"
                                    >
                                        Copy Code
                                    </Button>
                                </div>
                            )}

                            {activeResultTab === 'details' && (
                                <div className="space-y-3">
                                    <div className="text-[10px] text-white/40 uppercase tracking-wider">Raw eval_results</div>
                                    <pre className="text-[11px] font-mono text-white/80 bg-black/40 p-3 rounded-xl border border-white/5 whitespace-pre overflow-auto max-h-[260px]">
                                        {JSON.stringify(result.eval_results, null, 2)}
                                    </pre>
                                    <div className="text-[10px] text-white/40 uppercase tracking-wider">Full Orchestrator Result</div>
                                    <pre className="text-[11px] font-mono text-white/70 bg-black/30 p-3 rounded-xl border border-white/5 whitespace-pre overflow-auto max-h-[260px]">
                                        {JSON.stringify(result, null, 2)}
                                    </pre>
                                </div>
                            )}

                            {activeResultTab === 'test' && (
                                <div className="space-y-3">
                                    <div className="text-[10px] text-white/40 uppercase tracking-wider">Test Your Model</div>
                                    <div className="space-y-2">
                                        <label className="text-[11px] text-white/50">Input ({result.task_analysis.input_roles?.[0] || 'text'})</label>
                                        <textarea
                                            value={testInput}
                                            onChange={(e) => setTestInput(e.target.value)}
                                            placeholder="Enter test input..."
                                            className="w-full h-20 bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-sm text-white/90 placeholder:text-white/30 resize-none focus:outline-none focus:border-white/20"
                                        />
                                    </div>
                                    <Button
                                        onClick={async () => {
                                            if (!testInput.trim()) return;
                                            setIsTesting(true);
                                            setTestOutput(null);
                                            try {
                                                const response = await api.testArtifact({
                                                    artifact_id: result.artifact_version_id,
                                                    input: testInput,
                                                    target_lm: targetLM,
                                                    program_code: result.program_code
                                                });
                                                setTestOutput(response.output);
                                            } catch (err: any) {
                                                setTestOutput(`Error: ${err.message}`);
                                            } finally {
                                                setIsTesting(false);
                                            }
                                        }}
                                        disabled={isTesting || !testInput.trim()}
                                        variant="primary"
                                        size="sm"
                                        className="min-w-[140px]"
                                    >
                                        {isTesting ? 'Running...' : 'Run Prediction'}
                                    </Button>
                                    {testOutput && (
                                        <div className="mt-3">
                                            <label className="text-[11px] text-white/50">Output ({result.task_analysis.output_roles?.[0] || 'result'})</label>
                                            <div className="mt-1 bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3">
                                                <pre className="text-sm text-emerald-300 whitespace-pre-wrap">{testOutput}</pre>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeResultTab === 'deploy' && result.deployment_package && (
                                <div className="space-y-3">
                                    <div className="text-[10px] text-white/40 uppercase tracking-wider">Download & Deploy</div>
                                    <Button
                                        onClick={() => {
                                            const blob = new Blob([result.program_code], { type: 'text/plain' });
                                            const url = URL.createObjectURL(blob);
                                            const a = document.createElement('a');
                                            a.href = url;
                                            a.download = `dspy_program_${result.artifact_version_id}.py`;
                                            a.click();
                                            URL.revokeObjectURL(url);
                                        }}
                                        variant="primary"
                                        size="sm"
                                        className="min-w-[140px]"
                                    >
                                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                        </svg>
                                        Download .py File
                                    </Button>
                                    <div className="text-[10px] text-white/40 uppercase tracking-wider mt-4">Instructions</div>
                                    <pre className="text-[11px] font-mono text-white/70 bg-black/40 p-3 rounded-xl border border-white/5 whitespace-pre-wrap leading-relaxed">
                                        {result.deployment_package.instructions}
                                    </pre>
                                    <div className="text-[10px] text-white/30">
                                        Artifact: {result.artifact_version_id}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Dataset Selector Modal */}
            {showDatasetPicker && (
                <DatasetSelector
                    datasets={datasets}
                    onSelect={(dataset) => {
                        handleDatasetSelect(dataset.id);
                        setShowDatasetPicker(false);
                    }}
                    onClose={() => setShowDatasetPicker(false)}
                />
            )}
        </div>
    );
}
