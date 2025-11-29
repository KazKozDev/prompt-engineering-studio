import json
import os
from typing import List, Dict, Any, Optional
from datetime import datetime
import uuid


class DatasetManager:
    """Manages dataset storage and retrieval."""
    
    def __init__(self, data_dir: str = "data/datasets"):
        self.data_dir = data_dir
        self.examples_dir = os.path.join(data_dir, "examples")
        os.makedirs(self.data_dir, exist_ok=True)
        os.makedirs(self.examples_dir, exist_ok=True)
    
    def validate_dataset(self, data: List[Dict[str, str]]) -> bool:
        """Validate dataset format."""
        if not isinstance(data, list) or len(data) == 0:
            return False
        
        for item in data:
            if not isinstance(item, dict):
                return False
            if 'input' not in item or 'output' not in item:
                return False
            if not isinstance(item['input'], str) or not isinstance(item['output'], str):
                return False
        
        return True
    
    def create_dataset(
        self, 
        name: str, 
        data: List[Dict[str, str]], 
        description: str = "",
        category: str = "custom"
    ) -> Dict[str, Any]:
        """Create a new dataset."""
        if not self.validate_dataset(data):
            raise ValueError("Invalid dataset format. Each item must have 'input' and 'output' fields.")
        
        dataset_id = str(uuid.uuid4())
        timestamp = datetime.now().isoformat()
        
        dataset = {
            "id": dataset_id,
            "name": name,
            "description": description,
            "category": category,
            "data": data,
            "createdAt": timestamp,
            "updatedAt": timestamp,
            "size": len(data)
        }
        
        filepath = os.path.join(self.data_dir, f"{dataset_id}.json")
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(dataset, f, indent=2, ensure_ascii=False)
        
        return dataset
    
    def get_dataset(self, dataset_id: str) -> Optional[Dict[str, Any]]:
        """Get a specific dataset by ID."""
        filepath = os.path.join(self.data_dir, f"{dataset_id}.json")
        
        if not os.path.exists(filepath):
            return None
        
        with open(filepath, 'r', encoding='utf-8') as f:
            return json.load(f)
    
    def list_datasets(self) -> List[Dict[str, Any]]:
        """List all datasets (metadata only)."""
        datasets = []
        
        for filename in os.listdir(self.data_dir):
            if filename.endswith('.json') and not filename.startswith('.'):
                filepath = os.path.join(self.data_dir, filename)
                try:
                    with open(filepath, 'r', encoding='utf-8') as f:
                        dataset = json.load(f)
                        # Return metadata only (without full data)
                        datasets.append({
                            "id": dataset.get("id"),
                            "name": dataset.get("name"),
                            "description": dataset.get("description"),
                            "category": dataset.get("category", "custom"),
                            "size": dataset.get("size", len(dataset.get("data", []))),
                            "createdAt": dataset.get("createdAt"),
                            "updatedAt": dataset.get("updatedAt")
                        })
                except Exception as e:
                    print(f"Error loading dataset {filename}: {e}")
                    continue
        
        return sorted(datasets, key=lambda x: x.get("updatedAt", ""), reverse=True)
    
    def delete_dataset(self, dataset_id: str) -> bool:
        """Delete a dataset."""
        filepath = os.path.join(self.data_dir, f"{dataset_id}.json")
        
        if not os.path.exists(filepath):
            return False
        
        os.remove(filepath)
        return True
    
    def update_dataset(
        self, 
        dataset_id: str, 
        name: Optional[str] = None,
        data: Optional[List[Dict[str, str]]] = None,
        description: Optional[str] = None
    ) -> Optional[Dict[str, Any]]:
        """Update an existing dataset."""
        dataset = self.get_dataset(dataset_id)
        
        if not dataset:
            return None
        
        if name is not None:
            dataset["name"] = name
        
        if description is not None:
            dataset["description"] = description
        
        if data is not None:
            if not self.validate_dataset(data):
                raise ValueError("Invalid dataset format")
            dataset["data"] = data
            dataset["size"] = len(data)
        
        dataset["updatedAt"] = datetime.now().isoformat()
        
        filepath = os.path.join(self.data_dir, f"{dataset_id}.json")
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(dataset, f, indent=2, ensure_ascii=False)
        
        return dataset
    
    def get_example_datasets(self) -> List[Dict[str, Any]]:
        """Get all example datasets."""
        examples = []
        
        if not os.path.exists(self.examples_dir):
            return examples
        
        for filename in os.listdir(self.examples_dir):
            if filename.endswith('.json'):
                filepath = os.path.join(self.examples_dir, filename)
                try:
                    with open(filepath, 'r', encoding='utf-8') as f:
                        example = json.load(f)
                        examples.append(example)
                except Exception as e:
                    print(f"Error loading example {filename}: {e}")
                    continue
        
        return examples
