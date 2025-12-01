"""
Advanced metrics for prompt evaluation.
Includes BLEU, ROUGE, Semantic Similarity, and LLM-as-Judge.
"""

import re
import math
from collections import Counter
from typing import List, Dict, Any, Optional
from dataclasses import dataclass


@dataclass
class MetricResult:
    """Result of a metric calculation."""
    score: float
    details: Dict[str, Any]


# =============================================================================
# BLEU Score (Bilingual Evaluation Understudy)
# =============================================================================

def _get_ngrams(tokens: List[str], n: int) -> Counter:
    """Extract n-grams from a list of tokens."""
    return Counter(tuple(tokens[i:i+n]) for i in range(len(tokens) - n + 1))


def _tokenize(text: str) -> List[str]:
    """Simple tokenization: lowercase and split on non-alphanumeric."""
    return re.findall(r'\w+', text.lower())


def calculate_bleu(prediction: str, reference: str, max_n: int = 4) -> MetricResult:
    """
    Calculate BLEU score between prediction and reference.
    
    BLEU measures n-gram overlap between generated text and reference.
    Score ranges from 0 to 1, higher is better.
    
    Args:
        prediction: Generated text
        reference: Reference/expected text
        max_n: Maximum n-gram size (default 4 for BLEU-4)
    
    Returns:
        MetricResult with score and per-n-gram details
    """
    pred_tokens = _tokenize(prediction)
    ref_tokens = _tokenize(reference)
    
    if not pred_tokens or not ref_tokens:
        return MetricResult(score=0.0, details={"error": "Empty input"})
    
    # Calculate precision for each n-gram size
    precisions = []
    details = {}
    
    for n in range(1, max_n + 1):
        pred_ngrams = _get_ngrams(pred_tokens, n)
        ref_ngrams = _get_ngrams(ref_tokens, n)
        
        if not pred_ngrams:
            precisions.append(0.0)
            details[f"precision_{n}"] = 0.0
            continue
        
        # Clipped count: min of prediction count and reference count for each n-gram
        clipped_count = sum(min(pred_ngrams[ng], ref_ngrams[ng]) for ng in pred_ngrams)
        total_count = sum(pred_ngrams.values())
        
        precision = clipped_count / total_count if total_count > 0 else 0.0
        precisions.append(precision)
        details[f"precision_{n}"] = round(precision, 4)
    
    # Brevity penalty
    bp = 1.0 if len(pred_tokens) >= len(ref_tokens) else math.exp(1 - len(ref_tokens) / len(pred_tokens))
    details["brevity_penalty"] = round(bp, 4)
    
    # Geometric mean of precisions
    if all(p > 0 for p in precisions):
        log_avg = sum(math.log(p) for p in precisions) / len(precisions)
        bleu = bp * math.exp(log_avg)
    else:
        bleu = 0.0
    
    return MetricResult(score=round(bleu, 4), details=details)


def calculate_bleu_corpus(predictions: List[str], references: List[str]) -> MetricResult:
    """Calculate average BLEU score over a corpus."""
    if len(predictions) != len(references):
        return MetricResult(score=0.0, details={"error": "Mismatched lengths"})
    
    scores = [calculate_bleu(p, r).score for p, r in zip(predictions, references)]
    avg_score = sum(scores) / len(scores) if scores else 0.0
    
    return MetricResult(
        score=round(avg_score, 4),
        details={"individual_scores": scores, "count": len(scores)}
    )


# =============================================================================
# ROUGE Score (Recall-Oriented Understudy for Gisting Evaluation)
# =============================================================================

def calculate_rouge_n(prediction: str, reference: str, n: int = 1) -> MetricResult:
    """
    Calculate ROUGE-N score (n-gram recall).
    
    ROUGE-N measures n-gram recall between generated text and reference.
    Score ranges from 0 to 1, higher is better.
    
    Args:
        prediction: Generated text
        reference: Reference/expected text
        n: N-gram size (1 for ROUGE-1, 2 for ROUGE-2)
    
    Returns:
        MetricResult with precision, recall, and F1
    """
    pred_tokens = _tokenize(prediction)
    ref_tokens = _tokenize(reference)
    
    if not pred_tokens or not ref_tokens:
        return MetricResult(score=0.0, details={"error": "Empty input"})
    
    pred_ngrams = _get_ngrams(pred_tokens, n)
    ref_ngrams = _get_ngrams(ref_tokens, n)
    
    if not ref_ngrams:
        return MetricResult(score=0.0, details={"error": "No reference n-grams"})
    
    # Overlap
    overlap = sum(min(pred_ngrams[ng], ref_ngrams[ng]) for ng in pred_ngrams)
    
    precision = overlap / sum(pred_ngrams.values()) if pred_ngrams else 0.0
    recall = overlap / sum(ref_ngrams.values()) if ref_ngrams else 0.0
    f1 = 2 * precision * recall / (precision + recall) if (precision + recall) > 0 else 0.0
    
    return MetricResult(
        score=round(f1, 4),
        details={
            "precision": round(precision, 4),
            "recall": round(recall, 4),
            "f1": round(f1, 4)
        }
    )


