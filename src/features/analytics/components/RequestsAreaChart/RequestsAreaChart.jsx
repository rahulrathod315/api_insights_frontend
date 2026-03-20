import { useState, useEffect, useMemo } from 'react'
import { ResponsiveStream } from '@nivo/stream'
import { useTheme } from 'next-themes'
import { getTimeSeries } from '../../services/analyticsService'
import './RequestsAreaChart.css'

const REQUESTS_INFO = 'Shows the volume of API requests stacked by HTTP status code over the selected period. 2xx are successful responses, 4xx are client errors (bad requests, auth failures), and 5xx are server-side failures.'

const SERIES_KEYS = ['status_2xx', 'status_4xx', 'status_5xx']

const SERIES_COLORS = {
  status_2xx: '#34d399',
  status_4xx: '#facc15',
  status_5xx: '#f87171',
}

const SERIES_LABELS = {
  status_2xx: '2xx Success',
  status_4xx: '4xx Client Error',
  status_5xx: '5xx Server Error',
}

const GRANULARITY_FORMAT = {
  hour: (ts) => {
    const d = new Date(ts)
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  },
  day: (ts) => {
    const d = new Date(ts)
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' })
  },
  '7days': (ts) => {
    const d = new Date(ts)
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' })
  },
  month: (ts) => {
    const d = new Date(ts)
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' })
  },
}

function formatAxisValue(value) {
  if (value >= 1000) return `${(value / 1000).toFixed(1).replace(/\.0$/, '')}k`
  return String(value)
}

/* SVG gradient defs for each series — fades color from top to transparent at bottom */
const GRADIENT_DEFS = [
  {
    id: 'grad_2xx',
    type: 'linearGradient',
    colors: [
      { offset: 0, color: SERIES_COLORS.status_2xx, opacity: 0.8 },
      { offset: 100, color: SERIES_COLORS.status_2xx, opacity: 0.25 },
    ],
  },
  {
    id: 'grad_4xx',
    type: 'linearGradient',
    colors: [
      { offset: 0, color: SERIES_COLORS.status_4xx, opacity: 0.8 },
      { offset: 100, color: SERIES_COLORS.status_4xx, opacity: 0.25 },
    ],
  },
  {
    id: 'grad_5xx',
    type: 'linearGradient',
    colors: [
      { offset: 0, color: SERIES_COLORS.status_5xx, opacity: 0.8 },
      { offset: 100, color: SERIES_COLORS.status_5xx, opacity: 0.25 },
    ],
  },
]

const GRADIENT_FILLS = [
  { match: { id: 'status_2xx' }, id: 'grad_2xx' },
  { match: { id: 'status_4xx' }, id: 'grad_4xx' },
  { match: { id: 'status_5xx' }, id: 'grad_5xx' },
]

function InfoButton({ text }) {
  const [show, setShow] = useState(false)
  return (
    <span
      className="requests-area-chart__info"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      <button className="requests-area-chart__info-btn" aria-label="Info" type="button">i</button>
      {show && (
        <div className="requests-area-chart__info-popover">
          <p className="requests-area-chart__info-text">{text}</p>
        </div>
      )}
    </span>
  )
}

function LoadingSkeleton() {
  return (
    <div className="requests-area-chart card-surface">
      <div className="requests-area-chart__header">
        <h3 className="requests-area-chart__title">Requests Over Time</h3>
        <div className="requests-area-chart__legend-skeleton">
          <span className="skeleton-pill" />
          <span className="skeleton-pill" />
          <span className="skeleton-pill" />
        </div>
      </div>
      <div className="requests-area-chart__body">
        <div className="requests-area-chart__skeleton">
          <svg viewBox="0 0 800 280" preserveAspectRatio="none" className="skeleton-wave">
            <defs>
              <linearGradient id="skel-grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--app-text-dim)" stopOpacity="0.12" />
                <stop offset="100%" stopColor="var(--app-text-dim)" stopOpacity="0.02" />
              </linearGradient>
            </defs>
            <path
              d="M0,220 C80,200 160,180 240,160 C320,140 400,100 480,120 C560,140 640,180 720,170 L800,160 L800,280 L0,280Z"
              fill="url(#skel-grad)"
              className="skeleton-wave__path skeleton-wave__path--1"
            />
            <path
              d="M0,240 C80,230 160,210 240,200 C320,190 400,160 480,175 C560,190 640,220 720,210 L800,200 L800,280 L0,280Z"
              fill="url(#skel-grad)"
              className="skeleton-wave__path skeleton-wave__path--2"
            />
            <path
              d="M0,260 C80,255 160,245 240,240 C320,235 400,220 480,230 C560,240 640,255 720,250 L800,245 L800,280 L0,280Z"
              fill="url(#skel-grad)"
              className="skeleton-wave__path skeleton-wave__path--3"
            />
          </svg>
        </div>
      </div>
    </div>
  )
}

