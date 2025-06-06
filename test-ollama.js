// Simple test script to check if Ollama is running and accessible
async function testOllama() {
  try {
    console.log('Testing Ollama connection...');
    
    // Test connection
    const response = await fetch('http://localhost:11434/api/tags');
    if (!response.ok) {
      throw new Error(`Server responded with status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('✅ Ollama is running!');
    console.log('Available models:', data.models?.map(m => m.name) || []);
    
    // Test generation with a simple prompt
    if (data.models && data.models.length > 0) {
      const testModel = data.models[0].name;
      console.log(`\nTesting generation with model: ${testModel}`);
      
      const genResponse = await fetch('http://localhost:11434/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: testModel,
          prompt: 'Hello, how are you?',
          stream: false
        })
      });
      
      if (genResponse.ok) {
        const genData = await genResponse.json();
        console.log('✅ Generation test successful!');
        console.log('Response:', genData.response?.substring(0, 100) + '...');
      } else {
        console.log('❌ Generation test failed:', genResponse.status);
      }
    }
    
  } catch (error) {
    console.log('❌ Ollama connection failed:', error.message);
    console.log('\nTo fix this:');
    console.log('1. Install Ollama: https://ollama.ai/');
    console.log('2. Start Ollama: ollama serve');
    console.log('3. Pull a model: ollama pull llama3.2');
  }
}

testOllama();
