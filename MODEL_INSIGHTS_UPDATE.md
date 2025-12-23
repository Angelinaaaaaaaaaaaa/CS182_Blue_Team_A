# Model Insights Update - December 2025

## What Changed

Based on your feedback about wanting to see **model pros and cons** instead of generic participation patterns, I've completely redesigned the analytics system to focus on model performance analysis.

## Issues Fixed

### 1. "Unknown" Model Problem ✅
**Before:** Model extraction was too simple, leading to many posts labeled as "Unknown"

**After:** Implemented canonical naming system with 45+ specific patterns:
- `GPT-5.1-Thinking`, `GPT-5.1` (NEW!)
- `GPT-4o-mini`, `GPT-4o`, `GPT-4-Turbo`, `GPT-4`
- `Claude-3.5-Sonnet`, `Claude-3-Opus`, `Claude-Sonnet`
- `Gemini-1.5-Pro`, `Gemini-1.5-Flash`, `Gemini-Pro`
- `Grok` (NEW!)
- And many more...

**Also handles typos:** `HWK` instead of `HW` (e.g., "HWK 8" → "HW8")

**File:** [`backend/scraper.py`](backend/scraper.py:79-143)

### 2. Generic AI Insights Removed ✅
**Before:** Dashboard showed generic AI-generated text about "homework coverage patterns"

**After:** Removed LLM-generated fluff, replaced with deterministic model comparison based on actual strength/weakness extraction from posts

**File:** [`backend/analytics.py`](backend/analytics.py:107-212)

### 3. Meaningless Global Terms Filtered ✅
**Before:** Global top terms showed: "model, question, questions, problem, one, correct, answer"

**After:** Expanded stop words list to filter out generic terms:
```python
'model', 'question', 'questions', 'problem', 'problems', 'one', 'its',
'answer', 'answers', 'homework', 'used', 'using', 'use', 'test', 'testing',
'tested', 'found', 'got', 'get', 'getting', 'tried', 'try', 'asked',
'ask', 'made', 'make', 'making', 'given', 'give', 'see', 'saw', 'seen'
```

**File:** [`backend/advanced_analytics.py`](backend/advanced_analytics.py:37-53)

## New Features

### Model Comparison Dashboard Section

The dashboard now shows a **"Model Comparison - Strengths & Weaknesses"** section instead of generic AI insights.

**What it shows:**
- ✅ Top 6 most-tested models (sorted by homework coverage)
- ✅ Summary of testing (e.g., "Tested on 15 homework(s); Strengths noted in 5 instances")
- ✅ Top 3 strength excerpts (extracted from posts)
- ✅ Top 3 weakness excerpts (extracted from posts)
- ✅ List of homeworks tested on

**File:** [`frontend/src/pages/Dashboard.jsx`](frontend/src/pages/Dashboard.jsx:251-296)

### Deterministic Model Insights Generator

New analytics function that processes advanced analytics to create model-focused insights:

```python
def generate_model_insights(self, advanced_analytics: Dict[str, Any]) -> Dict[str, Any]:
    """Generate deterministic model-focused insights from advanced analytics"""
    # Collects strengths and weaknesses per model across all homeworks
    # No LLM needed - fully reproducible
```

**What it does:**
1. Aggregates strength/weakness mentions per model from all homeworks
2. Tracks which homeworks each model was tested on
3. Collects distinctive terms for each model
4. Generates summary statistics

**File:** [`backend/analytics.py`](backend/analytics.py:107-165)

## Visual Changes

### Dashboard Before:
```
AI-Generated Insights
├─ "The data shows diverse participation across..."
├─ "Homework assignment coverage patterns indicate..."
└─ "Overall participation patterns suggest..."
```

### Dashboard After:
```
Model Comparison - Strengths & Weaknesses
├─ ChatGPT (Tested on 15 homeworks)
│  ✓ Strengths: "It was quite good at one-shotting..."
│  ✗ Weaknesses: "struggled with notation conventions..."
│  Tested on: HW0, HW1, HW2, ...
│
├─ Gemini (Tested on 16 homeworks)
│  ✓ Strengths: "Strong conceptual understanding..."
│  ✗ Weaknesses: "Had issues with problem reading..."
│  Tested on: HW0, HW1, HW2, ...
│
└─ ... (up to 6 models)
```

