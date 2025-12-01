# Datasets: Upload and Manage Evaluation Data

## Overview

**Datasets** are collections of test cases used to systematically evaluate prompt performance. This section allows you to create, import, and manage datasets for comprehensive prompt testing.

## Quick Start

### 1. View Datasets

**Location:** Main panel → Datasets list

The interface shows:
- **Your Datasets** — Custom datasets you've created
- **Example Datasets** — Pre-built datasets for common use cases
- **Dataset cards** — Each showing name, size, description, and actions

### 2. Create a New Dataset

**Location:** Top right → "New Dataset" button

#### Manual Creation

1. Click **"New Dataset"**
2. Fill in details:
   - **Name:** Descriptive identifier (e.g., "Customer Support Q&A")
   - **Description:** Purpose and contents
   - **Category:** Task type (General, Reasoning, Coding, etc.)
3. Add test cases:
   - **Input:** The prompt or query
   - **Expected Output:** (Optional) Ground truth for evaluation
   - **Metadata:** (Optional) Tags, difficulty level, category
4. Click **"Add Row"** for each test case
5. Click **"Save Dataset"**

#### Upload from File

**Supported formats:**

**JSON format:**
```json
{
  "name": "Customer Support Dataset",
  "description": "Common customer queries",
  "test_cases": [
    {
      "input": "How do I return a product?",
      "expected_output": "Our return policy allows...",
      "metadata": {"category": "returns", "difficulty": "easy"}
    },
    {
      "input": "My order hasn't arrived",
      "expected_output": "Let me help you track...",
      "metadata": {"category": "shipping", "difficulty": "medium"}
    }
  ]
}
```

**CSV format:**
```csv
input,expected_output,category,difficulty
"How do I return a product?","Our return policy allows...","returns","easy"
"My order hasn't arrived","Let me help you track...","shipping","medium"
```

**Steps:**
1. Click **"Upload Dataset"**
2. Select `.json` or `.csv` file
3. Preview imported data
4. Adjust field mappings if needed
5. Click **"Import"**

### 3. Use Example Datasets

**Location:** Main panel → Example Datasets section

**Available examples:**

1. **Customer Support** (50 cases)
   - Common support queries
   - Refunds, shipping, account issues
   
2. **Sentiment Analysis** (100 cases)
   - Product reviews
   - Social media posts
   - Labeled: Positive/Neutral/Negative

3. **Code Review** (30 cases)
   - Code snippets with bugs
   - Security vulnerabilities
   - Best practice violations

4. **Translation** (40 cases)
   - English → Spanish/French/German
   - Various domains (technical, casual, formal)

5. **Summarization** (25 cases)
   - Research abstracts
   - News articles
   - Meeting notes

**To use:**
1. Click **"Preview"** to view contents
2. Click **"Import to My Datasets"** to create editable copy
3. Customize as needed

### 4. Manage Datasets

**Actions per dataset:**

- **Edit** — Modify name, description, test cases
- **Duplicate** — Create a copy for variations
- **Export** — Download as JSON/CSV
- **Delete** — Remove dataset (with confirmation)
- **View Stats** — See size, creation date, usage count

## Dataset Best Practices

### Size Guidelines

- **Minimum:** 10 test cases for basic evaluation
- **Recommended:** 30-50 cases for reliable metrics
- **Comprehensive:** 100+ cases for production validation

**Quality over quantity:** 30 well-chosen diverse cases > 100 similar cases

### Diversity and Coverage

Include test cases that cover:

1. **Happy path** — Typical, well-formed inputs
2. **Edge cases** — Boundary conditions, unusual inputs
3. **Error cases** — Invalid or malformed inputs
4. **Ambiguous cases** — Multiple valid interpretations
5. **Complexity range** — Simple to complex examples

**Example for code review dataset:**
```
✅ GOOD COVERAGE:
- Simple syntax error (easy)
- SQL injection vulnerability (medium)
- Race condition in async code (hard)
- Memory leak in loop (medium)
- Deprecated API usage (easy)

❌ POOR COVERAGE:
- 50 different syntax errors
- All easy cases
- No security issues
- No performance problems
```

### Expected Outputs

**When to include:**
- **Required for:** Accuracy metrics, automated evaluation
- **Optional for:** Qualitative review, human evaluation
- **Not needed for:** Exploratory testing, creative tasks

**Types of expected outputs:**

1. **Exact match:** Specific correct answer
   ```json
   {"input": "2 + 2 = ?", "expected_output": "4"}
   ```

2. **Pattern match:** Regex or contains check
   ```json
   {"input": "List Python frameworks", "expected_output": "CONTAINS: Django, Flask"}
   ```

3. **Semantic match:** Meaning equivalence
   ```json
   {"input": "Explain photosynthesis", "expected_output": "SEMANTIC: Plants convert light to energy using chlorophyll"}
   ```

4. **Multiple valid answers:**
   ```json
   {"input": "Name a color", "expected_output": ["red", "blue", "green", "yellow"]}
   ```

### Metadata and Tags

**Useful metadata fields:**

- **Difficulty:** `easy`, `medium`, `hard`
- **Category:** Task-specific grouping
- **Priority:** `critical`, `high`, `normal`, `low`
- **Source:** Where the test case came from
- **Expected_tokens:** Approximate output length
- **Language:** For multilingual datasets

**Benefits:**
- Filter datasets by difficulty
- Track performance on specific categories
- Prioritize critical test cases
- Analyze results by metadata dimensions

## Common Dataset Types

