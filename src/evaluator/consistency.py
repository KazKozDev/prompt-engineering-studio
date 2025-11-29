"""
Consistency Scorer Module.

This module provides functionality to evaluate the consistency of model outputs.
It includes Self-Consistency (stability of one prompt) and Mutual-Consistency (agreement between prompts).
"""
from typing import List, Dict, Any
from collections import Counter

class ConsistencyScorer:
    """Evaluates consistency of model outputs."""

    def calculate_self_consistency(self, responses: List[str]) -> float:
        """
        Calculate self-consistency score (0.0 to 1.0).
        Defined as the frequency of the most common answer.
        
        Args:
            responses: List of sampled responses for the same prompt.
            
        Returns:
            Score between 0.0 (all different) and 1.0 (all same).
        """
        if not responses:
            return 0.0
            
        # Normalize responses for comparison
        normalized = [r.strip().lower() for r in responses]
        
        # Count occurrences
        counts = Counter(normalized)
        
        # Get the count of the most common answer
        if not counts:
            return 0.0
            
        most_common_count = counts.most_common(1)[0][1]
        
        return most_common_count / len(responses)

    def calculate_mutual_consistency(self, group_a: List[str], group_b: List[str]) -> float:
        """
        Calculate mutual consistency between two groups of responses (e.g., from two different prompts).
        Measures how much the dominant answers of both groups agree.
        
        Args:
            group_a: Responses from prompt A.
            group_b: Responses from prompt B.
            
        Returns:
            1.0 if the most common answer is the same, 0.0 otherwise.
            (Can be made more granular, but this is a simple "agreement" check).
        """
        if not group_a or not group_b:
            return 0.0
            
        def get_most_common(responses):
            normalized = [r.strip().lower() for r in responses]
            return Counter(normalized).most_common(1)[0][0]
            
        top_a = get_most_common(group_a)
        top_b = get_most_common(group_b)
        
        return 1.0 if top_a == top_b else 0.0

    def run_consistency_check(self, 
                             prompt: str, 
                             model_func: Any, 
                             n_samples: int = 5,
                             temperature: float = 0.7) -> Dict[str, Any]:
        """
        Run a self-consistency check for a single prompt.
        
        Args:
            prompt: The prompt to test.
            model_func: Function to call model (should accept temperature).
            n_samples: Number of samples to generate.
            temperature: Temperature for sampling.
            
        Returns:
            Dictionary with score and samples.
        """
        responses = []
        for _ in range(n_samples):
            try:
                # We assume model_func can take temperature, or we handle it externally
                # For this interface, let's assume model_func handles the call
                resp = model_func(prompt, temperature=temperature)
                responses.append(resp)
            except Exception as e:
                responses.append("") # Error handling
                
        score = self.calculate_self_consistency(responses)
        
        return {
            "score": score,
            "samples": responses,
            "n_samples": n_samples
        }
