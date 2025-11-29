import { useState, useEffect } from 'react';
import { api } from '../services/api';

export function ProductionMetrics() {
    const [timeRange, setTimeRange] = useState('7d');
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadData();
    }, [timeRange]);

    const loadData = async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await api.getTelemetryDashboard(timeRange);
            setData(result);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (loading && !data) {
        return <div className="p-6 text-slate-400">Loading metrics...</div>;
    }

    if (error) {
        return <div className="p-6 text-red-400">Error loading metrics: {error}</div>;
    }

    if (!data) return null;

    return (
        <div className="p-6 h-full overflow-y-auto">
            <div className="mb-6">
                <div className="flex justify-between items-center mb-4">
                    <div>
                        <h2 className="text-3xl font-bold text-slate-100 mb-2">Production Telemetry</h2>
                        <p className="text-base text-slate-300">
                            Monitor real-world business metrics and user satisfaction signals.
                        </p>
                    </div>
                    <div className="flex bg-gray-800 rounded-lg p-1 border border-gray-700">
                        {['24h', '7d', '30d'].map((range) => (
                            <button
                                key={range}
                                onClick={() => setTimeRange(range)}
                                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${timeRange === range
                                    ? 'bg-gray-700 text-white shadow-sm'
                                    : 'text-slate-400 hover:text-slate-200'
                                    }`}
                            >
                                {range}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Explanation Panel */}
                <div className="bg-gray-800/30 border border-gray-700/50 rounded-lg p-5 space-y-4">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 0 00-2-2H5a2 0 00-2 2v6a2 0 002 2h2a2 0 002-2zm0 0V9a2 0 012-2h2a2 0 012 2v10m-6 0a2 0 002 2h2a2 0 002-2m0 0V5a2 0 012-2h2a2 0 012 2v14a2 0 01-2 2h-2a2 0 01-2-2z" />
                            </svg>
                            <h3 className="text-base font-semibold text-slate-300">What is this?</h3>
                        </div>
                        <p className="text-sm text-slate-300 leading-relaxed">
                            This dashboard displays business metrics for your prompts in production.
                            It shows how users interact with your AI and their satisfaction with the results.
                        </p>
                    </div>

                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                            </svg>
                            <h3 className="text-base font-semibold text-slate-300">Metrics</h3>
                        </div>
                        <ul className="text-sm text-slate-300 space-y-2 ml-4">
                            <li className="leading-relaxed">
                                <strong className="text-slate-200">Accept Rate</strong> - Percentage of responses users accepted without modification. Higher is better.
                            </li>
                            <li className="leading-relaxed">
                                <strong className="text-slate-200">Avg TTR (Time to Resolution)</strong> - Average time to solve a task in seconds. Lower is better.
                            </li>
                            <li className="leading-relaxed">
                                <strong className="text-slate-200">Total Requests</strong> - Total number of requests processed by your prompt.
                            </li>
                            <li className="leading-relaxed">
                                <strong className="text-slate-200">Active Prompts</strong> - Number of prompt versions currently deployed.
                            </li>
                        </ul>
                    </div>

                    <div className="bg-gray-700/20 rounded-lg p-3 border border-gray-600/30">
                        <div className="flex items-start gap-2">
                            <svg className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <div className="text-sm text-slate-300">
                                <strong>Note:</strong> Currently showing demo data for illustration.
                                In production, this would connect to your analytics system. See{' '}
                                <a href="https://arxiv.org/abs/2310.05746" target="_blank" rel="noopener noreferrer"
                                    className="text-slate-400 hover:text-slate-200 underline">
                                    "Monitoring LLMs in Production" (arXiv:2310.05746)
                                </a>
                                {' '}for best practices.
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-4 gap-4 mb-8">
                <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
                    <div className="text-xs text-slate-400 mb-1">Avg Accept Rate</div>
                    <div className="text-2xl font-bold text-green-400">{(data.summary.avg_accept_rate * 100).toFixed(1)}%</div>
                    <div className="text-xs text-green-500/80 mt-1">↑ 2.1% vs prev</div>
                </div>
                <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
                    <div className="text-xs text-slate-400 mb-1">Avg TTR</div>
                    <div className="text-2xl font-bold text-blue-400">{data.summary.avg_ttr.toFixed(1)}s</div>
                    <div className="text-xs text-blue-500/80 mt-1">↓ 1.5s vs prev</div>
                </div>
                <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
                    <div className="text-xs text-slate-400 mb-1">Total Requests</div>
                    <div className="text-2xl font-bold text-slate-200">{data.summary.total_requests.toLocaleString()}</div>
                </div>
                <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
                    <div className="text-xs text-slate-400 mb-1">Active Prompts</div>
                    <div className="text-2xl font-bold text-purple-400">{data.summary.active_prompts}</div>
                </div>
            </div>

            {/* Alerts */}
            {data.alerts && data.alerts.length > 0 && (
                <div className="mb-8">
                    <h3 className="text-sm font-semibold text-slate-200 mb-3">Active Alerts</h3>
                    <div className="space-y-2">
                        {data.alerts.map((alert: any, idx: number) => (
                            <div key={idx} className="flex items-start gap-3 p-3 bg-yellow-900/20 border border-yellow-800/50 rounded-lg">
                                <span className="text-yellow-500 text-lg">⚠️</span>
                                <div>
                                    <div className="text-sm font-medium text-yellow-200">{alert.message}</div>
                                    <div className="text-xs text-yellow-500/70">{new Date(alert.timestamp).toLocaleString()}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Charts (Simplified visualization using CSS bars for now) */}
            <div className="grid grid-cols-2 gap-6">
                <div className="bg-gray-800/30 p-4 rounded-lg border border-gray-700">
                    <h3 className="text-sm font-semibold text-slate-200 mb-4">Accept Rate Trend</h3>
                    <div className="h-48 flex items-end gap-1">
                        {data.charts.accept_rate.v1.map((val: number, idx: number) => (
                            <div key={idx} className="flex-1 bg-blue-500/50 hover:bg-blue-500/80 transition-colors rounded-t"
                                style={{ height: `${val * 100}%` }}
                                title={`V1: ${(val * 100).toFixed(1)}%`}></div>
                        ))}
                    </div>
                    <div className="flex justify-between mt-2 text-xs text-slate-500">
                        <span>{data.charts.dates[0]}</span>
                        <span>{data.charts.dates[data.charts.dates.length - 1]}</span>
                    </div>
                </div>

                <div className="bg-gray-800/30 p-4 rounded-lg border border-gray-700">
                    <h3 className="text-sm font-semibold text-slate-200 mb-4">Time to Resolution (sec)</h3>
                    <div className="h-48 flex items-end gap-1">
                        {data.charts.time_to_resolution.v1.map((val: number, idx: number) => (
                            <div key={idx} className="flex-1 bg-purple-500/50 hover:bg-purple-500/80 transition-colors rounded-t"
                                style={{ height: `${Math.min(val, 100)}%` }}
                                title={`V1: ${val.toFixed(1)}s`}></div>
                        ))}
                    </div>
                    <div className="flex justify-between mt-2 text-xs text-slate-500">
                        <span>{data.charts.dates[0]}</span>
                        <span>{data.charts.dates[data.charts.dates.length - 1]}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
