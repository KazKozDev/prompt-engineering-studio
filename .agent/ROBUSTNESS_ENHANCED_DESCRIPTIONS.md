# Robustness Lab - Enhanced Descriptions with Interpretation & Arxiv Links

## ✅ Status: Updated

The "Test Types" section in the Robustness Lab guide has been enhanced. Each test type now includes:
1.  **Detailed Description:** What the test does and why it matters.
2.  **Interpretation Guide:** How to read the results (Score, Delta).
3.  **Arxiv Link:** Direct link to the relevant scientific paper.

---

## 📋 Content Updates

### 1. Format Sensitivity
**Interpretation:**
> High **Robustness Score (>0.9)** indicates stability. Large negative **Performance Delta** means the prompt is fragile to formatting changes.

**Paper:**
> [Zhao et al. (2021) - Calibrate Before Use](https://arxiv.org/abs/2102.09690)

### 2. Context Length ("Context Rot")
**Interpretation:**
> **Performance Delta** shows accuracy drop at max context. If degradation occurs at X tokens, keep inputs below this limit to avoid "Lost in the Middle" phenomenon.

**Paper:**
> [Liu et al. (2023) - Lost in the Middle](https://arxiv.org/abs/2307.03172)

### 3. Adversarial Tests
**Interpretation:**
> A significant drop in score compared to **Clean baseline** indicates vulnerability. Use this to identify need for better input sanitization or defensive prompting.

**Paper:**
> [Perez et al. (2022) - Red Teaming LMs](https://arxiv.org/abs/2202.03286)

---

## 🎯 User Value
- **Clarity:** Users now know exactly what "good" looks like.
- **Credibility:** Links to Arxiv papers provide scientific backing.
- **Actionability:** Interpretation guides suggest specific actions (e.g., "keep inputs below limit").

## 📍 Location
File: `/Users/artemk/prompt-engineering-studio/frontend/src/components/EvaluationLab.tsx`
Section: `Robustness Lab Guide` -> `Test Types`
