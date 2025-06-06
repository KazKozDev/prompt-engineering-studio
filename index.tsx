import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

interface PromptTechnique {
  key: string;
  name: string;
  description: string;
  authors: string;
  paper: string;
  arxiv: string;
  year: string;
}

// Techniques ordered generally from simpler to more complex
const promptTechniques: PromptTechnique[] = [
  {
    key: "zero_shot",
    name: "Zero-Shot Prompting",
    description: "Direct query without examples, the model responds based on its knowledge.",
    authors: "Tom B. Brown et al.",
    paper: "Language Models are Few-Shot Learners",
    arxiv: "https://arxiv.org/abs/2005.14165",
    year: "2020"
  },
  {
    key: "few_shot",
    name: "Few-Shot Prompting",
    description: "Providing several input-output examples before the main query.",
    authors: "Tom B. Brown et al.",
    paper: "Language Models are Few-Shot Learners",
    arxiv: "https://arxiv.org/abs/2005.14165",
    year: "2020"
  },
  {
    key: "role_prompting",
    name: "Role Prompting",
    description: "Assigning the model the role of an expert in a specific field.",
    authors: "Chenglei Si et al.",
    paper: "Prompting GPT-3 To Be Reliable",
    arxiv: "https://arxiv.org/abs/2210.09150",
    year: "2022"
  },
  {
    key: "step_back",
    name: "Step-Back Prompting",
    description: "First analyzing general principles, then applying them to the specific task.",
    authors: "Huaixiu Steven Zheng et al.",
    paper: "Take a Step Back: Evoking Reasoning via Abstraction in Large Language Models",
    arxiv: "https://arxiv.org/abs/2310.06117",
    year: "2023"
  },
  {
    key: "chain_of_thought",
    name: "Chain-of-Thought Prompting",
    description: "Step-by-step reasoning where the model explains each step of the solution.",
    authors: "Jason Wei et al.",
    paper: "Chain-of-Thought Prompting Elicits Reasoning in Large Language Models",
    arxiv: "https://arxiv.org/abs/2201.11903",
    year: "2022"
  },
  {
    key: "least_to_most",
    name: "Least-to-Most Prompting",
    description: "Least-to-Most Prompting - breaking down complex problems into simpler subproblems solved sequentially.",
    authors: "Denny Zhou et al.",
    paper: "Least-to-Most Prompting Enables Complex Reasoning in Large Language Models",
    arxiv: "https://arxiv.org/abs/2205.10625",
    year: "2022"
  },
  {
    key: "complexity_based",
    name: "Complexity-Based Prompting",
    description: "Complexity-Based Prompting - using complex examples with many reasoning steps.",
    authors: "Yao Fu et al.",
    paper: "Complexity-Based Prompting for Multi-Step Reasoning",
    arxiv: "https://arxiv.org/abs/2210.00720",
    year: "2022"
  },
  {
    key: "structured_cot",
    name: "Structured Chain-of-Thought",
    description: "Structured Chain-of-Thought - using programming structures (sequence, branching, loop) in reasoning.",
    authors: "Jia Li et al.",
    paper: "Structured Chain-of-Thought Prompting for Code Generation",
    arxiv: "https://arxiv.org/abs/2305.06599",
    year: "2023"
  },
  {
    key: "reaction",
    name: "ReAct (Reasoning and Acting)",
    description: "Structured approach: Thought -> Action -> Observation -> repeat.",
    authors: "Shunyu Yao et al.",
    paper: "ReAct: Synergizing Reasoning and Acting in Language Models",
    arxiv: "https://arxiv.org/abs/2210.03629",
    year: "2022"
  },
  {
    key: "program_aided",
    name: "Program-Aided Language Models",
    description: "Using algorithmic thinking and pseudocode to solve.",
    authors: "Luyu Gao et al.",
    paper: "PAL: Program-aided Language Models",
    arxiv: "https://arxiv.org/abs/2211.10435",
    year: "2022"
  },
  {
    key: "self_critique",
    name: "Self-Critique Prompting",
    description: "Critically evaluating one's own answer against various criteria.",
    authors: "William Saunders et al.",
    paper: "Self-critiquing models for assisting human evaluators",
    arxiv: "https://arxiv.org/abs/2206.05802",
    year: "2022"
  },
  {
    key: "reflection",
    name: "Reflection Prompting",
    description: "Analyzing one's own thought process after obtaining the answer.",
    authors: "Noah Shinn et al.",
    paper: "Reflexion: Language Agents with Verbal Reinforcement Learning",
    arxiv: "https://arxiv.org/abs/2303.11366",
    year: "2023"
  },
  {
    key: "refinement",
    name: "Iterative Refinement",
    description: "Gradually improving the answer through iterations.",
    authors: "Aman Madaan et al.",
    paper: "Self-Refine: Iterative Refinement with Self-Feedback",
    arxiv: "https://arxiv.org/abs/2303.17651",
    year: "2023"
  },
  {
    key: "metacognitive",
    name: "Metacognitive Prompting",
    description: "Reflecting on one's own thinking process before responding.",
    authors: "Adian Liusie et al.",
    paper: "Metacognitive Prompting Improves Understanding in Large Language Models",
    arxiv: "https://arxiv.org/abs/2308.05342",
    year: "2023"
  },
  {
    key: "self_consistency",
    name: "Self-Consistency Decoding",
    description: "Solving the problem in multiple ways to check for consistency.",
    authors: "Xuezhi Wang et al.",
    paper: "Self-Consistency Improves Chain of Thought Reasoning in Language Models",
    arxiv: "https://arxiv.org/abs/2203.11171",
    year: "2022"
  },
  {
    key: "progressive_hint",
    name: "Progressive-Hint Prompting",
    description: "Progressive-Hint Prompting - using previous answers as hints for gradual improvement.",
    authors: "Chuanyang Zheng et al.",
    paper: "Progressive-Hint Prompting Improves Reasoning in Large Language Models",
    arxiv: "https://arxiv.org/abs/2304.09797",
    year: "2023"
  },
  {
    key: "analogical_prompting",
    name: "Analogical Prompting",
    description: "Analogical Prompting - automatically generating relevant examples based on analogies.",
    authors: "Michihiro Yasunaga et al.",
    paper: "Large Language Models as Analogical Reasoners",
    arxiv: "https://arxiv.org/abs/2310.01714",
    year: "2023"
  },
  {
    key: "skeleton_of_thought",
    name: "Skeleton-of-Thought",
    description: "Skeleton-of-Thought - first creating the structure of the answer, then filling in details in parallel.",
    authors: "Xuefei Ning et al.",
    paper: "Skeleton-of-Thought: Prompting LLMs for Efficient Parallel Generation",
    arxiv: "https://arxiv.org/abs/2307.15337",
    year: "2023"
  },
  {
    key: "chain_of_density",
    name: "Chain of Density",
    description: "Chain of Density - iteratively creating denser summaries without increasing length.",
    authors: "Griffin Adams et al.",
    paper: "From Sparse to Dense: GPT-4 Summarization with Chain of Density Prompting",
    arxiv: "https://arxiv.org/abs/2309.04269",
    year: "2023"
  },
  {
    key: "tree_of_thoughts",
    name: "Tree of Thoughts",
    description: "Considering multiple solution paths and selecting the best approach.",
    authors: "Shunyu Yao et al.",
    paper: "Tree of Thoughts: Deliberate Problem Solving with Large Language Models",
    arxiv: "https://arxiv.org/abs/2305.10601",
    year: "2023"
  },
  {
    key: "graph_of_thoughts",
    name: "Graph of Thoughts",
    description: "Graph of Thoughts - modeling information as a graph where thoughts are nodes and dependencies are edges.",
    authors: "Maciej Besta et al.",
    paper: "Graph of Thoughts: Solving Elaborate Problems with Large Language Models",
    arxiv: "https://arxiv.org/abs/2308.09687",
    year: "2023"
  },
  {
    key: "thought_propagation",
    name: "Thought Propagation",
    description: "Thought Propagation - using analogous problems and their solutions to improve reasoning.",
    authors: "Junchi Yu et al.",
    paper: "Thought Propagation: An Analogical Approach to Complex Reasoning with Large Language Models",
    arxiv: "https://arxiv.org/abs/2310.03965",
    year: "2023"
  },
  {
    key: "visual_cot",
    name: "Visual Chain-of-Thought",
    description: "Visual Chain-of-Thought - chain of thought reasoning for multimodal models with visual elements.",
    authors: "Hao Shao et al.",
    paper: "Visual CoT: Advancing Multi-Modal Language Models with Chain-of-Thought Reasoning",
    arxiv: "https://arxiv.org/abs/2403.16999",
    year: "2024"
  },
  {
    key: "self_harmonized",
    name: "Self-Harmonized Chain of Thought",
    description: "Self-Harmonized Chain of Thought - unifying diverse solution paths into consistent reasoning patterns.",
    authors: "Ziqi Jin et al.",
    paper: "Self-Harmonized Chain of Thought",
    arxiv: "https://arxiv.org/abs/2409.04057",
    year: "2024"
  },
  {
    key: "meta_prompting",
    name: "Meta-Prompting",
    description: "Meta-Prompting - using one LM as a conductor to manage multiple expert queries.",
    authors: "Mirac Suzgun, Adam Tauman Kalai",
    paper: "Meta-Prompting: Enhancing Language Models with Task-Agnostic Scaffolding",
    arxiv: "https://arxiv.org/abs/2401.12954",
    year: "2024"
  },
  {
    key: "prompt_engineering_pe2",
    name: "Prompt Engineering a Prompt Engineer",
    description: "Prompt Engineering a Prompt Engineer (PE2) - meta-prompting for automatic prompt engineering with detailed descriptions.",
    authors: "Qinyuan Ye et al.",
    paper: "Prompt Engineering a Prompt Engineer",
    arxiv: "https://arxiv.org/abs/2311.05661",
    year: "2024"
  },
  {
    key: "textgrad",
    name: "TextGrad Optimization",
    description: "TextGrad Optimization - automatic differentiation via text feedback for prompt optimization.",
    authors: "Mert Yuksekgonul et al.",
    paper: "TextGrad: Automatic Differentiation via Text",
    arxiv: "https://arxiv.org/abs/2406.07496",
    year: "2024"
  },
  {
    key: "system_prompt_optimization",
    name: "System Prompt Optimization",
    description: "System Prompt Optimization - two-level optimization of system prompts with meta-learning.",
    authors: "Yumin Choi et al.",
    paper: "System Prompt Optimization with Meta-Learning",
    arxiv: "https://arxiv.org/abs/2505.09666", // Note: arXiv IDs don't typically start with 25. This is from the source.
    year: "2025"
  }
];

