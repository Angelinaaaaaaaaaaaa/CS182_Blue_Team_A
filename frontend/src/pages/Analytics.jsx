import { useMemo } from 'react'
import { Bar } from 'react-chartjs-2'

function Analytics({ analytics }) {
  // Model-Homework matrix for heatmap visualization
  const modelHwMatrix = useMemo(() => {
    if (!analytics?.statistics?.model_homework_matrix) return null

    const matrix = analytics.statistics.model_homework_matrix
    const models = Object.keys(matrix).slice(0, 10) // Top 10 models
    const allHw = new Set()

    models.forEach(model => {
      Object.keys(matrix[model]).forEach(hw => allHw.add(hw))
    })

    const homeworks = Array.from(allHw).sort((a, b) => {
      const numA = parseInt(a.replace(/\D/g, '')) || 0
      const numB = parseInt(b.replace(/\D/g, '')) || 0
      return numA - numB
    })

    return { models, homeworks, matrix }
  }, [analytics])

  // Timeline data
  const timelineData = useMemo(() => {
    if (!analytics?.statistics?.timeline) return null

    const timeline = analytics.statistics.timeline
    const dates = Object.keys(timeline).sort()
    const counts = dates.map(date => timeline[date])

    return {
      labels: dates.map(date => {
        const d = new Date(date)
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      }),
      datasets: [{
        label: 'Posts per Day',
        data: counts,
        backgroundColor: 'rgba(59, 130, 246, 0.2)',
        borderColor: 'rgb(59, 130, 246)',
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
        labels: { color: '#cbd5e1' }
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

  return (
    <div className="container analytics">
      <div className="fade-in">
        <h2 className="mb-6">Advanced Analytics</h2>

        {/* Timeline */}
        {timelineData && (
          <div className="card mb-8">
            <h3 className="mb-4">Submission Timeline</h3>
            <div style={{ height: '300px' }}>
              <Bar data={timelineData} options={chartOptions} />
            </div>
          </div>
        )}

        {/* Model-Homework Heatmap */}
        {modelHwMatrix && (
          <div className="card mb-8">
            <h3 className="mb-4">Model × Homework Coverage Matrix</h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '0.875rem'
              }}>
                <thead>
                  <tr>
                    <th style={{
                      padding: '0.75rem',
                      background: 'var(--bg-tertiary)',
                      borderBottom: '2px solid var(--border)',
                      textAlign: 'left',
                      position: 'sticky',
                      left: 0,
                      zIndex: 1
                    }}>
                      Model
                    </th>
                    {modelHwMatrix.homeworks.map(hw => (
                      <th key={hw} style={{
                        padding: '0.75rem',
                        background: 'var(--bg-tertiary)',
                        borderBottom: '2px solid var(--border)',
                        textAlign: 'center'
                      }}>
                        {hw}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {modelHwMatrix.models.map(model => (
                    <tr key={model}>
                      <td style={{
                        padding: '0.75rem',
                        borderBottom: '1px solid var(--border)',
                        fontWeight: '600',
                        background: 'var(--bg-secondary)',
                        position: 'sticky',
                        left: 0
                      }}>
                        {model}
                      </td>
                      {modelHwMatrix.homeworks.map(hw => {
                        const count = modelHwMatrix.matrix[model]?.[hw] || 0
                        const maxCount = Math.max(
                          ...modelHwMatrix.models.map(m =>
                            Math.max(...Object.values(modelHwMatrix.matrix[m] || {}))
                          )
                        )
                        const intensity = count > 0 ? (count / maxCount) : 0

                        return (
                          <td key={hw} style={{
                            padding: '0.75rem',
                            borderBottom: '1px solid var(--border)',
                            textAlign: 'center',
                            background: count > 0
                              ? `rgba(59, 130, 246, ${0.2 + intensity * 0.6})`
                              : 'transparent',
                            fontWeight: count > 0 ? '600' : 'normal'
                          }}>
                            {count || '-'}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}

export default Analytics