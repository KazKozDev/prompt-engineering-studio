# Prompt Patterns - How Techniques Work

Each technique is based on scientific research. Here's what each one does and when to use it.

## Basic Patterns

### Zero-Shot
**What:** Just ask directly, no examples

```
Your prompt: "What is quantum computing?"
Becomes: "What is quantum computing?"
(No change - just processed directly)
```

**When to use:** Quick answers, simple questions
**Papers:** Brown et al. (2020) - "Language Models are Few-Shot Learners"

### Few-Shot
**What:** Provide 2-5 examples before the actual question

```
Example 1: Q: "What is AI?" A: "AI is..."
Example 2: Q: "What is ML?" A: "ML is..."
Your actual: Q: "What is DL?" A: "DL is..."
```

**When to use:** Want consistent format/style
**Papers:** Brown et al. (2020)

### Role Prompting
**What:** Make the AI adopt an expert role

```
"You are an expert quantum physicist.
Explain quantum computing in detail."
```

**When to use:** Expertise matters (medical, legal, technical)
**Papers:** Si et al. (2022) - "Prompting GPT-3 To Be Reliable"

---

## Reasoning Patterns

### Chain-of-Thought (CoT)
**What:** Force step-by-step reasoning

```
"Explain quantum computing by:
1. Starting with classical computing
2. Then explaining qubits
3. Explaining superposition
4. Explaining entanglement
5. Giving real applications"
```

**When to use:** Complex explanations, logic problems, tutorials
**Why works:** Shows the thinking process, reduces errors
**Papers:** Wei et al. (2022) - "Chain-of-Thought Prompting Elicits Reasoning"

### Tree of Thoughts (ToT)
**What:** Explore multiple solution paths

```
"Consider different approaches:
- Path A: Physics explanation
- Path B: Computer science explanation  
- Path C: Business value explanation
For each path, evaluate strengths and weaknesses.
Then choose which is best for your audience."
```

**When to use:** Creative tasks, multiple valid answers
**Why works:** More options = better chance of finding good answer
**Papers:** Yao et al. (2023) - "Tree of Thoughts"

### Least-to-Most Prompting
**What:** Solve simple version first, then build up

```
"Step 1: Solve this simple version of the problem
Step 2: Using that solution, solve this harder version
Step 3: Using both, solve the full problem"
```

**When to use:** Complex problems, tutorial writing
**Why works:** Building blocks are easier than all-at-once
**Papers:** Zhou et al. (2022) - "Least-to-Most Prompting"

### Self-Critique
**What:** Generate answer, then critique it

```
"1. First, explain quantum computing
2. Now critique your explanation:
   - What's missing?
   - What could be clearer?
   - What's wrong?
3. Now provide an improved version"
```

**When to use:** Accuracy is critical, reduce hallucinations
**Why works:** Self-correction improves quality
**Papers:** Saunders et al. (2022) - "Self-critiquing models"

---

## Advanced Patterns

### Graph of Thoughts (GoT)
**What:** Model reasoning as interconnected nodes

```
Think of the problem as a graph:
- Nodes: Individual thoughts/concepts
- Edges: How they relate
- Then combine nodes to reach solution
```

**When to use:** Very complex problems with many relationships
**Why works:** Shows hidden connections
**Papers:** Besta et al. (2023) - "Graph of Thoughts"

### ReAct (Reasoning + Acting)
**What:** Cycle of thinking → acting → observing

```
Thought: "The problem requires X"
Action: "Let me check resource X"
Observation: "Resource X shows Y"

Thought: "Now I know Y, so I can conclude Z"
Action: "Apply reasoning Z"
Observation: "Result is..."
```

**When to use:** Tasks requiring external info or tools
**Why works:** Grounding reasoning in reality
**Papers:** Yao et al. (2022) - "ReAct: Synergizing Reasoning and Acting"

### Self-Consistency
**What:** Generate multiple solutions, vote on best

