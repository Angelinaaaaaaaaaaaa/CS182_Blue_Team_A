import { useState, useEffect } from 'react'
import Dashboard from './pages/Dashboard'
import Browse from './pages/Browse'
import Analytics from './pages/Analytics'
import Insights from './pages/Insights'
import Header from './components/Header'
import './styles/App.css'

function App() {
  const [currentPage, setCurrentPage] = useState('dashboard')
  const [data, setData] = useState([])
  const [analytics, setAnalytics] = useState(null)
  const [advancedAnalytics, setAdvancedAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Use base URL for GitHub Pages compatibility
      const baseUrl = import.meta.env.BASE_URL

      // Load main data with better error handling
      const dataResponse = await fetch(`${baseUrl}data/special_participation_a.json`)
      if (!dataResponse.ok) {
        throw new Error(`Failed to load data: ${dataResponse.status}`)
      }
      const jsonData = await dataResponse.json()
      setData(Array.isArray(jsonData) ? jsonData : [])

      // Load basic analytics (optional)
      try {
        const analyticsResponse = await fetch(`${baseUrl}data/analytics.json`)
        if (analyticsResponse.ok) {
          const analyticsData = await analyticsResponse.json()
          setAnalytics(analyticsData)
        }
      } catch (err) {
        console.warn('Analytics not available:', err)
      }

      // Load advanced analytics (optional)
      try {
        const advancedResponse = await fetch(`${baseUrl}data/advanced_analytics.json`)
        if (advancedResponse.ok) {
          const advancedData = await advancedResponse.json()
          setAdvancedAnalytics(advancedData)
        }
      } catch (err) {
        console.warn('Advanced analytics not available:', err)
      }

    } catch (error) {
      console.error('Error loading data:', error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const pages = {
    dashboard: <Dashboard data={data} analytics={analytics} advancedAnalytics={advancedAnalytics} />,
    browse: <Browse data={data} />,
    analytics: <Analytics data={data} analytics={analytics} />,
    insights: <Insights data={data} advancedAnalytics={advancedAnalytics} analytics={analytics} />
  }

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-content">
          <div className="spinner-large"></div>
          <h2 className="mt-6">Loading CS182 Blue Team Archive</h2>
          <p className="text-secondary mt-2">Fetching participation data...</p>
          <div className="loading-dots mt-4">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="error-container">
        <div className="error-content">
          <div className="error-icon">⚠️</div>
          <h2 className="mt-4">Failed to Load Data</h2>
          <p className="text-secondary mt-2">{error}</p>
          <p className="text-muted mt-2" style={{ fontSize: '0.875rem' }}>
            Make sure data files are in <code>frontend/public/data/</code>
          </p>
          <button onClick={loadData} className="mt-6" style={{ padding: '0.75rem 2rem' }}>
            🔄 Retry
          </button>
        </div>
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="error-container">
        <div className="error-content">
          <div className="error-icon">📭</div>
          <h2 className="mt-4">No Data Available</h2>
          <p className="text-secondary mt-2">No posts found in the dataset</p>
          <p className="text-muted mt-2" style={{ fontSize: '0.875rem' }}>
            Run: <code>./scripts/run_pipeline.sh</code>
          </p>
          <button onClick={loadData} className="mt-6" style={{ padding: '0.75rem 2rem' }}>
            🔄 Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="app">
      <Header currentPage={currentPage} setCurrentPage={setCurrentPage} dataCount={data.length} />
      <main className="main-content">
        {pages[currentPage]}
      </main>
      <footer className="footer">
        <div className="container">
          <div className="footer-content">
            <div>
              <p className="text-muted">CS182 Blue Team - Enhanced Special Participation A Archive</p>
              <p className="text-muted" style={{ fontSize: '0.875rem', marginTop: '0.25rem' }}>
                Advanced analytics • TF-IDF insights • Deterministic clustering • 📱 Mobile-optimized
              </p>
            </div>
            <div className="footer-stats">
              <span className="stat-badge">📊 {data.length} Posts</span>
              <span className="stat-badge">🤖 {new Set(data.map(p => p.model)).size} Models</span>
              <span className="stat-badge">📚 {new Set(data.map(p => p.homework)).size} Assignments</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App