let ai: GoogleGenAI | null = null;
let currentProvider: string = 'gemini';
let currentModel: string = 'gemini-2.5-flash-preview-04-17';
let currentApiKey: string = '';

function getLLMConfigFromUI() {
  const providerSelect = document.getElementById('llm-provider') as HTMLSelectElement;
  const modelInput = document.getElementById('llm-model') as HTMLInputElement;
  const apiKeyInput = document.getElementById('llm-api-key') as HTMLInputElement;
  if (providerSelect && modelInput && apiKeyInput) {
    currentProvider = providerSelect.value;
    currentModel = modelInput.value || (currentProvider === 'gemini' ? 'gemini-2.5-flash-preview-04-17' : currentProvider === 'openai' ? 'gpt-4o' : 'llama3.2');
    currentApiKey = apiKeyInput.value;
  }
  
  // Показать/скрыть поле API Key в зависимости от провайдера
  toggleApiKeyField();
}

function toggleApiKeyField() {
  const apiKeyContainer = document.getElementById('api-key-container');
  if (apiKeyContainer) {
    if (currentProvider === 'ollama') {
      apiKeyContainer.classList.add('hidden');
    } else {
      apiKeyContainer.classList.remove('hidden');
    }
  }
}

async function saveLLMConfig() {
  getLLMConfigFromUI();
  const statusSpan = document.getElementById('llm-save-status');
  
  if (!currentApiKey && currentProvider !== 'ollama') {
    if (statusSpan) {
      statusSpan.textContent = 'Enter API key.';
      statusSpan.style.color = '#d9534f';
      setTimeout(() => { statusSpan.textContent = ''; }, 2000);
    }
    return;
  }
  
  const success = await initializeGenAI();
  if (statusSpan) {
    if (success) {
      statusSpan.textContent = 'Settings saved!';
      statusSpan.style.color = '#007bff';
    } else {
      statusSpan.textContent = 'Error saving settings.';
      statusSpan.style.color = '#d9534f';
    }
    setTimeout(() => { statusSpan.textContent = ''; }, 2000);
  }
}

