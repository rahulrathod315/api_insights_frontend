import ProjectSwitcher from './ProjectSwitcher'
import SearchBar from './SearchBar'
import NotificationBell from './NotificationBell'
import ThemeToggle from '../../../shared/components/ThemeToggle/ThemeToggle'
import './TopBar.css'

export default function TopBar({ selectedProject, onProjectChange }) {
  return (
    <header className="topbar">
      <ProjectSwitcher selectedProject={selectedProject} onProjectChange={onProjectChange} />
      <SearchBar />
      <div className="topbar__spacer" />
      <div className="topbar__actions">
        <NotificationBell />
        <ThemeToggle />
      </div>
    </header>
  )
}
