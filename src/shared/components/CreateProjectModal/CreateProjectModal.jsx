import { useState } from 'react'
import { createProject } from '../../../features/projects'
import './CreateProjectModal.css'

export default function CreateProjectModal({ onCreated, onCancel }) {
  const [name, setName] = useState('')
  const [desc, setDesc] = useState('')
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return
    setCreating(true)
    setError('')
    try {
      const created = await createProject({ name: trimmed, description: desc.trim() })
      onCreated(created)
    } catch (err) {
      setError(err?.response?.data?.errors?.name?.[0] || err?.response?.data?.message || 'Failed to create project')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="create-project-modal__overlay" onClick={onCancel}>
      <div className="create-project-modal" onClick={e => e.stopPropagation()}>
        <div className="create-project-modal__header">
          <h3 className="create-project-modal__title">New Project</h3>
          <button type="button" className="create-project-modal__close" onClick={onCancel}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          </button>
        </div>
        <form className="create-project-modal__form" onSubmit={handleSubmit}>
          <label className="create-project-modal__field">
            <span className="create-project-modal__label">Project Name</span>
            <input className="create-project-modal__input" value={name} onChange={e => { setName(e.target.value); setError('') }} placeholder="My API Project" autoFocus />
          </label>
          <label className="create-project-modal__field">
            <span className="create-project-modal__label">Description</span>
            <textarea className="create-project-modal__textarea" value={desc} onChange={e => setDesc(e.target.value)} placeholder="What is this project about? (optional)" rows={2} />
          </label>
          {error && <p className="create-project-modal__error">{error}</p>}
          <div className="create-project-modal__actions">
            <button type="button" className="create-project-modal__btn create-project-modal__btn--ghost" onClick={onCancel} disabled={creating}>Cancel</button>
            <button type="submit" className="create-project-modal__btn create-project-modal__btn--primary" disabled={creating || !name.trim()}>{creating ? 'Creating...' : 'Create Project'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}
