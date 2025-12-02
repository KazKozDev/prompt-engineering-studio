import dspy

class ClassificationSignature(dspy.Signature):
    """classification task in general domain."""
    customer_review: str = dspy.InputField(desc="customer_review for the task")
    review_category: str = dspy.OutputField(desc="review_category from the model")


class ClassificationProgram(dspy.Module):
    def __init__(self):
        super().__init__()
        self.predictor = dspy.Predict(ClassificationSignature)
    
    def forward(self, customer_review):
        return self.predictor(customer_review=customer_review)

# Optimized with BootstrapFewShot
# Metric: 0.851
# Target LM: gpt-4o
