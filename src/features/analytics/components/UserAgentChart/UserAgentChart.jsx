import { useState, useEffect, useMemo } from 'react'
import { ResponsivePie } from '@nivo/pie'
import { useTheme } from 'next-themes'
import { getUserAgents } from '../../services/analyticsService'
import './UserAgentChart.css'

const PALETTE = [
  '#6366f1', '#22d3ee', '#34d399', '#fb923c',
  '#f472b6', '#a78bfa', '#facc15', '#f87171',
  '#818cf8',
]

function LoadingSkeleton() {
  return (
    <div className="user-agent-chart card-surface">
      <div className="user-agent-chart__header">
        <h3 className="user-agent-chart__title">User Agents</h3>
      </div>
      <div className="user-agent-chart__pie-area">
        <div className="ua-skeleton-ring" />
      </div>
    </div>
  )
}

export default function UserAgentChart({ projectId, granularity }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'

  useEffect(() => {
    if (!projectId) return
    let cancelled = false
    setLoading(true)
    setError(false)
    getUserAgents(projectId, granularity)
      .then(res => { if (!cancelled) setData(res) })
      .catch(() => { if (!cancelled) setError(true) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [projectId, granularity])

  const { pieData, totalRequests } = useMemo(() => {
    if (!data?.user_agents?.length) return { pieData: [], totalRequests: 0 }
    const total = data.total_requests || data.user_agents.reduce((s, a) => s + a.count, 0)
    const items = data.user_agents.map((agent, i) => ({
      id: agent.name,
      label: agent.name,
      value: agent.count,
      color: PALETTE[i % PALETTE.length],
    }))
    return { pieData: items, totalRequests: total }
  }, [data])

  if (loading) return <LoadingSkeleton />

  if (error || !pieData.length) {
    return (
      <div className="user-agent-chart card-surface">
        <div className="user-agent-chart__header">
          <h3 className="user-agent-chart__title">User Agents</h3>
        </div>
        <div className="user-agent-chart__empty">
          {error ? 'Unable to load data' : 'No data available'}
        </div>
      </div>
    )
  }

  return (
    <div className="user-agent-chart card-surface user-agent-chart--loaded">
      <div className="user-agent-chart__header">
        <h3 className="user-agent-chart__title">User Agents</h3>
      </div>
      <div className="user-agent-chart__pie-area">
        <ResponsivePie
          data={pieData}
          colors={d => d.data.color}
          margin={{ top: 24, right: 24, bottom: 24, left: 24 }}
          innerRadius={0.58}
          padAngle={1.5}
          cornerRadius={4}
          activeOuterRadiusOffset={6}
          borderWidth={0}
          enableArcLabels={false}
          enableArcLinkLabels={false}
          tooltip={({ datum }) => {
            const pct = totalRequests ? ((datum.value / totalRequests) * 100).toFixed(1) : 0
            return (
              <div className="user-agent-chart__tooltip">
                <span className="user-agent-chart__tooltip-key">
                  <span
                    className="user-agent-chart__tooltip-dot"
                    style={{
                      backgroundColor: datum.color,
                      boxShadow: `0 0 4px ${datum.color}aa`,
                    }}
                  />
                  {datum.label}
                </span>
                <span className="user-agent-chart__tooltip-value">
                  {datum.value.toLocaleString()} ({pct}%)
                </span>
              </div>
            )
          }}
          theme={{
            tooltip: {
              container: {
                background: 'transparent',
                boxShadow: 'none',
                padding: 0,
              },
            },
          }}
        />
        <div className="user-agent-chart__center-label">
          <span className="user-agent-chart__center-value">
            {totalRequests >= 1000
              ? `${(totalRequests / 1000).toFixed(1).replace(/\.0$/, '')}k`
              : totalRequests}
          </span>
          <span className="user-agent-chart__center-text">requests</span>
        </div>
      </div>
    </div>
  )
}