async function initializeGenAI() {
  try {
    if (currentProvider === 'gemini') {
      if (!currentApiKey) {
        console.log("API_KEY not provided yet.");
        return false;
      }
      ai = new GoogleGenAI({ apiKey: currentApiKey });
      return true;
    } else if (currentProvider === 'ollama') {
      // For Ollama, test connection to local server
      try {
        const healthResponse = await fetch('http://localhost:11434/api/tags');
        if (!healthResponse.ok) {
          throw new Error(`Ollama server responded with status: ${healthResponse.status}`);
        }
        const data = await healthResponse.json();
        const availableModels = data.models?.map((m: any) => m.name) || [];
        console.log('Ollama models available:', availableModels);
        
        // Check if the selected model exists
        if (availableModels.length > 0 && !availableModels.includes(currentModel)) {
          console.warn(`Model "${currentModel}" not found. Available models:`, availableModels);
          // You might want to show a warning to the user here
        }
        
        // Create a mock ai object with generateContent method for Ollama
        ai = {
          models: {
            generateContent: async (request: any) => {
              return await generateWithOllama(request.contents, request.model || currentModel);
            }
          }
        } as any;
        return true;
      } catch (error) {
        console.error("Failed to connect to Ollama:", error);
        if (error instanceof TypeError && error.message.includes('fetch')) {
          displayGlobalError("Cannot connect to Ollama server. Make sure Ollama is installed and running (try: ollama serve)");
        } else {
          displayGlobalError(`Failed to connect to Ollama server: ${error instanceof Error ? error.message : String(error)}`);
        }
        return false;
      }
    } else {
      ai = null; // For OpenAI add implementation when needed
      displayGlobalError("OpenAI provider is not implemented in this demo.");
      return false;
    }
  } catch (error) {
    console.error("Failed to initialize LLM:", error);
    displayGlobalError("Failed to initialize LLM service. Please check console for details.");
    return false;
  }
}

