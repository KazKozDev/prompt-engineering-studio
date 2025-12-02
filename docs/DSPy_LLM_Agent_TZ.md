# Техническое Задание (ТЗ)
## Система Автоматической Оркестрации LLM (GPT-5 + LangChain + DSPy) с ReAct-Самокоррекцией

**Версия:** 1.0  
**Дата:** Декабрь 2024

---

## Содержание

1. [Цель проекта](#1-цель-проекта)
2. [Общая архитектура](#2-общая-архитектура)
3. [Входные данные пользователя](#3-входные-данные-пользователя)
4. [Внутреннее состояние сессии](#4-внутреннее-состояние-сессии)
5. [Конфигурация LLM-Агента](#5-конфигурация-llm-агента)
6. [Каталог инструментов (Tools)](#6-каталог-инструментов-tools)
7. [ReAct-логика и самокоррекция](#7-react-логика-и-самокоррекция)
8. [Пайплайн работы](#8-пайплайн-работы)
9. [Хранилище артефактов](#9-хранилище-артефактов)
10. [Интеграция с Vector Store](#10-интеграция-с-vector-store)
11. [Error Handling и Retry](#11-error-handling-и-retry)
12. [Нефункциональные требования](#12-нефункциональные-требования)
13. [JSON Schema для Tools](#13-json-schema-для-tools)

---

## 1. Цель проекта

Создать систему, где **единственный LLM-Агент на GPT-5**, работающий через LangChain AgentExecutor, выполняет функции:

- **Архитектора DSPy-пайплайна**
- **Промпт-инженера**
- **Сборщика программ DSPy**
- **Настройщика компилятора DSPy**
- **Аналитика метрик**
- **Самокорректирующего инженера по ошибкам (ReAct)**
- **Генератора готового артефакта для продакшена**

### Принцип работы

Пользователь управляет системой только **тремя параметрами**:

1. Текст бизнес-задачи
2. Выбор целевой модели (Llama 3 / GPT-4o / Mistral и т.д.)
3. JSON-файл с Eval-данными

**Всё остальное — 100% автоматическая оркестрация GPT-5 Агента.**

---

## 2. Общая архитектура

```
┌───────────────────────────────┐
│  Пользовательский интерфейс   │
└───────────────┬───────────────┘
                ▼
┌────────────────────────────────────────────────────────────────┐
│   LLM-Агент Оркестратор (GPT-5 + LangChain + ReAct Loop)       │
├────────────────────────────────────────────────────────────────┤
│ Инструменты (Tools):                                           │
│  - Анализ задачи                                               │
│  - Генерация Contract Signature                                │
│  - Создание Program Pipeline                                   │
│  - Автонастройка Compiler                                      │
│  - Компиляция DSPy Program                                     │
│  - Самокоррекция (ReAct Failure Analyzer)                      │
│  - Генерация финального артефакта                              │
└──────────────────┬─────────────────────────────────────────────┘
                   ▼
            ┌──────────────┐
            │    DSPy      │
            │ Program, LM  │
            │ Optimizer    │
            └──────────────┘
                   ▼
            ┌──────────────┐
            │   Артефакт   │
            │  (готовый AI)│
            └──────────────┘
                   ▼
            ┌──────────────┐
            │  Artifact    │
            │   Storage    │
            └──────────────┘
```

---

## 3. Входные данные пользователя

### 3.1. `business_task_description`

| Параметр | Значение |
|----------|----------|
| **Тип** | `string` |
| **Обязательное** | `true` |
| **Минимальная длина** | 10 символов |
| **Максимальная длина** | 8000 символов |

**Примеры:**
- "Нужна проверка юридических рисков в договорах купли-продажи SaaS."
- "Классификация обращений клиента по тэгам поддержка/биллинг/техпроблемы."

### 3.2. `target_lm`

| Параметр | Значение |
|----------|----------|
| **Тип** | `string` (enum) |
| **Обязательное** | `true` |

**Допустимые значения:**
- `gpt-4o`
- `gpt-4o-mini`
- `gpt-5`
- `llama3-8b`
- `llama3-70b`
- `mistral-large`
- `claude-3-sonnet`
- `claude-3-opus`

**Правило:** Значение должно быть сопоставимо с конфигом LM в DSPy (mapping таблица).

### 3.3. `eval_data.json`

| Параметр | Значение |
|----------|----------|
| **Тип** | JSON-файл |
| **Обязательное** | `true` |
| **Минимум примеров** | 5 |

**Структура:**

```json
{
  "task_name": "string",
  "schema_version": "1.0",
  "examples": [
    {
      "input": {
        "text": "string",
        "context": "string | array<string> | null",
        "metadata": { "any": "any" }
      },
      "ideal_output": {
        "label": "string | number | boolean | object",
        "explanation": "string | null"
      }
    }
  ]
}
```

**Требования:**
- `examples` — массив длиной ≥ 5
- Обязательные поля: `input.text`, `ideal_output` (хотя бы одно поле внутри)

---

## 4. Внутреннее состояние сессии

```python
@dataclass
class SessionState:
    # Входные данные
    business_task_description: str
    target_lm: str
    eval_data_path: str | None = None
    
    # Результаты анализа
    task_analysis: dict | None = None
    
    # DSPy артефакты
    signature_id: str | None = None
    signature_code: str | None = None
    program_spec: dict | None = None
    program_id: str | None = None
    
    # Компиляция
    compiler_config_id: str | None = None
    compiled_program_id: str | None = None
    eval_results: dict | None = None
    
    # Финальный артефакт
    artifact_version_id: str | None = None
    
    # ReAct состояние
    iteration_count: int = 0
    error_history: list[dict] = field(default_factory=list)
```

---

## 5. Конфигурация LLM-Агента

### 5.1. Параметры GPT-5 (мозг агента)

| Параметр | Тип | Значение по умолчанию | Диапазон |
|----------|-----|----------------------|----------|
| `model_name` | string | `"gpt-5"` | — |
| `temperature` | float | `0.2` | [0.0, 1.0] |
| `top_p` | float | `0.95` | (0.0, 1.0] |
| `max_tokens` | int | `4096` | min 512 |
| `request_timeout` | int | `60` | секунды |
| `json_mode` | bool | `true` | — |

### 5.2. Параметры AgentExecutor

| Параметр | Тип | Значение по умолчанию | Описание |
|----------|-----|----------------------|----------|
| `max_iterations` | int | `20` | Жёсткий потолок ReAct-циклов |
| `max_execution_time` | int | `300` | Секунды |
| `handle_parsing_errors` | bool | `true` | — |
| `verbose` | bool | `true` (dev) / `false` (prod) | — |
| `return_intermediate_steps` | bool | `true` | Для отладки |

### 5.3. Политика мыслей

- Режим **ReAct**: генерирует `Thought → Action → Observation`
- Мысли (Thought) не выдаются пользователю, но используются агентом
- Внутренний шаблон промпта с упором на tool-calling

---

## 6. Каталог инструментов (Tools)

### 6.1. Анализ и планирование

#### Tool 1: `analyze_business_goal`

**Назначение:** Преобразовать текст задачи в структурированный объект.

**Вход:**
```json
{
  "task_description": "string"
}
```

| Поле | Тип | Обязательное | Ограничения |
|------|-----|--------------|-------------|
| `task_description` | string | true | min 10 символов |

**Выход:**
```json
{
  "task_type": "RAG | classification | extraction | summarization | reasoning | routing | hybrid",
  "domain": "string",
  "input_roles": ["string"],
  "output_roles": ["string"],
  "needs_retrieval": "boolean",
  "needs_chain_of_thought": "boolean",
  "needs_tool_use": "boolean",
  "complexity_level": "low | medium | high",
  "safety_level": "normal | high_risk"
}
```

---

### 6.2. Управление LLM

#### Tool 2: `register_target_lm`

**Назначение:** Зарегистрировать выбранную пользователем модель в DSPy.

**Вход:**
```json
{
  "target_lm_name": "string"
}
```

**Выход:**
```json
{
  "registered": true,
  "settings_summary": {
    "max_context_tokens": 8192,
    "recommended_temperature": 0.2,
    "provider": "openai | together | anthropic | local"
  }
}
```

**Эффект:**
```python
dspy.settings.configure(lm=target_lm)
```

---

#### Tool 3: `configure_lm_profile`

**Назначение:** Настроить глобальные параметры LLM в DSPy.

**Вход:**
```json
{
  "profile": "FAST_CHEAP | BALANCED | HIGH_QUALITY",
  "overrides": {
    "temperature": 0.1,
    "max_tokens": 2048,
    "top_p": 0.9,
    "context_length": 16384,
    "timeout": 60
  }
}
```

| Поле | Тип | Обязательное | Описание |
|------|-----|--------------|----------|
| `profile` | enum | true | Профиль настроек |
| `overrides` | object | false | Переопределение параметров |

**Профили:**

| Профиль | temperature | max_tokens | top_p |
|---------|-------------|------------|-------|
| FAST_CHEAP | 0.1 | 1024 | 0.9 |
| BALANCED | 0.2 | 2048 | 0.95 |
| HIGH_QUALITY | 0.3 | 4096 | 0.98 |

**Выход:**
```json
{
  "lm_config": {
    "profile": "BALANCED",
    "temperature": 0.2,
    "max_tokens": 2048,
    "top_p": 0.95,
    "context_length": 16384,
    "timeout": 60
  }
}
```

---

### 6.3. Создание Contract Signature

#### Tool 4: `define_contract_signature`

**Назначение:** Создать DSPy Signature на основе бизнес-анализа.

**Вход:**
```json
{
  "input_roles": [
    {
      "name": "string",
      "type": "string | text | list[string] | json",
      "description": "string",
      "required": true
    }
  ],
  "output_roles": [
    {
      "name": "string",
      "type": "string | label | score | json",
      "description": "string",
      "required": true,
      "format": "free_text | json_object | json_array | enum"
    }
  ],
  "task_type": "string",
  "domain": "string"
}
```

**Выход:**
```json
{
  "signature_id": "sig_abc123",
  "signature_code": "class AnalyzeRiskSignature(dspy.Signature):\n    ...",
  "fields": [
    {
      "name": "contract_text",
      "role": "input",
      "type": "string",
      "description": "Текст договора для анализа",
      "required": true
    }
  ]
}
```

**Эффект:** Создаётся Python-класс `dspy.Signature`.

---

### 6.4. Сборка DSPy Program

#### Tool 5: `assemble_program_pipeline`

**Назначение:** Создать стартовый spec программы.

**Вход:**
```json
{
  "task_type": "string",
  "needs_retrieval": true,
  "needs_tool_use": false,
  "needs_chain_of_thought": true,
  "complexity_level": "low | medium | high"
}
```

**Выход:**
```json
{
  "program_spec": {
    "modules": [
      {
        "name": "Retriever",
        "type": "dspy.Retrieve",
        "params": {
          "k": 5,
          "source": "default"
        }
      },
      {
        "name": "MainPredictor",
        "type": "dspy.Predict",
        "signature": "AnalyzeRiskSignature"
      }
    ],
    "connections": [
      {
        "from": "Retriever.passages",
        "to": "MainPredictor.context"
      }
    ]
  }
}
```

---

#### Tool 6: `add_tactic_to_program`

**Назначение:** Добавить/заменить модуль в конвейере.

**Вход:**
```json
{
  "program_spec": { "...": "..." },
  "tactic_type": "Predict | ChainOfThought | ReAct | Retrieve | ProgramOfThought | MultiChainComparison | Retry",
  "position": "before | after | replace | append",
  "anchor_module_name": "string | null",
  "module_params": {
    "any": "any"
  }
}
```

**Допустимые тактики (DSPy модули):**

| Тактика | DSPy класс | Описание |
|---------|------------|----------|
| `Predict` | `dspy.Predict` | Базовый предиктор |
| `ChainOfThought` | `dspy.ChainOfThought` | Цепочка рассуждений |
| `ReAct` | `dspy.ReAct` | Reasoning + Acting |
| `Retrieve` | `dspy.Retrieve` | Поиск в базе знаний |
| `ProgramOfThought` | `dspy.ProgramOfThought` | Генерация кода |
| `MultiChainComparison` | `dspy.MultiChainComparison` | Сравнение нескольких цепочек |
| `Retry` | `dspy.Retry` | Повторная попытка с рефлексией |

**Выход:**
```json
{
  "program_spec": { "...updated...": "..." }
}
```

---

#### Tool 7: `finalize_program_assembly`

**Назначение:** Сгенерировать реальную DSPy-программу.

**Вход:**
```json
{
  "program_spec": { "...": "..." },
  "signature_id": "string"
}
```

**Выход:**
```json
{
  "program_id": "prog_xyz789",
  "program_code": "class RiskAnalyzerProgram(dspy.Module):\n    def __init__(self):\n        ...",
  "module_class_name": "RiskAnalyzerProgram"
}
```

---

### 6.5. Работа с Eval-данными

#### Tool 8: `load_eval_data`

**Назначение:** Загрузить JSON eval.

**Вход:**
```json
{
  "eval_data_path": "string"
}
```

**Выход:**
```json
{
  "dataset_summary": {
    "num_examples": 123,
    "input_fields": ["text", "context"],
    "output_fields": ["label", "explanation"]
  }
}
```

---

#### Tool 9: `prepare_eval_splits`

**Назначение:** Сделать train/dev/test split.

**Вход:**
```json
{
  "strategy": "simple_split | kfold | bootstrap",
  "train_ratio": 0.7,
  "dev_ratio": 0.2,
  "test_ratio": 0.1,
  "shuffle": true,
  "seed": 42
}
```

| Поле | Тип | По умолчанию | Ограничения |
|------|-----|--------------|-------------|
| `strategy` | enum | `simple_split` | — |
| `train_ratio` | float | `0.7` | (0, 1) |
| `dev_ratio` | float | `0.2` | (0, 1) |
| `test_ratio` | float | `0.1` | (0, 1) |
| `shuffle` | bool | `true` | — |
| `seed` | int | `42` | — |

**Правило:** `train_ratio + dev_ratio + test_ratio = 1.0`

**Выход:**
```json
{
  "split_summary": {
    "train": 86,
    "dev": 25,
    "test": 12
  }
}
```

---

#### Tool 10: `set_evaluation_metric`

**Назначение:** Выбор метрики под задачу.

**Вход:**
```json
{
  "task_type": "string",
  "domain": "string"
}
```

**Выход:**
```json
{
  "metric_name": "semantic_f1 | accuracy | rouge_l | bleu | exact_match | llm_judge",
  "metric_config": {
    "threshold": 0.8,
    "use_embedding_model": "text-embedding-3-large"
  }
}
```

**Автоматический выбор метрики:**

| task_type | Рекомендуемая метрика |
|-----------|----------------------|
| classification | accuracy |
| extraction | exact_match |
| summarization | rouge_l |
| reasoning | llm_judge |
| RAG | semantic_f1 |

---

### 6.6. Компилятор DSPy

#### Tool 11: `select_compiler_strategy`

**Назначение:** Выбор оптимизатора DSPy.

**Вход:**
```json
{
  "task_type": "string",
  "complexity_level": "low | medium | high",
  "eval_data_size": 123,
  "profile": "FAST_CHEAP | BALANCED | HIGH_QUALITY"
}
```

**Выход:**
```json
{
  "optimizer_type": "BootstrapFewShot | BootstrapFewShotWithRandomSearch | MIPRO | MIPROv2 | COPRO | BootstrapFinetune",
  "optimizer_params": {
    "max_bootstrapped_demos": 4,
    "max_labeled_demos": 16,
    "num_candidate_programs": 10,
    "num_threads": 4
  }
}
```

**Оптимизаторы DSPy:**

| Оптимизатор | Описание | Когда использовать |
|-------------|----------|-------------------|
| `BootstrapFewShot` | Базовый few-shot | Малые данные, быстрый старт |
| `BootstrapFewShotWithRandomSearch` | + случайный поиск | Средние данные |
| `MIPRO` | Multi-stage Instruction Proposal | Сложные задачи |
| `MIPROv2` | Улучшенный MIPRO | Высокое качество |
| `COPRO` | Coordinate Prompt Optimization | Оптимизация инструкций |
| `BootstrapFinetune` | Fine-tuning | Большие данные, прод |

---

#### Tool 12: `configure_compiler`

**Назначение:** Создать конкретный конфиг оптимизатора.

**Вход:**
```json
{
  "optimizer_type": "string",
  "optimizer_params": { "...": "..." },
  "metric_name": "string"
}
```

**Выход:**
```json
{
  "compiler_config_id": "cfg_abc123",
  "compiler_config_summary": {
    "optimizer_type": "MIPROv2",
    "metric_name": "semantic_f1",
    "params": {
      "max_bootstrapped_demos": 4,
      "max_labeled_demos": 16
    }
  }
}
```

---

#### Tool 13: `run_compilation`

**Назначение:** Запустить компиляцию (оптимизацию).

**Вход:**
```json
{
  "program_id": "string",
  "compiler_config_id": "string"
}
```

**Выход:**
```json
{
  "compiled_program_id": "compiled_xyz789",
  "eval_results": {
    "metric_value": 0.87,
    "metric_name": "semantic_f1",
    "best_demos": ["demo_1", "demo_2"],
    "num_iterations": 12
  },
  "status": "success | failure",
  "error_log": "string | null"
}
```

**Эффект:**
```python
optimizer = dspy.MIPROv2(metric=metric_fn, **params)
compiled_program = optimizer.compile(program, trainset=trainset)
```

---

### 6.7. Логирование и версионирование

#### Tool 14: `log_artifacts`

**Назначение:** Сохранить артефакты и метаданные.

**Вход:**
```json
{
  "program_id": "string",
  "signature_id": "string",
  "compiler_config_id": "string",
  "eval_results": { "...": "..." },
  "target_lm": "string"
}
```

**Выход:**
```json
{
  "artifact_version_id": "v_20241201_001",
  "logged": true,
  "storage_path": "/artifacts/v_20241201_001/"
}
```

---

### 6.8. Экспорт

#### Tool 15: `export_deployment_package`

**Назначение:** Подготовить пакет для продакшена.

**Вход:**
```json
{
  "compiled_program_id": "string",
  "target_lm": "string",
  "format": "python_module | fastapi_endpoint | langserve_spec | docker_image"
}
```

**Выход:**
```json
{
  "package_path": "/exports/risk_analyzer_v1/",
  "deployment_instructions": "1. Install dependencies...\n2. Run server...",
  "files": [
    "main.py",
    "program.py",
    "requirements.txt",
    "Dockerfile"
  ]
}
```

---

### 6.9. Безопасность и политики

#### Tool 16: `validate_output_policy`

**Назначение:** Проверка безопасности/политик.

**Вход:**
```json
{
  "domain": "string",
  "candidate_output": "string"
}
```

**Выход:**
```json
{
  "is_safe": true,
  "issues": ["potential_pii_leak", "legal_disclaimer_missing"],
  "sanitized_output": "string",
  "confidence": 0.95
}
```

**Проверки по домену:**

| Домен | Проверки |
|-------|----------|
| legal | Юридические disclaimers, отсутствие конкретных советов |
| finance | Финансовые предупреждения, отсутствие инвестиционных рекомендаций |
| medical | Медицинские disclaimers, направление к специалисту |
| general | PII, токсичность, bias |

---

### 6.10. Мониторинг

#### Tool 17: `monitor_runtime_metrics`

**Назначение:** Логирование продовых вызовов.

**Вход:**
```json
{
  "artifact_version_id": "string",
  "latency_ms": 123.4,
  "request_metadata": {
    "user_id": "string | null",
    "request_id": "string | null",
    "session_id": "string | null"
  },
  "user_feedback": {
    "rating": 4,
    "comment": "string"
  }
}
```

**Выход:**
```json
{
  "logged": true,
  "log_id": "log_abc123"
}
```

---

### 6.11. ReAct-Tools для самокоррекции

#### Tool 18: `analyze_failure`

**Назначение:** Анализ ошибок для самокоррекции.

**Вход:**
```json
{
  "error_log": "string",
  "context": {
    "program_id": "string | null",
    "signature_id": "string | null",
    "last_action": "string | null"
  }
}
```

**Выход:**
```json
{
  "error_type": "signature_mismatch | missing_field | invalid_format | optimizer_failure | low_metric | runtime_error | timeout",
  "severity": "low | medium | high | critical",
  "suggested_fix": "string",
  "affected_components": ["Signature", "Program", "Optimizer"],
  "root_cause": "string"
}
```

**Типы ошибок:**

| error_type | Описание | Типичное решение |
|------------|----------|------------------|
| `signature_mismatch` | Несоответствие полей Signature | Обновить define_contract_signature |
| `missing_field` | Отсутствует обязательное поле | Добавить поле в Signature |
| `invalid_format` | Неверный формат JSON/вывода | Уточнить format в output_roles |
| `optimizer_failure` | Ошибка оптимизатора | Изменить стратегию/параметры |
| `low_metric` | Метрика ниже порога | Добавить тактики, увеличить данные |
| `runtime_error` | Ошибка выполнения | Проверить код программы |
| `timeout` | Превышено время | Уменьшить сложность/параметры |

---

#### Tool 19: `propose_pipeline_fix`

**Назначение:** Предложить конкретный план исправлений.

**Вход:**
```json
{
  "error_type": "string",
  "current_program_spec": { "...": "..." },
  "current_signature": { "...": "..." },
  "eval_results": { "...": "..." }
}
```

**Выход:**
```json
{
  "fix_plan": [
    {
      "action": "fix_signature",
      "parameters": {
        "add_field": "context",
        "field_type": "string"
      },
      "priority": 1
    },
    {
      "action": "add_tactic",
      "parameters": {
        "type": "ChainOfThought",
        "position": "before",
        "anchor": "MainPredictor"
      },
      "priority": 2
    },
    {
      "action": "adjust_optimizer",
      "parameters": {
        "increase_demos": true,
        "new_max_demos": 8
      },
      "priority": 3
    }
  ],
  "estimated_improvement": 0.15,
  "confidence": 0.8
}
```

---

## 7. ReAct-логика и самокоррекция

### 7.1. Базовый принцип

LLM-Агент работает в режиме **ReAct (Reasoning + Acting)**:

1. **Thought (T)** — агент размышляет внутри LLM
2. **Action (A)** — агент вызывает зарегистрированные Tools
3. **Observation (O)** — получает результат выполнения Tool

### 7.2. Пример ReAct-цикла

```
Thought: I need to assemble a program based on the user's goal.
Action: assemble_program_pipeline(task_type="RAG", needs_retrieval=true, ...)
Observation: program_spec created with Retriever and MainPredictor modules.

Thought: Now I must run the optimizer.
Action: run_compilation(program_id="prog_001", compiler_config_id="cfg_001")
Observation: status="failure", error_log="Missing field 'context' in Signature"

Thought: I must analyze the failure.
Action: analyze_failure(error_log="Missing field 'context'...")
Observation: error_type="missing_field", suggested_fix="Add 'context' field to Signature"

Thought: I need a concrete fix plan.
Action: propose_pipeline_fix(error_type="missing_field", ...)
Observation: fix_plan=[{action: "fix_signature", parameters: {add_field: "context"}}]

Thought: I should update the Signature.
Action: define_contract_signature(input_roles=[..., {name: "context", ...}], ...)
Observation: signature_id="sig_002" created successfully.

Thought: Now I should rebuild and retry compilation.
Action: finalize_program_assembly(program_spec=..., signature_id="sig_002")
...
```

### 7.3. Условия останова

Агент завершает работу когда:

1. **Успех:** `status == "success"` И `metric_value >= threshold`
2. **Лимит итераций:** `iteration_count >= max_iterations` (20)
3. **Критическая ошибка:** `severity == "critical"` и нет возможности исправить

### 7.4. Конфигурация ReAct

```python
agent_executor = AgentExecutor(
    agent=gpt5_react_agent,
    tools=[
        analyze_business_goal,
        register_target_lm,
        configure_lm_profile,
        define_contract_signature,
        assemble_program_pipeline,
        add_tactic_to_program,
        finalize_program_assembly,
        load_eval_data,
        prepare_eval_splits,
        set_evaluation_metric,
        select_compiler_strategy,
        configure_compiler,
        run_compilation,
        log_artifacts,
        export_deployment_package,
        validate_output_policy,
        monitor_runtime_metrics,
        analyze_failure,
        propose_pipeline_fix,
    ],
    handle_parsing_errors=True,
    max_iterations=20,
    max_execution_time=300,
    return_intermediate_steps=True,
)
```

---

## 8. Пайплайн работы

### 8.1. Design-time (настройка/компиляция)

```
┌─────────────────────────────────────────────────────────────────┐
│                    ЭТАП 1: ИНИЦИАЛИЗАЦИЯ                        │
├─────────────────────────────────────────────────────────────────┤
│ 1. Получить ввод пользователя                                   │
│    - business_task_description                                  │
│    - target_lm                                                  │
│    - eval_data.json                                             │
│                                                                 │
│ 2. analyze_business_goal(task_description)                      │
│    → task_type, domain, input_roles, output_roles, ...          │
│                                                                 │
│ 3. register_target_lm(target_lm)                                │
│ 4. configure_lm_profile(profile="BALANCED")                     │
└─────────────────────────────────────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                ЭТАП 2: СОЗДАНИЕ КОНВЕЙЕРА DSPy                  │
├─────────────────────────────────────────────────────────────────┤
│ 1. define_contract_signature(input_roles, output_roles, ...)    │
│    → signature_id, signature_code                               │
│                                                                 │
│ 2. assemble_program_pipeline(task_type, needs_retrieval, ...)   │
│    → program_spec                                               │
│                                                                 │
│ 3. [При необходимости] add_tactic_to_program(...)               │
│    - ChainOfThought                                             │
│    - Retrieve                                                   │
│    - Retry                                                      │
│                                                                 │
│ 4. finalize_program_assembly(program_spec, signature_id)        │
│    → program_id, program_code                                   │
└─────────────────────────────────────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   ЭТАП 3: ПОДГОТОВКА EVAL                       │
├─────────────────────────────────────────────────────────────────┤
│ 1. load_eval_data(eval_data_path)                               │
│    → dataset_summary                                            │
│                                                                 │
│ 2. prepare_eval_splits(strategy="simple_split", ...)            │
│    → split_summary                                              │
│                                                                 │
│ 3. set_evaluation_metric(task_type, domain)                     │
│    → metric_name, metric_config                                 │
└─────────────────────────────────────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                ЭТАП 4: НАСТРОЙКА ОПТИМИЗАТОРА                   │
├─────────────────────────────────────────────────────────────────┤
│ 1. select_compiler_strategy(task_type, complexity_level, ...)   │
│    → optimizer_type, optimizer_params                           │
│                                                                 │
│ 2. configure_compiler(optimizer_type, optimizer_params, ...)    │
│    → compiler_config_id                                         │
└─────────────────────────────────────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     ЭТАП 5: КОМПИЛЯЦИЯ                          │
├─────────────────────────────────────────────────────────────────┤
│ 1. run_compilation(program_id, compiler_config_id)              │
│    → eval_results, compiled_program_id, status                  │
│                                                                 │
│ 2. ЕСЛИ status == "failure" ИЛИ metric_value < threshold:       │
│    ┌─────────────────────────────────────────────────────────┐  │
│    │              ReAct САМОКОРРЕКЦИЯ                        │  │
│    ├─────────────────────────────────────────────────────────┤  │
│    │ a. analyze_failure(error_log)                           │  │
│    │    → error_type, suggested_fix                          │  │
│    │                                                         │  │
│    │ b. propose_pipeline_fix(error_type, current_program_spec)│  │
│    │    → fix_plan                                           │  │
│    │                                                         │  │
│    │ c. Применить исправления:                               │  │
│    │    - define_contract_signature (если fix_signature)     │  │
│    │    - add_tactic_to_program (если add_tactic)            │  │
│    │    - configure_compiler (если adjust_optimizer)         │  │
│    │                                                         │  │
│    │ d. finalize_program_assembly → run_compilation          │  │
│    │                                                         │  │
│    │ e. Повторять до успеха или max_iterations               │  │
│    └─────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│              ЭТАП 6: ВЕРСИОНИРОВАНИЕ И ЭКСПОРТ                  │
├─────────────────────────────────────────────────────────────────┤
│ 1. log_artifacts(program_id, signature_id, eval_results, ...)   │
│    → artifact_version_id                                        │
│                                                                 │
│ 2. export_deployment_package(compiled_program_id, target_lm, ...)│
│    → package_path, deployment_instructions                      │
│                                                                 │
│ 3. Вернуть пользователю:                                        │
│    - artifact_version_id                                        │
│    - путь/инструкции для деплоя                                 │
│    - метрики качества                                           │
└─────────────────────────────────────────────────────────────────┘
```

### 8.2. Run-time (продовое исполнение)

```
┌─────────────────────────────────────────────────────────────────┐
│                    ПРОДОВОЕ ИСПОЛНЕНИЕ                          │
├─────────────────────────────────────────────────────────────────┤
│ 1. Приходит запрос от конечного пользователя                    │
│                                                                 │
│ 2. Сервис загружает compiled_program по artifact_version_id     │
│                                                                 │
│ 3. Выполнение: program(input) → output                          │
│                                                                 │
│ 4. [Опционально] validate_output_policy(domain, output)         │
│    → is_safe, sanitized_output                                  │
│                                                                 │
│ 5. monitor_runtime_metrics(artifact_version_id, latency_ms, ...)│
│                                                                 │
│ 6. Вернуть ответ пользователю                                   │
└─────────────────────────────────────────────────────────────────┘
```

**Важно:** На этапе Run-time GPT-5 Агент может быть не нужен — всё делает скомпилированный DSPy-Program.

---

## 9. Хранилище артефактов

### 9.1. Структура хранилища

```
/artifacts/
├── v_20241201_001/
│   ├── metadata.json
│   ├── signature.py
│   ├── program.py
│   ├── compiled_program.pkl
│   ├── optimizer_config.json
│   ├── eval_results.json
│   └── demos/
│       ├── demo_001.json
│       └── demo_002.json
├── v_20241201_002/
│   └── ...
└── index.json
```

### 9.2. Схема `metadata.json`

```json
{
  "artifact_version_id": "v_20241201_001",
  "created_at": "2024-12-01T10:30:00Z",
  "business_task_description": "string",
  "target_lm": "gpt-4o",
  "task_analysis": {
    "task_type": "RAG",
    "domain": "legal",
    "complexity_level": "high"
  },
  "signature_id": "sig_abc123",
  "program_id": "prog_xyz789",
  "compiler_config_id": "cfg_abc123",
  "eval_results": {
    "metric_name": "semantic_f1",
    "metric_value": 0.87,
    "num_iterations": 12
  },
  "react_iterations": 3,
  "total_llm_calls": 156,
  "total_cost_usd": 2.34
}
```

### 9.3. Операции с хранилищем

| Операция | Описание |
|----------|----------|
| `save_artifact` | Сохранить новую версию |
| `load_artifact` | Загрузить по version_id |
| `list_artifacts` | Список всех версий |
| `compare_artifacts` | Сравнить метрики двух версий |
| `rollback_artifact` | Откатиться к предыдущей версии |
| `delete_artifact` | Удалить версию |

---

## 10. Интеграция с Vector Store

### 10.1. Поддерживаемые Vector Stores

| Provider | Класс DSPy | Описание |
|----------|------------|----------|
| ChromaDB | `dspy.ChromadbRM` | Локальный, для разработки |
| Pinecone | `dspy.PineconeRM` | Облачный, масштабируемый |
| Weaviate | `dspy.WeaviateRM` | Self-hosted или облако |
| Qdrant | `dspy.QdrantRM` | Self-hosted |
| FAISS | `dspy.FAISSRetriever` | Локальный, быстрый |

### 10.2. Конфигурация Retriever

```python
retriever_config = {
    "provider": "chromadb | pinecone | weaviate | qdrant | faiss",
    "collection_name": "string",
    "embedding_model": "text-embedding-3-large",
    "k": 5,  # количество результатов
    "connection": {
        "host": "string",
        "port": 8000,
        "api_key": "string | null"
    }
}
```

### 10.3. Автоматическая настройка

При `needs_retrieval=true` агент автоматически:

1. Определяет оптимальный Vector Store по размеру данных
2. Создаёт коллекцию и индексирует документы
3. Добавляет `dspy.Retrieve` модуль в program_spec
4. Настраивает connections между Retriever и Predictor

---

## 11. Error Handling и Retry

### 11.1. Стратегии Retry

| Тип ошибки | Стратегия | Max retries | Backoff |
|------------|-----------|-------------|---------|
| `rate_limit` | Exponential backoff | 5 | 2^n секунд |
| `timeout` | Linear backoff | 3 | +30 секунд |
| `api_error` | Immediate retry | 2 | 1 секунда |
| `validation_error` | No retry | 0 | — |

### 11.2. Конфигурация Retry

```python
retry_config = {
    "max_retries": 3,
    "base_delay": 1.0,
    "max_delay": 60.0,
    "exponential_base": 2,
    "jitter": True,
    "retry_on": [
        "RateLimitError",
        "TimeoutError",
        "APIConnectionError"
    ],
    "no_retry_on": [
        "ValidationError",
        "AuthenticationError"
    ]
}
```

### 11.3. Circuit Breaker

```python
circuit_breaker_config = {
    "failure_threshold": 5,      # Открыть после 5 ошибок
    "success_threshold": 2,      # Закрыть после 2 успехов
    "timeout": 30,               # Время в открытом состоянии
    "half_open_max_calls": 3     # Вызовов в half-open
}
```

### 11.4. Fallback стратегии

| Сценарий | Fallback |
|----------|----------|
| Target LM недоступен | Переключение на backup LM |
| Vector Store недоступен | Работа без retrieval |
| Optimizer timeout | Использование BootstrapFewShot |
| Критическая ошибка | Возврат последней успешной версии |

---

## 12. Нефункциональные требования

### 12.1. Технологический стек

| Компонент | Технология | Версия |
|-----------|------------|--------|
| Язык | Python | 3.10+ |
| LLM Framework | LangChain | 0.1+ |
| Prompt Optimization | DSPy | 2.4+ |
| Agent Model | GPT-5 | — |
| Vector Store | ChromaDB / Pinecone | — |
| API Framework | FastAPI | 0.100+ |
| Task Queue | Celery | 5.3+ |

### 12.2. Производительность

| Метрика | Требование |
|---------|------------|
| Время компиляции | < 5 минут для 100 примеров |
| Latency inference | < 2 секунды (p95) |
| Throughput | > 100 RPS |
| Uptime | 99.9% |

### 12.3. Безопасность

- Все API ключи в environment variables
- Шифрование данных at rest и in transit
- Rate limiting на API endpoints
- Аудит логи всех операций
- RBAC для доступа к артефактам

### 12.4. Логирование

```python
logging_config = {
    "level": "INFO",
    "format": "%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    "handlers": ["console", "file", "structured"],
    "log_tool_calls": True,
    "log_react_steps": True,
    "log_llm_requests": True,
    "sensitive_fields": ["api_key", "password", "token"]
}
```

---

## 13. JSON Schema для Tools

### 13.1. Пример: `analyze_business_goal`

```json
{
  "name": "analyze_business_goal",
  "description": "Преобразовать текст бизнес-задачи в структурированный объект с типом задачи, доменом, ролями входа/выхода и требованиями.",
  "parameters": {
    "type": "object",
    "properties": {
      "task_description": {
        "type": "string",
        "description": "Текстовое описание бизнес-задачи",
        "minLength": 10,
        "maxLength": 8000
      }
    },
    "required": ["task_description"]
  },
  "returns": {
    "type": "object",
    "properties": {
      "task_type": {
        "type": "string",
        "enum": ["RAG", "classification", "extraction", "summarization", "reasoning", "routing", "hybrid"]
      },
      "domain": { "type": "string" },
      "input_roles": {
        "type": "array",
        "items": { "type": "string" }
      },
      "output_roles": {
        "type": "array",
        "items": { "type": "string" },
        "minItems": 1
      },
      "needs_retrieval": { "type": "boolean" },
      "needs_chain_of_thought": { "type": "boolean" },
      "needs_tool_use": { "type": "boolean" },
      "complexity_level": {
        "type": "string",
        "enum": ["low", "medium", "high"]
      },
      "safety_level": {
        "type": "string",
        "enum": ["normal", "high_risk"]
      }
    },
    "required": ["task_type", "domain", "output_roles", "complexity_level", "safety_level"]
  }
}
```

### 13.2. Полный каталог JSON Schema

Полные JSON Schema для всех 19 Tools доступны в файле:
`/config/tools_schema.json`

---

## Приложения

### A. Mapping таблица LM

| target_lm | DSPy provider | model_id |
|-----------|---------------|----------|
| gpt-4o | openai | gpt-4o |
| gpt-4o-mini | openai | gpt-4o-mini |
| gpt-5 | openai | gpt-5 |
| llama3-8b | together | meta-llama/Llama-3-8b-chat-hf |
| llama3-70b | together | meta-llama/Llama-3-70b-chat-hf |
| mistral-large | mistral | mistral-large-latest |
| claude-3-sonnet | anthropic | claude-3-sonnet-20240229 |
| claude-3-opus | anthropic | claude-3-opus-20240229 |

### B. Пример eval_data.json

```json
{
  "task_name": "contract_risk_analysis",
  "schema_version": "1.0",
  "examples": [
    {
      "input": {
        "text": "Договор купли-продажи SaaS-решения между ООО 'Альфа' и ООО 'Бета'...",
        "context": null,
        "metadata": { "contract_type": "saas", "language": "ru" }
      },
      "ideal_output": {
        "label": "high_risk",
        "explanation": "Отсутствует пункт об ограничении ответственности..."
      }
    },
    {
      "input": {
        "text": "Стандартный договор аренды офисного помещения...",
        "context": null,
        "metadata": { "contract_type": "lease", "language": "ru" }
      },
      "ideal_output": {
        "label": "low_risk",
        "explanation": "Все стандартные пункты присутствуют..."
      }
    }
  ]
}
```

---

**Конец документа**
