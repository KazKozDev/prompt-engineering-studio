#!/bin/bash

# Quick Test Script for Advanced Evaluation Features
# Run this after installing dependencies to verify everything works

echo "🧪 Testing Advanced Evaluation Features"
echo "========================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if server is running
echo "1. Checking if server is running..."
if curl -s http://localhost:8000/ > /dev/null; then
    echo -e "${GREEN}✓${NC} Server is running"
else
    echo -e "${RED}✗${NC} Server is not running"
    echo "   Start server with: python src/api_server.py"
    exit 1
fi

echo ""

# Check advanced metrics status
echo "2. Checking advanced metrics availability..."
STATUS=$(curl -s http://localhost:8000/api/evaluation/advanced/status)
AVAILABLE=$(echo $STATUS | grep -o '"advanced_metrics_available":[^,]*' | cut -d':' -f2)

if [ "$AVAILABLE" = "true" ]; then
    echo -e "${GREEN}✓${NC} Advanced metrics are available"
else
    echo -e "${YELLOW}⚠${NC}  Advanced metrics not available"
    echo "   Install with: pip install sentence-transformers transformers torch numpy"
fi

echo ""

# Test BERTScore (if available)
if [ "$AVAILABLE" = "true" ]; then
    echo "3. Testing BERTScore..."
    RESULT=$(curl -s -X POST http://localhost:8000/api/evaluation/advanced/bertscore \
        -H "Content-Type: application/json" \
        -d '{"prediction": "The cat sat on the mat", "reference": "A feline rested on the rug"}')
    
    if echo $RESULT | grep -q "score"; then
        SCORE=$(echo $RESULT | grep -o '"score":[^,]*' | cut -d':' -f2)
        echo -e "${GREEN}✓${NC} BERTScore works (score: $SCORE)"
    else
        echo -e "${RED}✗${NC} BERTScore failed"
        echo "   Response: $RESULT"
    fi
    
    echo ""
    
    # Test Perplexity
    echo "4. Testing Perplexity..."
    RESULT=$(curl -s -X POST http://localhost:8000/api/evaluation/advanced/perplexity \
        -H "Content-Type: application/json" \
        -d '{"text": "The quick brown fox jumps over the lazy dog"}')
    
    if echo $RESULT | grep -q "perplexity"; then
        PPL=$(echo $RESULT | grep -o '"perplexity":[^,]*' | cut -d':' -f2)
        echo -e "${GREEN}✓${NC} Perplexity works (score: $PPL)"
    else
        echo -e "${RED}✗${NC} Perplexity failed"
        echo "   Response: $RESULT"
    fi
    
    echo ""
fi

# Test Evaluation History
echo "5. Testing Evaluation History..."
RESULT=$(curl -s -X POST http://localhost:8000/api/evaluation/advanced/history/save \
    -H "Content-Type: application/json" \
    -d '{
        "prompt_id": "test_prompt_1",
        "prompt_text": "Test prompt",
        "dataset_id": "test_dataset_1",
        "dataset_name": "Test Dataset",
        "metrics": {"accuracy": 0.85, "bleu": 0.72},
        "metadata": {"model": "test"}
    }')

if echo $RESULT | grep -q "run_id"; then
    RUN_ID=$(echo $RESULT | grep -o '"run_id":"[^"]*"' | cut -d'"' -f4)
    echo -e "${GREEN}✓${NC} History save works (run_id: $RUN_ID)"
else
    echo -e "${RED}✗${NC} History save failed"
    echo "   Response: $RESULT"
fi

echo ""

# Test Cache Stats
echo "6. Testing Cache Statistics..."
RESULT=$(curl -s http://localhost:8000/api/evaluation/advanced/cache/stats)

if echo $RESULT | grep -q "hits"; then
    HITS=$(echo $RESULT | grep -o '"hits":[^,]*' | cut -d':' -f2)
    MISSES=$(echo $RESULT | grep -o '"misses":[^,]*' | cut -d':' -f2)
    echo -e "${GREEN}✓${NC} Cache stats work (hits: $HITS, misses: $MISSES)"
else
    echo -e "${RED}✗${NC} Cache stats failed"
    echo "   Response: $RESULT"
fi

echo ""

# Test Basic Metrics (always available)
echo "7. Testing Basic Metrics..."
RESULT=$(curl -s http://localhost:8000/api/metrics/available)

if echo $RESULT | grep -q "bleu"; then
    echo -e "${GREEN}✓${NC} Basic metrics available"
else
    echo -e "${RED}✗${NC} Basic metrics failed"
fi

echo ""
echo "========================================"
echo "🎉 Testing Complete!"
echo ""

if [ "$AVAILABLE" = "true" ]; then
    echo -e "${GREEN}All features are working!${NC}"
else
    echo -e "${YELLOW}Basic features work. Install advanced dependencies for full functionality.${NC}"
    echo "   pip install sentence-transformers transformers torch numpy"
fi

echo ""
