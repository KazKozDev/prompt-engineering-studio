# System 2 Attention (S2A): Focus on What Matters

> **Deep Dive Guide** | [← Back to Methods Library](../getting-started/11-methods-library.md)

**Category:** Context Management & Attention
**Best for:** Cleaning noisy context, removing irrelevant details, reducing sycophancy
**Original paper:** ["System 2 Attention (is something you might need too)" (Weston & Sukhbaatar, 2023)](https://arxiv.org/abs/2311.11829)

This is a **detailed implementation guide** with direct paper quotes, production patterns, and analysis for integrating System 2 Attention (S2A) into your workflows.

---

## 1. Core Idea

Standard Attention (System 1) is "soft" and prone to distraction. It attends to irrelevant tokens just because they are present. System 2 Attention (S2A) forces the model to consciously decide what to attend to. It does this by **rewriting the context** to remove irrelevant information before generating the final answer.

> "S2A regenerates the input context to only include the relevant portions, before attending to the regenerated context to elicit the final response... S2A increases factuality and objectivity, and decreases sycophancy." — *Weston & Sukhbaatar, 2023*

## 2. Why It Matters for Production

In RAG applications or long conversations, the context window gets filled with "noise" (irrelevant documents, previous unrelated chatter). This noise causes:
1.  **Lost in the Middle:** Model misses key facts.
2.  **Sycophancy:** Model agrees with the user's biased question instead of correcting it.
3.  **Hallucination:** Model incorporates irrelevant details into the answer.

## 3. How It Works

1.  **Input:** User prompts with a long, noisy context (e.g., 5 retrieved documents + biased question).
2.  **S2A Step:** Prompt the model: "Rewrite the context above to only include information relevant to answering the question. Remove irrelevant details and bias."
3.  **Refined Context:** The model outputs a cleaner, shorter version of the context.
4.  **Final Response:** Prompt the model using the *Refined Context* to answer the original question.

## 4. When to Use (and When Not To)

| Use When | Avoid When |
| :--- | :--- |
| You are doing RAG and retrieved chunks are noisy/repetitive. | The context is short and high-quality. |
| The user's prompt might be biased or "leading" (Sycophancy check). | Latency is critical (S2A adds a full regeneration step). |
| You need high objectivity. | The "relevant" information is ambiguous (model might delete key info). |

## 5. Implementation in PE Studio

S2A is a **Context Rewriting** pattern. In Prompt Engineering Studio:

1.  **Manual Protocol:**
    *   **Step 1:** Paste your noisy context into the Input.
    *   **Step 2:** Instruction: "Given the following context, rewrite it to keep only the parts relevant to answering: [Question]. Do not add new information."
    *   **Step 3:** Take the output (clean context) and start a new generation with the actual question.

2.  **Variable Chaining:**
    *   Use the output of `Prompt 1` (Cleaning) as the variable `{{context}}` for `Prompt 2` (Answering).

## 6. Cost & Risk Considerations

*   **Cost:** You engage the model twice. The first call generates input tokens for the second.
*   **Information Loss:** Aggressive cleaning might remove subtle but necessary context.

## 7. Advanced Techniques

*   **S2A + RAG:** Instead of feeding 10 chunks to the final answer generation, use S2A to compress them into 1-2 dense paragraphs of pure facts first.

## 8. Links to Original Research

*   [System 2 Attention (is something you might need too) (arXiv)](https://arxiv.org/abs/2311.11829)
*   [Meta AI Research](https://ai.meta.com/research/)

## 9. Quick Reference Card

| Feature | Details |
| :--- | :--- |
| **Acronym** | S2A |
| **Key Phrase** | "Rewrite context to remove noise" |
| **Key Paper** | Weston et al. (Meta AI, 2023) |
| **Cost Impact** | High (Context Regeneration) |
| **Latency** | High |
 (S2A)

