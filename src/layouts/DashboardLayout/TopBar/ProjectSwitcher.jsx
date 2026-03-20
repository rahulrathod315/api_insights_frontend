import { useState, useRef, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { getProjects } from '../../../features/projects'
import './ProjectSwitcher.css'

function ChevronIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m6 9 6 6 6-6" />
    </svg>
  )
}

function SearchIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  )
}

function FolderIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 5C2 3.89543 2.89543 3 4 3H7.17157C7.70201 3 8.21071 3.21071 8.58579 3.58579L9.41421 4.41421C9.78929 4.78929 10.298 5 10.8284 5H20C21.1046 5 22 5.89543 22 7V19C22 20.1046 21.1046 21 20 21H4C2.89543 21 2 20.1046 2 19V5Z" />
    </svg>
  )
}

export default function ProjectSwitcher({ selectedProject, onProjectChange }) {
  const [open, setOpen] = useState(false)
  const [projects, setProjects] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const ref = useRef(null)
  const searchRef = useRef(null)
  const navigate = useNavigate()

  const selected = selectedProject
  const setSelected = onProjectChange

  useEffect(() => {
    let cancelled = false
    async function fetchProjects() {
      try {
        const data = await getProjects()
        if (cancelled) return
        setProjects(data)
        if (data.length > 0 && !selectedProject) {
          onProjectChange(data[0])
        }
      } catch {
        // silently fail — user may not have projects yet
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    fetchProjects()
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false)
        setSearch('')
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
      searchRef.current?.focus()
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [open])

  const filtered = useMemo(() => {
    if (!search) return projects
    const q = search.toLowerCase()
    return projects.filter(p => p.name.toLowerCase().includes(q))
  }, [search, projects])

  function handleSelect(project) {
    setSelected(project)
    setOpen(false)
    setSearch('')
    navigate(`/projects/${project.id}`)
  }

  if (loading) {
    return (
      <div className="project-switcher">
        <button className="project-switcher__trigger" disabled>
          <FolderIcon />
          <span className="project-switcher__name">Loading...</span>
        </button>
      </div>
    )
  }

  if (projects.length === 0) {
    return (
      <div className="project-switcher">
        <button className="project-switcher__trigger" disabled>
          <FolderIcon />
          <span className="project-switcher__name">No projects</span>
        </button>
      </div>
    )
  }

  return (
    <div className="project-switcher" ref={ref}>
      <button
        className="project-switcher__trigger"
        onClick={() => setOpen(!open)}
      >
        <FolderIcon />
        <span className="project-switcher__name">{selected?.name}</span>
        <span className="project-switcher__chevron">
          <ChevronIcon />
        </span>
      </button>

      {open && (
        <div className="project-switcher__dropdown">
          <div className="project-switcher__search-wrap">
            <span className="project-switcher__search-icon"><SearchIcon /></span>
            <input
              ref={searchRef}
              className="project-switcher__search"
              type="text"
              placeholder="Search projects..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="project-switcher__list">
            {filtered.length === 0 && (
              <div className="project-switcher__empty">No projects found</div>
            )}
            {filtered.map(p => (
              <button
                key={p.id}
                className={`project-switcher__item ${p.id === selected?.id ? 'project-switcher__item--active' : ''}`}
                onClick={() => handleSelect(p)}
              >
                <FolderIcon />
                <span>{p.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
