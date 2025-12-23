# CS182 Blue Team - Special Participation A Archive

An advanced web application for exploring, analyzing, and visualizing CS182 **Special Participation A** submissions where students test LLMs on homework assignments. This project features deterministic analytics, enhanced UI, comprehensive model detection, and mobile optimization.

## 📊 Project Overview

This archive collects and analyzes **169 Special Participation A posts** from Ed Discussion, where students tested various AI models (ChatGPT, Claude, Gemini, Grok, etc.) on homework assignments and documented their strengths, weaknesses, and one-shot capabilities.

### Key Metrics
- **169 Posts** from unique student contributors
- **50+ AI Models** tested with canonical naming
- **13 Homeworks** covered (HW0-HW12)
- **Deterministic Analytics** - no random AI generation
- **Mobile-Optimized** responsive design

---

## 🌟 Key Improvements

### 1. **Enhanced Model Detection (50+ Patterns)**
We implemented canonical naming for 50+ AI model patterns with intelligent fallback:

**New Models Added:**
- `GPT-5-Thinking`, `GPT-5.1-Thinking`, `GPT-5.1`, `GPT-5`
- `Grok`, `Kimi-K2`, `Perplexity-Sonar`
- `DeepSeek-v3.2`, `DeepSeek-v3`
- `Gemma`, `GPT-OSS`
- `Claude-Opus-4.5` (Opus 4.5)

**Already Supported:**
- GPT-4o, GPT-4o-mini, GPT-4-Turbo, GPT-4, GPT-3.5-Turbo, ChatGPT
- o1-preview, o1-mini, o1
- Claude-3.5-Sonnet, Claude-3-Opus, Claude-Sonnet, Claude
- Gemini-1.5-Pro, Gemini-1.5-Flash, Gemini-Pro, Gemini
- Llama-3.1, Llama-3, Llama-2, Llama
- Qwen-2.5, Qwen-2, Qwen
- Mistral, Mixtral, Phi-3, Phi

**Typo Handling:**
- `HWK 8` → `HW8` (handles common typo)
- `HW02` → `HW2` (removes leading zeros)

### 2. **Model Comparison Dashboard**
Completely redesigned to show **actual pros & cons** from student posts:

- ✅ **Moved to top** of dashboard for immediate visibility
- ✅ **Enhanced card design** with gradient backgrounds and hover effects
- ✅ **Separate pros/cons sections** with color-coded borders (green ✓ for strengths, red ✗ for weaknesses)
- ✅ **Homework tags** showing which assignments each model was tested on
- ✅ **Top 6 most-tested models** with actual excerpts from student posts

**Example:**
```
🏆 Model Comparison - Strengths & Weaknesses

ChatGPT                               [15 HWs]
Tested on 15 homework(s); Strengths noted in 5 instances

✓ Strengths:
  → It was quite good at one-shotting all problems...
  → Strong mathematical reasoning capabilities...

✗ Weaknesses:
  → Struggled with notation conventions...
  → Required multiple prompts for edge cases...

[HW0] [HW1] [HW2] [HW3] [HW4] [HW5]...
```


### 3. **Mobile Optimization**
Enhanced responsive design for all screen sizes:
- Single-column layouts on mobile
- Reduced padding and font sizes
- Horizontal scrolling for tables
- Stacked navigation tabs
- Mobile-friendly search bars
- Footer displays "📱 Mobile-optimized" badge

### 4. **Deterministic Analytics**
All analytics are **fully deterministic** (reproducible):
- TF-IDF-based text analysis
- Heuristic strength/weakness extraction
- No random AI generation
- Same input → same output

---

## 📁 Project Structure

```
cs182_blue_team/
├── backend/                          # Data processing
│   ├── scraper.py                   # Ed API scraper (fetches all 863 threads, filters to 169)
│   ├── analytics.py                 # Basic analytics + model comparison generator
│   ├── advanced_analytics.py        # TF-IDF, clustering, heatmap generation
│   ├── data/
│   │   ├── special_participation_a_settled.csv    # Manual settled data (169 posts)
│   │   ├── special_participation_a.json           # JSON format
│   │   ├── analytics.json                          # Basic analytics
│   │   └── advanced_analytics.json                 # Advanced analytics
│   └── requirements.txt
├── frontend/                         # React web application
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx        # Model Comparison (top), Charts, Key Findings (bottom)
│   │   │   ├── Browse.jsx           # Searchable post browser
│   │   │   ├── Analytics.jsx        # Timeline & Heatmap (removed Top Contributors)
│   │   │   ├── Insights.jsx         # Interactive HW×Model heatmap with drill-down
│   │   │   └── Compare.jsx          # Model comparison tool
│   │   ├── styles/
│   │   │   ├── App.css              # Enhanced with model comparison card styles
│   │   │   └── index.css            # Global dark theme
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── public/data/                 # Data files copied from backend
│   ├── package.json
│   └── vite.config.js
├── scripts/
│   └── run_pipeline.sh              # Automated pipeline runner
├── FINAL_IMPROVEMENTS.md            # Comprehensive changelog
├── MODEL_INSIGHTS_UPDATE.md         # Model insights update docs
├── README.md                        # This file
└── .env.example
```

---

## 🚀 Quick Start

### Prerequisites
- **Python 3.8+**
- **Node.js 18+**
- **Ed API token** (optional - we provide settled data)
- **OpenAI API key** (optional - for AI features)

### Option 1: Use Provided Data (Recommended)

The project includes manually settled data in `backend/data/special_participation_a_settled.csv` with all 169 posts and no "Unknown" models.

