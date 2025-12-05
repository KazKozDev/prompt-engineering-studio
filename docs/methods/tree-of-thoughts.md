# Tree of Thoughts (ToT): Deliberate Problem Solving

> **Deep Dive Guide** | [← Back to Methods Library](../getting-started/11-methods-library.md)

**Category:** Planning & Search
**Best for:** Strategic games, creative writing with constraints, complex planning
**Original paper:** ["Tree of Thoughts: Deliberate Problem Solving with Large Language Models" (Yao et al., 2023)](https://arxiv.org/abs/2305.10601)

This is a **detailed implementation guide** with direct paper quotes, production patterns, and analysis for integrating Tree of Thoughts into your workflows.

---

## 1. Core Idea

Tree of Thoughts (ToT) generalizes Chain-of-Thought by allowing the model to explore multiple reasoning paths (thoughts) simultaneously. It treats problem solving as a search over a tree, where each node is a partial solution ("thought"). The model generates potential next steps, evaluates them, and decides whether to explore further or backtrack.

> "ToT maintains a tree of thoughts, where each thought serves as an intermediate step... enables the LM to self-evaluate the progress intermediate thoughts make towards solving the problem." — *Yao et al., 2023*

## 2. Why It Matters for Production

Chain-of-Thought is linear and cannot correct early mistakes. ToT enables "lookahead" and "backtracking," allowing the model to recover from errors and find global optima rather than getting stuck in local paths.

*   **Solves Hard Problems:** Achieved 74% success in Game of 24 (vs 4% with CoT).
*   **Structured Search:** Brings classical AI search algorithms (BFS, DFS) to LLMs.

## 3. How It Works

ToT involves four components:
1.  **Thought Decomposition:** Break the problem into steps (e.g., writing a paragraph, solving an equation part).
2.  **Thought Generator:** Generate $k$ candidate next steps.
3.  **State Evaluator:** Evaluate each candidate state (e.g., "Sure/Maybe/Impossible" or a score 1-10).
4.  **Search Algorithm:** Use Breadth-First Search (BFS) or Depth-First Search (DFS) to navigate the tree.

> "ToT allows LLMs to perform deliberate decision making by considering multiple different reasoning paths and self-evaluating choices to decide the next course of action." — *Yao et al., 2023*

## 4. When to Use (and When Not To)

| Use When | Avoid When |
| :--- | :--- |
| The problem requires planning or "lookahead" (e.g., Sudoku, Crosswords). | The task is linear or simple (e.g., translation). |
| Initial decisions significantly impact future possibilities. | Latency constraints are tight (ToT is very slow). |
| Standard CoT fails repeatedly. | Token budget is limited (ToT consumes massive tokens). |

## 5. Implementation in PE Studio

Full ToT usually requires an external controller (Python script) to manage the tree. However, you can simulate a **"Prompted ToT"** in PE Studio:

1.  **Generator Prompting (Step-by-Step Evaluation):**
    *   **Step 1:** "Generate 3 possible first steps for [Problem]." -> Output: A, B, C.
    *   **Step 2:** "For each option A, B, C, evaluate if it is possible to reach the goal. Assign a score." -> Output: A(bad), B(good), C(maybe).
    *   **Step 3:** "Select B. Now generate 3 possible next steps from B."
    
    *This manual "Human-in-the-loop" approach mimics the Search Algorithm.*

2.  **Variables:**
    *   Use variables to store the current "State" and inject it into the next prompt.

## 6. Cost & Risk Considerations

*   **Extreme Cost:** ToT can easily consume 100x the tokens of a standard call because it generates and evaluates multiple branches at every step.
*   **Complexity:** Hard to implement purely via prompt engineering; usually requires code (like the `dspy` or `langchain` implementations).

## 7. Advanced Techniques

*   **ToT-DFS vs ToT-BFS:** DFS is better for finding *any* solution; BFS is better for finding the *best* solution.
*   **Monte Carlo Tree Search (MCTS):** A more advanced version (e.g., in AlphaGo) can be applied if a rigorous reward signal exists.

## 8. Links to Original Research

*   [Tree of Thoughts: Deliberate Problem Solving with Large Language Models (arXiv)](https://arxiv.org/abs/2305.10601)
*   [Official GitHub Repository (Princeton NLP)](https://github.com/princeton-nlp/tree-of-thoughts)

## 9. Quick Reference Card

| Feature | Details |
| :--- | :--- |
| **Acronym** | ToT |
| **Key Phrase** | "Generate, Evaluate, Search" |
| **Key Paper** | Yao et al. (Princeton/Google, 2023) |
| **Cost Impact** | Extreme |
| **Latency** | Very High |


