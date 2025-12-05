# RAG: Retrieval-Augmented Generation

> **Deep Dive Guide** | [← Back to Methods Library](../getting-started/11-methods-library.md)

**Category:** Knowledge & Context
**Best for:** Tasks requiring domain-specific knowledge, private data, or up-to-date facts
**Original paper:** ["Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks" (Lewis et al., 2020)](https://arxiv.org/abs/2005.11401)

This is a **detailed implementation guide** with direct paper quotes, production patterns, and analysis for integrating RAG into your workflows.

---

## 1. Core Idea

RAG combines a **parametric memory** (the pre-trained LLM) with a **non-parametric memory** (a dense vector index of documents). Before generating an answer, the system retrieves relevant documents from the index and provides them as context to the LLM.

> "RAG models combine parametric and non-parametric memory... The results show that RAG models generate more specific, diverse, and factual language than a state-of-the-art parametric-only baseline." — *Lewis et al., 2020*

## 2. Why It Matters for Production

RAG is the standard for building "Chat with your PDF" or Enterprise Knowledge Base apps. It solves two critical LLM issues:
1.  **Knowledge Cutoff:** LLMs don't know about events happened after training.
2.  **Privacy:** You can't train an LLM on your private company data easily, but you can index that data for RAG.

## 3. How It Works

1.  **Ingestion:** Split documents into chunks and embed them into vectors (e.g., using OpenAI embeddings).
2.  **Retrieval:** When a user asks a question, embed the question and find the top-k most similar chunks (Cosine Similarity).
3.  **Generation:** Construct a prompt:
    ```
    Context: {Retrieved Chunks}
    Question: {User Question}
    Answer using the context above:
    ```

## 4. When to Use (and When Not To)

| Use When | Avoid When |
| :--- | :--- |
| Your app needs to answer questions about specific, private documents. | The question is purely creative or conversational. |
| Accuracy and fact-checking are critical (you can cite sources). | The context window is small (retrieved chunks can be large). |
| The knowledge base changes frequently. | The task requires reasoning across the *entire* corpus (RAG only sees pieces). |

## 5. Implementation in PE Studio

In **Prompt Engineering Studio**, you can prototype RAG prompts:

1.  **Simulated Context (Generator):**
    *   Manually paste a relevant paragraph into a variable like `{{context}}`.
    *   Write your prompt: "Answer the question based strictly on the following context: {{context}}."

2.  **Testing Retrieval Relevance:**
    *   Use the **Evaluation Lab** to test how sensitive your prompt is to *irrelevant* context (Distraction Test). Adding noise to `{{context}}` and seeing if the model ignores it is a key robustness test.

## 6. Cost & Risk Considerations

*   **Ingestion Cost:** One-time cost to embed your documents.
*   **Retrieval Latency:** Vector search is fast, but adding 2000 tokens of context to every prompt increases input token costs and latency.
*   **"Lost in the Middle":** LLMs sometimes ignore information in the middle of a long context window.

## 7. Advanced Techniques

*   **Hybrid Search:** Combine Vector Search (Semantic) with Keyword Search (BM25) for better precision.
*   **Re-ranking:** Retrieve 50 docs, use a high-precision Re-ranked model (like Cohere) to pick the top 5 for the LLM.
*   **Hypothetical Document Embeddings (HyDE):** Generate a fake answer, embed *that*, and search.

## 8. Links to Original Research

*   [Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks (arXiv)](https://arxiv.org/abs/2005.11401)
*   [Faiss (Facebook AI Similarity Search)](https://github.com/facebookresearch/faiss)

## 9. Quick Reference Card

| Feature | Details |
| :--- | :--- |
| **Acronym** | RAG |
| **Key Phrase** | "Retrieve then Generate" |
| **Key Paper** | Lewis et al. (Facebook AI, 2020) |
| **Cost Impact** | Medium (Embeddings + Input Tokens) |
| **Latency** | Medium (Search overhead) |
 (Retrieval-Augmented Generation)

