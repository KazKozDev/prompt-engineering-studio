"""FastAPI server for PE Studio.

This module provides REST API endpoints for the Prompt Engineering Studio,
connecting the React frontend with the backend LLM services.
"""
import os
import sys
from pathlib import Path

# Load .env file
from dotenv import load_dotenv
load_dotenv()

root_path = Path(__file__).parent.parent
sys.path.append(str(root_path))

from typing import Any, Dict, List, Optional

import yaml
import asyncio
import queue
import threading
import json
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

# Get OpenAI API key from environment
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

from src.llm.gemini_client import GeminiClient
from src.llm.ollama_client import OllamaClient
from src.llm.openai_client import OpenAIClient
from src.prompts.manager import PromptManager
from src.storage.history import HistoryManager
from src.storage.templates import TemplatesManager
from src.dataset_manager import DatasetManager
from src.hf_dataset_provider import search_hf_datasets, import_hf_dataset, inspect_hf_dataset
from src.dataset_generator import DatasetGenerator, GenerationConfig, GenerationMode, TaskType, Difficulty
from src.utils.logger import get_logger, setup_logging

setup_logging()
logger = get_logger(__name__)

app = FastAPI(title="PE Studio API")
history_manager = HistoryManager()
templates_manager = TemplatesManager()
dataset_manager = DatasetManager(data_dir=str(root_path / "data" / "datasets"))

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load config
def load_config() -> Dict[str, Any]:
    with open("config/model_config.yaml", "r") as f:
        return yaml.safe_load(f)

config = load_config()
prompt_manager = PromptManager()

# Models
class GenerateRequest(BaseModel):
    prompt: str
    provider: str
    model: str
    api_key: Optional[str] = None
    techniques: List[str]

class TechniqueResponse(BaseModel):
    technique: Dict[str, Any]
    response: str
    tokens: int

class TemplateCreate(BaseModel):
    name: str
    prompt: str
    description: str = ""
    category: str = "General"
    tags: List[str] = []

class TemplateUpdate(BaseModel):
    name: Optional[str] = None
    prompt: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    tags: Optional[List[str]] = None


class PromptSetupAnalysisRequest(BaseModel):
    """Request body for prompt setup analysis."""
    task_description: str
    # How many examples per local dataset to show the advisor (for context only)
    dataset_preview_examples: int = 3


def _normalize_key(text: str) -> str:
    """Normalize technique names/keys for comparison."""
    return ''.join(ch for ch in text.lower() if ch.isalnum())

# Routes
@app.get("/")
async def root():
    return {"message": "PE Studio API", "version": "1.0.0"}

@app.get("/api/techniques")
async def get_techniques():
    """Get all available techniques"""
    techniques = prompt_manager.get_all_techniques()
    return {"techniques": techniques}


@app.post("/api/analysis/prompt-setup")
async def analyze_prompt_setup(request: PromptSetupAnalysisRequest):
    """
    Analyze a task description and suggest techniques, dataset shape,
    and Evaluation Lab benchmarks.
    
    Uses a lightweight LangChain ChatOpenAI agent (gpt-5-mini) that
    knows about all registered techniques and returns a structured plan.
    """
    if not request.task_description.strip():
        raise HTTPException(status_code=400, detail="task_description is required")

    if not OPENAI_API_KEY:
        raise HTTPException(status_code=400, detail="OpenAI API key required for analysis")

    try:
        # Import locally to avoid hard dependency if LangChain is unavailable elsewhere
        from langchain_openai import ChatOpenAI
    except Exception as e:
        logger.error(f"LangChain / OpenAI client import error: {e}")
        raise HTTPException(status_code=500, detail="LangChain/OpenAI is not available on the backend")

    techniques = prompt_manager.get_all_techniques()

    # Collect local datasets with a small preview so the advisor can judge fit.
    # This lets the agent say which existing datasets are suitable for the task.
    local_datasets_summary: List[Dict[str, Any]] = []
    try:
        datasets = dataset_manager.list_datasets()
        preview_n = max(0, min(int(request.dataset_preview_examples or 0), 5))
        for ds in datasets:
            ds_id = ds.get("id")
            try:
                full = dataset_manager.get_dataset(ds_id) if ds_id else None
                items = (full or {}).get("data", []) if preview_n > 0 else []
                preview_items = items[:preview_n]
            except Exception as e:
                logger.warning(f"Failed to load dataset preview for {ds_id}: {e}")
                preview_items = []

            local_datasets_summary.append(
                {
                    "id": ds_id,
                    "name": ds.get("name"),
                    "description": ds.get("description", ""),
                    "size": ds.get("size", len(preview_items)),
                    "category": ds.get("category", ""),
                    "preview": preview_items,
                }
            )
    except Exception as e:
        logger.warning(f"Failed to list local datasets for analysis: {e}")
    technique_options = [
        {
            "key": key,
            "name": value.get("name"),
            "description": value.get("description", "")
        }
        for key, value in techniques.items()
    ]

    system_prompt = (
        "You are a senior prompt engineering advisor for an Evaluation Lab.\n"
        "Given a business task description, a catalog of prompt-engineering techniques, "
        "and a list of AVAILABLE LOCAL DATASETS, you must propose a concrete, "
        "step-by-step evaluation plan that fits THIS product:\n"
        "- Evaluation Lab tabs: Quality, Consistency, Robustness, Performance, Human, Overview.\n"
        "- Dataset sources:\n"
        "    * localDatasets: user-created datasets already in the workspace\n"
        "    * huggingface catalog: accessible via text search\n"
        "    * Dataset Generator: modes from_task, from_examples, from_prompt, edge_cases\n"
        "      with task_type (classification, extraction, qa, summarization, translation, generation, custom).\n\n"
        "Always respond with a single JSON object using EXACTLY these fields:\n"
        "  taskProfile: short lowercase string like 'classification', 'extraction',\n"
        "      'qa', 'summarization', 'translation', 'generation', or 'general'.\n"
        "  datasetHint: one sentence describing how {input, output} pairs should look.\n"
        "  benchmarkHint: one sentence that refers to THIS UI, e.g.\n"
        "      'Run Quality → Reference-Based, then Consistency and Robustness (Format/Adversarial)'.\n"
        "  techniqueSuggestions: array of up to 3 items, each with fields:\n"
        "      key: technique key from the provided list\n"
        "      name: human-friendly technique name.\n"
        "  localDatasetRecommendations: array of up to 3 objects describing LOCAL datasets that fit best, each:\n"
        "      { id, name, fit: 'high'|'medium'|'low', reason }\n"
        "      id MUST come from the provided localDatasets list when source is local.\n"
        "  hfSuggestions: array of up to 3 objects suggesting Hugging Face searches, each:\n"
        "      { query, reason }\n"
        "      query should be what the user types into the Online catalog search box.\n"
        "  generatorSuggestion: one object that recommends how to use Dataset Generator, with fields:\n"
        "      { mode, task_type, include_edge_cases, difficulty, count, reason }\n"
        "      mode ∈ ['from_task','from_examples','from_prompt','edge_cases'].\n"
        "      difficulty ∈ ['easy','medium','hard','mixed'].\n"
        "  dspyRecommendation: one object describing whether this task should use DSPy optimization in this product,\n"
        "      shaped as { suitable: boolean, reason, profile, warnings } where:\n"
        "        - suitable: true ONLY if there is enough data (≥30–50, ideally 300+), clear numeric metrics and a stable pipeline,\n"
        "        - profile: one of ['FAST_CHEAP','BALANCED','HIGH_QUALITY'] when suitable=true,\n"
        "        - reason: short explanation referencing the DSPy best‑practice criteria,\n"
        "        - warnings: mention cost/compute concerns and when not to use DSPy.\n"
        "  steps: array of short strings (1–2 sentences each) that explain the plan\n"
        "      step-by-step for the user (max 6 steps).\n\n"
        "If you are unsure, pick 'general' as taskProfile and choose broadly useful\n"
        "techniques (e.g., CoT, self-consistency, few-shot prompting). Do not include\n"
        "any extra commentary outside the JSON."
    )

    # Provide techniques and local datasets as context
    user_prompt = (
        "Task description:\n"
        f"{request.task_description.strip()}\n\n"
        "Available techniques (keys, names, descriptions):\n"
        f"{json.dumps(technique_options, ensure_ascii=False, indent=2)}\n\n"
        "Local datasets in this workspace (id, name, description, size, category, preview examples):\n"
        f"{json.dumps(local_datasets_summary, ensure_ascii=False, indent=2)}\n\n"
        "Return the JSON object now."
    )

    # Initialize LLM using OpenAI config (defaults to gpt-5-mini)
    openai_cfg = config.get("models", {}).get("openai", {}) or {}
    model_name = openai_cfg.get("model_name", "gpt-5-mini")

    try:
        llm = ChatOpenAI(
            model=model_name,
            temperature=0.2,
            api_key=OPENAI_API_KEY,
        )

        response = await llm.ainvoke(
            [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ]
        )
        content = getattr(response, "content", "") or ""
    except Exception as e:
        logger.error(f"Prompt setup analysis LLM error: {e}")
        raise HTTPException(status_code=500, detail="Failed to run analysis model")

    # Extract JSON from the response
    try:
        text = content.strip()
        if "```json" in text:
            text = text.split("```json", 1)[1].split("```", 1)[0]
        elif "```" in text:
            text = text.split("```", 1)[1].split("```", 1)[0]

        raw = json.loads(text)
    except Exception as e:
        logger.error(f"Failed to parse analysis JSON: {e} | raw content={content!r}")
        raise HTTPException(status_code=500, detail="Model returned invalid JSON for analysis")

    # Normalize and validate response
    task_profile = (raw.get("taskProfile") or raw.get("task_profile") or "general").strip() or "general"
    dataset_hint = raw.get("datasetHint") or raw.get("dataset_hint") or ""
    benchmark_hint = raw.get("benchmarkHint") or raw.get("benchmark_hint") or ""

    # Build maps for resolving technique references
    normalized_to_key: Dict[str, str] = {}
    for key, value in techniques.items():
        name = value.get("name", "")
        normalized_to_key[_normalize_key(key)] = key
        if name:
            normalized_to_key[_normalize_key(name)] = key

    technique_suggestions: List[Dict[str, str]] = []
    raw_techs = raw.get("techniqueSuggestions") or raw.get("techniques") or []

    for item in raw_techs:
        if isinstance(item, str):
            candidate_key = item
            candidate_name = techniques.get(item, {}).get("name", item)
        elif isinstance(item, dict):
            candidate_key = item.get("key") or item.get("id") or ""
            candidate_name = item.get("name") or techniques.get(candidate_key, {}).get("name", "")
        else:
            continue

        if candidate_key not in techniques:
            resolved = normalized_to_key.get(_normalize_key(candidate_key)) or normalized_to_key.get(
                _normalize_key(candidate_name)
            )
            if resolved:
                candidate_key = resolved
                candidate_name = techniques[resolved]["name"]
            else:
                continue

        technique_suggestions.append(
            {
                "key": candidate_key,
                "name": candidate_name or techniques[candidate_key].get("name", candidate_key),
            }
        )
        if len(technique_suggestions) >= 3:
            break

    # Fallback: if model did not select any valid techniques, pick a few generic ones
    if not technique_suggestions:
        # Prefer techniques that have chain-of-thought or few-shot hints
        generic_candidates = []
        for key, value in techniques.items():
            desc = f"{value.get('name', '')} {value.get('description', '')}".lower()
            if any(k in desc for k in ["chain-of-thought", "few-shot", "self-consistency", "cot"]):
                generic_candidates.append((key, value))
        if not generic_candidates:
            generic_candidates = list(techniques.items())[:3]

        for key, value in generic_candidates[:3]:
            technique_suggestions.append({"key": key, "name": value.get("name", key)})

    # Local dataset recommendations
    local_recs: List[Dict[str, Any]] = []
    for item in raw.get("localDatasetRecommendations", []) or []:
        if not isinstance(item, dict):
            continue
        ds_id = item.get("id")
        ds_name = item.get("name") or ""
        if not ds_id and not ds_name:
            continue
        local_recs.append(
            {
                "id": ds_id,
                "name": ds_name,
                "fit": (item.get("fit") or "medium").lower(),
                "reason": item.get("reason", ""),
            }
        )

    # Hugging Face search suggestions
    hf_suggestions: List[Dict[str, str]] = []
    for item in raw.get("hfSuggestions", []) or []:
        if not isinstance(item, dict):
            continue
        query = (item.get("query") or "").strip()
        if not query:
            continue
        hf_suggestions.append(
            {
                "query": query,
                "reason": item.get("reason", ""),
            }
        )

    generator_cfg = raw.get("generatorSuggestion") or {}
    generator_suggestion = {
        "mode": generator_cfg.get("mode") or "",
        "task_type": generator_cfg.get("task_type") or "",
        "include_edge_cases": bool(generator_cfg.get("include_edge_cases", False)),
        "difficulty": generator_cfg.get("difficulty") or "",
        "count": int(generator_cfg.get("count") or 0),
        "reason": generator_cfg.get("reason", ""),
    }

    steps = [str(s) for s in (raw.get("steps") or []) if isinstance(s, (str, int, float))][:6]

    dspy_cfg = raw.get("dspyRecommendation") or {}
    dspy_recommendation = {
        "suitable": bool(dspy_cfg.get("suitable", False)),
        "reason": dspy_cfg.get("reason", ""),
        "profile": dspy_cfg.get("profile") or "",
        "warnings": dspy_cfg.get("warnings", ""),
    }

    return {
        "taskProfile": task_profile,
        "datasetHint": dataset_hint,
        "benchmarkHint": benchmark_hint,
        "techniqueSuggestions": technique_suggestions,
        "localDatasetRecommendations": local_recs,
        "hfSuggestions": hf_suggestions,
        "generatorSuggestion": generator_suggestion,
        "dspyRecommendation": dspy_recommendation,
        "steps": steps,
    }

