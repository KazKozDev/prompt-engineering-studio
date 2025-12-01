# Generator: Transform Tasks into Optimized Prompts

## Overview

The **Generator** is the starting point of your prompt engineering workflow. It transforms your simple task description into sophisticated, technique-enhanced prompts using 30+ state-of-the-art prompting methods.

## Quick Start

### 1. Select Techniques

**Location:** Left panel → Techniques list

- **Filter by category:** Use tabs at the top (All, General, Reasoning, Coding, Summary, Writing, Extraction)
- **Browse techniques:** Scroll through the categorized list
- **Select techniques:** Click checkboxes next to desired techniques
- **Multi-select:** Choose multiple techniques to generate variants

**Popular techniques:**
- **Chain-of-Thought (CoT)** — Step-by-step reasoning
- **Few-Shot** — Learning from examples
- **ReAct** — Reasoning + Acting cycles
- **Tree of Thoughts (ToT)** — Explore multiple solution paths
- **Meta-Prompting** — LLM conducts expert queries

### 2. Describe Your Task

**Location:** Center panel → Task Description textarea

- **Be specific:** Clearly describe what you want the LLM to do
- **Include context:** Add relevant background information
- **Specify format:** Mention desired output structure if needed
- **Upload files:** Click "Upload" to import text/JSON/CSV files

**Example tasks:**
```
Create a customer support chatbot that handles refund requests with empathy
```
```
Analyze code for security vulnerabilities and suggest fixes
```
```
Summarize research papers into 3-bullet executive summaries
```

### 3. Generate Enhanced Prompts

**Location:** Center panel → Bottom right

- **Click "Generate"** or press **⌘/Ctrl + Enter**
- **Wait for processing:** Generation typically takes 5-30 seconds
- **View results:** Enhanced prompts appear in the right panel

### 4. Review and Use Results

**Location:** Right panel → Results

Each generated prompt shows:
- **Token count:** Size of the enhanced prompt
- **Expansion ratio:** How much larger than your original (e.g., "3.5x")
- **Actions:**
  - **Copy** — Copy to clipboard for use in any LLM
  - **Save** — Add to Library for versioning
  - **Edit** — Modify before saving

## Workflow Tips

### Preview Before Generating

- **Select a technique** → See preview in right panel
- **Review structure hints** — Understand how the technique works
- **Switch preview** — Use dropdown to preview different selected techniques

### Optimize Your Selections

- **Start small:** Try 1-3 techniques first
- **Compare results:** Generate multiple variants to find best approach
- **Task-specific:** Match techniques to your task type
  - **Reasoning tasks** → CoT, ToT, Step-Back
  - **Creative tasks** → Few-Shot, Role Prompting
  - **Code tasks** → Program-Aided, Chain of Code
  - **Analysis tasks** → Self-Critique, Metacognitive

### Save Successful Prompts

- **Individual save:** Click "Save" on specific results
- **Batch save:** Click "Save All" to add all results to Library
- **Auto-naming:** Prompts are named with technique + task snippet
- **Status:** Saved prompts marked with green "Saved" badge

## Advanced Features

### Technique Categories

Techniques are organized by primary use case:

1. **General** — Universal techniques (Zero-Shot, Few-Shot, Role)
2. **Reasoning** — Logic and analysis (CoT, ToT, GoT)
3. **Coding** — Programming tasks (PAL, Chain of Code, PoT)
4. **Summarization** — Condensing information (Chain of Density)
5. **Creative Writing** — Content generation
6. **Data Extraction** — Structured output (Chain of Table)

### File Upload Support

Supported formats:
- `.txt`, `.md` — Plain text and Markdown
- `.json` — Structured data
- `.csv` — Tabular data
- Content is appended to your task description

### Keyboard Shortcuts

- **⌘/Ctrl + Enter** — Generate prompts
- **Click checkbox** — Toggle technique selection

## Next Steps

After generating prompts:

1. **Test in Evaluation Lab** → Go to TEST: Evaluation
2. **Save to Library** → Go to DEPLOY: Library
3. **Optimize further** → Go to CREATE: Optimizer
4. **Create test dataset** → Go to TEST: Datasets

## Common Issues

**Problem:** "No prompts generated"
- **Solution:** Ensure you've selected at least one technique and entered a task description

**Problem:** "Generation takes too long"
- **Solution:** Check your LLM provider settings (Settings → LLM Configuration). Local models (Ollama) may be slower.

**Problem:** "Results are too generic"
- **Solution:** Provide more specific task descriptions with examples and constraints

## Best Practices

✅ **DO:**
- Start with clear, specific task descriptions
- Select 2-4 techniques for comparison
- Save successful prompts to Library
- Test prompts in Evaluation Lab before production

❌ **DON'T:**
- Use vague task descriptions like "help me with coding"
- Select all 30+ techniques at once (slow, overwhelming)
- Skip saving good results (hard to reproduce)
- Deploy without testing on datasets

---

**Related Sections:**
- [Optimizer](#) — Improve generated prompts
- [Evaluation](#) — Test prompt quality
- [Library](#) — Organize saved prompts
