# Step-Back Prompting

**Abstraction is key.** Step-Back Prompting improves reasoning by asking the model to first answer a high-level, abstract version of the question before tackling the specific details.

## The Core Idea

Humans often solve hard problems by stepping back and recalling a general principle.
Instead of answering "What is the velocity of a ball...", we first recall "What is the formula for velocity?".

Step-Back Prompting forces the LLM to do this explicitly:
1.  **Abstraction:** Derive a high-level question from the specific query.
2.  **Reasoning:** Answer the high-level question to retrieve principles/concepts.
3.  **Grounding:** Use that answer to solve the original specific query.

> "We introduce Step-Back Prompting... enabling LLMs to do abstraction... significantly improving performance on STEM, Knowledge QA, and Multi-Hop Reasoning." — *Zheng et al. (Google DeepMind, 2023)*

## Production Implementation

### The Prompt Pattern
You can do this in two steps or one combined prompt.

```text
Original Question: Estella Leopold went to school in which city?

Step 1 (Step-Back): What is the education history of Estella Leopold?
Answer 1: Estella Leopold received her Ph.D. from Yale University in New Haven...

Step 2 (Final Answer): Based on the education history above, Estella Leopold went to school in New Haven.
```

### Single-Prompt Template
```text
Question: [Your Question]

Task:
1. Write a more general, abstract question that covers the principles needed to answer the specific question above.
2. Answer that abstract question.
3. Use that answer to solve the original question.

Final Answer:
```

## Best For
*   **Complex QA:** Questions requiring specific facts that might be obscure.
*   **Science/Physics:** Solving problems where recalling the correct formula is 90% of the work.
*   **History:** "Did X and Y ever meet?" -> Step back: "When did X and Y live?"

## Watch Out
*   **Relevance:** Sometimes the step-back question is too broad to be useful.
*   **Latency:** Adds an extra generation step.

## Reference
*   **Paper:** Take a Step Back: Evoking Reasoning via Abstraction in Large Language Models
*   **Authors:** Huaixiu Steven Zheng, Swaroop Mishra, et al. (Google DeepMind)
*   **ArXiv:** [2310.06117](https://arxiv.org/abs/2310.06117)