```
"Solve this problem in 3 different ways.
For each solution, show your reasoning.
Then identify which solution is most reliable
based on the reasoning shown."
```

**When to use:** Need high confidence answer
**Why works:** Consensus = higher accuracy
**Papers:** Wang et al. (2022) - "Self-Consistency Improves Chain of Thought"

---

## Meta & Optimization Patterns

### Meta-Prompting
**What:** One LLM orchestrates multiple expert queries

```
"You are a conductor. Delegate this task to:
- Expert A (specialist in X)
- Expert B (specialist in Y)
- Expert C (specialist in Z)

Collect their inputs, then synthesize
the best combined answer."
```

**When to use:** Complex tasks needing multiple expertise
**Why works:** Different perspectives = complete answer
**Papers:** Suzgun & Kalai (2024) - "Meta-Prompting"

### TextGrad Optimization
**What:** Automatic improvement through feedback

```
Draft 1: "Explanation of topic..."
Gradient (feedback): "Too vague, needs more examples"
Draft 2: "Improved explanation..."
Gradient: "Better, but needs code examples"
Draft 3: "Final optimized explanation..."
```

**When to use:** Content that needs polish
**Why works:** Iterative improvement
**Papers:** Yuksekgonul et al. (2024) - "TextGrad"

---

## Choosing the Right Pattern

### For Explanations:
**Start with:** Chain-of-Thought
**If complex:** Add Self-Critique
**If multiple angles:** Use Tree of Thoughts

### For Accuracy:
**Best:** Self-Consistency (vote on multiple solutions)
**Second:** Self-Critique (improve one solution)

### For Creative Tasks:
**Best:** Tree of Thoughts (explore options)
**Second:** Meta-Prompting (multiple experts)

### For Step-by-Step Tasks:
**Best:** Least-to-Most (build up complexity)
**Second:** Chain-of-Thought (show reasoning)

### For Reliability:
**Best:** Combine several patterns
**Example:** CoT + Self-Critique + Self-Consistency

---

## Pattern Combinations

You can **combine patterns**:

### Pattern Stack 1: Safe & Thorough
```
1. Chain-of-Thought (show reasoning)
2. Self-Critique (improve it)
3. Self-Consistency (verify with different approach)
= Very reliable, slightly slow
```

### Pattern Stack 2: Fast & Creative
```
1. Tree of Thoughts (explore options)
2. Meta-Prompting (get expert input)
= Many creative angles, very complete
```

### Pattern Stack 3: Educational
```
1. Role Prompting (adopt teacher role)
2. Least-to-Most (build complexity)
3. Analogies (use real-world comparisons)
= Perfect for learning content
```

---

## Reading the Papers

Each technique has academic research behind it:

**Where to find:**
- Click on technique in studio
- See " Paper" and " arXiv" links
- Full academic explanation available

**What to look for:**
- Why the technique works
- When it helps vs hurts
- Performance comparisons
- Variations you can try

---

## Experimentation Flow

Don't just guess which pattern to use:

```
1. Try basic pattern (CoT for reasoning, Zero-Shot for speed)
2. See results
3. Try advanced pattern based on results
4. Compare and pick winner
5. Save winner
```

---

## Advanced: When Patterns Fail

Sometimes a pattern doesn't work. Here's why:

| Pattern | Fails When | Fix |
|---|---|---|
| Chain-of-Thought | Task too simple | Use Zero-Shot |
| Tree of Thoughts | Only one right answer | Use CoT instead |
| Self-Critique | LLM can't evaluate itself well | Add human review |
| Role Prompting | Role not relevant | Use Zero-Shot |
| Few-Shot | Examples are poor quality | Create better examples |

---

## Pro Tips

 **Test patterns systematically** - Try 2-3 patterns per task

 **Read the papers** - Understanding = better usage

 **Combine patterns** - Works better than single pattern

 **Save what works** - Build library of pattern combos

 **Document learnings** - Track what works for your domain

---

**Bottom line:** Patterns are tools. Experiment to find what works for YOU!
