"""Dataset Generator using LLM.

This module provides functionality to generate synthetic datasets
for prompt evaluation, benchmarking, and optimization.
"""
import json
import re
from typing import List, Dict, Any, Optional
from dataclasses import dataclass
from enum import Enum


class GenerationMode(str, Enum):
    """Dataset generation modes."""
    FROM_TASK = "from_task"           # Generate from task description
    FROM_EXAMPLES = "from_examples"   # Expand from seed examples
    FROM_PROMPT = "from_prompt"       # Generate test cases for a prompt
    EDGE_CASES = "edge_cases"         # Generate adversarial/edge cases


class TaskType(str, Enum):
    """Types of tasks for dataset generation."""
    CLASSIFICATION = "classification"
    EXTRACTION = "extraction"
    GENERATION = "generation"
    QA = "qa"
    SUMMARIZATION = "summarization"
    TRANSLATION = "translation"
    CUSTOM = "custom"


class Difficulty(str, Enum):
    """Difficulty levels for generated examples."""
    EASY = "easy"
    MEDIUM = "medium"
    HARD = "hard"
    MIXED = "mixed"


@dataclass
class GenerationConfig:
    """Configuration for dataset generation."""
    mode: GenerationMode
    task_type: TaskType = TaskType.CUSTOM
    count: int = 10
    difficulty: Difficulty = Difficulty.MIXED
    domain: str = ""
    include_edge_cases: bool = False
    task_description: str = ""
    seed_examples: List[Dict[str, str]] = None
    prompt_to_test: str = ""
    
    def __post_init__(self):
        if self.seed_examples is None:
            self.seed_examples = []


