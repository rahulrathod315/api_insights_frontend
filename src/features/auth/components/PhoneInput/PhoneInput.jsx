import { useState, useRef, useEffect } from 'react'
import './PhoneInput.css'

const COUNTRIES = [
  { flag: '\u{1F1FA}\u{1F1F8}', name: 'United States', dial: '+1' },
  { flag: '\u{1F1EC}\u{1F1E7}', name: 'United Kingdom', dial: '+44' },
  { flag: '\u{1F1EE}\u{1F1F3}', name: 'India', dial: '+91' },
  { flag: '\u{1F1E8}\u{1F1E6}', name: 'Canada', dial: '+1' },
  { flag: '\u{1F1E6}\u{1F1FA}', name: 'Australia', dial: '+61' },
  { flag: '\u{1F1E9}\u{1F1EA}', name: 'Germany', dial: '+49' },
  { flag: '\u{1F1EB}\u{1F1F7}', name: 'France', dial: '+33' },
  { flag: '\u{1F1EF}\u{1F1F5}', name: 'Japan', dial: '+81' },
  { flag: '\u{1F1E8}\u{1F1F3}', name: 'China', dial: '+86' },
  { flag: '\u{1F1E7}\u{1F1F7}', name: 'Brazil', dial: '+55' },
  { flag: '\u{1F1F2}\u{1F1FD}', name: 'Mexico', dial: '+52' },
  { flag: '\u{1F1F0}\u{1F1F7}', name: 'South Korea', dial: '+82' },
  { flag: '\u{1F1EE}\u{1F1E9}', name: 'Indonesia', dial: '+62' },
  { flag: '\u{1F1F5}\u{1F1F0}', name: 'Pakistan', dial: '+92' },
  { flag: '\u{1F1E7}\u{1F1E9}', name: 'Bangladesh', dial: '+880' },
  { flag: '\u{1F1F7}\u{1F1FA}', name: 'Russia', dial: '+7' },
  { flag: '\u{1F1F3}\u{1F1EC}', name: 'Nigeria', dial: '+234' },
  { flag: '\u{1F1F5}\u{1F1ED}', name: 'Philippines', dial: '+63' },
  { flag: '\u{1F1EA}\u{1F1EC}', name: 'Egypt', dial: '+20' },
  { flag: '\u{1F1F9}\u{1F1F7}', name: 'Turkey', dial: '+90' },
  { flag: '\u{1F1F8}\u{1F1E6}', name: 'Saudi Arabia', dial: '+966' },
  { flag: '\u{1F1FF}\u{1F1E6}', name: 'South Africa', dial: '+27' },
  { flag: '\u{1F1F8}\u{1F1EC}', name: 'Singapore', dial: '+65' },
  { flag: '\u{1F1F3}\u{1F1FF}', name: 'New Zealand', dial: '+64' },
  { flag: '\u{1F1F3}\u{1F1F1}', name: 'Netherlands', dial: '+31' },
  { flag: '\u{1F1F8}\u{1F1EA}', name: 'Sweden', dial: '+46' },
  { flag: '\u{1F1E8}\u{1F1ED}', name: 'Switzerland', dial: '+41' },
  { flag: '\u{1F1EA}\u{1F1F8}', name: 'Spain', dial: '+34' },
  { flag: '\u{1F1EE}\u{1F1F9}', name: 'Italy', dial: '+39' },
  { flag: '\u{1F1E6}\u{1F1EA}', name: 'UAE', dial: '+971' },
  { flag: '\u{1F1EE}\u{1F1F1}', name: 'Israel', dial: '+972' },
]

export default function PhoneInput({ value, onChange, name, error }) {
  const [selected, setSelected] = useState(COUNTRIES[0])
  const [localNumber, setLocalNumber] = useState('')
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const wrapperRef = useRef(null)
  const searchRef = useRef(null)

  function emitFullPhone(dial, digits) {
    const full = digits ? `${dial}${digits}` : ''
    onChange({ target: { name, value: full } })
  }

  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [])

  useEffect(() => {
    if (open && searchRef.current) {
      searchRef.current.focus()
    }
  }, [open])

  const filtered = search
    ? COUNTRIES.filter(
        (c) =>
          c.name.toLowerCase().includes(search.toLowerCase()) ||
          c.dial.includes(search)
      )
    : COUNTRIES

  return (
    <div className={`phone-input${error ? ' phone-input--error' : ''}`}>
      <div className="phone-input__row">
        <div className="phone-input__country-wrap" ref={wrapperRef}>
          <button
            className={`phone-input__trigger${open ? ' phone-input__trigger--open' : ''}`}
            type="button"
            onClick={() => { setOpen(!open); setSearch('') }}
          >
            <span className="phone-input__flag">{selected.flag}</span>
            <span className="phone-input__dial">{selected.dial}</span>
            <span className="phone-input__chevron">{'\u25BC'}</span>
          </button>
          {open && (
            <div className="phone-input__dropdown">
              <input
                ref={searchRef}
                className="phone-input__search"
                type="text"
                placeholder="Search country\u2026"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onClick={(e) => e.stopPropagation()}
              />
              <div className="phone-input__list">
                {filtered.map((c, i) => (
                  <div
                    key={`${c.dial}-${c.name}`}
                    className="phone-input__option"
                    onClick={() => { setSelected(c); setOpen(false); emitFullPhone(c.dial, localNumber) }}
                  >
                    <span className="phone-input__option-flag">{c.flag}</span>
                    <span className="phone-input__option-name">{c.name}</span>
                    <span className="phone-input__option-dial">{c.dial}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="phone-input__field">
          <div className="phone-input__input-wrap">
            <span className="phone-input__icon">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.41 2 2 0 0 1 3.6 1.24h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.82a16 16 0 0 0 6.29 6.29l.94-.94a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
            </span>
            <input
              className="phone-input__input"
              type="tel"
              placeholder="555 000 0000"
              value={localNumber}
              onChange={(e) => {
                const digits = e.target.value.replace(/\D/g, '').slice(0, 10)
                setLocalNumber(digits)
                emitFullPhone(selected.dial, digits)
              }}
              name={name}
              maxLength={10}
            />
          </div>
          {error && <p className="form-field__error">{error}</p>}
        </div>
      </div>
    </div>
  )
}