@app.get("/api/tasks")
async def get_tasks():
    """Get all tasks (placeholder)"""
    return {"tasks": []}

@app.get("/api/models/{provider}")
async def get_models(provider: str):
    """Get available models for a provider"""
    if provider == "ollama":
        try:
            client = OllamaClient(config["models"]["ollama"])
            models = client.get_available_models()
            return {"models": models if models else [config["models"]["ollama"]["model_name"]]}
        except:
            return {"models": [config["models"]["ollama"]["model_name"]]}
    elif provider == "gemini":
        return {"models": [config["models"]["gemini"]["model_name"]]}
    elif provider == "openai":
        try:
            from src.llm.openai_client import OpenAIClient
            client = OpenAIClient(config.get("models", {}).get("openai", {}))
            return {"models": client.get_available_models()}
        except:
            return {"models": ["gpt-5-mini"]}
    else:
        raise HTTPException(status_code=400, detail="Invalid provider")

@app.post("/api/generate")
async def generate_prompts(request: GenerateRequest):
    """Generate optimized prompts"""
    if not request.prompt:
        raise HTTPException(status_code=400, detail="Prompt is required")
    
    if not request.techniques:
        raise HTTPException(status_code=400, detail="At least one technique is required")
    
    if request.provider in ["gemini", "openai"] and not request.api_key:
        raise HTTPException(status_code=400, detail=f"API Key required for {request.provider}")
    
    # Initialize client
    try:
        if request.provider == "gemini":
            client = GeminiClient(config["models"]["gemini"], request.api_key)
        elif request.provider == "ollama":
            client = OllamaClient(config["models"]["ollama"])
        elif request.provider == "openai":
            from src.llm.openai_client import OpenAIClient
            client = OpenAIClient(config.get("models", {}).get("openai", {}), api_key=request.api_key)
        else:
            raise HTTPException(status_code=400, detail="Unsupported provider")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error initializing client: {str(e)}")
    
    # Generate results
    results = []
    techniques = prompt_manager.get_all_techniques()
    
    for tech_key in request.techniques:
        if tech_key not in techniques:
            continue
            
        technique = techniques[tech_key]
        
        try:
            meta_prompt = prompt_manager.generate_meta_prompt(request.prompt, tech_key)
            response = client.complete(meta_prompt, model=request.model)
            token_count = client.count_tokens(response)
            
            results.append({
                "technique": technique,
                "response": response,
                "tokens": token_count
            })
        except Exception as e:
            logger.error(f"Error with {technique['name']}: {e}")
            results.append({
                "technique": technique,
                "response": f"Error: {str(e)}",
                "tokens": 0,
                "error": True
            })
    
    # Save to history
    try:
        generation_id = history_manager.save_generation(
            prompt=request.prompt,
            provider=request.provider,
            model=request.model,
            techniques=request.techniques,
            results=results,
        )
        logger.info(f"Saved generation to history: {generation_id}")
    except Exception as e:
        logger.error(f"Failed to save to history: {e}")
    
    return {"results": results}


