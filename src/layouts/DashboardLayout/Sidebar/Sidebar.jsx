import { useState, useRef, useEffect } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../../features/auth/context/AuthContext'
import './Sidebar.css'

const navItems = [
  { to: '/', label: 'Dashboard', icon: 'grid' },
]

function SidebarIcon({ icon }) {
  const defs = {
    grid: {
      stroke: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <rect x="2" y="2" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
          <rect x="11" y="2" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
          <rect x="2" y="11" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
          <rect x="11" y="11" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      ),
      filled: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <rect x="2" y="2" width="7" height="7" rx="1.5" fill="currentColor" />
          <rect x="11" y="2" width="7" height="7" rx="1.5" fill="currentColor" />
          <rect x="2" y="11" width="7" height="7" rx="1.5" fill="currentColor" />
          <rect x="11" y="11" width="7" height="7" rx="1.5" fill="currentColor" />
        </svg>
      ),
    },
    collapse: {
      stroke: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M3 5H17M3 10H17M3 15H17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      ),
      filled: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M3 5H17M3 10H17M3 15H17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      ),
    },
  }
  const pair = defs[icon]
  if (!pair) return null
  return (
    <>
      <span className="sidebar__icon-stroke">{pair.stroke}</span>
      <span className="sidebar__icon-filled">{pair.filled}</span>
    </>
  )
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
            <span className="sidebar__icon"><SidebarIcon icon={icon} /></span>
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
                onClick={() => { setMenuOpen(false); navigate('/projects') }}
              >
                Projects
              </button>
              <button
                className="sidebar__account-item"
                onClick={() => { setMenuOpen(false); navigate('/settings') }}
              >
                Settings
              </button>
              <div className="sidebar__account-divider" />
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
          <span className="sidebar__icon"><SidebarIcon icon="collapse" /></span>
          {!collapsed && <span className="sidebar__label">Collapse</span>}
        </button>
      </div>
    </aside>
  )
}
