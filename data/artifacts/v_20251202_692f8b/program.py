import dspy

class ReasoningSignature(dspy.Signature):
    """reasoning task in general domain."""
    
    


class ReasoningProgram(dspy.Module):
    def __init__(self):
        super().__init__()
        self.predictor = dspy.Predict(ReasoningSignature)
    
    def forward(self, ):
        return self.predictor()

# Optimized with BootstrapFewShot
# Metric: 0.851
# Target LM: gpt-5
