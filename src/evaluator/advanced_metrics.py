"""
Advanced Metrics for Prompt Evaluation.

This module provides advanced evaluation metrics including:
- BERTScore (embedding-based semantic similarity)
- Perplexity (language model confidence)
- Embedding-based semantic similarity using sentence transformers
"""

import math
from typing import List, Dict, Any, Optional
from dataclasses import dataclass

try:
    from sentence_transformers import SentenceTransformer
    import numpy as np
    SENTENCE_TRANSFORMERS_AVAILABLE = True
except ImportError:
    SENTENCE_TRANSFORMERS_AVAILABLE = False
    SentenceTransformer = None
    np = None

try:
    import torch
    from transformers import AutoTokenizer, AutoModelForCausalLM
    TRANSFORMERS_AVAILABLE = True
except ImportError:
    TRANSFORMERS_AVAILABLE = False
    torch = None
    AutoTokenizer = None
    AutoModelForCausalLM = None


@dataclass
class MetricResult:
    """Result of a metric calculation."""
    score: float
    details: Dict[str, Any]


class BERTScoreCalculator:
    """
    Calculate BERTScore using sentence transformers.
    
    BERTScore measures semantic similarity using contextual embeddings.
    More accurate than n-gram based metrics for semantic equivalence.
    """
    
    def __init__(self, model_name: str = "all-MiniLM-L6-v2"):
        """
        Initialize BERTScore calculator.
        
        Args:
            model_name: Sentence transformer model to use.
                       Default: all-MiniLM-L6-v2 (fast, 384-dim embeddings)
        """
        if not SENTENCE_TRANSFORMERS_AVAILABLE:
            raise ImportError(
                "sentence-transformers is required for BERTScore. "
                "Install with: pip install sentence-transformers"
            )
        
        self.model = SentenceTransformer(model_name)
        self.model_name = model_name
    
    def _cosine_similarity(self, vec1: 'np.ndarray', vec2: 'np.ndarray') -> float:
        """Calculate cosine similarity between two vectors."""
        dot_product = np.dot(vec1, vec2)
        norm1 = np.linalg.norm(vec1)
        norm2 = np.linalg.norm(vec2)
        
        if norm1 == 0 or norm2 == 0:
            return 0.0
        
        return float(dot_product / (norm1 * norm2))
    
    def calculate_bertscore(
        self,
        prediction: str,
        reference: str,
        use_idf: bool = False
    ) -> MetricResult:
        """
        Calculate BERTScore between prediction and reference.
        
        Args:
            prediction: Generated text
            reference: Reference/expected text
            use_idf: Whether to use IDF weighting (default: False for simplicity)
        
        Returns:
            MetricResult with precision, recall, and F1 scores
        """
        if not prediction or not reference:
            return MetricResult(
                score=0.0,
                details={"error": "Empty input"}
            )
        
        # Tokenize into sentences/words for token-level matching
        # For simplicity, we'll use sentence-level embeddings
        pred_embedding = self.model.encode(prediction, convert_to_numpy=True)
        ref_embedding = self.model.encode(reference, convert_to_numpy=True)
        
        # Calculate cosine similarity
        similarity = self._cosine_similarity(pred_embedding, ref_embedding)
        
        # For token-level BERTScore, we'd need to:
        # 1. Tokenize both texts
        # 2. Get embeddings for each token
        # 3. Find max similarity for each token
        # 4. Average for precision/recall
        # 
        # For now, we use sentence-level as a proxy
        
        return MetricResult(
            score=round(float(similarity), 4),
            details={
                "precision": round(float(similarity), 4),
                "recall": round(float(similarity), 4),
                "f1": round(float(similarity), 4),
                "model": self.model_name,
                "method": "sentence_level"
            }
        )
    
    def calculate_bertscore_batch(
        self,
        predictions: List[str],
        references: List[str]
    ) -> MetricResult:
        """
        Calculate BERTScore for a batch of predictions.
        
        Args:
            predictions: List of generated texts
            references: List of reference texts
        
        Returns:
            MetricResult with average scores
        """
        if len(predictions) != len(references):
            return MetricResult(
                score=0.0,
                details={"error": "Mismatched lengths"}
            )
        
        # Batch encode for efficiency
        pred_embeddings = self.model.encode(predictions, convert_to_numpy=True)
        ref_embeddings = self.model.encode(references, convert_to_numpy=True)
        
        scores = []
        for pred_emb, ref_emb in zip(pred_embeddings, ref_embeddings):
            similarity = self._cosine_similarity(pred_emb, ref_emb)
            scores.append(similarity)
        
        avg_score = float(np.mean(scores))
        
        return MetricResult(
            score=round(avg_score, 4),
            details={
                "precision": round(avg_score, 4),
                "recall": round(avg_score, 4),
                "f1": round(avg_score, 4),
                "individual_scores": [round(float(s), 4) for s in scores],
                "count": len(scores),
                "model": self.model_name
            }
        )


