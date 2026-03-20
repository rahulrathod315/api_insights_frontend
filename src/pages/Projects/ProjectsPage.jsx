import { useState, useEffect } from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import { getProjects, updateProject, deleteProject, regenerateApiKey } from '../../features/projects'
import CreateProjectModal from '../../shared/components/CreateProjectModal/CreateProjectModal'
import './ProjectsPage.css'

function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatNumber(n) {
  if (n == null) return '0'
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, '') + 'K'
  return String(n)
}

function ProjectCard({ project, onUpdate, onDelete, onRegenerateKey }) {
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(project.name)
  const [description, setDescription] = useState(project.description || '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [copied, setCopied] = useState(false)
  const [regenerating, setRegenerating] = useState(false)
  const [showKey, setShowKey] = useState(false)
  const navigate = useNavigate()

  function handleCopyKey() {
    navigator.clipboard.writeText(project.api_key)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function handleSave(e) {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return
    setSaving(true)
    setError('')
    try {
      await onUpdate(project.id, { name: trimmed, description: description.trim() })
      setEditing(false)
    } catch (err) {
      setError(err?.response?.data?.errors?.name?.[0] || err?.response?.data?.message || 'Failed to update project')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    setDeleting(true)
    try {
      await onDelete(project.id)
    } catch {
      setDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  async function handleRegenerate() {
    setRegenerating(true)
    try {
      await onRegenerateKey(project.id)
    } finally {
      setRegenerating(false)
    }
  }

  function handleCancelEdit() {
    setEditing(false)
    setName(project.name)
    setDescription(project.description || '')
    setError('')
  }

  const maskedKey = project.api_key
    ? project.api_key.slice(0, 10) + '\u2022'.repeat(12) + project.api_key.slice(-4)
    : '—'

  if (editing) {
    return (
      <div className="pj-card">
        <form className="pj-card__edit" onSubmit={handleSave}>
          <input className="pj-card__input" value={name} onChange={e => { setName(e.target.value); setError('') }} placeholder="Project name" autoFocus />
          <textarea className="pj-card__textarea" value={description} onChange={e => setDescription(e.target.value)} placeholder="Description (optional)" rows={2} />
          {error && <p className="pj-card__error">{error}</p>}
          <div className="pj-card__edit-actions">
            <button type="button" className="pj-btn pj-btn--ghost" onClick={handleCancelEdit} disabled={saving}>Cancel</button>
            <button type="submit" className="pj-btn pj-btn--primary" disabled={saving || !name.trim()}>{saving ? 'Saving...' : 'Save'}</button>
          </div>
        </form>
      </div>
    )
  }

  return (
    <div className="pj-card">
      <div className="pj-card__top">
        <div className="pj-card__title-row">
          <div className="pj-card__icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 5C2 3.89543 2.89543 3 4 3H7.17157C7.70201 3 8.21071 3.21071 8.58579 3.58579L9.41421 4.41421C9.78929 4.78929 10.298 5 10.8284 5H20C21.1046 5 22 5.89543 22 7V19C22 20.1046 21.1046 21 20 21H4C2.89543 21 2 20.1046 2 19V5Z" />
            </svg>
          </div>
          <div className="pj-card__title-text">
            <h3 className="pj-card__name">{project.name}</h3>
            <span className="pj-card__date">Created {formatDate(project.created_at)}</span>
          </div>
          <span className={`pj-card__status ${project.is_active ? 'pj-card__status--active' : 'pj-card__status--inactive'}`}>
            {project.is_active ? 'Active' : 'Inactive'}
          </span>
        </div>
        {project.description && <p className="pj-card__desc">{project.description}</p>}
      </div>

      <div className="pj-card__stats">
        <div className="pj-card__stat">
          <span className="pj-card__stat-value">{formatNumber(project.total_requests)}</span>
          <span className="pj-card__stat-label">Requests</span>
        </div>
        <div className="pj-card__stat-divider" />
        <div className="pj-card__stat">
          <span className="pj-card__stat-value">{project.endpoints_count || 0}</span>
          <span className="pj-card__stat-label">Endpoints</span>
        </div>
        <div className="pj-card__stat-divider" />
        <div className="pj-card__stat">
          <span className="pj-card__stat-value pj-card__stat-value--role">{project.my_role || '—'}</span>
          <span className="pj-card__stat-label">Role</span>
        </div>
      </div>

      <div className="pj-card__key-section">
        <div className="pj-card__key-header">
          <span className="pj-card__key-label">API Key</span>
          <div className="pj-card__key-actions">
            <button className="pj-card__key-btn" onClick={() => setShowKey(!showKey)} title={showKey ? 'Hide' : 'Show'}>
              {showKey ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
              )}
            </button>
            <button className="pj-card__key-btn" onClick={handleCopyKey} title="Copy">
              {copied ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--app-success)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
              )}
            </button>
            <button className="pj-card__key-btn" onClick={handleRegenerate} disabled={regenerating} title="Regenerate">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" /><path d="M16 16h5v5" /></svg>
            </button>
          </div>
        </div>
        <code className="pj-card__key-value">{showKey ? project.api_key : maskedKey}</code>
      </div>

      <div className="pj-card__footer">
        <button className="pj-btn pj-btn--primary" onClick={() => navigate(`/projects/${project.id}`)}>View Dashboard</button>
        <button className="pj-btn pj-btn--ghost" onClick={() => setEditing(true)}>Edit</button>
        {showDeleteConfirm ? (
          <div className="pj-card__delete-confirm">
            <span className="pj-card__delete-text">Are you sure?</span>
            <button className="pj-btn pj-btn--danger" onClick={handleDelete} disabled={deleting}>{deleting ? '...' : 'Yes'}</button>
            <button className="pj-btn pj-btn--ghost" onClick={() => setShowDeleteConfirm(false)}>No</button>
          </div>
        ) : (
          <button className="pj-btn pj-btn--danger-ghost" onClick={() => setShowDeleteConfirm(true)}>Delete</button>
        )}
      </div>
    </div>
  )
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const { registerSubBarRight, registerSubBarLeft } = useOutletContext()

  useEffect(() => {
    getProjects()
      .then(setProjects)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    registerSubBarLeft(
      <span className="subbar__project-count">{projects.length} project{projects.length !== 1 ? 's' : ''}</span>
    )
    return () => registerSubBarLeft(null)
  }, [projects.length, registerSubBarLeft])

  useEffect(() => {
    registerSubBarRight(
      <button className="pj-btn pj-btn--primary" onClick={() => setShowCreate(true)}>
        + New Project
      </button>
    )
    return () => registerSubBarRight(null)
  }, [registerSubBarRight])

  async function handleUpdate(id, data) {
    const updated = await updateProject(id, data)
    setProjects(prev => prev.map(p => p.id === id ? { ...p, ...updated } : p))
  }

  async function handleDelete(id) {
    await deleteProject(id)
    setProjects(prev => prev.filter(p => p.id !== id))
  }

  async function handleRegenerateKey(id) {
    const updated = await regenerateApiKey(id)
    setProjects(prev => prev.map(p => p.id === id ? { ...p, ...updated } : p))
  }

  if (loading) {
    return (
      <div className="projects-page">
        <div className="projects-page__loading">Loading...</div>
      </div>
    )
  }

  return (
    <div className="projects-page">
      {showCreate && (
        <CreateProjectModal
          onCreated={(p) => { setProjects(prev => [...prev, p]); setShowCreate(false) }}
          onCancel={() => setShowCreate(false)}
        />
      )}

      {projects.length === 0 && !showCreate ? (
        <div className="projects-page__empty">
          <div className="projects-page__empty-icon">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 5C2 3.89543 2.89543 3 4 3H7.17157C7.70201 3 8.21071 3.21071 8.58579 3.58579L9.41421 4.41421C9.78929 4.78929 10.298 5 10.8284 5H20C21.1046 5 22 5.89543 22 7V19C22 20.1046 21.1046 21 20 21H4C2.89543 21 2 20.1046 2 19V5Z" />
            </svg>
          </div>
          <p className="projects-page__empty-title">No projects yet</p>
          <p className="projects-page__empty-desc">Create your first project to start tracking API analytics.</p>
          <button className="pj-btn pj-btn--primary" onClick={() => setShowCreate(true)}>+ Create Project</button>
        </div>
      ) : (
        <div className="projects-page__grid">
          {projects.map(p => (
            <ProjectCard key={p.id} project={p} onUpdate={handleUpdate} onDelete={handleDelete} onRegenerateKey={handleRegenerateKey} />
          ))}
        </div>
      )}
    </div>
  )
}
