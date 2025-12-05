# ReAct: Synergizing Reasoning and Acting

> **Deep Dive Guide** | [← Back to Methods Library](../getting-started/11-methods-library.md)

**Category:** Agents & Tools
**Best for:** Tasks requiring external information (Search, APIs) and dynamic reasoning
**Original paper:** ["ReAct: Synergizing Reasoning and Acting in Language Models" (Yao et al., 2022)](https://arxiv.org/abs/2210.03629)

This is a **detailed implementation guide** with direct paper quotes, production patterns, and analysis for integrating ReAct into your workflows.

---

## 1. Core Idea

ReAct combines **Reasoning** (Chain-of-Thought) and **Acting** (Tool Use) in an interleaved manner. Instead of just reasoning internally or just executing actions blindly, the model reasons about what to do, acts, observes the result, and then reasons again.

> "ReAct prompts LLMs to generate both reasoning traces and task-specific actions in an interleaved manner... reasoning traces help the model induce, track, and update action plans, while actions allow it to interface with external sources." — *Yao et al., 2022*

## 2. Why It Matters for Production

Static LLMs are limited by their training data cut-off (frozen knowledge). ReAct allows them to fetch real-time info (e.g., "Who won the game yesterday?") and perform actions (e.g., "Send email"), making them true **Agents**.

*   **Reduces Hallucination:** By relying on retrieved facts rather than internal memory.
*   **Adaptability:** Can solve multi-step problems where the next step depends on the previous result.

## 3. How It Works

The ReAct loop typically follows this pattern:
1.  **Thought:** The model analyzes the current state.
2.  **Action:** The model determines a tool to call (e.g., `Search[Query]`).
3.  **Observation:** The tool output is fed back to the model.
4.  **Repeat:** The cycle continues until the Final Answer is reached.

**Example Trace:**
> **Question:** What is the elevation of the Colorado River?
> **Thought 1:** I need to search for the Colorado River's elevation.
> **Action 1:** `Search["Colorado River elevation"]`
> **Observation 1:** The Colorado River starts at La Poudre Pass Lake (10,184 ft) and ends at the Gulf of California.
> **Thought 2:** I have the starting elevation. The question likely asks for that or the length. I should clarify or state the source.
> **Final Answer:** The Colorado River originates at 10,184 ft.

## 4. When to Use (and When Not To)

| Use When | Avoid When |
| :--- | :--- |
| The answer requires current information (Search). | The answer is purely logical/math (CoT is efficient). |
| The task involves interacting with APIs/Databases. | You need extremely low latency (multiple round-trips). |
| The problem is exploratory. | Formatting constraints are strict (Reasoning traces might break JSON output). |

## 5. Implementation in PE Studio

ReAct is the backbone of most "Agent" implementations. In **Prompt Engineering Studio**:

1.  **Few-Shot Prompting (Generator):**
    *   Construct a prompt that defines the available tools.
    *   Provide 1-2 examples of the Thought-Action-Observation loop.
    *   Stop generation at "Observation:" so you (the human/code) can provide the result.

    ```markdown
    Tools available: [Search, Calculator]
    
    Q: ...
    Thought: ...
    Action: Search["..."]
    Observation: (Wait for tool output)
    ```

2.  **DSPy Integration:**
    *   If using the upcoming DSPy modules, ReAct is a standard signature (`dspy.ReAct`).

## 6. Cost & Risk Considerations

*   **Looping Risk:** The model might get stuck in a "Thought-Action" loop without progressing. Implement a `max_steps` limit (e.g., 5 steps).
*   **Error Propagation:** If a tool returns bad data, the reasoning will be flawed.
*   **Context Window:** Long interaction traces consume context window quickly.

## 7. Advanced Techniques

*   **Reflexion:** Adding a "Reflect" step where the model critiques its own past actions if it fails.
*   **Tool selection:** Using a separate "router" call to pick the tool before generating the specific arguments.

## 8. Links to Original Research

*   [ReAct: Synergizing Reasoning and Acting in Language Models (arXiv)](https://arxiv.org/abs/2210.03629)
*   [LangChain ReAct Documentation](https://python.langchain.com/docs/modules/agents/agent_types/react)

## 9. Quick Reference Card

| Feature | Details |
| :--- | :--- |
| **Acronym** | ReAct |
| **Key Phrase** | "Interleaved Reason & Act" |
| **Key Paper** | Yao et al. (Google/Princeton, 2022) |
| **Cost Impact** | High (multiple inferences per tool call) |
| **Latency** | High (network calls + inference) |


