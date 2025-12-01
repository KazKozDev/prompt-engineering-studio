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
        """Legacy alias for format robustness."""
        return self.test_format_robustness(prompt, dataset, model_func, variation_func)

    def test_format_robustness(self, 
                             prompt: str, 
                             dataset: List[Dict[str, str]], 
                             model_func: Callable[[str], str],
                             variation_func: Callable[[str], str]) -> Dict[str, Any]:
        """
        Test robustness to prompt formatting variations.
        """
        # 1. Generate variations
        variations = self.generate_variations(prompt, variation_func)
        
        # 2. Run evaluation for each variation
        results = self.evaluator.run_evaluation(dataset, variations, model_func)
        
        # Calculate deltas
        base_score = results.get("prompt_0", {}).get("accuracy", 0) # Assuming prompt_0 is original
        format_variations = []
        
        for i, var in enumerate(variations):
            key = f"prompt_{i}"
            score = results.get(key, {}).get("accuracy", 0)
            format_variations.append({
                "name": f"Variation {i+1}",
                "example": var,
                "score": score,
                "delta": score - base_score,
                "delta_percent": ((score - base_score) / base_score * 100) if base_score > 0 else 0
            })

        return {
            "robustness_score": 1.0 - (max([abs(v["delta"]) for v in format_variations]) if format_variations else 0),
            "performance_delta": min([v["delta"] for v in format_variations]) if format_variations else 0,
            "variations": variations,
            "format_variations": format_variations,
            "results": results
        }

    def test_length_robustness(self,
                             prompt: str,
                             dataset: List[Dict[str, str]],
                             model_func: Callable[[str], str],
                             max_context_length: int = 1000) -> Dict[str, Any]:
        """
        Test robustness to increasing context length (padding inputs).
        """
        length_tests = []
        # Test at 1x, 2x, 4x, 8x length (simulated by repeating input)
        multipliers = [1, 2, 4, 8]
        
        for m in multipliers:
            # Create a modified dataset with repeated inputs to simulate length
            modified_dataset = []
            for item in dataset:
                long_input = (item["input"] + "\n") * m
                # Truncate if roughly exceeding max char length (approx 4 chars per token)
                if len(long_input) > max_context_length * 4:
                     long_input = long_input[:max_context_length * 4]
                
                modified_dataset.append({
                    "input": long_input,
                    "output": item["output"]
                })
            
            # Run evaluation
            # We use the base prompt but with modified dataset
            # OfflineEvaluator expects (dataset, [prompts], model_func)
            # We need to temporarily patch the evaluator or just run it
            # The evaluator replaces {{input}} in prompt with dataset input.
            
            results = self.evaluator.run_evaluation(modified_dataset, [prompt], model_func)
            score = results.get("prompt_0", {}).get("accuracy", 0)
            
            length_tests.append({
                "context_length": len(modified_dataset[0]["input"]) // 4, # Approx tokens
                "score": score,
                "multiplier": m
            })
            
        # Find degradation point
        base_score = length_tests[0]["score"]
        degradation_point = "None"
        for test in length_tests:
            if test["score"] < base_score * 0.8: # 20% drop
                degradation_point = f"{test['context_length']} tokens"
                break
                
        return {
            "robustness_score": length_tests[-1]["score"] / base_score if base_score > 0 else 0,
            "performance_delta": length_tests[-1]["score"] - base_score,
            "variations": [str(m) for m in multipliers],
            "length_tests": length_tests,
            "degradation_point": degradation_point
        }

    def test_adversarial_robustness(self,
                                  prompt: str,
                                  dataset: List[Dict[str, str]],
                                  model_func: Callable[[str], str],
                                  level: str = "medium") -> Dict[str, Any]:
        """
        Test robustness to adversarial inputs (typos, noise).
        """
        import random
        
        def inject_noise(text: str, severity: float) -> str:
            chars = list(text)
            n_noise = int(len(chars) * severity)
            for _ in range(n_noise):
                idx = random.randint(0, len(chars)-1)
                # Simple swap or replace
                op = random.choice(['swap', 'replace', 'delete'])
                if op == 'swap' and idx < len(chars)-1:
                    chars[idx], chars[idx+1] = chars[idx+1], chars[idx]
                elif op == 'replace':
                    chars[idx] = random.choice('abcdefghijklmnopqrstuvwxyz')
                elif op == 'delete':
                    chars[idx] = ''
            return "".join(chars)

        severity_map = {
            "light": 0.05,
            "medium": 0.15,
            "heavy": 0.30
        }
        severity = severity_map.get(level, 0.15)
        
        # Create adversarial dataset
        adv_dataset = []
        for item in dataset:
            adv_dataset.append({
                "input": inject_noise(item["input"], severity),
                "output": item["output"]
            })
            
        # Run evaluation on clean and adversarial
        clean_res = self.evaluator.run_evaluation(dataset, [prompt], model_func)
        adv_res = self.evaluator.run_evaluation(adv_dataset, [prompt], model_func)
        
        clean_score = clean_res.get("prompt_0", {}).get("accuracy", 0)
        adv_score = adv_res.get("prompt_0", {}).get("accuracy", 0)
        
        return {
            "robustness_score": adv_score / clean_score if clean_score > 0 else 0,
            "performance_delta": adv_score - clean_score,
            "variations": ["clean", "adversarial"],
            "adversarial_tests": [
                {
                    "type": "Clean",
                    "score": clean_score,
                    "description": "Original dataset",
                    "impact": 0
                },
                {
                    "type": f"Adversarial ({level})",
                    "score": adv_score,
                    "description": f"Injected {int(severity*100)}% noise",
                    "impact": (clean_score - adv_score) / clean_score * 100 if clean_score > 0 else 0
                }
            ]
        }
