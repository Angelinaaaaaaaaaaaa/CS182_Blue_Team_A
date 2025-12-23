```md
# CS182 Blue Team — Special Participation A Archive

A web application for exploring, analyzing, and visualizing CS182 **Special Participation A** submissions (students test LLMs on homework and report what worked / what failed). I focus on (1) **evidence-based comparisons** grounded in actual student text, (2) **deterministic analytics** that are fully reproducible, and (3) a **clean, mobile-friendly UI** that makes the archive usable.

---

## 📊 Project Overview

This archive collects and analyzes **169 Special Participation A posts** from Ed Discussion. Students tested many AI models (ChatGPT, Claude, Gemini, DeepSeek, etc.) on homework assignments and documented performance, failure modes, and one-shot capability.

### Key Metrics
- **169 posts** from unique student contributors  
- **50+ AI models** (canonical naming + typo handling)  
- **13 homeworks** covered (HW0–HW12)  
- **Deterministic analytics** by default (same input → same output)  
- **Mobile-optimized** responsive design  

---

## 🌟 What I did beyond the baseline

### 1) Canonical Model Detection (50+ patterns)
I normalized messy, real-world model names into canonical labels (with a “most-specific-first” ordering) so analytics don’t split the same model across variants.

- Added newer model variants: `GPT-5-Thinking`, `GPT-5.1-Thinking`, `GPT-5.1`, `GPT-5`, `Grok`, `Kimi-K2`, `Perplexity-Sonar`, `DeepSeek-v3.2`, `DeepSeek-v3`, `Gemma`, `GPT-OSS`, etc.
- Typo handling:
  - `HWK 8` → `HW8`
  - `HW02` → `HW2` (leading zeros removed)

### 2) Evidence-based Model Comparison (real quotes → structured pros/cons)
I redesigned the dashboard so **Model Comparison appears first** and is grounded in **actual evidence extracted from posts**, not generic “Model X is good” claims.

Each model card includes:
- Separate **Strengths vs. Weaknesses** sections (clear visual separation)
- **Homework tags** showing where the model was tested
- Focus on **most-tested** models to keep the view informative, not noisy

### 3) Deterministic Analytics as the default
By default, all analytics are reproducible:
- TF-IDF-based topic signals (with enhanced stopword filtering)
- Heuristic extraction of strength/weakness evidence from student text
- HW×Model coverage heatmap + drill-down
- Representative post selection for each HW×Model

No AI is required for the baseline pipeline.

### 4) Optional AI “one-liners” (OpenAI API key, strictly additive)
I added an **optional** feature where the UI can show a **single-sentence pro/con per model** using an OpenAI API key.

Important constraints:
- Default analytics remain deterministic.
- AI is used only to summarize **already-extracted evidence** into short one-liners (and never replaces the evidence itself).
- If no evidence is available, the UI falls back to “Insufficient evidence in posts.”

### 5) Mobile Optimization
I improved responsive design for all screen sizes:
- Single-column layouts on mobile
- Reduced padding / font sizes
- Horizontal scrolling for dense tables (heatmap)
- Stacked nav tabs and mobile-friendly search

---

## ✅ Key Fix: content-rich dataset (so evidence extraction works)

Early versions of the dataset used settled metadata but had `content=""`, so evidence extraction returned empty strengths/weaknesses.

The current pipeline uses:
- A manually settled CSV (`special_participation_a_settled.csv`) for **clean model/HW labels**
- A merge step that fetches **full thread content** from Ed by thread id and attaches it to each row

This is critical: strengths/weaknesses + TF-IDF topics require the real post text.

---

## 📁 Project Structure

```

