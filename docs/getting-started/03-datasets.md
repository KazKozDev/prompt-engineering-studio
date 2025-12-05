# Datasets - Create Test Data

Datasets are collections of test cases that help you evaluate which prompt works best.

Think of it as: **"Here are 10 real questions I want my prompt to handle. Can you do it for all of them?"**

## Why Create Datasets?

**Without datasets:**
-  You guess if a prompt is good
-  You test manually (slow, inconsistent)
-  You might use a bad prompt in production

**With datasets:**
-  Measure objectively
-  Test automatically
-  Compare prompts fairly
-  Reuse for future tests

## What Is a Test Case?

A test case has three parts:

```
QUESTION (Input):
"Explain machine learning to a 10-year-old"

EXPECTED OUTPUT (What a good answer should have):
"Simple explanation, uses everyday examples, 
no technical jargon, mentions learning patterns"

CATEGORY (Optional):
"Education - Simple Explanations"
```

## Creating a Dataset

### Step 1: Go to Datasets Tab

Click "Create New Dataset"

### Step 2: Name Your Dataset

Examples:
- "Customer Support Responses"
- "Technical Explanations"
- "Email Writing"
- "Code Debugging"

**Tip:** Name it after your use case, not "Test1"

### Step 3: Add Test Cases

For each test case:

1. **Input** - Paste an actual question/request
2. **Expected Output** - What a good answer should contain
3. **Category** (optional) - Label this test case

### Step 4: How Many Cases?

- **Minimum:** 3-5 cases
- **Good:** 10-15 cases
- **Excellent:** 20-30 cases

More cases = more confidence in results

## Writing Good Test Cases

###  Bad Test Cases:

```
INPUT: "Hi"
EXPECTED: "Good answer"
```

Problems:
- Too vague
- No real scenario
- Can't measure "good"

###  Good Test Cases:

```
INPUT: "A customer is upset about a delayed delivery. 
They bought a gift for their kid's birthday tomorrow. 
What should I say?"

EXPECTED: "Acknowledge frustration, apologize sincerely, 
offer solution (expedited shipping, refund, etc.), 
take ownership, show empathy"
```

## Common Datasets by Use Case

### Customer Support

```
Case 1: Complaint about billing
- Input: "I was charged twice for my subscription!"
- Expected: "Apologize, take responsibility, offer refund + credit"

Case 2: Product question
- Input: "Does this work with Mac?"
- Expected: "Direct answer, clear explanation, link to docs"

Case 3: Angry customer
- Input: "This is the worst service ever!"
- Expected: "Acknowledge emotion, take seriously, offer solution"
```

### Technical Content

```
Case 1: Beginner level
- Input: "Explain APIs"
- Expected: "Simple definition, real-world analogy, no jargon"

Case 2: Advanced level
- Input: "Explain REST API design principles"
- Expected: "Technical depth, mentions HTTP methods, status codes, etc."

Case 3: With examples
- Input: "How do webhooks work?"
- Expected: "Explanation + code example"
```

### Creative Writing

```
Case 1: Professional email
- Input: "Write a thank you email to client after meeting"
- Expected: "Warm but professional, specific details, call to action"

Case 2: Social media
- Input: "Write Instagram caption for product launch"
- Expected: "Engaging, includes emoji, calls to action, relevant hashtags"

Case 3: Short form
- Input: "Write a 30-word company tagline"
- Expected: "Memorable, concise, reflects brand values"
```

### Code Help

```
Case 1: Simple question
- Input: "How do I sort a list in Python?"
- Expected: "Simple answer, code example, brief explanation"

Case 2: Debugging
- Input: "My loop isn't working. [code snippet]"
- Expected: "Identifies issue, explains why, suggests fix"

Case 3: Architecture
- Input: "How to structure a React component library?"
- Expected: "Best practices, folder structure, examples"
```

## Dataset Best Practices

### Mix Difficulty Levels

```
EASY: "What is AI?" (Everyone should answer this)
MEDIUM: "Design an AI chatbot architecture" (Some will get this)
HARD: "Optimize LLM inference for edge devices" (Few will excel)
```

### Include Edge Cases

Edge cases are tricky scenarios:

```
Normal: "Write an email to a customer"
Edge case: "Write an email to an angry customer in Japanese" 
Edge case: "Write a sales email under 50 words"
Edge case: "Write an apology email for a critical bug"
```

### Cover Your Real Use Cases

Create datasets from:
-  Actual customer requests
-  Real questions people ask
-  Scenarios you care about
-  Problem areas you want to improve

 Don't use:
- Theoretical examples
- Cases you'll never encounter
- Random test data

### Be Specific in Expected Output

 Vague: "Good answer"

 Specific: 
- "Include: definition, 2 examples, 1 counterexample"
- "Format as bullet points"
- "Keep under 200 words"
- "Use technical terminology"
- "Reference [specific paper/source]"

## Using Datasets in Evaluation

1. **Create dataset** with your test cases
2. **Go to Evaluation Lab**
3. **Select dataset**
4. **Pick prompts to test**
5. **Run evaluation**
6. **See which prompt wins**

## Managing Datasets

### Edit a Dataset

Click a dataset → Click "Edit"

You can:
- Add more test cases
- Remove test cases
- Update expected outputs
- Change dataset name

### Duplicate a Dataset

Click "Duplicate" to:
- Copy entire dataset
- Make variations for different scenarios
- Reuse as template

Example:
```
Original: "Customer Support - English"
Copy 1: "Customer Support - Spanish"
Copy 2: "Customer Support - Formal"
```

### Delete a Dataset

Click dataset → Click "Delete"

 **Careful:** This is permanent. Export first if you want to keep it.

### Export a Dataset

Save dataset as JSON/CSV:
- Backup your work
- Share with team
- Use in other tools

## Advanced: Dataset Templates

Reusable dataset structures:

### Template 1: Q&A

```
Category: "General Q&A"
Case: Input question → Expected: Answer + sources
```

Best for: Education, FAQ, documentation

### Template 2: Task + Output

```
Category: "Content Generation"
Case: Input task → Expected: Specific format + requirements
```

Best for: Writing, content, creative tasks

### Template 3: Code Challenge

```
Category: "Programming"
Case: Input problem → Expected: Code + explanation
```

Best for: Coding, debugging, architecture

### Template 4: Customer Scenarios

```
Category: "Support"
Case: Input situation → Expected: Tone + solution
```

Best for: Customer service, communications

## Tips for Great Datasets

 **Start with 10 cases** - Build from there

 **Use real data** - Actual questions from your domain

 **Include context** - More detail = better evaluation

 **Be consistent** - Similar format for similar cases

 **Version your datasets** - v1.0, v1.1, v2.0

 **Document decisions** - Why these cases matter

 **Reuse datasets** - Same dataset for comparing new prompts

 **Keep evolving** - Add new cases as you encounter them

## Common Mistakes

 **Too few cases** - 3 cases isn't enough to trust results

 **All easy cases** - Doesn't test robustness

 **Vague expectations** - Can't measure quality fairly

 **Irrelevant cases** - Test what matters to you

 **Never updated** - Datasets get stale

## Next Steps

1. **Create your first dataset** - Pick a use case you care about
2. **Add 10 test cases** - Real scenarios
3. **Run evaluation** - Test your prompts
4. **Refine** - Add more cases, improve expectations
5. **Reuse** - Use same dataset to test new prompts

---

**Pro tip:** Invest time in a good dataset - it saves time evaluating prompts!
