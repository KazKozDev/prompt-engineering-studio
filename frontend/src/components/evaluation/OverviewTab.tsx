import { Button } from '../ui/Button';

interface OverviewTabProps {
    settings: {
        provider: string;
        model: string;
        apiKey?: string;
    };
    // These would come from a shared state/context in a real implementation
    qualityResults?: any;
    consistencyResults?: any;
    robustnessResults?: any;
}

export function OverviewTab({ qualityResults, consistencyResults, robustnessResults }: OverviewTabProps) {

    // Aggregate metrics from all tabs
    const hasAnyResults = qualityResults || consistencyResults || robustnessResults;

    const getQualityScore = (): number | null => {
        if (!qualityResults) return null;
        if (qualityResults.mode === 'judge') {
            return qualityResults.score ?? null;
        }
        // Reference-based: average of BLEU, ROUGE, EM
        const bleu = qualityResults.metrics?.bleu ?? qualityResults.summary?.bleu ?? 0;
        const rouge = qualityResults.metrics?.rouge_l ?? qualityResults.summary?.rouge_l ?? 0;
        const em = qualityResults.metrics?.exact_match ?? qualityResults.summary?.exact_match ?? 0;
        return (bleu + rouge + em) / 3;
    };

    const getConsistencyScore = (): number | null => {
        if (!consistencyResults) return null;
        if (consistencyResults.mode === 'self') {
            return consistencyResults.consistency_score ?? consistencyResults.score ?? null;
        }
        return consistencyResults.glape_score ?? consistencyResults.agreement_score ?? null;
    };

    const getRobustnessScore = (): number | null => {
        if (!robustnessResults) return null;
        return robustnessResults.robustness_score ?? null;
    };

    const qualityScore = getQualityScore();
    const consistencyScore = getConsistencyScore();
    const robustnessScore = getRobustnessScore();

    // Calculate overall score (weighted average)
    const calculateOverallScore = (): number | null => {
        const scores: number[] = [];
        if (qualityScore !== null) scores.push(qualityScore);
        if (consistencyScore !== null) scores.push(consistencyScore);
        if (robustnessScore !== null) scores.push(robustnessScore);
        
        if (scores.length === 0) return null;
        return scores.reduce((a, b) => a + b, 0) / scores.length;
    };

    const overallScore = calculateOverallScore();

    const getStatusColor = (score: number | null): string => {
        if (score === null) return 'text-white/30';
        if (score >= 0.8) return 'text-green-400';
        if (score >= 0.5) return 'text-yellow-400';
        return 'text-red-400';
    };

    const getStatusBg = (score: number | null): string => {
        if (score === null) return 'bg-white/5';
        if (score >= 0.8) return 'bg-green-500/10 border-green-500/20';
        if (score >= 0.5) return 'bg-yellow-500/10 border-yellow-500/20';
        return 'bg-red-500/10 border-red-500/20';
    };

    const getGrade = (score: number | null): string => {
        if (score === null) return '—';
        if (score >= 0.9) return 'A+';
        if (score >= 0.8) return 'A';
        if (score >= 0.7) return 'B';
        if (score >= 0.6) return 'C';
        if (score >= 0.5) return 'D';
        return 'F';
    };

    return (
        <div className="space-y-6">
            {/* Overall Score Card */}
            <div className={`rounded-xl p-6 border ${getStatusBg(overallScore)}`}>
                <div className="flex items-center justify-between">
                    <div>
                        <div className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-2">Overall Prompt Score</div>
                        <div className="flex items-baseline gap-3">
                            <span className={`text-5xl font-bold ${getStatusColor(overallScore)}`}>
                                {overallScore !== null ? (overallScore * 100).toFixed(0) : '—'}
                            </span>
                            {overallScore !== null && (
                                <span className="text-2xl text-white/50">/100</span>
                            )}
                        </div>
                        {overallScore !== null && (
                            <div className="mt-2 text-sm text-white/50">
                                Grade: <span className={`font-bold ${getStatusColor(overallScore)}`}>{getGrade(overallScore)}</span>
                            </div>
                        )}
                    </div>
                    <div className={`w-24 h-24 rounded-full border-4 flex items-center justify-center ${
                        overallScore === null ? 'border-white/10' :
                        overallScore >= 0.8 ? 'border-green-500' :
                        overallScore >= 0.5 ? 'border-yellow-500' : 'border-red-500'
                    }`}>
                        <span className={`text-3xl font-bold ${getStatusColor(overallScore)}`}>
                            {getGrade(overallScore)}
                        </span>
                    </div>
                </div>

                {!hasAnyResults && (
                    <div className="mt-4 text-sm text-white/40">
                        Run evaluations in Quality, Consistency, and Robustness tabs to see aggregated results.
                    </div>
                )}
            </div>

            {/* Axis Breakdown */}
            <div className="grid grid-cols-3 gap-4">
                {/* Quality */}
                <div className={`rounded-xl p-4 border ${getStatusBg(qualityScore)}`}>
                    <div className="flex items-center gap-2 mb-3">
                        <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        <span className="text-[10px] font-bold text-white/50 uppercase tracking-widest">Quality</span>
                    </div>
                    <div className={`text-2xl font-bold ${getStatusColor(qualityScore)}`}>
                        {qualityScore !== null ? `${(qualityScore * 100).toFixed(0)}%` : '—'}
                    </div>
                    <div className="text-[10px] text-white/40 mt-1">
                        {qualityResults?.mode === 'judge' ? 'LLM-as-Judge' : 
                         qualityResults?.mode === 'reference' ? 'Reference-Based' : 'Not evaluated'}
                    </div>
                </div>

                {/* Consistency */}
                <div className={`rounded-xl p-4 border ${getStatusBg(consistencyScore)}`}>
                    <div className="flex items-center gap-2 mb-3">
                        <svg className="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        <span className="text-[10px] font-bold text-white/50 uppercase tracking-widest">Consistency</span>
                    </div>
                    <div className={`text-2xl font-bold ${getStatusColor(consistencyScore)}`}>
                        {consistencyScore !== null ? `${(consistencyScore * 100).toFixed(0)}%` : '—'}
                    </div>
                    <div className="text-[10px] text-white/40 mt-1">
                        {consistencyResults?.mode === 'self' ? 'Self-Consistency' : 
                         consistencyResults?.mode === 'mutual' ? 'Mutual (GLaPE)' : 'Not evaluated'}
                    </div>
                </div>

                {/* Robustness */}
                <div className={`rounded-xl p-4 border ${getStatusBg(robustnessScore)}`}>
                    <div className="flex items-center gap-2 mb-3">
                        <svg className="w-4 h-4 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                        <span className="text-[10px] font-bold text-white/50 uppercase tracking-widest">Robustness</span>
                    </div>
                    <div className={`text-2xl font-bold ${getStatusColor(robustnessScore)}`}>
                        {robustnessScore !== null ? `${(robustnessScore * 100).toFixed(0)}%` : '—'}
                    </div>
                    <div className="text-[10px] text-white/40 mt-1">
                        {robustnessResults ? 'Tested' : 'Not evaluated'}
                    </div>
                </div>
            </div>

            {/* Recommendations */}
            {hasAnyResults && (
                <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-4">
                        <svg className="w-4 h-4 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                        <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Recommendations</span>
                    </div>
                    <div className="space-y-2">
                        {qualityScore !== null && qualityScore < 0.7 && (
                            <div className="flex items-start gap-2 text-xs text-white/60">
                                <span className="text-yellow-400">⚠</span>
                                <span>Quality score is below 70%. Consider refining your prompt instructions or adding more context.</span>
                            </div>
                        )}
                        {consistencyScore !== null && consistencyScore < 0.8 && (
                            <div className="flex items-start gap-2 text-xs text-white/60">
                                <span className="text-yellow-400">⚠</span>
                                <span>Consistency is below 80%. Your prompt may be ambiguous. Try making instructions more explicit.</span>
                            </div>
                        )}
                        {robustnessScore !== null && robustnessScore < 0.7 && (
                            <div className="flex items-start gap-2 text-xs text-white/60">
                                <span className="text-yellow-400">⚠</span>
                                <span>Robustness is below 70%. Your prompt is sensitive to input variations. Add defensive instructions.</span>
                            </div>
                        )}
                        {overallScore !== null && overallScore >= 0.8 && (
                            <div className="flex items-start gap-2 text-xs text-white/60">
                                <span className="text-green-400">✓</span>
                                <span>Your prompt is performing well across all evaluated dimensions. Ready for production use.</span>
                            </div>
                        )}
                        {!qualityScore && !consistencyScore && !robustnessScore && (
                            <div className="text-xs text-white/40">
                                Run evaluations to get personalized recommendations.
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Quick Actions */}
            <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-4">
                    <svg className="w-4 h-4 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Quick Actions</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <Button variant="outline" size="sm" className="justify-start">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Export Report
                    </Button>
                    <Button variant="outline" size="sm" className="justify-start">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                        </svg>
                        Save to Library
                    </Button>
                    <Button variant="outline" size="sm" className="justify-start">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        Compare Versions
                    </Button>
                    <Button variant="outline" size="sm" className="justify-start">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Re-run All Tests
                    </Button>
                </div>
            </div>

            {/* Methodology Reference */}
            <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                    <svg className="w-4 h-4 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                    <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Methodology</span>
                </div>
                <div className="grid grid-cols-3 gap-3 text-[10px]">
                    <a href="https://arxiv.org/abs/2303.16634" target="_blank" rel="noopener noreferrer" className="text-white/40 hover:text-white/70 underline">
                        G-Eval (Liu et al., 2023)
                    </a>
                    <a href="https://arxiv.org/abs/2203.11171" target="_blank" rel="noopener noreferrer" className="text-white/40 hover:text-white/70 underline">
                        Self-Consistency (Wang et al., 2022)
                    </a>
                    <a href="https://arxiv.org/abs/2306.04528" target="_blank" rel="noopener noreferrer" className="text-white/40 hover:text-white/70 underline">
                        PromptRobust (Zhu et al., 2023)
                    </a>
                </div>
            </div>
        </div>
    );
}
