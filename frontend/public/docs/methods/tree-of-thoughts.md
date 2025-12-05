# Tree of Thoughts (ToT)

**Deliberate problem solving.** ToT generalizes Chain-of-Thought by allowing the model to explore multiple reasoning paths simultaneously, look ahead, and backtrack if necessary.

## The Core Idea

If Chain-of-Thought is a single line of reasoning, Tree of Thoughts is a decision tree. The model generates multiple possible "next steps" (thoughts), evaluates each one (self-assessment), and decides which path to continue.

This mimics how humans solve puzzles (like Crosswords or 24 Game): "If I put 'A' here, does it fit? No, let me try 'B' instead."

> "ToT allows LMs to perform deliberate decision making by considering multiple different reasoning paths and self-evaluating choices to decide the next course of action." — *Yao et al. (2023)*

## Production Implementation

ToT usually requires an **orchestrator** (like a Python script or LangChain loop), not just a single prompt.

### The Algorithm
1.  **Decomposition:** Break the problem into steps (e.g., "Write paragraph 1", "Write paragraph 2").
2.  **Generation:** Generate 3-5 candidates for the current step.
3.  **Evaluation:** Ask the LLM to score each candidate (e.g., "Is this coherent? Score 1-10").
4.  **Selection:** Keep the best K candidates and repeat for the next step.

### Simplified Prompt-Based ToT
You can approximate ToT in a single prompt for simpler tasks:

```text
Imagine three different experts are answering this question.
All experts will write down 1 step of their thinking,
then share it with the group.
Then all experts will go on to the next step, etc.
If any expert realizes they're wrong at any point then they leave.
```

## Best For
*   **Creative Writing:** Writing a story where the plot needs to be consistent.
*   **Planning:** Itinerary generation, project scheduling.
*   **Coding:** System architecture design where early choices constrain later ones.

## Watch Out
*   **High Latency:** Requires multiple calls to the LLM (generation + evaluation).
*   **Complexity:** Harder to implement than CoT; usually needs code support.
*   **Cost:** Can be 10x-100x more expensive than a single call.

## Reference
*   **Paper:** Tree of Thoughts: Deliberate Problem Solving with Large Language Models
*   **Authors:** Shunyu Yao, Dian Yu, Jeffrey Zhao, et al. (Princeton & Google DeepMind)
*   **ArXiv:** [2305.10601](https://arxiv.org/abs/2305.10601)
