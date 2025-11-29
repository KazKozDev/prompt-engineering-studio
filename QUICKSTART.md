# PE Studio - Quick Start Guide

## Архитектура проекта

PE Studio состоит из трех компонентов:

1. **Backend API** (FastAPI) - порт 8000
2. **Frontend** (React + Vite) - порт 5174
3. **LLM Clients** (Ollama, Gemini, OpenAI)

## Быстрый запуск

### 1. Установка зависимостей

```bash
# Backend
pip install -r requirements.txt

# Frontend
cd frontend
npm install
cd ..
```

### 2. Запуск Backend API

```bash
PYTHONPATH=/Users/artemk/prompt-engineering-studio python src/api_server.py
```

API будет доступен на: `http://localhost:8000`

### 3. Запуск Frontend

```bash
cd frontend
npm run dev
```

Frontend будет доступен на: `http://localhost:5174`

## Доступные разделы

### ✅ Готовые разделы:

- **Studio** - основная функциональность
  - Генерация оптимизированных промптов
  - Выбор техник оптимизации
  - Поддержка Ollama, Gemini, OpenAI
  - API endpoints: `/api/techniques`, `/api/generate`, `/api/models/{provider}`

### 🚧 В разработке:

- **History** - история генераций (placeholder: `/api/history`)
- **Templates** - сохраненные шаблоны (placeholder: `/api/templates`)
- **Datasets** - датасеты (placeholder: `/api/datasets`)
- **API Keys** - управление ключами (placeholder: `/api/settings`)
- **Settings** - настройки (placeholder: `/api/settings`)

## API Endpoints

### GET /api/techniques
Получить все доступные техники оптимизации

### GET /api/models/{provider}
Получить доступные модели для провайдера (ollama, gemini, openai)

### POST /api/generate
Сгенерировать оптимизированные промпты

**Request:**
```json
{
  "prompt": "Your prompt here",
  "provider": "ollama",
  "model": "llama2",
  "api_key": "optional_for_gemini_openai",
  "techniques": ["cot", "react", "tree_of_thoughts"]
}
```

**Response:**
```json
{
  "results": [
    {
      "technique": {...},
      "response": "Optimized prompt",
      "tokens": 150
    }
  ]
}
```

## Структура проекта

```
prompt-engineering-studio/
├── src/
│   ├── api_server.py          # FastAPI сервер
│   ├── llm/                   # LLM клиенты
│   │   ├── ollama_client.py
│   │   ├── gemini_client.py
│   │   └── base.py
│   ├── prompts/               # Менеджер промптов
│   │   └── manager.py
│   └── utils/                 # Утилиты
│       └── logger.py
├── frontend/
│   └── src/
│       ├── App.tsx            # Главный компонент
│       ├── services/
│       │   └── api.ts         # API клиент
│       └── index.css
├── config/
│   └── model_config.yaml      # Конфигурация моделей
└── requirements.txt
```

## Конфигурация

Отредактируйте `config/model_config.yaml` для настройки моделей:

```yaml
models:
  ollama:
    model_name: llama2
    base_url: http://localhost:11434
  
  gemini:
    model_name: gemini-pro
  
  openai:
    model_name: gpt-4
```

## Troubleshooting

### Backend не запускается
- Проверьте, что все зависимости установлены: `pip install -r requirements.txt`
- Проверьте, что порт 8000 свободен

### Frontend не подключается к API
- Убедитесь, что backend запущен на порту 8000
- Проверьте CORS настройки в `src/api_server.py`

### Ollama не работает
- Убедитесь, что Ollama запущен: `ollama serve`
- Проверьте доступность: `curl http://localhost:11434/api/tags`
