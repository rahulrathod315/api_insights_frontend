import { useLocation } from 'react-router-dom'
import GranularityDropdown from '../TopBar/GranularityDropdown'
import './SubBar.css'

const PAGE_TITLES = {
  '/projects': 'Projects',
  '/settings': 'Settings',
}

const HIDE_GRANULARITY = ['/projects', '/settings']

export default function SubBar({ granularity, onGranularityChange, subBarLeft, subBarRight }) {
  const { pathname } = useLocation()
  const pageTitle = PAGE_TITLES[pathname]
  const showGranularity = !HIDE_GRANULARITY.includes(pathname)

  return (
    <div className="subbar">
      <div className="subbar__left">
        {pageTitle && (
          <div className="subbar__page-heading">
            <h1 className="subbar__page-title">{pageTitle}</h1>
            {subBarLeft}
          </div>
        )}
      </div>
      <div className="subbar__spacer" />
      {showGranularity && (
        <GranularityDropdown value={granularity} onChange={onGranularityChange} />
      )}
      {!showGranularity && subBarRight}
    </div>
  )
}
