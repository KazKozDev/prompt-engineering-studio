"""
Production Telemetry Module.

This module provides functionality to track and analyze production usage metrics.
For demonstration purposes, this module generates mock data to simulate a production environment.
"""
from typing import List, Dict, Any
import random
from datetime import datetime, timedelta

class TelemetryManager:
    """Manages production telemetry and metrics."""

    def get_dashboard_metrics(self, time_range: str = "7d") -> Dict[str, Any]:
        """
        Get aggregated metrics for the dashboard.
        
        Args:
            time_range: Time range to filter (e.g., "24h", "7d", "30d").
            
        Returns:
            Dictionary with metrics and time-series data.
        """
        # Mock data generation
        now = datetime.now()
        days = 7 if time_range == "7d" else 30
        
        dates = [(now - timedelta(days=i)).strftime("%Y-%m-%d") for i in range(days)]
        dates.reverse()
        
        # Simulate metrics for two prompt versions
        v1_accept_rate = [0.7 + random.uniform(-0.05, 0.05) for _ in range(days)]
        v2_accept_rate = [0.8 + random.uniform(-0.05, 0.05) for _ in range(days)]
        
        v1_ttr = [45 + random.uniform(-5, 10) for _ in range(days)] # seconds
        v2_ttr = [35 + random.uniform(-5, 5) for _ in range(days)]
        
        return {
            "summary": {
                "total_requests": 12543,
                "avg_accept_rate": 0.78,
                "avg_ttr": 38.5,
                "active_prompts": 2
            },
            "charts": {
                "dates": dates,
                "accept_rate": {
                    "v1": v1_accept_rate,
                    "v2": v2_accept_rate
                },
                "time_to_resolution": {
                    "v1": v1_ttr,
                    "v2": v2_ttr
                }
            },
            "alerts": [
                {
                    "type": "warning",
                    "message": "Drift detected in Prompt V1: Accept rate dropped by 5% yesterday.",
                    "timestamp": (now - timedelta(days=1)).isoformat()
                }
            ]
        }
