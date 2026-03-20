import { useState, useEffect, useMemo } from 'react'
import { ResponsiveStream } from '@nivo/stream'
import { useTheme } from 'next-themes'
import { getTimeSeries } from '../../services/analyticsService'
import './ResponseTimeChart.css'

const SERIES_KEYS = ['avg_response_time', 'p50_response_time', 'p95_response_time', 'p99_response_time']

const SERIES_COLORS = {
  avg_response_time: '#6366f1',
  p50_response_time: '#22d3ee',
  p95_response_time: '#fb923c',
  p99_response_time: '#f472b6',
}

const SERIES_LABELS = {
  avg_response_time: 'Avg',
  p50_response_time: 'P50',
  p95_response_time: 'P95',
  p99_response_time: 'P99',
}

const GRANULARITY_FORMAT = {
  hour: (ts) => new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  day: (ts) => new Date(ts).toLocaleDateString([], { month: 'short', day: 'numeric' }),
  '7days': (ts) => new Date(ts).toLocaleDateString([], { month: 'short', day: 'numeric' }),
  month: (ts) => new Date(ts).toLocaleDateString([], { month: 'short', day: 'numeric' }),
}

function formatMs(value) {
  if (value >= 1000) return `${(value / 1000).toFixed(1).replace(/\.0$/, '')}s`
  return `${Math.round(value)}ms`
}

const GRADIENT_DEFS = SERIES_KEYS.map(key => ({
  id: `rt_grad_${key}`,
  type: 'linearGradient',
  colors: [
    { offset: 0, color: SERIES_COLORS[key], opacity: 0.8 },
    { offset: 100, color: SERIES_COLORS[key], opacity: 0.25 },
  ],
}))

const GRADIENT_FILLS = SERIES_KEYS.map(key => ({
  match: { id: key },
  id: `rt_grad_${key}`,
}))

const INFO_TEXT = 'Shows response time percentiles stacked over the selected period. Avg is the mean response time. P50 (median) means 50% of requests were faster. P95/P99 show the slowest 5%/1% of requests — spikes here indicate tail latency issues even when the average looks healthy.'

function InfoButton() {
  const [show, setShow] = useState(false)
  return (
    <span
      className="rt-chart-info"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      <button className="rt-chart-info__btn" aria-label="Info" type="button">i</button>
      {show && (
        <div className="rt-chart-info__popover">
          <p className="rt-chart-info__text">{INFO_TEXT}</p>
        </div>
      )}
    </span>
  )
}

function LoadingSkeleton() {
  return (
    <div className="response-time-chart card-surface">
      <div className="response-time-chart__header">
        <div className="response-time-chart__title-row">
          <h3 className="response-time-chart__title">Response Time</h3>
        </div>
        <div className="response-time-chart__legend-skeleton">
          <span className="rt-skeleton-pill" />
          <span className="rt-skeleton-pill" />
          <span className="rt-skeleton-pill" />
          <span className="rt-skeleton-pill" />
        </div>
      </div>
      <div className="response-time-chart__body">
        <div className="response-time-chart__skeleton">
          <svg viewBox="0 0 800 320" preserveAspectRatio="none" className="rt-skeleton-wave">
            <defs>
              <linearGradient id="rt-skel-grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--app-text-dim)" stopOpacity="0.12" />
                <stop offset="100%" stopColor="var(--app-text-dim)" stopOpacity="0.02" />
              </linearGradient>
            </defs>
            <path d="M0,260 C100,240 200,220 300,200 C400,180 500,140 600,160 C700,180 750,200 800,190 L800,320 L0,320Z" fill="url(#rt-skel-grad)" className="rt-skeleton-path rt-skeleton-path--1" />
            <path d="M0,280 C100,270 200,255 300,245 C400,235 500,210 600,225 C700,240 750,255 800,248 L800,320 L0,320Z" fill="url(#rt-skel-grad)" className="rt-skeleton-path rt-skeleton-path--2" />
          </svg>
        </div>
      </div>
    </div>
  )
}

export default function ResponseTimeChart({ projectId, granularity }) {
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
      .then(res => { if (!cancelled) setTimeSeriesData(res) })
      .catch(() => { if (!cancelled) setError(true) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [projectId, granularity])

  const { chartData, timestamps } = useMemo(() => {
    if (!timeSeriesData?.data?.length) return { chartData: [], timestamps: [] }
    const points = timeSeriesData.data
    const ts = points.map(p => p.timestamp)
    const data = points.map(p => ({
      avg_response_time: p.avg_response_time != null ? Math.round(p.avg_response_time * 100) / 100 : 0,
      p50_response_time: p.p50_response_time != null ? Math.round(p.p50_response_time * 100) / 100 : 0,
      p95_response_time: p.p95_response_time != null ? Math.round(p.p95_response_time * 100) / 100 : 0,
      p99_response_time: p.p99_response_time != null ? Math.round(p.p99_response_time * 100) / 100 : 0,
    }))
    return { chartData: data, timestamps: ts }
  }, [timeSeriesData])

  const formatLabel = GRANULARITY_FORMAT[granularity] || GRANULARITY_FORMAT['7days']

  if (loading) return <LoadingSkeleton />

  if (error || !chartData.length) {
    return (
      <div className="response-time-chart card-surface">
        <div className="response-time-chart__header">
          <div className="response-time-chart__title-row">
            <h3 className="response-time-chart__title">Response Time</h3>
          </div>
        </div>
        <div className="response-time-chart__empty">
          {error ? 'Unable to load chart data' : 'No data available for this period'}
        </div>
      </div>
    )
  }

  const textColor = isDark ? '#555566' : '#999'
  const gridColor = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)'

  return (
    <div className="response-time-chart card-surface response-time-chart--loaded">
      <div className="response-time-chart__header">
        <div className="response-time-chart__title-row">
          <h3 className="response-time-chart__title">Response Time</h3>
          <InfoButton />
        </div>
        <div className="response-time-chart__legend">
          {SERIES_KEYS.map(key => (
            <div key={key} className="response-time-chart__legend-item">
              <span
                className="response-time-chart__legend-dot"
                style={{
                  backgroundColor: SERIES_COLORS[key],
                  boxShadow: `0 0 6px ${SERIES_COLORS[key]}88`,
                }}
              />
              <span className="response-time-chart__legend-label">{SERIES_LABELS[key]}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="response-time-chart__body">
        <ResponsiveStream
          data={chartData}
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
            format: formatMs,
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
              domain: { line: { stroke: 'transparent' } },
            },
            grid: {
              line: { stroke: gridColor, strokeDasharray: '3 3' },
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
              <div className="response-time-chart__tooltip">
                <div className="response-time-chart__tooltip-date">
                  {formatLabel(ts)}
                </div>
                <div className="response-time-chart__tooltip-row response-time-chart__tooltip-row--total">
                  <span>Stacked Total</span>
                  <span className="response-time-chart__tooltip-value">{formatMs(total)}</span>
                </div>
                {SERIES_KEYS.map(key => {
                  const item = slice.stack.find(s => s.layerId === key)
                  const val = item?.value || 0
                  return (
                    <div key={key} className="response-time-chart__tooltip-row">
                      <span className="response-time-chart__tooltip-key">
                        <span
                          className="response-time-chart__tooltip-dot"
                          style={{
                            backgroundColor: SERIES_COLORS[key],
                            boxShadow: `0 0 4px ${SERIES_COLORS[key]}aa`,
                          }}
                        />
                        {SERIES_LABELS[key]}
                      </span>
                      <span className="response-time-chart__tooltip-value">{formatMs(val)}</span>
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
