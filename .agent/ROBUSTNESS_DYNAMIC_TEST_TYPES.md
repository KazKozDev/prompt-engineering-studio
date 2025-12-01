# Robustness Lab - Dynamic Test Types

## ✅ Status: Updated

The "Test Types" section in the Robustness Lab guide is now **dynamic**. It only displays the description for the **currently selected test type**.

---

## 📋 Behavior

### 1. User Selects "Format Sensitivity"
**Shows:**
> **Format Sensitivity**
> Generates variations with different **capitalization**, **spacing**, and **punctuation**. Measures if minor formatting changes cause performance drops. Essential for multi-platform deployment where user input varies.
> [Zhao et al. (2021)]

### 2. User Selects "Context Length"
**Shows:**
> **Context Length ("Context Rot")**
> Tests at **1x, 2x, 4x, 8x** context lengths to find degradation point. Simulates long documents, chat histories, and multi-document RAG. Returns exact token threshold where quality drops >20%.
> [Liu et al. (2024)]

### 3. User Selects "Adversarial Tests"
**Shows:**
> **Adversarial Tests**
> Injects **noise** (typos, character swaps, deletions) at light/medium/heavy levels. Measures robustness to adversarial examples and malformed input. Critical for security validation before public deployment.
> [Perez et al. (2023)]

---

## 🎯 Benefits
- **Reduced Clutter:** Users only see relevant information.
- **Focused Context:** The guide adapts to the user's current task.
- **Consistent Experience:** Matches the behavior of "Production Use Cases" and "What It Measures".

## 📍 Location
File: `/Users/artemk/prompt-engineering-studio/frontend/src/components/EvaluationLab.tsx`
Section: `Robustness Lab Guide` -> `Test Types`
