# Robustness Lab - Dynamic Production Use Cases

## ✅ Реализовано

Добавлены **специфичные production use cases** для каждого типа теста в Robustness Lab. Теперь примеры меняются динамически в зависимости от выбранного теста.

---

## 📋 Production Use Cases по типам тестов

### 1. Format Sensitivity (Чувствительность к форматированию)

**Когда показывается:** `_robustnessTestType === 'format'`

- 🌐 **Multi-Platform Deployment:** Ensure prompts work across mobile apps, web interfaces, and API calls
- 📱 **User Input Variations:** Test with different capitalization, spacing, punctuation from real users
- 🔤 **Localization Testing:** Verify prompts handle different text encodings and special characters
- ⚡ **Template Flexibility:** Validate that minor formatting changes don't break functionality
- 🎨 **UI/UX Consistency:** Test prompts with different markdown, HTML, or plain text formats

**Бизнес-ценность:**
- Проверка работы промптов на разных платформах (мобайл, веб, API)
- Тестирование с реальными вариациями ввода пользователей
- Валидация локализации и спецсимволов

---

### 2. Context Length (Деградация при длинном контексте)

**Когда показывается:** `_robustnessTestType === 'length'`

- 📚 **RAG Systems:** Test if retrieval quality degrades with 10+ documents in context
- 📄 **Long Document Analysis:** Verify accuracy when processing full contracts, reports, manuals
- 💬 **Chat History:** Ensure chatbots maintain quality with extensive conversation history
- 🔍 **Search Results:** Test performance when context includes many search snippets or FAQs
- 📊 **Data Processing:** Validate behavior with large datasets, tables, or structured data in context

**Бизнес-ценность:**
- Критично для RAG-систем с множественными документами
- Важно для чат-ботов с длинной историей
- Необходимо для обработки больших документов (контракты, отчеты)

---

### 3. Adversarial Tests (Adversarial атаки)

**Когда показывается:** `_robustnessTestType === 'adversarial'`

- 🔐 **Security Testing:** Verify prompts resist injection attacks, jailbreaks before public deployment
- 🛡️ **Content Safety:** Test resistance to generating harmful, biased, or inappropriate content
- ⚠️ **Malicious Input Handling:** Validate behavior with typos, gibberish, adversarial examples
- 🎭 **Role-Playing Attacks:** Ensure prompts reject requests to ignore instructions or change behavior
- 🔒 **Compliance Validation:** Test prompts don't leak sensitive data or violate policies under stress

**Бизнес-ценность:**
- Безопасность перед публичным деплоем
- Защита от prompt injection и jailbreak
- Compliance и защита от утечки данных

---

## 🎯 Как это работает

1. **Пользователь выбирает тип теста** в RobustnessLab:
   - Format Sensitivity
   - Context Length
   - Adversarial Tests

2. **RobustnessLab вызывает** `onTestTypeChange(_robustnessTestType)`

3. **EvaluationLab обновляет** `_robustnessTestType` state

4. **Production Use Cases автоматически меняются** в правой панели на специфичные для выбранного теста

---

## 📍 Код

**Файл:** `/Users/artemk/prompt-engineering-studio/frontend/src/components/EvaluationLab.tsx`

**Строки:** ~462-540

**Логика:**
```tsx
{_robustnessTestType === 'format' && (
  // 5 кейсов для Format Sensitivity
)}
{_robustnessTestType === 'length' && (
  // 5 кейсов для Context Length
)}
{_robustnessTestType === 'adversarial' && (
  // 5 кейсов для Adversarial Tests
)}
```

---

## ✅ Итого

- ✅ **15 специфичных use cases** (5 для каждого типа теста)
- ✅ **Динамическое переключение** в зависимости от выбранного теста
- ✅ **Релевантные примеры** для каждого типа робастности
- ✅ **Единый стиль** с остальными секциями

**Теперь пользователи видят конкретные примеры для каждого типа теста робастности!** 🚀
