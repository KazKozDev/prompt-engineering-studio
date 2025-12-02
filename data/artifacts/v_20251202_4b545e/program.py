import dspy

class ClassificationSignature(dspy.Signature):
    """classification task in support domain."""
    ticket_text: str = dspy.InputField(desc="ticket_text for the task")
    category: str = dspy.OutputField(desc="category from the model")


class ClassificationProgram(dspy.Module):
    def __init__(self):
        super().__init__()
        self.predictor = dspy.Predict(ClassificationSignature)
    
    def forward(self, ticket_text):
        return self.predictor(ticket_text=ticket_text)

# Optimized with BootstrapFewShot
# Metric: 0.852
# Target LM: gemma3:4b