def _get_lcs_length(tokens1: List[str], tokens2: List[str]) -> int:
    """Calculate Longest Common Subsequence length."""
    m, n = len(tokens1), len(tokens2)
    dp = [[0] * (n + 1) for _ in range(m + 1)]
    
    for i in range(1, m + 1):
        for j in range(1, n + 1):
            if tokens1[i-1] == tokens2[j-1]:
                dp[i][j] = dp[i-1][j-1] + 1
            else:
                dp[i][j] = max(dp[i-1][j], dp[i][j-1])
    
    return dp[m][n]


def calculate_rouge_l(prediction: str, reference: str) -> MetricResult:
    """
    Calculate ROUGE-L score (Longest Common Subsequence).
    
    ROUGE-L measures the longest common subsequence between texts.
    Better for capturing sentence-level structure.
    
    Args:
        prediction: Generated text
        reference: Reference/expected text
    
    Returns:
        MetricResult with precision, recall, and F1
    """
    pred_tokens = _tokenize(prediction)
    ref_tokens = _tokenize(reference)
    
    if not pred_tokens or not ref_tokens:
        return MetricResult(score=0.0, details={"error": "Empty input"})
    
    lcs_length = _get_lcs_length(pred_tokens, ref_tokens)
    
    precision = lcs_length / len(pred_tokens) if pred_tokens else 0.0
    recall = lcs_length / len(ref_tokens) if ref_tokens else 0.0
    f1 = 2 * precision * recall / (precision + recall) if (precision + recall) > 0 else 0.0
    
    return MetricResult(
        score=round(f1, 4),
        details={
            "precision": round(precision, 4),
            "recall": round(recall, 4),
            "f1": round(f1, 4),
            "lcs_length": lcs_length
        }
    )


def calculate_rouge(prediction: str, reference: str) -> Dict[str, MetricResult]:
    """Calculate all ROUGE variants."""
    return {
        "rouge1": calculate_rouge_n(prediction, reference, n=1),
        "rouge2": calculate_rouge_n(prediction, reference, n=2),
        "rougeL": calculate_rouge_l(prediction, reference)
    }


# =============================================================================
# Semantic Similarity (using simple word overlap as fallback)
# For production, use sentence-transformers embeddings
# =============================================================================

def calculate_semantic_similarity_simple(prediction: str, reference: str) -> MetricResult:
    """
    Calculate semantic similarity using Jaccard similarity on words.
    This is a simple fallback - for production use embeddings.
    
    Args:
        prediction: Generated text
        reference: Reference/expected text
    
    Returns:
        MetricResult with Jaccard similarity score
    """
    pred_words = set(_tokenize(prediction))
    ref_words = set(_tokenize(reference))
    
    if not pred_words or not ref_words:
        return MetricResult(score=0.0, details={"error": "Empty input"})
    
    intersection = pred_words & ref_words
    union = pred_words | ref_words
    
    jaccard = len(intersection) / len(union) if union else 0.0
    
    return MetricResult(
        score=round(jaccard, 4),
        details={
            "intersection_size": len(intersection),
            "union_size": len(union),
            "pred_words": len(pred_words),
            "ref_words": len(ref_words)
        }
    )


# =============================================================================
# LLM-as-Judge
# =============================================================================

