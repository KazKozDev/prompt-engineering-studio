# UI Integration Guide: Advanced Evaluation Metrics

## ✅ Что уже сделано (Backend):

1. ✅ API endpoints для BERTScore, Perplexity, Semantic Similarity
2. ✅ Evaluation History tracking
3. ✅ Response Caching
4. ✅ Status endpoint для проверки доступности

## 📋 Что нужно добавить в UI:

### 1. Добавить компонент статуса в EvaluationLab

**Файл:** `frontend/src/components/EvaluationLab.tsx`

**Где:** В правой панели "Evaluation Summary" (строка ~420)

**Что добавить:**
```tsx
import { AdvancedMetricsInfo } from './evaluation/AdvancedMetrics';

// В JSX, после блока "Configuration" (строка ~526):
<AdvancedMetricsInfo />
```

Это покажет пользователю, какие advanced metrics доступны.

---

### 2. Обновить QualityTab для показа BERTScore

**Файл:** `frontend/src/components/evaluation/QualityTab.tsx`

**Где:** В секции Results (строка ~386-405)

**Что добавить:**
```tsx
// После BLEU, ROUGE, Exact Match, добавить:
{results.metrics?.bertscore !== undefined && (
  <div className="bg-white/5 rounded-lg p-3 text-center">
    <div className="text-lg font-semibold text-white">
      {results.metrics.bertscore.toFixed(3)}
    </div>
    <div className="text-[10px] text-white/50 uppercase">BERTScore</div>
    <div className="text-[8px] text-emerald-400 mt-1">Advanced</div>
  </div>
)}

{results.metrics?.perplexity !== undefined && (
  <div className="bg-white/5 rounded-lg p-3 text-center">
    <div className="text-lg font-semibold text-white">
      {results.metrics.perplexity.toFixed(1)}
    </div>
    <div className="text-[10px] text-white/50 uppercase">Perplexity</div>
    <div className="text-[8px] text-emerald-400 mt-1">Advanced</div>
  </div>
)}
```

---

### 3. Добавить API методы для advanced metrics

**Файл:** `frontend/src/services/api.ts`

**Что добавить:**
```typescript
// Advanced Metrics
async calculateBERTScore(prediction: string, reference: string) {
  const response = await fetch(`${this.baseUrl}/api/evaluation/advanced/bertscore`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prediction, reference }),
  });
  return response.json();
},

async calculatePerplexity(text: string) {
  const response = await fetch(`${this.baseUrl}/api/evaluation/advanced/perplexity`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });
  return response.json();
},

async getAdvancedMetricsStatus() {
  const response = await fetch(`${this.baseUrl}/api/evaluation/advanced/status`);
  return response.json();
},

// Evaluation History
async saveEvaluation(data: {
  prompt_id: string;
  prompt_text: string;
  dataset_id: string;
  dataset_name: string;
  metrics: Record<string, number>;
  metadata?: Record<string, any>;
}) {
  const response = await fetch(`${this.baseUrl}/api/evaluation/advanced/history/save`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return response.json();
},

async getPromptHistory(promptId: string, limit: number = 20) {
  const response = await fetch(
    `${this.baseUrl}/api/evaluation/advanced/history/prompt/${promptId}?limit=${limit}`
  );
  return response.json();
},

async checkRegression(data: {
  prompt_id: string;
  metric_name: string;
  threshold?: number;
  window?: number;
}) {
  const response = await fetch(`${this.baseUrl}/api/evaluation/advanced/history/regression`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return response.json();
},

// Cache Management
async getCacheStats() {
  const response = await fetch(`${this.baseUrl}/api/evaluation/advanced/cache/stats`);
  return response.json();
},

async clearCache() {
  const response = await fetch(`${this.baseUrl}/api/evaluation/advanced/cache/clear`, {
    method: 'POST',
  });
  return response.json();
},
```

---

### 4. Обновить backend для расчета advanced metrics

**Файл:** `src/api_server.py`

**Где:** В функции `runOfflineEvaluation` (строка ~1120)

