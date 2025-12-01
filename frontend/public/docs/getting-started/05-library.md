# Library: Save, Version, and Organize Prompts

## Overview

The **Prompt Library** is your central repository for managing, versioning, and organizing all your prompts. It provides version control, categorization, search, and deployment tracking to ensure you never lose a good prompt and can always roll back if needed.

## Quick Start

### 1. View Your Library

**Location:** Main panel → Prompt Library

**Interface sections:**
- **Search bar** — Find prompts by name, content, or tags
- **Filters** — Category, status, technique, date range
- **Prompt cards** — Visual grid of saved prompts
- **List view** — Detailed table view

**Each prompt card shows:**
- Name and description
- Technique used
- Status badge (Draft, Testing, Production, Archived)
- Last modified date
- Version number
- Quick actions (Edit, Duplicate, Evaluate, Deploy)

### 2. Add Prompts to Library

**Three ways to add:**

#### Option A: From Generator
1. Generate prompts in Generator section
2. Click "Save" on a result
3. Prompt auto-saved with metadata

#### Option B: From Optimizer
1. Optimize a prompt
2. Click "Save to Library" on optimized version
3. Linked to original as new version

#### Option C: Manual Entry
1. Click **"New Prompt"** in Library
2. Fill in details:
   - **Name:** Descriptive identifier
   - **Prompt text:** The actual prompt
   - **Category:** Task type
   - **Technique:** Prompting method used
   - **Description:** Purpose and use case
   - **Tags:** Keywords for search
3. Click **"Save"**

### 3. Organize Prompts

**Categories:**
- General
- Reasoning
- Coding
- Summarization
- Creative Writing
- Data Extraction
- Customer Support
- Translation
- Custom categories

**Status workflow:**
1. **Draft** — Initial creation, not tested
2. **Testing** — Under evaluation
3. **Production** — Deployed and active
4. **Archived** — Deprecated or replaced

**Tags:**
- Add multiple tags per prompt
- Use for cross-category organization
- Examples: `high-priority`, `customer-facing`, `v2`, `experimental`

### 4. Search and Filter

**Search bar:**
- Search by name, description, or prompt content
- Real-time filtering as you type
- Supports partial matches

**Filters:**
- **Category:** Show only specific task types
- **Status:** Draft, Testing, Production, Archived
- **Technique:** CoT, Few-Shot, ReAct, etc.
- **Date range:** Last 7 days, 30 days, custom
- **Tags:** Filter by one or more tags

**Combine filters:**
```
Category: Coding
Status: Production
Technique: Chain-of-Thought
Tags: high-priority
→ Shows only production CoT coding prompts tagged high-priority
```

## Version Control

### Understanding Versions

Every prompt edit creates a new version:
- **v1.0** — Initial creation
- **v1.1** — Minor edit (typo fix, small change)
- **v2.0** — Major revision (structure change, new technique)

**Version metadata:**
- Timestamp
- Author (if multi-user)
- Change description
- Parent version (if derived from another prompt)

### Viewing Version History

**Access:** Prompt card → "Version History" button

**History view shows:**
- All versions in reverse chronological order
- Diff view (what changed between versions)
- Metadata for each version
- Evaluation results per version (if tested)

**Actions per version:**
- **View** — See full prompt text
- **Compare** — Side-by-side diff with another version
- **Restore** — Make this version current
- **Delete** — Remove version (with confirmation)

### Comparing Versions

**Side-by-side comparison:**

| Aspect | v1.0 | v2.0 |
|--------|------|------|
| **Prompt text** | [Original] | [Modified] |
| **Token count** | 150 | 180 |
| **Accuracy** | 85% | 92% |
| **Status** | Archived | Production |

**Diff view:**
- Green highlighting: Added text
- Red highlighting: Removed text
- Yellow highlighting: Modified text

### Branching and Merging

**Create branch:**
1. Select a prompt
2. Click "Create Variant"
3. Name the variant (e.g., "v2-experimental")
4. Edit independently
5. Both versions coexist

**Merge branches:**
1. Select two related prompts
2. Click "Merge"
3. Choose merge strategy:
   - **Keep both** — Save as separate prompts
   - **Combine** — Manually merge best parts
   - **Replace** — One overwrites the other
4. Save merged result

## Advanced Features

### Prompt Templates

**What are templates:**
- Reusable prompt structures with placeholders
- Fill in variables for specific use cases
- Ensure consistency across similar tasks

**Example template:**
```
You are a {role} expert. Analyze the following {input_type}:

{input_placeholder}

Provide:
1. {output_requirement_1}
2. {output_requirement_2}
3. {output_requirement_3}

Format: {output_format}
```

**Using templates:**
1. Create template with `{placeholders}`
2. Save as template (special status)
3. When using, fill in placeholders
4. Save filled version as new prompt

### Prompt Collections

**Group related prompts:**
- **Collection:** Set of prompts for a project/feature
- **Example:** "Customer Support Bot v2" collection
  - Greeting prompt
  - FAQ prompt
  - Escalation prompt
  - Closing prompt

**Benefits:**
- Deploy/update all prompts together
- Version control at collection level
- Share collections with team

**Creating collections:**
1. Click "New Collection"
2. Name and describe collection
3. Add prompts (drag and drop or select)
4. Save collection

### Deployment Tracking

**Track where prompts are used:**
- **Environments:** Dev, Staging, Production
- **Applications:** Which apps use this prompt
- **API endpoints:** Integration points
- **Usage stats:** Request count, success rate

**Deployment workflow:**
1. Prompt reaches "Production" status
2. Click "Deploy"
3. Select environment
4. Confirm deployment
5. Library tracks deployment metadata

