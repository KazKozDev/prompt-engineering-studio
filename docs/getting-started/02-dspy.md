# DSPy Orchestrator: Automated Prompt Optimization

The **DSPy Orchestrator** replaces traditional manual prompt tuning with an automated, algorithmic approach. Instead of guessing which words work best, it uses **DSPy (Declarative Self-improving Language Programs)** to mathematically optimize your prompts against a dataset.

It treats your prompt as a "program" with parameters that can be tuned. An autonomous **ReAct Agent** manages this process, running experiments to find the best possible prompt structure and examples for your specific model and task.

## Quick Start

### 1. Configuration (Left Panel)

*   **Target Model:** Select the LLM you want to optimize for (e.g., GPT-4o, Gemini 1.5 Pro). Different models respond differently to prompts; DSPy optimizes specifically for your choice.
*   **Quality Profile:**
    *   **Fast & Cheap:** Uses lighter optimization (BootstrapFewShot). Good for quick prototypes.
    *   **Balanced:** A middle ground for most production cases.
    *   **High Quality:** Deep optimization (MIPROv2). Takes longer but produces state-of-the-art results.
*   **Optimizer Strategy:** Leave on **"Auto"** to let the agent decide, or manually select:
    *   *BootstrapFewShot:* Learns from examples.
    *   *MIPROv2:* Optimizes both instructions and examples (requires 50+ data points).
    *   *COPRO:* Rewrites instructions for clarity.

### 2. Define Task (Center Panel)

*   **Business Task:** Describe your goal in plain English (e.g., "Analyze legal contracts for risk").

### 3. Select Dataset

DSPy needs data to learn. For a quick test, 5–10 examples of input/output pairs are enough.  
For production-grade setups, see the **DSPy Guide** for detailed recommendations:  
`frontend/public/docs/getting-started/10-dspy-guide.md`
*   **Select Dataset:** Click the "Dataset" button to choose an existing file.
*   **Generate Dataset:** If you don't have data, use the **Dataset Generator** (available in the Dataset picker) to create synthetic examples from your task description.

### 4. Run Optimization

Click **"Run DSPy"**.
*   The **ReAct Agent** will start working. You can watch its "thoughts" and "actions" in the bottom panel.
*   It will compile your prompt, run evaluations, and iterate to improve the score.

### 5. Review Results (Right Panel)

Once complete, you get:
*   **Metric Score:** How well the prompt performed (0-100%).
*   **Optimized Program:** The final, compiled prompt code.
*   **Task Analysis:** The agent's understanding of your problem domain.
*   **Export/Save:** Save the optimized prompt to your Library for production use.

## Core Concepts

### Why DSPy?
Manual prompt engineering is brittle. A prompt that works for GPT-4 might fail for Claude 3. DSPy solves this by:
1.  **Separating Logic from Wording:** You define the *signature* (Input -> Output), DSPy figures out the *prompt*.
2.  **Data-Driven:** It optimizes based on actual performance on your dataset, not intuition.
3.  **Portability:** If you switch models, just re-run the orchestrator to get a new optimized prompt for the new model.

### The ReAct Agent
The Orchestrator is driven by an AI agent that uses **Reasoning + Acting (ReAct)**.
*   It analyzes your request.
*   It decides which DSPy module to use.
*   It runs the compilation pipeline.
*   It evaluates the results.
You can see this process happening in real-time in the "ReAct Agent Steps" panel.

## Best Practices

| ✓ DO | ✗ DON'T |
| --- | --- |
| **Start with "Balanced" profile:** It offers the best trade-off for most users. | **Run without data:** DSPy requires examples to work. |
| **Use high-quality datasets:** The optimization is only as good as your data. Ensure your examples are accurate. | **Interrupt the process:** Optimization can take a few minutes. Let the agent finish its cycles. |
| **Re-optimize for new models:** If you switch from GPT-4 to Gemini, run DSPy again. | **Ignore the metrics:** If the score is low, check your dataset quality or clarify your task description. |

## Next Steps

1.  **Save to Library:** Store your optimized prompt.
2.  **Deploy:** Use the generated artifact in your application.
3.  **Monitor:** Track performance in the Metrics section.
