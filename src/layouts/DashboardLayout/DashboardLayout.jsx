import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar/Sidebar'
import TopBar from './TopBar/TopBar'
import './DashboardLayout.css'

export default function DashboardLayout() {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className="dashboard-layout">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(c => !c)} />
      <div className="dashboard-layout__main">
        <TopBar />
        <div className="dashboard-layout__content">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
