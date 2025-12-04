# Advanced Evaluation Features

## Overview

This document describes the newly implemented advanced evaluation features for Prompt Engineering Studio.

## New Features

### 1. Advanced Metrics

#### BERTScore
- **What:** Embedding-based semantic similarity using BERT models
- **Why:** More accurate than n-gram metrics (BLEU/ROUGE) for semantic equivalence
- **Use Case:** Evaluate if two texts have the same meaning, even with different wording
- **API Endpoint:** `POST /api/evaluation/advanced/bertscore`
- **Dependencies:** `sentence-transformers>=2.2.0`

**Example:**
```python
{
  "prediction": "The cat sat on the mat",
  "reference": "A feline rested on the rug"
}
# Returns: {"score": 0.85, "details": {...}}
```

#### Perplexity
- **What:** Language model confidence measurement
- **Why:** Indicates how natural/fluent the generated text is
- **Use Case:** Detect unnatural or low-quality generations
- **API Endpoint:** `POST /api/evaluation/advanced/perplexity`
- **Dependencies:** `transformers>=4.30.0, torch>=2.0.0`

**Example:**
```python
{
  "text": "The quick brown fox jumps over the lazy dog"
}
# Returns: {"perplexity": 15.3, "details": {...}}
# Lower perplexity = more natural text
```

#### Advanced Semantic Similarity
- **What:** Deep semantic understanding using sentence embeddings
- **Why:** Better than simple Jaccard similarity for meaning comparison
- **Use Case:** Compare semantic similarity without exact word matches
- **API Endpoint:** `POST /api/evaluation/advanced/semantic-similarity`
- **Dependencies:** `sentence-transformers>=2.2.0`

**Example:**
```python
{
  "text1": "I love programming",
  "text2": "Coding is my passion"
}
# Returns: {"similarity": 0.78, "details": {...}}
```

---

### 2. Evaluation History

Track all evaluation runs over time with full analytics.

#### Features:
- **Save Evaluations:** Store every evaluation run with full metadata
- **Regression Detection:** Automatically detect when metrics drop below baseline
- **Trend Analysis:** Visualize metric changes over time
- **Prompt Comparison:** Compare multiple prompts on the same metric

#### API Endpoints:

**Save Evaluation:**
```http
POST /api/evaluation/advanced/history/save
{
  "prompt_id": "prompt_v1",
  "prompt_text": "...",
  "dataset_id": "dataset_123",
  "dataset_name": "Test Dataset",
  "metrics": {
    "accuracy": 0.85,
    "bleu": 0.72,
    "bertscore": 0.88
  },
  "metadata": {
    "model": "gpt-4",
    "temperature": 0.7
  }
}
```

**Get Prompt History:**
```http
GET /api/evaluation/advanced/history/prompt/{prompt_id}?limit=20
```

**Detect Regression:**
```http
POST /api/evaluation/advanced/history/regression
{
  "prompt_id": "prompt_v1",
  "metric_name": "accuracy",
  "threshold": 0.05,  // 5% drop triggers alert
  "window": 5         // Compare last 5 runs to baseline
}
# Returns:
{
  "regression_detected": true,
  "recent_average": 0.78,
  "baseline_average": 0.85,
  "drop_percentage": 0.082,
  "severity": "high"
}
```

**Get Metric Trend:**
```http
GET /api/evaluation/advanced/history/trend/{prompt_id}/{metric_name}?limit=20
# Returns time-series data for visualization
```

---

### 3. Response Caching

Intelligent caching system to avoid redundant LLM calls during evaluation.

#### Features:
- **Hash-Based Caching:** Cache key = hash(prompt + model + settings)
- **TTL Support:** Configurable time-to-live (default: 24 hours)
- **Disk Persistence:** Survives application restarts
- **Cache Statistics:** Track hit rate and performance

#### Usage in Code:

```python
from src.evaluator import ResponseCache

cache = ResponseCache(ttl_hours=24)

# Try to get cached response
cached = cache.get(
    prompt="What is AI?",
    model="gpt-4",
    provider="openai",
    temperature=0.7
)

if cached:
    response = cached  # Use cached response
else:
    response = llm.generate(prompt)  # Call LLM
    cache.set(prompt, model, provider, response, temperature=0.7)
```

#### API Endpoints:

**Get Cache Stats:**
```http
GET /api/evaluation/advanced/cache/stats
# Returns:
{
  "hits": 150,
  "misses": 50,
  "hit_rate": 0.75,
  "memory_entries": 100,
  "disk_entries": 250,
  "total_mb": 12.5
}
```

