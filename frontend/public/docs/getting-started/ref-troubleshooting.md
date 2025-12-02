# Troubleshooting

Решение частых проблем.

## API ошибки

### "API key not configured"

**Решение:** Перейдите в Settings и добавьте API ключ для выбранного провайдера.

### "Rate limit exceeded"

**Решение:** 
- Подождите 1-2 минуты
- Уменьшите размер датасета
- Используйте другую модель

### "Model not found"

**Решение:** Проверьте что модель доступна для вашего API ключа.

## Evaluation проблемы

### "No samples in dataset"

**Решение:** Убедитесь что датасет содержит данные в правильном формате.

### "Evaluation stuck"

**Решение:**
1. Проверьте консоль браузера на ошибки
2. Обновите страницу
3. Уменьшите размер датасета

### Низкие scores

**Возможные причины:**
- Промпт не соответствует задаче
- Датасет содержит edge cases
- Неправильно выбрана метрика

## Ollama проблемы

### "Connection refused"

**Решение:** Убедитесь что Ollama запущен:
```bash
ollama serve
```

### "Model not loaded"

**Решение:** Загрузите модель:
```bash
ollama pull llama2
```

## Общие советы

1. **Проверьте консоль** — F12 → Console
2. **Очистите кэш** — ⌘ Shift R
3. **Перезапустите сервер** — если используете локально

## Нужна помощь?

- GitHub Issues: [github.com/KazKozDev/prompt-engineering-studio](https://github.com/KazKozDev/prompt-engineering-studio)
- Email: KazKozDev@gmail.com
