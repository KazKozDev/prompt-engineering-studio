# Bug Fix: N/A Display for Zero Scores

## 🐛 Issue
Scores (Consistency Score, GLaPE Score, Judge Score) were displaying as `N/A` when their value was `0.0`. This is because `0.0` is falsy in JavaScript, and the logic `value || 'N/A'` falls back to 'N/A'.

## 🛠 Fix
Updated the display logic in `LabelFreeEval.tsx` to explicitly check for `undefined`.

**Old Logic:**
```tsx
{results.score?.toFixed(3) || 'N/A'}
```

**New Logic:**
```tsx
{results.score !== undefined ? results.score.toFixed(3) : 'N/A'}
```

## ✅ Affected Metrics
- **Self-Consistency:** Consistency Score
- **Mutual-Consistency:** Average Consistency, GLaPE Score
- **LLM-as-a-Judge:** Judge Score, Confidence

## 📍 Location
File: `/Users/artemk/prompt-engineering-studio/frontend/src/components/evaluation/LabelFreeEval.tsx`
Lines: ~230, ~259, ~267, ~289, ~293
