function Header({ currentPage, setCurrentPage, dataCount }) {
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'browse', label: 'Browse', icon: '🔍' },
    { id: 'analytics', label: 'Analytics', icon: '📈' },
    { id: 'insights', label: 'Insights', icon: '💡', badge: 'NEW' }
  ]

  return (
    <header className="header">
      <div className="container header-content">
        <div className="header-title">
          <span className="logo">🎓</span>
          <div>
            <h1>CS182 Blue Team Archive</h1>
            <p className="header-subtitle">
              Special Participation A
              {dataCount > 0 && <span className="data-count"> • {dataCount} posts</span>}
            </p>
          </div>
        </div>
        <nav className="nav-tabs">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`nav-tab ${currentPage === tab.id ? 'active' : ''}`}
              onClick={() => setCurrentPage(tab.id)}
            >
              <span>{tab.icon}</span> {tab.label}
              {tab.badge && <span className="nav-badge">{tab.badge}</span>}
            </button>
          ))}
        </nav>
      </div>
    </header>
  )
}

export default Header