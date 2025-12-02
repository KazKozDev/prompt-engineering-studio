# The Generator - Your Prompt Optimizer

The Generator is the core tool - it takes your prompt and transforms it using cutting-edge techniques.

## Interface Breakdown

### Top Section: Your Prompt

**Write your task here:**
- Paste an instruction you want to improve
- Describe what you need the AI to do
- Add context if needed

**Tips:**
- Clear is better than creative (machine will add the creativity)
- Include constraints ("keep it under 100 words")
- Mention the audience if relevant ("for beginners")

**Example:**
```
"Explain why debugging is important for developers, 
and provide 3 practical debugging techniques"
```

### Middle Section: Choose Techniques

**Select which techniques to apply:**

**By Category:**
- General ← Use for almost anything
- Reasoning ← For logic, analysis, problem-solving
- Coding ← For programming tasks
- Summarization ← For extracting key points
- Creative Writing ← For content generation
- Data Extraction ← For parsing information
- Translation ← For language tasks

**Quick buttons:**
- **Select All** - Try all 20+ techniques at once
- **Clear** - Deselect everything
- **Filter** - Show only certain categories

**How many to pick?**
- Start with 3-5
- Can go up to 20+
- More techniques = more options but longer wait time

### Bottom Section: Settings

**Choose your AI provider:**
- **Gemini** - Fastest, cloud-based, requires API key
- **Ollama** - Local/private, no internet required
- **OpenAI** - Coming soon

**Select model:**
- Drop down shows available models
- Default is usually best choice
- Larger models = better quality but slower & more expensive

**API Key (if needed):**
- For Gemini/OpenAI: Add your API key
- For Ollama: Not needed (local)
- Keys are never stored, only used during generation

## Generation Process

### 1. Click "Generate Enhanced Prompts"

The system will:
1. Load your settings
2. Connect to the AI provider
3. For each technique:
   - Create a special "meta-prompt" 
   - Send to the AI
   - Get back an optimized version
   - Count tokens in response
4. Return all results

### 2. Results Appear

For each technique you selected:

**The Card Shows:**
- **Technique name** - "Chain-of-Thought"
- **Your optimized prompt** - The actual improved version
- **Token count** - How many tokens it uses
- **Copy button** - One-click copy to clipboard
- **Save button** - Add directly to library

**Example result:**
```
Chain-of-Thought Prompting
━━━━━━━━━━━━━━━━━━━━━━━━━━━

Explain why debugging is important:

First, explain the concept:
1. What is debugging? (removing errors/bugs)
2. Why is it crucial? (code quality, user experience)

Then, provide techniques:
1. Technique 1: Using print statements to trace code
2. Technique 2: Using a debugger to step through code
3. Technique 3: Writing unit tests to catch errors

Finally, tie them together with examples.

 Tokens: 187
```

### 3. Interact With Results

**Copy a prompt:**
- Click the copy icon
- Notification confirms it's copied
- Paste it in your AI tool

**Save to Library:**
- Click save icon
- Choose category and add notes
- It's instantly in your library

**Edit a prompt:**
- Click the edit icon
- Modify the text
- Save your version

**View more info:**
- Hover over technique name
- See the academic paper
- Read description

## Tips for Best Results

### Give Good Context
 Bad: "How to learn Python"
 Good: "How to learn Python for data science, assuming basic programming knowledge"

### Be Specific
 Bad: "Write something"
 Good: "Write a 300-word product description for a productivity app"

### Multiple Angles
Try the same prompt with:
- Different technique combinations
- Different AI providers (Gemini vs Ollama)
- More or less context

### Length Matters
 Longer originals = Better optimizations (more to work with)
 One-word prompts = Less improvement possible

### Feedback Loop
1. Generate variations
2. Try them in your AI tool
3. See what works
4. Go back and refine
5. Generate again with better inputs

## Common Techniques Explained

### Chain-of-Thought (CoT)
Adds: "Think step-by-step"
Best for: Logic, reasoning, explanations
Why: Forces the AI to show its work

### Self-Critique  
Adds: "Now critique your answer and improve it"
Best for: Accuracy, reducing hallucinations
Why: Self-correction improves quality

### Tree of Thoughts
Adds: "Explore multiple solution paths"
Best for: Creative tasks, problem-solving
Why: More angles = better solutions

### Role Prompting
Adds: "You are an expert in X"
Best for: Any task (adds authority)
Why: AI adopts the expertise mindset

### Least-to-Most
Adds: "First solve the simple part, then the complex"
Best for: Complex problems, tutorials
Why: Building blocks approach works better

## Keyboard Shortcuts

**Cmd/Ctrl + Enter** - Generate immediately (after selecting techniques)

## Performance Tips

**Faster results:**
- Use Ollama (local, no network delay)
- Select fewer techniques
- Use smaller prompts
- Pick a faster model

**Better results:**
- Use Gemini (more powerful)
- Select more techniques
- Give more context
- Use complex models

**Lower cost:**
- Use Ollama (free, local)
- Select fewer techniques
- Watch token count

## What Happens Next?

Once you have your optimized prompts:

1. **Try them** - Copy and test in ChatGPT, Claude, etc.
2. **Evaluate** - See which performs best with your data
3. **Save** - Keep the winners in your library
4. **Use** - Deploy in production

## Troubleshooting

**Q: Generation seems slow**
- A: Larger models take longer. Wait 30+ seconds. Check your internet.

**Q: Getting errors?**
- A: Check API key is correct. Make sure provider is running (Ollama).

**Q: Results look similar?**
- A: Different techniques work differently internally. Pick your favorite.

**Q: Want to edit a result?**
- A: Click the edit icon on any result card to modify.

---

**Next:** Test your prompts with [Evaluation Lab](./04-evaluation.md)
