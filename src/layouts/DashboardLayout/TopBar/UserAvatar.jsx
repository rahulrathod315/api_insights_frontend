import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../../features/auth/context/AuthContext'
import './UserAvatar.css'

export default function UserAvatar() {
  const { user, logout } = useAuth()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const navigate = useNavigate()

  const initials = `${user?.first_name?.[0] || ''}${user?.last_name?.[0] || ''}`.toUpperCase() || '?'
  const fullName = [user?.first_name, user?.last_name].filter(Boolean).join(' ') || 'User'

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false)
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [open])

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <div className="user-avatar" ref={ref}>
      <button className="user-avatar__button" onClick={() => setOpen(!open)}>
        <span className="user-avatar__circle">{initials}</span>
      </button>

      {open && (
        <div className="user-avatar__dropdown">
          <div className="user-avatar__info">
            <span className="user-avatar__name">{fullName}</span>
            <span className="user-avatar__email">{user?.email}</span>
          </div>
          <div className="user-avatar__divider" />
          <button
            className="user-avatar__item"
            onClick={() => { setOpen(false); navigate('/settings') }}
          >
            Settings
          </button>
          <button className="user-avatar__item user-avatar__item--danger" onClick={handleLogout}>
            Logout
          </button>
        </div>
      )}
    </div>
  )
}