class PerplexityCalculator:
    """
    Calculate perplexity using a language model.
    
    Perplexity measures how well a language model predicts the text.
    Lower perplexity = more confident/natural text.
    """
    
    def __init__(self, model_name: str = "gpt2"):
        """
        Initialize perplexity calculator.
        
        Args:
            model_name: HuggingFace model to use (default: gpt2)
        """
        if not TRANSFORMERS_AVAILABLE:
            raise ImportError(
                "transformers is required for perplexity calculation. "
                "Install with: pip install transformers torch"
            )
        
        self.tokenizer = AutoTokenizer.from_pretrained(model_name)
        self.model = AutoModelForCausalLM.from_pretrained(model_name)
        self.model.eval()
        self.model_name = model_name
        
        # Set pad token if not exists
        if self.tokenizer.pad_token is None:
            self.tokenizer.pad_token = self.tokenizer.eos_token
    
    def calculate_perplexity(self, text: str) -> MetricResult:
        """
        Calculate perplexity for a given text.
        
        Args:
            text: Text to evaluate
        
        Returns:
            MetricResult with perplexity score and details
        """
        if not text or not text.strip():
            return MetricResult(
                score=float('inf'),
                details={"error": "Empty input"}
            )
        
        try:
            # Tokenize
            encodings = self.tokenizer(
                text,
                return_tensors="pt",
                truncation=True,
                max_length=512
            )
            
            # Calculate loss
            with torch.no_grad():
                outputs = self.model(**encodings, labels=encodings["input_ids"])
                loss = outputs.loss
            
            # Perplexity = exp(loss)
            perplexity = float(torch.exp(loss).item())
            
            return MetricResult(
                score=round(perplexity, 4),
                details={
                    "perplexity": round(perplexity, 4),
                    "log_perplexity": round(float(loss.item()), 4),
                    "model": self.model_name,
                    "tokens": encodings["input_ids"].shape[1]
                }
            )
        except Exception as e:
            return MetricResult(
                score=float('inf'),
                details={"error": str(e)}
            )
    
    def calculate_perplexity_batch(self, texts: List[str]) -> MetricResult:
        """
        Calculate average perplexity for a batch of texts.
        
        Args:
            texts: List of texts to evaluate
        
        Returns:
            MetricResult with average perplexity
        """
        perplexities = []
        
        for text in texts:
            result = self.calculate_perplexity(text)
            if result.score != float('inf'):
                perplexities.append(result.score)
        
        if not perplexities:
            return MetricResult(
                score=float('inf'),
                details={"error": "No valid perplexities calculated"}
            )
        
        avg_perplexity = sum(perplexities) / len(perplexities)
        
        return MetricResult(
            score=round(avg_perplexity, 4),
            details={
                "average_perplexity": round(avg_perplexity, 4),
                "individual_scores": [round(p, 4) for p in perplexities],
                "count": len(perplexities),
                "model": self.model_name
            }
        )


class SemanticSimilarityCalculator:
    """
    Calculate semantic similarity using sentence embeddings.
    
    More accurate than simple word overlap (Jaccard).
    """
    
    def __init__(self, model_name: str = "all-MiniLM-L6-v2"):
        """
        Initialize semantic similarity calculator.
        
        Args:
            model_name: Sentence transformer model to use
        """
        if not SENTENCE_TRANSFORMERS_AVAILABLE:
            raise ImportError(
                "sentence-transformers is required. "
                "Install with: pip install sentence-transformers"
            )
        
        self.model = SentenceTransformer(model_name)
        self.model_name = model_name
    
    def calculate_similarity(
        self,
        text1: str,
        text2: str
    ) -> MetricResult:
        """
        Calculate semantic similarity between two texts.
        
        Args:
            text1: First text
            text2: Second text
        
        Returns:
            MetricResult with cosine similarity score (0-1)
        """
        if not text1 or not text2:
            return MetricResult(
                score=0.0,
                details={"error": "Empty input"}
            )
        
        # Encode texts
        embeddings = self.model.encode([text1, text2], convert_to_numpy=True)
        
        # Calculate cosine similarity
        similarity = float(np.dot(embeddings[0], embeddings[1]) / 
                          (np.linalg.norm(embeddings[0]) * np.linalg.norm(embeddings[1])))
        
        # Normalize to 0-1 range (cosine can be -1 to 1)
        normalized_similarity = (similarity + 1) / 2
        
        return MetricResult(
            score=round(normalized_similarity, 4),
            details={
                "cosine_similarity": round(similarity, 4),
                "normalized_similarity": round(normalized_similarity, 4),
                "model": self.model_name
            }
        )
    
    def calculate_similarity_batch(
        self,
        texts1: List[str],
        texts2: List[str]
    ) -> MetricResult:
        """
        Calculate semantic similarity for batches of texts.
        
        Args:
            texts1: First list of texts
            texts2: Second list of texts
        
        Returns:
            MetricResult with average similarity
        """
        if len(texts1) != len(texts2):
            return MetricResult(
                score=0.0,
                details={"error": "Mismatched lengths"}
            )
        
        scores = []
        for t1, t2 in zip(texts1, texts2):
            result = self.calculate_similarity(t1, t2)
            scores.append(result.score)
        
        avg_score = sum(scores) / len(scores) if scores else 0.0
        
        return MetricResult(
            score=round(avg_score, 4),
            details={
                "average_similarity": round(avg_score, 4),
                "individual_scores": [round(s, 4) for s in scores],
                "count": len(scores),
                "model": self.model_name
            }
        )


# Convenience functions for backward compatibility
def calculate_bertscore(
    prediction: str,
    reference: str,
    model_name: str = "all-MiniLM-L6-v2"
) -> MetricResult:
    """Calculate BERTScore (convenience function)."""
    calculator = BERTScoreCalculator(model_name)
    return calculator.calculate_bertscore(prediction, reference)


def calculate_perplexity(
    text: str,
    model_name: str = "gpt2"
) -> MetricResult:
    """Calculate perplexity (convenience function)."""
    calculator = PerplexityCalculator(model_name)
    return calculator.calculate_perplexity(text)


def calculate_semantic_similarity(
    text1: str,
    text2: str,
    model_name: str = "all-MiniLM-L6-v2"
) -> MetricResult:
    """Calculate semantic similarity (convenience function)."""
    calculator = SemanticSimilarityCalculator(model_name)
    return calculator.calculate_similarity(text1, text2)