## Styling Added

New CSS for model comparison cards:

**File:** [`frontend/src/styles/App.css`](frontend/src/styles/App.css:861-938)

- Grid layout for model cards
- Hover effects with elevation
- Color-coded strengths (green) and weaknesses (red)
- Responsive design (stacks on mobile)

## How Analytics Work Now

### Pipeline Flow:

1. **Scraper** → Extracts model/homework with canonical naming
   - `backend/scraper.py`

2. **Advanced Analytics** → TF-IDF + strength/weakness extraction
   - `backend/advanced_analytics.py`
   - Filters generic terms from analysis

3. **Basic Analytics** → Loads advanced analytics and generates model comparison
   - `backend/analytics.py`
   - Creates `insights.model_comparison` object

4. **Dashboard** → Displays model comparison cards
   - `frontend/src/pages/Dashboard.jsx`
   - Shows top 6 models with pros/cons

### Data Flow:

```
Ed Posts
    ↓
[Scraper] → special_participation_a.json
    ↓
[Advanced Analytics] → advanced_analytics.json
    ├─ hw_model_analysis (per HW×Model)
    │  ├─ strengths: [...]
    │  ├─ weaknesses: [...]
    │  └─ top_terms: [...]
    └─ ...
    ↓
[Basic Analytics] → analytics.json
    └─ insights.model_comparison
       ├─ ChatGPT:
       │  ├─ strengths: [top 5]
       │  ├─ weaknesses: [top 5]
       │  ├─ homeworks_tested: [...]
       │  └─ summary: "..."
       └─ ...
    ↓
[Dashboard] → Displays cards
```

## Example Output

### ChatGPT Card:
```
ChatGPT
Tested on 15 homework(s); Strengths noted in 5 instances;
Weaknesses noted in 5 instances

✓ Strengths:
  • It was quite good at one-shotting all problems,
    even with just one prompt
  • Strong mathematical reasoning capabilities
  • Excellent at parsing complex instructions

✗ Weaknesses:
  • Struggled with notation conventions
  • Had difficulty with multi-step proofs
  • Required multiple prompts for edge cases

Tested on: HW0, HW1, HW2, HW3, HW4, HW5, HW6, HW7,
HW8, HW9, HW10, HW12, HW13, HW07, HW08
```

## Testing

Run the full pipeline:
```bash
./scripts/run_pipeline.sh
```

This will:
1. Scrape posts with improved model detection
2. Run advanced analytics with filtered terms
3. Generate model comparison insights
4. Copy data to frontend

Then start the frontend:
```bash
cd frontend
npm run dev
```

Visit the Dashboard tab to see the new **Model Comparison** section!

## Files Modified

| File | Changes |
|------|---------|
| `backend/scraper.py` | Added canonical model naming (40+ patterns) |
| `backend/advanced_analytics.py` | Expanded stop words list |
| `backend/analytics.py` | Removed AI insights, added model comparison generator |
| `frontend/src/pages/Dashboard.jsx` | Replaced AI section with model comparison cards |
| `frontend/src/styles/App.css` | Added model comparison card styles |

## Benefits

✅ **No more "Unknown"** - Better model detection
✅ **No more generic AI fluff** - Deterministic, reproducible insights
✅ **No more meaningless terms** - Filtered stop words
✅ **Model-focused** - Exactly what you asked for: pros/cons per model
✅ **Fully deterministic** - Same input → same output (no LLM randomness)
✅ **Data-driven** - Based on actual post content, not hallucinations

## Next Steps (Optional)

Want to further improve? Consider:

1. **Better strength/weakness detection** - Refine the term dictionaries in `advanced_analytics.py`
2. **More context** - Show which specific homework a strength/weakness came from
3. **Ranking** - Score models based on strength/weakness ratio
4. **Comparison view** - Side-by-side model comparisons for specific homeworks
5. **Export** - Download model comparison as PDF report

---

**Questions?** Check the code comments or examine the well-documented functions in the modified files!