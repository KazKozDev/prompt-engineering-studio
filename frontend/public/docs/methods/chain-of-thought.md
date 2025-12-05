# Chain-of-Thought (CoT)

**The "Hello World" of reasoning.** Chain-of-Thought enables complex problem-solving by forcing the model to output intermediate reasoning steps before the final answer.

## The Core Idea

Standard prompting asks for an answer immediately (`Input -> Output`). CoT changes this to `Input -> Reasoning -> Output`.

This mimics human cognition: when solving a math word problem, you don't just shout the number; you calculate intermediate values first. By generating these steps, the model gives itself "time to think" and grounds its final answer in the logic it just produced.

> "We explore the ability of language models to perform complex reasoning... Chain-of-thought prompting allows models to decompose multi-step problems into intermediate steps." — *Wei et al. (2022)*

## Production Implementation

### Zero-Shot CoT
The simplest implementation. Just append a magic phrase to your prompt.
```text
Q: [Complex Question]
A: Let's think step by step.
```

### Manual Few-Shot CoT (Recommended)
Provide examples where the reasoning is explicitly written out. This is much more reliable for production.

```text
Q: Roger has 5 tennis balls. He buys 2 more cans of tennis balls. Each can has 3 tennis balls. How many tennis balls does he have now?
A: Roger started with 5 balls. 2 cans of 3 balls each is 6 balls. 5 + 6 = 11. The answer is 11.

Q: [Your Question]
A:
```

## Best For
*   **Math & Logic:** Word problems, symbolic reasoning.
*   **Classification:** Explaining *why* a text is "Negative" or "Spam" before labeling it.
*   **Coding:** Breaking down a function requirement before writing code.

## Watch Out
*   **Verbosity:** Increases token usage (and cost) significantly.
*   **Hallucinated Logic:** The model might write a correct chain of thought but make a calculation error in the middle, or write a plausible-sounding but wrong chain.
*   **Overkill:** Do not use for simple lookup tasks (e.g., "Capital of France"). It adds latency without benefit.

## Reference
*   **Paper:** Chain-of-Thought Prompting Elicits Reasoning in Large Language Models
*   **Authors:** Jason Wei, Xuezhi Wang, Dale Schuurmans, et al. (Google Research)
*   **ArXiv:** [2201.11903](https://arxiv.org/abs/2201.11903)
