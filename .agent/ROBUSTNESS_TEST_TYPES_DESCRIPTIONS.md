# Robustness Lab - Enhanced Test Type Descriptions

## ✅ Status: Updated

The "Test Types" section in the Robustness Lab guide has been updated with detailed, actionable descriptions for each test type.

---

## 📋 New Descriptions

### 1. Format Sensitivity
**Old:** Tests if prompt works with different formatting (spacing, capitalization, etc.).
**New:** Generates variations with different **capitalization**, **spacing**, and **punctuation**. Measures if minor formatting changes cause performance drops. Essential for multi-platform deployment where user input varies.

**Key Improvements:**
- Specifies exact variations (capitalization, spacing, punctuation).
- Explains the measurement (performance drops).
- Adds the "Why" (multi-platform deployment).

### 2. Context Length ("Context Rot")
**Old:** Measures performance degradation as context grows. Critical for RAG systems.
**New:** Tests at **1x, 2x, 4x, 8x** context lengths to find degradation point. Simulates long documents, chat histories, and multi-document RAG. Returns exact token threshold where quality drops >20%.

**Key Improvements:**
- Specifies test methodology (1x, 2x, 4x, 8x).
- Lists specific use cases (long docs, chat history, RAG).
- Defines the metric (token threshold for >20% drop).

### 3. Adversarial Tests
**Old:** Tests resistance to prompt injection, jailbreaks, and malicious inputs.
**New:** Injects **noise** (typos, character swaps, deletions) at light/medium/heavy levels. Measures robustness to adversarial examples and malformed input. Critical for security validation before public deployment.

**Key Improvements:**
- Explains the mechanism (injects noise: typos, swaps, deletions).
- Mentions severity levels (light/medium/heavy).
- Highlights the critical use case (security validation).

---

## 🎨 Visual Design
- Key terms are highlighted in white (`text-white/70`) for better readability.
- Descriptions use a relaxed line height (`leading-relaxed`) for comfort.
- Consistent font size (`text-[11px]`) and color (`text-white/50`).

## 📍 Location
File: `/Users/artemk/prompt-engineering-studio/frontend/src/components/EvaluationLab.tsx`
Section: `Robustness Lab Guide` -> `Test Types`
