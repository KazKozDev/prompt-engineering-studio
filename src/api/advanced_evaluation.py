"""
API endpoints for advanced evaluation metrics and features.

This file contains endpoints for:
- BERTScore calculation
- Perplexity calculation  
- Evaluation history tracking
- Cache management
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import logging

from src.evaluator import (
    ADVANCED_METRICS_AVAILABLE,
    EvaluationHistoryManager,
    ResponseCache
)

if ADVANCED_METRICS_AVAILABLE:
    from src.evaluator import (
        BERTScoreCalculator,
        PerplexityCalculator,
        SemanticSimilarityCalculator
    )

logger = logging.getLogger(__name__)

# Initialize managers
eval_history = EvaluationHistoryManager()
response_cache = ResponseCache()

# Lazy-loaded calculators
_bertscore_calculator = None
_perplexity_calculator = None
_semantic_calculator = None


def get_bertscore_calculator():
    """Lazy load BERTScore calculator."""
    global _bertscore_calculator
    if _bertscore_calculator is None:
        if not ADVANCED_METRICS_AVAILABLE:
            raise HTTPException(
                status_code=501,
                detail="Advanced metrics not available. Install: pip install sentence-transformers transformers torch"
            )
        _bertscore_calculator = BERTScoreCalculator()
    return _bertscore_calculator


def get_perplexity_calculator():
    """Lazy load Perplexity calculator."""
    global _perplexity_calculator
    if _perplexity_calculator is None:
        if not ADVANCED_METRICS_AVAILABLE:
            raise HTTPException(
                status_code=501,
                detail="Advanced metrics not available. Install: pip install transformers torch"
            )
        _perplexity_calculator = PerplexityCalculator()
    return _perplexity_calculator


def get_semantic_calculator():
    """Lazy load Semantic Similarity calculator."""
    global _semantic_calculator
    if _semantic_calculator is None:
        if not ADVANCED_METRICS_AVAILABLE:
            raise HTTPException(
                status_code=501,
                detail="Advanced metrics not available. Install: pip install sentence-transformers"
            )
        _semantic_calculator = SemanticSimilarityCalculator()
    return _semantic_calculator


# Request models
class BERTScoreRequest(BaseModel):
    prediction: str
    reference: str


class BERTScoreBatchRequest(BaseModel):
    predictions: List[str]
    references: List[str]


class PerplexityRequest(BaseModel):
    text: str


class PerplexityBatchRequest(BaseModel):
    texts: List[str]


class SemanticSimilarityRequest(BaseModel):
    text1: str
    text2: str


class SaveEvaluationRequest(BaseModel):
    prompt_id: str
    prompt_text: str
    dataset_id: str
    dataset_name: str
    metrics: Dict[str, float]
    metadata: Optional[Dict[str, Any]] = None


class RegressionCheckRequest(BaseModel):
    prompt_id: str
    metric_name: str
    threshold: float = 0.05
    window: int = 5


# Router setup
router = APIRouter(prefix="/api/evaluation/advanced", tags=["advanced_evaluation"])


# BERTScore endpoints
@router.post("/bertscore")
async def calculate_bertscore_endpoint(request: BERTScoreRequest):
    """
    Calculate BERTScore between prediction and reference.
    
    BERTScore uses contextual embeddings for semantic similarity.
    More accurate than n-gram metrics for semantic equivalence.
    """
    try:
        calculator = get_bertscore_calculator()
        result = calculator.calculate_bertscore(request.prediction, request.reference)
        
        return {
            "score": result.score,
            "details": result.details
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"BERTScore calculation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/bertscore/batch")
async def calculate_bertscore_batch_endpoint(request: BERTScoreBatchRequest):
    """Calculate BERTScore for a batch of predictions."""
    try:
        calculator = get_bertscore_calculator()
        result = calculator.calculate_bertscore_batch(
            request.predictions,
            request.references
        )
        
        return {
            "score": result.score,
            "details": result.details
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Batch BERTScore calculation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# Perplexity endpoints
@router.post("/perplexity")
async def calculate_perplexity_endpoint(request: PerplexityRequest):
    """
    Calculate perplexity for a text.
    
    Perplexity measures how well a language model predicts the text.
    Lower perplexity = more natural/confident text.
    """
    try:
        calculator = get_perplexity_calculator()
        result = calculator.calculate_perplexity(request.text)
        
        return {
            "perplexity": result.score,
            "details": result.details
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Perplexity calculation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/perplexity/batch")
async def calculate_perplexity_batch_endpoint(request: PerplexityBatchRequest):
    """Calculate average perplexity for a batch of texts."""
    try:
        calculator = get_perplexity_calculator()
        result = calculator.calculate_perplexity_batch(request.texts)
        
        return {
            "average_perplexity": result.score,
            "details": result.details
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Batch perplexity calculation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# Semantic similarity endpoints
@router.post("/semantic-similarity")
async def calculate_semantic_similarity_endpoint(request: SemanticSimilarityRequest):
    """
    Calculate semantic similarity using sentence embeddings.
    
    More accurate than simple word overlap (Jaccard).
    Uses sentence-transformers for deep semantic understanding.
    """
    try:
        calculator = get_semantic_calculator()
        result = calculator.calculate_similarity(request.text1, request.text2)
        
        return {
            "similarity": result.score,
            "details": result.details
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Semantic similarity calculation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# Evaluation history endpoints
@router.post("/history/save")
async def save_evaluation_endpoint(request: SaveEvaluationRequest):
    """Save an evaluation run to history."""
    try:
        run_id = eval_history.save_evaluation(
            prompt_id=request.prompt_id,
            prompt_text=request.prompt_text,
            dataset_id=request.dataset_id,
            dataset_name=request.dataset_name,
            metrics=request.metrics,
            metadata=request.metadata
        )
        
        return {
            "success": True,
            "run_id": run_id
        }
    except Exception as e:
        logger.error(f"Error saving evaluation: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/history/prompt/{prompt_id}")
async def get_prompt_history_endpoint(prompt_id: str, limit: int = 20):
    """Get evaluation history for a specific prompt."""
    try:
        runs = eval_history.get_prompt_history(prompt_id, limit=limit)
        
        return {
            "prompt_id": prompt_id,
            "runs": [run.to_dict() for run in runs],
            "count": len(runs)
        }
    except Exception as e:
        logger.error(f"Error getting prompt history: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/history/dataset/{dataset_id}")
async def get_dataset_history_endpoint(dataset_id: str, limit: int = 20):
    """Get evaluation history for a specific dataset."""
    try:
        runs = eval_history.get_dataset_history(dataset_id, limit=limit)
        
        return {
            "dataset_id": dataset_id,
            "runs": [run.to_dict() for run in runs],
            "count": len(runs)
        }
    except Exception as e:
        logger.error(f"Error getting dataset history: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/history/regression")
async def check_regression_endpoint(request: RegressionCheckRequest):
    """
    Detect metric regression for a prompt.
    
    Compares recent performance to baseline and alerts if degradation detected.
    """
    try:
        result = eval_history.detect_regression(
            prompt_id=request.prompt_id,
            metric_name=request.metric_name,
            threshold=request.threshold,
            window=request.window
        )
        
        return result
    except Exception as e:
        logger.error(f"Error checking regression: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/history/trend/{prompt_id}/{metric_name}")
async def get_metric_trend_endpoint(prompt_id: str, metric_name: str, limit: int = 20):
    """Get trend data for a specific metric over time."""
    try:
        trend = eval_history.get_metric_trend(
            prompt_id=prompt_id,
            metric_name=metric_name,
            limit=limit
        )
        
        return trend
    except Exception as e:
        logger.error(f"Error getting metric trend: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/history/stats")
async def get_history_stats_endpoint():
    """Get overall evaluation history statistics."""
    try:
        stats = eval_history.get_statistics()
        return stats
    except Exception as e:
        logger.error(f"Error getting history stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# Cache management endpoints
@router.get("/cache/stats")
async def get_cache_stats_endpoint():
    """Get cache statistics."""
    try:
        stats = response_cache.get_stats()
        size = response_cache.get_size()
        
        return {
            **stats,
            **size
        }
    except Exception as e:
        logger.error(f"Error getting cache stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/cache/clear")
async def clear_cache_endpoint():
    """Clear all cache entries."""
    try:
        count = response_cache.clear()
        
        return {
            "success": True,
            "entries_cleared": count
        }
    except Exception as e:
        logger.error(f"Error clearing cache: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/cache/clear-expired")
async def clear_expired_cache_endpoint():
    """Clear expired cache entries."""
    try:
        count = response_cache.clear_expired()
        
        return {
            "success": True,
            "entries_cleared": count
        }
    except Exception as e:
        logger.error(f"Error clearing expired cache: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/status")
async def get_advanced_metrics_status():
    """Check if advanced metrics are available."""
    return {
        "advanced_metrics_available": ADVANCED_METRICS_AVAILABLE,
        "features": {
            "bertscore": ADVANCED_METRICS_AVAILABLE,
            "perplexity": ADVANCED_METRICS_AVAILABLE,
            "semantic_similarity": ADVANCED_METRICS_AVAILABLE,
            "evaluation_history": True,
            "response_cache": True
        }
    }
