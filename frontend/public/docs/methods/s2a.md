# System 2 Attention (S2A)

**Focus on what matters.** S2A improves accuracy by asking the LLM to rewrite the input context, removing irrelevant or distracting information, before attempting to answer.

## The Core Idea

LLMs are easily distracted by irrelevant text ("sycophancy") or misleading opinions in the prompt. Standard attention (System 1) attends to everything. S2A forces a "System 2" process: deliberate filtering.

1.  **Analyze:** Look at the input text.
2.  **Filter:** Rewrite the input to keep only the facts relevant to the question.
3.  **Solve:** Answer using the clean, rewritten context.

> "S2A... regenerates the input context to only include the relevant portions... significantly outperforming standard prompting on QA and math tasks containing irrelevant context." — *Weston & Sukhbaatar (Meta AI, 2023)*

## Production Implementation

### The Prompt Pattern

```text
Context: [Long text with some relevant facts and a lot of noise/opinions]
Question: [Specific Question]

Task:
1. Read the context and question.
2. Rewrite the context to remove all information that is not useful for answering the question. Remove opinions and distractions.
3. Answer the question using the rewritten context.

Rewritten Context:
...

Answer:
...
```

## Best For
*   **RAG:** Cleaning up retrieved chunks that contain noise.
*   **Long Context:** Helping the model focus when the prompt is huge.
*   **Bias Removal:** Removing subjective opinions from a text before analysis.

## Watch Out
*   **Over-filtering:** The model might accidentally remove a subtle but important detail.
*   **Cost:** Rewriting the context consumes tokens (input + output).

## Reference
*   **Paper:** System 2 Attention (is something you might need too)
*   **Authors:** Jason Weston, Sainbayar Sukhbaatar (Meta AI)
*   **ArXiv:** [2311.11829](https://arxiv.org/abs/2311.11829)
