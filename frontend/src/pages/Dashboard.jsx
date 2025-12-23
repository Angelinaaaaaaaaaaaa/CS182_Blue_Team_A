import { useMemo } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'
import { Bar, Pie, Line } from 'react-chartjs-2'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

function Dashboard({ data, analytics, advancedAnalytics }) {
  const stats = useMemo(() => {
    // Calculate stats from data directly if analytics not available
    if (!data || data.length === 0) {
      return {
        totalPosts: 0,
        totalAuthors: 0,
        totalModels: 0,
        totalHomeworks: 0
      }
    }

    if (analytics?.statistics) {
      return {
        totalPosts: analytics.statistics.total_posts,
        totalAuthors: analytics.statistics.total_authors,
        totalModels: Object.keys(analytics.statistics.models || {}).length,
        totalHomeworks: Object.keys(analytics.statistics.homeworks || {}).length
      }
    }

    // Fallback: calculate from data
    return {
      totalPosts: data.length,
      totalAuthors: new Set(data.map(p => p.author)).size,
      totalModels: new Set(data.map(p => p.model)).size,
      totalHomeworks: new Set(data.map(p => p.homework)).size
    }
  }, [data, analytics])

  const modelChartData = useMemo(() => {
    if (!analytics?.statistics?.models) return null

    const models = analytics.statistics.models
    const sortedModels = Object.entries(models)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)

    return {
      labels: sortedModels.map(([name]) => name),
      datasets: [{
        label: 'Number of Posts',
        data: sortedModels.map(([, count]) => count),
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(139, 92, 246, 0.8)',
          'rgba(236, 72, 153, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(239, 68, 68, 0.8)',
          'rgba(99, 102, 241, 0.8)',
          'rgba(168, 85, 247, 0.8)',
          'rgba(251, 146, 60, 0.8)',
          'rgba(34, 197, 94, 0.8)'
        ],
        borderColor: [
          'rgb(59, 130, 246)',
          'rgb(139, 92, 246)',
          'rgb(236, 72, 153)',
          'rgb(16, 185, 129)',
          'rgb(245, 158, 11)',
          'rgb(239, 68, 68)',
          'rgb(99, 102, 241)',
          'rgb(168, 85, 247)',
          'rgb(251, 146, 60)',
          'rgb(34, 197, 94)'
        ],
        borderWidth: 2
      }]
    }
  }, [analytics])

  const homeworkChartData = useMemo(() => {
    if (!analytics?.statistics?.homeworks) return null

    const homeworks = analytics.statistics.homeworks
    const sortedHw = Object.entries(homeworks).sort((a, b) => {
      const numA = parseInt(a[0].replace(/\D/g, '')) || 0
      const numB = parseInt(b[0].replace(/\D/g, '')) || 0
      return numA - numB
    })

    return {
      labels: sortedHw.map(([name]) => name),
      datasets: [{
        label: 'Number of Posts',
        data: sortedHw.map(([, count]) => count),
        backgroundColor: 'rgba(139, 92, 246, 0.2)',
        borderColor: 'rgb(139, 92, 246)',
        borderWidth: 2,
        fill: true,
        tension: 0.4
      }]
    }
  }, [analytics])

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: '#cbd5e1'
        }
      },
      tooltip: {
        backgroundColor: 'rgba(30, 41, 59, 0.9)',
        titleColor: '#f1f5f9',
        bodyColor: '#cbd5e1',
        borderColor: '#475569',
        borderWidth: 1
      }
    },
    scales: {
      x: {
        ticks: { color: '#94a3b8' },
        grid: { color: '#334155' }
      },
      y: {
        ticks: { color: '#94a3b8' },
        grid: { color: '#334155' }
      }
    }
  }

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: {
          color: '#cbd5e1',
          padding: 15
        }
      },
      tooltip: {
        backgroundColor: 'rgba(30, 41, 59, 0.9)',
        titleColor: '#f1f5f9',
        bodyColor: '#cbd5e1',
        borderColor: '#475569',
        borderWidth: 1
      }
    }
  }

  if (!stats) {
    return <div className="container">Loading dashboard...</div>
  }

  return (
    <div className="container dashboard">
      <div className="fade-in">
        <h2 className="mb-6">Overview</h2>

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">📝</div>
            <div className="stat-value">{stats.totalPosts}</div>
            <div className="stat-label">Total Posts</div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">👥</div>
            <div className="stat-value">{stats.totalAuthors}</div>
            <div className="stat-label">Contributors</div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">🤖</div>
            <div className="stat-value">{stats.totalModels}</div>
            <div className="stat-label">Models Tested</div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">📚</div>
            <div className="stat-value">{stats.totalHomeworks}</div>
            <div className="stat-label">Homeworks Covered</div>
          </div>
        </div>

        {/* Model Comparison - MOVED TO TOP */}
        {analytics?.insights?.model_comparison && Object.keys(analytics.insights.model_comparison).length > 0 && (
          <div className="insights-section mt-8" style={{ background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(139, 92, 246, 0.1))' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ margin: 0 }}>🏆 Model Comparison - Strengths & Weaknesses</h3>
            </div>
            <div className="model-comparison-grid">
              {Object.entries(analytics.insights.model_comparison)
                .filter(([model]) => model !== 'Unknown')
                .sort((a, b) => b[1].total_homeworks - a[1].total_homeworks)
                .slice(0, 6)
                .map(([model, insights]) => (
                  <div key={model} className="model-insight-card-enhanced">
                    <div className="model-card-header">
                      <h4 className="model-name">{model}</h4>
                      <span className="model-badge">{insights.total_homeworks} HWs</span>
                    </div>
                    <p className="model-summary">{insights.summary}</p>

                    <div className="pros-cons-container">
                      {insights.strengths && insights.strengths.length > 0 && (
                        <div className="pros-section">
                          <div className="section-header">
                            <span className="icon">✓</span>
                            <strong>Strengths</strong>
                          </div>
                          <ul className="insight-list-compact">
                            {insights.strengths.slice(0, 3).map((strength, idx) => (
                              <li key={idx}>{strength}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {insights.weaknesses && insights.weaknesses.length > 0 && (
                        <div className="cons-section">
                          <div className="section-header">
                            <span className="icon">✗</span>
                            <strong>Weaknesses</strong>
                          </div>
                          <ul className="insight-list-compact">
                            {insights.weaknesses.slice(0, 3).map((weakness, idx) => (
                              <li key={idx}>{weakness}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    {insights.homeworks_tested && insights.homeworks_tested.length > 0 && (
                      <div className="mt-3 hw-tags">
                        {insights.homeworks_tested.map((hw, idx) => (
                          <span key={idx} className="hw-tag">{hw}</span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Charts */}
        <div className="charts-grid">
          {modelChartData && (
            <div className="chart-card">
              <h3>Top Models by Post Count</h3>
              <div style={{ height: '400px' }}>
                <Bar data={modelChartData} options={chartOptions} />
              </div>
            </div>
          )}

          {modelChartData && (
            <div className="chart-card">
              <h3>Model Distribution</h3>
              <div style={{ height: '400px' }}>
                <Pie data={modelChartData} options={pieOptions} />
              </div>
            </div>
          )}

          {homeworkChartData && (
            <div className="chart-card">
              <h3>Posts by Homework Assignment</h3>
              <div style={{ height: '400px' }}>
                <Line data={homeworkChartData} options={chartOptions} />
              </div>
            </div>
          )}
        </div>

        {/* Key Findings - MOVED TO BOTTOM */}
        {analytics?.insights?.key_findings && (
          <div className="insights-section mt-8">
            <h3 className="mb-4">📌 Key Findings</h3>
            <div style={{ display: 'grid', gap: '0.75rem' }}>
              {analytics.insights.key_findings.map((finding, idx) => (
                <div key={idx} className="insight-item-minimal">
                  <span className="finding-icon">•</span>
                  <p className="mb-0">{finding}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Dashboard