### 1. Question Answering

**Structure:**
```json
{
  "input": "What is the capital of France?",
  "expected_output": "Paris",
  "metadata": {"type": "factual", "difficulty": "easy"}
}
```

**Best for:** Knowledge retrieval, factual accuracy testing

### 2. Classification

**Structure:**
```json
{
  "input": "This product is amazing! Best purchase ever!",
  "expected_output": "positive",
  "metadata": {"category": "sentiment", "confidence": "high"}
}
```

**Best for:** Sentiment analysis, categorization, intent detection

### 3. Generation

**Structure:**
```json
{
  "input": "Write a haiku about coding",
  "expected_output": null,
  "metadata": {"type": "creative", "evaluation": "human_review"}
}
```

**Best for:** Creative writing, content generation (manual evaluation)

### 4. Transformation

**Structure:**
```json
{
  "input": "The quick brown fox jumps over the lazy dog",
  "expected_output": "El rápido zorro marrón salta sobre el perro perezoso",
  "metadata": {"source_lang": "en", "target_lang": "es"}
}
```

**Best for:** Translation, summarization, reformatting

### 5. Code Tasks

**Structure:**
```json
{
  "input": "def add(a, b):\\n    return a - b",
  "expected_output": "Bug: Function named 'add' performs subtraction. Change 'a - b' to 'a + b'",
  "metadata": {"bug_type": "logic_error", "severity": "high"}
}
```

**Best for:** Code review, bug detection, refactoring

## Advanced Features

### Dataset Versioning

Track changes to datasets over time:

1. **Auto-versioning:** Each edit creates new version
2. **Version history:** View all past versions
3. **Rollback:** Restore previous version
4. **Compare versions:** See what changed

**Access:** Dataset menu → "Version History"

### Dataset Splitting

Split datasets for different purposes:

- **Training set** (60%) — For few-shot examples
- **Validation set** (20%) — For prompt tuning
- **Test set** (20%) — For final evaluation

**Access:** Dataset menu → "Split Dataset"

### Batch Import

Import multiple datasets at once:

1. Prepare folder with multiple JSON/CSV files
2. Click "Batch Import"
3. Select folder
4. Review and confirm imports

### Dataset Merging

Combine multiple datasets:

1. Select 2+ datasets (checkboxes)
2. Click "Merge Selected"
3. Choose merge strategy:
   - **Union:** All unique test cases
   - **Intersection:** Only common cases
   - **Append:** Concatenate all cases
4. Name merged dataset

## Integration with Evaluation

### Running Evaluations

From Datasets view:

1. Select a dataset
2. Click **"Evaluate with this dataset"**
3. Redirects to Evaluation Lab with dataset pre-loaded
4. Choose prompts to test
5. Run evaluation

### Viewing Results

After evaluation:

1. Dataset card shows **"Last Evaluated"** timestamp
2. Click **"View Results"** → See latest evaluation metrics
3. **Performance badge:** Green (>80%), Yellow (50-80%), Red (<50%)

## Workflow Example

### Creating a Production Dataset

**Scenario:** Testing customer support chatbot prompts

**Step 1: Collect real queries**
```bash
# Export from support system
# Anonymize customer data
# Sample diverse cases
```

**Step 2: Create dataset**
```json
{
  "name": "Support Bot - Production Cases",
  "description": "Real customer queries from Q4 2024",
  "test_cases": [
    {
      "input": "I was charged twice for order #12345",
      "expected_output": "I apologize for the double charge. Let me check your order #12345...",
      "metadata": {
        "category": "billing",
        "priority": "high",
        "expected_sentiment": "empathetic"
      }
    }
    // ... 49 more cases
  ]
}
```

**Step 3: Test prompts**
1. Go to Evaluation Lab
2. Load dataset
3. Test 3-5 prompt variants
4. Compare results

**Step 4: Iterate**
1. Identify failing cases
2. Add similar cases to dataset
3. Improve prompts
4. Re-evaluate

**Step 5: Deploy**
1. Final evaluation: >90% success rate
2. Save winning prompt to Library
3. Monitor with Production Metrics

## Best Practices

✅ **DO:**
- Start with example datasets to understand structure
- Include diverse, representative test cases
- Add expected outputs for automated evaluation
- Use metadata for filtering and analysis
- Version datasets when making significant changes
- Test prompts on datasets before production

❌ **DON'T:**
- Create datasets with only easy cases
- Use tiny datasets (<10 cases) for production decisions
- Include personally identifiable information (PII)
- Duplicate test cases unnecessarily
- Skip validation of imported data
- Delete datasets that are referenced in evaluations

## Troubleshooting

**Problem:** "Import failed - invalid format"
- **Solution:** Check JSON syntax, ensure required fields (input), validate CSV headers

**Problem:** "Dataset too large - slow to load"
- **Solution:** Split into smaller datasets, use pagination, filter by metadata

**Problem:** "Can't delete dataset"
- **Solution:** Dataset is used in active evaluations. Archive evaluations first.

**Problem:** "Expected outputs don't match evaluation results"
- **Solution:** Check evaluation metric settings (exact vs. semantic match)

## Next Steps

1. **Create your first dataset** → Click "New Dataset"
2. **Run evaluation** → Go to TEST: Evaluation
3. **Compare prompts** → Use dataset to A/B test
4. **Monitor production** → Track dataset performance over time

---

**Related Sections:**
- [Evaluation](#) — Test prompts with datasets
- [Generator](#) — Create prompts to test
- [Library](#) — Save tested prompts
