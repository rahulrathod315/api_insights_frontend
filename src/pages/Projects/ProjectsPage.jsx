import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getProjects, createProject, updateProject, deleteProject, regenerateApiKey } from '../../features/projects'
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

function CopyIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  )
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
      const msg = err?.response?.data?.errors?.name?.[0]
        || err?.response?.data?.message
        || 'Failed to update project'
      setError(msg)
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
    } catch {
      // silently fail
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
    ? project.api_key.slice(0, 8) + '...' + project.api_key.slice(-4)
    : '—'

  return (
    <div className="project-card card-surface">
      {editing ? (
        <form className="project-card__edit-form" onSubmit={handleSave}>
          <input
            className="project-card__edit-input"
            value={name}
            onChange={e => { setName(e.target.value); setError('') }}
            placeholder="Project name"
            autoFocus
          />
          <textarea
            className="project-card__edit-textarea"
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Description (optional)"
            rows={2}
          />
          {error && <p className="project-card__edit-error">{error}</p>}
          <div className="project-card__edit-actions">
            <button type="button" className="project-card__btn project-card__btn--secondary" onClick={handleCancelEdit} disabled={saving}>Cancel</button>
            <button type="submit" className="project-card__btn project-card__btn--primary" disabled={saving || !name.trim()}>
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      ) : (
        <>
          <div className="project-card__header">
            <div className="project-card__title-row">
              <h3 className="project-card__name">{project.name}</h3>
              <span className={`project-card__status ${project.is_active ? 'project-card__status--active' : 'project-card__status--inactive'}`}>
                {project.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
            {project.description && (
              <p className="project-card__description">{project.description}</p>
            )}
          </div>

          <div className="project-card__stats">
            <div className="project-card__stat">
              <span className="project-card__stat-value">{formatNumber(project.total_requests)}</span>
              <span className="project-card__stat-label">Requests</span>
            </div>
            <div className="project-card__stat">
              <span className="project-card__stat-value">{project.endpoints_count || 0}</span>
              <span className="project-card__stat-label">Endpoints</span>
            </div>
            <div className="project-card__stat">
              <span className="project-card__stat-value">{project.my_role || '—'}</span>
              <span className="project-card__stat-label">Role</span>
            </div>
          </div>

          <div className="project-card__api-key">
            <span className="project-card__api-key-label">API Key</span>
            <div className="project-card__api-key-row">
              <code className="project-card__api-key-value">{maskedKey}</code>
              <button className="project-card__icon-btn" onClick={handleCopyKey} title="Copy API key">
                {copied ? <span className="project-card__copied">Copied</span> : <CopyIcon />}
              </button>
              <button
                className="project-card__icon-btn"
                onClick={handleRegenerate}
                disabled={regenerating}
                title="Regenerate API key"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                  <path d="M3 3v5h5" />
                  <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
                  <path d="M16 16h5v5" />
                </svg>
              </button>
            </div>
          </div>

          <div className="project-card__meta">
            <span className="project-card__date">Created {formatDate(project.created_at)}</span>
          </div>

          <div className="project-card__actions">
            <button className="project-card__btn project-card__btn--secondary" onClick={() => navigate(`/projects/${project.id}`)}>
              View Dashboard
            </button>
            <button className="project-card__btn project-card__btn--secondary" onClick={() => setEditing(true)}>
              Edit
            </button>
            {showDeleteConfirm ? (
              <div className="project-card__delete-confirm">
                <span className="project-card__delete-text">Delete?</span>
                <button className="project-card__btn project-card__btn--danger" onClick={handleDelete} disabled={deleting}>
                  {deleting ? 'Deleting...' : 'Yes'}
                </button>
                <button className="project-card__btn project-card__btn--secondary" onClick={() => setShowDeleteConfirm(false)} disabled={deleting}>
                  No
                </button>
              </div>
            ) : (
              <button className="project-card__btn project-card__btn--danger" onClick={() => setShowDeleteConfirm(true)}>
                Delete
              </button>
            )}
          </div>
        </>
      )}
    </div>
  )
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState('')

  useEffect(() => {
    fetchProjects()
  }, [])

  async function fetchProjects() {
    try {
      const data = await getProjects()
      setProjects(data)
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }

  async function handleCreate(e) {
    e.preventDefault()
    const trimmed = newName.trim()
    if (!trimmed) return
    setCreating(true)
    setCreateError('')
    try {
      const created = await createProject({ name: trimmed, description: newDesc.trim() })
      setProjects(prev => [...prev, created])
      setShowCreate(false)
      setNewName('')
      setNewDesc('')
    } catch (err) {
      const msg = err?.response?.data?.errors?.name?.[0]
        || err?.response?.data?.message
        || 'Failed to create project'
      setCreateError(msg)
    } finally {
      setCreating(false)
    }
  }

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
        <div className="projects-page__header">
          <h1 className="projects-page__title">Projects</h1>
        </div>
        <div className="projects-page__loading">Loading...</div>
      </div>
    )
  }

  return (
    <div className="projects-page">
      <div className="projects-page__header">
        <div>
          <h1 className="projects-page__title">Projects</h1>
          <p className="projects-page__subtitle">Manage your API projects</p>
        </div>
        <button
          className="projects-page__create-btn"
          onClick={() => setShowCreate(true)}
        >
          + New Project
        </button>
      </div>

      {showCreate && (
        <div className="projects-page__create-card card-surface">
          <h3 className="projects-page__create-title">Create New Project</h3>
          <form onSubmit={handleCreate}>
            <div className="projects-page__create-fields">
              <input
                className="projects-page__create-input"
                type="text"
                placeholder="Project name"
                value={newName}
                onChange={e => { setNewName(e.target.value); setCreateError('') }}
                autoFocus
              />
              <textarea
                className="projects-page__create-input projects-page__create-textarea"
                placeholder="Description (optional)"
                value={newDesc}
                onChange={e => setNewDesc(e.target.value)}
                rows={2}
              />
            </div>
            {createError && <p className="projects-page__create-error">{createError}</p>}
            <div className="projects-page__create-actions">
              <button
                type="button"
                className="project-card__btn project-card__btn--secondary"
                onClick={() => { setShowCreate(false); setNewName(''); setNewDesc(''); setCreateError('') }}
                disabled={creating}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="project-card__btn project-card__btn--primary"
                disabled={creating || !newName.trim()}
              >
                {creating ? 'Creating...' : 'Create Project'}
              </button>
            </div>
          </form>
        </div>
      )}

      {projects.length === 0 && !showCreate ? (
        <div className="projects-page__empty card-surface">
          <p className="projects-page__empty-text">No projects yet</p>
          <p className="projects-page__empty-sub">Create your first project to start tracking API analytics.</p>
          <button className="project-card__btn project-card__btn--primary" onClick={() => setShowCreate(true)}>
            + Create Project
          </button>
        </div>
      ) : (
        <div className="projects-page__grid">
          {projects.map(p => (
            <ProjectCard
              key={p.id}
              project={p}
              onUpdate={handleUpdate}
              onDelete={handleDelete}
              onRegenerateKey={handleRegenerateKey}
            />
          ))}
        </div>
      )}
    </div>
  )
}
