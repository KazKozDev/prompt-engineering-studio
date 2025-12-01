# Bug Fix: Consistency Score Display

## 🐛 Issue
The user reported that `Consistency Score` was displaying as `N/A` even though the Raw JSON showed `"score": 0.2`. This was due to a mismatch between the frontend expectation (`consistency_score`) and the backend response (`score` in some cases).

## 🛠 Fix
1. **Backend (`src/evaluator/consistency.py`):** Added `"score"` as an alias for `consistency_score` and `glape_score` in the return dictionaries. This ensures backward compatibility.
2. **Frontend (`LabelFreeEval.tsx`):** Updated the display logic to check for `results.score` if the specific metric (`consistency_score` or `glape_score`) is undefined.

## ✅ Verified Behavior
- If API returns `consistency_score`: Frontend uses it.
- If API returns `score`: Frontend uses it as a fallback.
- If score is `0.0`: Frontend displays `0.000` instead of `N/A`.

## 📍 Locations
- Backend: `/Users/artemk/prompt-engineering-studio/src/evaluator/consistency.py`
- Frontend: `/Users/artemk/prompt-engineering-studio/frontend/src/components/evaluation/LabelFreeEval.tsx`
