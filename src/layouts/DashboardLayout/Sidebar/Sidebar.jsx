import { useState, useRef, useEffect } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../../features/auth/context/AuthContext'
import './Sidebar.css'

const navItems = [
  { to: '/', label: 'Dashboard', icon: 'grid' },
  { to: '/analytics', label: 'Analytics', icon: 'chart' },
  { to: '/projects', label: 'Projects', icon: 'folder' },
  { to: '/api-keys', label: 'API Keys', icon: 'key' },
  { to: '/alerts', label: 'Alerts', icon: 'bell' },
]

const icons = {
  grid: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <rect x="2" y="2" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <rect x="11" y="2" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <rect x="2" y="11" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <rect x="11" y="11" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  ),
  chart: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M3 17V8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M7 17V3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M11 17V10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M15 17V6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  folder: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M2 5C2 3.89543 2.89543 3 4 3H7.17157C7.70201 3 8.21071 3.21071 8.58579 3.58579L9.41421 4.41421C9.78929 4.78929 10.298 5 10.8284 5H16C17.1046 5 18 5.89543 18 7V15C18 16.1046 17.1046 17 16 17H4C2.89543 17 2 16.1046 2 15V5Z" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  ),
  key: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <circle cx="7" cy="11" r="3.25" stroke="currentColor" strokeWidth="1.5" />
      <path d="M9.5 9L14.5 4M13 4H15.5V6.5M12 7L13.5 5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  bell: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M10 2C7.23858 2 5 4.23858 5 7V10.5858L3.29289 12.2929C3.00624 12.5796 2.92137 13.009 3.07612 13.3827C3.23088 13.7564 3.59554 14 4 14H16C16.4045 14 16.7691 13.7564 16.9239 13.3827C17.0786 13.009 16.9938 12.5796 16.7071 12.2929L15 10.5858V7C15 4.23858 12.7614 2 10 2Z" stroke="currentColor" strokeWidth="1.5" />
      <path d="M8 14V15C8 16.1046 8.89543 17 10 17C11.1046 17 12 16.1046 12 15V14" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  ),
  collapse: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M3 5H17M3 10H17M3 15H17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
}

export default function Sidebar({ collapsed, onToggle }) {
  const { user, logout } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)
  const navigate = useNavigate()

  const initials = `${user?.first_name?.[0] || ''}${user?.last_name?.[0] || ''}`.toUpperCase() || '?'
  const fullName = [user?.first_name, user?.last_name].filter(Boolean).join(' ') || 'User'

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false)
      }
    }
    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [menuOpen])

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <aside className={`sidebar ${collapsed ? 'sidebar--collapsed' : ''}`}>
      <div className="sidebar__logo">
        <span className="sidebar__logo-icon">AI</span>
        {!collapsed && <span className="sidebar__logo-text">API Insights</span>}
      </div>

      <nav className="sidebar__nav">
        {navItems.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `sidebar__link ${isActive ? 'sidebar__link--active' : ''}`
            }
            title={collapsed ? label : undefined}
          >
            <span className="sidebar__icon">{icons[icon]}</span>
            {!collapsed && <span className="sidebar__label">{label}</span>}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar__bottom">
        <div className="sidebar__account" ref={menuRef}>
          <button
            className="sidebar__account-btn"
            onClick={() => setMenuOpen(!menuOpen)}
            title={collapsed ? fullName : undefined}
          >
            <span className="sidebar__avatar">{initials}</span>
            {!collapsed && <span className="sidebar__account-name">{fullName}</span>}
          </button>

          {menuOpen && (
            <div className="sidebar__account-menu">
              <button
                className="sidebar__account-item"
                onClick={() => { setMenuOpen(false); navigate('/settings') }}
              >
                Settings
              </button>
              <button
                className="sidebar__account-item sidebar__account-item--danger"
                onClick={handleLogout}
              >
                Logout
              </button>
            </div>
          )}
        </div>

        <button className="sidebar__toggle" onClick={onToggle} title={collapsed ? 'Expand' : 'Collapse'}>
          <span className="sidebar__icon">{icons.collapse}</span>
          {!collapsed && <span className="sidebar__label">Collapse</span>}
        </button>
      </div>
    </aside>
  )
}
