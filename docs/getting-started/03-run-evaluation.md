# Evaluate Your Prompts

So you have 5 different prompt versions. But which one is actually the best? Let's test them.

## Why Evaluate?

**Numbers don't lie.**

You can *feel* like a prompt is good, but evaluation shows:
-  Does it consistently work?
-  How much does it cost (tokens)?
-  How fast is the response?
-  What score does it get on real test data?

## The Workflow

```
1. Create test dataset
2. Add your prompts to test
3. Run evaluation
4. See the results
5. Pick the winner
```

## Step by Step

### Step 1: Create a Dataset

Go to **Datasets** tab.

A dataset is a collection of test cases:
- **Input** - The actual question/task
- **Expected Output** - What a good answer should include

**Example Dataset:**
```
TEST CASE 1:
Input: "Explain photosynthesis to a 10-year-old"
Expected: "Simple explanation, uses analogies, mentions sun/plants/energy"

TEST CASE 2:
Input: "Explain photosynthesis to a biology student"
Expected: "Technical explanation, includes chlorophyll, chemical equations, light/dark reactions"

TEST CASE 3:
Input: "Explain photosynthesis quickly"
Expected: "Short (1-2 paragraphs), covers main concept only"
```

**How many test cases?**
- Minimum: 3-5 cases
- Good: 10-15 cases
- Excellent: 20+ cases

**Tips:**
- Cover different angles of your use case
- Include edge cases (tricky scenarios)
- Be specific in what "good output" means
- Mix difficulty levels if needed

### Step 2: Go to Evaluation Lab

Click **Evaluation Lab** tab.

1. Select your **test dataset**
2. Select the **prompts to test** (pick 2-5 of your best ones)
3. Choose **evaluation metrics** you care about:

| Metric | What It Measures |
|---|---|
| **Quality** | How good is the answer? (0-100 score) |
| **Consistency** | Does it give similar answers for similar inputs? |
| **Robustness** | Does it handle edge cases and variations? |
| **Performance** | Token count, speed, efficiency |

### Step 3: Run Evaluation

Click **"Run Full Evaluation"**

This will:
1. Test each prompt on each test case
2. Score the results
3. Compare performance
4. Generate a detailed report

**This might take a few minutes** depending on:
- Number of test cases
- Number of prompts
- Complexity of evaluation

### Step 4: See Results

You'll get charts and scores showing:

```
PROMPT A (Chain-of-Thought)
├─ Quality Score: 87/100 
├─ Consistency: 92% 
├─ Robustness: 78%
└─ Tokens: 245

PROMPT B (Tree of Thoughts)  
├─ Quality Score: 82/100
├─ Consistency: 85%
├─ Robustness: 91% 
└─ Tokens: 312

PROMPT C (Self-Critique)
├─ Quality Score: 94/100 
├─ Consistency: 88%
├─ Robustness: 94% 
└─ Tokens: 289
```

### Step 5: Pick Your Winner

Based on what matters most:
- **Best overall quality?** → Pick highest Quality Score
- **Need consistency?** → Pick highest Consistency
- **Budget tight?** → Pick lowest Tokens
- **Need reliability?** → Pick highest Robustness

**Balanced choice:** Usually pick the one with best Quality Score

## Understanding the Metrics

### Quality Score
- **0-30**: Poor, needs work
- **31-60**: Okay, could be better  
- **61-80**: Good, ready to use
- **81-100**: Excellent, production-ready

### Consistency (%)
- **Under 70%**: Produces different answers often (unreliable)
- **70-85%**: Consistent most of the time
- **85%+**: Very reliable for repeated use

### Robustness (%)
- **Under 60%**: Breaks on edge cases
- **60-80%**: Handles most scenarios
- **80%+**: Handles everything well

### Tokens & Performance
- Lower tokens = cheaper (especially for cloud providers)
- Faster = better user experience
- But don't sacrifice quality for speed

## Quick Tips

 **Test thoroughly** - 10 test cases minimum

 **Vary your inputs** - Different phrasings, contexts, edge cases

 **Run multiple times** - LLMs can vary slightly, run 2-3 times to confirm

 **Document your findings** - Note why you picked the winner

 **Save the best** - Add to your library for future use

 **Keep the dataset** - Reuse it to evaluate new prompts later

## Common Issues

**Q: All my prompts scored similar?**
- A: Good! Pick based on tokens (choose cheaper) or pick your favorite

**Q: One prompt is way worse than others?**  
- A: That technique might not suit your task. Generate again with different techniques

**Q: Scores seem inconsistent?**
- A: LLMs have natural variation. Run again to double-check. High variation means prompt is sensitive to wording

**Q: What's a "good enough" score?**
- A: For production: 75+. For internal tools: 65+. Depends on your use case

## Next Steps

1. **Save the winner** → Add to Prompt Library
2. **Use it in production** → Deploy your best prompt
3. **Monitor it** → Check History to see how it performs over time
4. **Keep testing** → New techniques or inputs might score higher

---

**Tip:** Save your dataset! You can reuse it to test new prompts later.