```bash
# 1. Convert settled CSV to JSON
cd backend
python3 << 'EOF'
import csv
import json

csv_path = 'data/special_participation_a_settled.csv'
json_path = 'data/special_participation_a.json'

data = []
with open(csv_path, 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    for row in reader:
        entry = {
            "id": int(row['id']),
            "title": row['title'],
            "author": row['author'],
            "content": "",
            "model": row['model'],
            "homework": row['homework'],
            "created_at": row['created_at'],
            "updated_at": row['created_at'],
            "url": row['url'],
            "likes": int(row['likes']),
            "comments": int(row['comments'])
        }
        data.append(entry)

with open(json_path, 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=2, ensure_ascii=False)

print(f"Converted {len(data)} posts")
EOF

# 2. Run analytics
python3 analytics.py
python3 advanced_analytics.py

# 3. Copy data to frontend
cd ..
mkdir -p frontend/public/data
cp backend/data/special_participation_a.json frontend/public/data/
cp backend/data/special_participation_a.csv frontend/public/data/
cp backend/data/analytics.json frontend/public/data/
cp backend/data/advanced_analytics.json frontend/public/data/

# 4. Start frontend
cd frontend
npm install
npm run dev
```

Visit `http://localhost:5173`

### Option 2: Run Full Pipeline (Requires API Tokens)

```bash
# 1. Setup environment
cp .env.example .env
# Edit .env and add your API tokens

# 2. Run pipeline
./scripts/run_pipeline.sh

# 3. Start frontend
cd frontend
npm install
npm run dev
```

---

## 📊 Data Pipeline

### 1. **Scraper** (`backend/scraper.py`)
- Fetches **all 863 threads** from Ed course
- Filters for "Special Participation A" in title
- Excludes meta-posts about website creation
- Extracts model and homework metadata
- **Result:** 169 qualifying posts

### 2. **Advanced Analytics** (`backend/advanced_analytics.py`)
- TF-IDF analysis with enhanced stop words
- Strength/weakness extraction using term dictionaries
- Post clustering for representative selection
- HW×Model heatmap generation
- **Output:** `advanced_analytics.json`

### 3. **Basic Analytics** (`backend/analytics.py`)
- Loads advanced analytics
- Generates model comparison insights
- Filters out "Unknown" from statistics
- Creates deterministic summaries
- **Output:** `analytics.json`

### 4. **Frontend** (React)
- Loads JSON data files
- Renders Dashboard, Analytics, Insights, Browse pages
- Interactive charts with Chart.js
- Mobile-responsive design

---

## 🎨 Frontend Pages

### Dashboard
- **Stats Grid**: Total posts, contributors, models, homeworks
- **🏆 Model Comparison** (TOP): Enhanced cards with pros/cons
- **Charts**: Top Models (bar), Model Distribution (pie), Posts by Homework (line)
- **📌 Key Findings** (BOTTOM): Minimal bullet-point insights

### Analytics
- **Submission Timeline**: Bar chart of posts per day
- **Model × Homework Coverage Matrix**: Interactive heatmap (top 10 models)
- ~~Top Contributors~~ (removed)
- ~~Statistical Summary~~ (removed)

### Insights
- **Interactive Heatmap**: Click cells to drill down
- **HW×Model Analysis**: Strengths, weaknesses, top terms
- **Representative Posts**: 3 medoid posts per combination
- **Global Top Terms**: Filtered adjectives/nouns

### Browse
- **Fuzzy Search**: Search across all fields
- **Filters**: Model, homework, sort options
- **Post Cards**: Rich metadata with badges

### Compare
- **Side-by-side model comparison**
- **Radar charts** for multi-dimensional analysis

---

## 🔧 Configuration

### Environment Variables

Create `.env` in project root:

```env
# Required for scraping (optional if using settled data)
ED_API_TOKEN=your_ed_api_token_here

# Optional: for AI summaries (not used in current version)
OPENAI_API_KEY=your_openai_api_key_here
```

### Customize Course ID

Edit `backend/scraper.py`:
```python
scraper = EdScraper(course_id=YOUR_COURSE_ID)
```

---

## 📈 Key Analytics Features

### Model Insights (`analytics.json`)
- **model_comparison**: Strengths, weaknesses, homeworks_tested for each model
- **key_findings**: Top model, top homework, total contributors
- **coverage_summary**: X models tested across Y homework assignments

### Advanced Analytics (`advanced_analytics.json`)
- **hw_model_analysis**: Per HW×Model combination
  - `strengths`: Extracted from posts
  - `weaknesses`: Extracted from posts
  - `top_terms`: TF-IDF distinctive keywords
  - `representative_posts`: 3 medoid posts
- **heatmap**: Coverage matrix
- **global_top_terms**: Filtered meaningful terms

---

## 📱 Mobile Optimization

All pages responsive with:
- `@media (max-width: 768px)` breakpoints
- Single-column layouts
- Reduced padding (2rem → 1rem)
- Smaller font sizes
- Horizontal scroll for tables
- Stacked navigation tabs
- Mobile notice in footer

---

## 🚢 Deployment

### Vercel (Recommended)

```bash
npm install -g vercel
vercel
```

The `vercel.json` configuration is set up for optimal deployment.

### Manual Build

```bash
cd frontend
npm run build
# Outputs to frontend/dist/
```


## 📄 License

This project is created for CS182 coursework.

---

**Built with ❤️ for CS182** | 169 Posts | 50+ Models | Fully Deterministic | Mobile-Optimized