class LLMJudge:
    """
    Use an LLM to evaluate response quality.
    
    This is the most flexible evaluation method - works without reference answers
    and can evaluate subjective qualities like helpfulness, safety, etc.
    """
    
    JUDGE_PROMPT = """You are an expert evaluator. Rate the following response on a scale of 1-10.

**Criteria:**
{criteria}

**Prompt given to the model:**
{prompt}

**Model's response:**
{response}

**Your evaluation:**
Provide a JSON object with:
- "score": number from 1-10
- "reasoning": brief explanation (1-2 sentences)

Example: {{"score": 7, "reasoning": "Good answer but could be more specific."}}

JSON:"""

    CRITERIA_PRESETS = {
        "general": "Evaluate for accuracy, relevance, and helpfulness.",
        "helpfulness": "How helpful and actionable is this response for the user?",
        "accuracy": "How factually accurate and correct is this response?",
        "safety": "Is this response safe, ethical, and free from harmful content?",
        "creativity": "How creative, original, and engaging is this response?",
        "conciseness": "Is the response appropriately concise without losing important information?",
        "technical": "How technically accurate and well-explained is this response?"
    }
    
    def __init__(self, llm_client):
        """
        Initialize with an LLM client.
        
        Args:
            llm_client: Object with generate(prompt) method
        """
        self.llm = llm_client
    
    async def evaluate(
        self,
        prompt: str,
        response: str,
        criteria: str = "general"
    ) -> MetricResult:
        """
        Evaluate a response using LLM-as-Judge.
        
        Args:
            prompt: The original prompt given to the model
            response: The model's response to evaluate
            criteria: Evaluation criteria (preset name or custom string)
        
        Returns:
            MetricResult with score (normalized to 0-1) and reasoning
        """
        criteria_text = self.CRITERIA_PRESETS.get(criteria, criteria)
        
        judge_prompt = self.JUDGE_PROMPT.format(
            criteria=criteria_text,
            prompt=prompt,
            response=response
        )
        
        try:
            judge_response = await self.llm.generate(judge_prompt)
            
            # Parse JSON from response
            import json
            # Try to extract JSON from the response
            json_match = re.search(r'\{[^}]+\}', judge_response)
            if json_match:
                result = json.loads(json_match.group())
                raw_score = float(result.get("score", 5))
                score = raw_score / 10  # Normalize to 0-1
                reasoning = result.get("reasoning", "No reasoning provided")
                confidence = result.get("confidence", score)  # Use score as confidence if not provided
            else:
                score = 0.5
                reasoning = "Could not parse judge response"
                confidence = 0.5
            
            return MetricResult(
                score=round(score, 2),
                details={
                    "raw_score": int(score * 10),
                    "reasoning": reasoning,
                    "criteria": criteria_text,
                    "confidence": round(confidence, 2)
                }
            )
        except Exception as e:
            return MetricResult(
                score=0.0,
                details={"error": str(e)}
            )
    
    async def evaluate_batch(
        self,
        prompt: str,
        responses: List[str],
        criteria: str = "general"
    ) -> List[MetricResult]:
        """Evaluate multiple responses."""
        results = []
        for response in responses:
            result = await self.evaluate(prompt, response, criteria)
            results.append(result)
        return results


# =============================================================================
# Aggregate Metrics Calculator
# =============================================================================

class MetricsCalculator:
    """
    Unified interface for calculating all metrics.
    """
    
    def __init__(self, llm_client=None):
        """
        Initialize calculator.
        
        Args:
            llm_client: Optional LLM client for LLM-as-Judge
        """
        self.llm_judge = LLMJudge(llm_client) if llm_client else None
    
    def calculate_text_metrics(
        self,
        prediction: str,
        reference: str
    ) -> Dict[str, Any]:
        """
        Calculate all text-based metrics.
        
        Args:
            prediction: Generated text
            reference: Reference text
        
        Returns:
            Dictionary with all metric scores
        """
        bleu = calculate_bleu(prediction, reference)
        rouge = calculate_rouge(prediction, reference)
        semantic = calculate_semantic_similarity_simple(prediction, reference)
        
        return {
            "bleu": bleu.score,
            "bleu_details": bleu.details,
            "rouge1": rouge["rouge1"].score,
            "rouge2": rouge["rouge2"].score,
            "rougeL": rouge["rougeL"].score,
            "rouge_details": {
                "rouge1": rouge["rouge1"].details,
                "rouge2": rouge["rouge2"].details,
                "rougeL": rouge["rougeL"].details
            },
            "semantic_similarity": semantic.score,
            "semantic_details": semantic.details
        }
    
    def calculate_corpus_metrics(
        self,
        predictions: List[str],
        references: List[str]
    ) -> Dict[str, Any]:
        """
        Calculate metrics over a corpus.
        
        Args:
            predictions: List of generated texts
            references: List of reference texts
        
        Returns:
            Dictionary with aggregated metrics
        """
        if len(predictions) != len(references):
            return {"error": "Mismatched lengths"}
        
        all_metrics = [
            self.calculate_text_metrics(p, r)
            for p, r in zip(predictions, references)
        ]
        
        # Aggregate
        n = len(all_metrics)
        return {
            "bleu_avg": round(sum(m["bleu"] for m in all_metrics) / n, 4),
            "rouge1_avg": round(sum(m["rouge1"] for m in all_metrics) / n, 4),
            "rouge2_avg": round(sum(m["rouge2"] for m in all_metrics) / n, 4),
            "rougeL_avg": round(sum(m["rougeL"] for m in all_metrics) / n, 4),
            "semantic_avg": round(sum(m["semantic_similarity"] for m in all_metrics) / n, 4),
            "count": n,
            "individual": all_metrics
        }
    
    async def evaluate_with_judge(
        self,
        prompt: str,
        response: str,
        criteria: str = "general"
    ) -> Dict[str, Any]:
        """
        Evaluate using LLM-as-Judge.
        
        Args:
            prompt: Original prompt
            response: Model response
            criteria: Evaluation criteria
        
        Returns:
            Dictionary with judge evaluation
        """
        if not self.llm_judge:
            return {"error": "LLM client not configured"}
        
        result = await self.llm_judge.evaluate(prompt, response, criteria)
        return {
            "judge_score": result.score,
            "judge_details": result.details
        }
