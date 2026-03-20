import { useState, useRef, useEffect } from 'react'
import './GranularityDropdown.css'

function ClockIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </svg>
  )
}

function ChevronIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m6 9 6 6 6-6" />
    </svg>
  )
}

const options = [
  { value: 'hour', label: '1 Hour' },
  { value: 'day', label: '1 Day' },
  { value: '7days', label: '7 Days' },
  { value: 'month', label: '1 Month' },
]

export default function GranularityDropdown({ value = '7days', onChange }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  const selected = options.find(o => o.value === value) || options[2]

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

  function handleSelect(option) {
    onChange?.(option.value)
    setOpen(false)
  }

  return (
    <div className="granularity" ref={ref}>
      <button className="granularity__trigger" onClick={() => setOpen(!open)}>
        <ClockIcon />
        <span className="granularity__label">{selected.label}</span>
        <ChevronIcon />
      </button>

      {open && (
        <div className="granularity__dropdown">
          {options.map(o => (
            <button
              key={o.value}
              className={`granularity__item ${o.value === value ? 'granularity__item--active' : ''}`}
              onClick={() => handleSelect(o)}
            >
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
