# Reducing Hallucinations

Как уменьшить галлюцинации модели.

## Что такое галлюцинации?

Модель генерирует информацию, которой нет в контексте или которая неверна.

## Техники снижения

### 1. Явный контекст

```
Answer ONLY based on the provided context.
If the answer is not in the context, say "Information not found."

Context:
{context}

Question: {question}
```

### 2. Цитирование источников

```
Answer the question and cite the source.
Format: [Answer] (Source: [exact quote from context])

If you cannot find the answer, respond: "Not found in provided sources."
```

### 3. Степень уверенности

```
Provide your answer with a confidence level:
- HIGH: Information directly stated in context
- MEDIUM: Reasonable inference from context
- LOW: Uncertain, may require verification

Answer: [your answer]
Confidence: [HIGH/MEDIUM/LOW]
Reasoning: [why this confidence level]
```

### 4. Структурированный вывод

```json
{
  "answer": "...",
  "sources": ["quote1", "quote2"],
  "confidence": 0.85,
  "caveats": ["assumption1"]
}
```

## Тестирование на галлюцинации

В Evaluation Lab используйте:
- **Adversarial tests** — вопросы без ответа в контексте
- **Consistency checks** — один вопрос несколько раз

## Checklist

- [ ] Явно указано откуда брать информацию
- [ ] Есть инструкция для случая "не знаю"
- [ ] Требуется цитирование
- [ ] Валидация ответа на стороне приложения
