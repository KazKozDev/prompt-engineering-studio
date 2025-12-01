# Robustness Lab - Уникальные Описания для Каждого Теста

## ✅ Реализовано

Добавлены **уникальные описания** в секцию "What It Measures" для каждого типа теста робастности. Теперь описание динамически меняется в зависимости от выбранного теста.

---

## 📋 Уникальные Описания

### 1. Format Sensitivity

**Когда показывается:** `_robustnessTestType === 'format'`

**Описание:**
> Tests if your prompt **maintains performance** when formatting changes (capitalization, spacing, punctuation). Critical for ensuring **cross-platform consistency** and handling real user input variations.

**Ключевые моменты:**
- ✅ Фокус на **сохранение производительности** при изменении формата
- ✅ Упоминание конкретных изменений: capitalization, spacing, punctuation
- ✅ Бизнес-ценность: **cross-platform consistency**
- ✅ Практическое применение: handling real user input variations

---

### 2. Context Length

**Когда показывается:** `_robustnessTestType === 'length'`

**Описание:**
> Measures **performance degradation** as context length increases. Essential for **RAG systems** and applications with long conversation histories or document processing.

**Ключевые моменты:**
- ✅ Фокус на **деградацию производительности**
- ✅ Четкая связь с контекстом: as context length increases
- ✅ Бизнес-ценность: Essential for **RAG systems**
- ✅ Практическое применение: long conversation histories, document processing

---

### 3. Adversarial Tests

**Когда показывается:** `_robustnessTestType === 'adversarial'`

**Описание:**
> Evaluates **resistance to malicious inputs**, prompt injection, and adversarial attacks. Crucial for **security validation** before production deployment.

**Ключевые моменты:**
- ✅ Фокус на **устойчивость к атакам**
- ✅ Конкретные угрозы: malicious inputs, prompt injection, adversarial attacks
- ✅ Бизнес-ценность: Crucial for **security validation**
- ✅ Практическое применение: before production deployment

---

## 🎯 Как это работает

1. **Пользователь выбирает тип теста** в RobustnessLab:
   - Кликает на "Format Sensitivity"
   - Кликает на "Context Length"
   - Кликает на "Adversarial Tests"

2. **RobustnessLab вызывает** `onTestTypeChange(_robustnessTestType)`

3. **EvaluationLab обновляет** `_robustnessTestType` state

4. **"What It Measures" автоматически меняется** на уникальное описание для выбранного теста

5. **Production Use Cases также меняются** (уже было реализовано ранее)

---

## 📍 Код

**Файл:** `/Users/artemk/prompt-engineering-studio/frontend/src/components/EvaluationLab.tsx`

**Строки:** ~404-424

**Логика:**
```tsx
<div className="bg-white/[0.03] border border-white/5 rounded-lg p-3">
  {_robustnessTestType === 'format' && (
    <p className="text-[11px] text-white/50 leading-relaxed">
      Tests if your prompt <span className="text-white/80 font-medium">maintains performance</span> when formatting changes...
    </p>
  )}
  {_robustnessTestType === 'length' && (
    <p className="text-[11px] text-white/50 leading-relaxed">
      Measures <span className="text-white/80 font-medium">performance degradation</span> as context length increases...
    </p>
  )}
  {_robustnessTestType === 'adversarial' && (
    <p className="text-[11px] text-white/50 leading-relaxed">
      Evaluates <span className="text-white/80 font-medium">resistance to malicious inputs</span>...
    </p>
  )}
</div>
```

---

## 🎨 Стиль

Все описания используют единый стиль:
- **Базовый текст:** `text-white/50` (серый)
- **Ключевые термины:** `text-white/80 font-medium` (белый, жирный)
- **Размер:** `text-[11px]`
- **Интервал:** `leading-relaxed`

---

## ✅ Итого

Теперь в Robustness Lab **динамически меняются**:

1. ✅ **"What It Measures"** - уникальное описание для каждого типа теста
2. ✅ **"Production Use Cases"** - 5 специфичных кейсов для каждого типа (15 всего)
3. ✅ **"Test Types"** - детальное описание метрик (статичное, но информативное)
4. ✅ **"When to Use"** - общие рекомендации (статичное)

**Пользователь получает полный контекст для каждого типа теста!** 🚀
