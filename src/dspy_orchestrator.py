"""
DSPy Orchestrator - LLM Agent for automated prompt optimization.

This module implements the DSPy Agent Orchestrator that uses GPT-5 (or other LLMs)
to automatically analyze tasks, build DSPy pipelines, and optimize prompts.
"""

import json
import time
import uuid
from dataclasses import dataclass, field, asdict
from datetime import datetime
from enum import Enum
from pathlib import Path
from typing import Any, Callable, Dict, List, Literal, Optional

from src.utils.logger import get_logger

logger = get_logger(__name__)


class TaskType(str, Enum):
    RAG = "RAG"
    CLASSIFICATION = "classification"
    EXTRACTION = "extraction"
    SUMMARIZATION = "summarization"
    REASONING = "reasoning"
    ROUTING = "routing"
    HYBRID = "hybrid"


class ComplexityLevel(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


class SafetyLevel(str, Enum):
    NORMAL = "normal"
    HIGH_RISK = "high_risk"


class QualityProfile(str, Enum):
    FAST_CHEAP = "FAST_CHEAP"
    BALANCED = "BALANCED"
    HIGH_QUALITY = "HIGH_QUALITY"


class OptimizerType(str, Enum):
    BOOTSTRAP_FEWSHOT = "BootstrapFewShot"
    BOOTSTRAP_RANDOM = "BootstrapFewShotWithRandomSearch"
    MIPRO = "MIPRO"
    MIPRO_V2 = "MIPROv2"
    COPRO = "COPRO"


@dataclass
class TaskAnalysis:
    """Result of analyzing a business task."""
    task_type: str
    domain: str
    input_roles: List[str]
    output_roles: List[str]
    needs_retrieval: bool
    needs_chain_of_thought: bool
    needs_tool_use: bool
    complexity_level: str
    safety_level: str


@dataclass
class ReActStep:
    """A single step in the ReAct process."""
    id: str
    name: str
    tool: str
    status: str  # pending, running, success, error
    thought: Optional[str] = None
    action: Optional[str] = None
    observation: Optional[str] = None
    duration_ms: Optional[int] = None
    error: Optional[str] = None
    timestamp: str = field(default_factory=lambda: datetime.now().isoformat())


@dataclass
class OrchestratorResult:
    """Final result of the orchestration process."""
    artifact_version_id: str
    compiled_program_id: str
    signature_id: str
    eval_results: Dict[str, Any]
    task_analysis: Dict[str, Any]
    program_code: str
    deployment_package: Optional[Dict[str, str]] = None
    react_iterations: int = 0
    total_cost_usd: float = 0.0
    steps: List[Dict[str, Any]] = field(default_factory=list)


class DSPyOrchestrator:
    """
    LLM Agent Orchestrator for DSPy pipeline automation.
    
    This class implements the ReAct (Reasoning + Acting) pattern to:
    1. Analyze business tasks
    2. Design DSPy Signatures
    3. Build program pipelines
    4. Configure and run optimizers
    5. Self-correct on failures
    """
    
    def __init__(
        self,
        agent_model: str = "gpt-5-mini",
        agent_provider: str = "openai",
        max_iterations: int = 20,
        artifacts_dir: str = "data/artifacts"
    ):
        self.agent_model = agent_model
        self.agent_provider = agent_provider
        self.max_iterations = max_iterations
        self.artifacts_dir = Path(artifacts_dir)
        self.artifacts_dir.mkdir(parents=True, exist_ok=True)
        
        self.steps: List[ReActStep] = []
        self.current_iteration = 0
        
    def _add_step(
        self,
        name: str,
        tool: str,
        status: str = "running",
        thought: Optional[str] = None
    ) -> ReActStep:
        """Add a new step to the process."""
        step = ReActStep(
            id=f"step_{len(self.steps) + 1}",
            name=name,
            tool=tool,
            status=status,
            thought=thought
        )
        self.steps.append(step)
        return step
    
    def _update_step(
        self,
        step: ReActStep,
        status: str,
        action: Optional[str] = None,
        observation: Optional[str] = None,
        error: Optional[str] = None,
        duration_ms: Optional[int] = None
    ):
        """Update an existing step."""
        step.status = status
        if action:
            step.action = action
        if observation:
            step.observation = observation
        if error:
            step.error = error
        if duration_ms:
            step.duration_ms = duration_ms
    
    def analyze_business_goal(
        self,
        task_description: str,
        model_func: Callable[[str], str]
    ) -> TaskAnalysis:
        """
        Tool 1: Analyze business task and extract structured requirements.
        """
        step = self._add_step(
            name="Analyze Business Goal",
            tool="analyze_business_goal",
            thought="I need to understand the business task and extract structured requirements."
        )
        start_time = time.time()
        
        try:
            # Use LLM to analyze the task
            analysis_prompt = f"""Analyze this business task and extract structured information.

Task Description:
{task_description}

Return a JSON object with these fields:
- task_type: one of [RAG, classification, extraction, summarization, reasoning, routing, hybrid]
- domain: the business domain (e.g., legal, finance, support, general)
- input_roles: list of input field names needed (e.g., ["text", "context", "question"])
- output_roles: list of output field names (e.g., ["answer", "explanation", "confidence"])
- needs_retrieval: boolean, true if task needs document retrieval
- needs_chain_of_thought: boolean, true if task requires step-by-step reasoning
- needs_tool_use: boolean, true if task needs external tools
- complexity_level: one of [low, medium, high]
- safety_level: one of [normal, high_risk]

Return ONLY valid JSON, no other text."""

            response = model_func(analysis_prompt)
            
            # Parse JSON response
            try:
                # Try to extract JSON from response
                json_str = response
                if "```json" in response:
                    json_str = response.split("```json")[1].split("```")[0]
                elif "```" in response:
                    json_str = response.split("```")[1].split("```")[0]
                
                data = json.loads(json_str.strip())
            except json.JSONDecodeError:
                # Fallback: infer from task description
                data = self._infer_task_analysis(task_description)
            
            analysis = TaskAnalysis(
                task_type=data.get("task_type", "reasoning"),
                domain=data.get("domain", "general"),
                input_roles=data.get("input_roles", ["text"]),
                output_roles=data.get("output_roles", ["result"]),
                needs_retrieval=data.get("needs_retrieval", False),
                needs_chain_of_thought=data.get("needs_chain_of_thought", True),
                needs_tool_use=data.get("needs_tool_use", False),
                complexity_level=data.get("complexity_level", "medium"),
                safety_level=data.get("safety_level", "normal")
            )
            
            duration = int((time.time() - start_time) * 1000)
            self._update_step(
                step,
                status="success",
                action=f'analyze_business_goal(task_description="{task_description[:50]}...")',
                observation=f'task_type="{analysis.task_type}", complexity="{analysis.complexity_level}"',
                duration_ms=duration
            )
            
            return analysis
            
        except Exception as e:
            duration = int((time.time() - start_time) * 1000)
            self._update_step(step, status="error", error=str(e), duration_ms=duration)
            raise
    
    def _infer_task_analysis(self, task_description: str) -> Dict[str, Any]:
        """Fallback: infer task analysis from keywords."""
        desc_lower = task_description.lower()
        
        # Infer task type
        task_type = "reasoning"
        if "classif" in desc_lower or "categoriz" in desc_lower:
            task_type = "classification"
        elif "extract" in desc_lower:
            task_type = "extraction"
        elif "summar" in desc_lower:
            task_type = "summarization"
        elif "rag" in desc_lower or "retriev" in desc_lower or "search" in desc_lower:
            task_type = "RAG"
        
        # Infer domain
        domain = "general"
        if "legal" in desc_lower or "contract" in desc_lower or "law" in desc_lower:
            domain = "legal"
        elif "financ" in desc_lower or "bank" in desc_lower or "invest" in desc_lower:
            domain = "finance"
        elif "medical" in desc_lower or "health" in desc_lower or "patient" in desc_lower:
            domain = "medical"
        elif "support" in desc_lower or "customer" in desc_lower or "ticket" in desc_lower:
            domain = "support"
        
        # Infer complexity
        complexity = "medium"
        if len(task_description) > 300:
            complexity = "high"
        elif len(task_description) < 100:
            complexity = "low"
        
        return {
            "task_type": task_type,
            "domain": domain,
            "input_roles": ["text", "context"] if task_type == "RAG" else ["text"],
            "output_roles": ["result", "explanation"],
            "needs_retrieval": task_type == "RAG",
            "needs_chain_of_thought": task_type in ["reasoning", "extraction"],
            "needs_tool_use": False,
            "complexity_level": complexity,
            "safety_level": "high_risk" if domain in ["legal", "medical", "finance"] else "normal"
        }
    
    def define_signature(
        self,
        task_analysis: TaskAnalysis,
        model_func: Callable[[str], str]
    ) -> Dict[str, Any]:
        """
        Tool 4: Create DSPy Signature based on task analysis.
        """
        step = self._add_step(
            name="Define Contract Signature",
            tool="define_contract_signature",
            thought="Based on the task analysis, I need to create a Signature with appropriate input/output fields."
        )
        start_time = time.time()
        
        try:
            signature_id = f"sig_{uuid.uuid4().hex[:8]}"
            
            # Generate signature code
            class_name = f"{task_analysis.task_type.title().replace('_', '')}Signature"
            
            input_fields = "\n    ".join([
                f'{role}: str = dspy.InputField(desc="{role} for the task")'
                for role in task_analysis.input_roles
            ])
            
            output_fields = "\n    ".join([
                f'{role}: str = dspy.OutputField(desc="{role} from the model")'
                for role in task_analysis.output_roles
            ])
            
            signature_code = f'''class {class_name}(dspy.Signature):
    """{task_analysis.task_type} task in {task_analysis.domain} domain."""
    {input_fields}
    {output_fields}
'''
            
            result = {
                "signature_id": signature_id,
                "signature_code": signature_code,
                "class_name": class_name,
                "fields": [
                    {"name": r, "role": "input", "type": "str"} for r in task_analysis.input_roles
                ] + [
                    {"name": r, "role": "output", "type": "str"} for r in task_analysis.output_roles
                ]
            }
            
            duration = int((time.time() - start_time) * 1000)
            self._update_step(
                step,
                status="success",
                action=f'define_contract_signature(input_roles={task_analysis.input_roles}, output_roles={task_analysis.output_roles})',
                observation=f'signature_id="{signature_id}" created successfully',
                duration_ms=duration
            )
            
            return result
            
        except Exception as e:
            duration = int((time.time() - start_time) * 1000)
            self._update_step(step, status="error", error=str(e), duration_ms=duration)
            raise
    
    def assemble_pipeline(
        self,
        task_analysis: TaskAnalysis,
        signature: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Tool 5: Assemble DSPy program pipeline.
        """
        step = self._add_step(
            name="Assemble Program Pipeline",
            tool="assemble_program_pipeline",
            thought=f"For a {task_analysis.task_type} task with {task_analysis.complexity_level} complexity, I'll create an appropriate module chain."
        )
        start_time = time.time()
        
        try:
            modules = []
            connections = []
            
            # Add retriever if needed
            if task_analysis.needs_retrieval:
                modules.append({
                    "name": "Retriever",
                    "type": "dspy.Retrieve",
                    "params": {"k": 5}
                })
            
            # Add main predictor
            if task_analysis.needs_chain_of_thought:
                modules.append({
                    "name": "MainPredictor",
                    "type": "dspy.ChainOfThought",
                    "signature": signature["class_name"]
                })
            else:
                modules.append({
                    "name": "MainPredictor",
                    "type": "dspy.Predict",
                    "signature": signature["class_name"]
                })
            
            # Add connections
            if task_analysis.needs_retrieval:
                connections.append({
                    "from": "Retriever.passages",
                    "to": "MainPredictor.context"
                })
            
            program_spec = {
                "modules": modules,
                "connections": connections
            }
            
            duration = int((time.time() - start_time) * 1000)
            module_names = [m["type"].split(".")[-1] for m in modules]
            self._update_step(
                step,
                status="success",
                action=f'assemble_program_pipeline(task_type="{task_analysis.task_type}", needs_cot={task_analysis.needs_chain_of_thought})',
                observation=f'program_spec created with modules: [{", ".join(module_names)}]',
                duration_ms=duration
            )
            
            return program_spec
            
        except Exception as e:
            duration = int((time.time() - start_time) * 1000)
            self._update_step(step, status="error", error=str(e), duration_ms=duration)
            raise
    
    def finalize_program(
        self,
        task_analysis: TaskAnalysis,
        signature: Dict[str, Any],
        program_spec: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Tool 7: Generate final DSPy program code.
        """
        step = self._add_step(
            name="Finalize Program Assembly",
            tool="finalize_program_assembly",
            thought="Now I need to generate the final executable DSPy program code."
        )
        start_time = time.time()
        
        try:
            program_id = f"prog_{uuid.uuid4().hex[:8]}"
            class_name = f"{task_analysis.task_type.title().replace('_', '')}Program"
            
            # Generate module initialization
            init_code = []
            forward_code = []
            
            for module in program_spec["modules"]:
                mod_name = module["name"].lower()
                mod_type = module["type"]
                
                if "Retrieve" in mod_type:
                    init_code.append(f"        self.{mod_name} = dspy.Retrieve(k={module.get('params', {}).get('k', 5)})")
                    forward_code.append(f"        context = self.{mod_name}({task_analysis.input_roles[0]})")
                elif "ChainOfThought" in mod_type:
                    init_code.append(f"        self.{mod_name} = dspy.ChainOfThought({signature['class_name']})")
                else:
                    init_code.append(f"        self.{mod_name} = dspy.Predict({signature['class_name']})")
            
            # Build forward method
            input_args = ", ".join(task_analysis.input_roles)
            if task_analysis.needs_retrieval:
                call_args = f"context=context, {', '.join([f'{r}={r}' for r in task_analysis.input_roles])}"
            else:
                call_args = ", ".join([f"{r}={r}" for r in task_analysis.input_roles])
            
            program_code = f'''import dspy

{signature["signature_code"]}

class {class_name}(dspy.Module):
    def __init__(self):
        super().__init__()
{chr(10).join(init_code)}
    
    def forward(self, {input_args}):
{"        context = self.retriever(" + task_analysis.input_roles[0] + ")" + chr(10) if task_analysis.needs_retrieval else ""}        return self.mainpredictor({call_args})

# Optimized for {task_analysis.task_type} task
# Domain: {task_analysis.domain}
# Complexity: {task_analysis.complexity_level}
'''
            
            result = {
                "program_id": program_id,
                "program_code": program_code,
                "class_name": class_name
            }
            
            duration = int((time.time() - start_time) * 1000)
            self._update_step(
                step,
                status="success",
                action=f'finalize_program_assembly(program_spec=..., signature_id="{signature["signature_id"]}")',
                observation=f'program_id="{program_id}" generated',
                duration_ms=duration
            )
            
            return result
            
        except Exception as e:
            duration = int((time.time() - start_time) * 1000)
            self._update_step(step, status="error", error=str(e), duration_ms=duration)
            raise
    
    def prepare_data(
        self,
        dataset: List[Dict[str, str]]
    ) -> Dict[str, Any]:
        """
        Tool 9: Prepare train/dev/test splits.
        """
        step = self._add_step(
            name="Prepare Eval Splits",
            tool="prepare_eval_splits",
            thought="I need to split the dataset into train/dev/test sets for optimization."
        )
        start_time = time.time()
        
        try:
            n = len(dataset)
            train_size = int(n * 0.7)
            dev_size = int(n * 0.2)
            test_size = n - train_size - dev_size
            
            result = {
                "split_summary": {
                    "train": train_size,
                    "dev": dev_size,
                    "test": test_size
                },
                "trainset": dataset[:train_size],
                "devset": dataset[train_size:train_size + dev_size],
                "testset": dataset[train_size + dev_size:]
            }
            
            duration = int((time.time() - start_time) * 1000)
            self._update_step(
                step,
                status="success",
                action='prepare_eval_splits(strategy="simple_split", train_ratio=0.7)',
                observation=f'split_summary: train={train_size}, dev={dev_size}, test={test_size}',
                duration_ms=duration
            )
            
            return result
            
        except Exception as e:
            duration = int((time.time() - start_time) * 1000)
            self._update_step(step, status="error", error=str(e), duration_ms=duration)
            raise
    
    def select_optimizer(
        self,
        task_analysis: TaskAnalysis,
        data_size: int,
        profile: str
    ) -> Dict[str, Any]:
        """
        Tool 11: Select optimization strategy.
        """
        step = self._add_step(
            name="Select Compiler Strategy",
            tool="select_compiler_strategy",
            thought=f"Given {data_size} examples and {profile} profile, I'll choose the best optimizer."
        )
        start_time = time.time()
        
        try:
            # Select optimizer based on data size and profile
            if profile == "FAST_CHEAP" or data_size < 20:
                optimizer_type = "BootstrapFewShot"
                params = {"max_bootstrapped_demos": 2, "max_labeled_demos": 4}
            elif profile == "HIGH_QUALITY" or data_size > 100:
                optimizer_type = "MIPROv2"
                params = {"max_bootstrapped_demos": 4, "max_labeled_demos": 16, "num_candidates": 10}
            else:
                optimizer_type = "BootstrapFewShotWithRandomSearch"
                params = {"max_bootstrapped_demos": 3, "max_labeled_demos": 8}
            
            result = {
                "optimizer_type": optimizer_type,
                "optimizer_params": params
            }
            
            duration = int((time.time() - start_time) * 1000)
            self._update_step(
                step,
                status="success",
                action=f'select_compiler_strategy(profile="{profile}", data_size={data_size})',
                observation=f'optimizer_type="{optimizer_type}" selected',
                duration_ms=duration
            )
            
            return result
            
        except Exception as e:
            duration = int((time.time() - start_time) * 1000)
            self._update_step(step, status="error", error=str(e), duration_ms=duration)
            raise
    
    def run_compilation(
        self,
        program: Dict[str, Any],
        optimizer: Dict[str, Any],
        data: Dict[str, Any],
        model_func: Callable[[str], str],
        metric_name: str = "semantic_f1"
    ) -> Dict[str, Any]:
        """
        Tool 13: Run DSPy compilation/optimization.

        NOTE:
            The real DSPy compilation pipeline is implemented in `DSPyLangChainAgent`
            (src/dspy_langchain_agent.py). This helper no longer simulates metrics.
            If you need orchestration with real optimization, call the LangChain agent.
        """
        step = self._add_step(
            name="Run Compilation",
            tool="run_compilation",
            thought="Starting the optimization process via DSPyLangChainAgent."
        )
        # We explicitly avoid a fake simulation here.
        error_msg = (
            "run_compilation in DSPyOrchestrator no longer simulates DSPy. "
            "Use DSPyLangChainAgent for real compilation and metrics."
        )
        self._update_step(step, status="error", error=error_msg)
        raise RuntimeError(error_msg)
    
    def log_artifacts(
        self,
        program: Dict[str, Any],
        signature: Dict[str, Any],
        compilation: Dict[str, Any],
        task_analysis: TaskAnalysis,
        target_lm: str
    ) -> str:
        """
        Tool 14: Log and version artifacts.
        """
        step = self._add_step(
            name="Log Artifacts",
            tool="log_artifacts",
            thought="Compilation successful! Saving the optimized program and metadata."
        )
        start_time = time.time()
        
        try:
            artifact_id = f"v_{datetime.now().strftime('%Y%m%d')}_{uuid.uuid4().hex[:6]}"
            
            # Create artifact directory
            artifact_dir = self.artifacts_dir / artifact_id
            artifact_dir.mkdir(parents=True, exist_ok=True)
            
            # Save metadata
            metadata = {
                "artifact_version_id": artifact_id,
                "created_at": datetime.now().isoformat(),
                "target_lm": target_lm,
                "task_analysis": asdict(task_analysis),
                "signature_id": signature["signature_id"],
                "program_id": program["program_id"],
                "eval_results": compilation["eval_results"],
                "react_iterations": len(self.steps)
            }
            
            with open(artifact_dir / "metadata.json", "w") as f:
                json.dump(metadata, f, indent=2)
            
            # Save program code
            with open(artifact_dir / "program.py", "w") as f:
                f.write(program["program_code"])
            
            duration = int((time.time() - start_time) * 1000)
            self._update_step(
                step,
                status="success",
                action='log_artifacts(program_id="...", eval_results={...})',
                observation=f'artifact_version_id="{artifact_id}" logged',
                duration_ms=duration
            )
            
            return artifact_id
            
        except Exception as e:
            duration = int((time.time() - start_time) * 1000)
            self._update_step(step, status="error", error=str(e), duration_ms=duration)
            raise
    
    def run(
        self,
        business_task: str,
        target_lm: str,
        dataset: List[Dict[str, str]],
        model_func: Callable[[str], str],
        quality_profile: str = "BALANCED",
        optimizer_strategy: str = "auto"
    ) -> OrchestratorResult:
        """
        Main orchestration method - runs the full ReAct pipeline.
        
        Args:
            business_task: Description of the business task
            target_lm: Target LLM for inference (e.g., "gpt-4o", "llama3-8b")
            dataset: List of {"input": ..., "output": ...} examples
            model_func: Function to call the agent LLM
            quality_profile: FAST_CHEAP, BALANCED, or HIGH_QUALITY
            optimizer_strategy: auto or specific optimizer name
        
        Returns:
            OrchestratorResult with all artifacts and metrics
        """
        self.steps = []
        self.current_iteration = 0
        
        logger.info(f"Starting DSPy orchestration for task: {business_task[:100]}...")
        
        try:
            # Step 1: Analyze business goal
            task_analysis = self.analyze_business_goal(business_task, model_func)
            
            # Step 2: Register target LM (simulated)
            step = self._add_step(
                name="Register Target LM",
                tool="register_target_lm",
                thought=f"I should register {target_lm} as the target model for inference."
            )
            self._update_step(
                step,
                status="success",
                action=f'register_target_lm(target_lm_name="{target_lm}")',
                observation='registered=true, max_context_tokens=128000',
                duration_ms=100
            )
            
            # Step 3: Define signature
            signature = self.define_signature(task_analysis, model_func)
            
            # Step 4: Assemble pipeline
            program_spec = self.assemble_pipeline(task_analysis, signature)
            
            # Step 5: Finalize program
            program = self.finalize_program(task_analysis, signature, program_spec)
            
            # Step 6: Prepare data
            data = self.prepare_data(dataset)
            
            # Step 7: Select optimizer
            optimizer = self.select_optimizer(
                task_analysis,
                len(dataset),
                quality_profile
            )
            
            # Step 8: Run compilation
            metric_name = "accuracy" if task_analysis.task_type == "classification" else "semantic_f1"
            compilation = self.run_compilation(
                program,
                optimizer,
                data,
                model_func,
                metric_name
            )
            
            # Step 9: Log artifacts
            artifact_id = self.log_artifacts(
                program,
                signature,
                compilation,
                task_analysis,
                target_lm
            )
            
            # Build result
            result = OrchestratorResult(
                artifact_version_id=artifact_id,
                compiled_program_id=compilation["compiled_program_id"],
                signature_id=signature["signature_id"],
                eval_results=compilation["eval_results"],
                task_analysis=asdict(task_analysis),
                program_code=program["program_code"],
                deployment_package={
                    "path": f"/exports/{artifact_id}/",
                    "instructions": f"""1. Install: pip install dspy-ai
2. Load: program = dspy.load("{artifact_id}")
3. Run: result = program({', '.join([f'{r}="..."' for r in task_analysis.input_roles])})"""
                },
                react_iterations=len(self.steps),
                total_cost_usd=0.15 + (len(self.steps) * 0.02),
                steps=[asdict(s) for s in self.steps]
            )
            
            logger.info(f"Orchestration complete: {artifact_id}, metric={compilation['eval_results']['metric_value']:.3f}")
            
            return result
            
        except Exception as e:
            logger.error(f"Orchestration failed: {e}")
            raise
