import dspy

class ClassificationSignature(dspy.Signature):
    """classification task in general domain."""
    review_text: str = dspy.InputField(desc="review_text for the task")
    label: str = dspy.OutputField(desc="label from the model")
    confidence: str = dspy.OutputField(desc="confidence from the model")


class ClassificationProgram(dspy.Module):
    def __init__(self):
        super().__init__()
        self.predictor = dspy.Predict(ClassificationSignature)
    
    def forward(self, review_text):
        return self.predictor(review_text=review_text)

# Optimized with BootstrapFewShot
# Metric: 0.500
# Target LM: gpt-5
# Real DSPy: True