**Rollback:**
1. Go to deployed prompt
2. Click "Rollback"
3. Select previous version
4. Confirm rollback
5. Previous version becomes active

### Export and Import

**Export prompts:**
- **Single prompt:** JSON file with all metadata
- **Multiple prompts:** Bulk export as JSON array
- **Collection:** Export entire collection
- **Formats:** JSON, CSV, Markdown

**Import prompts:**
- **From file:** Upload JSON/CSV
- **From URL:** Import from GitHub, etc.
- **From clipboard:** Paste JSON directly

**Use cases:**
- Backup prompts
- Share with team
- Migrate between environments
- Version control with Git

## Workflow Examples

### Example 1: Iterative Development

**Scenario:** Improving a customer support prompt

```
Day 1:
1. Create initial prompt (v1.0) - Status: Draft
2. Test in Evaluation Lab
3. Results: 75% accuracy - needs work

Day 2:
4. Optimize in Optimizer
5. Save as v2.0 - Status: Testing
6. Re-evaluate
7. Results: 88% accuracy - better!

Day 3:
8. Manual refinement based on edge cases
9. Save as v2.1 - Status: Testing
10. Final evaluation
11. Results: 93% accuracy - ready!
12. Update status to Production
13. Deploy to staging environment

Day 4:
14. Monitor metrics in Production Metrics
15. All good → Deploy to production
16. Archive v1.0 and v2.0
```

### Example 2: A/B Testing

**Scenario:** Choosing between two approaches

```
1. Create "Approach A" (CoT) - v1.0
2. Create "Approach B" (Few-Shot) - v1.0
3. Evaluate both on same dataset
4. Results:
   - Approach A: 90% accuracy, 200 tokens
   - Approach B: 88% accuracy, 150 tokens
5. Decision: Use A for accuracy-critical, B for cost-sensitive
6. Tag accordingly: A = "high-accuracy", B = "cost-optimized"
7. Both to Production status
8. Deploy to different endpoints
```

### Example 3: Template-Based Workflow

**Scenario:** Creating multiple similar prompts

```
1. Create template: "Code Review Template"
   - Placeholders: {language}, {focus_area}, {severity_threshold}
2. Save as template
3. Create variants:
   - "Python Security Review" (language=Python, focus=security)
   - "JavaScript Performance Review" (language=JS, focus=performance)
   - "Go Best Practices Review" (language=Go, focus=best-practices)
4. Each variant inherits template structure
5. Evaluate all variants
6. Deploy to respective code review pipelines
```

## Best Practices

✅ **DO:**
- Use descriptive names (not "Prompt 1", "Prompt 2")
- Write clear descriptions explaining purpose
- Add relevant tags for easy filtering
- Update status as prompts progress
- Create versions for significant changes
- Evaluate before changing status to Production
- Archive old versions instead of deleting
- Export backups regularly

❌ **DON'T:**
- Save every tiny variation (use versions instead)
- Skip descriptions and tags (hard to find later)
- Deploy untested prompts to production
- Delete prompts that are deployed
- Use generic names
- Forget to update status
- Mix personal experiments with production prompts

## Organization Strategies

### By Project

```
Project: E-commerce Chatbot
├── Product Recommendations (CoT)
├── Order Status Lookup (Few-Shot)
├── Return Processing (ReAct)
└── Customer Feedback Analysis (Sentiment)
```

### By Technique

```
Chain-of-Thought Prompts
├── Math Problem Solver
├── Code Debugger
├── Medical Diagnosis Assistant
└── Legal Document Analyzer
```

### By Status

```
Production (12 prompts)
├── [Active prompts in use]

Testing (5 prompts)
├── [Under evaluation]

Draft (8 prompts)
├── [Work in progress]

Archived (23 prompts)
├── [Deprecated or replaced]
```

### By Priority

**Tags:**
- `critical` — Core functionality, monitor closely
- `high-priority` — Important but not critical
- `experimental` — Testing new approaches
- `deprecated` — Marked for removal

## Integration with Other Sections

### From Library to Evaluation

1. Select prompt in Library
2. Click "Evaluate"
3. Redirects to Evaluation Lab with prompt loaded
4. Choose dataset and run tests
5. Results saved to prompt metadata

### From Library to Optimizer

1. Select prompt in Library
2. Click "Optimize"
3. Redirects to Optimizer with prompt loaded
4. Run optimization
5. Save optimized version back to Library (new version)

### From Library to Production Metrics

1. Deploy prompt to production
2. Metrics automatically track:
   - Request count
   - Success rate
   - Latency
   - Error rate
3. View metrics from Library card

## Troubleshooting

**Problem:** "Can't find my prompt"
- **Solution:** Check filters (might be filtering out), use search, check status (might be archived)

**Problem:** "Too many versions cluttering history"
- **Solution:** Delete minor versions, keep only major milestones

**Problem:** "Prompt deployed but can't edit"
- **Solution:** Production prompts are locked. Create new version or rollback to edit.

**Problem:** "Lost track of which version is in production"
- **Solution:** Check deployment metadata on prompt card, use "Production" status filter

## Next Steps

1. **Organize existing prompts** → Add tags, descriptions, categories
2. **Set up collections** → Group related prompts
3. **Deploy to production** → Use deployment tracking
4. **Monitor performance** → Go to DEPLOY: Metrics
5. **Track changes** → Go to DEPLOY: History

---

**Related Sections:**
- [Generator](#) — Create prompts to save
- [Optimizer](#) — Improve saved prompts
- [Evaluation](#) — Test before saving
- [Metrics](#) — Monitor deployed prompts
- [History](#) — Track all changes
