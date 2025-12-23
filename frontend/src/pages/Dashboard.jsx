import { useEffect, useMemo, useState } from 'react'
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
  // ----------------------------
  // Stats
  // ----------------------------
  const stats = useMemo(() => {
    if (!data || data.length === 0) {
      return { totalPosts: 0, totalAuthors: 0, totalModels: 0, totalHomeworks: 0 }
    }

    if (analytics?.statistics) {
      return {
        totalPosts: analytics.statistics.total_posts,
        totalAuthors: analytics.statistics.total_authors,
        totalModels: Object.keys(analytics.statistics.models || {}).length,
        totalHomeworks: Object.keys(analytics.statistics.homeworks || {}).length
      }
    }

    return {
      totalPosts: data.length,
      totalAuthors: new Set(data.map(p => p.author)).size,
      totalModels: new Set(data.map(p => p.model)).size,
      totalHomeworks: new Set(data.map(p => p.homework)).size
    }
  }, [data, analytics])

  // ----------------------------
  // Charts (unchanged)
  // ----------------------------
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
      legend: { labels: { color: '#cbd5e1' } },
      tooltip: {
        backgroundColor: 'rgba(30, 41, 59, 0.9)',
        titleColor: '#f1f5f9',
        bodyColor: '#cbd5e1',
        borderColor: '#475569',
        borderWidth: 1
      }
    },
    scales: {
      x: { ticks: { color: '#94a3b8' }, grid: { color: '#334155' } },
      y: { ticks: { color: '#94a3b8' }, grid: { color: '#334155' } }
    }
  }

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'right', labels: { color: '#cbd5e1', padding: 15 } },
      tooltip: {
        backgroundColor: 'rgba(30, 41, 59, 0.9)',
        titleColor: '#f1f5f9',
        bodyColor: '#cbd5e1',
        borderColor: '#475569',
        borderWidth: 1
      }
    }
  }

  // ----------------------------
  // NEW: Evidence aggregation for model cards
  // Priority:
  // 1) analytics.insights.model_comparison (if it already contains strengths/weaknesses)
  // 2) else aggregate from advancedAnalytics.hw_model_analysis
  // ----------------------------
  const evidenceByModel = useMemo(() => {
    const out = {}

    // 1) If analytics already provides evidence
    const mc = analytics?.insights?.model_comparison
    if (mc && typeof mc === 'object' && Object.keys(mc).length > 0) {
      for (const [model, obj] of Object.entries(mc)) {
        if (!obj) continue
        out[model] = {
          model,
          total_homeworks: obj.total_homeworks ?? (obj.homeworks_tested?.length || 0),
          homeworks_tested: obj.homeworks_tested || [],
          post_count: obj.post_count ?? null,
          strengths: obj.strengths || [],
          weaknesses: obj.weaknesses || [],
          distinctive_terms: obj.distinctive_terms || [],
          summary: obj.summary || null,
        }
      }
      // if we have strengths/weaknesses for at least some models, we can use this
      const hasEvidence = Object.values(out).some(x => (x.strengths?.length || 0) + (x.weaknesses?.length || 0) > 0)
      if (hasEvidence) return out
    }

    // 2) Otherwise aggregate from advancedAnalytics
    const hma = advancedAnalytics?.hw_model_analysis
    if (!hma) return out

    for (const [hw, modelsObj] of Object.entries(hma)) {
      for (const [model, cell] of Object.entries(modelsObj || {})) {
        if (!cell) continue
        if (!out[model]) {
          out[model] = {
            model,
            total_homeworks: 0,
            homeworks_tested: [],
            post_count: 0,
            strengths: [],
            weaknesses: [],
            distinctive_terms: [], // from top_terms
            summary: null
          }
        }
        const cur = out[model]
        const pc = cell.post_count || 0
        if (pc > 0) {
          cur.total_homeworks += 1
          cur.homeworks_tested.push(hw)
          cur.post_count += pc
        }
        if (Array.isArray(cell.strengths)) cur.strengths.push(...cell.strengths)
        if (Array.isArray(cell.weaknesses)) cur.weaknesses.push(...cell.weaknesses)
        if (Array.isArray(cell.top_terms)) cur.distinctive_terms.push(...cell.top_terms.map(t => t.term).filter(Boolean))
      }
    }

    // Dedup + truncate for readability
    for (const k of Object.keys(out)) {
      out[k].strengths = dedupStrings(out[k].strengths).slice(0, 12)
      out[k].weaknesses = dedupStrings(out[k].weaknesses).slice(0, 12)
      out[k].distinctive_terms = dedupStrings(out[k].distinctive_terms).slice(0, 12)
      out[k].homeworks_tested = dedupStrings(out[k].homeworks_tested).sort((a, b) => {
        const na = parseInt(String(a).replace(/\D/g, '')) || 0
        const nb = parseInt(String(b).replace(/\D/g, '')) || 0
        return na - nb
      })
      out[k].total_homeworks = out[k].homeworks_tested.length
    }

    return out
  }, [analytics, advancedAnalytics])

  const topModelsForCards = useMemo(() => {
    const entries = Object.entries(evidenceByModel || {})
      .filter(([m]) => m && m !== 'Unknown')
      .map(([, v]) => v)

    // Prefer most-tested (by #HWs), break ties by post_count
    entries.sort((a, b) => {
      const da = a.total_homeworks || 0
      const db = b.total_homeworks || 0
      if (db !== da) return db - da
      return (b.post_count || 0) - (a.post_count || 0)
    })

    return entries.slice(0, 6)
  }, [evidenceByModel])

  // ----------------------------
  // NEW: Better comparisons (same HW, Model A vs B) using advancedAnalytics
  // ----------------------------
  const heatmapData = advancedAnalytics?.heatmap
  const sortedHWs = useMemo(() => {
    if (!heatmapData?.homeworks) return []
    return [...heatmapData.homeworks].sort((a, b) => {
      const na = parseInt(String(a).replace(/\D/g, '')) || 0
      const nb = parseInt(String(b).replace(/\D/g, '')) || 0
      return na - nb
    })
  }, [heatmapData])

  const sortedModels = useMemo(() => {
    if (!heatmapData?.models) return []
    return [...heatmapData.models].sort()
  }, [heatmapData])

  const [compareHW, setCompareHW] = useState(null)
  const [compareA, setCompareA] = useState(null)
  const [compareB, setCompareB] = useState(null)

  useEffect(() => {
    if (!sortedHWs.length || !sortedModels.length) return
    if (!compareHW) setCompareHW(sortedHWs[0])
    if (!compareA) setCompareA(sortedModels[0])
    if (!compareB) setCompareB(sortedModels[1] || sortedModels[0])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortedHWs.join('|'), sortedModels.join('|')])

  const getHwModelData = (hw, model) => {
    if (!hw || !model || !advancedAnalytics?.hw_model_analysis) return null
    return advancedAnalytics.hw_model_analysis[hw]?.[model] || null
  }

  const compareDataA = useMemo(() => getHwModelData(compareHW, compareA), [compareHW, compareA, advancedAnalytics])
  const compareDataB = useMemo(() => getHwModelData(compareHW, compareB), [compareHW, compareB, advancedAnalytics])

  const compareStrengths = useMemo(() => uniqueAndOverlap(compareDataA?.strengths || [], compareDataB?.strengths || []), [compareDataA, compareDataB])
  const compareWeaknesses = useMemo(() => uniqueAndOverlap(compareDataA?.weaknesses || [], compareDataB?.weaknesses || []), [compareDataA, compareDataB])

  // ----------------------------
  // NEW: Optional AI 1-liners (BYO key)
  // ----------------------------
  const [aiEnabled, setAiEnabled] = useState(false)
  const [apiKey, setApiKey] = useState('')
  const [aiModel, setAiModel] = useState('gpt-4o')
  const [aiBusyKey, setAiBusyKey] = useState(null)
  const [aiError, setAiError] = useState(null)
  const [aiCache, setAiCache] = useState({}) // { cacheKey: { pro, con } }

  useEffect(() => {
    try {
      const savedEnabled = localStorage.getItem('cs182_ai_enabled')
      const savedKey = localStorage.getItem('cs182_openai_key')
      const savedModel = localStorage.getItem('cs182_openai_model')
      if (savedEnabled === 'true') setAiEnabled(true)
      if (savedKey) setApiKey(savedKey)
      if (savedModel) setAiModel(savedModel)
    } catch {
      // ignore
    }
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem('cs182_ai_enabled', String(aiEnabled))
      localStorage.setItem('cs182_openai_model', aiModel)
      if (aiEnabled && apiKey) localStorage.setItem('cs182_openai_key', apiKey)
      if (!aiEnabled) localStorage.removeItem('cs182_openai_key')
    } catch {
      // ignore
    }
  }, [aiEnabled, apiKey, aiModel])

  const callOpenAIOneLiners = async ({
    scope, // 'modelCard' | 'compareA' | 'compareB'
    modelName,
    hw,
    postCount,
    topTerms,
    strengths,
    weaknesses
  }) => {
    const cacheKey = `${scope}::${hw || 'ALL'}::${modelName}`
    if (aiCache[cacheKey]) return

    if (!aiEnabled) return
    if (!apiKey || apiKey.trim().length < 10) {
      setAiError('Missing API key (paste your OpenAI API key to enable AI quick takes).')
      return
    }

    setAiError(null)
    setAiBusyKey(cacheKey)

    const prompt = `You are analyzing evidence from CS182 student posts about LLM performance.

Return ONLY valid JSON in this exact format (no markdown, no extra text):
{"pro":"one concrete strength sentence under 25 words","con":"one concrete weakness sentence under 25 words"}

Evidence for ${modelName} on ${hw || 'all homeworks'}:
Posts: ${postCount ?? 0}
Strengths found: ${(strengths || []).slice(0, 5).join(' | ') || 'None mentioned'}
Weaknesses found: ${(weaknesses || []).slice(0, 5).join(' | ') || 'None mentioned'}

Requirements:
- Base pro/con ONLY on the evidence above
- Be specific and concrete (not generic)
- Max 25 words each
- If insufficient evidence, say "Limited evidence suggests..." or "Few posts mention..."
- Return ONLY the JSON object, nothing else`.trim()

    try {
      const resp = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey.trim()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: aiModel,
          messages: [
            { role: 'system', content: 'You are a helpful assistant that returns only valid JSON.' },
            { role: 'user', content: prompt }
          ],
          temperature: 1,
          max_completion_tokens: 150
        })
      })

      if (!resp.ok) {
        const text = await resp.text().catch(() => '')
        console.error('OpenAI API error:', resp.status, text)
        throw new Error(`OpenAI API error (${resp.status}): ${text.slice(0, 300)}`)
      }

      const data = await resp.json()
      const out = (data.choices?.[0]?.message?.content || '').trim()

      if (!out) {
        console.error('Empty response from OpenAI:', data)
        throw new Error('OpenAI returned empty response. Check API key and model name.')
      }

      let parsed = null
      try {
        parsed = JSON.parse(out)
      } catch (parseError) {
        // Try to extract JSON from markdown code blocks or text
        const codeBlockMatch = out.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/)
        const plainMatch = out.match(/\{[\s\S]*?\}/)
        const jsonMatch = codeBlockMatch || plainMatch
        if (jsonMatch) {
          const jsonStr = codeBlockMatch ? jsonMatch[1] : jsonMatch[0]
          try {
            parsed = JSON.parse(jsonStr)
          } catch (e2) {
            console.error('Failed to parse extracted JSON:', jsonStr, e2)
          }
        } else {
          console.error('No JSON found in response:', out)
        }
      }

      if (!parsed?.pro || !parsed?.con) {
        console.error('Invalid response structure:', { parsed, fullResponse: out })
        throw new Error(`Could not parse JSON {pro, con}. Got: "${out.slice(0, 200)}..." - Check console for full response.`)
      }

      setAiCache(prev => ({ ...prev, [cacheKey]: { pro: String(parsed.pro), con: String(parsed.con) } }))
    } catch (e) {
      setAiError(e?.message || 'AI request failed.')
    } finally {
      setAiBusyKey(null)
    }
  }

  if (!stats) return <div className="container">Loading dashboard...</div>

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

        {/* NEW: Optional AI Quick Takes */}
        <div className="insights-section mt-8">
          <h3 className="mb-3">Optional AI Quick Takes (BYO OpenAI Key)</h3>
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            <label style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <input
                type="checkbox"
                checked={aiEnabled}
                onChange={(e) => setAiEnabled(e.target.checked)}
              />
              Enable 1-sentence pro + con for model cards / comparisons
            </label>

            <input
              type="password"
              placeholder="Paste OpenAI API Key (stored locally only if enabled)"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              disabled={!aiEnabled}
              style={{ width: '100%' }}
            />

            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <label style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                Model:
                <input
                  value={aiModel}
                  onChange={(e) => setAiModel(e.target.value)}
                  disabled={!aiEnabled}
                  placeholder="e.g., gpt-4o"
                />
              </label>

              <button
                className="btn"
                onClick={() => {
                  try {
                    localStorage.removeItem('cs182_openai_key')
                    setApiKey('')
                  } catch { /* ignore */ }
                }}
                disabled={!aiEnabled && !apiKey}
              >
                Clear stored key
              </button>
            </div>

            {aiError && (
              <p style={{ margin: 0, color: 'var(--danger, #ef4444)' }}>
                {aiError}
              </p>
            )}

            <p className="text-muted" style={{ margin: 0, fontSize: '0.875rem' }}>
              Default analytics remain fully deterministic; AI only generates short one-liners from already-extracted evidence.
            </p>
          </div>
        </div>

        {/* NEW: Model Comparison (evidence-based) */}
        {topModelsForCards.length > 0 && (
          <div
            className="insights-section mt-8"
            style={{ background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.10), rgba(139, 92, 246, 0.10))' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
              <h3 style={{ margin: 0 }}>🏆 Model Comparison — Evidence from Posts</h3>
              <p className="text-muted" style={{ margin: 0, fontSize: '0.9rem' }}>
                Strengths/weaknesses are extracted from student posts (not generic “X is good” claims).
              </p>
            </div>

            <div className="model-comparison-grid">
              {topModelsForCards.map((info) => (
                <div key={info.model} className="model-insight-card-enhanced">
                  <div className="model-card-header">
                    <h4 className="model-name">{info.model}</h4>
                    <span className="model-badge">
                      {info.total_homeworks || 0} HWs{info.post_count ? ` • ${info.post_count} posts` : ''}
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                    <button
                      className="btn"
                      disabled={!aiEnabled || !apiKey || aiBusyKey === `modelCard::ALL::${info.model}`}
                      onClick={() => callOpenAIOneLiners({
                        scope: 'modelCard',
                        modelName: info.model,
                        hw: null,
                        postCount: info.post_count,
                        topTerms: info.distinctive_terms,
                        strengths: info.strengths,
                        weaknesses: info.weaknesses
                      })}
                    >
                      {aiBusyKey === `modelCard::ALL::${info.model}` ? 'Generating…' : 'AI: 1-line Pro/Con'}
                    </button>
                  </div>

                  {aiCache[`modelCard::ALL::${info.model}`] && (
                    <div style={{ marginTop: '0.75rem' }}>
                      <div className="mention-item strength">
                        <span className="icon">✅</span>
                        <span className="text">{aiCache[`modelCard::ALL::${info.model}`].pro}</span>
                      </div>
                      <div className="mention-item weakness">
                        <span className="icon">⚠️</span>
                        <span className="text">{aiCache[`modelCard::ALL::${info.model}`].con}</span>
                      </div>
                    </div>
                  )}

                  <div style={{ marginTop: '0.75rem' }}>
                    <div style={{ fontWeight: 600, marginBottom: '0.35rem' }}>✅ Strengths (evidence)</div>
                    <EvidenceList items={(info.strengths || []).slice(0, 3)} emptyText="No extracted strength mentions." kind="strength" />
                  </div>

                  <div style={{ marginTop: '0.75rem' }}>
                    <div style={{ fontWeight: 600, marginBottom: '0.35rem' }}>⚠️ Weaknesses (evidence)</div>
                    <EvidenceList items={(info.weaknesses || []).slice(0, 3)} emptyText="No extracted weakness mentions." kind="weakness" />
                  </div>

                  {info.distinctive_terms?.length > 0 && (
                    <div className="mt-3">
                      <div className="text-muted" style={{ fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                        Distinctive topics:
                      </div>
                      <div className="terms-tags">
                        {info.distinctive_terms.slice(0, 8).map((term, idx) => (
                          <span key={idx} className="term-tag">{term.term || term}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {info.homeworks_tested?.length > 0 && (
                    <div className="mt-3 hw-tags">
                      {info.homeworks_tested.slice(0, 12).map((hw, idx) => (
                        <span key={idx} className="hw-tag">{hw}</span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <p className="text-muted text-center mt-4" style={{ fontSize: '0.875rem' }}>
              💡 For cell-level evidence with representative posts, visit the <strong>Insights</strong> page
            </p>
          </div>
        )}

        {/* NEW: Better Comparisons Panel (same HW, A vs B) */}
        {advancedAnalytics?.hw_model_analysis && sortedHWs.length > 0 && sortedModels.length > 0 && (
          <div className="insights-section mt-8">
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
              <h3 style={{ margin: 0 }}>⚔️ Compare Two Models on the Same Homework</h3>
              <p className="text-muted" style={{ margin: 0, fontSize: '0.9rem' }}>
                Evidence-first diff: A-only / B-only / overlap for strengths + weaknesses.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '0.75rem' }}>
              <select value={compareHW || ''} onChange={(e) => setCompareHW(e.target.value)}>
                {sortedHWs.map(hw => <option key={hw} value={hw}>{hw}</option>)}
              </select>
              <select value={compareA || ''} onChange={(e) => setCompareA(e.target.value)}>
                {sortedModels.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
              <select value={compareB || ''} onChange={(e) => setCompareB(e.target.value)}>
                {sortedModels.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>

            <div style={{ marginTop: '1rem' }}>
              {(!compareDataA || !compareDataB) ? (
                <p className="text-muted" style={{ margin: 0 }}>
                  Pick two models that both have posts under {compareHW}. (If a side is empty, there were no posts.)
                </p>
              ) : (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <CompareColumn
                      title={compareA}
                      hw={compareHW}
                      cell={compareDataA}
                      aiEnabled={aiEnabled}
                      apiKey={apiKey}
                      aiBusyKey={aiBusyKey}
                      cacheKey={`compareA::${compareHW}::${compareA}`}
                      aiCache={aiCache}
                      onAI={() => callOpenAIOneLiners({
                        scope: 'compareA',
                        modelName: compareA,
                        hw: compareHW,
                        postCount: compareDataA.post_count,
                        topTerms: compareDataA.top_terms,
                        strengths: compareDataA.strengths,
                        weaknesses: compareDataA.weaknesses
                      })}
                    />
                    <CompareColumn
                      title={compareB}
                      hw={compareHW}
                      cell={compareDataB}
                      aiEnabled={aiEnabled}
                      apiKey={apiKey}
                      aiBusyKey={aiBusyKey}
                      cacheKey={`compareB::${compareHW}::${compareB}`}
                      aiCache={aiCache}
                      onAI={() => callOpenAIOneLiners({
                        scope: 'compareB',
                        modelName: compareB,
                        hw: compareHW,
                        postCount: compareDataB.post_count,
                        topTerms: compareDataB.top_terms,
                        strengths: compareDataB.strengths,
                        weaknesses: compareDataB.weaknesses
                      })}
                    />
                  </div>

                  <div className="card" style={{ marginTop: '1rem', padding: '1rem' }}>
                    <h4 style={{ marginTop: 0 }}>Evidence Differences (Extracted Mentions)</h4>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div>
                        <h5 style={{ marginBottom: '0.5rem' }}>Strengths</h5>
                        <DeltaBlock label={`${compareA} only`} items={compareStrengths.onlyA.slice(0, 8)} />
                        <DeltaBlock label={`${compareB} only`} items={compareStrengths.onlyB.slice(0, 8)} />
                        <DeltaBlock label="Overlap" items={compareStrengths.both.slice(0, 8)} />
                      </div>

                      <div>
                        <h5 style={{ marginBottom: '0.5rem' }}>Weaknesses</h5>
                        <DeltaBlock label={`${compareA} only`} items={compareWeaknesses.onlyA.slice(0, 8)} />
                        <DeltaBlock label={`${compareB} only`} items={compareWeaknesses.onlyB.slice(0, 8)} />
                        <DeltaBlock label="Overlap" items={compareWeaknesses.both.slice(0, 8)} />
                      </div>
                    </div>

                    <p className="text-muted" style={{ marginBottom: 0, fontSize: '0.875rem' }}>
                      This is intentionally evidence-first: it highlights what students explicitly mentioned on the same homework.
                    </p>
                  </div>
                </>
              )}
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

        {/* Key Findings */}
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

// ----------------------------
// Small UI helpers
// ----------------------------
function EvidenceList({ items, emptyText, kind }) {
  if (!items || items.length === 0) {
    return <div className="text-muted" style={{ fontSize: '0.875rem' }}>{emptyText}</div>
  }
  return (
    <div style={{ display: 'grid', gap: '0.5rem' }}>
      {items.map((x, i) => (
        <div key={i} className={`mention-item ${kind}`}>
          <span className="icon">{kind === 'strength' ? '💪' : '⚡'}</span>
          <span className="text">{x}</span>
        </div>
      ))}
    </div>
  )
}

function CompareColumn({ title, hw, cell, aiEnabled, apiKey, aiBusyKey, cacheKey, aiCache, onAI }) {
  const topTerms = (cell?.top_terms || []).slice(0, 8).map(t => t.term).filter(Boolean)
  const strengths = (cell?.strengths || []).slice(0, 8)
  const weaknesses = (cell?.weaknesses || []).slice(0, 8)
  return (
    <div className="card" style={{ padding: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <h4 style={{ margin: 0 }}>{title}</h4>
        <span className="count-badge">{cell?.post_count || 0} posts</span>
      </div>

      <button
        className="btn"
        style={{ marginTop: '0.5rem' }}
        disabled={!aiEnabled || !apiKey || aiBusyKey === cacheKey}
        onClick={onAI}
      >
        {aiBusyKey === cacheKey ? 'Generating…' : 'AI: 1-line Pro/Con'}
      </button>

      {aiCache?.[cacheKey] && (
        <div style={{ marginTop: '0.75rem' }}>
          <div className="mention-item strength"><span className="icon">✅</span><span className="text">{aiCache[cacheKey].pro}</span></div>
          <div className="mention-item weakness"><span className="icon">⚠️</span><span className="text">{aiCache[cacheKey].con}</span></div>
        </div>
      )}

      <div style={{ marginTop: '0.75rem' }}>
        <div style={{ fontWeight: 600, marginBottom: '0.35rem' }}>Top Terms</div>
        {topTerms.length ? (
          <div className="terms-tags">
            {topTerms.map((t, i) => <span key={i} className="term-tag">{t}</span>)}
          </div>
        ) : (
          <div className="text-muted" style={{ fontSize: '0.875rem' }}>None</div>
        )}
      </div>

      <div style={{ marginTop: '0.75rem' }}>
        <div style={{ fontWeight: 600, marginBottom: '0.35rem' }}>✅ Strengths</div>
        <EvidenceList items={strengths} emptyText="None" kind="strength" />
      </div>

      <div style={{ marginTop: '0.75rem' }}>
        <div style={{ fontWeight: 600, marginBottom: '0.35rem' }}>⚠️ Weaknesses</div>
        <EvidenceList items={weaknesses} emptyText="None" kind="weakness" />
      </div>
    </div>
  )
}

function DeltaBlock({ label, items }) {
  return (
    <div style={{ marginBottom: '0.75rem' }}>
      <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>{label}</div>
      {(!items || items.length === 0) ? (
        <div className="text-muted" style={{ fontSize: '0.875rem' }}>None</div>
      ) : (
        <ul style={{ margin: 0, paddingLeft: '1.25rem' }}>
          {items.map((x, i) => <li key={i}>{x}</li>)}
        </ul>
      )}
    </div>
  )
}

// ----------------------------
// Helpers (dedup + overlap)
// ----------------------------
function dedupStrings(arr) {
  const seen = new Set()
  const out = []
  for (const x of (arr || [])) {
    const k = String(x || '').trim()
    if (!k) continue
    const kk = k.toLowerCase().replace(/\s+/g, ' ')
    if (seen.has(kk)) continue
    seen.add(kk)
    out.push(k)
  }
  return out
}

function normalizeLine(s) {
  return String(s || '').trim().toLowerCase().replace(/\s+/g, ' ')
}

function uniqueAndOverlap(arrA = [], arrB = []) {
  const mapA = new Map()
  const mapB = new Map()
  arrA.forEach(x => mapA.set(normalizeLine(x), x))
  arrB.forEach(x => mapB.set(normalizeLine(x), x))

  const onlyA = []
  const onlyB = []
  const both = []

  for (const [k, v] of mapA.entries()) {
    if (mapB.has(k)) both.push(v)
    else onlyA.push(v)
  }
  for (const [k, v] of mapB.entries()) {
    if (!mapA.has(k)) onlyB.push(v)
  }

  return { onlyA, onlyB, both }
}

export default Dashboard
