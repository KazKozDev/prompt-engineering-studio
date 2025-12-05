# Retrieval-Augmented Generation (RAG)

**Giving the model an open-book exam.** RAG improves generation by retrieving relevant documents from an external knowledge base and feeding them to the LLM along with the question.

## The Core Idea

LLMs have a "knowledge cutoff" and can hallucinate facts. RAG solves this by separating **knowledge** (in a database) from **reasoning** (in the LLM).

1.  **Retrieve:** Find the top-K most relevant chunks of text for the user's query (usually using vector embeddings).
2.  **Augment:** Paste these chunks into the prompt context.
3.  **Generate:** Ask the LLM to answer the query *using only the provided context*.

> "We build RAG models... which retrieve documents from Wikipedia and pass them to a seq2seq model... RAG models generate more specific, diverse and factual language than a state-of-the-art parametric-only seq2seq model." — *Lewis et al. (2020)*

## Production Implementation

### The Prompt Pattern
```text
You are a helpful assistant. Answer the question using ONLY the following context. If the answer is not in the context, say "I don't know".

Context:
[Document 1: The refund policy states that requests must be made within 30 days...]
[Document 2: To request a refund, email support@example.com...]

Question: How do I get my money back?
Answer:
```

### Key Components
*   **Vector Database:** (Pinecone, Milvus, Chroma) Stores embeddings of your documents.
*   **Embeddings Model:** (OpenAI text-embedding-3, Voyage) Converts text to vectors.
*   **Retriever:** Finds relevant chunks.

## Best For
*   **Q&A over Docs:** Chatting with PDFs, Notion, or internal wikis.
*   **Customer Support:** Answering questions based on up-to-date policy manuals.
*   **Factuality:** Reducing hallucinations by grounding answers in sources.

## Watch Out
*   **Retrieval Quality:** "Garbage in, garbage out". If the retriever finds the wrong docs, the LLM will fail.
*   **Context Window:** You can only fit so many documents in the prompt.
*   **Lost in the Middle:** LLMs sometimes ignore information in the middle of a long context.

## Reference
*   **Paper:** Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks
*   **Authors:** Patrick Lewis, Ethan Perez, et al. (Facebook AI Research)
*   **ArXiv:** [2005.11401](https://arxiv.org/abs/2005.11401)
