# Prompt Engineering Studio

Automatically transforms your input — from zero-shot to advanced prompting — into optimized prompts.

![Prompt Engineering Studio Demo](https://img.shields.io/badge/Status-Working-brightgreen) ![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript\&logoColor=white) ![Vite](https://img.shields.io/badge/Vite-646CFF?logo=vite\&logoColor=white)

Prompt Engineering Studio is intended for AI practitioners, LLM developers, researchers, students, prompt engineers, UX designers, and hobbyists who want to explore and apply advanced prompt engineering techniques. The tool automatically transforms user input into optimized prompts according to selected techniques — from basic to state-of-the-art — making it useful for both experimentation and integration into real-world applications. It supports both local and cloud-based LLMs, and is accessible to users with or without prior experience in prompt engineering.

![Screenshot 2025-06-06 at 12 37 29](https://github.com/user-attachments/assets/acc1785d-656e-4b46-9ba1-ea1b9466c3fc)

## Quick Start

> Try Prompt Engineering Studio in your browser via Claude artifact: [Launch Online](https://claude.ai/public/artifacts/6572baf6-d867-4cee-b1a7-2625b24b2593)
> 
## Features

* **20+ Prompt Engineering Techniques** - From basic Zero-Shot to advanced Tree of Thoughts
* **Multi-Provider Support** - Works with Gemini, Ollama (local), and more
* **Real-time Generation** - Generate enhanced prompts instantly
* **Copy & Use** - One-click copy of generated prompts
* **Academic References** - Each technique includes paper citations and arXiv links
* **Modern UI** - Clean, responsive interface built with modern web technologies

## Supported Prompt Techniques

### Basic Techniques

* **Zero-Shot Prompting** - Direct queries without examples
* **Few-Shot Prompting** - Learning from input-output examples
* **Role Prompting** - Assigning expert roles to the model

### Advanced Reasoning

* **Chain-of-Thought** - Step-by-step reasoning processes
* **Tree of Thoughts** - Multiple solution path exploration
* **Graph of Thoughts** - Complex dependency modeling
* **ReAct** - Reasoning and Acting in structured cycles

### Meta-Cognitive Approaches

* **Self-Consistency** - Multiple solution verification
* **Self-Critique** - Critical evaluation of responses
* **Metacognitive Prompting** - Thinking about thinking
* **Reflection** - Post-solution analysis

### Modern Techniques (2023-2025)

* **Meta-Prompting** - LM conducting multiple expert queries
* **TextGrad Optimization** - Automatic prompt improvement
* **System Prompt Optimization** - Meta-learning approaches
* **Visual Chain-of-Thought** - Multimodal reasoning

## Supported LLM Providers

### Google Gemini

* **Models**: `gemini-2.5-flash-preview-04-17`, `gemini-pro`, etc.
* **Setup**: Requires API key from [Google AI Studio](https://makersuite.google.com/)

### Ollama (Local)

* **Models**: `llama3.2`, `gemma3:12b`, `mistral`, etc.
* **Setup**: Runs locally, no API key required
* **Privacy**: Complete data privacy, offline capable

### OpenAI

* **Status**: Implementation planned
* **Models**: GPT-4o, GPT-4o-mini, etc.

### Prerequisites

* **Node.js** (v16 or higher)
* **npm** or **yarn**

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/KazKozDev/prompt-engineering-studio.git
   cd prompt-engineering-studio
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Choose your LLM provider and set it up:**

#### Option A: Google Gemini

```bash
# Create .env.local file
echo "GEMINI_API_KEY=your_api_key_here" > .env.local
```

#### Option B: Ollama (Local)

```bash
# Install Ollama
curl -fsSL https://ollama.ai/install.sh | sh

# Start Ollama server
ollama serve

# Pull a model (in another terminal)
ollama pull gemma3:12b
```

4. **Start the development server**

   ```bash
   npm run dev
   ```

5. **Open in browser**

   ```
   http://localhost:5173
   ```

## Usage

1. **Configure LLM Provider**

   * Select your provider (Gemini/Ollama) from the dropdown
   * Enter model name (e.g., `gemma3:12b` for Ollama)
   * For Gemini: Enter your API key
   * Click "Save LLM Settings"

2. **Enter Your Query**

   * Type your question or task in the text area
   * Example: "Explain quantum computing"

3. **Select Techniques**

   * Choose one or more prompt engineering techniques
   * Use "Select All" for comprehensive analysis

4. **Generate Enhanced Prompts**

   * Click "Generate Enhanced Prompts"
   * Wait for AI to create optimized versions
   * Copy and use the generated prompts with any LLM

### Example Transformation

**Input Query:**

```
"Explain machine learning"
```

**Chain-of-Thought Enhanced:**

```
You are an expert in machine learning and data science. I need you to explain machine learning in a comprehensive way using step-by-step reasoning.

Please follow this structure:
1. First, define what machine learning is at its core
2. Then, explain the main types of machine learning
3. Provide concrete examples for each type
4. Explain how the learning process works
5. Discuss practical applications
6. Finally, summarize the key concepts

Please think through each step carefully and show your reasoning process as you build up the explanation from basic concepts to more complex applications.
```

### Testing

### Test Ollama Connection

```bash
node test-ollama.js
```

### Run in Development

```bash
npm run dev
```

### Build for Production

```bash
npm run build
npm run preview
```

### Academic References

This project implements techniques from cutting-edge research papers:

* **Chain-of-Thought**: Wei et al. (2022) - [arXiv:2201.11903](https://arxiv.org/abs/2201.11903)
* **Tree of Thoughts**: Yao et al. (2023) - [arXiv:2305.10601](https://arxiv.org/abs/2305.10601)
* **ReAct**: Yao et al. (2022) - [arXiv:2210.03629](https://arxiv.org/abs/2210.03629)
* **Meta-Prompting**: Suzgun & Kalai (2024) - [arXiv:2401.12954](https://arxiv.org/abs/2401.12954)
* \[... and 20+ more techniques with full citations]

## Tech Stack

* **Frontend**: TypeScript, HTML5, CSS3
* **Build Tool**: Vite
* **LLM Integration**: Google GenAI SDK, Ollama API
* **Styling**: Modern CSS with responsive design
* **Icons**: Material Symbols

---

If you like this project, please give it a star ⭐

For questions, feedback, or support, reach out to:

[Artem KK](https://www.linkedin.com/in/kazkozdev/) | MIT [LICENSE](LICENSE)
