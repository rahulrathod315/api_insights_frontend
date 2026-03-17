import { Link } from 'react-router-dom'
import FloatingSquares from '../../shared/components/FloatingSquares/FloatingSquares'
import './AuthLayout.css'

export default function AuthLayout({ children }) {
  return (
    <div className="auth-layout">
      <div className="auth-layout__canvas-wrap" aria-hidden="true">
        <FloatingSquares className="auth-layout__canvas" />
      </div>
      <div className="auth-layout__content">
        {children}
      </div>
      <div className="auth-layout__footer">
        <Link to="#" className="auth-layout__footer-link">Terms</Link>
        <Link to="#" className="auth-layout__footer-link">Privacy Policy</Link>
      </div>
    </div>
  )
}
