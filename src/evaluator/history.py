"""
Evaluation History Manager.

Tracks all evaluation runs, stores results, and provides analytics.
Enables regression detection and performance tracking over time.
"""

import json
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional
from dataclasses import dataclass, asdict
import statistics


@dataclass
class EvaluationRun:
    """Single evaluation run record."""
    id: str
    timestamp: str
    prompt_id: str
    prompt_text: str
    dataset_id: str
    dataset_name: str
    metrics: Dict[str, float]
    metadata: Dict[str, Any]
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return asdict(self)


class EvaluationHistoryManager:
    """
    Manages evaluation history storage and analytics.
    
    Features:
    - Store all evaluation runs
    - Track metrics over time
    - Detect regressions
    - Compare prompt versions
    - Generate trend reports
    """
    
    def __init__(self, storage_dir: str = "data/evaluation_history"):
        """
        Initialize history manager.
        
        Args:
            storage_dir: Directory to store evaluation history
        """
        self.storage_dir = Path(storage_dir)
        self.storage_dir.mkdir(parents=True, exist_ok=True)
        
        # Index file for quick lookups
        self.index_file = self.storage_dir / "index.json"
        self._load_index()
    
    def _load_index(self) -> None:
        """Load evaluation index."""
        if self.index_file.exists():
            with open(self.index_file, 'r') as f:
                self.index = json.load(f)
        else:
            self.index = {
                "runs": [],
                "prompts": {},
                "datasets": {}
            }
    
    def _save_index(self) -> None:
        """Save evaluation index."""
        with open(self.index_file, 'w') as f:
            json.dump(self.index, f, indent=2)
    
    def save_evaluation(
        self,
        prompt_id: str,
        prompt_text: str,
        dataset_id: str,
        dataset_name: str,
        metrics: Dict[str, float],
        metadata: Optional[Dict[str, Any]] = None
    ) -> str:
        """
        Save an evaluation run.
        
        Args:
            prompt_id: ID of the prompt
            prompt_text: Full prompt text
            dataset_id: ID of the dataset
            dataset_name: Name of the dataset
            metrics: Dictionary of metric scores
            metadata: Optional metadata (model, settings, etc.)
        
        Returns:
            Evaluation run ID
        """
        timestamp = datetime.now()
        run_id = f"{prompt_id}_{timestamp.strftime('%Y%m%d_%H%M%S')}"
        
        run = EvaluationRun(
            id=run_id,
            timestamp=timestamp.isoformat(),
            prompt_id=prompt_id,
            prompt_text=prompt_text,
            dataset_id=dataset_id,
            dataset_name=dataset_name,
            metrics=metrics,
            metadata=metadata or {}
        )
        
        # Save run file
        run_file = self.storage_dir / f"{run_id}.json"
        with open(run_file, 'w') as f:
            json.dump(run.to_dict(), f, indent=2)
        
        # Update index
        self.index["runs"].append({
            "id": run_id,
            "timestamp": run.timestamp,
            "prompt_id": prompt_id,
            "dataset_id": dataset_id
        })
        
        # Update prompt index
        if prompt_id not in self.index["prompts"]:
            self.index["prompts"][prompt_id] = []
        self.index["prompts"][prompt_id].append(run_id)
        
        # Update dataset index
        if dataset_id not in self.index["datasets"]:
            self.index["datasets"][dataset_id] = []
        self.index["datasets"][dataset_id].append(run_id)
        
        self._save_index()
        
        return run_id
    
    def get_evaluation(self, run_id: str) -> Optional[EvaluationRun]:
        """
        Get a specific evaluation run.
        
        Args:
            run_id: Evaluation run ID
        
        Returns:
            EvaluationRun or None if not found
        """
        run_file = self.storage_dir / f"{run_id}.json"
        if not run_file.exists():
            return None
        
        with open(run_file, 'r') as f:
            data = json.load(f)
        
        return EvaluationRun(**data)
    
    def get_prompt_history(
        self,
        prompt_id: str,
        limit: Optional[int] = None
    ) -> List[EvaluationRun]:
        """
        Get evaluation history for a specific prompt.
        
        Args:
            prompt_id: Prompt ID
            limit: Maximum number of runs to return (most recent first)
        
        Returns:
            List of evaluation runs
        """
        if prompt_id not in self.index["prompts"]:
            return []
        
        run_ids = self.index["prompts"][prompt_id]
        if limit:
            run_ids = run_ids[-limit:]
        
        runs = []
        for run_id in reversed(run_ids):
            run = self.get_evaluation(run_id)
            if run:
                runs.append(run)
        
        return runs
    
    def get_dataset_history(
        self,
        dataset_id: str,
        limit: Optional[int] = None
    ) -> List[EvaluationRun]:
        """
        Get evaluation history for a specific dataset.
        
        Args:
            dataset_id: Dataset ID
            limit: Maximum number of runs to return
        
        Returns:
            List of evaluation runs
        """
        if dataset_id not in self.index["datasets"]:
            return []
        
        run_ids = self.index["datasets"][dataset_id]
        if limit:
            run_ids = run_ids[-limit:]
        
        runs = []
        for run_id in reversed(run_ids):
            run = self.get_evaluation(run_id)
            if run:
                runs.append(run)
        
        return runs
    
    def get_all_runs(self, limit: Optional[int] = None) -> List[EvaluationRun]:
        """
        Get all evaluation runs.
        
        Args:
            limit: Maximum number of runs to return (most recent first)
        
        Returns:
            List of evaluation runs
        """
        run_ids = [r["id"] for r in self.index["runs"]]
        if limit:
            run_ids = run_ids[-limit:]
        
        runs = []
        for run_id in reversed(run_ids):
            run = self.get_evaluation(run_id)
            if run:
                runs.append(run)
        
        return runs
    
    def detect_regression(
        self,
        prompt_id: str,
        metric_name: str,
        threshold: float = 0.05,
        window: int = 5
    ) -> Dict[str, Any]:
        """
        Detect metric regression for a prompt.
        
        Args:
            prompt_id: Prompt ID to check
            metric_name: Metric to monitor (e.g., 'accuracy', 'bleu')
            threshold: Regression threshold (e.g., 0.05 = 5% drop)
            window: Number of recent runs to compare
        
        Returns:
            Dictionary with regression analysis
        """
        history = self.get_prompt_history(prompt_id, limit=window * 2)
        
        if len(history) < 2:
            return {
                "regression_detected": False,
                "reason": "Insufficient history"
            }
        
        # Get metric values
        values = []
        for run in history:
            if metric_name in run.metrics:
                values.append(run.metrics[metric_name])
        
        if len(values) < 2:
            return {
                "regression_detected": False,
                "reason": f"Metric '{metric_name}' not found in history"
            }
        
        # Compare recent window to baseline
        recent = values[:window]
        baseline = values[window:window*2] if len(values) > window else values[window:]
        
        if not baseline:
            baseline = values
        
        recent_avg = statistics.mean(recent)
        baseline_avg = statistics.mean(baseline)
        
        # Calculate drop percentage
        if baseline_avg > 0:
            drop_pct = (baseline_avg - recent_avg) / baseline_avg
        else:
            drop_pct = 0.0
        
        regression_detected = drop_pct > threshold
        
        return {
            "regression_detected": regression_detected,
            "metric": metric_name,
            "recent_average": round(recent_avg, 4),
            "baseline_average": round(baseline_avg, 4),
            "drop_percentage": round(drop_pct, 4),
            "threshold": threshold,
            "recent_runs": len(recent),
            "baseline_runs": len(baseline),
            "severity": "high" if drop_pct > threshold * 2 else "medium" if regression_detected else "none"
        }
    
    def get_metric_trend(
        self,
        prompt_id: str,
        metric_name: str,
        limit: int = 20
    ) -> Dict[str, Any]:
        """
        Get trend data for a specific metric.
        
        Args:
            prompt_id: Prompt ID
            metric_name: Metric to analyze
            limit: Number of runs to include
        
        Returns:
            Dictionary with trend data
        """
        history = self.get_prompt_history(prompt_id, limit=limit)
        
        timestamps = []
        values = []
        
        for run in reversed(history):
            if metric_name in run.metrics:
                timestamps.append(run.timestamp)
                values.append(run.metrics[metric_name])
        
        if not values:
            return {
                "metric": metric_name,
                "data_points": 0,
                "trend": "no_data"
            }
        
        # Calculate trend
        if len(values) >= 2:
            recent_half = values[len(values)//2:]
            older_half = values[:len(values)//2]
            
            recent_avg = statistics.mean(recent_half)
            older_avg = statistics.mean(older_half)
            
            if recent_avg > older_avg * 1.05:
                trend = "improving"
            elif recent_avg < older_avg * 0.95:
                trend = "declining"
            else:
                trend = "stable"
        else:
            trend = "insufficient_data"
        
        return {
            "metric": metric_name,
            "data_points": len(values),
            "timestamps": timestamps,
            "values": [round(v, 4) for v in values],
            "current": round(values[-1], 4) if values else 0.0,
            "average": round(statistics.mean(values), 4),
            "min": round(min(values), 4),
            "max": round(max(values), 4),
            "std": round(statistics.stdev(values), 4) if len(values) > 1 else 0.0,
            "trend": trend
        }
    
    def compare_prompts(
        self,
        prompt_ids: List[str],
        metric_name: str,
        limit: int = 10
    ) -> Dict[str, Any]:
        """
        Compare multiple prompts on a specific metric.
        
        Args:
            prompt_ids: List of prompt IDs to compare
            metric_name: Metric to compare
            limit: Number of recent runs per prompt
        
        Returns:
            Dictionary with comparison data
        """
        comparison = {}
        
        for prompt_id in prompt_ids:
            history = self.get_prompt_history(prompt_id, limit=limit)
            
            values = []
            for run in history:
                if metric_name in run.metrics:
                    values.append(run.metrics[metric_name])
            
            if values:
                comparison[prompt_id] = {
                    "average": round(statistics.mean(values), 4),
                    "min": round(min(values), 4),
                    "max": round(max(values), 4),
                    "std": round(statistics.stdev(values), 4) if len(values) > 1 else 0.0,
                    "runs": len(values)
                }
            else:
                comparison[prompt_id] = {
                    "average": 0.0,
                    "runs": 0,
                    "note": "No data"
                }
        
        # Find best prompt
        best_prompt = max(
            comparison.items(),
            key=lambda x: x[1].get("average", 0.0)
        )
        
        return {
            "metric": metric_name,
            "prompts": comparison,
            "best_prompt": {
                "id": best_prompt[0],
                "score": best_prompt[1].get("average", 0.0)
            }
        }
    
    def get_statistics(self) -> Dict[str, Any]:
        """
        Get overall statistics.
        
        Returns:
            Dictionary with statistics
        """
        return {
            "total_runs": len(self.index["runs"]),
            "unique_prompts": len(self.index["prompts"]),
            "unique_datasets": len(self.index["datasets"]),
            "most_evaluated_prompt": max(
                self.index["prompts"].items(),
                key=lambda x: len(x[1])
            )[0] if self.index["prompts"] else None,
            "most_used_dataset": max(
                self.index["datasets"].items(),
                key=lambda x: len(x[1])
            )[0] if self.index["datasets"] else None
        }
