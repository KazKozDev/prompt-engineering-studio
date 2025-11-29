"""
Prompt Optimizer Module.

This module provides functionality to automatically optimize prompts by generating candidates
and evaluating them against a dataset to find the best performers.
"""
from typing import List, Dict, Any, Callable
from .offline import OfflineEvaluator
from .robustness import RobustnessTester

class PromptOptimizer:
    """Optimizes prompts by generating candidates and ranking them."""

    def __init__(self):
        self.evaluator = OfflineEvaluator()
        self.robustness_tester = RobustnessTester() # Reuse generation logic

    def optimize_prompt(self, 
                       base_prompt: str, 
                       dataset: List[Dict[str, str]], 
                       model_func: Callable[[str], str],
                       n_candidates: int = 5) -> Dict[str, Any]:
        """
        Optimize a prompt by generating candidates and evaluating them.
        
        Args:
            base_prompt: The starting prompt.
            dataset: Evaluation dataset.
            model_func: Function to run the prompt against dataset.
            n_candidates: Number of candidates to generate.
            
        Returns:
            Dictionary with optimization results (candidates ranked by score).
        """
        # 1. Generate candidates
        # We use a specific meta-prompt for improvement
        def improvement_generator(prompt: str) -> str:
            meta_prompt = (
                f"You are an expert prompt engineer. Generate {n_candidates} improved versions of the following prompt. "
                "Focus on clarity, robustness, and following instructions. "
                "Output ONLY the improved prompts, separated by '---'.\n\n"
                f"Original Prompt:\n{prompt}"
            )
            return model_func(meta_prompt)

        candidates = self.robustness_tester.generate_variations(
            base_prompt, 
            lambda p: improvement_generator(base_prompt), # Hacky adapter
            n_variations=n_candidates
        )
        
        # Ensure base prompt is included for comparison
        if base_prompt not in candidates:
            candidates.insert(0, base_prompt)
            
        # 2. Evaluate all candidates
        # We run the full evaluation for each candidate
        results = self.evaluator.run_evaluation(dataset, candidates, model_func)
        
        # 3. Rank candidates
        ranked_candidates = []
        for i, candidate in enumerate(candidates):
            key = f"prompt_{i}"
            if key in results:
                score = results[key]["accuracy"]
                ranked_candidates.append({
                    "prompt": candidate,
                    "score": score,
                    "metrics": results[key]
                })
                
        # Sort by score descending
        ranked_candidates.sort(key=lambda x: x["score"], reverse=True)
        
        return {
            "best_prompt": ranked_candidates[0]["prompt"] if ranked_candidates else base_prompt,
            "best_score": ranked_candidates[0]["score"] if ranked_candidates else 0.0,
            "candidates": ranked_candidates,
            "improvement": (ranked_candidates[0]["score"] - ranked_candidates[-1]["score"]) if len(ranked_candidates) > 1 else 0.0
        }