**Что добавить:**
```python
# После расчета BLEU, ROUGE
from src.evaluator import ADVANCED_METRICS_AVAILABLE

if ADVANCED_METRICS_AVAILABLE:
    try:
        from src.evaluator import calculate_bertscore, calculate_perplexity
        
        # Calculate BERTScore if available
        bertscore_results = []
        for pred, ref in zip(predictions, references):
            result = calculate_bertscore(pred, ref)
            bertscore_results.append(result.score)
        
        metrics["bertscore"] = sum(bertscore_results) / len(bertscore_results)
        
        # Calculate Perplexity for predictions
        perplexity_results = []
        for pred in predictions:
            result = calculate_perplexity(pred)
            if result.score != float('inf'):
                perplexity_results.append(result.score)
        
        if perplexity_results:
            metrics["perplexity"] = sum(perplexity_results) / len(perplexity_results)
    except Exception as e:
        logger.warning(f"Advanced metrics calculation failed: {e}")
```

---

## 🎯 Быстрый старт (Минимальная интеграция):

### Шаг 1: Показать статус в UI

Добавь в `EvaluationLab.tsx` (строка ~526, после Configuration):

```tsx
import { AdvancedMetricsInfo } from './evaluation/AdvancedMetrics';

// В JSX:
<AdvancedMetricsInfo />
```

### Шаг 2: Запусти приложение

```bash
# Terminal 1: Backend
python src/api_server.py

# Terminal 2: Frontend
cd frontend && npm run dev
```

### Шаг 3: Проверь

Открой Evaluation Lab → Посмотри в правую панель Summary → Должен появиться блок "Available Features"

---

## 📊 Полная интеграция (Опционально):

Если хочешь полностью интегрировать advanced metrics:

1. **Обнови API service** (добавь методы выше)
2. **Обнови QualityTab** (добавь отображение BERTScore/Perplexity)
3. **Обнови backend** (добавь расчет в runOfflineEvaluation)
4. **Создай History Tab** (новый компонент для просмотра истории)

---

## 🧪 Тестирование:

### Проверка статуса:
```bash
curl http://localhost:8000/api/evaluation/advanced/status
```

### Ожидаемый ответ (БЕЗ advanced deps):
```json
{
  "advanced_metrics_available": false,
  "features": {
    "bertscore": false,
    "perplexity": false,
    "semantic_similarity": false,
    "evaluation_history": true,
    "response_cache": true
  }
}
```

### Ожидаемый ответ (С advanced deps):
```json
{
  "advanced_metrics_available": true,
  "features": {
    "bertscore": true,
    "perplexity": true,
    "semantic_similarity": true,
    "evaluation_history": true,
    "response_cache": true
  }
}
```

---

## 💡 Что делать дальше:

1. **Сейчас:** Добавь `<AdvancedMetricsInfo />` в EvaluationLab → Увидишь статус
2. **Потом:** Установи зависимости → `pip install sentence-transformers transformers torch`
3. **Затем:** Обнови API service и QualityTab для полной интеграции

---

## ❓ FAQ:

**Q: Почему advanced metrics не показываются автоматически?**  
A: Нужно установить зависимости: `pip install sentence-transformers transformers torch`

**Q: Можно ли использовать без advanced metrics?**  
A: Да! Базовые метрики (BLEU, ROUGE) работают всегда.

**Q: Как добавить BERTScore в результаты?**  
A: Обнови backend (см. Шаг 4) и frontend (см. Шаг 2).

**Q: Где хранится evaluation history?**  
A: В `data/evaluation_history/` (JSON файлы).

**Q: Как очистить cache?**  
A: `curl -X POST http://localhost:8000/api/evaluation/advanced/cache/clear`

---

## 📝 Итого:

✅ **Backend готов** — все API endpoints работают  
⚠️ **Frontend нужно обновить** — добавить компоненты и API calls  
✅ **Компонент статуса создан** — `AdvancedMetrics.tsx`  
📋 **Инструкции готовы** — следуй шагам выше  

**Минимальная интеграция:** 5 минут (добавить `<AdvancedMetricsInfo />`)  
**Полная интеграция:** 30-60 минут (обновить все компоненты)