cs182_blue_team/
├── backend/
│   ├── scraper.py
│   ├── analytics.py
│   ├── advanced_analytics.py
│   ├── data/
│   │   ├── special_participation_a_settled.csv     # Manual settled metadata (169 posts)
│   │   ├── merge_settled_with_content.py           # Merge settled CSV + fetch full content from Ed
│   │   ├── special_participation_a.json            # Final JSON (includes content)
│   │   ├── special_participation_a.csv
│   │   ├── analytics.json
│   │   └── advanced_analytics.json
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx        # Model comparison at top + charts
│   │   │   ├── Browse.jsx           # Search + filters
│   │   │   ├── Analytics.jsx        # Timeline + coverage matrix
│   │   │   ├── Insights.jsx         # HW×Model heatmap drill-down + representative posts
│   │   │   └── Compare.jsx          # Pairwise comparisons
│   │   ├── styles/
│   │   │   ├── App.css
│   │   │   └── index.css
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── public/data/                 # Data files copied from backend outputs
│   ├── package.json
│   └── vite.config.js
├── scripts/
│   └── run_pipeline.sh
├── FINAL_IMPROVEMENTS.md
├── MODEL_INSIGHTS_UPDATE.md
├── README.md
└── .env.example

````

---

## 🚀 Quick Start

### Prerequisites
- Python 3.8+
- Node.js 18+
- **Ed API token** (required if you want content fetching)
- **OpenAI API key** (optional; for one-line pro/con summaries)

### Environment variables

Create `.env` in the project root:

```env
ED_API_TOKEN=your_ed_api_token_here
OPENAI_API_KEY=your_openai_api_key_here   # optional
````

Note: `.env` is gitignored.

---

## 🧪 Option A (Recommended): settled metadata + fetch full post content

This produces a dataset that includes real post text (required for evidence extraction).

```bash
# 1) Install backend deps
cd backend
pip install -r requirements.txt

# 2) Merge settled CSV with full content from Ed
python3 data/merge_settled_with_content.py

# 3) Run analytics
python3 advanced_analytics.py
python3 analytics.py

# 4) Copy outputs to frontend
cd ..
mkdir -p frontend/public/data
cp backend/data/special_participation_a.json frontend/public/data/
cp backend/data/special_participation_a.csv frontend/public/data/
cp backend/data/analytics.json frontend/public/data/
cp backend/data/advanced_analytics.json frontend/public/data/

# 5) Start frontend
cd frontend
npm install
npm run dev
```

Visit: `http://localhost:5173`

---

## 🧾 Option B: run the full pipeline script

```bash
cp .env.example .env
# fill in ED_API_TOKEN (and optionally OPENAI_API_KEY)
./scripts/run_pipeline.sh

cd frontend
npm install
npm run dev
```

---

## 📊 Data Pipeline

### 1) Settled metadata (manual)

`backend/data/special_participation_a_settled.csv`

* Ensures no “Unknown” model labels
* Normalizes homework labels
* Fixes edge cases / typos

### 2) Merge with Ed content

`backend/data/merge_settled_with_content.py`

* Reads settled CSV
* Fetches thread detail by id from Ed
* Attaches full post text (and optionally replies)
* Outputs `special_participation_a.json` with non-empty `content`

### 3) Advanced analytics

`backend/advanced_analytics.py`

* TF-IDF topic extraction
* Strength/weakness evidence extraction
* HW×Model heatmap
* Representative post selection

### 4) Basic analytics

`backend/analytics.py`

* Builds model-level summaries + dashboard-ready stats
* Filters out noise / stopwords
* Produces `analytics.json`

---

## 🎨 Frontend Pages

### Dashboard

* Stats grid: posts, contributors, models, homeworks
* Model comparison at the top (evidence-based pros/cons + HW tags)
* Charts: top models, distribution, posts by homework
* Key findings at the bottom

### Insights

* HW×Model heatmap with drill-down
* For a selected cell: top terms, strengths, weaknesses, representative posts

### Browse

* Fuzzy search across title/author/content
* Filters: model, homework, sort options
* Post cards with metadata

### Compare

* Side-by-side model comparisons (designed to reduce “info overload”)

---

## 🤖 Optional OpenAI one-liner summaries

If `OPENAI_API_KEY` is set, the UI can display a short one-line pro/con for each model.

Design principles:

* AI is additive: it summarizes already-extracted evidence.
* Evidence is always shown and remains the source of truth.
* Strict JSON parsing + fallback behavior (“Insufficient evidence”).

---

## 🚢 Deployment

### Vercel

```bash
cd frontend
npm run build
vercel
```

---

## 📄 License

Created for CS182 coursework.

---

Built for CS182 | 169 posts | 50+ models | Evidence-based comparisons | Deterministic by default | Mobile-optimized

```
::contentReference[oaicite:0]{index=0}
```
