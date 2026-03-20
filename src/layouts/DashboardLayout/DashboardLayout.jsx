import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar/Sidebar'
import TopBar from './TopBar/TopBar'
import SubBar from './SubBar/SubBar'
import './DashboardLayout.css'

export default function DashboardLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const [granularity, setGranularity] = useState('7days')
  const [selectedProject, setSelectedProject] = useState(null)

  return (
    <div className="dashboard-layout">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(c => !c)} />
      <div className="dashboard-layout__main">
        <TopBar selectedProject={selectedProject} onProjectChange={setSelectedProject} />
        <SubBar granularity={granularity} onGranularityChange={setGranularity} />
        <div className="dashboard-layout__content">
          <Outlet context={{ granularity, selectedProject }} />
        </div>
      </div>
    </div>
  )
}
