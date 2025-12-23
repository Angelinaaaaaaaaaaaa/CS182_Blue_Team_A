import { useState, useMemo } from 'react'
import { Radar } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
} from 'chart.js'

ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
)

function Compare({ data, analytics }) {
  const [selectedModel1, setSelectedModel1] = useState('')
  const [selectedModel2, setSelectedModel2] = useState('')
  const [selectedHomework, setSelectedHomework] = useState('all')

  // Extract unique models and homeworks
  const { models, homeworks } = useMemo(() => {
    const modelSet = new Set()
    const homeworkSet = new Set()

    data.forEach(post => {
      modelSet.add(post.model)
      homeworkSet.add(post.homework)
    })

    return {
      models: Array.from(modelSet).sort(),
      homeworks: Array.from(homeworkSet).sort((a, b) => {
        const numA = parseInt(a.replace(/\D/g, '')) || 0
        const numB = parseInt(b.replace(/\D/g, '')) || 0
        return numA - numB
      })
    }
  }, [data])

  // Get comparison data
  const comparisonData = useMemo(() => {
    if (!selectedModel1 && !selectedModel2) return null

    const model1Posts = data.filter(post =>
      post.model === selectedModel1 &&
      (selectedHomework === 'all' || post.homework === selectedHomework)
    )

    const model2Posts = data.filter(post =>
      post.model === selectedModel2 &&
      (selectedHomework === 'all' || post.homework === selectedHomework)
    )

    // Calculate statistics
    const getStats = (posts) => ({
      totalPosts: posts.length,
      avgLikes: posts.length > 0
        ? posts.reduce((sum, p) => sum + (p.likes || 0), 0) / posts.length
        : 0,
      avgComments: posts.length > 0
        ? posts.reduce((sum, p) => sum + (p.comments || 0), 0) / posts.length
        : 0,
      uniqueAuthors: new Set(posts.map(p => p.author)).size,
      homeworksCovered: new Set(posts.map(p => p.homework)).size
    })

    return {
      model1: {
        name: selectedModel1,
        posts: model1Posts,
        stats: getStats(model1Posts)
      },
      model2: {
        name: selectedModel2,
        posts: model2Posts,
        stats: getStats(model2Posts)
      }
    }
  }, [selectedModel1, selectedModel2, selectedHomework, data])

  // Radar chart data
  const radarData = useMemo(() => {
    if (!comparisonData) return null

    const normalize = (value, max) => max > 0 ? (value / max) * 100 : 0

    const maxPosts = Math.max(
      comparisonData.model1.stats.totalPosts,
      comparisonData.model2.stats.totalPosts
    )
    const maxLikes = Math.max(
      comparisonData.model1.stats.avgLikes,
      comparisonData.model2.stats.avgLikes
    )
    const maxComments = Math.max(
      comparisonData.model1.stats.avgComments,
      comparisonData.model2.stats.avgComments
    )
    const maxAuthors = Math.max(
      comparisonData.model1.stats.uniqueAuthors,
      comparisonData.model2.stats.uniqueAuthors
    )
    const maxHw = Math.max(
      comparisonData.model1.stats.homeworksCovered,
      comparisonData.model2.stats.homeworksCovered
    )

    return {
      labels: ['Posts', 'Avg Likes', 'Avg Comments', 'Authors', 'HW Coverage'],
      datasets: [
        {
          label: selectedModel1,
          data: [
            normalize(comparisonData.model1.stats.totalPosts, maxPosts),
            normalize(comparisonData.model1.stats.avgLikes, maxLikes),
            normalize(comparisonData.model1.stats.avgComments, maxComments),
            normalize(comparisonData.model1.stats.uniqueAuthors, maxAuthors),
            normalize(comparisonData.model1.stats.homeworksCovered, maxHw)
          ],
          backgroundColor: 'rgba(59, 130, 246, 0.2)',
          borderColor: 'rgb(59, 130, 246)',
          borderWidth: 2,
          pointBackgroundColor: 'rgb(59, 130, 246)',
          pointBorderColor: '#fff',
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: 'rgb(59, 130, 246)'
        },
        {
          label: selectedModel2,
          data: [
            normalize(comparisonData.model2.stats.totalPosts, maxPosts),
            normalize(comparisonData.model2.stats.avgLikes, maxLikes),
            normalize(comparisonData.model2.stats.avgComments, maxComments),
            normalize(comparisonData.model2.stats.uniqueAuthors, maxAuthors),
            normalize(comparisonData.model2.stats.homeworksCovered, maxHw)
          ],
          backgroundColor: 'rgba(139, 92, 246, 0.2)',
          borderColor: 'rgb(139, 92, 246)',
          borderWidth: 2,
          pointBackgroundColor: 'rgb(139, 92, 246)',
          pointBorderColor: '#fff',
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: 'rgb(139, 92, 246)'
        }
      ]
    }
  }, [comparisonData, selectedModel1, selectedModel2])

  const radarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      r: {
        beginAtZero: true,
        max: 100,
        ticks: {
          color: '#94a3b8',
          backdropColor: 'transparent'
        },
        grid: {
          color: '#334155'
        },
        pointLabels: {
          color: '#cbd5e1',
          font: {
            size: 12
          }
        }
      }
    },
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
    }
  }

  return (
    <div className="container compare">
      <div className="fade-in">
        <h2 className="mb-6">Compare Models</h2>

        {/* Model Selection */}
        <div className="card mb-8">
          <h3 className="mb-4">Select Models to Compare</h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '1rem'
          }}>
            <div>
              <label style={{
                display: 'block',
                marginBottom: '0.5rem',
                color: 'var(--text-secondary)',
                fontWeight: '500'
              }}>
                Model 1
              </label>
              <select
                value={selectedModel1}
                onChange={(e) => setSelectedModel1(e.target.value)}
              >
                <option value="">Select a model...</option>
                {models.map(model => (
                  <option key={model} value={model}>{model}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{
                display: 'block',
                marginBottom: '0.5rem',
                color: 'var(--text-secondary)',
                fontWeight: '500'
              }}>
                Model 2
              </label>
              <select
                value={selectedModel2}
                onChange={(e) => setSelectedModel2(e.target.value)}
              >
                <option value="">Select a model...</option>
                {models.map(model => (
                  <option key={model} value={model}>{model}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{
                display: 'block',
                marginBottom: '0.5rem',
                color: 'var(--text-secondary)',
                fontWeight: '500'
              }}>
                Filter by Homework
              </label>
              <select
                value={selectedHomework}
                onChange={(e) => setSelectedHomework(e.target.value)}
              >
                <option value="all">All Homeworks</option>
                {homeworks.map(hw => (
                  <option key={hw} value={hw}>{hw}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Comparison Results */}
        {comparisonData && selectedModel1 && selectedModel2 ? (
          <>
            {/* Radar Chart */}
            <div className="card mb-8">
              <h3 className="mb-4">Performance Comparison</h3>
              <div style={{ height: '500px' }}>
                <Radar data={radarData} options={radarOptions} />
              </div>
            </div>

            {/* Detailed Stats */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '2rem'
            }}>
              {/* Model 1 Stats */}
              <div className="card">
                <h3 className="mb-4" style={{ color: 'rgb(59, 130, 246)' }}>
                  {comparisonData.model1.name}
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <StatItem
                    label="Total Posts"
                    value={comparisonData.model1.stats.totalPosts}
                  />
                  <StatItem
                    label="Unique Authors"
                    value={comparisonData.model1.stats.uniqueAuthors}
                  />
                  <StatItem
                    label="Homeworks Covered"
                    value={comparisonData.model1.stats.homeworksCovered}
                  />
                  <StatItem
                    label="Avg Likes"
                    value={comparisonData.model1.stats.avgLikes.toFixed(1)}
                  />
                  <StatItem
                    label="Avg Comments"
                    value={comparisonData.model1.stats.avgComments.toFixed(1)}
                  />
                </div>
              </div>

              {/* Model 2 Stats */}
              <div className="card">
                <h3 className="mb-4" style={{ color: 'rgb(139, 92, 246)' }}>
                  {comparisonData.model2.name}
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <StatItem
                    label="Total Posts"
                    value={comparisonData.model2.stats.totalPosts}
                  />
                  <StatItem
                    label="Unique Authors"
                    value={comparisonData.model2.stats.uniqueAuthors}
                  />
                  <StatItem
                    label="Homeworks Covered"
                    value={comparisonData.model2.stats.homeworksCovered}
                  />
                  <StatItem
                    label="Avg Likes"
                    value={comparisonData.model2.stats.avgLikes.toFixed(1)}
                  />
                  <StatItem
                    label="Avg Comments"
                    value={comparisonData.model2.stats.avgComments.toFixed(1)}
                  />
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="card text-center p-6">
            <h3 className="text-muted">Select two models to compare</h3>
            <p className="text-secondary">
              Choose models from the dropdowns above to see detailed comparisons
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

function StatItem({ label, value }) {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '0.75rem',
      background: 'var(--bg-secondary)',
      borderRadius: '8px',
      border: '1px solid var(--border)'
    }}>
      <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
      <span style={{ fontWeight: '700', fontSize: '1.25rem', color: 'var(--text-primary)' }}>
        {value}
      </span>
    </div>
  )
}

export default Compare