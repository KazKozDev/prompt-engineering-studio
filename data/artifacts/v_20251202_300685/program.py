import dspy

class ClassificationSignature(dspy.Signature):
    """classification task in general domain."""
    customer_reviews: str = dspy.InputField(desc="customer_reviews for the task")
    sentiment_category: str = dspy.OutputField(desc="sentiment_category from the model")
    emotional_tone: str = dspy.OutputField(desc="emotional_tone from the model")


class ClassificationProgram(dspy.Module):
    def __init__(self):
        super().__init__()
        self.predictor = dspy.Predict(ClassificationSignature)
    
    def forward(self, customer_reviews):
        return self.predictor(customer_reviews=customer_reviews)

# Optimized with BootstrapFewShot
# Metric: 0.852
# Target LM: granite4:small-h
