# Robustness Lab - Проверка Работоспособности

## ✅ Статус: ВСЕ РАБОТАЕТ

Проверил все три типа тестов робастности. Все компоненты на месте и корректно возвращают отчеты.

---

## 🔍 Детальная Проверка

### 1. Format Sensitivity (Чувствительность к форматированию)

#### ✅ Frontend (RobustnessLab.tsx)
- **API вызов:** `api.runFormatRobustnessTest()`
- **Параметры:** `prompt, dataset, provider, model`
- **Лимит данных:** 10 примеров из датасета

#### ✅ Backend API (`/api/evaluator/robustness/format`)
- **Endpoint:** POST `/api/evaluator/robustness/format`
- **Request Model:** `FormatRobustnessRequest`
- **Вызывает:** `tester.test_format_robustness()`

#### ✅ Backend Logic (`src/evaluator/robustness.py`)
**Метод:** `test_format_robustness()`

**Что делает:**
1. Генерирует вариации промпта (разные форматы)
2. Запускает оценку для каждой вариации
3. Вычисляет дельты относительно базового промпта

**Возвращаемые поля:**
```python
{
    "robustness_score": float,      # 0-1, насколько стабилен
    "performance_delta": float,     # Минимальная дельта
    "variations": List[str],        # Список вариаций
    "format_variations": [          # Детали по каждой вариации
        {
            "name": "Variation 1",
            "example": "...",       # Текст вариации
            "score": 0.85,
            "delta": -0.05,
            "delta_percent": -5.88
        }
    ],
    "results": {...}                # Полные результаты оценки
}
```

#### ✅ Frontend Display
- **Summary Metrics:** Robustness Score, Performance Delta, Variations Tested
- **Detailed Results:** Список всех format_variations с:
  - Название вариации
  - Score (синий)
  - Пример текста (truncated)
  - Delta и Delta % (серый)
- **Raw JSON:** Collapsible details

---

### 2. Context Length (Деградация при длинном контексте)

#### ✅ Frontend (RobustnessLab.tsx)
- **API вызов:** `api.runLengthRobustnessTest()`
- **Параметры:** `prompt, dataset, max_context_length, provider, model`
- **Лимит данных:** 5 примеров из датасета
- **Настройка:** `contextLength` (default: 1000 tokens)

#### ✅ Backend API (`/api/evaluator/robustness/length`)
- **Endpoint:** POST `/api/evaluator/robustness/length`
- **Request Model:** `LengthRobustnessRequest`
- **Вызывает:** `tester.test_length_robustness()`

#### ✅ Backend Logic (`src/evaluator/robustness.py`)
**Метод:** `test_length_robustness()`

**Что делает:**
1. Тестирует на 4 уровнях: 1x, 2x, 4x, 8x длины
2. Повторяет input N раз для симуляции длинного контекста
3. Truncate если превышает max_context_length
4. Находит точку деградации (20% drop)

**Возвращаемые поля:**
```python
{
    "robustness_score": float,      # Отношение последнего к базовому
    "performance_delta": float,     # Разница последнего и базового
    "variations": ["1", "2", "4", "8"],
    "length_tests": [               # Результаты по длинам
        {
            "context_length": 250,  # Approx tokens
            "score": 0.90,
            "multiplier": 1
        },
        {
            "context_length": 500,
            "score": 0.85,
            "multiplier": 2
        },
        ...
    ],
    "degradation_point": "2000 tokens"  # Или "None"
}
```

#### ✅ Frontend Display
- **Summary Metrics:** Robustness Score, Performance Delta, Variations Tested
- **Detailed Results:** 
  - Таблица "Performance by Context Length"
  - Каждая строка: `{tokens} tokens` → `{score}`
  - Warning box: "⚠️ Performance degrades significantly beyond X tokens"
- **Raw JSON:** Collapsible details

---

### 3. Adversarial Tests (Adversarial атаки)

#### ✅ Frontend (RobustnessLab.tsx)
- **API вызов:** `api.runAdversarialRobustnessTest()`
- **Параметры:** `prompt, dataset, level, provider, model`
- **Лимит данных:** 5 примеров из датасета
- **Настройка:** `adversarialLevel` (light/medium/heavy)

#### ✅ Backend API (`/api/evaluator/robustness/adversarial`)
- **Endpoint:** POST `/api/evaluator/robustness/adversarial`
- **Request Model:** `AdversarialRobustnessRequest`
- **Вызывает:** `tester.test_adversarial_robustness()`

