# Label-Free Evaluation - Enhanced Descriptions with Interpretation & Arxiv Links

## ✅ Status: Updated

The "What This Mode Does" section in the Label-Free Evaluation guide has been enhanced for all three modes. Each mode now includes:
1.  **Interpretation Guide:** How to read the results (Scores, Confidence).
2.  **Arxiv Link:** Direct link to the foundational scientific paper.

---

## 📋 Content Updates

### 1. Self-Consistency
**Interpretation:**
> Higher **Consistency Score (closer to 1.0)** means the model is confident. Low scores indicate potential hallucinations or ambiguous instructions.

**Paper:**
> [Wang et al. (2022) - Self-Consistency](https://arxiv.org/abs/2203.11171)

### 2. Mutual-Consistency (GLaPE)
**Interpretation:**
> High **GLaPE Score** means different prompts converge on the same answer. Use this to identify the "consensus" prompt when ground truth is missing.

**Paper:**
> [Deng et al. (2023) - GLaPE](https://arxiv.org/abs/2305.14658)

### 3. LLM-as-a-Judge
**Interpretation:**
> **Score (0-1)** reflects overall quality. **Confidence** shows how sure the judge is. Always read the **Reasoning** for qualitative feedback.

**Paper:**
> [Zheng et al. (2023) - LLM-as-a-Judge](https://arxiv.org/abs/2306.05685)

---

## 🎯 User Value
- **Scientific Backing:** Users can trust the methods are based on research.
- **Clear Guidance:** Users know exactly how to interpret the numbers.
- **Educational:** Helps users learn advanced prompt engineering concepts.

## 📍 Location
File: `/Users/artemk/prompt-engineering-studio/frontend/src/components/EvaluationLab.tsx`
Section: `Label-Free Evaluation Guide` -> `What This Mode Does`
