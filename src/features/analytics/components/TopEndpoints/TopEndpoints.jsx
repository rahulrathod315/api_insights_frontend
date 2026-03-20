import { useState, useEffect } from 'react'
import { getRequestsPerEndpoint } from '../../services/analyticsService'
import './TopEndpoints.css'

const BAR_COLORS = {
  GET: '#34d399',
  POST: '#6366f1',
  PUT: '#fb923c',
  PATCH: '#facc15',
  DELETE: '#f87171',
}

function InfoButton({ text }) {
  const [show, setShow] = useState(false)
  return (
    <span
      className="chart-info"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      <button className="chart-info__btn" aria-label="Info" type="button">i</button>
      {show && (
        <div className="chart-info__popover">
          <p className="chart-info__text">{text}</p>
        </div>
      )}
    </span>
  )
}

function LoadingSkeleton() {
  return (
    <div className="top-endpoints card-surface">
      <div className="top-endpoints__header">
        <h3 className="top-endpoints__title">Top Endpoints</h3>
      </div>
      <div className="top-endpoints__list">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="te-skeleton-row">
            <span className="te-skeleton-badge" />
            <span className="te-skeleton-bar" style={{ width: `${80 - i * 10}%` }} />
          </div>
        ))}
      </div>
    </div>
  )
}

export default function TopEndpoints({ projectId, granularity }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!projectId) return
    let cancelled = false
    setLoading(true)
    setError(false)
    getRequestsPerEndpoint(projectId, granularity)
      .then(res => { if (!cancelled) setData(res) })
      .catch(() => { if (!cancelled) setError(true) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [projectId, granularity])

  if (loading) return <LoadingSkeleton />

  const endpoints = data?.endpoints || []

  if (error) {
    return (
      <div className="top-endpoints card-surface">
        <div className="top-endpoints__header">
          <h3 className="top-endpoints__title">Top Endpoints</h3>
        </div>
        <div className="top-endpoints__empty">
          Unable to load data
        </div>
      </div>
    )
  }

  const hasData = endpoints.length > 0
  const maxRequests = endpoints[0]?.total_requests || 1
  const top = endpoints.slice(0, 7)

  return (
    <div className="top-endpoints card-surface top-endpoints--loaded">
      <div className="top-endpoints__header">
        <h3 className="top-endpoints__title">Top Endpoints</h3>
        <InfoButton text="Endpoints ranked by total request count in the selected time period. The bar shows relative traffic volume. Avg response time and success rate are shown for each endpoint." />
      </div>
      <div className="top-endpoints__list" style={{ position: 'relative' }}>
        {!hasData && (
          <div className="top-endpoints__no-data-overlay">No endpoints yet</div>
        )}
        {top.map((ep, i) => {
          const barPct = (ep.total_requests / maxRequests) * 100
          const barColor = BAR_COLORS[ep.method] || '#6a6a7a'
          return (
            <div key={ep.id} className="top-endpoints__row">
              <div className="top-endpoints__rank">{i + 1}</div>
              <div className="top-endpoints__info">
                <div className="top-endpoints__path-row">
                  <span className="top-endpoints__method">
                    {ep.method}
                  </span>
                  <span className="top-endpoints__path" title={ep.path}>{ep.path}</span>
                </div>
                <div className="top-endpoints__bar-wrap">
                  <div
                    className="top-endpoints__bar"
                    style={{ width: `${barPct}%`, backgroundColor: barColor }}
                  />
                </div>
              </div>
              <div className="top-endpoints__metrics">
                <span className="top-endpoints__count">{ep.total_requests.toLocaleString()}</span>
                <span className="top-endpoints__meta">
                  {ep.avg_response_time_ms != null ? `${Math.round(ep.avg_response_time_ms)}ms` : '—'}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
