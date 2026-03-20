import { Sun, Moon } from 'lucide-react'
import { useTheme } from 'next-themes'
import './ThemeToggle.css'

export default function ThemeToggle({ className }) {
  const { theme, setTheme } = useTheme()

  return (
    <button
      className={`theme-toggle ${className || ''}`}
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      aria-label="Toggle theme"
    >
      <Sun className="theme-toggle__icon theme-toggle__icon--light" size={18} />
      <Moon className="theme-toggle__icon theme-toggle__icon--dark" size={18} />
    </button>
  )
}