async function generateWithOllama(prompt: string, model: string): Promise<GenerateContentResponse> {
  try {
    const response = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model,
        prompt: prompt,
        stream: false
      })
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(`Model "${model}" not found. Make sure the model is installed in Ollama (run: ollama pull ${model})`);
      }
      throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    if (data.error) {
      throw new Error(`Ollama error: ${data.error}`);
    }
    
    // Return in the same format as Google's GenerateContentResponse
    return {
      text: data.response || '',
      usageMetadata: {
        candidatesTokenCount: data.eval_count || 'N/A'
      }
    } as GenerateContentResponse;
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Cannot connect to Ollama server. Make sure Ollama is running on localhost:11434');
    }
    console.error('Ollama generation error:', error);
    throw error;
  }
}

function displayGlobalError(message: string) {
  const resultsContainer = document.getElementById('results-container');
  if (resultsContainer) {
    resultsContainer.innerHTML = `<p class="error-message">${message}</p>`;
  }
  const generateButton = document.getElementById('generate-button') as HTMLButtonElement;
  if(generateButton) generateButton.disabled = true;
}


function renderTechniqueSelectors() {
  const techniquesListDiv = document.getElementById('techniques-list');
  if (!techniquesListDiv) return;

  techniquesListDiv.innerHTML = ''; // Clear previous, if any

  // Create "Select All" checkbox
  const selectAllContainer = document.createElement('div');
  selectAllContainer.className = 'technique-item select-all-item';

  const selectAllCheckbox = document.createElement('input');
  selectAllCheckbox.type = 'checkbox';
  selectAllCheckbox.id = 'tech_select_all';
  selectAllCheckbox.name = 'selectAllTechniques';
  selectAllCheckbox.setAttribute('aria-label', 'Select or deselect all techniques');

  const selectAllLabel = document.createElement('label');
  selectAllLabel.htmlFor = 'tech_select_all';
  selectAllLabel.textContent = 'Select All / Deselect All';

  selectAllContainer.appendChild(selectAllCheckbox);
  selectAllContainer.appendChild(selectAllLabel);
  techniquesListDiv.appendChild(selectAllContainer);

  const allTechCheckboxes: HTMLInputElement[] = [];

  promptTechniques.forEach(technique => {
    const itemDiv = document.createElement('div');
    itemDiv.className = 'technique-item';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.id = `tech_${technique.key}`;
    checkbox.name = 'technique';
    checkbox.value = technique.key;
    checkbox.setAttribute('aria-labelledby', `label_tech_${technique.key}`);
    allTechCheckboxes.push(checkbox);

    const label = document.createElement('label');
    label.htmlFor = `tech_${technique.key}`;
    label.id = `label_tech_${technique.key}`;
    label.textContent = `${technique.name} (${technique.year})`; // Add year to label

    itemDiv.appendChild(checkbox);
    itemDiv.appendChild(label);
    techniquesListDiv.appendChild(itemDiv);

    checkbox.addEventListener('change', () => {
      const numChecked = allTechCheckboxes.filter(cb => cb.checked).length;
      const totalCheckboxes = allTechCheckboxes.length;

      if (numChecked === totalCheckboxes) {
        selectAllCheckbox.checked = true;
        selectAllCheckbox.indeterminate = false;
      } else if (numChecked === 0) {
        selectAllCheckbox.checked = false;
        selectAllCheckbox.indeterminate = false;
      } else {
        selectAllCheckbox.checked = false; // Important for indeterminate state
        selectAllCheckbox.indeterminate = true;
      }
    });
  });

  selectAllCheckbox.addEventListener('change', () => {
    allTechCheckboxes.forEach(cb => {
      cb.checked = selectAllCheckbox.checked;
    });
    selectAllCheckbox.indeterminate = false; // Explicit action clears indeterminate state
  });

  // Set initial state of "Select All" checkbox (e.g. if loaded with some pre-checked)
  const numInitiallyChecked = allTechCheckboxes.filter(cb => cb.checked).length;
  const totalTechCheckboxes = allTechCheckboxes.length;

  if (totalTechCheckboxes > 0) { // Proceed only if there are checkboxes
    if (numInitiallyChecked === totalTechCheckboxes) {
      selectAllCheckbox.checked = true;
      selectAllCheckbox.indeterminate = false;
    } else if (numInitiallyChecked === 0) {
      selectAllCheckbox.checked = false;
      selectAllCheckbox.indeterminate = false;
    } else {
      selectAllCheckbox.checked = false;
      selectAllCheckbox.indeterminate = true;
    }
  } else { // No tech checkboxes, so "Select All" should be unchecked and not indeterminate
      selectAllCheckbox.checked = false;
      selectAllCheckbox.indeterminate = false;
  }
}


