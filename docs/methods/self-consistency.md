# Self-Consistency (SC): Reliability via Majority Vote

> **Deep Dive Guide** | [← Back to Methods Library](../getting-started/11-methods-library.md)

**Category:** Reliability & Robustness
**Best for:** Ambiguous reasoning, eliminating randomness, high-stakes decisions
**Original paper:** ["Self-Consistency Improves Chain of Thought Reasoning in Language Models" (Wang et al., 2023)](https://arxiv.org/abs/2203.11171)

This is a **detailed implementation guide** with direct paper quotes, production patterns, and analysis for integrating Self-Consistency into your workflows.

---

## 1. Core Idea

Self-Consistency is an ensemble strategy that builds upon Chain-of-Thought (CoT). Instead of taking the greedy (single most likely) output, it samples a diverse set of reasoning paths and selects the most consistent answer (the mode of the distribution).

> "Self-consistency leverages the intuition that a complex reasoning problem typically admits multiple different ways of thinking leading to its unique correct answer." — *Wang et al., 2023*

## 2. Why It Matters for Production

LLMs are stochastic. For complex chains of reasoning, a single mistake in the chain can derail the final answer. Self-Consistency overcomes this by "marginalizing out" the reasoning paths. If 7 out of 10 paths lead to "Answer: 42", but 3 lead to "Answer: 24", you can trust "42" with higher confidence.

*   **Boosts Accuracy:** 10-20% improvements on benchmarks like GSM8K and Code generation.
*   **Confidence Proxy:** The % agreement (e.g., 70% agreement) serves as a confidence score.

## 3. How It Works

1.  **Prompt:** Use a Chain-of-Thought prompt.
2.  **Sample:** Run the model $k$ times (e.g., $k=5$ or $k=10$) with a non-zero temperature (e.g., $T=0.7$) to generate diverse outputs.
3.  **Aggregrate:** Extract the final answer from each output and take a majority vote.

> "The idea is to sample a diverse set of outputs from a language model and return the most consistent answer in the set." — *Wang et al., 2023*

## 4. When to Use (and When Not To)

| Use When | Avoid When |
| :--- | :--- |
| Accuracy is more important than cost/speed. | Response time must be sub-second. |
| The problem has a definitive "correct" answer (math, code, facts). | The task is creative (generating a poem) where "consistency" isn't defined. |
| You need a confidence metric. | Budget is tight (costs scale linearly with $k$). |

## 5. Implementation in PE Studio

In **Prompt Engineering Studio**, you can simulate Self-Consistency manually or via scripts:

1.  **Generator Settings:**
    *   Set **Temperature** to `0.7` (not `0`).
    *   Set **Top-P** to `0.9` for diversity.

2.  **Manual Check:**
    *   Click "Generate" multiple times (e.g., 5 times) for the same prompt.
    *   Manually inspect if the final answers align.

3.  **Automated (Custom Script):**
    *   If using the PE Studio API or local runner, wrap the generation call in a loop:
    ```python
    answers = []
    for _ in range(5):
        response = generate(prompt, temperature=0.7)
        answers.append(extract_answer(response))
    final_answer = mode(answers)
    ```

## 6. Cost & Risk Considerations

*   **Multiplicative Cost:** Costs scale linearly with the number of samples ($k$). Running 10 samples = 10x cost.
*   **Latency:** Latency increases unless requests are parallelized.
*   **Diminishing Returns:** Usually, $k=5$ or $k=10$ captures most of the gain. Going to $k=40$ adds little value for high cost.

## 7. Advanced Techniques

*   **Weighted Consistency:** Weight the votes by the model's log-probability (if available), though unweighted voting is often robust enough.
*   **Diversity Prompting:** Use different prompt templates for each sample to increase diversity of reasoning paths.

## 8. Links to Original Research

*   [Self-Consistency Improves Chain of Thought Reasoning in Language Models (arXiv)](https://arxiv.org/abs/2203.11171)

## 9. Quick Reference Card

| Feature | Details |
| :--- | :--- |
| **Acronym** | SC |
| **Key Phrase** | "Sample-and-vote" |
| **Key Paper** | Wang et al. (Google Research, 2022/23) |
| **Cost Impact** | Very High (linear with $k$) |
| **Latency** | High (unless parallelized) |


