import dspy

class ClassificationSignature(dspy.Signature):
    """classification task in support domain."""
    review_text: str = dspy.InputField(desc="review_text for the task")
    category_label: str = dspy.OutputField(desc="category_label from the model")


class ClassificationProgram(dspy.Module):
    def __init__(self):
        super().__init__()
        self.predictor = dspy.Predict(ClassificationSignature)
    
    def forward(self, reviews):
        return self.predictor(reviews=reviews)

# Optimized with BootstrapFewShot
# Metric: 0.852
# Target LM: gemma3:4b
