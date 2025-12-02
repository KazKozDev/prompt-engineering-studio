# Guardrails - Safety & Reliability

Guardrails are techniques to make AI output safer and more reliable.

## What Are Guardrails?

Guardrails are constraints that prevent bad output:

```
Without guardrails:
Q: "Tell me how to..."
A: [Anything, possibly harmful]

With guardrails:
Q: "Tell me how to..." 
A: [Controlled, safe, verified output]
```

## Common Guardrails

### 1. Output Format Constraint

**The guardrail:**
```
"Your answer MUST be:
- In bullet points
- Under 200 words
- Include citations
- No speculation"
```

**Why it works:**
- Clear boundaries prevent rambling
- Format makes it easier to verify
- Length limits prevent hallucinations spreading

**Example:**
```
 WITHOUT:
"Tell me about climate change"
→ Could be long, biased, unstructured

 WITH:
"Answer in 5 bullet points, max 50 words each, cite sources"
→ Clear, concise, verifiable
```

---

### 2. Confidence Levels

**The guardrail:**
```
"For each claim, rate your confidence:
- High (very sure)
- Medium (probably sure)
- Low (uncertain)

If Low, explain why you're uncertain"
```

**Why it works:**
- Forces self-awareness in AI
- Lets readers know what to trust
- Prevents false confidence

**Example:**
```
Q: "What's the latest AI news?"

Answer:
1. "Claude 3.5 was released" - Confidence: HIGH
   (In my training data)
2. "Next major release in Q1 2025" - Confidence: LOW
   (I cannot predict future releases)
3. "GPT-5 is being developed" - Confidence: MEDIUM
   (Based on public statements)
```

---

### 3. Explicit Boundaries

**The guardrail:**
```
"You MUST NOT:
- Give medical advice
- Recommend specific treatments
- Make legal recommendations
- Provide financial advice

Instead, suggest consulting a professional."
```

**Why it works:**
- Prevents harm
- Sets clear expectations
- Protects both user and AI

**Example:**
```
Q: "Is this mole on my skin cancer?"

 WITHOUT GUARDRAIL:
"That looks like melanoma. Get it removed immediately."

 WITH GUARDRAIL:
"I cannot diagnose medical conditions. Please consult
a dermatologist to have this checked by a professional."
```

---

### 4. Source Verification

**The guardrail:**
```
"You MUST cite your sources for:
- Statistics
- Studies
- Quotes
- Recent news

If you cannot cite a source, say so."
```

**Why it works:**
- Reduces hallucinations
- Makes claims traceable
- Builds trust

**Example:**
```
 Good:
"According to WHO (2024), climate change causes X...
Source: www.who.int/reports/2024/..."

 Bad:
"Climate change causes X..."
(No source - could be hallucinated)
```

---

### 5. User Input Validation

**The guardrail:**
```
"Before answering, verify:
1. Is this question clear?
2. Do I have enough information?
3. Are there ambiguities?

If confused, ask clarifying questions."
```

**Why it works:**
- Prevents misunderstandings
- Improves answer quality
- Shows AI is thinking

**Example:**
```
Q: "Should I do X?"

 WITHOUT:
"Yes, you should do X"

 WITH:
"Before answering, I need clarification:
1. What's your current situation?
2. What are your constraints?
3. What does success look like?
Can you provide more details?"
```

---

### 6. Consistency Check

**The guardrail:**
```
"Before finalizing your answer:
1. Does it contradict anything you said?
2. Is it consistent with known facts?
3. Would an expert agree?

If something seems inconsistent, fix it."
```

**Why it works:**
- Catches self-contradictions
- Increases reliability
- Shows logical thinking

**Example:**
```
Draft answer:
"Python is faster than C++ (statement A)
C++ is typically faster than Python (statement B)"

Consistency check:  CONTRADICTION!
Revision: "For most use cases, Python is slower than C++,
but Python is faster to develop in."
(Now consistent)
```

---

### 7. Instruction Following

**The guardrail:**
```
"You MUST follow these rules:
1. [Rule 1]
2. [Rule 2]
3. [Rule 3]

Do not deviate from these rules."
```

**Why it works:**
- Constrains behavior
- Prevents off-topic responses
- Keeps output consistent

**Example:**
```
"Rules:
1. Only recommend open-source tools
2. Include setup time for each
3. Compare total cost

Follow these rules exactly."
```

---

## When to Use Guardrails

### For Professional Content

```
 Apply guardrails to:
- Legal content (always)
- Medical content (always)
- Financial content (always)
- Business decisions (usually)
- Published articles (usually)
```

### For Internal Content

```
 Some guardrails to:
- Internal memos (format constraints)
- Team meetings (structure)
- Brainstorming (fewer constraints)

 Fewer guardrails for:
- Creative exploration
- Brainstorming
- Internal chat
```

### For Creative Content

```
 Few or no guardrails for:
- Creative writing
- Brainstorming
- Exploration
- Experimental work

 Some guardrails for:
- Length/format (word count)
- Style (tone, voice)
- Core message (main point)
```

---

## Combining Guardrails

**Maximum safety approach:**

```
1. Format constraint (bullet points, structured)
2. Source verification (cite sources)
3. Confidence levels (rate certainty)
4. Consistency check (no contradictions)
5. Explicit boundaries (what NOT to do)
```

**Result:** Highly reliable, trustworthy output

**Trade-off:** More restrictive, less creative

---

## Guardrail Implementation in Studio

### Via Technique Selection

Some techniques act as guardrails:

| Technique | Acts As Guardrail For |
|---|---|
| Self-Critique | Catching errors |
| Chain-of-Thought | Transparency, Logic |
| Self-Consistency | Reliability, Consensus |
| Reflection | Self-awareness |

### Via Prompt Modification

Modify your prompt to add guardrails:

```
Original:
"Explain machine learning"

With guardrails:
"Explain machine learning:
- Use 3 bullet points max
- Include 1 real example
- Cite if using recent data
- Rate your confidence (High/Medium/Low)
- Say if you're uncertain about anything"
```

---

## Red Flags When Guardrails Fail

If output still seems wrong:

 AI gave an answer but wasn't confident (Low confidence)
 AI couldn't cite sources
 AI made contradictory statements
 AI broke the explicit rules
 AI went off-topic

**Solution:** Add stricter guardrails or human review

---

## Best Practices

 **Use guardrails for factual content** - Always

 **Be specific** - "Under 200 words" better than "be concise"

 **Stack guardrails** - Multiple constraints = safer

 **Include human review** - Guardrails + human = safest

 **Document guardrails** - Say what constraints you applied

 **Don't over-constrain** - Too many rules = unusable output

 **Don't ignore guardrail violations** - If AI breaks rules, fix

---

## Examples by Domain

### Medical Context

```
Guardrails:
- No diagnoses (refer to doctor)
- No specific medication recommendations
- Cite medical authorities
- Add disclaimer
```

### Legal Context

```
Guardrails:
- No specific legal advice
- Refer to lawyer
- Cite laws/precedents
- Include disclaimer
```

### Business Context

```
Guardrails:
- Numbers backed by data
- State assumptions
- Acknowledge limitations
- Include confidence level
```

### Technical Context

```
Guardrails:
- Code must be tested
- Include error handling
- Document code
- State dependencies
```

---

## Guardrails Checklist

Before using output, verify:

- [ ] Format correct?
- [ ] All sources cited?
- [ ] Confidence level stated?
- [ ] Any contradictions?
- [ ] Within boundaries?
- [ ] Meets my needs?
- [ ] Does expert agree?

---

**Guardrails = Safety + Reliability **