class DatasetGenerator:
    """Generates synthetic datasets using LLM."""
    
    def __init__(self, llm_client):
        """Initialize generator with an LLM client.
        
        Args:
            llm_client: LLM client with complete() method
        """
        self.llm = llm_client
    
    def _build_system_context(self, config: GenerationConfig) -> str:
        """Build system context for generation."""
        task_descriptions = {
            TaskType.CLASSIFICATION: "categorizing inputs into predefined classes",
            TaskType.EXTRACTION: "extracting specific information from text",
            TaskType.GENERATION: "generating creative or structured text",
            TaskType.QA: "answering questions based on context or knowledge",
            TaskType.SUMMARIZATION: "condensing longer text into key points",
            TaskType.TRANSLATION: "converting text between languages or formats",
            TaskType.CUSTOM: "a custom task as described"
        }
        
        difficulty_guidance = {
            Difficulty.EASY: "simple, straightforward examples that are easy to handle",
            Difficulty.MEDIUM: "moderately complex examples requiring some reasoning",
            Difficulty.HARD: "challenging examples with edge cases, ambiguity, or complexity",
            Difficulty.MIXED: "a mix of easy, medium, and hard examples"
        }
        
        return f"""You are an expert dataset creator for AI/ML evaluation.
Your task is to generate high-quality input/output pairs for {task_descriptions[config.task_type]}.

Guidelines:
- Generate {difficulty_guidance[config.difficulty]}
- Each example must have a clear, unambiguous expected output
- Examples should be diverse and cover different scenarios
- Domain context: {config.domain if config.domain else 'General'}
- Output ONLY valid JSON array, no explanations or markdown"""
    
    def _build_generation_prompt(self, config: GenerationConfig) -> str:
        """Build the generation prompt based on mode."""
        
        if config.mode == GenerationMode.FROM_TASK:
            return self._prompt_from_task(config)
        elif config.mode == GenerationMode.FROM_EXAMPLES:
            return self._prompt_from_examples(config)
        elif config.mode == GenerationMode.FROM_PROMPT:
            return self._prompt_from_prompt(config)
        elif config.mode == GenerationMode.EDGE_CASES:
            return self._prompt_edge_cases(config)
        else:
            raise ValueError(f"Unknown generation mode: {config.mode}")
    
    def _prompt_from_task(self, config: GenerationConfig) -> str:
        """Generate prompt for FROM_TASK mode."""
        edge_case_instruction = ""
        if config.include_edge_cases:
            edge_case_instruction = """
Include some edge cases such as:
- Empty or minimal inputs
- Very long inputs
- Inputs with special characters or formatting
- Ambiguous cases
- Boundary conditions"""
        
        return f"""{self._build_system_context(config)}

Task Description: {config.task_description}

Generate exactly {config.count} diverse input/output pairs for this task.
{edge_case_instruction}

Output format (JSON array only, no markdown):
[
  {{"input": "example input 1", "output": "expected output 1"}},
  {{"input": "example input 2", "output": "expected output 2"}}
]

Generate {config.count} examples now:"""
    
    def _prompt_from_examples(self, config: GenerationConfig) -> str:
        """Generate prompt for FROM_EXAMPLES mode."""
        examples_str = json.dumps(config.seed_examples, indent=2, ensure_ascii=False)
        
        return f"""{self._build_system_context(config)}

Here are seed examples to learn the pattern from:
{examples_str}

Based on these examples, generate {config.count} NEW and DIVERSE examples following the same pattern.
- Maintain the same format and style
- Cover different scenarios not shown in the examples
- Vary complexity and edge cases

Output format (JSON array only, no markdown):
[
  {{"input": "new example input", "output": "expected output"}}
]

Generate {config.count} new examples now:"""
    
    def _prompt_from_prompt(self, config: GenerationConfig) -> str:
        """Generate prompt for FROM_PROMPT mode."""
        edge_case_instruction = ""
        if config.include_edge_cases:
            edge_case_instruction = """
Include challenging test cases:
- Inputs that might confuse the prompt
- Edge cases and boundary conditions
- Adversarial inputs that test robustness"""
        
        return f"""{self._build_system_context(config)}

Here is the prompt/instruction that will be tested:
---
{config.prompt_to_test}
---

Generate {config.count} test cases (input/output pairs) to evaluate this prompt.
The "input" is what a user would provide, and "output" is the expected correct response.
{edge_case_instruction}

Output format (JSON array only, no markdown):
[
  {{"input": "test input 1", "output": "expected correct output 1"}},
  {{"input": "test input 2", "output": "expected correct output 2"}}
]

Generate {config.count} test cases now:"""
    
    def _prompt_edge_cases(self, config: GenerationConfig) -> str:
        """Generate prompt for EDGE_CASES mode."""
        base_context = ""
        if config.seed_examples:
            base_context = f"\nReference examples:\n{json.dumps(config.seed_examples[:3], indent=2, ensure_ascii=False)}"
        if config.prompt_to_test:
            base_context += f"\n\nPrompt being tested:\n{config.prompt_to_test}"
        
        return f"""{self._build_system_context(config)}

Generate {config.count} EDGE CASE and ADVERSARIAL test inputs for robustness testing.
{base_context}

Focus on:
1. **Format variations**: Different capitalization, spacing, punctuation
2. **Boundary cases**: Empty inputs, very long inputs, single characters
3. **Special characters**: Unicode, emojis, HTML/code injection attempts
4. **Ambiguous inputs**: Unclear requests, multiple interpretations
5. **Adversarial**: Prompt injection attempts, misleading context
6. **Typos and noise**: Common misspellings, OCR-like errors

Output format (JSON array only, no markdown):
[
  {{"input": "edge case input", "output": "expected handling/output"}}
]

Generate {config.count} edge cases now:"""
    
    def _parse_response(self, response: str) -> List[Dict[str, str]]:
        """Parse LLM response to extract JSON array."""
        # Try to find JSON array in response
        response = response.strip()
        
        # Remove markdown code blocks if present
        if "```" in response:
            # Extract content from code blocks
            code_block_pattern = r'```(?:json)?\s*([\s\S]*?)```'
            matches = re.findall(code_block_pattern, response)
            if matches:
                response = matches[0].strip()
            else:
                # Fallback: remove ``` markers
                response = response.replace("```json", "").replace("```", "").strip()
        
        # Try direct parse
        try:
            data = json.loads(response)
            if isinstance(data, list):
                return self._validate_items(data)
        except json.JSONDecodeError:
            pass
        
        # Try to find array in response (greedy match for nested structures)
        match = re.search(r'\[[\s\S]*\]', response)
        if match:
            try:
                data = json.loads(match.group())
                if isinstance(data, list):
                    return self._validate_items(data)
            except json.JSONDecodeError:
                pass
        
        # Try to fix common JSON issues and parse again
        try:
            # Find the array bounds
            start_idx = response.find('[')
            end_idx = response.rfind(']')
            if start_idx != -1 and end_idx != -1 and end_idx > start_idx:
                json_str = response[start_idx:end_idx + 1]
                
                # Fix common issues:
                # 1. Trailing commas before ]
                json_str = re.sub(r',\s*\]', ']', json_str)
                # 2. Trailing commas before }
                json_str = re.sub(r',\s*\}', '}', json_str)
                # 3. Single quotes to double quotes (careful with apostrophes)
                # Only replace single quotes that look like JSON delimiters
                json_str = re.sub(r"(?<=[{,\[:])\s*'([^']*?)'\s*(?=[,}\]:])", r'"\1"', json_str)
                
                data = json.loads(json_str)
                if isinstance(data, list):
                    return self._validate_items(data)
        except (json.JSONDecodeError, Exception):
            pass
        
        # Last resort: try to extract individual objects
        try:
            items = []
            obj_pattern = r'\{\s*"input"\s*:\s*"([^"]*(?:\\.[^"]*)*)"\s*,\s*"output"\s*:\s*"([^"]*(?:\\.[^"]*)*)"\s*\}'
            for match in re.finditer(obj_pattern, response):
                items.append({
                    'input': match.group(1).replace('\\"', '"'),
                    'output': match.group(2).replace('\\"', '"')
                })
            if items:
                return items
        except Exception:
            pass
        
        raise ValueError("Could not parse LLM response as JSON array")
    
    def _validate_items(self, items: List[Any]) -> List[Dict[str, str]]:
        """Validate and clean generated items."""
        valid_items = []
        for item in items:
            if isinstance(item, dict) and 'input' in item and 'output' in item:
                valid_items.append({
                    'input': str(item['input']).strip(),
                    'output': str(item['output']).strip()
                })
        return valid_items
    
    def generate(self, config: GenerationConfig, model: str = None) -> List[Dict[str, str]]:
        """Generate dataset based on configuration.
        
        Args:
            config: Generation configuration
            model: Optional model override
            
        Returns:
            List of input/output pairs
        """
        prompt = self._build_generation_prompt(config)
        
        # Generate with higher temperature for diversity
        kwargs = {"temperature": 0.8}
        if model:
            kwargs["model"] = model
        
        response = self.llm.complete(prompt, **kwargs)
        items = self._parse_response(response)
        
        # If we didn't get enough items, try again
        if len(items) < config.count:
            remaining = config.count - len(items)
            config.count = remaining
            try:
                response = self.llm.complete(prompt, **kwargs)
                more_items = self._parse_response(response)
                items.extend(more_items)
            except Exception:
                pass  # Return what we have
        
        return items[:config.count]
    
    async def generate_async(self, config: GenerationConfig, model: str = None) -> List[Dict[str, str]]:
        """Async version of generate for use with async LLM clients."""
        prompt = self._build_generation_prompt(config)
        
        kwargs = {"temperature": 0.8}
        if model:
            kwargs["model"] = model
        
        # Check if LLM has async method
        if hasattr(self.llm, 'complete_async'):
            response = await self.llm.complete_async(prompt, **kwargs)
        elif hasattr(self.llm, 'generate'):
            response = await self.llm.generate(prompt)
        else:
            response = self.llm.complete(prompt, **kwargs)
        
        items = self._parse_response(response)
        return items[:config.count]
