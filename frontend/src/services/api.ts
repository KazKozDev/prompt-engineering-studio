/**
 * API service for PE Studio
 * Handles all communication with the backend API
 */

const API_BASE_URL = 'http://localhost:8000';

export interface Technique {
  name: string;
  description: string;
  year: number;
  authors: string;
  paper: string;
  arxiv: string;
  structure_hint?: string;
}

export interface GenerateRequest {
  prompt: string;
  provider: string;
  model: string;
  api_key?: string;
  techniques: string[];
}

export interface GenerateResult {
  technique: Technique;
  response: string;
  tokens: number;
  error?: boolean;
}

export interface GenerateResponse {
  results: GenerateResult[];
}

class APIService {
  private baseURL: string;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
        throw new Error(error.detail || `HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error);
      throw error;
    }
  }

  async getTechniques(): Promise<{ techniques: Record<string, Technique> }> {
    return this.request('/api/techniques');
  }

  async getModels(provider: string): Promise<{ models: string[] }> {
    return this.request(`/api/models/${provider}`);
  }

  async generatePrompts(request: GenerateRequest): Promise<GenerateResponse> {
    return this.request('/api/generate', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async generateTitle(request: {
    prompt_text: string;
    provider: string;
    model: string;
    api_key?: string;
  }): Promise<{ title: string }> {
    return this.request('/api/generate-title', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async getHistory(limit?: number): Promise<{ history: any[]; stats: any }> {
    const params = limit ? `?limit=${limit}` : '';
    return this.request(`/api/history${params}`);
  }

  async getHistoryItem(id: string): Promise<any> {
    return this.request(`/api/history/${id}`);
  }

  async deleteHistoryItem(id: string): Promise<{ message: string }> {
    return this.request(`/api/history/${id}`, { method: 'DELETE' });
  }

  async getTemplates(): Promise<any> {
    return this.request('/api/templates');
  }

  async getDatasets(): Promise<any> {
    return this.request('/api/datasets');
  }


  async getSettings(): Promise<any> {
    return this.request('/api/settings');
  }

  async runOfflineEvaluation(request: {
    dataset: { input: string; output: string }[];
    prompts: string[];
    provider: string;
    model: string;
  }): Promise<any> {
    return this.request('/api/evaluator/offline', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async runConsistencyCheck(request: {
    prompt: string;
    n_samples: number;
    provider: string;
    model: string;
  }): Promise<any> {
    return this.request('/api/evaluator/consistency', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async runRobustnessTest(request: {
    prompt: string;
    dataset: { input: string; output: string }[];
    provider: string;
    model: string;
  }): Promise<any> {
    return this.request('/api/evaluator/robustness', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async runFullReport(request: {
    prompt: string;
    dataset: { input: string; output: string }[];
    provider: string;
    model: string;
  }): Promise<any> {
    return this.request('/api/evaluator/full_report', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async getTelemetryDashboard(timeRange: string = "7d"): Promise<any> {
    return this.request(`/api/evaluator/telemetry?time_range=${timeRange}`);
  }

  async optimizePrompt(request: {
    base_prompt: string;
    dataset: { input: string; output: string }[];
    provider: string;
    model: string;
  }): Promise<any> {
    return this.request('/api/evaluator/optimizer', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  // ==================== Dataset Management ====================

  async listDatasets(): Promise<any> {
    return this.request('/api/datasets');
  }

  async createDataset(request: {
    name: string;
    description?: string;
    category?: string;
    data: { input: string; output: string }[];
  }): Promise<any> {
    return this.request('/api/datasets', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async getDataset(datasetId: string): Promise<any> {
    return this.request(`/api/datasets/${datasetId}`);
  }

  async updateDataset(datasetId: string, request: {
    name?: string;
    description?: string;
    data?: { input: string; output: string }[];
  }): Promise<any> {
    return this.request(`/api/datasets/${datasetId}`, {
      method: 'PUT',
      body: JSON.stringify(request),
    });
  }

  async deleteDataset(datasetId: string): Promise<any> {
    return this.request(`/api/datasets/${datasetId}`, {
      method: 'DELETE',
    });
  }

  async getExampleDatasets(): Promise<any> {
    return this.request('/api/datasets/examples/list');
  }

  // ==================== Dataset Generation ====================

  async generateDataset(request: {
    mode: 'from_task' | 'from_examples' | 'from_prompt' | 'edge_cases';
    task_type?: 'classification' | 'extraction' | 'generation' | 'qa' | 'summarization' | 'translation' | 'custom';
    count?: number;
    difficulty?: 'easy' | 'medium' | 'hard' | 'mixed';
    domain?: string;
    include_edge_cases?: boolean;
    task_description?: string;
    seed_examples?: { input: string; output: string }[];
    prompt_to_test?: string;
    provider?: string;
    model?: string;
    api_key?: string;
    save_as_dataset?: boolean;
    dataset_name?: string;
    dataset_description?: string;
  }): Promise<{
    success: boolean;
    generated_count: number;
    data: { input: string; output: string }[];
    config: {
      mode: string;
      task_type: string;
      difficulty: string;
      domain: string;
    };
    saved_dataset?: {
      id: string;
      name: string;
    };
  }> {
    return this.request('/api/datasets/generate', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async getGenerationModes(): Promise<{
    modes: Record<string, {
      name: string;
      description: string;
      required_fields: string[];
      example: string;
    }>;
    task_types: { id: string; name: string; description: string }[];
    difficulties: { id: string; name: string; description: string }[];
  }> {
    return this.request('/api/datasets/generate/modes');
  }

  // ==================== Advanced Metrics ====================

  async calculateTextMetrics(request: {
    prediction: string;
    reference: string;
  }): Promise<any> {
    return this.request('/api/metrics/text', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async calculateCorpusMetrics(request: {
    predictions: string[];
    references: string[];
  }): Promise<any> {
    return this.request('/api/metrics/corpus', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async calculateBleu(request: {
    prediction: string;
    reference: string;
  }): Promise<any> {
    return this.request('/api/metrics/bleu', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async calculateRouge(request: {
    prediction: string;
    reference: string;
  }): Promise<any> {
    return this.request('/api/metrics/rouge', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async runLLMJudge(request: {
    prompt: string;
    response: string;
    criteria?: string;
    provider?: string;
    model?: string;
  }): Promise<any> {
    return this.request('/api/metrics/judge', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async runLLMJudgeBatch(request: {
    prompt: string;
    responses: string[];
    criteria?: string;
    provider?: string;
    model?: string;
  }): Promise<any> {
    return this.request('/api/metrics/judge/batch', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async getAvailableMetrics(): Promise<any> {
    return this.request('/api/metrics/available');
  }

  // ==================== API Key Management ====================

  async testApiKey(provider: string, apiKey: string): Promise<any> {
    return this.request('/api/settings/test-key', {
      method: 'POST',
      body: JSON.stringify({ provider, api_key: apiKey }),
    });
  }

  async saveApiKeys(apiKeys: Record<string, string>): Promise<any> {
    return this.request('/api/settings/api-keys', {
      method: 'POST',
      body: JSON.stringify({ api_keys: apiKeys }),
    });
  }

  async getApiKeys(): Promise<any> {
    return this.request('/api/settings/api-keys');
  }

  // ==================== Advanced Evaluation APIs ====================

  async runMutualConsistency(request: {
    prompts: string[];
    provider: string;
    model: string;
  }): Promise<any> {
    return this.request('/api/evaluator/mutual-consistency', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async runFormatRobustnessTest(request: {
    prompt: string;
    dataset: { input: string; output: string }[];
    provider: string;
    model: string;
  }): Promise<any> {
    return this.request('/api/evaluator/robustness/format', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async runLengthRobustnessTest(request: {
    prompt: string;
    dataset: { input: string; output: string }[];
    max_context_length: number;
    provider: string;
    model: string;
  }): Promise<any> {
    return this.request('/api/evaluator/robustness/length', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async runAdversarialRobustnessTest(request: {
    prompt: string;
    dataset: { input: string; output: string }[];
    level: 'light' | 'medium' | 'heavy';
    provider: string;
    model: string;
  }): Promise<any> {
    return this.request('/api/evaluator/robustness/adversarial', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async runPromptEval(request: {
    prompts: string[];
    dataset: { input: string; output: string }[];
    budget: number;
    provider: string;
    model: string;
  }): Promise<any> {
    return this.request('/api/evaluator/promp-eva', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }
}

export const api = new APIService();
