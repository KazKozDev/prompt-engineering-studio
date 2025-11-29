"""
Offline Quality Evaluator Module.

This module provides functionality to evaluate prompt quality against a dataset of correct answers.
It calculates metrics like Accuracy, F1 score, and Prompt Sensitivity.
"""
from typing import List, Dict, Any, Union
import statistics
from collections import Counter

class OfflineEvaluator:
    """Evaluates prompts against a dataset with ground truth."""

    def evaluate_accuracy(self, predictions: List[str], ground_truth: List[str]) -> float:
        """
        Calculate accuracy: fraction of predictions that match ground truth.
        
        Args:
            predictions: List of model outputs.
            ground_truth: List of expected correct answers.
            
        Returns:
            Accuracy score (0.0 to 1.0).
        """
        if not predictions or not ground_truth:
            return 0.0
        
        if len(predictions) != len(ground_truth):
            raise ValueError("Predictions and ground truth must have the same length")
            
        correct = 0
        for pred, truth in zip(predictions, ground_truth):
            # Simple exact match (case-insensitive, stripped)
            # In a real scenario, this might need fuzzy matching or LLM-as-a-judge
            if str(pred).strip().lower() == str(truth).strip().lower():
                correct += 1
                
        return correct / len(predictions)

    def calculate_f1(self, predictions: List[str], ground_truth: List[str]) -> float:
        """
        Calculate F1 score (macro-averaged for multi-class, or binary).
        For simplicity in this text-generation context, we'll treat unique answers as classes.
        """
        # This is a simplified F1 for text generation where we treat exact matches as TP
        # For a proper F1 in generation, we'd need token-level overlap or semantic similarity.
        # Here we reuse the accuracy logic for "correctness" but frame it as F1 for the "Correct" class.
        
        # Let's stick to a simple "Accuracy" as the primary metric for now as per requirements,
        # but provide a placeholder for F1 if we had classification tasks.
        return self.evaluate_accuracy(predictions, ground_truth)

    def evaluate_sensitivity(self, prompt_metrics: List[float]) -> Dict[str, float]:
        """
        Calculate prompt sensitivity metrics based on accuracy scores of multiple prompt variations.
        
        Args:
            prompt_metrics: List of accuracy scores for different variations of a prompt.
            
        Returns:
            Dictionary with spread, std, min, max, mean, median.
        """
        if not prompt_metrics:
            return {
                "spread": 0.0,
                "std": 0.0,
                "min": 0.0,
                "max": 0.0,
                "mean": 0.0,
                "median": 0.0
            }
            
        return {
            "spread": max(prompt_metrics) - min(prompt_metrics),
            "std": statistics.stdev(prompt_metrics) if len(prompt_metrics) > 1 else 0.0,
            "min": min(prompt_metrics),
            "max": max(prompt_metrics),
            "mean": statistics.mean(prompt_metrics),
            "median": statistics.median(prompt_metrics)
        }

    def run_evaluation(self, 
                      dataset: List[Dict[str, str]], 
                      prompts: List[str], 
                      model_func: Any) -> Dict[str, Any]:
        """
        Run a full evaluation for a list of prompts against a dataset.
        
        Args:
            dataset: List of dicts with 'input' and 'output' keys.
            prompts: List of prompt templates to evaluate.
            model_func: Function that takes (prompt, input) and returns a string response.
            
        Returns:
            Dictionary containing evaluation results.
        """
        results = {}
        
        all_accuracies = []
        
        for prompt_idx, prompt_template in enumerate(prompts):
            predictions = []
            ground_truth = []
            
            for item in dataset:
                input_text = item.get('input', '')
                expected = item.get('output', '')
                
                # Construct the full prompt
                full_prompt = prompt_template.replace('{{input}}', input_text)
                if '{{input}}' not in prompt_template:
                     full_prompt = f"{prompt_template}\n\nInput: {input_text}"
                
                # Get model prediction
                try:
                    response = model_func(full_prompt)
                except Exception as e:
                    response = "" # Handle error gracefully
                
                predictions.append(response)
                ground_truth.append(expected)
            
            accuracy = self.evaluate_accuracy(predictions, ground_truth)
            all_accuracies.append(accuracy)
            
            results[f"prompt_{prompt_idx}"] = {
                "template": prompt_template,
                "accuracy": accuracy,
                "predictions": predictions,
                "ground_truth": ground_truth
            }
            
        # Calculate sensitivity across the different prompts
        sensitivity = self.evaluate_sensitivity(all_accuracies)
        results["sensitivity_analysis"] = sensitivity
        
        return results
