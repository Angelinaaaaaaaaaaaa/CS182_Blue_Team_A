# Complete File Structure

This document shows where every file is located and what it does.

## Project Root

```
cs182_blue_team/
├── README.md                   Main documentation
├── QUICKSTART.md               5-minute setup guide
├── PROJECT_SUMMARY.md          Project overview
├── FILE_STRUCTURE.md           This file
├── .env.example                Environment variables template
├── .gitignore                  Git ignore rules
└── vercel.json                 Vercel deployment config
```

## Backend Directory

```
backend/
├── scraper.py                  Ed API scraper
│   ├── EdScraper class
│   ├── get_threads() - Fetch discussions
│   ├── extract_metadata() - Parse titles
│   ├── process_threads() - Clean data
│   └── save_data() - Output JSON/CSV
│
├── analytics.py                Analytics processor
│   ├── AnalyticsProcessor class
│   ├── calculate_statistics() - Compute metrics
│   ├── generate_summaries() - AI summaries
│   └── generate_insights() - AI insights
│
└── requirements.txt            Python dependencies
    ├── requests
    ├── python-dotenv
    ├── openai
    └── edapi
```

## Frontend Directory

```
frontend/
├── index.html                  HTML template
├── package.json                Node dependencies & scripts
├── vite.config.js              Vite configuration
│
├── src/                        Source code
│   ├── main.jsx                Entry point
│   ├── App.jsx                 Main app component
│   │
│   ├── components/             Reusable components
│   │   └── Header.jsx          Navigation header
│   │
│   ├── pages/                  Main pages
│   │   ├── Dashboard.jsx       Overview & statistics
│   │   ├── Browse.jsx          Searchable post list
│   │   ├── Analytics.jsx       Advanced analytics
│   │   └── Compare.jsx         Model comparison
│   │
│   └── styles/                 CSS styling
│       ├── index.css           Global styles & theme
│       └── App.css             Component styles
│
└── public/                     Static assets
    └── data/                   Data files (created by pipeline)
        ├── special_participation_a.json
        ├── special_participation_a.csv
        └── analytics.json
```

## Scripts Directory

```
scripts/
└── run_pipeline.sh             Complete automation script
    ├── Setup virtual environment
    ├── Run scraper
    ├── Run analytics
    └── Copy data to frontend
```

## Documentation Directory

```
docs/
├── SETUP_GUIDE.md              Detailed setup instructions
├── DEPLOYMENT.md               Deployment guide
└── FEATURES.md                 Feature comparison
```

## File Purposes

### Configuration Files

| File | Purpose |
|------|---------|
| `.env` | API tokens (user creates from .env.example) |
| `.env.example` | Environment template |
| `.gitignore` | Files to exclude from git |
| `vercel.json` | Vercel deployment settings |
| `vite.config.js` | Vite build configuration |
| `package.json` | Frontend dependencies |
| `requirements.txt` | Backend dependencies |

### Backend Files

| File | Purpose | Lines |
|------|---------|-------|
| `scraper.py` | Fetch data from Ed API | ~200 |
| `analytics.py` | Process and analyze data | ~200 |

### Frontend Files

| File | Purpose | Lines |
|------|---------|-------|
| `main.jsx` | React app initialization | ~10 |
| `App.jsx` | Main app component | ~60 |
| `Header.jsx` | Navigation component | ~30 |
| `Dashboard.jsx` | Statistics & charts | ~250 |
| `Browse.jsx` | Searchable posts | ~250 |
| `Analytics.jsx` | Advanced analytics | ~300 |
| `Compare.jsx` | Model comparison | ~300 |
| `index.css` | Global styles & theme | ~300 |
| `App.css` | Component styles | ~400 |

### Documentation Files

| File | Purpose | Pages |
|------|---------|-------|
| `README.md` | Main documentation | ~400 lines |
| `QUICKSTART.md` | Quick start guide | ~150 lines |
| `PROJECT_SUMMARY.md` | Project overview | ~400 lines |
| `SETUP_GUIDE.md` | Detailed setup | ~300 lines |
| `DEPLOYMENT.md` | Deployment guide | ~400 lines |
| `FEATURES.md` | Feature comparison | ~400 lines |
| `FILE_STRUCTURE.md` | This file | ~200 lines |

## Data Flow

```
Ed API
  ↓
scraper.py → data/special_participation_a.json
  ↓
analytics.py → data/analytics.json
  ↓
Copy to frontend/public/data/
  ↓
React App → Display in UI
```

## Component Hierarchy

```
App
├── Header
│   └── Navigation tabs
│
├── Dashboard (page)
│   ├── Stats cards
│   ├── Bar chart
│   ├── Pie chart
│   └── Line chart
│
├── Browse (page)
│   ├── Search bar
│   ├── Filters
│   └── Post cards
│
├── Analytics (page)
│   ├── Top contributors
│   ├── Timeline chart
│   └── Heatmap matrix
│
└── Compare (page)
    ├── Model selectors
    ├── Radar chart
    └── Stats comparison
```

## Build Output

After running `npm run build`:

```
frontend/dist/
├── index.html              Optimized HTML
├── assets/
│   ├── index-[hash].js    Bundled JavaScript
│   └── index-[hash].css   Bundled CSS
└── data/                   Data files (copied)
```

## Total Project Statistics

| Metric | Count |
|--------|-------|
| **Total Files** | 23 |
| **Python Files** | 2 |
| **JavaScript/JSX Files** | 9 |
| **CSS Files** | 2 |
| **Markdown Files** | 7 |
| **Config Files** | 5 |
| **Total Lines of Code** | ~2,500 |
| **Backend Lines** | ~400 |
| **Frontend Lines** | ~1,700 |
| **Documentation Lines** | ~2,000 |

## Where to Find Things

### Want to...

**Change colors/theme?**
→ `frontend/src/styles/index.css` (`:root` section)

**Modify charts?**
→ `frontend/src/pages/Dashboard.jsx` or `Analytics.jsx`

**Edit search behavior?**
→ `frontend/src/pages/Browse.jsx` (search/filter logic)

**Change Ed course ID?**
→ `backend/scraper.py` (line ~15)

**Adjust AI prompts?**
→ `backend/analytics.py` (generate_insights function)

**Add new page?**
1. Create `frontend/src/pages/NewPage.jsx`
2. Import in `frontend/src/App.jsx`
3. Add to navigation in `frontend/src/components/Header.jsx`

**Modify deployment settings?**
→ `vercel.json`

**Change build settings?**
→ `frontend/vite.config.js`

## Development Workflow

### Initial Setup
1. `cp .env.example .env` (add tokens)
2. `./scripts/run_pipeline.sh`
3. `cd frontend && npm install && npm run dev`

### Daily Development
1. Edit files in `frontend/src/`
2. Save (Vite auto-reloads)
3. Test in browser

### Update Data
1. `cd backend && python scraper.py`
2. `python analytics.py`
3. `cp ../data/*.json ../frontend/public/data/`

### Deploy
1. `git commit -am "Your changes"`
2. `git push`
3. Vercel auto-deploys

## File Sizes (Approximate)

| Category | Size |
|----------|------|
| Backend code | 15 KB |
| Frontend code | 60 KB |
| Styles | 15 KB |
| Documentation | 40 KB |
| Dependencies (node_modules) | ~200 MB |
| Dependencies (venv) | ~50 MB |
| Data files | Varies (1-10 MB) |
| **Total (without deps)** | ~130 KB |
| **Production build** | ~500 KB |

---

**Quick Reference**: All files are in `/Users/runjiezhang/Desktop/ec/cs182_blue_team/`