class GenerateTitleRequest(BaseModel):
    prompt_text: str
    provider: str = "local"  # Default to local T5 model
    model: str = "google/flan-t5-small"
    api_key: Optional[str] = None


# Cache for local model
_title_generator = None

def get_title_generator():
    """Lazy load the title generation model."""
    global _title_generator
    if _title_generator is None:
        try:
            from transformers import pipeline
            _title_generator = pipeline(
                "text2text-generation",
                model="google/flan-t5-small",
                max_length=20
            )
            logger.info("Loaded local title generation model: flan-t5-small")
        except Exception as e:
            logger.error(f"Failed to load local model: {e}")
            _title_generator = False  # Mark as failed
    return _title_generator


@app.post("/api/generate-title")
async def generate_title(request: GenerateTitleRequest):
    """Generate a short, descriptive title for a prompt."""
    try:
        # Try local model first (fastest)
        if request.provider == "local":
            generator = get_title_generator()
            if generator:
                prompt = f"Summarize in 3-5 words: {request.prompt_text[:200]}"
                result = generator(prompt, max_length=12, do_sample=False)
                title = result[0]['generated_text'].strip()
                # Clean up common artifacts
                title = title.replace('Title:', '').replace('Summary:', '').strip()
                if title and len(title) > 3:
                    return {"title": title.title()}  # Capitalize
            # Fallback to extracting first meaningful words
            words = request.prompt_text.split()[:5]
            title = ' '.join(words)
            if len(title) > 40:
                title = title[:37] + "..."
            return {"title": title}
        
        elif request.provider == "gemini":
            if not request.api_key:
                raise HTTPException(status_code=400, detail="API Key required for Gemini")
            client = GeminiClient(config["models"]["gemini"], request.api_key)
        elif request.provider == "ollama":
            client = OllamaClient(config["models"]["ollama"])
        elif request.provider == "openai":
            from src.llm.openai_client import OpenAIClient
            client = OpenAIClient(config.get("models", {}).get("openai", {}), api_key=request.api_key)
        else:
            raise HTTPException(status_code=400, detail="Provider not supported")
        
        meta_prompt = f"""Generate a short, descriptive title (3-6 words) for this prompt. 
The title should capture the main purpose or task of the prompt.
Return ONLY the title, nothing else.

Prompt:
{request.prompt_text[:500]}

Title:"""
        
        title = client.complete(meta_prompt, model=request.model).strip()
        # Clean up the title - remove quotes and extra whitespace
        title = title.strip('"\'').strip()
        # Limit length
        if len(title) > 60:
            title = title[:57] + "..."
        
        return {"title": title}
    except Exception as e:
        logger.error(f"Error generating title: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/history")
async def get_history(limit: Optional[int] = 50):
    """Get generation history.
    
    Args:
        limit: Maximum number of entries to return.
    
    Returns:
        List of history entries with statistics.
    """
    try:
        history = history_manager.get_all_history(limit=limit)
        stats = history_manager.get_stats()
        return {"history": history, "stats": stats}
    except Exception as e:
        logger.error(f"Error getting history: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/history/{generation_id}")
async def get_history_item(generation_id: str):
    """Get a specific generation from history.
    
    Args:
        generation_id: ID of the generation.
    
    Returns:
        Generation data.
    """
    generation = history_manager.get_generation(generation_id)
    if not generation:
        raise HTTPException(status_code=404, detail="Generation not found")
    return generation

@app.delete("/api/history/{generation_id}")
async def delete_history_item(generation_id: str):
    """Delete a generation from history.
    
    Args:
        generation_id: ID of the generation to delete.
    
    Returns:
        Success message.
    """
    if history_manager.delete_generation(generation_id):
        return {"message": "Generation deleted successfully"}
    raise HTTPException(status_code=404, detail="Generation not found")

@app.get("/api/templates")
async def get_templates(category: Optional[str] = None, search: Optional[str] = None):
    """Get all templates with optional filtering.
    
    Args:
        category: Filter by category.
        search: Search query.
    
    Returns:
        List of templates.
    """
    try:
        if search:
            templates = templates_manager.search_templates(search)
        elif category:
            templates = templates_manager.get_by_category(category)
        else:
            templates = templates_manager.get_all_templates()
        
        return {"templates": templates}
    except Exception as e:
        logger.error(f"Error getting templates: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/templates")
async def create_template(template: TemplateCreate):
    """Create a new template.
    
    Args:
        template: Template data.
    
    Returns:
        Created template.
    """
    try:
        created = templates_manager.create_template(
            name=template.name,
            prompt=template.prompt,
            description=template.description,
            category=template.category,
            tags=template.tags,
        )
        return created
    except Exception as e:
        logger.error(f"Error creating template: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/templates/{template_id}")
async def get_template(template_id: str):
    """Get a specific template.
    
    Args:
        template_id: ID of the template.
    
    Returns:
        Template data.
    """
    template = templates_manager.get_template(template_id)
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    return template

@app.put("/api/templates/{template_id}")
async def update_template(template_id: str, template: TemplateUpdate):
    """Update a template.
    
    Args:
        template_id: ID of the template.
        template: Updated data.
    
    Returns:
        Updated template.
    """
    updated = templates_manager.update_template(
        template_id=template_id,
        name=template.name,
        prompt=template.prompt,
        description=template.description,
        category=template.category,
        tags=template.tags,
    )
    if not updated:
        raise HTTPException(status_code=404, detail="Template not found")
    return updated

@app.delete("/api/templates/{template_id}")
async def delete_template(template_id: str):
    """Delete a template.
    
    Args:
        template_id: ID of the template.
    
    Returns:
        Success message.
    """
    if templates_manager.delete_template(template_id):
        return {"message": "Template deleted successfully"}
    raise HTTPException(status_code=404, detail="Template not found")

@app.post("/api/templates/{template_id}/use")
async def use_template(template_id: str):
    """Increment usage count for a template.
    
    Args:
        template_id: ID of the template.
    
    Returns:
        Success message.
    """
    templates_manager.increment_usage(template_id)
    return {"message": "Usage count incremented"}




from src.evaluator import OfflineEvaluator

# Evaluator Models
class EvaluationItem(BaseModel):
    input: str
    output: str

class OfflineEvaluationRequest(BaseModel):
    dataset: List[EvaluationItem]
    prompts: List[str]
    provider: str = "ollama"
    model: str = "llama2"

