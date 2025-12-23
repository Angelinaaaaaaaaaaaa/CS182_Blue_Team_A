# CS182 Blue Team - Quick Start Guide

Get the CS182 Special Participation A Archive up and running in minutes!

## Overview

This project analyzes 169 Special Participation A posts where students tested various AI models (ChatGPT, Claude, Gemini, etc.) on homework assignments. The archive includes:

- **Frontend**: React web application with interactive dashboards
- **Backend**: Python data processing and analytics
- **Data**: Pre-processed JSON files ready to use

## Prerequisites

- **Node.js 18+** (for frontend)
- **Python 3.8+** (optional, only if regenerating analytics)
- **npm** (comes with Node.js)

## Quick Start (Recommended)

The fastest way to get started - uses pre-processed data already included in the project.

### 1. Install Frontend Dependencies

```bash
cd frontend
npm install
```

### 2. Start the Development Server

```bash
npm run dev
```

The application will open automatically at [http://localhost:3000](http://localhost:3000) (or the next available port if 3000 is in use).

### 3. Explore the Application

Navigate through the different pages:

- **Dashboard**: Overview statistics, model comparison, and key findings
- **Browse**: Search and filter through all 169 posts
- **Analytics**: Submission timeline and heatmap visualizations
- **Insights**: Interactive homework × model analysis with drill-down

That's it! You're ready to explore the data.

---

## Full Setup (With Backend)

If you want to regenerate analytics or modify the data processing:

### 1. Setup Python Environment

```bash
# Create virtual environment (optional but recommended)
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install Python dependencies
cd backend
pip install -r requirements.txt
```

### 2. Run Analytics Pipeline

The data files are already processed, but you can regenerate them:

```bash
# From backend directory
python3 analytics.py
python3 advanced_analytics.py
```

This will regenerate:
- `backend/data/analytics.json` - Basic statistics and model comparisons
- `backend/data/advanced_analytics.json` - TF-IDF analysis, clustering, heatmaps

### 3. Copy Data to Frontend (if regenerated)

```bash
# From project root
cp backend/data/*.json frontend/public/data/
cp backend/data/*.csv frontend/public/data/
```

### 4. Start Frontend

```bash
cd frontend
npm install  # If not already done
npm run dev
```

---

## Available Commands

### Frontend Commands

```bash
cd frontend

# Development server with hot reload
npm run dev

# Production build (outputs to frontend/dist/)
npm run build

# Preview production build locally
npm run preview

# Run ESLint to check code quality
npm run lint
```

### Backend Commands

```bash
cd backend

# Run basic analytics (requires data files)
python3 analytics.py

# Run advanced analytics (TF-IDF, clustering, heatmaps)
python3 advanced_analytics.py

# Run scraper (requires Ed API token in .env)
python3 scraper.py
```

---

## Project Structure

```
CS182_Blue_Team_A/
├── frontend/                    # React web application
│   ├── src/
│   │   ├── pages/              # Dashboard, Browse, Analytics, Insights
│   │   ├── components/         # Header and reusable components
│   │   ├── styles/             # CSS files
│   │   ├── App.jsx            # Main app component
│   │   └── main.jsx           # Entry point
│   ├── public/
│   │   └── data/              # JSON and CSV data files
│   ├── package.json
│   └── vite.config.js
│
├── backend/                    # Python data processing
│   ├── scraper.py             # Ed API scraper
│   ├── analytics.py           # Basic analytics
│   ├── advanced_analytics.py  # Advanced TF-IDF analysis
│   ├── data/                  # Processed data files
│   └── requirements.txt
│
├── QUICKSTART.md              # This file
└── README.md                  # Detailed project documentation
```

---

## Data Files

All required data files are already included in `frontend/public/data/`:

| File | Description | Size |
|------|-------------|------|
| `special_participation_a.json` | 169 posts with metadata | ~68 KB |
| `special_participation_a.csv` | Same data in CSV format | ~30 KB |
| `analytics.json` | Basic statistics and model insights | ~52 KB |
| `advanced_analytics.json` | TF-IDF analysis and heatmaps | ~84 KB |

---

## Troubleshooting

### Port 3000 already in use

Vite will automatically try the next available port (3001, 3002, etc.). Check the terminal output for the actual URL.

### Data files not loading

Make sure you're in the `frontend` directory when running `npm run dev`. The data files should be in `frontend/public/data/`.

### Python dependencies fail to install

Make sure you have Python 3.8+ installed:
```bash
python3 --version
```

If using a virtual environment, make sure it's activated:
```bash
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

### ESLint warnings

Run the linter to check for issues:
```bash
cd frontend
npm run lint
```

All warnings should already be fixed. If you encounter new ones, prefix unused parameters with `_` (e.g., `_unusedParam`).

---

## Features Overview

### Dashboard Page
- **Stats Grid**: Total posts, contributors, models, and homework assignments
- **Model Comparison**: Top 6 models with strengths and weaknesses
- **Charts**: Bar charts, pie charts, and line graphs
- **Key Findings**: Summary insights

### Browse Page
- **Fuzzy Search**: Search across titles, authors, models, and content
- **Filters**: Filter by model and homework assignment
- **Sorting**: Sort by date, likes, or comments

### Analytics Page
- **Timeline**: Bar chart showing posts over time
- **Heatmap**: Interactive homework × model coverage matrix

### Insights Page
- **Interactive Heatmap**: Click cells to drill down into specific combinations
- **Analysis**: View strengths, weaknesses, and top terms
- **Representative Posts**: See 3 example posts for each combination

---

## Next Steps

1. **Explore the data**: Browse through the 169 posts and see what students discovered
2. **Analyze models**: Compare different AI models across homework assignments
3. **Customize**: Modify the frontend components to add new visualizations
4. **Extend**: Add your own analytics by modifying the backend Python scripts

---

## Additional Resources

- **Full Documentation**: See [README.md](README.md) for detailed information
- **Frontend Framework**: [React](https://react.dev/) + [Vite](https://vitejs.dev/)
- **Charts**: [Chart.js](https://www.chartjs.org/) + [Recharts](https://recharts.org/)
- **Styling**: Custom CSS with mobile-responsive design

---

## Support

If you encounter issues:

1. Check that all dependencies are installed correctly
2. Verify data files exist in `frontend/public/data/`
3. Review the terminal output for error messages
4. See the troubleshooting section above

---

**Built with ❤️ for CS182** | 169 Posts | 50+ Models | Fully Deterministic | Mobile-Optimized
