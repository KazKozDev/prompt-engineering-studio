from .offline import OfflineEvaluator
from .consistency import ConsistencyScorer
from .robustness import RobustnessTester
from .telemetry import TelemetryManager
from .optimizer import PromptOptimizer
from .metrics import (
    MetricsCalculator,
    LLMJudge,
    calculate_bleu,
    calculate_rouge,
    calculate_rouge_n,
    calculate_rouge_l,
    calculate_semantic_similarity_simple,
    MetricResult
)

# Advanced metrics (optional dependencies)
try:
    from .advanced_metrics import (
        BERTScoreCalculator,
        PerplexityCalculator,
        SemanticSimilarityCalculator,
        calculate_bertscore,
        calculate_perplexity,
        calculate_semantic_similarity
    )
    ADVANCED_METRICS_AVAILABLE = True
except ImportError:
    ADVANCED_METRICS_AVAILABLE = False
    BERTScoreCalculator = None
    PerplexityCalculator = None
    SemanticSimilarityCalculator = None
    calculate_bertscore = None
    calculate_perplexity = None
    calculate_semantic_similarity = None

# Evaluation history and caching
from .history import EvaluationHistoryManager, EvaluationRun
from .cache import ResponseCache

__all__ = [
    "OfflineEvaluator",
    "ConsistencyScorer",
    "RobustnessTester",
    "TelemetryManager",
    "PromptOptimizer",
    "MetricsCalculator",
    "LLMJudge",
    "calculate_bleu",
    "calculate_rouge",
    "calculate_rouge_n",
    "calculate_rouge_l",
    "calculate_semantic_similarity_simple",
    "MetricResult",
    # Advanced metrics
    "BERTScoreCalculator",
    "PerplexityCalculator",
    "SemanticSimilarityCalculator",
    "calculate_bertscore",
    "calculate_perplexity",
    "calculate_semantic_similarity",
    "ADVANCED_METRICS_AVAILABLE",
    # History and cache
    "EvaluationHistoryManager",
    "EvaluationRun",
    "ResponseCache",
]

