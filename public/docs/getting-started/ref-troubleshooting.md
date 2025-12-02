# Troubleshooting Guide

Common issues and how to fix them.

## Connection & Provider Issues

### "Cannot connect to Ollama"

**Error message:** *"Failed to connect to Ollama. Make sure it's running."*

**Fix:**
1. Open terminal/command prompt
2. Run: `ollama serve`
3. Wait for it to start
4. Try generation again

**Still not working?**
- Check Ollama is installed: `ollama --version`
- Try: `ollama pull llama3:8b` (download a model)
- Restart Ollama completely

### "Gemini API key invalid"

**Error message:** *"Invalid API key for Gemini"*

**Fix:**
1. Go to [Google AI Studio](https://makersuite.google.com/)
2. Get a new API key
3. Copy the **entire key** (no extra spaces)
4. Paste in Settings → API Keys
5. Try again

**Still broken?**
- Keys don't expire, but regenerate one if unsure
- Make sure you're logged into right Google account
- Clear browser cache: Settings → Privacy → Clear data

### "OpenAI: API key not recognized"

**Status:** OpenAI integration coming soon

For now, use Gemini or Ollama.

### "Rate limit exceeded"

**Error message:** *"Rate limit reached. Wait before generating again."*

**Why:** You've hit the speed limit (50 requests/minute)

**Fix:**
- Wait 30-60 seconds
- Try again

**Avoid in future:**
- Don't generate 100 prompts at once
- Space out requests
- Select fewer techniques per generation

## Generation Issues

### "Generation stuck or very slow"

**Takes longer than expected (5+ minutes)?**

**Try:**
1. **Check internet** - Gemini needs good connection
2. **Refresh page** - Sometimes helps
3. **Try fewer techniques** - Select 3 instead of 20
4. **Switch provider** - Try Ollama (local) instead of Gemini
5. **Try simpler model** - Use faster LLM option

**Still stuck?**
- Hard refresh: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)
- Wait 2 minutes then try again
- Restart browser

### "Getting error during generation"

**Error:** *"Error generating prompt: [something went wrong]"*

**Steps:**
1. Check your internet connection
2. Check API key is correct (if using cloud)
3. Make sure model exists:
   - For Gemini: `gemini-2.5-flash`
   - For Ollama: `ollama list` to see installed models
4. Try with fewer techniques
5. Try with shorter prompt

### "No results showing after generation"

**Clicked generate, nothing appears?**

**Try:**
1. Wait another 10 seconds (might still loading)
2. Check network tab in browser (F12 → Network)
3. Try different AI provider
4. Refresh page and try again
5. Check if pop-ups are blocked

## Data & Storage Issues

### "My prompts disappeared"

**Lost your prompts?**

**Why might happen:**
- Browser cleared data (cache)
- Different browser (data stored locally per browser)
- Cookies were deleted
- Browser storage full

**Can you recover?**
-  If cleared, probably not recoverable
-  But always export Library as backup

**Prevent in future:**
- Export library monthly: Settings → Export
- Use multiple browsers less frequently

### "Browser running out of storage"

**Error:** *"Out of storage space"*

