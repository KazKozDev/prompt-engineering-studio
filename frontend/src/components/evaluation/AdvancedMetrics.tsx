import { useState, useEffect } from 'react';

interface AdvancedMetricsStatus {
    advanced_metrics_available: boolean;
    features: {
        bertscore: boolean;
        perplexity: boolean;
        semantic_similarity: boolean;
        evaluation_history: boolean;
        response_cache: boolean;
    };
}

export function useAdvancedMetrics() {
    const [status, setStatus] = useState<AdvancedMetricsStatus | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkStatus();
    }, []);

    const checkStatus = async () => {
        try {
            const response = await fetch('http://localhost:8000/api/evaluation/advanced/status');
            const data = await response.json();
            setStatus(data);
        } catch (error) {
            console.error('Failed to check advanced metrics status:', error);
            setStatus({
                advanced_metrics_available: false,
                features: {
                    bertscore: false,
                    perplexity: false,
                    semantic_similarity: false,
                    evaluation_history: true,
                    response_cache: true,
                },
            });
        } finally {
            setLoading(false);
        }
    };

    return { status, loading, refresh: checkStatus };
}

export function AdvancedMetricsBadge() {
    const { status, loading } = useAdvancedMetrics();

    if (loading) {
        return (
            <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-white/5 border border-white/10">
                <div className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-pulse" />
                <span className="text-[10px] text-white/40">Checking...</span>
            </div>
        );
    }

    if (!status?.advanced_metrics_available) {
        return (
            <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-amber-900/20 border border-amber-500/30">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                <span className="text-[10px] text-amber-300">Basic Metrics</span>
            </div>
        );
    }

    return (
        <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-emerald-900/20 border border-emerald-500/30">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span className="text-[10px] text-emerald-300">Advanced Metrics</span>
        </div>
    );
}

export function AdvancedMetricsInfo() {
    const { status } = useAdvancedMetrics();

    if (!status) return null;

    return (
        <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">
                    Available Features
                </span>
                <AdvancedMetricsBadge />
            </div>

            <div className="space-y-2">
                <FeatureItem
                    name="BERTScore"
                    available={status.features.bertscore}
                    description="Embedding-based semantic similarity"
                />
                <FeatureItem
                    name="Perplexity"
                    available={status.features.perplexity}
                    description="Language model confidence"
                />
                <FeatureItem
                    name="Semantic Similarity"
                    available={status.features.semantic_similarity}
                    description="Deep semantic understanding"
                />
                <FeatureItem
                    name="Evaluation History"
                    available={status.features.evaluation_history}
                    description="Track all evaluation runs"
                />
                <FeatureItem
                    name="Response Cache"
                    available={status.features.response_cache}
                    description="Speed up repeated evaluations"
                />
            </div>

            {!status.advanced_metrics_available && (
                <div className="mt-3 pt-3 border-t border-white/5">
                    <p className="text-[10px] text-white/40 mb-2">
                        Install advanced dependencies for more metrics:
                    </p>
                    <code className="block text-[9px] text-amber-300 bg-black/30 rounded px-2 py-1 font-mono">
                        pip install sentence-transformers transformers torch
                    </code>
                </div>
            )}
        </div>
    );
}

function FeatureItem({
    name,
    available,
    description,
}: {
    name: string;
    available: boolean;
    description: string;
}) {
    return (
        <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
                <div
                    className={`w-1.5 h-1.5 rounded-full ${available ? 'bg-emerald-400' : 'bg-white/20'
                        }`}
                />
                <div>
                    <div className="text-white/70">{name}</div>
                    <div className="text-[10px] text-white/40">{description}</div>
                </div>
            </div>
            {!available && (
                <span className="text-[9px] text-white/30 uppercase">Not installed</span>
            )}
        </div>
    );
}
