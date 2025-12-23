import { useEffect, useMemo, useState } from 'react'

function Insights({ data: _data, advancedAnalytics, analytics }) {
  const [selectedHW, setSelectedHW] = useState(null)
  const [selectedModel, setSelectedModel] = useState(null)
  const [sortBy, setSortBy] = useState('count')

  // --- NEW: compare mode ---
  const [compareHW, setCompareHW] = useState(null)
  const [compareA, setCompareA] = useState(null)
  const [compareB, setCompareB] = useState(null)

  // --- NEW: optional AI one-liners (BYO key) ---
  const [aiEnabled, setAiEnabled] = useState(false)
  const [apiKey, setApiKey] = useState('')
  const [aiModel, setAiModel] = useState('gpt-4o') // pick any model you allow
  const [aiBusyKey, setAiBusyKey] = useState(null) // which request is running
  const [aiError, setAiError] = useState(null)
  const [aiCache, setAiCache] = useState({}) // { [cacheKey]: { pro, con } }

  // Restore user settings
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
      // Only store the key if user enabled AI
      if (aiEnabled && apiKey) localStorage.setItem('cs182_openai_key', apiKey)
      if (!aiEnabled) localStorage.removeItem('cs182_openai_key')
    } catch {
      // ignore
    }
  }, [aiEnabled, apiKey, aiModel])

  // Get heatmap data
  const heatmapData = advancedAnalytics?.heatmap

  const getHwModelData = (hw, model) => {
    if (!hw || !model || !advancedAnalytics?.hw_model_analysis) return null
    return advancedAnalytics.hw_model_analysis[hw]?.[model] || null
  }

  // Get drill-down data for selected HW×Model
  const drillDownData = useMemo(() => {
    return getHwModelData(selectedHW, selectedModel)
  }, [selectedHW, selectedModel, advancedAnalytics])

  // Sort homeworks
  const sortedHWs = useMemo(() => {
    if (!heatmapData?.homeworks) return []
    return [...heatmapData.homeworks].sort((a, b) => {
      const numA = parseInt(a.replace(/\D/g, '')) || 0
      const numB = parseInt(b.replace(/\D/g, '')) || 0
      return numA - numB
    })
  }, [heatmapData])

  // Sort models
  const sortedModels = useMemo(() => {
    if (!heatmapData?.models) return []
    const models = [...heatmapData.models]

    if (sortBy === 'name') return models.sort()

    if (sortBy === 'count') {
      return models.sort((a, b) => {
        const countA = sortedHWs.reduce((sum, hw) => sum + (heatmapData.matrix[hw]?.[a] || 0), 0)
        const countB = sortedHWs.reduce((sum, hw) => sum + (heatmapData.matrix[hw]?.[b] || 0), 0)
        return countB - countA
      })
    }
    return models
  }, [heatmapData, sortedHWs, sortBy])

  // Default compare selections (top models)
  useEffect(() => {
    if (!advancedAnalytics?.heatmap?.homeworks?.length || !advancedAnalytics?.heatmap?.models?.length) return
    if (!compareHW) setCompareHW(sortedHWs[0] || null)
    if (!compareA) setCompareA(sortedModels[0] || null)
    if (!compareB) setCompareB(sortedModels[1] || sortedModels[0] || null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [advancedAnalytics, sortedHWs.join('|'), sortedModels.join('|')])

  // Max value for heatmap scaling
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

  const getCellColor = (value) => {
    if (!value || maxValue === 0) return 'transparent'
    const intensity = value / maxValue
    return `rgba(59, 130, 246, ${0.2 + intensity * 0.7})`
  }

  const getTextColor = (value) => {
    if (!value || maxValue === 0) return 'var(--text-muted)'
    const intensity = value / maxValue
    return intensity > 0.5 ? '#fff' : 'var(--text-primary)'
  }

  // --- NEW: utilities for “better comparisons” ---
  const normalizeLine = (s) => (s || '').trim().toLowerCase().replace(/\s+/g, ' ')
  const uniqueAndOverlap = (arrA = [], arrB = []) => {
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

  const compareDataA = useMemo(() => getHwModelData(compareHW, compareA), [compareHW, compareA, advancedAnalytics])
  const compareDataB = useMemo(() => getHwModelData(compareHW, compareB), [compareHW, compareB, advancedAnalytics])

  const compareStrengths = useMemo(() => {
    return uniqueAndOverlap(compareDataA?.strengths || [], compareDataB?.strengths || [])
  }, [compareDataA, compareDataB])

  const compareWeaknesses = useMemo(() => {
    return uniqueAndOverlap(compareDataA?.weaknesses || [], compareDataB?.weaknesses || [])
  }, [compareDataA, compareDataB])

const callOpenAIOneLiners = async ({
  scope, // 'cell' | 'compareA' | 'compareB'
  modelName,
  hw,
  postCount,
  topTerms,
  strengths,
  weaknesses,
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
        temperature: 0.3,
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

    setAiCache(prev => ({
      ...prev,
      [cacheKey]: { pro: String(parsed.pro), con: String(parsed.con) }
    }))
  } catch (e) {
    setAiError(e?.message || 'AI request failed.')
  } finally {
    setAiBusyKey(null)
  }
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
            TF-IDF analysis • HW × Model Coverage • Evidence-based comparisons
          </p>
        </div>

        {/* NEW: Optional AI Quick Takes */}
        <div className="card mb-8">
          <div className="card-header">
            <h3>Optional AI Quick Takes (BYO OpenAI Key)</h3>
          </div>

          <div style={{ padding: '1rem' }}>
            <label style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <input
                type="checkbox"
                checked={aiEnabled}
                onChange={(e) => setAiEnabled(e.target.checked)}
              />
              Enable AI one-liners (1 sentence pro + 1 sentence con)
            </label>

            <div style={{ marginTop: '0.75rem', display: 'grid', gap: '0.75rem' }}>
              <input
                type="password"
                placeholder="Paste OpenAI API Key (stored locally only if enabled)"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                disabled={!aiEnabled}
                style={{ width: '100%' }}
              />

              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <label style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  Model:
                  <input
                    value={aiModel}
                    onChange={(e) => setAiModel(e.target.value)}
                    disabled={!aiEnabled}
                    placeholder="e.g., gpt-5"
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
                  disabled={!apiEnabledOrNot(aiEnabled, apiKey)}
                >
                  Clear stored key
                </button>
              </div>

              <p className="text-muted" style={{ fontSize: '0.875rem', margin: 0 }}>
                Tip: This is optional. Default analytics remain fully deterministic; AI only generates short “headline” one-liners from already-extracted evidence.
              </p>

              {aiError && (
                <p style={{ margin: 0, color: 'var(--danger, #ef4444)' }}>
                  {aiError}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* NEW: Better Comparison Panel */}
        <div className="card mb-8">
          <div className="card-header">
            <h3>Model vs Model (Same Homework)</h3>
            <div className="controls" style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
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
          </div>

          <div style={{ padding: '1rem' }}>
            {(!compareDataA || !compareDataB) ? (
              <p className="text-muted" style={{ margin: 0 }}>
                Pick two models that both have posts under {compareHW}. (If a side is empty, there were no posts.)
              </p>
            ) : (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  {/* A */}
                  <div className="card" style={{ padding: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                      <h4 style={{ margin: 0 }}>{compareA}</h4>
                      <span className="count-badge">{compareDataA.post_count} posts</span>
                    </div>

                    <button
                      className="btn"
                      style={{ marginTop: '0.5rem' }}
                      disabled={!aiEnabled || !apiKey || aiBusyKey === `compareA::${compareHW}::${compareA}`}
                      onClick={() => callOpenAIOneLiners({
                        scope: 'compareA',
                        modelName: compareA,
                        hw: compareHW,
                        postCount: compareDataA.post_count,
                        topTerms: compareDataA.top_terms,
                        strengths: compareDataA.strengths,
                        weaknesses: compareDataA.weaknesses,
                      })}
                    >
                      {aiBusyKey === `compareA::${compareHW}::${compareA}` ? 'Generating…' : 'AI: 1-line Pro/Con'}
                    </button>

                    {aiCache[`compareA::${compareHW}::${compareA}`] && (
                      <div style={{ marginTop: '0.75rem' }}>
                        <div className="mention-item strength"><span className="icon">✅</span><span className="text">{aiCache[`compareA::${compareHW}::${compareA}`].pro}</span></div>
                        <div className="mention-item weakness"><span className="icon">⚠️</span><span className="text">{aiCache[`compareA::${compareHW}::${compareA}`].con}</span></div>
                      </div>
                    )}

                    <SectionList title="Top Terms" items={(compareDataA.top_terms || []).slice(0, 8).map(x => x.term)} />
                    <SectionList title="Strengths" items={(compareDataA.strengths || []).slice(0, 8)} />
                    <SectionList title="Weaknesses" items={(compareDataA.weaknesses || []).slice(0, 8)} />
                  </div>

                  {/* B */}
                  <div className="card" style={{ padding: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                      <h4 style={{ margin: 0 }}>{compareB}</h4>
                      <span className="count-badge">{compareDataB.post_count} posts</span>
                    </div>

                    <button
                      className="btn"
                      style={{ marginTop: '0.5rem' }}
                      disabled={!aiEnabled || !apiKey || aiBusyKey === `compareB::${compareHW}::${compareB}`}
                      onClick={() => callOpenAIOneLiners({
                        scope: 'compareB',
                        modelName: compareB,
                        hw: compareHW,
                        postCount: compareDataB.post_count,
                        topTerms: compareDataB.top_terms,
                        strengths: compareDataB.strengths,
                        weaknesses: compareDataB.weaknesses,
                      })}
                    >
                      {aiBusyKey === `compareB::${compareHW}::${compareB}` ? 'Generating…' : 'AI: 1-line Pro/Con'}
                    </button>

                    {aiCache[`compareB::${compareHW}::${compareB}`] && (
                      <div style={{ marginTop: '0.75rem' }}>
                        <div className="mention-item strength"><span className="icon">✅</span><span className="text">{aiCache[`compareB::${compareHW}::${compareB}`].pro}</span></div>
                        <div className="mention-item weakness"><span className="icon">⚠️</span><span className="text">{aiCache[`compareB::${compareHW}::${compareB}`].con}</span></div>
                      </div>
                    )}

                    <SectionList title="Top Terms" items={(compareDataB.top_terms || []).slice(0, 8).map(x => x.term)} />
                    <SectionList title="Strengths" items={(compareDataB.strengths || []).slice(0, 8)} />
                    <SectionList title="Weaknesses" items={(compareDataB.weaknesses || []).slice(0, 8)} />
                  </div>
                </div>

                {/* Evidence-based deltas */}
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
                    This view is intentionally evidence-first: it shows what students explicitly mentioned, and highlights where the two models differ on the *same* homework.
                  </p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* HW × Model Heatmap (original) */}
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

        {/* Drill-Down View (original + AI one-liner) */}
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
              <button
                className="btn"
                disabled={!aiEnabled || !apiKey || aiBusyKey === `cell::${selectedHW}::${selectedModel}`}
                onClick={() => callOpenAIOneLiners({
                  scope: 'cell',
                  modelName: selectedModel,
                  hw: selectedHW,
                  postCount: drillDownData.post_count,
                  topTerms: drillDownData.top_terms,
                  strengths: drillDownData.strengths,
                  weaknesses: drillDownData.weaknesses,
                })}
              >
                {aiBusyKey === `cell::${selectedHW}::${selectedModel}` ? 'Generating…' : 'AI: 1-line Pro/Con'}
              </button>

              {aiCache[`cell::${selectedHW}::${selectedModel}`] && (
                <div style={{ marginTop: '0.75rem' }}>
                  <div className="mention-item strength"><span className="icon">✅</span><span className="text">{aiCache[`cell::${selectedHW}::${selectedModel}`].pro}</span></div>
                  <div className="mention-item weakness"><span className="icon">⚠️</span><span className="text">{aiCache[`cell::${selectedHW}::${selectedModel}`].con}</span></div>
                </div>
              )}

              {drillDownData.top_terms?.length > 0 && (
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

              {drillDownData.strengths?.length > 0 && (
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

              {drillDownData.weaknesses?.length > 0 && (
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

              {drillDownData.representative_posts?.length > 0 && (
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

function SectionList({ title, items }) {
  if (!items || items.length === 0) return null
  return (
    <div style={{ marginTop: '0.75rem' }}>
      <h5 style={{ margin: '0 0 0.5rem 0' }}>{title}</h5>
      <ul style={{ margin: 0, paddingLeft: '1.25rem' }}>
        {items.map((x, i) => <li key={i}>{x}</li>)}
      </ul>
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

function apiEnabledOrNot(aiEnabled, apiKey) {
  return aiEnabled && apiKey && apiKey.trim().length > 0
}

export default Insights
