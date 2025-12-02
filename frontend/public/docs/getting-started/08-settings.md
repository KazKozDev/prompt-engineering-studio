# Settings: Configure LLM Providers and Workspace

**Settings** is your control center for configuring LLM providers, API keys, workspace preferences, and application behavior. Proper configuration ensures optimal performance and security.

## Quick Start

### 1. Access Settings

**Location:** Top right → Settings icon (gear)

**Settings sections:**
- **LLM Providers** — Configure AI models
- **API Keys** — Manage authentication
- **Workspace** — Preferences and defaults
- **Notifications** — Alert settings
- **Security** — Access controls
- **Advanced** — Expert options

### 2. Configure LLM Provider

**Location:** Settings → LLM Providers tab

**Supported providers:**
- **Ollama** (Local)
- **Google Gemini**
- **OpenAI** (GPT-4, GPT-3.5)
- **Anthropic** (Claude)
- **Custom** (API-compatible)

**For each provider:**
1. **Enable/Disable** — Toggle provider
2. **API Key** — Enter authentication key (if required)
3. **Base URL** — API endpoint (default or custom)
4. **Default Model** — Model to use by default
5. **Parameters** — Temperature, max tokens, etc.

## LLM Provider Configuration

### Ollama (Local)

**Advantages:**
- ✓ Free and open-source
- ✓ Complete privacy (runs locally)
- ✓ No API costs
- ✓ Offline capable

**Requirements:**
- Ollama installed on your machine
- Sufficient RAM (8GB+ recommended)
- Downloaded models

**Configuration:**

1. **Install Ollama:**
```bash
# macOS/Linux
curl -fsSL https://ollama.ai/install.sh | sh

# Windows
# Download from https://ollama.ai/download
```

2. **Start Ollama server:**
```bash
ollama serve
```

3. **Pull a model:**
```bash
# Recommended models
ollama pull llama3.2          # Fast, general-purpose
ollama pull gemma2:12b        # Balanced performance
ollama pull mistral           # Good for coding
ollama pull phi3              # Lightweight
```

4. **Configure in Settings:**
- **Provider:** Ollama
- **Base URL:** `http://localhost:11434` (default)
- **Model:** `llama3.2` (or your preferred model)
- **Temperature:** 0.7 (default)
- **Max Tokens:** 2048 (default)

**Troubleshooting:**
- **"Connection refused"** → Ensure `ollama serve` is running
- **"Model not found"** → Pull the model first with `ollama pull`
- **Slow responses** → Use smaller models or increase RAM

### Google Gemini

**Advantages:**
- ✓ State-of-the-art performance
- ✓ Fast responses
- ✓ Multimodal (text + images)
- ✓ Generous free tier

**Requirements:**
- Google AI Studio API key
- Internet connection

**Configuration:**

1. **Get API key:**
   - Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Click "Create API Key"
   - Copy the key

2. **Configure in Settings:**
   - **Provider:** Google Gemini
   - **API Key:** Paste your key
   - **Model:** your preferred Gemini model
   - **Temperature:** 0.7
   - **Max Tokens:** 8192

**Available models:** See the official Gemini documentation for the most up-to-date model list and capabilities.

**Pricing (as of 2024):**
- Free tier: 15 requests/minute, 1M tokens/day
- Paid: $0.00025/1K input tokens, $0.0005/1K output tokens

### OpenAI (GPT-4)

**Advantages:**
- ✓ Industry-leading quality
- ✓ Extensive capabilities
- ✓ Well-documented
- ✓ Reliable infrastructure

**Requirements:**
- OpenAI API key
- Payment method (no free tier)

**Configuration:**

