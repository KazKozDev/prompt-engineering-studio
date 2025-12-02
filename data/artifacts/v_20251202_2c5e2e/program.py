import dspy

class TestSignature(dspy.Signature):
    """test task in general domain."""
    
    


class TestProgram(dspy.Module):
    def __init__(self):
        super().__init__()
        self.predictor = dspy.Predict(TestSignature)
    
    def forward(self, ):
        return self.predictor()

# Optimized with BootstrapFewShot
# Metric: 0.851
# Target LM: gpt-4o
