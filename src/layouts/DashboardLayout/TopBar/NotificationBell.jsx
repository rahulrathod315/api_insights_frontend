import { useState, useRef, useEffect } from 'react'
import './NotificationBell.css'

function BellIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </svg>
  )
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

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

  return (
    <div className="notification-bell" ref={ref}>
      <button
        className="notification-bell__btn"
        onClick={() => setOpen(!open)}
        aria-label="Notifications"
      >
        <BellIcon />
      </button>

      {open && (
        <div className="notification-bell__dropdown">
          <div className="notification-bell__header">
            <span className="notification-bell__title">Notifications</span>
          </div>
          <div className="notification-bell__list">
            <div className="notification-bell__empty">
              No notifications yet
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