1. **Get API key:**
   - Go to [OpenAI Platform](https://platform.openai.com/api-keys)
   - Click "Create new secret key"
   - Copy the key (shown only once!)

2. **Configure in Settings:**
   - **Provider:** OpenAI
   - **API Key:** Paste your key
   - **Model:** your preferred GPT-4 or newer model
   - **Temperature:** 0.7
   - **Max Tokens:** 4096

**Pricing:**
- GPT-4o: $0.0025/1K input, $0.01/1K output
- GPT-4o-mini: $0.00015/1K input, $0.0006/1K output

### Anthropic (Claude)

**Advantages:**
- ✓ Excellent reasoning
- ✓ Long context (200K tokens)
- ✓ Strong safety features
- ✓ Helpful and harmless

**Requirements:**
- Anthropic API key
- Payment method

**Configuration:**

1. **Get API key:**
   - Go to [Anthropic Console](https://console.anthropic.com/)
   - Navigate to API Keys
   - Create new key

2. **Configure in Settings:**
   - **Provider:** Anthropic
   - **API Key:** Paste your key
   - **Model:** your preferred Claude model
   - **Temperature:** 0.7
   - **Max Tokens:** 4096

**Available models:** See the Anthropic documentation for current Claude models and pricing.

**Pricing:**
- Sonnet: $0.003/1K input, $0.015/1K output
- Opus: $0.015/1K input, $0.075/1K output
- Haiku: $0.00025/1K input, $0.00125/1K output

### Custom Provider

**For API-compatible services:**

**Configuration:**
- **Provider:** Custom
- **Base URL:** Your API endpoint
- **API Key:** Your authentication key
- **Model:** Model identifier
- **Headers:** Custom headers (JSON)

**Example (Azure OpenAI):**
```
Base URL: https://your-resource.openai.azure.com/
API Key: your-azure-key
Model: gpt-4
Headers: {"api-version": "2024-02-01"}
```

## Workspace Settings

### General Preferences

**Location:** Settings → Workspace tab

**Options:**

**Theme:**
- Dark (default)
- Light
- Auto (system preference)

**Language:**
- English (default)
- Spanish
- French
- German
- Chinese
- Japanese

**Timezone:**
- Auto-detect
- Manual selection

**Date Format:**
- MM/DD/YYYY (US)
- DD/MM/YYYY (EU)
- YYYY-MM-DD (ISO)

### Default Values

**Set defaults for new resources:**

**Prompts:**
- Default category: General
- Default status: Draft
- Default technique: Zero-Shot
- Auto-save: Enabled

**Datasets:**
- Default size: 50 test cases
- Auto-validate: Enabled
- Include metadata: Yes

**Evaluations:**
- Default metrics: Accuracy, Latency
- Default threshold: 80%
- Auto-export results: Enabled

### Auto-Save and Backup

**Auto-save:**
- Enabled/Disabled
- Interval: 30s, 1min, 5min
- Save on navigation: Yes/No

**Backup:**
- Auto-backup: Daily, Weekly, Monthly
- Backup location: Local, Cloud
- Retention: 7 days, 30 days, Forever

**Export:**
- Auto-export: Enabled/Disabled
- Format: JSON, CSV, Markdown
- Schedule: Daily, Weekly

## Notification Settings

### Alert Preferences

**Location:** Settings → Notifications tab

**Notification types:**

**In-app:**
- Evaluation completed
- Deployment succeeded/failed
- Prompt modified
- Dataset updated
- Alert triggered

**Email:**
- Daily summary
- Weekly report
- Critical alerts only
- All notifications

**Webhooks:**
- Slack integration
- Microsoft Teams
- Discord
- Custom webhook URL

### Alert Thresholds

**Configure when to alert:**

**Performance:**
- Success rate < 90%
- Latency > 2000ms
- Error rate > 5%

**Cost:**
- Daily spend > $50
- Monthly projection > $1000
- Sudden spike > 2x baseline

**Usage:**
- Request volume > 10,000/hour
- Token usage > 1M/day

## Security Settings

### API Key Management

**Location:** Settings → Security tab

**Best practices:**

**Storage:**
- ✓ Keys encrypted at rest
- ✓ Never logged or displayed
- ✓ Separate keys per environment

**Rotation:**
- Rotate keys every 90 days
- Revoke compromised keys immediately
- Use different keys for dev/prod

**Access:**
- Limit key permissions
- Use read-only keys where possible
- Monitor key usage

### Access Controls

**User roles:**
- **Admin** — Full access
- **Editor** — Create and modify
- **Viewer** — Read-only
- **Auditor** — View history and metrics

**Resource permissions:**
- **Public** — Anyone can view
- **Team** — Team members only
- **Private** — Owner only

**IP Whitelisting:**
- Restrict access by IP address
- Useful for production environments

### Audit Logging

**Enable comprehensive logging:**
- All API calls
- All resource changes
- All authentication events
- All configuration changes

**Log retention:**
- 30 days (default)
- 90 days (compliance)
- 1 year (enterprise)

## Advanced Settings

### Performance Tuning

**Location:** Settings → Advanced tab

**Options:**

**Caching:**
- Enable response caching
- Cache TTL: 1 hour, 24 hours, 7 days
- Cache size: 100MB, 500MB, 1GB

**Rate Limiting:**
- Max requests per minute: 60 (default)
- Burst allowance: 10
- Backoff strategy: Exponential

**Concurrency:**
- Max concurrent requests: 5 (default)
- Queue size: 100
- Timeout: 30s, 60s, 120s

### Experimental Features

**Beta features (use with caution):**

- ✨ **Auto-optimization** — AI suggests prompt improvements
- ✨ **Smart routing** — Automatically select best model
- ✨ **Predictive scaling** — Pre-scale based on patterns
- ✨ **A/B testing** — Automated variant testing

**Enable/disable individually**

### Developer Options

**For advanced users:**

**API Access:**
- Enable REST API
- Generate API tokens
- View API documentation

**Webhooks:**
- Configure outgoing webhooks
- Test webhook delivery
- View webhook logs

**Custom Scripts:**
- Upload custom evaluation scripts
- Define custom metrics
- Automate workflows

## Workflow Examples

### Example 1: First-Time Setup

**Scenario:** Setting up Prompt Engineering Studio

```
1. Open Settings
2. Go to LLM Providers
3. Choose provider:
   - Local/Free: Ollama
   - Cloud/Best: Gemini or GPT-4
4. Configure provider:
   - Ollama: Ensure server running, select model
   - Cloud: Enter API key, select model
5. Test connection: Click "Test"
6. Go to Workspace
7. Set preferences:
   - Theme: Dark
   - Auto-save: Enabled
8. Go to Notifications
9. Enable email alerts for critical events
10. Save settings
11. Ready to use!
```

### Example 2: Multi-Provider Setup

**Scenario:** Use different providers for different tasks

```
1. Configure Ollama:
   - For: Development and testing
   - Model: llama3.2
   - Cost: Free

2. Configure Gemini:
   - For: Production (general tasks)
   - Model: gemini-2.0-flash-exp
   - Cost: Low

3. Configure GPT-4:
   - For: Critical tasks requiring highest quality
   - Model: gpt-4o
   - Cost: High

4. Set defaults:
   - Generator: Ollama (fast iteration)
   - Optimizer: Gemini (good balance)
   - Evaluation: GPT-4 (highest quality)

5. Monitor costs in Metrics
```

### Example 3: Security Hardening

**Scenario:** Preparing for production deployment

```
1. Go to Security settings
2. API Keys:
   - Rotate all keys
   - Use separate keys for prod
   - Enable key expiration (90 days)
3. Access Controls:
   - Set production prompts to "Private"
   - Limit admin access
   - Enable IP whitelisting
4. Audit Logging:
   - Enable comprehensive logging
   - Set retention to 1 year
   - Export logs weekly
5. Notifications:
   - Enable critical alerts
   - Set up PagerDuty integration
6. Test security:
   - Attempt unauthorized access
   - Verify alerts trigger
7. Document security procedures
```

## Best Practices

✓ **DO:**
- Test provider configuration before use
- Use separate API keys for dev/prod
- Enable auto-save
- Set up email notifications
- Rotate API keys regularly
- Monitor API usage and costs
- Export backups regularly

✗ **DON'T:**
- Share API keys publicly
- Use production keys in development
- Disable audit logging
- Ignore security alerts
- Use same key across multiple apps
- Forget to test provider changes
- Skip backup configuration

## Troubleshooting

**Problem:** "API key invalid"
- **Solution:** Verify key is correct, check provider dashboard, regenerate if needed

**Problem:** "Connection timeout"
- **Solution:** Check internet connection, verify base URL, increase timeout in Advanced settings

**Problem:** "Rate limit exceeded"
- **Solution:** Reduce request frequency, upgrade API plan, enable caching

**Problem:** "Settings not saving"
- **Solution:** Check browser permissions, clear cache, try incognito mode

## Next Steps

1. **Configure your first provider** → Choose Ollama or Gemini
2. **Test connection** → Generate a sample prompt
3. **Set up notifications** → Get alerted to important events
4. **Explore advanced features** → Enable experimental options
5. **Start creating** → Go to CREATE: Generator
