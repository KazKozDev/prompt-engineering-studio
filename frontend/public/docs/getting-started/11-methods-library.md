# Methods Library

Practical, production-focused summaries of the prompting and evaluation methods used in Prompt Engineering Studio. Each entry gives:

- a **short description** of the method,
- when it is **best used** (and when to avoid it),
- how to **test it in Evaluation Lab**, and
- links to the **original paper** + our extended method note.

---

## Self-Consistency (SC)

**Category:** Reasoning, Evaluation  
**Paper:** *Self-Consistency Improves Chain of Thought Reasoning in Language Models* (Wang et al., 2023, arXiv:2203.11171)

**What it does**  
Instead of trusting a single chain-of-thought (CoT), the model samples multiple reasoning paths for the same question and chooses the **most consistent final answer** across them (majority vote over answers).

**Best for**

- Complex reasoning tasks where CoT already helps:
  - math word problems (e.g., GSM8K, SVAMP, AQuA),
  - commonsense / symbolic reasoning (e.g., StrategyQA, ARC-Challenge).
- Situations where *stability* of answers matters more than raw latency.

**Avoid for**

- Simple one-token classifications (spam/ham, sentiment, intent tags).  
- Ultra low-latency paths where sampling many CoT traces is too expensive.

**How to use it in PE Studio**

- **Prompt Generator**
  - Describe your reasoning task.
  - Click **Suggest setup** — the advisor will often recommend *Self-Consistency* for suitable tasks.
  - Apply suggested techniques and generate CoT-style prompts.

- **Evaluation Lab → Consistency tab**
  - Select **Self-Consistency** as the evaluation method.
  - Choose a dataset with reasoning questions and correct final answers.
  - Set the number of samples (N) to control how many reasoning paths you draw.

**What to look at**

- Accuracy / exact match vs. standard CoT.  
- How often majority voting changes the final answer.  
- Cost and latency increase vs. quality gain.

**Further reading**

- Original paper PDF (in this repo): `docs/references/2203.11171.pdf`  
- Extended method note: `docs/methods/self-consistency.md`

---

More methods (Chain-of-Thought, PromptRobust, G-Eval, DSPy profiles) will be added here as production notes are finalized.