**Fix:**
1. Export your Library (backup first!)
2. Go to browser settings
3. Clear cookies/cache (you'll lose some data)
4. Start fresh

**Better option:** Keep exporting library regularly

### "History is too long/messy"

**Want to clear history?**

Go to History tab → Click "Clear History"

 **This is permanent** - Export first if you want to keep it

### "Can't find my saved prompt"

**Lost a prompt you saved?**

**Try:**
1. Search in Library (use keywords)
2. Check different categories
3. Use tags to filter
4. Scroll through all prompts
5. Export and search in file

**Not there?**
- Might not have saved it
- Might be in History instead
- Check if you need to refresh page

## Evaluation Issues

### "Evaluation results look wrong"

**Don't trust the scores?**

**Try:**
1. Re-run evaluation again - LLMs vary slightly
2. Check your dataset (is it good?)
3. Try with simpler dataset first
4. Check if you selected right prompts

**To verify:**
- Run same evaluation 2-3 times
- Results should be similar (within 5 points)
- If wildly different, dataset might be unclear

### "Evaluation taking too long"

**Still running after 10 minutes?**

**This is normal for:**
- 20+ test cases
- 5+ prompts
- Complex evaluation

**To speed up:**
- Start with smaller dataset (5 cases)
- Test fewer prompts (2-3 instead of 5)
- Use faster model/provider

**Still too slow?**
- Refresh and try simpler evaluation
- Evaluation will run in background

### "Can't create dataset"

**Add button not working?**

**Try:**
1. Refresh page
2. Try different browser
3. Check if JavaScript enabled: Settings → Security
4. Clear cache: Cmd/Ctrl+Shift+Delete

### "Comparison isn't showing"

**Want to compare prompts?**

**Make sure:**
1. You have 2+ prompts selected
2. You have a dataset chosen
3. You clicked "Run Evaluation"
4. Wait for it to complete
5. Scroll down to see results

## UI & Display Issues

### "Interface looks broken/garbled"

**Text overlapping, buttons wrong size?**

**Try:**
1. Refresh: F5 or Cmd+R
2. Zoom reset: Cmd+0 (Mac) or Ctrl+0 (Windows)
3. Hard refresh: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)
4. Try different browser
5. Clear cache

### "Copy button isn't working"

**Can't copy prompt text?**

**Try:**
1. Double-check permission dialog (allow clipboard)
2. Try right-click → Copy
3. Try Triple-click to select all, then Cmd+C
4. Try different browser
5. Check if Clipboard access is blocked in settings

### "Keyboard shortcuts not working"

**Cmd/Ctrl+Enter not generating?**

**Try:**
1. Make sure you selected techniques (must have at least one)
2. Try full mouse click instead
3. Check Caps Lock isn't on
4. Refresh page
5. Try different keyboard layout

## Settings Issues

### "API key won't save"

**Can't save API key?**

**Try:**
1. Clear the field completely, re-paste
2. Make sure there's no extra space
3. Check if key is actually from right provider
4. Hard refresh: Cmd+Shift+R
5. Try different browser

### "Settings keep resetting"

**Changes don't stick?**

**Try:**
1. Make sure you clicked "Save"
2. Hard refresh after saving
3. Check browser doesn't auto-clear data on exit
4. Try different browser
5. Clear cookies for this site

### "Can't change theme/notifications"

**Settings not applying?**

**Try:**
1. Refresh page
2. Toggle it on, then off
3. Hard refresh: Cmd+Shift+R
4. Clear cache completely
5. Try different browser

## Nothing Works - Factory Reset

**Last resort if everything broken:**

1. **Backup:**
   - Export Library (copy prompts somewhere)
   - Export History
   - Export any Datasets

2. **Clear everything:**
   - Browser Settings → Privacy → Clear all data
   - Or go to Application → Local Storage → Delete all

3. **Refresh:**
   - F5 or Cmd+R
   - Page will be fresh

4. **Reconfigure:**
   - Go to Settings
   - Add API keys again
   - Pick provider
   - You're back to fresh start

5. **Restore:**
   - Import your backed-up Library
   - Datasets
   - Ready to go

## Getting Help

**Still stuck?**

### Check These First:
1. Is browser updated? (Old browsers have issues)
2. Is JavaScript enabled? (Settings → Security)
3. Do you have internet connection?
4. Is your provider running? (Ollama → `ollama serve`)
5. Is API key correct? (No extra spaces)

### Contact Support:
- Email: KazKozDev@gmail.com
- Include:
  - What you tried to do
  - What error you got
  - Which browser/OS you're using
  - Any error messages (screenshot helps)

### Check Resources:
- [Overview Guide](./01-overview.md)
- [Generator Help](./01-generator.md)
- [Settings Help](./08-settings.md)

---

**Pro tip:** Most issues are just needing to refresh or wait 30 seconds! 