async function handleGeneratePrompts() {
  getLLMConfigFromUI();
  
  if (!currentApiKey && currentProvider !== 'ollama') {
    const resultsContainer = document.getElementById('results-container');
    if (resultsContainer) {
      resultsContainer.innerHTML = '<p class="error-message">Please save LLM settings before generation.</p>';
    }
    return;
  }
  
  const success = await initializeGenAI();
  if (!success || !ai) {
    const resultsContainer = document.getElementById('results-container');
    if (resultsContainer) {
      resultsContainer.innerHTML = '<p class="error-message">LLM initialization error. Check settings.</p>';
    }
    return;
  }

  const userQueryTextarea = document.getElementById('user-query') as HTMLTextAreaElement;
  const generateButton = document.getElementById('generate-button') as HTMLButtonElement;
  const loadingIndicator = document.getElementById('loading-indicator');
  const resultsContainer = document.getElementById('results-container');

  if (!userQueryTextarea || !generateButton || !loadingIndicator || !resultsContainer) return;

  const userInput = userQueryTextarea.value.trim();
  if (!userInput) {
    resultsContainer.innerHTML = '<p class="error-message">Please enter your question or task.</p>';
    return;
  }

  const selectedCheckboxes = document.querySelectorAll<HTMLInputElement>('#techniques-list input[name="technique"]:checked');
  if (selectedCheckboxes.length === 0) {
    resultsContainer.innerHTML = '<p class="error-message">Please select at least one prompt engineering technique.</p>';
    return;
  }

  generateButton.disabled = true;
  loadingIndicator.style.display = 'flex';
  resultsContainer.innerHTML = '';

  for (const checkbox of Array.from(selectedCheckboxes)) {
    const techniqueKey = checkbox.value;
    const technique = promptTechniques.find(t => t.key === techniqueKey);
    if (technique) {
      try {
        const metaPrompt = `You are an expert in prompt engineering. Your task is to refine a user's initial query into a more effective prompt using a specific technique.
User's Initial Query: "${userInput}"
Prompting Technique: "${technique.name}"
Technique Description: "${technique.description}"
Based on this, generate a new, improved prompt that incorporates the specified technique to achieve the user's goal.
The generated prompt should be ready to be used directly with a large language model. Respond ONLY with the generated prompt itself, without any preamble, introduction, or explanation.`;

        const response: GenerateContentResponse = await ai.models.generateContent({
          model: currentModel,
          contents: metaPrompt,
        });
        
        const generatedPromptText = response.text;
        const tokenCount = response.usageMetadata?.candidatesTokenCount ?? 'N/A';
        displayResult(technique, generatedPromptText || '', tokenCount);

      } catch (error) {
        console.error(`Error generating prompt for ${technique.name}:`, error);
        displayError(technique, `Failed to generate prompt. ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  }

  generateButton.disabled = false;
  loadingIndicator.style.display = 'none';
}

function displayResult(technique: PromptTechnique, generatedPrompt: string, tokenCount: number | string) {
  const resultsContainer = document.getElementById('results-container');
  if (!resultsContainer) return;

  if (resultsContainer.innerHTML !== '' && !resultsContainer.querySelector('.result-card')) {
    resultsContainer.innerHTML = '';
  }

  const card = document.createElement('div');
  card.className = 'result-card';
  card.setAttribute('aria-labelledby', `heading_${technique.key}`);

  const title = document.createElement('h3');
  title.id = `heading_${technique.key}`;
  title.textContent = `${technique.name} (${technique.year})`; // Add year to card title
  card.appendChild(title);

  const promptLabel = document.createElement('strong');
  promptLabel.textContent = 'Generated Prompt:';
  card.appendChild(promptLabel);

  const pre = document.createElement('pre');
  pre.textContent = generatedPrompt;
  card.appendChild(pre);

  const tokenCountP = document.createElement('p');
  tokenCountP.className = 'token-count';
  tokenCountP.innerHTML = `<strong>Tokens:</strong> ${tokenCount}`;
  card.appendChild(tokenCountP);


  const copyButton = document.createElement('button');
  copyButton.className = 'copy-button';
  copyButton.innerHTML = `<span class="material-symbols-outlined" style="font-size: 1em;">content_copy</span> Copy Prompt`;
  copyButton.setAttribute('aria-label', `Copy prompt for ${technique.name}`);
  copyButton.onclick = () => {
    navigator.clipboard.writeText(generatedPrompt)
      .then(() => {
        copyButton.innerHTML = `<span class="material-symbols-outlined" style="font-size: 1em;">check</span> Copied!`;
        setTimeout(() => {
         copyButton.innerHTML = `<span class="material-symbols-outlined" style="font-size: 1em;">content_copy</span> Copy Prompt`;
        }, 2000);
      })
      .catch(err => {
        console.error('Failed to copy text: ', err);
        copyButton.textContent = 'Error copying';
      });
  };
  card.appendChild(copyButton);

  const citationDiv = document.createElement('div');
  citationDiv.className = 'citation';
  citationDiv.innerHTML = `
    <strong>Technique Details:</strong>
    <p><strong>Authors:</strong> ${technique.authors} (${technique.year})</p>
    <p><strong>Paper:</strong> ${technique.paper}</p>
    <p><strong>arXiv:</strong> <a href="${technique.arxiv}" target="_blank" rel="noopener noreferrer">${technique.arxiv}</a></p>
  `;
  card.appendChild(citationDiv);

  resultsContainer.appendChild(card);
}

function displayError(technique: PromptTechnique, errorMessage: string) {
  const resultsContainer = document.getElementById('results-container');
  if (!resultsContainer) return;

  if (resultsContainer.innerHTML !== '' && !resultsContainer.querySelector('.result-card') && !resultsContainer.querySelector('.error-message[data-technique-error="true"]')) {
    resultsContainer.innerHTML = '';
  }

  const errorDiv = document.createElement('div');
  errorDiv.className = 'result-card error-message';
  errorDiv.setAttribute('data-technique-error', 'true');
  errorDiv.innerHTML = `
    <h3>Error: ${technique.name} (${technique.year})</h3>
    <p>${errorMessage}</p>
  `;
  resultsContainer.appendChild(errorDiv);
}

document.addEventListener('DOMContentLoaded', () => {
  renderTechniqueSelectors();
  // Инициализируем поля провайдера
  getLLMConfigFromUI();
  
  const generateButton = document.getElementById('generate-button');
  if (generateButton) {
    generateButton.addEventListener('click', handleGeneratePrompts);
  } else {
    console.error("Generate button not found.");
  }
  // Кнопка сохранения настроек LLM
  const llmSaveButton = document.getElementById('llm-save-button');
  if (llmSaveButton) {
    llmSaveButton.addEventListener('click', async () => {
      await saveLLMConfig();
    });
  }
  
  // Обработчик изменения провайдера
  const providerSelect = document.getElementById('llm-provider');
  if (providerSelect) {
    providerSelect.addEventListener('change', getLLMConfigFromUI);
  }
});
