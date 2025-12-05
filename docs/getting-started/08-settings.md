# Settings - Configure Your Studio

Customize how the studio works for you.

## LLM Provider Settings

Choose which AI service generates your prompts.

### Provider Comparison

| Provider | Speed | Quality | Cost | Privacy | Setup |
|---|---|---|---|---|---|
| **Gemini** | Fast | Excellent | Medium | Cloud | API key |
| **Ollama** | Medium | Good | Free | Local | Download + Run |
| **OpenAI** | Fast | Excellent | Higher | Cloud | API key |

### Gemini (Google)

**Pros:**
- Very fast
- High quality responses
- Reliable

**Cons:**
- Requires API key
- Cloud-based (data leaves your computer)
- Pay-per-use

**Setup:**
1. Get API key from [Google AI Studio](https://makersuite.google.com/)
2. Paste in settings
3. Ready to go

### Ollama (Local)

**Pros:**
- Free
- Private (runs on your computer)
- No internet needed
- No API costs

**Cons:**
- Slower than cloud
- Needs local setup
- Quality depends on model

**Setup:**
1. Download Ollama from [ollama.ai](https://ollama.ai)
2. Install and run `ollama serve`
3. In Studio settings, click connect
4. Choose a model (llama3:8b recommended)

### OpenAI

**Status:** Coming soon

## Model Selection

Once you pick a provider, choose a model:

**Gemini options:**
- `gemini-2.5-flash` (recommended) - Fast and capable
- `gemini-pro` - More powerful, slower

**Ollama options:**
- `llama3:8b` (recommended) - Balanced
- `gemma3:12b` - More powerful
- `mistral` - Fast and efficient
- `neural-chat` - Great for creative

**OpenAI (coming soon):**
- `gpt-4o` - Most powerful
- `gpt-4o-mini` - Fast and cheap

### How to Choose?

**For speed:** Gemini or fast Ollama models
**For quality:** Gemini or larger Ollama models
**For privacy:** Ollama (local)
**For budget:** Ollama (free) or OpenAI mini
**For balanced:** Gemini or `llama3:8b`

## API Keys

If using Gemini or OpenAI:

### Secure Storage

 **Safe:**
- Keys stored in local browser storage
- Never sent to Prompt Engineering Studio servers
- Only used to communicate directly with provider

 **Not safe:**
- Sharing your key with anyone
- Putting key in public code
- Using someone else's key

### How to Add

1. Go to Settings
2. Click "API Keys"
3. Select provider (Gemini, OpenAI, Anthropic)
4. Paste your API key
5. Click Save
6. It's ready to use

### How to Get Keys

**Gemini:**
1. Go to [makersuite.google.com](https://makersuite.google.com/)
2. Click "Get API Key"
3. Copy the key
4. Paste in Studio

**OpenAI:**
1. Go to [platform.openai.com](https://platform.openai.com/)
2. Create account (or login)
3. Go to API keys
4. Create new key
5. Copy and paste in Studio

### Best Practices

 Do:
- Use separate keys for different projects
- Regularly check key usage
- Rotate keys periodically
- Store backups safely

 Don't:
- Share keys with teammates (each person gets their own)
- Put keys in public repos
- Use production keys for testing
- Leave keys in screenshots/emails

## Rate Limiting

Rate limits prevent accidental massive API spending.

### What Is It?

A limit on how fast you can generate prompts:
- **50 requests per minute** - Can't run more than 50 generations in 60 seconds
- **100k tokens per minute** - Total tokens generated capped at 100k/min

### When It Matters

-  **Green:** Using normally, no issues
-  **Yellow:** Getting close to limit
-  **Red:** Hit the limit, wait to generate more

### What Happens If You Hit It?

You'll see: **"Rate limit reached. Wait 30 seconds and try again."**

### Adjusting Limits

For personal use: Defaults are fine

For heavy use:
- Contact admin to increase limits
- Or set up your own infrastructure

## General Settings

### Theme

- **Dark** - Easy on the eyes, modern
- **Light** - Bright and clean (if you prefer)

### Auto-Save

- **On:** Automatically save prompts to history
- **Off:** Only save when you click save

Recommendation: **On** (nice to have history)

### Notifications

- **On:** Get alerts for completed generations
- **Off:** Silent mode

Recommendation: **On** (helpful for long generations)

## Storage & Data

### Where Are My Prompts Stored?

-  **History:** Saved on your computer (browser storage)
-  **Library:** Saved on your computer
-  **Datasets:** Saved on your computer
-  **Evaluation results:** Saved on your computer

**Nothing is sent to external servers** (except to your chosen LLM provider)

### How Much Storage?

- Typically 5-50MB for normal use
- Can be cleared in browser settings if needed
- Backup your Library by exporting before clearing

### Exporting Data

Go to Settings → Data Export

You can export:
- All prompts from library
- History of generations
- Datasets
- Evaluation results

## Keyboard Shortcuts

### Generation
- **Cmd/Ctrl + Enter** - Generate with selected techniques

### Navigation
- **Cmd/Ctrl + 1** - Go to Generator
- **Cmd/Ctrl + 2** - Go to Evaluation
- **Cmd/Ctrl + 3** - Go to Library

### Editing
- **Cmd/Ctrl + C** - Copy (standard)
- **Cmd/Ctrl + V** - Paste (standard)
- **Escape** - Close dialogs

## Troubleshooting Settings

### Gemini Not Working?

1.  Is your API key correct?
   - Get a new key from Google AI Studio
   
2.  Is your key expired?
   - Keys don't expire, but regenerate if unsure
   
3.  Rate limit?
   - Wait a minute and try again

### Ollama Not Connecting?

1.  Is Ollama running?
   - `ollama serve` in terminal
   
2.  Is model downloaded?
   - `ollama pull llama3:8b`
   
3.  Right URL?
   - Should be `http://localhost:11434`
   - Check in settings

### Slow Generation?

1.  Check your internet (if cloud provider)
2.  Try a smaller/faster model
3.  Select fewer techniques
4.  Use local Ollama instead

### History Not Saving?

1.  Is auto-save enabled?
2.  Check browser storage isn't full
3.  Try refreshing the page
4.  Check browser privacy settings

## Privacy Settings

### Data Collection

-  **Disabled by default**
- We don't track your prompts
- We don't share data with anyone
- All processing is local or through your chosen provider

### Connection Info

When you generate:
1. Your prompt goes directly to your chosen provider (Gemini/Ollama/OpenAI)
2. They process it
3. Result comes back to you
4. Nothing is stored on our servers

## Tips

 **Save your API keys securely** - Store backup somewhere safe

 **Check rate limits before bulk operations** - Don't run 100 generations at once

 **Use local Ollama for privacy** - If concerned about data

 **Export your library regularly** - Backup your best prompts

 **Try different providers** - Each has pros/cons

 **Monitor token usage** - Especially if paying per token

---

**Everything configured?** Ready to [create your first prompt!](./02-first-prompt.md)
