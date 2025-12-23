# Complete Setup Guide

This guide will walk you through setting up the CS182 Blue Team project from scratch.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Python 3.8 or higher**: [Download Python](https://www.python.org/downloads/)
- **Node.js 18 or higher**: [Download Node.js](https://nodejs.org/)
- **Git**: [Download Git](https://git-scm.com/downloads)
- **Ed API Token**: Obtain from your Ed account settings
- **OpenAI API Key** (Optional): [Get API key](https://platform.openai.com/api-keys)

## Step-by-Step Setup

### 1. Get Your Ed API Token

1. Log in to [Ed](https://edstem.org)
2. Go to your account settings
3. Navigate to API tokens section
4. Generate a new token
5. Copy the token (you'll need it in step 3)

### 2. Clone/Download the Project

```bash
cd /Users/runjiezhang/Desktop/ec/cs182_blue_team
```

### 3. Configure Environment Variables

```bash
# Copy the example environment file
cp .env.example .env

# Open .env in your text editor
# Add your tokens:
ED_API_TOKEN=paste_your_ed_token_here
OPENAI_API_KEY=paste_your_openai_key_here  # Optional
```

### 4. Set Up Backend (Python)

```bash
# Create a virtual environment
python3 -m venv venv

# Activate the virtual environment
# On macOS/Linux:
source venv/bin/activate
# On Windows:
# venv\Scripts\activate

# Install dependencies
pip install -r backend/requirements.txt
```

### 5. Collect Data

```bash
# Make the pipeline script executable (macOS/Linux only)
chmod +x scripts/run_pipeline.sh

# Run the data collection pipeline
./scripts/run_pipeline.sh
```

Or manually:

```bash
# Create data directory
mkdir -p data

# Run scraper
cd backend
python scraper.py

# Run analytics
python analytics.py

# Copy data to frontend
mkdir -p ../frontend/public/data
cp ../data/*.json ../frontend/public/data/
cp ../data/*.csv ../frontend/public/data/
cd ..
```

### 6. Set Up Frontend (React)

```bash
# Navigate to frontend directory
cd frontend

# Install Node dependencies
npm install

# Start development server
npm run dev
```

The application should now be running at `http://localhost:3000`

### 7. Build for Production (Optional)

```bash
# In the frontend directory
npm run build

# Preview production build
npm run preview
```

## Verification

After setup, verify everything works:

### Check Data Files

```bash
ls -la frontend/public/data/
```

You should see:
- `special_participation_a.json`
- `special_participation_a.csv`
- `analytics.json`

### Check Frontend

Open `http://localhost:3000` and verify:
- ✅ Dashboard page loads with statistics
- ✅ Charts are rendered correctly
- ✅ Browse page shows posts
- ✅ Search and filters work
- ✅ Analytics page displays insights
- ✅ Compare page allows model selection

## Common Issues & Solutions

### Issue: "ED_API_TOKEN not found"

**Solution**: Ensure you've created a `.env` file in the root directory with your Ed API token.

```bash
# Check if .env exists
ls -la .env

# If not, create it
cp .env.example .env
# Then edit and add your token
```

### Issue: "Module 'edapi' not found"

**Solution**: Install Python dependencies:

```bash
source venv/bin/activate  # Activate venv first
pip install -r backend/requirements.txt
```

### Issue: "Command 'npm' not found"

**Solution**: Install Node.js from [nodejs.org](https://nodejs.org/)

### Issue: "Port 3000 already in use"

**Solution**: Either:
1. Stop the process using port 3000
2. Or modify `vite.config.js` to use a different port:

```javascript
export default defineConfig({
  server: {
    port: 3001  // Change to any available port
  }
})
```

### Issue: No data showing in frontend

**Solution**:
1. Check that data files exist in `frontend/public/data/`
2. Ensure the JSON files are valid (not empty or corrupted)
3. Check browser console for errors (F12)
4. Try hard refresh (Ctrl+Shift+R or Cmd+Shift+R)

### Issue: Charts not rendering

**Solution**:
```bash
# Reinstall frontend dependencies
cd frontend
rm -rf node_modules package-lock.json
npm install
```

## File Locations Reference

| File | Location | Purpose |
|------|----------|---------|
| Environment config | `/.env` | API tokens |
| Data files | `/frontend/public/data/` | JSON/CSV data |
| Backend scripts | `/backend/` | Python scraping/analytics |
| Frontend code | `/frontend/src/` | React application |
| Dependencies | `/backend/requirements.txt`, `/frontend/package.json` | Package lists |

## Next Steps

Once setup is complete:

1. **Explore the Application**: Navigate through all pages
2. **Customize**: Modify colors, add features, etc.
3. **Deploy**: Follow deployment guide to publish online
4. **Update Data**: Re-run scraper to get latest posts

## Need Help?

- Check the main [README.md](../README.md)
- Review the [Deployment Guide](DEPLOYMENT.md)
- Contact your team members
- Refer to course discussion board

---

**Setup complete!** 🎉 You're ready to explore the CS182 Blue Team archive.