"""Helpers for browsing and importing datasets from Hugging Face Hub."""

from typing import Any, Dict, List, Optional, Tuple

from datasets import load_dataset, get_dataset_config_names

from src.utils.logger import get_logger

logger = get_logger(__name__)


def search_hf_datasets(query: str, limit: int = 20) -> List[Dict[str, Any]]:
    """Lightweight search wrapper over Hugging Face Hub.

    We use the `datasets` metadata endpoint via `load_dataset` helpers where possible,
    but to avoid a hard dependency on the full Hub client we keep this minimal.
    """
    try:
        # Lazy import to avoid cost if user never uses catalog
        from huggingface_hub import list_datasets  # type: ignore
    except ImportError as e:
        raise RuntimeError(
            "huggingface_hub is not installed. Install it to use the online dataset catalog."
        ) from e

    try:
        results = list_datasets(search=query, limit=limit)
        datasets: List[Dict[str, Any]] = []
        for ds in results:
            datasets.append(
                {
                    "id": ds.id,
                    "cardData": ds.cardData or {},
                    "tags": ds.tags or [],
                    "downloads": getattr(ds, "downloads", None),
                    "likes": getattr(ds, "likes", None),
                }
            )
        return datasets
    except Exception as e:
        logger.error(f"Error searching Hugging Face datasets: {e}")
        raise


def _detect_io_fields(example: Dict[str, Any]) -> Optional[Tuple[str, str]]:
    """Heuristically detect input/output columns for business-style datasets."""
    keys = set(example.keys())

    candidates = [
        ("input", "output"),
        ("instruction", "output"),
        ("question", "answer"),
        ("text", "label"),
        ("source", "target"),
        ("prompt", "completion"),
    ]

    for inp, out in candidates:
        if inp in keys and out in keys:
            return inp, out

    # Fallback: first two string-like fields
    text_like = [k for k, v in example.items() if isinstance(v, str)]
    if len(text_like) >= 2:
        return text_like[0], text_like[1]

    return None


def inspect_hf_dataset(
    dataset_id: str,
    config_name: Optional[str] = None,
    split: str = "train",
) -> Dict[str, Any]:
    """Inspect a dataset and return available columns plus suggested mapping."""
    try:
        configs = get_dataset_config_names(dataset_id)
    except Exception:
        configs = []

    if configs and not config_name:
        config_name = configs[0]

    if config_name:
        ds = load_dataset(dataset_id, config_name, split=split)
    else:
        ds = load_dataset(dataset_id, split=split)

    if len(ds) == 0:
        raise ValueError("Dataset split is empty")

    first = ds[0]
    columns = list(first.keys())
    suggestion = _detect_io_fields(first)

    return {
        "columns": columns,
        "suggested_input": suggestion[0] if suggestion else None,
        "suggested_output": suggestion[1] if suggestion else None,
    }


def import_hf_dataset(
    dataset_id: str,
    config_name: Optional[str] = None,
    split: str = "train",
    max_items: int = 500,
    input_key: Optional[str] = None,
    output_key: Optional[str] = None,
) -> Dict[str, Any]:
    """Download a dataset from Hugging Face and convert to PE Studio format.

    Returns:
        {
          "name": <suggested name>,
          "description": <short description>,
          "items": [ { "input": str, "output": str }, ... ],
          "meta": { ... }
        }
    """
    # Resolve config and split
    try:
        configs = get_dataset_config_names(dataset_id)
    except Exception:
        configs = []

    if configs and not config_name:
        config_name = configs[0]

    try:
        if config_name:
            ds = load_dataset(dataset_id, config_name, split=split)
        else:
            ds = load_dataset(dataset_id, split=split)
    except Exception as e:
        logger.error(f"Error loading HF dataset {dataset_id}: {e}")
        raise

    if len(ds) == 0:
        raise ValueError("Dataset split is empty")

    first = ds[0]

    # Determine mapping
    if input_key and output_key:
        if input_key not in first or output_key not in first:
            raise ValueError(
                f"Selected columns '{input_key}' and/or '{output_key}' not found in dataset columns {list(first.keys())}"
            )
    else:
        io_fields = _detect_io_fields(first)
        if not io_fields:
            raise ValueError(
                "Could not automatically detect input/output fields. "
                "Expected something like (input, output), (question, answer), (text, label), etc."
            )
        input_key, output_key = io_fields

    items = []
    for ex in ds.select(range(min(len(ds), max_items))):
        inp = ex.get(input_key)
        out = ex.get(output_key)
        if inp is None or out is None:
            continue
        items.append({"input": str(inp), "output": str(out)})

    meta: Dict[str, Any] = {
        "dataset_id": dataset_id,
        "config_name": config_name,
        "split": split,
        "input_key": input_key,
        "output_key": output_key,
        "total_examples": len(ds),
    }

    # Friendly name/description based on id and mapping
    name = dataset_id.replace("/", " / ")
    description = f"Imported from Hugging Face ({dataset_id}), using columns '{input_key}' → 'input' and '{output_key}' → 'output'."

    return {
        "name": name,
        "description": description,
        "items": items,
        "meta": meta,
    }
