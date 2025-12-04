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

### Self-Consistency
- **Catalog entry:** `/docs/getting-started/11-methods-library.md` (Section: Self-Consistency) – stored under `frontend/public/docs/getting-started/11-methods-library.md`
- **Detailed guide:** `/docs/methods/self-consistency.md` – stored under `frontend/public/docs/methods/self-consistency.md`
- **Original paper:** `/docs/references/2203.11171.pdf`

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

1. **Add to catalog:** Update `/docs/getting-started/11-methods-library.md`
   - Add new section with summary
   - Include "Read full method note" link

2. **Create detailed guide:** Create `/docs/methods/[method-name].md`
   - Use self-consistency.md as template
   - Include breadcrumb navigation at top
   - Add direct paper quotes
   - Include production guidance

3. **Update Help.tsx:** Add entry to `articleDocs` mapping
   ```typescript
   '[Method Name]': '/docs/methods/method-name.md',
   ```

4. **Add to Resources category:** Update `categories` array in Help.tsx
   ```typescript
   articles: ['Methods Library', 'Self-Consistency', 'New Method'],
   ```

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
