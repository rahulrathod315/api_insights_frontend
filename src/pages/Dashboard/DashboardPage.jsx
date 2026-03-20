import { useState, useEffect } from 'react'
import { useOutletContext } from 'react-router-dom'
import { getDashboardOverview } from '../../features/analytics'
import RequestsAreaChart from '../../features/analytics/components/RequestsAreaChart/RequestsAreaChart'
import TopEndpoints from '../../features/analytics/components/TopEndpoints/TopEndpoints'
import UserAgentChart from '../../features/analytics/components/UserAgentChart/UserAgentChart'
import ResponseTimeChart from '../../features/analytics/components/ResponseTimeChart/ResponseTimeChart'
import './DashboardPage.css'

function formatNumber(n) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, '') + 'K'
  return String(n)
}

function pct(part, total) {
  if (!total) return 0
  return Math.round((part / total) * 1000) / 10
}

const GRANULARITY_LABELS = {
  hour: 'last hour',
  day: 'last 24 hours',
  '7days': 'last 7 days',
  month: 'last 30 days',
}

const CARD_INFO = {
  requests: 'Total number of API requests received for this project in the selected time period. Includes all HTTP methods and status codes.',
  success: 'Requests that returned an HTTP 2xx status code, indicating the server successfully processed the request.',
  clientErrors: 'Requests that returned an HTTP 4xx status code, indicating a client-side issue such as a bad request, missing authentication, or a resource not found.',
  serverErrors: 'Requests that returned an HTTP 5xx status code, indicating a server-side failure such as an internal error, gateway timeout, or service unavailability.',
}

function StatCard({ label, info, children }) {
  const [showInfo, setShowInfo] = useState(false)

  return (
    <div className="stat-card">
      <div className="stat-card__header">
        <span className="stat-card__label">{label}</span>
        <span
          className="stat-card__info"
          onMouseEnter={() => setShowInfo(true)}
          onMouseLeave={() => setShowInfo(false)}
        >
          <button className="stat-card__info-btn" aria-label="Info" type="button">
            i
          </button>
        </span>
      </div>

      <div className="stat-card__body">
        <div className={`stat-card__data ${showInfo ? 'stat-card__data--hidden' : ''}`}>
          {children}
        </div>
        <div className={`stat-card__info-overlay ${showInfo ? 'stat-card__info-overlay--visible' : ''}`}>
          <p className="stat-card__info-text">{info}</p>
        </div>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const { granularity, selectedProject } = useOutletContext()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    getDashboardOverview(granularity)
      .then(res => {
        if (!cancelled) setData(res)
      })
      .catch(() => {
        if (!cancelled) setData(null)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [granularity])

  if (loading) {
    return (
      <div className="dashboard-page">
        <div className="dashboard-page__loading">Loading...</div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="dashboard-page">
        <div className="dashboard-page__empty">Unable to load dashboard data</div>
      </div>
    )
  }

  const { totals, period } = data
  const periodLabel = GRANULARITY_LABELS[granularity] || `last ${period.days} days`
  const total = totals.total_requests
  const successPct = pct(totals.status_2xx, total)
  const clientErrPct = pct(totals.status_4xx, total)
  const serverErrPct = pct(totals.status_5xx, total)

  return (
    <div className="dashboard-page">
      <div className="dashboard-page__stats">
        {/* Total Requests */}
        <StatCard label="Total Requests" info={CARD_INFO.requests}>
          <span className="stat-card__value">{formatNumber(total)}</span>
          <span className="stat-card__period">{periodLabel}</span>
        </StatCard>

        {/* Success (2xx) */}
        <StatCard label="Success" info={CARD_INFO.success}>
          <div className="stat-card__value-row">
            <span className="stat-card__value">{formatNumber(totals.status_2xx)}</span>
            <span className="stat-card__badge">{successPct}%</span>
          </div>
          <span className="stat-card__period">{periodLabel}</span>
        </StatCard>

        {/* Client Errors (4xx) */}
        <StatCard label="Client Errors" info={CARD_INFO.clientErrors}>
          <div className="stat-card__value-row">
            <span className="stat-card__value">{formatNumber(totals.status_4xx)}</span>
            <span className="stat-card__badge">{clientErrPct}%</span>
          </div>
          <span className="stat-card__period">{periodLabel}</span>
        </StatCard>

        {/* Server Errors (5xx) */}
        <StatCard label="Server Errors" info={CARD_INFO.serverErrors}>
          <div className="stat-card__value-row">
            <span className="stat-card__value">{formatNumber(totals.status_5xx)}</span>
            <span className="stat-card__badge">{serverErrPct}%</span>
          </div>
          <span className="stat-card__period">{periodLabel}</span>
        </StatCard>
      </div>

      {selectedProject && (
        <>
          <RequestsAreaChart projectId={selectedProject.id} granularity={granularity} />
          <div className="dashboard-page__charts-row">
            <TopEndpoints projectId={selectedProject.id} granularity={granularity} />
            <UserAgentChart projectId={selectedProject.id} granularity={granularity} />
          </div>
          <ResponseTimeChart projectId={selectedProject.id} granularity={granularity} />
        </>
      )}
    </div>
  )
}