#### ✅ Backend Logic (`src/evaluator/robustness.py`)
**Метод:** `test_adversarial_robustness()`

**Что делает:**
1. Инжектирует шум в датасет (typos, swaps, deletes)
2. Severity levels:
   - `light`: 5% noise
   - `medium`: 15% noise
   - `heavy`: 30% noise
3. Сравнивает clean vs adversarial performance

**Возвращаемые поля:**
```python
{
    "robustness_score": float,      # adv_score / clean_score
    "performance_delta": float,     # adv_score - clean_score
    "variations": ["clean", "adversarial"],
    "adversarial_tests": [
        {
            "type": "Clean",
            "score": 0.90,
            "description": "Original dataset",
            "impact": 0
        },
        {
            "type": "Adversarial (medium)",
            "score": 0.75,
            "description": "Injected 15% noise",
            "impact": 16.67  # % degradation
        }
    ]
}
```

#### ✅ Frontend Display
- **Summary Metrics:** Robustness Score, Performance Delta, Variations Tested
- **Detailed Results:** Список adversarial_tests с:
  - Attack type (белый)
  - Score (красный для adversarial)
  - Description (серый)
  - Impact: X% degradation
- **Raw JSON:** Collapsible details

---

## 📊 Пример Workflow

### Пользователь выбирает "Format Sensitivity":

1. **Frontend:** Отправляет POST к `/api/evaluator/robustness/format`
2. **Backend:** 
   - Создает `RobustnessTester()`
   - Вызывает `test_format_robustness()`
   - Генерирует вариации промпта
   - Запускает оценку для каждой
   - Возвращает JSON с метриками
3. **Frontend:** Отображает:
   ```
   Robustness Score: 0.950
   Performance Delta: -0.050
   Variations Tested: 5
   
   Format Variations:
   - Variation 1: 0.900 (Delta: -0.050, -5.3%)
   - Variation 2: 0.920 (Delta: -0.030, -3.2%)
   ...
   ```

### Пользователь выбирает "Context Length":

1. **Frontend:** Отправляет POST к `/api/evaluator/robustness/length`
2. **Backend:**
   - Тестирует на 1x, 2x, 4x, 8x длины
   - Находит точку деградации
3. **Frontend:** Отображает:
   ```
   Robustness Score: 0.833
   Performance Delta: -0.150
   Variations Tested: 4
   
   Performance by Context Length:
   - 250 tokens: 0.900
   - 500 tokens: 0.850
   - 1000 tokens: 0.800
   - 2000 tokens: 0.750
   
   ⚠️ Performance degrades significantly beyond 1000 tokens
   ```

### Пользователь выбирает "Adversarial Tests":

1. **Frontend:** Отправляет POST к `/api/evaluator/robustness/adversarial`
2. **Backend:**
   - Инжектирует 15% noise (medium)
   - Сравнивает clean vs noisy
3. **Frontend:** Отображает:
   ```
   Robustness Score: 0.833
   Performance Delta: -0.150
   Variations Tested: 2
   
   Adversarial Attack Results:
   - Clean: 0.900 (Original dataset, Impact: 0%)
   - Adversarial (medium): 0.750 (Injected 15% noise, Impact: 16.7% degradation)
   ```

---

## ✅ Итоговая Проверка

| Компонент | Format | Length | Adversarial |
|-----------|--------|--------|-------------|
| Frontend API Call | ✅ | ✅ | ✅ |
| Backend Endpoint | ✅ | ✅ | ✅ |
| Backend Logic | ✅ | ✅ | ✅ |
| Return Fields | ✅ | ✅ | ✅ |
| Frontend Display | ✅ | ✅ | ✅ |
| Production Use Cases | ✅ (5) | ✅ (5) | ✅ (5) |

---

## 🎯 Заключение

**ВСЕ ТРИ ТИПА ТЕСТОВ ПОЛНОСТЬЮ РАБОТАЮТ:**

1. ✅ **Format Sensitivity** - тестирует вариации форматирования
2. ✅ **Context Length** - тестирует деградацию при длинном контексте
3. ✅ **Adversarial Tests** - тестирует устойчивость к шуму и атакам

**Каждый тест возвращает:**
- ✅ Robustness Score (метрика стабильности)
- ✅ Performance Delta (изменение производительности)
- ✅ Detailed Results (детальные результаты по вариациям)
- ✅ Raw JSON (для глубокого анализа)

**Production Use Cases динамически меняются** в зависимости от выбранного типа теста!

**Готово к использованию!** 🚀
