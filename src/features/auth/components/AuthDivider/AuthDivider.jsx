import './AuthDivider.css'

export default function AuthDivider({ text = 'or continue with email' }) {
  return (
    <div className="auth-divider">
      <span className="auth-divider__text">{text}</span>
    </div>
  )
}
