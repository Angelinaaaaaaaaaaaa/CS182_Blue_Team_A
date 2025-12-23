import { useState, useMemo } from 'react'

function Insights({ data, advancedAnalytics }) {
  const [selectedHW, setSelectedHW] = useState(null)
  const [selectedModel, setSelectedModel] = useState(null)
  const [sortBy, setSortBy] = useState('count')

  // Get heatmap data
  const heatmapData = advancedAnalytics?.heatmap

  // Get drill-down data for selected HW×Model
  const drillDownData = useMemo(() => {
    if (!selectedHW || !selectedModel || !advancedAnalytics?.hw_model_analysis) {
      return null
    }

    return advancedAnalytics.hw_model_analysis[selectedHW]?.[selectedModel]
  }, [selectedHW, selectedModel, advancedAnalytics])

  // Sort homeworks and models for heatmap
  const sortedHWs = useMemo(() => {
    if (!heatmapData?.homeworks) return []
    return [...heatmapData.homeworks].sort((a, b) => {
      const numA = parseInt(a.replace(/\D/g, '')) || 0
      const numB = parseInt(b.replace(/\D/g, '')) || 0
      return numA - numB
    })
  }, [heatmapData])

  const sortedModels = useMemo(() => {
    if (!heatmapData?.models) return []

    const models = [...heatmapData.models]

    if (sortBy === 'name') {
      return models.sort()
    } else if (sortBy === 'count') {
      // Sort by total post count
      return models.sort((a, b) => {
        const countA = sortedHWs.reduce((sum, hw) =>
          sum + (heatmapData.matrix[hw]?.[a] || 0), 0)
        const countB = sortedHWs.reduce((sum, hw) =>
          sum + (heatmapData.matrix[hw]?.[b] || 0), 0)
        return countB - countA
      })
    }
    return models
  }, [heatmapData, sortedHWs, sortBy])

  // Get max value for color scaling
  const maxValue = useMemo(() => {
    if (!heatmapData?.matrix) return 0
    let max = 0
    Object.values(heatmapData.matrix).forEach(row => {
      Object.values(row).forEach(val => {
        if (val > max) max = val
      })
    })
    return max
  }, [heatmapData])

  // Get cell color based on value
  const getCellColor = (value) => {
    if (!value || maxValue === 0) return 'transparent'
    const intensity = value / maxValue
    return `rgba(59, 130, 246, ${0.2 + intensity * 0.7})`
  }

  // Get cell text color
  const getTextColor = (value) => {
    if (!value || maxValue === 0) return 'var(--text-muted)'
    const intensity = value / maxValue
    return intensity > 0.5 ? '#fff' : 'var(--text-primary)'
  }

  if (!advancedAnalytics) {
    return (
      <div className="container">
        <div className="card text-center p-6">
          <h2 className="text-muted">No Advanced Analytics Available</h2>
          <p className="text-secondary mt-2">
            Run advanced analytics: <code>python backend/advanced_analytics.py</code>
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="container insights-page">
      <div className="fade-in">
        <div className="page-header mb-6">
          <h2>Advanced Insights</h2>
          <p className="text-secondary">
            TF-IDF analysis • Strength/Weakness extraction • Representative posts
          </p>
        </div>

        {/* HW × Model Heatmap */}
        <div className="card mb-8">
          <div className="card-header">
            <h3>HW × Model Coverage Heatmap</h3>
            <div className="controls">
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                <option value="count">Sort by Post Count</option>
                <option value="name">Sort by Name</option>
              </select>
            </div>
          </div>

          <div className="heatmap-container">
            <div className="heatmap-scroll">
              <table className="heatmap-table">
                <thead>
                  <tr>
                    <th className="sticky-col">Model</th>
                    {sortedHWs.map(hw => (
                      <th key={hw} className="hw-col">{hw}</th>
                    ))}
                    <th className="total-col">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedModels.map(model => {
                    const total = sortedHWs.reduce((sum, hw) =>
                      sum + (heatmapData.matrix[hw]?.[model] || 0), 0)

                    return (
                      <tr key={model}>
                        <td className="sticky-col model-name">{model}</td>
                        {sortedHWs.map(hw => {
                          const value = heatmapData.matrix[hw]?.[model] || 0
                          const isSelected = selectedHW === hw && selectedModel === model

                          return (
                            <td
                              key={hw}
                              className={`heatmap-cell ${isSelected ? 'selected' : ''} ${value > 0 ? 'clickable' : ''}`}
                              style={{
                                background: getCellColor(value),
                                color: getTextColor(value),
                                cursor: value > 0 ? 'pointer' : 'default'
                              }}
                              onClick={() => {
                                if (value > 0) {
                                  setSelectedHW(hw)
                                  setSelectedModel(model)
                                }
                              }}
                              title={value > 0 ? `Click to view details for ${model} on ${hw}` : 'No posts'}
                            >
                              {value || '-'}
                            </td>
                          )
                        })}
                        <td className="total-col">{total}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <p className="text-muted text-center mt-3" style={{ fontSize: '0.875rem' }}>
              💡 Click on any cell with posts to see detailed analysis
            </p>
          </div>
        </div>

        {/* Drill-Down View */}
        {drillDownData && (
          <div className="card mb-8 drill-down-card">
            <div className="card-header">
              <h3>
                {selectedModel} on {selectedHW}
                <span className="count-badge">{drillDownData.post_count} posts</span>
              </h3>
              <button
                className="close-btn"
                onClick={() => {
                  setSelectedHW(null)
                  setSelectedModel(null)
                }}
              >
                ✕
              </button>
            </div>

            <div className="drill-down-content">
              {/* Top Terms */}
              {drillDownData.top_terms && drillDownData.top_terms.length > 0 && (
                <div className="insight-section">
                  <h4>🔑 Top Terms (TF-IDF)</h4>
                  <div className="terms-cloud">
                    {drillDownData.top_terms.map((term, idx) => (
                      <span
                        key={idx}
                        className="term-badge"
                        style={{
                          fontSize: `${0.875 + term.score * 2}rem`,
                          opacity: 0.6 + term.score * 10
                        }}
                      >
                        {term.term}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Strengths */}
              {drillDownData.strengths && drillDownData.strengths.length > 0 && (
                <div className="insight-section">
                  <h4>✅ Strengths Mentioned</h4>
                  <div className="mentions-list">
                    {drillDownData.strengths.map((strength, idx) => (
                      <div key={idx} className="mention-item strength">
                        <span className="icon">💪</span>
                        <span className="text">{strength}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Weaknesses */}
              {drillDownData.weaknesses && drillDownData.weaknesses.length > 0 && (
                <div className="insight-section">
                  <h4>⚠️ Weaknesses Mentioned</h4>
                  <div className="mentions-list">
                    {drillDownData.weaknesses.map((weakness, idx) => (
                      <div key={idx} className="mention-item weakness">
                        <span className="icon">⚡</span>
                        <span className="text">{weakness}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Representative Posts */}
              {drillDownData.representative_posts && drillDownData.representative_posts.length > 0 && (
                <div className="insight-section">
                  <h4>📌 Representative Posts</h4>
                  <div className="rep-posts-list">
                    {drillDownData.representative_posts.map((post, idx) => (
                      <div key={idx} className="rep-post-card">
                        <div className="rep-post-header">
                          <span className="rep-post-title">{post.title}</span>
                          <span className="rep-post-author">by {post.author}</span>
                        </div>
                        <p className="rep-post-snippet">{post.snippet}</p>
                        <a
                          href={post.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rep-post-link"
                        >
                          View on Ed →
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Global Top Terms */}
        {advancedAnalytics.statistics?.global_top_terms && (
          <div className="card">
            <h3 className="mb-4">🌍 Global Top Terms</h3>
            <div className="terms-cloud large">
              {advancedAnalytics.statistics.global_top_terms.slice(0, 30).map((term, idx) => (
                <span
                  key={idx}
                  className="term-badge global"
                  style={{
                    fontSize: `${0.75 + term.frequency * 4}rem`,
                    opacity: 0.5 + term.frequency * 15
                  }}
                >
                  {term.term}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Insights