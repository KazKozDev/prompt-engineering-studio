# Evaluation Lab - Measure Quality

Don't guess if your prompt is good - **measure it**.

The Evaluation Lab tests your prompts against real scenarios and gives you scores.

## Why Measure?

**Humans are biased.** You might like a prompt, but that doesn't mean it works.

Evaluation answers:
-  Does it consistently work?
-  How quality is the output?
-  Does it handle edge cases?
-  How expensive is it (tokens)?

## The Workflow

```
1. Create test dataset (questions + expected answers)
2. Add prompts to test
3. Run evaluation (system tests each prompt on each question)
4. See scores and metrics
5. Pick your winner
```

## Setting Up Tests

### Step 1: Create a Dataset

Go to **Datasets** tab.

A dataset is test cases:
```
TEST CASE 1:
Q: "Explain photosynthesis quickly"
Expected: "Short explanation, 2-3 sentences, mentions sun/water/energy"

TEST CASE 2:
Q: "Explain photosynthesis technically"
Expected: "Include: chlorophyll, wavelengths, ATP, NADPH, light/dark reactions"

TEST CASE 3:
Q: "Explain photosynthesis with an analogy"
Expected: "Compare to familiar process, use metaphor, simple language"
```

### Step 2: Generate or Import Prompts

You can test:
- Prompts you generated here
- Prompts saved in your library
- Prompts you paste manually

### Step 3: Choose Metrics

Pick what to measure:

| Metric | Best For |
|---|---|
| **Quality** | Is the answer good? |
| **Consistency** | Same input = same type of output? |
| **Robustness** | Works for tricky/edge cases? |
| **Tokens** | Cost and efficiency |

## Understanding Results

### Quality Score (0-100)

How good is the answer?

- **0-40:** Poor, doesn't meet requirements
- **41-60:** Okay, some issues
- **61-80:** Good, ready for most uses
- **81-100:** Excellent, production-ready

**What's measured:**
- Does it answer the question?
- Is the information accurate?
- Is it clear and organized?
- Does it meet the expected format?

### Consistency (0-100%)

Does it give similar answers for similar inputs?

- **0-60%:** Unreliable, different answers each time
- **61-85%:** Mostly reliable
- **86-100%:** Very reliable, predictable

**Example:**
```
Q: "Explain AI"
A1: "AI is simulating human intelligence through computers..."

Q: "What is artificial intelligence?"
A2: "Artificial intelligence (AI) refers to computer systems..."

Score: 90% (Same concept, slightly different wording - good consistency)
```

### Robustness (0-100%)

Does it handle edge cases?

- **0-50%:** Breaks on unusual inputs
- **51-80%:** Handles most scenarios
- **81-100%:** Handles everything well

**Edge cases tested:**
- Very short questions
- Very long questions
- Ambiguous questions
- Questions in different styles
- Technical vs casual language

### Token Count

How many tokens does the answer use?

- Lower = cheaper (important for cloud APIs)
- Higher = more detailed answers
- Trade-off: Quality vs cost

## Comparing Prompts

The report shows side-by-side comparison:

```
PROMPT A: "Explain X"
├─ Quality: 78/100
├─ Consistency: 82%
├─ Robustness: 75%
└─ Avg Tokens: 187

PROMPT B: "Explain X step-by-step"
├─ Quality: 85/100  Best
├─ Consistency: 88%
├─ Robustness: 82%
└─ Avg Tokens: 245

PROMPT C: "Explain X briefly"
├─ Quality: 72/100
├─ Consistency: 90%  Best
├─ Robustness: 68%
└─ Avg Tokens: 95  Best
```

## Interpreting Results

### All high scores?
 All prompts are good → Pick based on tokens (cheaper is better)

### One clear winner?
 Use that prompt → It's better for your use case

### One high quality but high tokens?
 If budget allows → Use it. If tight → Use lower token version.

### One high consistency but lower quality?
 More predictable but less good → Use only if consistency matters most.

### All scores are low?
 Try different techniques → Generate new prompts with different approaches

## Best Practices for Testing

### Dataset Quality

 Good dataset:
- 10-30 test cases
- Mix of difficulty levels
- Real-world scenarios
- Clear expected outputs
- Covers edge cases

 Bad dataset:
- Only 2-3 cases
- All easy questions
- Artificial scenarios
- Vague expected outputs
- No edge cases

### Testing Strategy

**For new techniques:**
- Run once to see results

**For production:**
- Run 2-3 times to confirm consistency
- Test on multiple datasets
- Include edge cases

**For optimization:**
- Keep the same dataset
- Compare before/after changes
- Track improvements over time

## Exporting Results

You can:
-  Export scores as CSV
-  Download charts
-  Save full report
-  Share results with team

## Common Scenarios

### Scenario 1: Choosing Between Prompts

**You have:** 5 generated prompts
**Test:** On your use case dataset
**Decision:** Pick highest quality, secondary: lowest tokens

### Scenario 2: Proving a Prompt Works

**You have:** A prompt you think is good
**Test:** Run evaluation to get metrics
**Use:** Share scores to justify using it

### Scenario 3: Improving Over Time

**Do:** Save dataset as standard test
**Then:** Re-test new prompts against same dataset
**Track:** Improvement scores over weeks/months

### Scenario 4: Picking by Priority

**If budget matters most:** Pick lowest tokens
**If quality matters most:** Pick highest quality score
**If reliability matters:** Pick highest consistency
**If speed matters:** Pick lowest tokens (usually faster)

## Tips

 **Start simple** - 5 test cases is fine to start

 **Use real data** - Test with actual use cases

 **Reuse datasets** - Same dataset = comparable results

 **Document why you pick a prompt** - "85 quality + $0.50 cost" is good note

 **Re-test occasionally** - Verify your favorite still works

 **Watch for outliers** - One very good/bad test case? Might be an edge case

## Next Steps

1. **Save your winner** → Add to Prompt Library
2. **Use in production** → Deploy it
3. **Monitor performance** → Check history over time
4. **Keep testing** → Evaluation is ongoing, not one-time

---

**Remember:** Good data in = good decisions out. Spend time on your test dataset!
