# Chain-of-Verification (CoVe)

**Trust, but verify.** CoVe reduces hallucinations by forcing the model to draft an answer, plan verification questions to check its own work, answer them independently, and then produce a final verified response.

## The Core Idea

LLMs often confidently state falsehoods. CoVe breaks the generation process into four steps to catch these errors:

1.  **Baseline Response:** Generate a first draft (which might contain hallucinations).
2.  **Plan Verifications:** Generate a list of specific questions to fact-check the draft.
3.  **Execute Verifications:** Answer those questions (ideally using an external tool or a fresh context).
4.  **Final Verified Response:** Rewrite the answer incorporating the verification results.

> "CoVe... generates a baseline response, plans verification questions... answers them... and produces a final verified response. We find that independent verification questions are more accurate than the original long-form generation." — *Dhuliawala et al. (2023)*

## Production Implementation

### The Prompt Pattern (Simplified)
You can implement a "One-Shot CoVe" in a single prompt, though multi-step is better.

```text
Task: List 3 movies directed by Christopher Nolan before 2005.

Draft: Memento, Insomnia, The Prestige.

Verification Questions:
1. When was Memento released? (2000) - OK
2. When was Insomnia released? (2002) - OK
3. When was The Prestige released? (2006) - ERROR, > 2005.

Final Answer: Memento, Insomnia, Following.
```

## Best For
*   **Fact-Heavy Lists:** "List all politicians born in NY who served as VP."
*   **Bio Generation:** Writing biographies where dates and names must be correct.
*   **Medical/Legal:** High-stakes domains where accuracy is paramount.

## Watch Out
*   **Latency:** Increases generation time significantly (4x steps).
*   **Consistency:** The model might hallucinate the verification answers too (unless connected to Search).
*   **Complexity:** Best implemented as a pipeline, not a single prompt.

## Reference
*   **Paper:** Chain-of-Verification Reduces Hallucination in Large Language Models
*   **Authors:** Shehzaad Dhuliawala, Mojtaba Komeili, et al. (Meta AI)
*   **ArXiv:** [2309.11495](https://arxiv.org/abs/2309.11495)
