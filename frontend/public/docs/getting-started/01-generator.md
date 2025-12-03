# Generator: Create Sophisticated Prompts

The **Generator** is the core of the studio. It transforms your simple task description into sophisticated, technique-enhanced prompts using methodologies derived from **scientific papers (arXiv.org)**.

The transformation is performed by the **LLM currently selected in your Settings**, ensuring that the logic is applied using your preferred model's capabilities.

## Interface Guide

The Generator interface is divided into three main panels, designed to guide you through the prompt engineering workflow:

### 1. Techniques Panel (Left)
Choose the scientific method for your prompt.
- **Filters:** Narrow down techniques by category (Reasoning, Coding, Writing, etc.).
- **Technique List:** Select one or more techniques. Each item represents a specific paper or methodology (e.g., "Chain of Thought", "Tree of Thoughts").
- **Multi-select:** You can select multiple techniques to generate several variants at once.

### 2. Task Input (Center)
Define what you want to achieve.
- **Task Description:** Enter your raw, simple instruction here. Be specific about your goal.
- **Model Indicator:** Located at the top right of this panel. Shows which LLM (Provider/Model) will be used for the generation. *To change this, go to Settings.*
- **Generate Button:** Starts the transformation process using the selected model and techniques.

### 3. Preview & Results (Right)
- **The Black Square (Preview):** When you select a technique *before* generating, this panel shows the **Prompt Skeleton**. This is the exact schema or template extracted from the scientific paper that will be used to structure your prompt. It helps you understand how the technique works.
- **Results:** After generation, this area displays the final, optimized prompts ready for use.

## Quick Start

### Step 1: Select Techniques
Open the **left panel** and choose from 30+ prompting techniques.
*   **Reasoning tasks?** Try *Chain-of-Thought (CoT)* or *Tree of Thoughts (ToT)*.
*   **Coding tasks?** Try *Program-Aided Language Models (PAL)* or *Chain of Code*.
*   **Creative tasks?** Try *Role Prompting* or *Few-Shot*.

### Step 2: Describe Your Task
Write a clear task description in the **center panel**.
*   **Be specific:** Clearly describe what you want the LLM to do.
*   **Upload files:** You can upload text/code files to include as context.

### Step 3: Generate
Click **"Generate"** or press `⌘/Ctrl + Enter`.
*   The system will use your **selected LLM** to apply the technique's schema to your task.
*   Generation typically takes 5-30 seconds.

### Step 4: Review Results
View the enhanced prompts in the **right panel**.
*   **Token count:** See the size of the enhanced prompt.
*   **Expansion ratio:** See how much detail was added (e.g., "3.5x").
*   **Actions:** Copy, Save to Library, or Edit.

## Workflow Tips

### Preview Before Generating
*   **Select a technique** → Look at the **black square** in the right panel.
*   **Review the Schema:** You will see the structural template (the "skeleton") that the LLM will use. This gives you insight into the "scientific logic" behind the technique.

### Optimize Your Selections
*   **Start small:** Try 1-3 techniques first.
*   **Compare results:** Generate multiple variants to find the best approach for your specific model.
*   **Match techniques to tasks:**
    *   *Reasoning* → CoT, ToT, Step-Back
    *   *Creative* → Few-Shot, Role Prompting
    *   *Code* → Program-Aided, Chain of Code

### Save Successful Prompts
*   **Individual save:** Click "Save" on specific results.
*   **Batch save:** Click "Save All" to add all results to Library.
*   **Auto-naming:** Prompts are automatically named based on the technique and task.

## Advanced Features

### Technique Categories
Techniques are organized by primary use case:
*   **General** — Universal techniques (Zero-Shot, Few-Shot, Role)
*   **Reasoning** — Logic and analysis (CoT, ToT, GoT)
*   **Coding** — Programming tasks (PAL, Chain of Code, PoT)
*   **Summarization** — Condensing information (Chain of Density)
*   **Creative Writing** — Content generation
*   **Data Extraction** — Structured output (Chain of Table)

### File Upload Support

| Option | Details |
| --- | --- |
| Supported formats | `.txt`, `.md`, `.json`, `.csv` |
| How it is used | File content is appended to your task description. |

### Keyboard Shortcuts
*   `⌘/Ctrl + Enter` — Generate prompts
*   **Click checkbox** — Toggle technique selection

## Common Issues

**Problem:** "No prompts generated"
*   **Solution:** Ensure you've selected at least one technique and entered a task description.

**Problem:** "Generation takes too long"
*   **Solution:** Check your LLM provider settings (Settings → LLM Configuration). Local models (Ollama) may be slower.

**Problem:** "Results are too generic"
*   **Solution:** Provide more specific task descriptions with examples and constraints.

## Best Practices

| ✓ DO | ✗ DON'T |
| --- | --- |
| Start with clear, specific task descriptions. | Use vague task descriptions like "help me with coding". |
| Select 2-4 techniques for comparison. | Select all 30+ techniques at once (slow, overwhelming). |
| Save successful prompts to Library. | Skip saving good results (hard to reproduce). |
| Test prompts in Evaluation Lab before production. | Deploy without testing on datasets. |

## Next Steps

After generating prompts:
1.  **Test in Evaluation Lab** → Go to TEST: Evaluation
2.  **Save to Library** → Go to DEPLOY: Library
3.  **Optimize further** → Go to CREATE: Optimizer
4.  **Create test dataset** → Go to TEST: Datasets