**Clear Cache:**
```http
POST /api/evaluation/advanced/cache/clear
```

**Clear Expired:**
```http
POST /api/evaluation/advanced/cache/clear-expired
```

---

## Installation

### Basic Installation (No Advanced Metrics)
```bash
pip install -r requirements.txt
```

### Full Installation (With Advanced Metrics)
```bash
pip install -r requirements.txt
pip install sentence-transformers>=2.2.0 transformers>=4.30.0 torch>=2.0.0 numpy>=1.24.0
```

**Note:** First run will download models (~500MB). Models are cached locally.

---

## Performance Considerations

### BERTScore & Semantic Similarity
- **CPU:** ~100ms per comparison
- **GPU:** ~20ms per comparison
- **Batch processing:** Significantly faster (use batch endpoints)

### Perplexity
- **CPU:** ~200ms per text (512 tokens)
- **GPU:** ~50ms per text
- **Model:** Uses GPT-2 by default (lightweight)

### Caching Benefits
- **Without cache:** 1000 evaluations = 1000 LLM calls
- **With cache (75% hit rate):** 1000 evaluations = 250 LLM calls
- **Cost savings:** ~75% reduction in API costs
- **Speed improvement:** ~10x faster for repeated evaluations

---

## Use Cases

### 1. Continuous Evaluation
```python
# Save every evaluation run
for prompt_version in prompt_versions:
    results = evaluate(prompt_version, dataset)
    eval_history.save_evaluation(
        prompt_id=prompt_version.id,
        metrics=results,
        ...
    )
    
    # Check for regression
    regression = eval_history.detect_regression(
        prompt_id=prompt_version.id,
        metric_name="accuracy",
        threshold=0.05
    )
    
    if regression["regression_detected"]:
        alert_team(regression)
```

### 2. A/B Testing with History
```python
# Compare two prompt versions
comparison = eval_history.compare_prompts(
    prompt_ids=["prompt_a", "prompt_b"],
    metric_name="bertscore",
    limit=10
)

best_prompt = comparison["best_prompt"]
print(f"Winner: {best_prompt['id']} with score {best_prompt['score']}")
```

### 3. Iterative Development with Caching
```python
# First run: calls LLM
results1 = evaluate_with_cache(prompt_v1, dataset)  # 100 LLM calls

# Modify prompt slightly
prompt_v2 = modify_prompt(prompt_v1)

# Second run: uses cache for unchanged examples
results2 = evaluate_with_cache(prompt_v2, dataset)  # Only 20 new LLM calls
```

---

## API Status Check

Check if advanced features are available:

```http
GET /api/evaluation/advanced/status
# Returns:
{
  "advanced_metrics_available": true,
  "features": {
    "bertscore": true,
    "perplexity": true,
    "semantic_similarity": true,
    "evaluation_history": true,
    "response_cache": true
  }
}
```

---

## Migration Guide

### Existing Code
```python
# Old way
result = calculate_bleu(prediction, reference)
```

### New Code (Backward Compatible)
```python
# Still works
result = calculate_bleu(prediction, reference)

# New advanced metrics (if installed)
from src.evaluator import ADVANCED_METRICS_AVAILABLE

if ADVANCED_METRICS_AVAILABLE:
    bertscore = calculate_bertscore(prediction, reference)
    perplexity = calculate_perplexity(prediction)
```

---

## Troubleshooting

### "Advanced metrics not available"
**Solution:** Install dependencies:
```bash
pip install sentence-transformers transformers torch numpy
```

### "Model download failed"
**Solution:** Check internet connection. Models are downloaded from HuggingFace Hub.

### "CUDA out of memory"
**Solution:** Use CPU or smaller batch sizes:
```python
calculator = BERTScoreCalculator(model_name="all-MiniLM-L6-v2")  # Smaller model
```

### Cache growing too large
**Solution:** Clear expired entries regularly:
```python
cache.clear_expired()  # Removes entries older than TTL
```

---

## Future Enhancements

- [ ] Custom BERTScore models
- [ ] Distributed caching (Redis)
- [ ] Real-time regression alerts
- [ ] Metric correlation analysis
- [ ] Automated A/B test statistical significance
- [ ] Export evaluation reports to PDF/Excel

---

## References

- **BERTScore Paper:** [arXiv:1904.09675](https://arxiv.org/abs/1904.09675)
- **Sentence Transformers:** [sbert.net](https://www.sbert.net/)
- **Perplexity Explained:** [HuggingFace Docs](https://huggingface.co/docs/transformers/perplexity)
