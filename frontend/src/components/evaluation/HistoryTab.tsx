import { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Button } from '../ui/Button';

interface HistoryTabProps {
    settings: {
        provider: string;
        model: string;
    };
}

interface EvaluationRun {
    run_id: string;
    timestamp: string;
    prompt_id: string;
    prompt_text: string;
    dataset_id: string;
    dataset_name: string;
    metrics: Record<string, number>;
    metadata?: Record<string, any>;
}

export function HistoryTab({ settings }: HistoryTabProps) {
    const [history, setHistory] = useState<EvaluationRun[]>([]);
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [selectedPrompt, setSelectedPrompt] = useState<string | null>(null);
    const [trendData, setTrendData] = useState<any>(null);

    useEffect(() => {
        loadHistory();
        loadStats();
    }, []);

    const loadHistory = async () => {
        setLoading(true);
        try {
            // For now, just load stats since we don't have a "get all" endpoint
            // In production, you'd call api.getEvaluationHistory()
            const statsData = await api.getEvaluationHistoryStats();
            setStats(statsData);
        } catch (error) {
            console.error('Failed to load history:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadStats = async () => {
        try {
            const statsData = await api.getEvaluationHistoryStats();
            setStats(statsData);
        } catch (error) {
            console.error('Failed to load stats:', error);
        }
    };

    const loadTrendForPrompt = async (promptId: string, metricName: string) => {
        try {
            const trend = await api.getMetricTrend(promptId, metricName, 20);
            setTrendData(trend);
        } catch (error) {
            console.error('Failed to load trend:', error);
        }
    };

    const checkRegression = async (promptId: string, metricName: string) => {
        try {
            const result = await api.checkMetricRegression({
                prompt_id: promptId,
                metric_name: metricName,
                threshold: 0.05,
                window: 5,
            });

            if (result.regression_detected) {
                alert(
                    `⚠️ Regression Detected!\n\n` +
                    `Metric: ${result.metric}\n` +
                    `Recent Average: ${(result.recent_average * 100).toFixed(1)}%\n` +
                    `Baseline Average: ${(result.baseline_average * 100).toFixed(1)}%\n` +
                    `Drop: ${(result.drop_percentage * 100).toFixed(1)}%\n` +
                    `Severity: ${result.severity}`
                );
            } else {
                alert('✅ No regression detected. Metrics are stable or improving!');
            }
        } catch (error) {
            console.error('Failed to check regression:', error);
            alert('Failed to check regression. See console for details.');
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-semibold text-white/90">Evaluation History</h3>
                        <p className="text-xs text-white/50 mt-1">
                            Track all evaluation runs, detect regressions, and analyze trends
                        </p>
                    </div>
                    <Button
                        onClick={loadHistory}
                        variant="secondary"
                        size="sm"
                        disabled={loading}
                    >
                        {loading ? 'Loading...' : 'Refresh'}
                    </Button>
                </div>
            </div>

            {/* Stats Overview */}
            {stats && (
                <div className="grid grid-cols-4 gap-4">
                    <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4">
                        <div className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-2">
                            Total Runs
                        </div>
                        <div className="text-2xl font-bold text-white/80">
                            {stats.total_runs || 0}
                        </div>
                    </div>

                    <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4">
                        <div className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-2">
                            Unique Prompts
                        </div>
                        <div className="text-2xl font-bold text-white/80">
                            {stats.unique_prompts || 0}
                        </div>
                    </div>

                    <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4">
                        <div className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-2">
                            Unique Datasets
                        </div>
                        <div className="text-2xl font-bold text-white/80">
                            {stats.unique_datasets || 0}
                        </div>
                    </div>

                    <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4">
                        <div className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-2">
                            Cache Hit Rate
                        </div>
                        <div className="text-2xl font-bold text-emerald-400">
                            —
                        </div>
                        <div className="text-[9px] text-white/40 mt-1">Coming soon</div>
                    </div>
                </div>
            )}

            {/* Features Grid */}
            <div className="grid grid-cols-2 gap-4">
                {/* Regression Detection */}
                <div className="bg-white/[0.02] border border-white/5 rounded-xl p-5">
                    <div className="flex items-center gap-2 mb-4">
                        <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <h4 className="text-sm font-semibold text-white/80">Regression Detection</h4>
                    </div>
                    <p className="text-xs text-white/50 mb-4">
                        Automatically detect when metrics drop below baseline performance
                    </p>
                    <div className="space-y-2">
                        <input
                            type="text"
                            placeholder="Prompt ID (e.g., prompt_v1)"
                            className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-xs text-white/90 placeholder-white/30"
                            onChange={(e) => setSelectedPrompt(e.target.value)}
                        />
                        <Button
                            onClick={() => selectedPrompt && checkRegression(selectedPrompt, 'accuracy')}
                            variant="primary"
                            size="sm"
                            fullWidth
                            disabled={!selectedPrompt}
                        >
                            Check for Regressions
                        </Button>
                    </div>
                </div>

                {/* Trend Analysis */}
                <div className="bg-white/[0.02] border border-white/5 rounded-xl p-5">
                    <div className="flex items-center gap-2 mb-4">
                        <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                        </svg>
                        <h4 className="text-sm font-semibold text-white/80">Trend Analysis</h4>
                    </div>
                    <p className="text-xs text-white/50 mb-4">
                        Visualize metric changes over time and identify patterns
                    </p>
                    {trendData ? (
                        <div className="space-y-2 text-xs">
                            <div className="flex justify-between">
                                <span className="text-white/50">Data Points:</span>
                                <span className="text-white/80">{trendData.data_points}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-white/50">Average:</span>
                                <span className="text-white/80">{(trendData.average * 100).toFixed(1)}%</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-white/50">Trend:</span>
                                <span className={`font-medium ${trendData.trend === 'improving' ? 'text-green-400' :
                                        trendData.trend === 'declining' ? 'text-red-400' :
                                            'text-white/60'
                                    }`}>
                                    {trendData.trend === 'improving' ? '↗ Improving' :
                                        trendData.trend === 'declining' ? '↘ Declining' :
                                            '→ Stable'}
                                </span>
                            </div>
                        </div>
                    ) : (
                        <div className="text-xs text-white/40">
                            Enter a prompt ID above and check regressions to see trend data
                        </div>
                    )}
                </div>
            </div>

            {/* How to Use */}
            <div className="bg-gradient-to-br from-blue-900/20 to-purple-900/20 border border-blue-500/20 rounded-xl p-5">
                <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                        <h4 className="text-sm font-semibold text-white/90 mb-2">How Evaluation History Works</h4>
                        <div className="space-y-2 text-xs text-white/60">
                            <p>
                                <strong className="text-white/80">1. Automatic Tracking:</strong> Every evaluation you run is automatically saved with full metrics and metadata.
                            </p>
                            <p>
                                <strong className="text-white/80">2. Regression Detection:</strong> Compare recent runs against baseline to catch performance drops early.
                            </p>
                            <p>
                                <strong className="text-white/80">3. Trend Analysis:</strong> Visualize how your prompts improve (or degrade) over time.
                            </p>
                            <p className="text-[11px] text-white/40 mt-3">
                                💡 Tip: Run evaluations regularly to build a comprehensive history and enable accurate trend detection.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Empty State */}
            {stats && stats.total_runs === 0 && (
                <div className="bg-white/[0.02] border border-white/5 rounded-xl p-8 text-center">
                    <svg className="w-12 h-12 text-white/20 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <h3 className="text-lg font-semibold text-white/70 mb-2">No Evaluation History Yet</h3>
                    <p className="text-sm text-white/40 mb-4">
                        Run evaluations in the Quality tab to start building your history
                    </p>
                    <p className="text-xs text-white/30">
                        History tracking is automatic — just run evaluations as usual!
                    </p>
                </div>
            )}
        </div>
    );
}