@app.post("/api/evaluator/offline")
async def run_offline_evaluation(request: OfflineEvaluationRequest):
    """Run offline evaluation for prompts against a dataset."""
    evaluator = OfflineEvaluator()
    
    # Define a model function that uses our existing clients
    def model_func(prompt: str) -> str:
        try:
            if request.provider == "ollama":
                client = OllamaClient(config["models"]["ollama"])
            elif request.provider == "gemini":
                # Note: This requires API key which isn't passed here yet. 
                # For now, we'll assume it's in env or config, or fail gracefully.
                # In a real app, we should pass credentials securely.
                # For this simplified implementation, let's stick to Ollama or mock if needed.
                client = GeminiClient(config["models"]["gemini"], api_key=None) 
            else:
                return "Error: Provider not supported"
            
            return client.complete(prompt, model=request.model)
        except Exception as e:
            logger.error(f"Model generation error: {e}")
            return "Error"

    try:
        # Convert Pydantic models to dicts for the evaluator
        dataset_dicts = [{"input": item.input, "output": item.output} for item in request.dataset]
        
        results = evaluator.run_evaluation(
            dataset=dataset_dicts,
            prompts=request.prompts,
            model_func=model_func
        )
        
        # ==================== Advanced Metrics Integration ====================
        # Automatically calculate BERTScore and Perplexity if dependencies are available
        from src.evaluator import ADVANCED_METRICS_AVAILABLE
        
        if ADVANCED_METRICS_AVAILABLE:
            try:
                from src.evaluator import calculate_bertscore, calculate_perplexity
                
                logger.info("Calculating advanced metrics (BERTScore, Perplexity)...")
                
                # Collect all predictions and references from results
                all_predictions = []
                all_references = []
                
                # Extract predictions from each prompt's results
                for prompt_key, prompt_data in results.items():
                    if prompt_key.startswith("prompt_") and "predictions" in prompt_data:
                        predictions = prompt_data["predictions"]
                        ground_truth = prompt_data["ground_truth"]
                        
                        all_predictions.extend(predictions)
                        all_references.extend(ground_truth)
                
                if all_predictions and all_references:
                    # Calculate BERTScore for each prediction-reference pair
                    bertscore_scores = []
                    for pred, ref in zip(all_predictions, all_references):
                        if pred and ref:  # Skip empty strings
                            try:
                                result = calculate_bertscore(pred, ref)
                                bertscore_scores.append(result.score)
                            except Exception as e:
                                logger.warning(f"BERTScore calculation failed for pair: {e}")
                    
                    # Calculate average BERTScore
                    if bertscore_scores:
                        avg_bertscore = sum(bertscore_scores) / len(bertscore_scores)
                        
                        # Add to results summary
                        if "summary" not in results:
                            results["summary"] = {}
                        results["summary"]["bertscore"] = round(avg_bertscore, 4)
                        logger.info(f"BERTScore calculated: {avg_bertscore:.4f}")
                    
                    # Calculate Perplexity for each prediction
                    perplexity_scores = []
                    for pred in all_predictions:
                        if pred and pred.strip():  # Skip empty strings
                            try:
                                result = calculate_perplexity(pred)
                                if result.score != float('inf'):
                                    perplexity_scores.append(result.score)
                            except Exception as e:
                                logger.warning(f"Perplexity calculation failed: {e}")
                    
                    # Calculate average Perplexity
                    if perplexity_scores:
                        avg_perplexity = sum(perplexity_scores) / len(perplexity_scores)
                        
                        # Add to results summary
                        if "summary" not in results:
                            results["summary"] = {}
                        results["summary"]["perplexity"] = round(avg_perplexity, 2)
                        logger.info(f"Perplexity calculated: {avg_perplexity:.2f}")
                
            except Exception as e:
                logger.warning(f"Advanced metrics calculation failed: {e}")
                # Continue without advanced metrics - graceful degradation
        else:
            logger.info("Advanced metrics not available (dependencies not installed)")
        
        return results
    except Exception as e:
        logger.error(f"Evaluation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


from src.evaluator import ConsistencyScorer

class ConsistencyRequest(BaseModel):
    prompt: str
    n_samples: int = 5
    provider: str = "ollama"
    model: str = "llama2"

@app.post("/api/evaluator/consistency")
async def run_consistency_check(request: ConsistencyRequest):
    """Run self-consistency check for a prompt."""
    scorer = ConsistencyScorer()
    
    def model_func(prompt: str, temperature: float = 0.7) -> str:
        try:
            if request.provider == "ollama":
                client = OllamaClient(config["models"]["ollama"])
                # Note: OllamaClient might need update to support temperature if not already
                # For now we assume complete accepts kwargs or we just ignore temp for basic implementation
                return client.complete(prompt, model=request.model) 
            elif request.provider == "gemini":
                client = GeminiClient(config["models"]["gemini"], api_key=None)
                return client.complete(prompt, model=request.model)
            else:
                return "Error: Provider not supported"
        except Exception as e:
            logger.error(f"Model generation error: {e}")
            return "Error"

    try:
        results = scorer.run_consistency_check(
            prompt=request.prompt,
            model_func=model_func,
            n_samples=request.n_samples
        )
        return results
    except Exception as e:
        logger.error(f"Consistency check error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


from src.evaluator import RobustnessTester

class RobustnessRequest(BaseModel):
    prompt: str
    dataset: List[EvaluationItem]
    provider: str = "ollama"
    model: str = "llama2"

@app.post("/api/evaluator/robustness")
async def run_robustness_test(request: RobustnessRequest):
    """Run robustness test for a prompt (Legacy/Default to Format)."""
    tester = RobustnessTester()
    
    def model_func(prompt: str) -> str:
        try:
            if request.provider == "ollama":
                client = OllamaClient(config["models"]["ollama"])
                return client.complete(prompt, model=request.model) 
            elif request.provider == "gemini":
                client = GeminiClient(config["models"]["gemini"], api_key=None)
                return client.complete(prompt, model=request.model)
            else:
                return "Error: Provider not supported"
        except Exception as e:
            logger.error(f"Model generation error: {e}")
            return "Error"

    try:
        # Convert Pydantic models to dicts
        dataset_dicts = [{"input": item.input, "output": item.output} for item in request.dataset]
        
        results = tester.test_format_robustness(
            prompt=request.prompt,
            dataset=dataset_dicts,
            model_func=model_func,
            variation_func=model_func
        )
        return results
    except Exception as e:
        logger.error(f"Robustness test error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


class MutualConsistencyRequest(BaseModel):
    prompts: List[str]
    provider: str = "ollama"
    model: str = "llama2"

@app.post("/api/evaluator/mutual-consistency")
async def run_mutual_consistency(request: MutualConsistencyRequest):
    """Run mutual consistency check (GLaPE)."""
    scorer = ConsistencyScorer()
    
    def model_func(prompt: str, temperature: float = 0.7) -> str:
        try:
            if request.provider == "ollama":
                client = OllamaClient(config["models"]["ollama"])
                return client.complete(prompt, model=request.model) 
            elif request.provider == "gemini":
                client = GeminiClient(config["models"]["gemini"], api_key=None)
                return client.complete(prompt, model=request.model)
            else:
                return "Error: Provider not supported"
        except Exception as e:
            logger.error(f"Model generation error: {e}")
            return "Error"

    try:
        results = scorer.run_mutual_consistency_check(
            prompts=request.prompts,
            model_func=model_func
        )
        return results
    except Exception as e:
        logger.error(f"Mutual consistency error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


class FormatRobustnessRequest(BaseModel):
    prompt: str
    dataset: List[EvaluationItem]
    provider: str = "ollama"
    model: str = "llama2"

@app.post("/api/evaluator/robustness/format")
async def run_format_robustness(request: FormatRobustnessRequest):
    """Run format robustness test."""
    tester = RobustnessTester()
    
    def model_func(prompt: str) -> str:
        try:
            if request.provider == "ollama":
                client = OllamaClient(config["models"]["ollama"])
                return client.complete(prompt, model=request.model) 
            elif request.provider == "gemini":
                client = GeminiClient(config["models"]["gemini"], api_key=None)
                return client.complete(prompt, model=request.model)
            else:
                return "Error: Provider not supported"
        except Exception as e:
            logger.error(f"Model generation error: {e}")
            return "Error"

    try:
        dataset_dicts = [{"input": item.input, "output": item.output} for item in request.dataset]
        results = tester.test_format_robustness(
            prompt=request.prompt,
            dataset=dataset_dicts,
            model_func=model_func,
            variation_func=model_func
        )
        return results
    except Exception as e:
        logger.error(f"Format robustness error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


class LengthRobustnessRequest(BaseModel):
    prompt: str
    dataset: List[EvaluationItem]
    max_context_length: int = 1000
    provider: str = "ollama"
    model: str = "llama2"

@app.post("/api/evaluator/robustness/length")
async def run_length_robustness(request: LengthRobustnessRequest):
    """Run length robustness test."""
    tester = RobustnessTester()
    
    def model_func(prompt: str) -> str:
        try:
            if request.provider == "ollama":
                client = OllamaClient(config["models"]["ollama"])
                return client.complete(prompt, model=request.model) 
            elif request.provider == "gemini":
                client = GeminiClient(config["models"]["gemini"], api_key=None)
                return client.complete(prompt, model=request.model)
            else:
                return "Error: Provider not supported"
        except Exception as e:
            logger.error(f"Model generation error: {e}")
            return "Error"

    try:
        dataset_dicts = [{"input": item.input, "output": item.output} for item in request.dataset]
        results = tester.test_length_robustness(
            prompt=request.prompt,
            dataset=dataset_dicts,
            model_func=model_func,
            max_context_length=request.max_context_length
        )
        return results
    except Exception as e:
        logger.error(f"Length robustness error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


class AdversarialRobustnessRequest(BaseModel):
    prompt: str
    dataset: List[EvaluationItem]
    level: str = "medium"
    provider: str = "ollama"
    model: str = "llama2"

@app.post("/api/evaluator/robustness/adversarial")
async def run_adversarial_robustness(request: AdversarialRobustnessRequest):
    """Run adversarial robustness test."""
    tester = RobustnessTester()
    
    def model_func(prompt: str) -> str:
        try:
            if request.provider == "ollama":
                client = OllamaClient(config["models"]["ollama"])
                return client.complete(prompt, model=request.model) 
            elif request.provider == "gemini":
                client = GeminiClient(config["models"]["gemini"], api_key=None)
                return client.complete(prompt, model=request.model)
            else:
                return "Error: Provider not supported"
        except Exception as e:
            logger.error(f"Model generation error: {e}")
            return "Error"

    try:
        dataset_dicts = [{"input": item.input, "output": item.output} for item in request.dataset]
        results = tester.test_adversarial_robustness(
            prompt=request.prompt,
            dataset=dataset_dicts,
            model_func=model_func,
            level=request.level
        )
        return results
    except Exception as e:
        logger.error(f"Adversarial robustness error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


class FullReportRequest(BaseModel):
    prompt: str
    dataset: List[EvaluationItem]
    provider: str = "ollama"
    model: str = "llama2"

@app.post("/api/evaluator/full_report")
async def run_full_report(request: FullReportRequest):
    """Run a full evaluation suite: Consistency + Robustness (Format, Length, Adversarial)."""
    consistency_scorer = ConsistencyScorer()
    robustness_tester = RobustnessTester()
    
    def model_func(prompt: str, temperature: float = 0.7) -> str:
        try:
            if request.provider == "ollama":
                client = OllamaClient(config["models"]["ollama"])
                return client.complete(prompt, model=request.model) # TODO: Pass temp if supported
            elif request.provider == "gemini":
                client = GeminiClient(config["models"]["gemini"], api_key=None)
                return client.complete(prompt, model=request.model)
            else:
                return "Error: Provider not supported"
        except Exception as e:
            logger.error(f"Model generation error: {e}")
            return "Error"

    # Helper for robustness model func (no temp)
    def robust_model_func(prompt: str) -> str:
        return model_func(prompt, temperature=0.0)

    report = {
        "summary": {},
        "consistency": {},
        "robustness": {}
    }

    try:
        # 1. Consistency Check
        logger.info("Running Consistency Check...")
        consistency_res = consistency_scorer.run_consistency_check(
            prompt=request.prompt,
            model_func=model_func,
            n_samples=5
        )
        report["consistency"] = consistency_res

        # 2. Robustness Tests (require dataset)
        if request.dataset:
            dataset_dicts = [{"input": item.input, "output": item.output} for item in request.dataset]
            
            # Format
            logger.info("Running Format Robustness...")
            format_res = robustness_tester.test_format_robustness(
                prompt=request.prompt,
                dataset=dataset_dicts,
                model_func=robust_model_func
            )
            report["robustness"]["format"] = format_res

            # Length (limit to 2x, 4x for speed in report mode)
            logger.info("Running Length Robustness...")
            # Note: We might want to customize test_length_robustness to accept multipliers, 
            # but for now we run standard. It might be slow.
            length_res = robustness_tester.test_length_robustness(
                prompt=request.prompt,
                dataset=dataset_dicts,
                model_func=robust_model_func
            )
            report["robustness"]["length"] = length_res

            # Adversarial (Light)
            logger.info("Running Adversarial Robustness...")
            adv_res = robustness_tester.test_adversarial_robustness(
                prompt=request.prompt,
                dataset=dataset_dicts,
                model_func=robust_model_func,
                level="light"
            )
            report["robustness"]["adversarial"] = adv_res
        
        # 3. Calculate Overall Grade
        scores = []
        if "consistency_score" in report["consistency"]:
            scores.append(report["consistency"]["consistency_score"])
        if "robustness" in report:
            if "format" in report["robustness"]:
                scores.append(report["robustness"]["format"]["robustness_score"])
            if "length" in report["robustness"]:
                scores.append(report["robustness"]["length"]["robustness_score"])
            if "adversarial" in report["robustness"]:
                scores.append(report["robustness"]["adversarial"]["robustness_score"])
        
        avg_score = sum(scores) / len(scores) if scores else 0
        
        grade = "F"
        if avg_score >= 0.9: grade = "A"
        elif avg_score >= 0.8: grade = "B"
        elif avg_score >= 0.7: grade = "C"
        elif avg_score >= 0.6: grade = "D"

        report["summary"] = {
            "grade": grade,
            "avg_score": avg_score,
            "tests_run": len(scores)
        }

        return report

    except Exception as e:
        logger.error(f"Full report error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

class PromptEvalRequest(BaseModel):
    prompts: List[str]
    dataset: List[EvaluationItem]
    budget: int
    provider: str = "ollama"
    model: str = "llama2"

@app.post("/api/evaluator/promp-eva")
async def run_prompt_eval(request: PromptEvalRequest):
    """Run PromptEval (budget-aware evaluation)."""
    evaluator = OfflineEvaluator()
    
    def model_func(prompt: str) -> str:
        try:
            if request.provider == "ollama":
                client = OllamaClient(config["models"]["ollama"])
                return client.complete(prompt, model=request.model) 
            elif request.provider == "gemini":
                client = GeminiClient(config["models"]["gemini"], api_key=None)
                return client.complete(prompt, model=request.model)
            else:
                return "Error: Provider not supported"
        except Exception as e:
            logger.error(f"Model generation error: {e}")
            return "Error"

    try:
        # Simple budget implementation: limit dataset size
        # In a real PromptEval, this would be more sophisticated (e.g. successive elimination)
        limit = min(len(request.dataset), request.budget)
        limited_dataset = request.dataset[:limit]
        
        dataset_dicts = [{"input": item.input, "output": item.output} for item in limited_dataset]
        
        results = evaluator.run_evaluation(
            dataset=dataset_dicts,
            prompts=request.prompts,
            model_func=model_func
        )
        return results
    except Exception as e:
        logger.error(f"PromptEval error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


from src.evaluator import TelemetryManager

@app.get("/api/evaluator/telemetry")
async def get_telemetry_dashboard(time_range: str = "7d"):
    """Get production telemetry dashboard data."""
    manager = TelemetryManager()
    try:
        return manager.get_dashboard_metrics(time_range)
    except Exception as e:
        logger.error(f"Telemetry error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


from src.evaluator import PromptOptimizer

class OptimizerRequest(BaseModel):
    base_prompt: str
    dataset: List[EvaluationItem]
    provider: str = "ollama"
    model: str = "llama2"

@app.post("/api/evaluator/optimizer")
async def optimize_prompt(request: OptimizerRequest):
    """Optimize a prompt."""
    optimizer = PromptOptimizer()
    
    def model_func(prompt: str) -> str:
        try:
            if request.provider == "ollama":
                client = OllamaClient(config["models"]["ollama"])
                return client.complete(prompt, model=request.model) 
            elif request.provider == "gemini":
                client = GeminiClient(config["models"]["gemini"], api_key=None)
                return client.complete(prompt, model=request.model)
            else:
                return "Error: Provider not supported"
        except Exception as e:
            logger.error(f"Model generation error: {e}")
            return "Error"

    try:
        # Convert Pydantic models to dicts
        dataset_dicts = [{"input": item.input, "output": item.output} for item in request.dataset]
        
        results = optimizer.optimize_prompt(
            base_prompt=request.base_prompt,
            dataset=dataset_dicts,
            model_func=model_func
        )
        return results
    except Exception as e:
        logger.error(f"Optimization error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/settings")
async def get_settings():
    """Get user settings (placeholder)"""
    return {
        "settings": {
            "theme": "dark",
            "default_provider": "ollama",
            "auto_save": True
        },
        "message": "Settings feature coming soon"
    }

# ==================== Dataset Management Endpoints ====================

class DatasetCreateRequest(BaseModel):
    name: str
    description: str = ""
    category: str = "custom"
    data: List[Dict[str, str]]

class DatasetUpdateRequest(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    data: Optional[List[Dict[str, str]]] = None

@app.get("/api/datasets")
async def list_datasets():
    """List all datasets (metadata only)."""
    try:
        datasets = dataset_manager.list_datasets()
        return {"datasets": datasets}
    except Exception as e:
        logger.error(f"Error listing datasets: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/datasets")
async def create_dataset(request: DatasetCreateRequest):
    """Create a new dataset."""
    try:
        dataset = dataset_manager.create_dataset(
            name=request.name,
            data=request.data,
            description=request.description,
            category=request.category
        )
        return dataset
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error creating dataset: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/datasets/{dataset_id}")
async def get_dataset(dataset_id: str):
    """Get a specific dataset by ID."""
    try:
        dataset = dataset_manager.get_dataset(dataset_id)
        if not dataset:
            raise HTTPException(status_code=404, detail="Dataset not found")
        return dataset
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting dataset: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/api/datasets/{dataset_id}")
async def update_dataset(dataset_id: str, request: DatasetUpdateRequest):
    """Update an existing dataset."""
    try:
        dataset = dataset_manager.update_dataset(
            dataset_id=dataset_id,
            name=request.name,
            data=request.data,
            description=request.description
        )
        if not dataset:
            raise HTTPException(status_code=404, detail="Dataset not found")
        return dataset
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating dataset: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/datasets/{dataset_id}")
async def delete_dataset(dataset_id: str):
    """Delete a dataset."""
    try:
        success = dataset_manager.delete_dataset(dataset_id)
        if not success:
            raise HTTPException(status_code=404, detail="Dataset not found")
        return {"success": True, "message": "Dataset deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting dataset: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/datasets/examples/list")
async def get_example_datasets():
    """Get all example datasets."""
    try:
        examples = dataset_manager.get_example_datasets()
        return {"examples": examples}
    except Exception as e:
        logger.error(f"Error getting example datasets: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/datasets/catalog/hf/search")
async def search_hf_catalog(q: str, limit: int = 20):
    """Search Hugging Face datasets catalog for business-ready datasets.

    This returns lightweight metadata; import is handled by a separate endpoint.
    """
    try:
        results = search_hf_datasets(q, limit=limit)
        return {"results": results}
    except Exception as e:
        logger.error(f"Error searching HF catalog: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/datasets/catalog/hf/import")
async def import_hf_catalog_dataset(payload: Dict[str, Any]):
    """Import a dataset from Hugging Face into the local DatasetManager.

    Expected payload:
      {
        "dataset_id": "username/dataset",
        "config_name": "...",   # optional
        "split": "train"        # optional, defaults to train
      }
    """
    dataset_id = payload.get("dataset_id")
    if not dataset_id:
        raise HTTPException(status_code=400, detail="dataset_id is required")

    config_name = payload.get("config_name")
    split = payload.get("split", "train")
    input_key = payload.get("input_key")
    output_key = payload.get("output_key")

    try:
        imported = import_hf_dataset(
            dataset_id,
            config_name=config_name,
            split=split,
            input_key=input_key,
            output_key=output_key,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error importing HF dataset {dataset_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

    try:
        dataset = dataset_manager.create_dataset(
            name=imported["name"],
            data=imported["items"],
            description=imported["description"],
            category="external",
        )
    except Exception as e:
        logger.error(f"Error saving imported HF dataset: {e}")
        raise HTTPException(status_code=500, detail="Failed to save imported dataset")

    return {
        "dataset": dataset,
        "meta": imported["meta"],
    }


@app.post("/api/datasets/catalog/hf/inspect")
async def inspect_hf_catalog_dataset(payload: Dict[str, Any]):
    """Inspect a Hugging Face dataset to get available columns and suggested mapping."""
    dataset_id = payload.get("dataset_id")
    if not dataset_id:
        raise HTTPException(status_code=400, detail="dataset_id is required")

    config_name = payload.get("config_name")
    split = payload.get("split", "train")

    try:
        info = inspect_hf_dataset(dataset_id, config_name=config_name, split=split)
        return info
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error inspecting HF dataset {dataset_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ==================== Dataset Generation Endpoints ====================

class DatasetGenerateRequest(BaseModel):
    """Request model for dataset generation."""
    mode: str  # from_task, from_examples, from_prompt, edge_cases
    task_type: str = "custom"  # classification, extraction, generation, qa, summarization, translation, custom
    count: int = 10
    difficulty: str = "mixed"  # easy, medium, hard, mixed
    domain: str = ""
    include_edge_cases: bool = False
    task_description: str = ""
    seed_examples: List[Dict[str, str]] = []
    prompt_to_test: str = ""
    provider: str = "ollama"
    model: str = "llama2"
    api_key: Optional[str] = None
    # Whether to save immediately or just return generated data
    save_as_dataset: bool = False
    dataset_name: str = ""
    dataset_description: str = ""


@app.post("/api/datasets/generate")
async def generate_dataset(request: DatasetGenerateRequest):
    """Generate a synthetic dataset using LLM.
    
    Modes:
    - from_task: Generate from a task description
    - from_examples: Expand from seed examples
    - from_prompt: Generate test cases for a prompt
    - edge_cases: Generate adversarial/edge case inputs
    
    Returns generated data, optionally saves as a new dataset.
    """
    try:
        # Validate mode
        try:
            mode = GenerationMode(request.mode)
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Invalid mode: {request.mode}. Valid modes: from_task, from_examples, from_prompt, edge_cases")
        
        # Validate task_type
        try:
            task_type = TaskType(request.task_type)
        except ValueError:
            task_type = TaskType.CUSTOM
        
        # Validate difficulty
        try:
            difficulty = Difficulty(request.difficulty)
        except ValueError:
            difficulty = Difficulty.MIXED
        
        # Validate required fields based on mode
        if mode == GenerationMode.FROM_TASK and not request.task_description:
            raise HTTPException(status_code=400, detail="task_description is required for from_task mode")
        if mode == GenerationMode.FROM_EXAMPLES and not request.seed_examples:
            raise HTTPException(status_code=400, detail="seed_examples is required for from_examples mode")
        if mode == GenerationMode.FROM_PROMPT and not request.prompt_to_test:
            raise HTTPException(status_code=400, detail="prompt_to_test is required for from_prompt mode")
        
        # Initialize LLM client
        if request.provider == "gemini":
            if not request.api_key:
                raise HTTPException(status_code=400, detail="API key required for Gemini")
            client = GeminiClient(config["models"]["gemini"], request.api_key)
        elif request.provider == "ollama":
            client = OllamaClient(config["models"]["ollama"])
        elif request.provider == "openai":
            if not request.api_key:
                raise HTTPException(status_code=400, detail="API key required for OpenAI")
            from src.llm.openai_client import OpenAIClient
            client = OpenAIClient(config.get("models", {}).get("openai", {}), api_key=request.api_key)
        else:
            raise HTTPException(status_code=400, detail=f"Unsupported provider: {request.provider}")
        
        # Create generation config
        gen_config = GenerationConfig(
            mode=mode,
            task_type=task_type,
            count=min(request.count, 100),  # Cap at 100
            difficulty=difficulty,
            domain=request.domain,
            include_edge_cases=request.include_edge_cases,
            task_description=request.task_description,
            seed_examples=request.seed_examples,
            prompt_to_test=request.prompt_to_test
        )
        
        # Generate dataset
        generator = DatasetGenerator(client)
        generated_data = generator.generate(gen_config, model=request.model)
        
        if not generated_data:
            raise HTTPException(status_code=500, detail="Failed to generate dataset - no valid items returned")
        
        result = {
            "success": True,
            "generated_count": len(generated_data),
            "data": generated_data,
            "config": {
                "mode": request.mode,
                "task_type": request.task_type,
                "difficulty": request.difficulty,
                "domain": request.domain
            }
        }
        
        # Optionally save as dataset
        if request.save_as_dataset and request.dataset_name:
            dataset = dataset_manager.create_dataset(
                name=request.dataset_name,
                data=generated_data,
                description=request.dataset_description or f"Auto-generated dataset ({request.mode})",
                category="generated"
            )
            result["saved_dataset"] = {
                "id": dataset["id"],
                "name": dataset["name"]
            }
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating dataset: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/datasets/generate/modes")
async def get_generation_modes():
    """Get available dataset generation modes and their descriptions."""
    return {
        "modes": {
            "from_task": {
                "name": "From Task Description",
                "description": "Describe your task and let AI generate input/output pairs",
                "required_fields": ["task_description"],
                "example": "Generate customer support Q&A pairs for an e-commerce platform"
            },
            "from_examples": {
                "name": "From Examples",
                "description": "Provide 2-5 seed examples and expand to a full dataset",
                "required_fields": ["seed_examples"],
                "example": "Provide 3 examples, generate 50 similar ones"
            },
            "from_prompt": {
                "name": "From Prompt",
                "description": "Generate test cases to evaluate a specific prompt",
                "required_fields": ["prompt_to_test"],
                "example": "Test cases for a sentiment analysis prompt"
            },
            "edge_cases": {
                "name": "Edge Cases",
                "description": "Generate adversarial and edge case inputs for robustness testing",
                "required_fields": [],
                "example": "Typos, special characters, prompt injection attempts"
            }
        },
        "task_types": [
            {"id": "classification", "name": "Classification", "description": "Categorize inputs into classes"},
            {"id": "extraction", "name": "Extraction", "description": "Extract information from text"},
            {"id": "generation", "name": "Generation", "description": "Generate creative text"},
            {"id": "qa", "name": "Q&A", "description": "Question answering"},
            {"id": "summarization", "name": "Summarization", "description": "Condense text"},
            {"id": "translation", "name": "Translation", "description": "Convert between formats"},
            {"id": "custom", "name": "Custom", "description": "Custom task type"}
        ],
        "difficulties": [
            {"id": "easy", "name": "Easy", "description": "Simple, straightforward examples"},
            {"id": "medium", "name": "Medium", "description": "Moderate complexity"},
            {"id": "hard", "name": "Hard", "description": "Challenging edge cases"},
            {"id": "mixed", "name": "Mixed", "description": "Variety of difficulties"}
        ]
    }


# ==================== Advanced Metrics Endpoints ====================

from src.evaluator import MetricsCalculator, LLMJudge, calculate_bleu, calculate_rouge

class TextMetricsRequest(BaseModel):
    prediction: str
    reference: str

class CorpusMetricsRequest(BaseModel):
    predictions: List[str]
    references: List[str]

class LLMJudgeRequest(BaseModel):
    prompt: str
    response: str
    criteria: str = "general"
    provider: str = "ollama"
    model: str = "llama2"

class BatchJudgeRequest(BaseModel):
    prompt: str
    responses: List[str]
    criteria: str = "general"
    provider: str = "ollama"
    model: str = "llama2"


@app.post("/api/metrics/text")
async def calculate_text_metrics(request: TextMetricsRequest):
    """
    Calculate text-based metrics (BLEU, ROUGE, Semantic Similarity).
    
    Use this when you have a reference answer to compare against.
    """
    try:
        calculator = MetricsCalculator()
        results = calculator.calculate_text_metrics(
            prediction=request.prediction,
            reference=request.reference
        )
        return results
    except Exception as e:
        logger.error(f"Text metrics error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/metrics/corpus")
async def calculate_corpus_metrics(request: CorpusMetricsRequest):
    """
    Calculate metrics over a corpus of predictions and references.
    
    Returns aggregated scores across all pairs.
    """
    try:
        calculator = MetricsCalculator()
        results = calculator.calculate_corpus_metrics(
            predictions=request.predictions,
            references=request.references
        )
        return results
    except Exception as e:
        logger.error(f"Corpus metrics error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/metrics/bleu")
async def calculate_bleu_score(request: TextMetricsRequest):
    """Calculate BLEU score between prediction and reference."""
    try:
        result = calculate_bleu(request.prediction, request.reference)
        return {"score": result.score, "details": result.details}
    except Exception as e:
        logger.error(f"BLEU calculation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/metrics/rouge")
async def calculate_rouge_scores(request: TextMetricsRequest):
    """Calculate ROUGE scores (ROUGE-1, ROUGE-2, ROUGE-L)."""
    try:
        results = calculate_rouge(request.prediction, request.reference)
        return {
            "rouge1": {"score": results["rouge1"].score, "details": results["rouge1"].details},
            "rouge2": {"score": results["rouge2"].score, "details": results["rouge2"].details},
            "rougeL": {"score": results["rougeL"].score, "details": results["rougeL"].details}
        }
    except Exception as e:
        logger.error(f"ROUGE calculation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/metrics/judge")
async def run_llm_judge(request: LLMJudgeRequest):
    """
    Use LLM-as-Judge to evaluate a response.
    
    This is useful when you don't have a reference answer.
    The model evaluates based on criteria like helpfulness, accuracy, etc.
    
    Available criteria presets:
    - general: Overall quality
    - helpfulness: How helpful the response is
    - accuracy: Factual correctness
    - safety: Ethical and safe content
    - creativity: Originality and engagement
    - conciseness: Appropriate brevity
    - technical: Technical accuracy
    
    Or provide a custom criteria string.
    """
    try:
        # Create a simple wrapper for the LLM
        class SimpleLLMWrapper:
            def __init__(self, provider: str, model: str):
                self.provider = provider
                self.model = model
            
            async def generate(self, prompt: str) -> str:
                if self.provider == "ollama":
                    client = OllamaClient(config["models"]["ollama"])
                    return client.complete(prompt, model=self.model)
                elif self.provider == "gemini":
                    client = GeminiClient(config["models"]["gemini"], api_key=None)
                    return client.complete(prompt, model=self.model)
                else:
                    return "Error: Provider not supported"
        
        llm = SimpleLLMWrapper(request.provider, request.model)
        judge = LLMJudge(llm)
        
        result = await judge.evaluate(
            prompt=request.prompt,
            response=request.response,
            criteria=request.criteria
        )
        
        return {
            "score": result.score,
            "raw_score": result.details.get("raw_score", 0),
            "reasoning": result.details.get("reasoning", ""),
            "criteria": result.details.get("criteria", request.criteria),
            "confidence": result.details.get("confidence", result.score)
        }
    except Exception as e:
        logger.error(f"LLM Judge error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/metrics/judge/batch")
async def run_llm_judge_batch(request: BatchJudgeRequest):
    """
    Evaluate multiple responses using LLM-as-Judge.
    
    Useful for comparing different prompt variations or model outputs.
    """
    try:
        class SimpleLLMWrapper:
            def __init__(self, provider: str, model: str):
                self.provider = provider
                self.model = model
            
            async def generate(self, prompt: str) -> str:
                if self.provider == "ollama":
                    client = OllamaClient(config["models"]["ollama"])
                    return client.complete(prompt, model=self.model)
                elif self.provider == "gemini":
                    client = GeminiClient(config["models"]["gemini"], api_key=None)
                    return client.complete(prompt, model=self.model)
                else:
                    return "Error: Provider not supported"
        
        llm = SimpleLLMWrapper(request.provider, request.model)
        judge = LLMJudge(llm)
        
        results = await judge.evaluate_batch(
            prompt=request.prompt,
            responses=request.responses,
            criteria=request.criteria
        )
        
        return {
            "evaluations": [
                {
                    "response_index": i,
                    "score": r.score,
                    "raw_score": r.details.get("raw_score", 0),
                    "reasoning": r.details.get("reasoning", "")
                }
                for i, r in enumerate(results)
            ],
            "average_score": sum(r.score for r in results) / len(results) if results else 0,
            "criteria": request.criteria
        }
    except Exception as e:
        logger.error(f"Batch LLM Judge error: {e}")
        raise HTTPException(status_code=500, detail=str(e))



@app.get("/api/metrics/available")
async def get_available_metrics():
    """Get list of available metrics and their descriptions."""
    from src.evaluator import ADVANCED_METRICS_AVAILABLE
    
    metrics = {
        "reference_based": {
            "bleu": {
                "name": "BLEU",
                "description": "Bilingual Evaluation Understudy - measures n-gram overlap",
                "use_case": "Translation, text generation with reference",
                "range": "0-1 (higher is better)"
            },
            "rouge1": {
                "name": "ROUGE-1",
                "description": "Unigram recall between prediction and reference",
                "use_case": "Summarization, text generation",
                "range": "0-1 (higher is better)"
            },
            "rouge2": {
                "name": "ROUGE-2",
                "description": "Bigram recall between prediction and reference",
                "use_case": "Summarization, captures phrase-level similarity",
                "range": "0-1 (higher is better)"
            },
            "rougeL": {
                "name": "ROUGE-L",
                "description": "Longest Common Subsequence based metric",
                "use_case": "Summarization, captures sentence structure",
                "range": "0-1 (higher is better)"
            },
            "semantic_similarity": {
                "name": "Semantic Similarity",
                "description": "Word overlap similarity (Jaccard)",
                "use_case": "When meaning matters more than exact wording",
                "range": "0-1 (higher is better)"
            },
            "exact_match": {
                "name": "Exact Match",
                "description": "Binary match between prediction and reference",
                "use_case": "Classification, short answers",
                "range": "0 or 1"
            }
        },
        "reference_free": {
            "self_consistency": {
                "name": "Self-Consistency",
                "description": "Measures if model gives same answer across multiple runs",
                "use_case": "Testing prompt stability",
                "range": "0-1 (higher is better)"
            },
            "llm_judge": {
                "name": "LLM-as-Judge",
                "description": "Another LLM evaluates the response quality",
                "use_case": "Subjective quality, no reference needed",
                "range": "0-1 (higher is better)",
                "criteria": ["general", "helpfulness", "accuracy", "safety", "creativity", "conciseness", "technical"]
            }
        },
        "robustness": {
            "sensitivity": {
                "name": "Sensitivity/Spread",
                "description": "How much accuracy varies across prompt variations",
                "use_case": "Testing prompt robustness",
                "range": "0-1 (lower spread is better)"
            }
        }
    }
    
    # Add advanced metrics if available
    if ADVANCED_METRICS_AVAILABLE:
        metrics["reference_based"]["bertscore"] = {
            "name": "BERTScore",
            "description": "Embedding-based semantic similarity using BERT",
            "use_case": "Semantic equivalence, more accurate than n-grams",
            "range": "0-1 (higher is better)",
            "requires": "sentence-transformers"
        }
        metrics["reference_based"]["semantic_similarity_advanced"] = {
            "name": "Semantic Similarity (Advanced)",
            "description": "Sentence embeddings for deep semantic understanding",
            "use_case": "Better than Jaccard for semantic similarity",
            "range": "0-1 (higher is better)",
            "requires": "sentence-transformers"
        }
        metrics["reference_free"]["perplexity"] = {
            "name": "Perplexity",
            "description": "Language model confidence in the text",
            "use_case": "Naturalness and fluency of generated text",
            "range": "Lower is better (typically 10-100)",
            "requires": "transformers, torch"
        }
    
    return metrics


# ==================== DSPy Orchestrator Endpoints ====================


from src.dspy_orchestrator import DSPyOrchestrator
from src.dspy_langchain_agent import DSPyLangChainAgent

class DSPyOrchestratorRequest(BaseModel):
    business_task: str
    target_lm: str = "gpt-5-mini"
    dataset: List[EvaluationItem]
    quality_profile: str = "BALANCED"
    optimizer_strategy: str = "auto"
    provider: str = "ollama"
    model: str = "llama2"

@app.post("/api/dspy/orchestrate/stream")
async def run_dspy_orchestrator_stream(request: DSPyOrchestratorRequest):
    """
    Run DSPy Agent Orchestrator with SSE streaming.
    
    Streams steps in real-time as they execute.
    """
    # Validate upfront
    dataset_dicts = [{"input": item.input, "output": item.output} for item in request.dataset]
    
    if len(dataset_dicts) < 5:
        raise HTTPException(status_code=400, detail="Dataset must have at least 5 examples")
    
    if not OPENAI_API_KEY:
        raise HTTPException(status_code=400, detail="OpenAI API key required for DSPy Agent")
    
    # Use asyncio.Queue for thread-safe async communication
    step_queue: asyncio.Queue = asyncio.Queue()
    
    async def event_generator():
        result_holder = {"result": None, "error": None}
        
        def step_callback(step: dict):
            """Called by agent when a step completes."""
            asyncio.run_coroutine_threadsafe(
                step_queue.put(("step", step)),
                loop
            )
        
        def run_agent():
            """Run agent in background thread."""
            try:
                agent = DSPyLangChainAgent(
                    model_name="gpt-5-mini",
                    api_key=OPENAI_API_KEY,
                    temperature=0.2,
                    max_iterations=20,
                    step_callback=step_callback
                )
                
                result = agent.run(
                    business_task=request.business_task,
                    target_lm=request.target_lm,
                    dataset=dataset_dicts,
                    quality_profile=request.quality_profile
                )
                result_holder["result"] = result
            except Exception as e:
                logger.error(f"Agent error: {e}")
                result_holder["error"] = str(e)
            finally:
                asyncio.run_coroutine_threadsafe(
                    step_queue.put(("done", None)),
                    loop
                )
        
        # Get current event loop
        loop = asyncio.get_running_loop()
        
        # Start agent in background thread
        thread = threading.Thread(target=run_agent, daemon=True)
        thread.start()
        
        # Stream steps as SSE events
        try:
            while True:
                try:
                    # Wait for next event with timeout
                    event_type, data = await asyncio.wait_for(step_queue.get(), timeout=120)
                    
                    if event_type == "step":
                        yield f"data: {json.dumps({'type': 'step', 'step': data})}\n\n"
                    elif event_type == "done":
                        if result_holder["error"]:
                            yield f"data: {json.dumps({'type': 'error', 'error': result_holder['error']})}\n\n"
                        else:
                            yield f"data: {json.dumps({'type': 'complete', 'result': result_holder['result']})}\n\n"
                        break
                        
                except asyncio.TimeoutError:
                    # Send keepalive
                    yield f"data: {json.dumps({'type': 'keepalive'})}\n\n"
        finally:
            thread.join(timeout=5)
    
    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )


@app.post("/api/dspy/orchestrate")
async def run_dspy_orchestrator(request: DSPyOrchestratorRequest):
    """
    Run DSPy Agent Orchestrator (non-streaming fallback).
    """
    try:
        dataset_dicts = [{"input": item.input, "output": item.output} for item in request.dataset]
        
        if len(dataset_dicts) < 5:
            raise HTTPException(status_code=400, detail="Dataset must have at least 5 examples")
        
        if not OPENAI_API_KEY:
            raise HTTPException(status_code=400, detail="OpenAI API key required for DSPy Agent")
        
        agent = DSPyLangChainAgent(
            model_name="gpt-5-mini",
            api_key=OPENAI_API_KEY,
            temperature=0.2,
            max_iterations=20
        )
        
        logger.info(f"Starting LangChain DSPy Agent for task: {request.business_task[:100]}...")
        
        result = agent.run(
            business_task=request.business_task,
            target_lm=request.target_lm,
            dataset=dataset_dicts,
            quality_profile=request.quality_profile
        )
        
        if not result.get("success"):
            raise HTTPException(status_code=500, detail=result.get("error", "Agent execution failed"))
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"DSPy orchestration error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/dspy/artifacts")
async def list_dspy_artifacts():
    """List all DSPy artifacts."""
    artifacts_dir = Path("data/artifacts")
    if not artifacts_dir.exists():
        return {"artifacts": []}
    
    artifacts = []
    for artifact_dir in artifacts_dir.iterdir():
        if artifact_dir.is_dir():
            metadata_file = artifact_dir / "metadata.json"
            if metadata_file.exists():
                with open(metadata_file) as f:
                    metadata = json.load(f)
                    artifacts.append(metadata)
    
    # Sort by created_at descending
    artifacts.sort(key=lambda x: x.get("created_at", ""), reverse=True)
    return {"artifacts": artifacts}


@app.get("/api/dspy/artifacts/{artifact_id}")
async def get_dspy_artifact(artifact_id: str):
    """Get a specific DSPy artifact."""
    artifact_dir = Path("data/artifacts") / artifact_id
    
    if not artifact_dir.exists():
        raise HTTPException(status_code=404, detail="Artifact not found")
    
    metadata_file = artifact_dir / "metadata.json"
    program_file = artifact_dir / "program.py"
    
    result = {}
    
    if metadata_file.exists():
        with open(metadata_file) as f:
            result["metadata"] = json.load(f)
    
    if program_file.exists():
        with open(program_file) as f:
            result["program_code"] = f.read()
    
    return result


class TestArtifactRequest(BaseModel):
    artifact_id: str
    input: str
    target_lm: str
    program_code: str


@app.post("/api/dspy/test")
async def test_artifact(request: TestArtifactRequest):
    """
    Test a DSPy artifact with a single input.
    Runs the optimized program and returns the prediction.
    """
    if not OPENAI_API_KEY:
        raise HTTPException(status_code=400, detail="OpenAI API key required")
    
    try:
        from openai import OpenAI
        client = OpenAI(api_key=OPENAI_API_KEY)
        
        # Extract signature info from program code
        # Simple approach: use the LLM to run inference based on the program structure
        response = client.chat.completions.create(
            model=request.target_lm,
            messages=[
                {
                    "role": "system",
                    "content": f"You are running a DSPy program. Based on this program structure:\n\n{request.program_code}\n\nProvide the output for the given input. Return ONLY the predicted output value, nothing else."
                },
                {
                    "role": "user", 
                    "content": request.input
                }
            ],
            temperature=0.1,
            max_tokens=500
        )
        
        output = response.choices[0].message.content.strip()
        return {"output": output}
        
    except Exception as e:
        logger.error(f"Test artifact error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ==================== Advanced Evaluation Endpoints ====================

# Register advanced evaluation router
try:
    from src.api.advanced_evaluation import router as advanced_eval_router
    app.include_router(advanced_eval_router)
    logger.info("Advanced evaluation endpoints registered")
except ImportError as e:
    logger.warning(f"Advanced evaluation endpoints not available: {e}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

