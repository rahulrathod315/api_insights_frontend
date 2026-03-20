import { useState, useRef, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { getProjects, createProject } from '../../../features/projects'
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

function PlusIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 5v14" />
      <path d="M5 12h14" />
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
  const [showAddForm, setShowAddForm] = useState(false)
  const [newName, setNewName] = useState('')
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState('')
  const ref = useRef(null)
  const searchRef = useRef(null)
  const addInputRef = useRef(null)
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
        resetAddForm()
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
      if (!showAddForm) searchRef.current?.focus()
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [open, showAddForm])

  useEffect(() => {
    if (showAddForm) addInputRef.current?.focus()
  }, [showAddForm])

  const filtered = useMemo(() => {
    if (!search) return projects
    const q = search.toLowerCase()
    return projects.filter(p => p.name.toLowerCase().includes(q))
  }, [search, projects])

  function resetAddForm() {
    setShowAddForm(false)
    setNewName('')
    setCreateError('')
  }

  function handleSelect(project) {
    setSelected(project)
    setOpen(false)
    setSearch('')
    resetAddForm()
    navigate(`/projects/${project.id}`)
  }

  async function handleCreate(e) {
    e.preventDefault()
    const trimmed = newName.trim()
    if (!trimmed) return
    setCreating(true)
    setCreateError('')
    try {
      const created = await createProject({ name: trimmed })
      setProjects(prev => [...prev, created])
      resetAddForm()
      handleSelect(created)
    } catch (err) {
      const msg = err?.response?.data?.errors?.name?.[0]
        || err?.response?.data?.message
        || 'Failed to create project'
      setCreateError(msg)
    } finally {
      setCreating(false)
    }
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

  return (
    <div className="project-switcher" ref={ref}>
      <button
        className="project-switcher__trigger"
        onClick={() => setOpen(!open)}
      >
        <FolderIcon />
        <span className="project-switcher__name">{selected?.name || 'No projects'}</span>
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
            {filtered.length === 0 && !showAddForm && (
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
          <div className="project-switcher__footer">
            {showAddForm ? (
              <form className="project-switcher__add-form" onSubmit={handleCreate}>
                <input
                  ref={addInputRef}
                  className="project-switcher__add-input"
                  type="text"
                  placeholder="Project name"
                  value={newName}
                  onChange={e => { setNewName(e.target.value); setCreateError('') }}
                  disabled={creating}
                />
                {createError && <p className="project-switcher__add-error">{createError}</p>}
                <div className="project-switcher__add-actions">
                  <button
                    type="button"
                    className="project-switcher__add-cancel"
                    onClick={resetAddForm}
                    disabled={creating}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="project-switcher__add-submit"
                    disabled={creating || !newName.trim()}
                  >
                    {creating ? 'Creating...' : 'Create'}
                  </button>
                </div>
              </form>
            ) : (
              <button
                className="project-switcher__add-btn"
                onClick={() => setShowAddForm(true)}
              >
                <PlusIcon />
                <span>Add Project</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