export default function RequestsAreaChart({ projectId, granularity }) {
  const [timeSeriesData, setTimeSeriesData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'

  useEffect(() => {
    if (!projectId) return
    let cancelled = false
    setLoading(true)
    setError(false)
    getTimeSeries(projectId, granularity)
      .then(res => {
        if (!cancelled) setTimeSeriesData(res)
      })
      .catch(() => {
        if (!cancelled) setError(true)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [projectId, granularity])

  const { chartData, timestamps } = useMemo(() => {
    if (!timeSeriesData?.data?.length) return { chartData: [], timestamps: [] }
    const points = timeSeriesData.data
    const ts = points.map(p => p.timestamp)
    const data = points.map(p => ({
      status_2xx: p.status_2xx || 0,
      status_4xx: p.status_4xx || 0,
      status_5xx: p.status_5xx || 0,
    }))
    return { chartData: data, timestamps: ts }
  }, [timeSeriesData])

  const formatLabel = GRANULARITY_FORMAT[granularity] || GRANULARITY_FORMAT['7days']

  if (loading) return <LoadingSkeleton />

  if (error) {
    return (
      <div className="requests-area-chart card-surface">
        <div className="requests-area-chart__header">
          <h3 className="requests-area-chart__title">Requests Over Time</h3>
        </div>
        <div className="requests-area-chart__empty">
          Unable to load chart data
        </div>
      </div>
    )
  }

  const hasData = chartData.length > 0
  const displayData = hasData
    ? chartData
    : Array.from({ length: 7 }, () => ({ status_2xx: 0, status_4xx: 0, status_5xx: 0 }))

  const textColor = isDark ? '#555566' : '#999'
  const gridColor = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)'

  return (
    <div className="requests-area-chart card-surface requests-area-chart--loaded">
      <div className="requests-area-chart__header">
        <div className="requests-area-chart__title-row">
          <h3 className="requests-area-chart__title">Requests Over Time</h3>
          <InfoButton text={REQUESTS_INFO} />
        </div>
        <div className="requests-area-chart__legend">
          {SERIES_KEYS.map(key => (
            <div key={key} className="requests-area-chart__legend-item">
              <span
                className="requests-area-chart__legend-dot"
                style={{
                  backgroundColor: SERIES_COLORS[key],
                  boxShadow: `0 0 6px ${SERIES_COLORS[key]}88`,
                }}
              />
              <span className="requests-area-chart__legend-label">{SERIES_LABELS[key]}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="requests-area-chart__body" style={{ position: 'relative' }}>
        {!hasData && (
          <div className="requests-area-chart__no-data-overlay">No data available for this period</div>
        )}
        <ResponsiveStream
          data={displayData}
          keys={SERIES_KEYS}
          offsetType="none"
          curve="monotoneX"
          colors={SERIES_KEYS.map(k => SERIES_COLORS[k])}
          fillOpacity={1}
          borderWidth={0}
          defs={GRADIENT_DEFS}
          fill={GRADIENT_FILLS}
          enableGridX={false}
          enableGridY={true}
          axisTop={null}
          axisRight={null}
          axisBottom={{
            tickSize: 0,
            tickPadding: 12,
            format: (index) => {
              if (!timestamps[index]) return ''
              const total = timestamps.length
              const maxTicks = 7
              const step = Math.max(1, Math.floor(total / maxTicks))
              if (index % step !== 0 && index !== total - 1) return ''
              return formatLabel(timestamps[index])
            },
          }}
          axisLeft={{
            tickSize: 0,
            tickPadding: 12,
            tickValues: 5,
            format: formatAxisValue,
          }}
          margin={{ top: 12, right: 24, bottom: 44, left: 56 }}
          theme={{
            axis: {
              ticks: {
                text: {
                  fill: textColor,
                  fontSize: 11,
                  fontFamily: 'DM Sans, sans-serif',
                  fontWeight: 500,
                },
              },
              domain: {
                line: { stroke: 'transparent' },
              },
            },
            grid: {
              line: {
                stroke: gridColor,
                strokeDasharray: '3 3',
              },
            },
            crosshair: {
              line: {
                stroke: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)',
                strokeWidth: 1,
                strokeDasharray: '4 3',
              },
            },
          }}
          tooltip={() => null}
          enableStackTooltip={true}
          stackTooltip={({ slice }) => {
            const ts = timestamps[slice.index]
            if (ts == null) return null
            const total = slice.stack.reduce((sum, l) => sum + l.value, 0)
            return (
              <div className="requests-area-chart__tooltip">
                <div className="requests-area-chart__tooltip-date">
                  {formatLabel(ts)}
                </div>
                <div className="requests-area-chart__tooltip-row requests-area-chart__tooltip-row--total">
                  <span>Total Requests</span>
                  <span className="requests-area-chart__tooltip-value">{total.toLocaleString()}</span>
                </div>
                {SERIES_KEYS.map(key => {
                  const item = slice.stack.find(s => s.layerId === key)
                  const val = item?.value || 0
                  return (
                    <div key={key} className="requests-area-chart__tooltip-row">
                      <span className="requests-area-chart__tooltip-key">
                        <span
                          className="requests-area-chart__tooltip-dot"
                          style={{
                            backgroundColor: SERIES_COLORS[key],
                            boxShadow: `0 0 4px ${SERIES_COLORS[key]}aa`,
                          }}
                        />
                        {SERIES_LABELS[key]}
                      </span>
                      <span className="requests-area-chart__tooltip-value">{val.toLocaleString()}</span>
                    </div>
                  )
                })}
              </div>
            )
          }}
        />
      </div>
    </div>
  )
}
