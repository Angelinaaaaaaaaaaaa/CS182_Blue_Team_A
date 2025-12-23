import { useState, useMemo } from 'react'
import Fuse from 'fuse.js'

function Browse({ data }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedModel, setSelectedModel] = useState('all')
  const [selectedHomework, setSelectedHomework] = useState('all')
  const [sortBy, setSortBy] = useState('recent')

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

  // Fuzzy search with Fuse.js
  const fuse = useMemo(() => {
    return new Fuse(data, {
      keys: ['title', 'author', 'content', 'model', 'homework'],
      threshold: 0.3,
      includeScore: true
    })
  }, [data])

  // Filter and sort posts
  const filteredPosts = useMemo(() => {
    let results = data

    // Apply fuzzy search
    if (searchTerm.trim()) {
      const searchResults = fuse.search(searchTerm)
      results = searchResults.map(result => result.item)
    }

    // Filter by model
    if (selectedModel !== 'all') {
      results = results.filter(post => post.model === selectedModel)
    }

    // Filter by homework
    if (selectedHomework !== 'all') {
      results = results.filter(post => post.homework === selectedHomework)
    }

    // Sort results
    results = [...results].sort((a, b) => {
      switch (sortBy) {
        case 'recent':
          return new Date(b.created_at) - new Date(a.created_at)
        case 'oldest':
          return new Date(a.created_at) - new Date(b.created_at)
        case 'popular':
          return (b.likes + b.comments) - (a.likes + a.comments)
        case 'author':
          return a.author.localeCompare(b.author)
        default:
          return 0
      }
    })

    return results
  }, [data, searchTerm, selectedModel, selectedHomework, sortBy, fuse])

  const truncateContent = (content, maxLength = 300) => {
    if (!content || content.length <= maxLength) return content
    return content.substring(0, maxLength) + '...'
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <div className="container browse">
      <div className="fade-in">
        <h2 className="mb-6">Browse Posts</h2>

        {/* Search and Filters */}
        <div className="search-bar">
          <div className="search-input-wrapper">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              className="search-input"
              placeholder="Search posts by title, author, model, or content..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="filters">
            <div className="filter-group">
              <label>Model</label>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
              >
                <option value="all">All Models</option>
                {models.map(model => (
                  <option key={model} value={model}>{model}</option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label>Homework</label>
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

            <div className="filter-group">
              <label>Sort By</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="recent">Most Recent</option>
                <option value="oldest">Oldest First</option>
                <option value="popular">Most Popular</option>
                <option value="author">Author (A-Z)</option>
              </select>
            </div>
          </div>

          <div className="mt-4 text-secondary">
            Showing {filteredPosts.length} of {data.length} posts
          </div>
        </div>

        {/* Posts List */}
        <div className="posts-container">
          {filteredPosts.length === 0 ? (
            <div className="card text-center p-6">
              <h3 className="text-muted">No posts found</h3>
              <p className="text-secondary">Try adjusting your search or filters</p>
            </div>
          ) : (
            filteredPosts.map((post, idx) => (
              <div key={post.id || idx} className="post-card slide-in">
                <div className="post-header">
                  <h3 className="post-title">{post.title}</h3>
                </div>

                <div className="post-meta">
                  <span className="meta-item">
                    <span className="meta-icon">👤</span>
                    {post.author}
                  </span>
                  <span className="meta-item">
                    <span className="meta-icon">📅</span>
                    {formatDate(post.created_at)}
                  </span>
                  {post.likes > 0 && (
                    <span className="meta-item">
                      <span className="meta-icon">👍</span>
                      {post.likes} likes
                    </span>
                  )}
                  {post.comments > 0 && (
                    <span className="meta-item">
                      <span className="meta-icon">💬</span>
                      {post.comments} comments
                    </span>
                  )}
                </div>

                <div className="post-badges">
                  <span className="badge badge-model">{post.model}</span>
                  <span className="badge badge-hw">{post.homework}</span>
                </div>

                {post.content && (
                  <div className="post-content">
                    {truncateContent(post.content)}
                  </div>
                )}

                {post.ai_summary && (
                  <div className="post-content" style={{
                    background: 'rgba(59, 130, 246, 0.1)',
                    padding: '1rem',
                    borderRadius: '8px',
                    borderLeft: '3px solid var(--primary)'
                  }}>
                    <strong>AI Summary:</strong> {post.ai_summary}
                  </div>
                )}

                <div className="post-actions">
                  <button
                    className="action-btn"
                    onClick={() => window.open(post.url, '_blank')}
                  >
                    View on Ed →
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

export default Browse