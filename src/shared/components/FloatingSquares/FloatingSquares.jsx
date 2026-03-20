import { useRef, useEffect } from 'react'

const COLOURS = [
  { r: 255, g: 92, b: 56 },
  { r: 255, g: 154, b: 108 },
  { r: 255, g: 61, b: 110 },
  { r: 255, g: 122, b: 50 },
  { r: 255, g: 190, b: 55 },
  { r: 255, g: 75, b: 75 },
  { r: 200, g: 75, b: 200 },
  { r: 255, g: 200, b: 70 },
  { r: 255, g: 130, b: 65 },
  { r: 180, g: 80, b: 220 },
]

const COUNT = 130
const FLEE_DIST = 120

function rnd(a, b) { return a + Math.random() * (b - a) }
function pickCol() { return COLOURS[Math.floor(Math.random() * COLOURS.length)] }

function makeSquare(cx, cy) {
  const col = pickCol()
  const filled = Math.random() < 0.45
  const roll = Math.random()
  const size =
    roll < 0.28 ? rnd(3, 7) :
    roll < 0.62 ? rnd(8, 16) :
    roll < 0.86 ? rnd(18, 28) :
    rnd(30, 46)
  return {
    bx: cx, by: cy, x: cx, y: cy,
    vx: rnd(-0.022, 0.022), vy: rnd(-0.018, 0.018),
    fx: 0, fy: 0,
    size, col, filled,
    lineW: size < 10 ? rnd(0.8, 1.4) : size < 22 ? rnd(1.1, 1.9) : rnd(1.5, 2.6),
    life: Math.random(),
    lifeSpeed: size < 12 ? rnd(0.00018, 0.00038) : size < 25 ? rnd(0.00010, 0.00022) : rnd(0.00006, 0.00013),
    peakAlpha: rnd(0.15, 0.35),
    phaseIn: rnd(0.10, 0.20),
    phaseOut: rnd(0.72, 0.86),
  }
}

function easeIn(t) { return t * t }
function easeOut(t) { return 1 - (1 - t) * (1 - t) }

export default function FloatingSquares({ className }) {
  const canvasRef = useRef(null)
  const stateRef = useRef({ squares: [], mouse: { x: -9999, y: -9999 }, last: 0, W: 0, H: 0 })

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const state = stateRef.current
    let animId

    function initSquares() {
      const { W, H } = state
      state.squares = []
      const cols = Math.round(Math.sqrt(COUNT * (W / H)))
      const rows = Math.ceil(COUNT / cols)
      const cellW = W / cols
      const cellH = H / rows
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (state.squares.length >= COUNT) break
          const cx = c * cellW + rnd(cellW * 0.05, cellW * 0.95)
          const cy = r * cellH + rnd(cellH * 0.05, cellH * 0.95)
          state.squares.push(makeSquare(cx, cy))
        }
      }
    }

    function resize() {
      state.W = canvas.width = canvas.offsetWidth
      state.H = canvas.height = canvas.offsetHeight
      initSquares()
    }

    function draw(ts) {
      const dt = Math.min(ts - state.last, 50)
      state.last = ts
      const { W, H, mouse, squares } = state
      ctx.clearRect(0, 0, W, H)

      for (const sq of squares) {
        sq.life += sq.lifeSpeed * dt
        if (sq.life >= 1) { sq.life = 0; continue }

        let alpha
        if (sq.life < sq.phaseIn) {
          alpha = easeOut(sq.life / sq.phaseIn) * sq.peakAlpha
        } else if (sq.life < sq.phaseOut) {
          alpha = sq.peakAlpha
        } else {
          const t = (sq.life - sq.phaseOut) / (1 - sq.phaseOut)
          alpha = (1 - easeIn(t)) * sq.peakAlpha
        }
        if (alpha < 0.01) continue

        sq.bx += sq.vx * dt * 0.5
        sq.by += sq.vy * dt * 0.5
        const pad = sq.size + 12
        if (sq.bx < -pad) sq.bx = W + pad
        if (sq.bx > W + pad) sq.bx = -pad
        if (sq.by < -pad) sq.by = H + pad
        if (sq.by > H + pad) sq.by = -pad

        const cdx = sq.bx - mouse.x
        const cdy = sq.by - mouse.y
        const cd = Math.sqrt(cdx * cdx + cdy * cdy)
        if (cd < FLEE_DIST && cd > 0) {
          const str = (1 - cd / FLEE_DIST) * 7.0
          sq.fx += (cdx / cd) * str * 0.16
          sq.fy += (cdy / cd) * str * 0.16
        }
        sq.fx *= 0.87
        sq.fy *= 0.87
        sq.x = sq.bx + sq.fx
        sq.y = sq.by + sq.fy

        const h = sq.size / 2
        const c = sq.col
        ctx.globalAlpha = alpha

        if (sq.filled) {
          ctx.fillStyle = `rgb(${c.r},${c.g},${c.b})`
          ctx.fillRect(sq.x - h, sq.y - h, sq.size, sq.size)
        } else {
          ctx.strokeStyle = `rgb(${c.r},${c.g},${c.b})`
          ctx.lineWidth = sq.lineW
          ctx.strokeRect(sq.x - h, sq.y - h, sq.size, sq.size)
        }
      }

      ctx.globalAlpha = 1
      animId = requestAnimationFrame(draw)
    }

    function handleMouseMove(e) {
      const rect = canvas.getBoundingClientRect()
      state.mouse.x = e.clientX - rect.left
      state.mouse.y = e.clientY - rect.top
    }

    function handleMouseLeave() {
      state.mouse.x = -9999
      state.mouse.y = -9999
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseleave', handleMouseLeave)
    window.addEventListener('resize', resize)
    resize()
    animId = requestAnimationFrame(draw)

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseleave', handleMouseLeave)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return <canvas ref={canvasRef} className={className} />
}
