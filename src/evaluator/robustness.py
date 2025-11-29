"""
Robustness Tester Module.

This module provides functionality to test the robustness of prompts by generating variations
and evaluating their performance stability.
"""
from typing import List, Dict, Any, Callable
from .offline import OfflineEvaluator

class RobustnessTester:
    """Tests prompt robustness by generating variations and evaluating them."""

    def __init__(self):
        self.evaluator = OfflineEvaluator()

    def generate_variations(self, 
                           prompt: str, 
                           model_func: Callable[[str], str], 
                           n_variations: int = 3) -> List[str]:
        """
        Generate variations of a prompt using an LLM.
        
        Args:
            prompt: The original prompt.
            model_func: Function to call LLM.
            n_variations: Number of variations to generate.
            
        Returns:
            List of prompt variations (including original).
        """
        meta_prompt = (
            f"You are a prompt engineer. Rewrite the following prompt in {n_variations} different ways, "
            "keeping the core meaning but changing the wording, structure, or tone. "
            "Output ONLY the rewritten prompts, separated by '---'.\n\n"
            f"Original Prompt:\n{prompt}"
        )
        
        try:
            response = model_func(meta_prompt)
            # Split by separator and clean up
            variations = [v.strip() for v in response.split('---') if v.strip()]
            # Ensure we have at least the original if generation fails or returns garbage
            if not variations:
                variations = [prompt]
            elif prompt not in variations:
                variations.insert(0, prompt)
                
            return variations[:n_variations+1] # Return original + n variations
        except Exception as e:
            print(f"Error generating variations: {e}")
            return [prompt]

    def test_robustness(self, 
                       prompt: str, 
                       dataset: List[Dict[str, str]], 
                       model_func: Callable[[str], str],
                       variation_func: Callable[[str], str]) -> Dict[str, Any]:
        """
        Run robustness test.
        
        Args:
            prompt: Original prompt.
            dataset: Evaluation dataset.
            model_func: Function to run the prompt against dataset.
            variation_func: Function to generate variations (can be same as model_func or different).
            
        Returns:
            Dictionary with robustness metrics.
        """
        # 1. Generate variations
        variations = self.generate_variations(prompt, variation_func)
        
        # 2. Run evaluation for each variation
        # We reuse OfflineEvaluator's run_evaluation which handles multiple prompts
        results = self.evaluator.run_evaluation(dataset, variations, model_func)
        
        return {
            "variations": variations,
            "results": results,
            "sensitivity": results.get("sensitivity_analysis", {})
        }
