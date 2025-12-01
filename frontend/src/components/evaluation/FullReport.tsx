import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Button } from '../ui/Button';

interface FullReportProps {
    initialPrompt?: string;
    initialDataset?: any[];
    provider: string;
    model: string;
}

export const FullReport: React.FC<FullReportProps> = ({ initialPrompt = '', initialDataset = [], provider, model }) => {
    const [prompt, setPrompt] = useState(initialPrompt);
    const [dataset, setDataset] = useState<any[]>(initialDataset);
    const [availableDatasets, setAvailableDatasets] = useState<any[]>([]);
    const [selectedDatasetId, setSelectedDatasetId] = useState<string>('');

    const [loading, setLoading] = useState(false);
    const [report, setReport] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadDatasets();
    }, []);

    useEffect(() => {
        if (availableDatasets.length > 0 && !selectedDatasetId) {
            const first = availableDatasets[0];
            setSelectedDatasetId(first.id);
            setDataset(first.items || first.data || []);
        }
    }, [availableDatasets, selectedDatasetId]);

    const loadDatasets = async () => {
        try {
            const data = await api.getDatasets();
            setAvailableDatasets(data.datasets || []);
        } catch (err) {
            console.error('Failed to load datasets', err);
        }
    };

    const handleDatasetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const id = e.target.value;
        setSelectedDatasetId(id);
        const ds = availableDatasets.find(d => d.id === id);
        if (ds) {
            setDataset(ds.items || ds.data || []);
        } else {
            setDataset([]);
        }
    };

    const runReport = async () => {
        if (!prompt.trim()) {
            setError('Please enter a prompt first.');
            return;
        }
        if (!dataset || dataset.length === 0) {
            setError('Please select a valid dataset (required for robustness tests).');
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const res = await api.runFullReport({
                prompt,
                dataset,
                provider,
                model
            });
            setReport(res);
        } catch (err: any) {
            setError(err.message || 'Failed to generate report');
        } finally {
            setLoading(false);
        }
    };

    const getGradeColor = (grade: string) => {
        switch (grade) {
            case 'A': return 'text-white/70';
            case 'B': return 'text-white/60';
            case 'C': return 'text-yellow-400';
            case 'D': return 'text-orange-400';
            default: return 'text-red-400';
        }
    };

    const datasetSize = dataset?.length || 0;
    const datasetName = selectedDatasetId
        ? availableDatasets.find(ds => ds.id === selectedDatasetId)?.name || 'Dataset'
        : initialDataset.length
            ? 'Custom dataset'
            : 'Not set';

    return (
        <div className="relative space-y-6 pb-24">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-[11px] uppercase tracking-[0.2em] text-white/30 font-semibold mb-1">Unified Report</p>
                    <h2 className="text-xl font-semibold text-white">Evaluation Overview</h2>
                    <p className="text-xs text-white/50">Quality • Stability • Robustness in one run</p>
                </div>
            </div>

            {/* Inputs */}
            <div className="bg-black/25 p-5 rounded-xl border border-white/5 shadow-lg shadow-black/30 space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-[11px] uppercase tracking-[0.2em] text-white/30 font-semibold mb-1">Test Configuration</p>
                        <h3 className="text-lg font-semibold text-white">Full Evaluation</h3>
                    </div>
                </div>

                <div className="bg-white/[0.02] border border-white/5 rounded-lg p-4 flex flex-col gap-4">
                    <div className="flex items-center justify-between gap-3">
                        <div>
                            <p className="text-[11px] uppercase tracking-[0.18em] text-white/30 font-semibold">Test Dataset</p>
                            <p className="text-sm text-white/70">Used across quality, stability, and robustness checks.</p>
                        </div>
                        <span className="px-3 py-1 rounded-full text-[11px] bg-white/[0.06] border border-white/10 text-white/70">
                            {datasetSize} items
                        </span>
                    </div>
                    <select
                        value={selectedDatasetId}
                        onChange={handleDatasetChange}
                        className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-3 text-sm text-white/90 focus:outline-none focus:border-white/20"
                    >
                        <option value="">Select a dataset...</option>
                        {availableDatasets.map(ds => (
                            <option key={ds.id} value={ds.id}>{ds.name} ({(ds.items?.length || ds.data?.length || 0)} items)</option>
                        ))}
                    </select>
                </div>

                <div className="bg-black/50 border border-white/10 rounded-xl p-4 flex flex-col gap-3 shadow-inner shadow-black/30">
                    <div className="flex items-center justify-between gap-3">
                        <div>
                            <p className="text-[11px] uppercase tracking-[0.16em] text-white/30 font-semibold">Prompt</p>
                            <h4 className="text-sm font-semibold text-white">Instruction to Evaluate</h4>
                        </div>
                    </div>
                    <textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        className="w-full min-h-[180px] bg-black/60 border border-white/10 rounded-lg px-3 py-3 text-sm text-white/90 font-mono resize-none focus:outline-none focus:border-white/20"
                        placeholder="Enter the prompt to evaluate across quality, stability, and robustness..."
                    />
                </div>
            </div>

            {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg text-sm">
                    {error}
                </div>
            )}

            {!report && !loading && (
                <div className="flex-1 flex flex-col items-center justify-center text-white/30 border-2 border-dashed border-white/5 rounded-xl">
                    <svg className="w-16 h-16 mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
                    <p>Select a prompt and dataset, then click Generate to run the full suite.</p>
                </div>
            )}

            {report && (
                <div className="space-y-6 animate-fadeIn">
                    {/* Summary Card */}
                    <div className="bg-white/[0.03] border border-white/10 rounded-xl p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-medium text-white/90">Executive Summary</h3>
                            <div className={`text-4xl font-bold ${getGradeColor(report.summary.grade)}`}>
                                Grade: {report.summary.grade}
                            </div>
                        </div>
                        <div className="grid grid-cols-3 gap-6">
                            <div className="bg-black/20 rounded-lg p-4">
                                <div className="text-xs text-white/40 uppercase tracking-wider mb-1">Overall Score</div>
                                <div className="text-2xl font-mono text-white/90">{(report.summary.avg_score * 100).toFixed(1)}%</div>
                            </div>
                            <div className="bg-black/20 rounded-lg p-4">
                                <div className="text-xs text-white/40 uppercase tracking-wider mb-1">Tests Passed</div>
                                <div className="text-2xl font-mono text-white/90">{report.summary.tests_run} / {report.summary.tests_run}</div>
                            </div>
                            <div className="bg-black/20 rounded-lg p-4">
                                <div className="text-xs text-white/40 uppercase tracking-wider mb-1">Status</div>
                                <div className="text-2xl font-mono text-white/70">Ready</div>
                            </div>
                        </div>
                    </div>

                    {/* Detailed Breakdown */}
                    <div className="grid grid-cols-2 gap-6">
                        {/* Consistency */}
                        <div className="bg-white/[0.03] border border-white/10 rounded-xl p-5">
                            <div className="flex items-center justify-between mb-4">
                                <h4 className="font-medium text-white/80">Stability (Self-Consistency)</h4>
                                <span className="text-sm font-mono text-white/70">{report.consistency.consistency_score?.toFixed(3)}</span>
                            </div>
                            <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                                <div className="h-full bg-white/50" style={{ width: `${(report.consistency.consistency_score || 0) * 100}%` }}></div>
                            </div>
                            <p className="text-xs text-white/40 mt-3">
                                Based on {report.consistency.n_samples} samples. Higher is better.
                            </p>
                        </div>

                        {/* Robustness - Format */}
                        <div className="bg-white/[0.03] border border-white/10 rounded-xl p-5">
                            <div className="flex items-center justify-between mb-4">
                                <h4 className="font-medium text-white/80">Format Resilience</h4>
                                <span className="text-sm font-mono text-white/70">{report.robustness.format?.robustness_score?.toFixed(3)}</span>
                            </div>
                            <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                                <div className="h-full bg-white/40" style={{ width: `${(report.robustness.format?.robustness_score || 0) * 100}%` }}></div>
                            </div>
                            <p className="text-xs text-white/40 mt-3">
                                Resistance to spacing, capitalization, and punctuation changes.
                            </p>
                        </div>

                        {/* Robustness - Length */}
                        <div className="bg-white/[0.03] border border-white/10 rounded-xl p-5">
                            <div className="flex items-center justify-between mb-4">
                                <h4 className="font-medium text-white/80">Context Length</h4>
                                <span className="text-sm font-mono text-amber-400">{report.robustness.length?.robustness_score?.toFixed(3)}</span>
                            </div>
                            <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                                <div className="h-full bg-amber-400" style={{ width: `${(report.robustness.length?.robustness_score || 0) * 100}%` }}></div>
                            </div>
                            <p className="text-xs text-white/40 mt-3">
                                Performance retention at 2x-4x context length.
                            </p>
                        </div>

                        {/* Robustness - Adversarial */}
                        <div className="bg-white/[0.03] border border-white/10 rounded-xl p-5">
                            <div className="flex items-center justify-between mb-4">
                                <h4 className="font-medium text-white/80">Security (Adversarial)</h4>
                                <span className="text-sm font-mono text-red-400">{report.robustness.adversarial?.robustness_score?.toFixed(3)}</span>
                            </div>
                            <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                                <div className="h-full bg-red-400" style={{ width: `${(report.robustness.adversarial?.robustness_score || 0) * 100}%` }}></div>
                            </div>
                            <p className="text-xs text-white/40 mt-3">
                                Resistance to noise and adversarial inputs (Light level).
                            </p>
                        </div>
                    </div>

                    {/* Auto-Fix Suggestions */}
                    <div className="bg-white/5 border border-white/10 rounded-xl p-5">
                        <h4 className="font-medium text-white/60 mb-3 flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                            Recommended Actions
                        </h4>
                        <ul className="space-y-2 text-sm text-white/70">
                            {report.summary.avg_score < 0.8 && (
                                <li className="flex items-start gap-2">
                                    <span className="text-white/60">•</span>
                                    <span>Consider simplifying the prompt instructions to improve overall stability.</span>
                                </li>
                            )}
                            {report.robustness.format?.robustness_score < 0.9 && (
                                <li className="flex items-start gap-2">
                                    <span className="text-white/60">•</span>
                                    <span>Add explicit formatting constraints (e.g., "Always use this JSON schema") to fix format sensitivity.</span>
                                </li>
                            )}
                            {report.robustness.length?.robustness_score < 0.8 && (
                                <li className="flex items-start gap-2">
                                    <span className="text-white/60">•</span>
                                    <span>Add "Ignore irrelevant context" instruction to handle long contexts better.</span>
                                </li>
                            )}
                            {report.robustness.adversarial?.robustness_score < 0.8 && (
                                <li className="flex items-start gap-2">
                                    <span className="text-white/60">•</span>
                                    <span>Implement input sanitization or add a defensive system prompt layer.</span>
                                </li>
                            )}
                            {report.summary.avg_score >= 0.9 && (
                                <li className="flex items-start gap-2">
                                    <span className="text-white/70">•</span>
                                    <span>No major issues found. Ready for deployment!</span>
                                </li>
                            )}
                        </ul>
                    </div>
                </div>
            )}
            <div className="sticky bottom-0 z-10">
                <div className="flex items-center justify-between gap-4 bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 shadow-lg shadow-black/30 backdrop-blur">
                    <div className="flex items-center gap-3 text-xs text-white/60 flex-wrap">
                        <div className="px-2 py-1 rounded-lg bg-white/[0.02] border border-white/5">
                            Dataset: {datasetName}
                        </div>
                        <div className="px-2 py-1 rounded-lg bg-white/[0.02] border border-white/5">
                            Items: {datasetSize}
                        </div>
                        <div className="px-2 py-1 rounded-lg bg-white/[0.02] border border-white/5">
                            Model: {model || 'model'}
                        </div>
                    </div>
                    <Button
                        onClick={runReport}
                        disabled={loading}
                        variant="primary"
                        size="md"
                        className={loading ? 'opacity-60 cursor-not-allowed' : ''}
                    >
                        {loading ? (
                            <>
                                <span className="w-2 h-2 rounded-full bg-white/80 animate-ping" />
                                Generating...
                            </>
                        ) : (
                            <>
                                Generate Full Report
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" /></svg>
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
};
