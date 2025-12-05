# Chain-of-Thought (CoT): Step-by-Step Reasoning

> **Deep Dive Guide** | [← Back to Methods Library](../getting-started/11-methods-library.md)

**Category:** Reasoning & Logic
**Best for:** Math problems, symbolic reasoning, complex logical deductions
**Original paper:** ["Chain-of-Thought Prompting Elicits Reasoning in Large Language Models" (Wei et al., 2022)](https://arxiv.org/abs/2201.11903)

This is a **detailed implementation guide** with direct paper quotes, production patterns, and analysis for integrating Chain-of-Thought prompting into your workflows.

---

## 1. Core Idea

Chain-of-Thought (CoT) prompting enables Large Language Models (LLMs) to solve complex reasoning problems by generating a series of intermediate reasoning steps. Instead of jumping directly from a question to an answer, the model is guided to "think aloud," breaking down the problem into manageable parts.

> "A chain of thought is a series of intermediate reasoning steps. Complex reasoning tasks can be solved by generating a chain of thought that leads to the final answer." — *Wei et al., 2022*

## 2. Why It Matters for Production

For production applications involving arithmetic, commonsense reasoning, or symbolic manipulation, standard prompting often yields incorrect results or hallucinations. CoT significantly improves reliability and interpretability.

*   **Improved Accuracy:** drastically boosts performance on tasks like GSM8K (math word problems).
*   **Interpretability:** provides a window into the model's reasoning process, allowing developers to debug where the logic failed.
*   **applicability:** Works across various domains without model retraining.

## 3. How It Works

CoT works by providing "exemplars" (few-shot prompting) that demonstrate the reasoning process, or by using a "zero-shot" trigger phrase.

### Zero-Shot CoT
Simply appending **"Let's think step by step"** to the prompt.

### Few-Shot CoT
Providing examples of Question -> Reasoning -> Answer triples.

> "We show how such reasoning abilities emerge naturally in sufficiently large language models via a simple method called chain of thought prompting, where a few chain of thought demonstrations are provided as exemplars in prompting." — *Wei et al., 2022*

## 4. When to Use (and When Not To)

| Use When | Avoid When |
| :--- | :--- |
| The task requires multi-step logic (e.g., math, scheduling). | The task is simple/atomic (e.g., sentiment classification). |
| You need to debug the model's decision-making. | Latency is critical (CoT increases token output). |
| The model is sufficiently large (10B+ parameters usually). | Using small models that might hallucinate the reasoning steps. |

## 5. Implementation in PE Studio

In **Prompt Engineering Studio**, you can implement CoT in two ways:

1.  **System Prompt Injection:**
    *   Navigate to **Generator**.
    *   In the System Prompt, add instructions: "You are a helpful assistant. When solving problems, always show your reasoning steps before giving the final answer."

2.  **Few-Shot Templating:**
    *   Use the **Variables** feature to create a structure:
        ```markdown
        Q: Roger has 5 tennis balls. He buys 2 more cans of tennis balls. Each can has 3 tennis balls. How many tennis balls does he have now?
        A: Roger started with 5 balls. 2 cans of 3 balls each is 6 balls. 5 + 6 = 11. The answer is 11.
        
        Q: {{user_question}}
        A:
        ```

3.  **Validation:**
    *   Use the **Evaluation Lab** to compare a standard prompt vs. a CoT prompt on your test dataset.

## 6. Cost & Risk Considerations

*   **Token Cost:** CoT generates significantly more output tokens (the reasoning trace). This increases latency and API costs.
*   **Validation:** The model might generate a correct reasoning chain but a wrong answer, or vice-versa. You may need to parse the final answer specifically.

## 7. Advanced Techniques

*   **Self-Consistency:** Generate multiple CoT paths and take a majority vote (see [Self-Consistency](./self-consistency.md)).
*   **Least-to-Most Prompting:** Break down the problem into sub-problems explicitly.

## 8. Links to Original Research

*   [Chain-of-Thought Prompting Elicits Reasoning in Large Language Models (arXiv)](https://arxiv.org/abs/2201.11903)
*   [Large Language Models are Zero-Shot Reasoners (Zero-Shot CoT)](https://arxiv.org/abs/2205.11916)

## 9. Quick Reference Card

| Feature | Details |
| :--- | :--- |
| **Acronym** | CoT |
| **Key Phrase** | "Let's think step by step" |
| **Key Paper** | Wei et al. (Google Research, 2022) |
| **Cost Impact** | High (more output tokens) |
| **Latency** | Higher |
