# ReAct (Reasoning + Acting)

**The brain of autonomous agents.** ReAct combines Chain-of-Thought reasoning with the ability to take actions (like searching the web or querying a database).

## The Core Idea

Standard LLMs are "brains in a jar" — they can think but can't interact with the world. ReAct solves this by running a loop:
`Thought -> Action -> Observation -> Thought`

1.  **Thought:** The model reasons about what to do next.
2.  **Action:** The model outputs a command (e.g., `Search["Who is the CEO of Apple?"]`).
3.  **Observation:** The system executes the command and gives the result back to the model.
4.  **Repeat:** The model uses the new info to continue reasoning.

> "ReAct synergizes reasoning and acting... reasoning traces help the model induce, track, and update action plans as well as handle exceptions, while actions allow it to interface with external sources." — *Yao et al. (2023)*

## Production Implementation

ReAct is the default architecture for most "Agents" (LangChain, AutoGPT).

### The Prompt Pattern
```text
Question: What is the elevation range of the area that the eastern sector of the Colorado orogeny extends into?

Thought 1: I need to search for "Colorado orogeny" to find the area it extends into, then find the elevation range of that area.
Action 1: Search["Colorado orogeny"]
Observation 1: The Colorado orogeny was an episode of mountain building... extending into the High Plains.

Thought 2: The eastern sector extends into the High Plains. I need to find the elevation of the High Plains.
Action 2: Search["High Plains elevation"]
Observation 2: The High Plains are a subregion... elevation rises from 1,160 ft to 7,800 ft.

Thought 3: I have the answer.
Action 3: Finish[1,160 ft to 7,800 ft]
```

## Best For
*   **Agents:** Building autonomous assistants.
*   **Multi-step tasks:** Tasks requiring up-to-date info (Search) or calculation (Calculator).
*   **Tool Use:** Interacting with APIs, databases, or file systems.

## Watch Out
*   **Looping:** Agents can get stuck in infinite loops (repeating the same search).
*   **Latency:** Each step is an LLM call + Tool latency. Very slow.
*   **Context Window:** Long histories of Thought/Action/Observation fill up context context quickly.

## Reference
*   **Paper:** ReAct: Synergizing Reasoning and Acting in Language Models
*   **Authors:** Shunyu Yao, Jeffrey Zhao, Dian Yu, et al. (Princeton & Google)
*   **ArXiv:** [2210.03629](https://arxiv.org/abs/2210.03629)
