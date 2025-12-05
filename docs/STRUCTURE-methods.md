# Documentation Structure - Methods

## Overview

The methods documentation is organized in two levels:

### Level 1: Methods Library (Catalog)
**File (served in app):** `/docs/getting-started/11-methods-library.md`  
**Purpose:** Quick reference catalog with short summaries  
**Access:** Help → Resources → Methods Library

**Content:**
- Brief "what it does" for each method
- When to use / when to avoid
- How to test in PE Studio
- Links to original papers
- Links to detailed method notes

### Level 2: Detailed Method Notes (Deep Dive)
**Location (served in app):** `/docs/methods/[method-name].md`  
**Purpose:** Comprehensive implementation guides  
**Access:** 
- Help → Resources → [Method Name]
- Via links from Methods Library

**Content:**
- Direct quotes from original papers
- Production patterns and best practices
- Cost analysis and risk considerations
- Advanced techniques and combinations
- Quick reference cards

## Current Methods

### Current Methods
- **Self-Consistency (SC):** Reliable reasoning via majority vote
- **Chain-of-Thought (CoT):** Step-by-step reasoning
- **Tree of Thoughts (ToT):** Deliberate problem solving with lookahead
- **ReAct:** Synergizing Reasoning and Acting
- **RAG:** Retrieval-Augmented Generation
- **Chain-of-Verification (CoVe):** Trust, but verify
- **Step-Back Prompting:** Evoking reasoning via abstraction
- **System 2 Attention (S2A):** Focus on what matters

All detailed guides are stored in `frontend/public/docs/methods/`.

## Navigation Flow

```
Help Section
  └─ Resources Category
      ├─ Methods Library (catalog)
      │   └─ Self-Consistency (summary)
      │       └─ [Read full method note →] 
      │           └─ Self-Consistency (detailed guide)
      │               └─ [← Back to Methods Library]
      └─ Self-Consistency (detailed guide - direct access)
```

## User Experience

1. **Quick lookup:** User goes to Methods Library, scans summaries
2. **Deep dive:** User clicks "Read full method note" for details
3. **Direct access:** User can also go directly to method from Resources menu
4. **Navigation:** Breadcrumbs allow easy back-and-forth navigation

## Adding New Methods

When adding a new method:

1. **Create detailed guide:** Create `/docs/methods/[method-name].md`
   - Use existing method files as templates
   - Include production guidance and arXiv reference

2. **Update Help.tsx:** 
   - Add entry to `articleDocs` mapping:
     ```typescript
     '[Method Name]': '/docs/methods/method-name.md',
     ```
   - Add entry to `articleDescriptions` mapping.
   - Add new card object to `METHOD_CARDS` array:
     ```typescript
     {
       id: 'method-id',
       title: 'Method Name',
       acronym: 'MN',
       // ... details
     }
     ```

3. **(Optional) Add to Resources category:** 
   - Only if you want it to appear in the main "Quick Links" menu. 
   - Otherwise, it will be accessible via the Methods Library panel.

## Template Structure for Detailed Guides

```markdown
# Method Name: Subtitle

> **Deep Dive Guide** | [← Back to Methods Library](../getting-started/11-methods-library.md)

**Category:** ...
**Best for:** ...
**Original paper:** ...

This is a **detailed implementation guide** with direct paper quotes...

---

## 1. Core Idea
## 2. Why It Matters for Production
## 3. How It Works
## 4. When to Use (and When Not To)
## 5. Implementation in PE Studio
## 6. Cost & Risk Considerations
## 7. Advanced Techniques
## 8. Links to Original Research
## 9. Quick Reference Card
```
