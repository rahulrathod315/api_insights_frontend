import { useState } from 'react'
import './SearchBar.css'

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  )
}

export default function SearchBar() {
  const [query, setQuery] = useState('')

  return (
    <div className="searchbar">
      <span className="searchbar__icon"><SearchIcon /></span>
      <input
        className="searchbar__input"
        type="text"
        placeholder="Search..."
        value={query}
        onChange={e => setQuery(e.target.value)}
      />
      <kbd className="searchbar__shortcut">/</kbd>
    </div>
  )
}
