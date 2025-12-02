# Prompt Patterns

Основные техники промпт-инжиниринга.

## Zero-Shot

Прямой запрос без примеров.

```
Classify this review as positive, negative, or neutral:
"{review}"
```

**Когда использовать:** Простые задачи, модель уже знает формат.

## Few-Shot

Запрос с примерами.

```
Classify reviews:

Review: "Great product!" → positive
Review: "Terrible quality" → negative
Review: "It's okay" → neutral

Review: "{review}" →
```

**Когда использовать:** Модель не понимает формат или нужна точность.

## Chain-of-Thought (CoT)

Пошаговое рассуждение.

```
Analyze this review step by step:
1. Identify key sentiment words
2. Determine overall tone
3. Classify as positive/negative/neutral

Review: "{review}"
```

**Когда использовать:** Сложные задачи, требующие логики.

## ReAct

Рассуждение + действия.

```
Question: {question}

Think: [reasoning about what to do]
Action: [search/calculate/lookup]
Observation: [result of action]
... repeat ...
Answer: [final answer]
```

**Когда использовать:** Задачи с внешними инструментами.

## Выбор техники

| Задача | Рекомендация |
|--------|--------------|
| Классификация | Few-Shot |
| Генерация текста | Zero-Shot + constraints |
| Математика | Chain-of-Thought |
| Поиск информации | ReAct |
