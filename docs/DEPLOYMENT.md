# Deployment Guide

This guide covers deploying your CS182 Blue Team application to Vercel (recommended) and other platforms.

## Quick Deploy to Vercel (Recommended)

Vercel offers the easiest deployment for React + Vite applications.

### Option 1: Deploy via GitHub (Recommended)

1. **Push to GitHub**:
   ```bash
   # Initialize git if not already done
   git init

   # Add all files
   git add .

   # Create initial commit
   git commit -m "Initial commit - CS182 Blue Team"

   # Add remote (create repo on GitHub first)
   git remote add origin https://github.com/yourusername/cs182-blue-team.git

   # Push to GitHub
   git push -u origin main
   ```

2. **Connect to Vercel**:
   - Go to [vercel.com](https://vercel.com)
   - Click "Add New Project"
   - Import your GitHub repository
   - Vercel will auto-detect Vite configuration
   - Click "Deploy"

3. **Configure Build Settings** (if not auto-detected):
   - Framework Preset: `Vite`
   - Build Command: `cd frontend && npm install && npm run build`
   - Output Directory: `frontend/dist`
   - Install Command: `cd frontend && npm install`

4. **Done!** Your site will be live at `https://your-project.vercel.app`

### Option 2: Deploy via Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Navigate to project root
cd /Users/runjiezhang/Desktop/ec/cs182_blue_team

# Login to Vercel
vercel login

# Deploy
vercel

# Follow prompts:
# - Set up and deploy? Yes
# - Which scope? [Your account]
# - Link to existing project? No
# - Project name? cs182-blue-team
# - Directory? ./
# - Override settings? No

# For production deployment
vercel --prod
```

## Important: Data Files

### Before Deploying

Ensure your data files are in the correct location:

```bash
# Data should be in frontend/public/data/
ls frontend/public/data/

# Should show:
# special_participation_a.json
# special_participation_a.csv
# analytics.json
```

### Running Pipeline Before Deploy

```bash
# Run the complete pipeline
./scripts/run_pipeline.sh

# Or manually:
cd backend
python scraper.py
python analytics.py
cp ../data/*.json ../frontend/public/data/
cp ../data/*.csv ../frontend/public/data/
```

**Important**: Data files must be committed to your repository for static deployment:

```bash
git add frontend/public/data/
git commit -m "Add data files"
git push
```

## Alternative Deployment Options

### Netlify

1. **Install Netlify CLI**:
   ```bash
   npm install -g netlify-cli
   ```

2. **Build the project**:
   ```bash
   cd frontend
   npm run build
   ```

3. **Deploy**:
   ```bash
   netlify deploy --dir=dist --prod
   ```

Or connect via GitHub:
- Go to [netlify.com](https://netlify.com)
- Import your GitHub repository
- Build settings:
  - Base directory: `frontend`
  - Build command: `npm run build`
  - Publish directory: `frontend/dist`

### GitHub Pages

1. **Install gh-pages**:
   ```bash
   cd frontend
   npm install --save-dev gh-pages
   ```

2. **Update package.json**:
   ```json
   {
     "homepage": "https://yourusername.github.io/cs182-blue-team",
     "scripts": {
       "predeploy": "npm run build",
       "deploy": "gh-pages -d dist"
     }
   }
   ```

3. **Update vite.config.js**:
   ```javascript
   export default defineConfig({
     base: '/cs182-blue-team/',
     // ... rest of config
   })
   ```

4. **Deploy**:
   ```bash
   npm run deploy
   ```

### Static File Hosting (Any Provider)

1. **Build the project**:
   ```bash
   cd frontend
   npm run build
   ```

2. **Upload contents of `dist/` folder** to your hosting provider:
   - AWS S3 + CloudFront
   - Google Cloud Storage
   - Azure Static Web Apps
   - Any static file host

## Environment Variables in Production

### Vercel Environment Variables

1. Go to your project settings on Vercel
2. Navigate to "Environment Variables"
3. Add variables:
   - `ED_API_TOKEN` (if needed for future updates)
   - `OPENAI_API_KEY` (if needed)

**Note**: For static deployment, data is pre-generated, so API keys aren't needed at runtime.

## Custom Domain

### Vercel Custom Domain

1. Go to project settings → Domains
2. Add your domain (e.g., `cs182-blue-team.com`)
3. Follow DNS configuration instructions
4. Vercel provides automatic HTTPS

### DNS Configuration Example

Add these DNS records at your domain registrar:

```
Type: CNAME
Name: www
Value: cname.vercel-dns.com

Type: A
Name: @
Value: 76.76.21.21
```

## Post-Deployment Checklist

After deploying, verify:

- [ ] All pages load correctly
- [ ] Data displays properly on Dashboard
- [ ] Search functionality works
- [ ] Charts render correctly
- [ ] Browse page shows all posts
- [ ] Analytics page displays insights
- [ ] Compare page allows model selection
- [ ] Links to Ed posts work
- [ ] Mobile responsiveness works
- [ ] No console errors (press F12)

## Updating Your Deployment

### Update Data

```bash
# Run pipeline to get fresh data
./scripts/run_pipeline.sh

# Commit new data
git add frontend/public/data/
git commit -m "Update data"
git push

# Vercel will auto-deploy if connected to GitHub
# Or manually: vercel --prod
```

### Update Code

```bash
# Make your changes
# Test locally: cd frontend && npm run dev

# Commit changes
git add .
git commit -m "Description of changes"
git push

# Auto-deploys if using GitHub integration
```

## Rollback

### Vercel Rollback

1. Go to Vercel dashboard
2. Navigate to "Deployments"
3. Find previous successful deployment
4. Click "..." → "Promote to Production"

### Manual Rollback

```bash
# Revert to previous commit
git revert HEAD
git push

# Or reset to specific commit
git reset --hard <commit-hash>
git push --force  # Use with caution!
```

## Performance Optimization

### Before deploying, optimize:

1. **Minify assets** (Vite does this automatically)
2. **Check bundle size**:
   ```bash
   cd frontend
   npm run build
   # Check dist/ size
   ```

3. **Enable compression** (Vercel does this automatically)

4. **Add caching headers** (configured in `vercel.json`)

## Monitoring

### Vercel Analytics

- Enable Vercel Analytics in project settings
- View page views, performance metrics

### Custom Analytics

Add to `frontend/index.html` before `</head>`:

```html
<!-- Google Analytics example -->
<script async src="https://www.googletagmanager.com/gtag/js?id=YOUR-ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'YOUR-ID');
</script>
```

## Troubleshooting Deployment

### Build Fails

```bash
# Check build locally first
cd frontend
npm run build

# If successful, deployment should work
```

### 404 Errors on Refresh

Ensure `vercel.json` has rewrite rules:
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

### Data Not Loading

1. Check data files are in `frontend/public/data/`
2. Verify files are committed to git
3. Check browser console for fetch errors
4. Ensure file paths are correct (case-sensitive!)

### Large Deployment Size

If deployment is too large:
1. Check `node_modules` isn't included (should be in `.gitignore`)
2. Limit data file sizes
3. Use `.vercelignore` to exclude unnecessary files

## Security Best Practices

1. **Don't commit API keys** to the repository
2. **Use environment variables** for sensitive data
3. **Keep dependencies updated**:
   ```bash
   npm audit
   npm audit fix
   ```
4. **Enable HTTPS** (automatic with Vercel)
5. **Add security headers** in `vercel.json`

## Cost Considerations

### Vercel Free Tier Limits
- 100 GB bandwidth/month
- Unlimited sites
- Automatic HTTPS

If you exceed limits, consider:
- Optimize assets
- Use CDN for data files
- Upgrade to Pro plan ($20/mo)

---

**Deployment Complete!** 🚀 Your CS182 Blue Team site is now live!

For issues, refer to:
- [Vercel Documentation](https://vercel.com/docs)
- [Vite Deployment Guide](https://vitejs.dev/guide/static-deploy.html)
- Project README.md