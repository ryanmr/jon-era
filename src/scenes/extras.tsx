import { motion } from 'motion/react'
import { useEffect, useMemo, useRef } from 'react'
import { rng } from '../lib/director'
import { Backdrop, Img, SceneFrame } from '../components/shared'
import { caption, filterCss, fit, useViewport } from '../lib/display'
import type { SceneProps } from './singles'

const easeIn = [0.55, 0, 0.85, 0.35] as const
const smooth = [0.7, 0, 0.2, 1] as const
const backOut = [0.34, 1.56, 0.64, 1] as const

// ───────────────────────── Magazine cover ─────────────────────────

const COVER_LINES = [
  'The Untold Stories',
  "Why We'll Miss Him (A Lot)",
  'Legend Status: Confirmed',
  'Inside The Era',
  'Exclusive Photos Inside',
  'A Decade in Pictures',
  'The Interview Everyone Wanted',
  'Peak Performance',
  'Style Icon of the Year',
]

export function Magazine({ scene }: SceneProps) {
  const { h, w } = useViewport()
  const p = scene.photos[0]
  const plan = useMemo(() => {
    const r = rng(scene.seed)
    const lines = [...COVER_LINES].sort(() => r.next() - 0.5).slice(0, 3)
    const bars = Array.from({ length: 34 }, () => r.int(1, 3))
    return { lines, bars, tilt: r.range(-3, 3), accent: r.pick(['#ff4a3d', '#f0c272', '#ffd84a']) }
  }, [scene.seed])
  const coverH = Math.min(h * 0.9, (w * 0.8) / 0.77)
  const coverW = coverH * 0.77
  const issue = p.date ? caption(p).toUpperCase() : 'SPECIAL ISSUE'

  return (
    <SceneFrame>
      <Backdrop photo={p} dim={0.7} />
      <div className="absolute inset-0 flex items-center justify-center" style={{ perspective: 1800 }}>
        <motion.div
          className="relative overflow-hidden bg-black shadow-[0_40px_100px_rgba(0,0,0,.8)]"
          style={{ width: coverW, height: coverH, transformOrigin: 'left center' }}
          initial={{ rotateY: -80, x: '-35vw', opacity: 0 }}
          animate={{ rotateY: -7, x: 0, opacity: 1, rotate: plan.tilt }}
          exit={{ rotateY: 100, x: '25vw', opacity: 0, transition: { duration: 0.8, ease: easeIn } }}
          transition={{ type: 'spring', stiffness: 50, damping: 13 }}
        >
          <Img photo={p} filter={scene.filter} position="50% 30%" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-transparent to-black/60" />
          <motion.div
            className="font-display absolute inset-x-0 top-[1.5%] text-center leading-none font-black text-white drop-shadow-[0_4px_12px_rgba(0,0,0,.5)]"
            style={{ fontSize: coverW * 0.2, letterSpacing: '-0.02em' }}
            initial={{ y: -60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.7, ease: smooth }}
          >
            SCHAUER
          </motion.div>
          <div
            className="font-display absolute inset-x-0 text-center tracking-[0.3em] text-white/90 uppercase"
            style={{ top: coverW * 0.235, fontSize: coverW * 0.026 }}
          >
            The Era Issue · {issue}
          </div>
          <div className="absolute left-[6%] flex max-w-[55%] flex-col gap-[1.6vh]" style={{ top: '38%' }}>
            {plan.lines.map((line, i) => (
              <motion.div
                key={line}
                className="font-display leading-tight font-black italic drop-shadow-[0_2px_6px_rgba(0,0,0,.7)]"
                style={{ fontSize: coverW * (i === 0 ? 0.075 : 0.048), color: i === 0 ? plan.accent : 'white' }}
                initial={{ x: -40, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 1.1 + i * 0.3, duration: 0.6, ease: smooth }}
              >
                {line}
              </motion.div>
            ))}
          </div>
          <motion.div
            className="font-hand absolute grid place-items-center rounded-full text-center leading-[0.95] text-ink shadow-xl"
            style={{
              right: '5%',
              top: '30%',
              width: coverW * 0.24,
              height: coverW * 0.24,
              fontSize: coverW * 0.045,
              background: 'radial-gradient(circle at 35% 30%, #ffe6a3, #e8b35a 70%)',
            }}
            initial={{ scale: 0, rotate: -40 }}
            animate={{ scale: 1, rotate: 12 }}
            transition={{ delay: 2, duration: 0.6, ease: backOut }}
          >
            Farewell
            <br />
            Edition!
          </motion.div>
          <div className="absolute right-[5%] bottom-[3%] bg-white px-[1.2%] pt-[1%] pb-[0.5%]">
            <div className="flex items-stretch gap-[1px]" style={{ height: coverH * 0.05 }}>
              {plan.bars.map((b, i) => (
                <div key={i} className={i % 2 ? 'bg-white' : 'bg-black'} style={{ width: b }} />
              ))}
            </div>
            <div className="text-center font-mono text-black" style={{ fontSize: coverW * 0.018 }}>
              $4.99 US
            </div>
          </div>
        </motion.div>
      </div>
    </SceneFrame>
  )
}

// ───────────────────────── Vinyl record sliding out of its sleeve ─────────────────────────

export function Vinyl({ scene }: SceneProps) {
  const { w, h } = useViewport()
  const p = scene.photos[0]
  const S = Math.min(h * 0.7, w * 0.42)
  const out = S * 0.5

  return (
    <SceneFrame>
      <Backdrop photo={p} dim={0.72} />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative" style={{ width: S + out, height: S }}>
          {/* the record */}
          <motion.div
            className="absolute rounded-full shadow-[0_20px_50px_rgba(0,0,0,.7)]"
            style={{ width: S * 0.96, height: S * 0.96, top: S * 0.02, left: S * 0.02 }}
            initial={{ x: 0 }}
            animate={{ x: out }}
            exit={{ x: 0, transition: { duration: 0.45, ease: smooth } }}
            transition={{ delay: 1.1, duration: 1.2, ease: smooth }}
          >
            <motion.div
              className="absolute inset-0 rounded-full"
              style={{ background: 'repeating-radial-gradient(circle, #121212 0 2px, #1d1d1d 2px 3.5px)' }}
              animate={{ rotate: 360 }}
              transition={{ duration: 1.8, repeat: Infinity, ease: 'linear', delay: 1.6 }}
            >
              <div className="absolute inset-[31%] overflow-hidden rounded-full ring-4 ring-black/60">
                <Img photo={p} filter={scene.filter} />
                <div className="absolute inset-x-0 bottom-[12%] text-center text-[1.3vmin] font-bold tracking-widest text-white drop-shadow">
                  SIDE A · 33⅓
                </div>
              </div>
              <div className="absolute top-1/2 left-1/2 h-[3%] w-[3%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-black" />
            </motion.div>
            {/* fixed sheen so the light doesn't spin with the disc */}
            <div
              className="pointer-events-none absolute inset-0 rounded-full"
              style={{
                background:
                  'conic-gradient(from 20deg, transparent 0 30deg, rgba(255,255,255,.13) 50deg, transparent 75deg 200deg, rgba(255,255,255,.1) 225deg, transparent 250deg)',
              }}
            />
          </motion.div>
          {/* the sleeve */}
          <motion.div
            className="absolute top-0 left-0 overflow-hidden rounded-[0.4vmin] shadow-[0_30px_70px_rgba(0,0,0,.75)]"
            style={{ width: S, height: S }}
            initial={{ x: '-70vw', rotate: -25 }}
            animate={{ x: 0, rotate: -2 }}
            exit={{ x: '-90vw', rotate: -30, transition: { delay: 0.4, duration: 0.8, ease: easeIn } }}
            transition={{ type: 'spring', stiffness: 55, damping: 13 }}
          >
            <Img photo={p} filter={scene.filter} />
            <div className="absolute inset-0 shadow-[inset_0_0_40px_rgba(0,0,0,.45)]" />
            <div className="absolute inset-[8%] rounded-full border border-white/10" />
            <div className="font-display absolute top-[4%] left-[5%] font-black tracking-wide text-white drop-shadow-[0_2px_8px_rgba(0,0,0,.7)]" style={{ fontSize: S * 0.06 }}>
              THE ERA OF J.S.
            </div>
            <div className="font-hand absolute bottom-[5%] left-[5%] -rotate-3 bg-paper px-[3%] py-[1%] text-ink shadow-md" style={{ fontSize: S * 0.055 }}>
              {caption(p, scene.seed)}
            </div>
          </motion.div>
        </div>
      </div>
    </SceneFrame>
  )
}

// ───────────────────────── Spinning newspaper ─────────────────────────

const HEADLINES = [
  'LOCAL LEGEND SPOTTED',
  'ERA DECLARED HISTORIC',
  'SOURCES CONFIRM: STILL ICONIC',
  "EXPERTS AGREE: WE'LL MISS HIM",
  'AN ERA FOR THE AGES',
  'BREAKING: GOOD TIMES HAD',
]
const SUBHEADS = [
  'Witnesses describe the scene as “absolutely classic”',
  'Colleagues unanimous: “one of a kind”',
  'Full story and more photos inside',
  'Historians already calling it a golden age',
]

function TextLines({ count, seed, size }: { count: number; seed: number; size: number }) {
  const widths = useMemo(() => {
    const r = rng(seed)
    return Array.from({ length: count }, (_, i) => (i === count - 1 ? r.range(30, 60) : r.range(82, 100)))
  }, [count, seed])
  return (
    <div className="flex flex-col" style={{ gap: size * 0.9 }}>
      {widths.map((wd, i) => (
        <div key={i} className="bg-ink/25" style={{ height: size, width: `${wd}%` }} />
      ))}
    </div>
  )
}

export function Newspaper({ scene }: SceneProps) {
  const { w, h } = useViewport()
  const p = scene.photos[0]
  const plan = useMemo(() => {
    const r = rng(scene.seed)
    return { headline: r.pick(HEADLINES), sub: r.pick(SUBHEADS), tilt: r.range(-4, 4), vol: r.int(10, 99) }
  }, [scene.seed])
  const W = Math.min(w * 0.6, (h * 0.94) / 1.25)
  const line = Math.max(3, W * 0.008)
  const dateline = p.date ? p.date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'Special Edition'

  return (
    <SceneFrame>
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.div
          className="relative flex flex-col text-ink shadow-[0_40px_100px_rgba(0,0,0,.8)]"
          style={{ width: W, height: W * 1.25, padding: W * 0.04, gap: W * 0.016, background: 'linear-gradient(170deg,#f3ecdb,#e6dcc4)' }}
          initial={{ scale: 0.04, rotate: -1440, opacity: 0 }}
          animate={{ scale: 1, rotate: plan.tilt, opacity: 1 }}
          exit={{ scale: 0.04, rotate: 1080, opacity: 0, transition: { duration: 0.9, ease: easeIn } }}
          transition={{ duration: 1.7, ease: [0.15, 0.75, 0.25, 1] }}
        >
          <div className="font-display border-y-4 border-double border-ink/80 text-center leading-none font-black" style={{ fontSize: W * 0.085, paddingBlock: W * 0.01 }}>
            The Schauer Times
          </div>
          <div className="font-display flex justify-between border-b border-ink/50 uppercase" style={{ fontSize: W * 0.016, paddingBottom: W * 0.006 }}>
            <span>Vol. {plan.vol} — Farewell Edition</span>
            <span>{dateline}</span>
            <span>Price: Priceless</span>
          </div>
          <div className="font-display text-center leading-[0.95] font-black uppercase" style={{ fontSize: W * 0.068 }}>
            {plan.headline}
          </div>
          <div className="font-display text-center italic" style={{ fontSize: W * 0.024 }}>
            {plan.sub}
          </div>
          <div className="flex min-h-0 flex-1" style={{ gap: W * 0.025 }}>
            <div className="flex min-h-0 flex-[2] flex-col" style={{ gap: W * 0.008 }}>
              <div className="relative min-h-0 flex-1 overflow-hidden">
                <Img photo={p} style={{ filter: 'grayscale(1) contrast(1.25) brightness(1.05)' }} />
                <div
                  className="pointer-events-none absolute inset-0 opacity-40 mix-blend-multiply"
                  style={{ backgroundImage: 'radial-gradient(circle, #000 32%, transparent 36%)', backgroundSize: '4px 4px' }}
                />
              </div>
              <div className="font-display italic" style={{ fontSize: W * 0.017 }}>
                {p.date ? `Above: the scene, ${caption(p)}.` : `Above: ${caption(p, scene.seed)}`} (Staff photo)
              </div>
            </div>
            <div className="flex-1">
              <TextLines count={22} seed={scene.seed} size={line} />
            </div>
          </div>
          <div className="grid grid-cols-3" style={{ gap: W * 0.025 }}>
            {[0, 1, 2].map((i) => (
              <TextLines key={i} count={6} seed={scene.seed + i + 1} size={line} />
            ))}
          </div>
        </motion.div>
      </div>
    </SceneFrame>
  )
}

// ───────────────────────── Jigsaw puzzle ─────────────────────────

type Pt = [number, number]

/** One edge of a jigsaw piece; s = +1 knob out, -1 knob in, 0 flat. */
function edge([x0, y0]: Pt, [x1, y1]: Pt, s: number, k: number) {
  if (!s) return ` L ${x1} ${y1}`
  const dx = x1 - x0
  const dy = y1 - y0
  const len = Math.hypot(dx, dy)
  const [nx, ny] = [dy / len, -dx / len] // outward normal for clockwise travel
  const P = (t: number, f: number) => `${x0 + dx * t + nx * s * k * f} ${y0 + dy * t + ny * s * k * f}`
  return ` L ${P(0.38, 0)} C ${P(0.42, 0.45)} ${P(0.28, 1.05)} ${P(0.5, 1.05)} C ${P(0.72, 1.05)} ${P(0.58, 0.45)} ${P(0.62, 0)} L ${x1} ${y1}`
}

function piecePath(pw: number, ph: number, T: number, k: number, sides: [number, number, number, number]) {
  const pts: Pt[] = [
    [T, T],
    [T + pw, T],
    [T + pw, T + ph],
    [T, T + ph],
  ]
  let d = `M ${T} ${T}`
  for (let i = 0; i < 4; i++) d += edge(pts[i], pts[(i + 1) % 4], sides[i], k)
  return `${d} Z`
}

export function Puzzle({ scene }: SceneProps) {
  const { w, h } = useViewport()
  const p = scene.photos[0]
  const box = fit(p, w * 0.7, h * 0.74)
  const portrait = box.h > box.w
  const cols = portrait ? 3 : 4
  const rows = portrait ? 4 : 3
  const pw = box.w / cols
  const ph = box.h / rows
  const k = Math.min(pw, ph) * 0.2
  const T = k * 1.15

  const pieces = useMemo(() => {
    const r = rng(scene.seed)
    const hE = Array.from({ length: rows }, () => Array.from({ length: cols }, () => r.sign()))
    const vE = Array.from({ length: rows }, () => Array.from({ length: cols }, () => r.sign()))
    const order = Array.from({ length: rows * cols }, (_, i) => i).sort(() => r.next() - 0.5)
    return Array.from({ length: rows * cols }, (_, i) => {
      const c = i % cols
      const row = Math.floor(i / cols)
      const sides: [number, number, number, number] = [
        row === 0 ? 0 : -hE[row][c],
        c === cols - 1 ? 0 : vE[row][c + 1],
        row === rows - 1 ? 0 : hE[row + 1][c],
        c === 0 ? 0 : -vE[row][c],
      ]
      const ox = c * pw + pw / 2 - box.w / 2
      const oy = row * ph + ph / 2 - box.h / 2
      const placeAt = 1.3 + order.indexOf(i) * 0.26
      return {
        c,
        row,
        d: piecePath(pw, ph, T, k, sides),
        sx: r.range(-w * 0.42, w * 0.42) - ox,
        sy: r.range(-h * 0.38, h * 0.38) - oy,
        rot: r.range(-70, 70),
        appear: r.range(0, 0.5),
        placeAt,
        fallRot: r.range(-90, 90),
        fallDelay: r.range(0, 0.3),
      }
    })
  }, [scene.seed, rows, cols, pw, ph, T, k, box.w, box.h, w, h])
  const doneAt = Math.max(...pieces.map((pc) => pc.placeAt)) + 0.75

  return (
    <SceneFrame>
      <Backdrop photo={p} dim={0.78} />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative" style={{ width: box.w, height: box.h }}>
          {pieces.map((pc) => {
            const D = pc.placeAt + 0.7
            return (
              <motion.div
                key={`${pc.c}-${pc.row}`}
                className="absolute"
                style={{ left: pc.c * pw - T, top: pc.row * ph - T, width: pw + 2 * T, height: ph + 2 * T, filter: 'drop-shadow(0 4px 6px rgba(0,0,0,.55))' }}
                initial={{ x: pc.sx, y: pc.sy, rotate: pc.rot, scale: 0, opacity: 0 }}
                animate={{
                  x: [pc.sx, pc.sx, pc.sx, 0],
                  y: [pc.sy, pc.sy, pc.sy, 0],
                  rotate: [pc.rot, pc.rot, pc.rot, 0],
                  scale: [0, 1, 1, 1],
                  opacity: [0, 1, 1, 1],
                }}
                exit={{ y: h * 1.2, rotate: pc.fallRot, transition: { duration: 0.9, delay: pc.fallDelay, ease: easeIn } }}
                transition={{
                  duration: D,
                  times: [0, (pc.appear + 0.35) / D, pc.placeAt / D, 1],
                  ease: ['easeOut', 'linear', backOut],
                }}
              >
                <div
                  className="h-full w-full"
                  style={{
                    clipPath: `path('${pc.d}')`,
                    backgroundImage: `url(${p.url})`,
                    backgroundSize: `${box.w}px ${box.h}px`,
                    backgroundPosition: `${T - pc.c * pw}px ${T - pc.row * ph}px`,
                    backgroundRepeat: 'no-repeat',
                    filter: filterCss(scene.filter),
                  }}
                />
              </motion.div>
            )
          })}
          {/* seamless photo once the last piece clicks in */}
          <motion.div
            className="absolute inset-0 shadow-[0_30px_80px_rgba(0,0,0,.6)]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.15 } }}
            transition={{ delay: doneAt + 0.3, duration: 0.8 }}
          >
            <Img photo={p} filter={scene.filter} />
            <motion.div
              className="absolute inset-0"
              style={{ background: 'linear-gradient(105deg, transparent 35%, rgba(255,240,200,.5) 50%, transparent 65%)' }}
              initial={{ x: '-100%' }}
              animate={{ x: '100%' }}
              transition={{ delay: doneAt + 0.5, duration: 1.1, ease: 'easeInOut' }}
            />
          </motion.div>
        </div>
      </div>
    </SceneFrame>
  )
}

// ───────────────────────── ASCII rain that resolves into the photo ─────────────────────────

const RAMP = ' .:-=+*#%@'
const RAIN = 'アイウエオカキクケコサシスセソ0123456789ERASCHAUER'

export function Ascii({ scene }: SceneProps) {
  const { w, h } = useViewport()
  const p = scene.photos[0]
  const box = fit(p, w * 0.9, h * 0.88)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    let raf = 0
    let cancelled = false
    const img = new Image()
    img.src = p.url
    void img.decode().then(() => {
      if (cancelled) return
      const dpr = window.devicePixelRatio || 1
      const cw = Math.max(7, Math.round(box.w / 140))
      const ch = Math.round(cw * 1.65)
      const cols = Math.floor(box.w / cw)
      const rows = Math.floor(box.h / ch)
      canvas.width = box.w * dpr
      canvas.height = box.h * dpr
      const ctx = canvas.getContext('2d')!
      ctx.scale(dpr, dpr)

      const sample = document.createElement('canvas')
      sample.width = cols
      sample.height = rows
      const sctx = sample.getContext('2d', { willReadFrequently: true })!
      sctx.drawImage(img, 0, 0, cols, rows)
      const px = sctx.getImageData(0, 0, cols, rows).data

      // Finished characters are painted once onto this layer; only the falling trails redraw per frame.
      const done = document.createElement('canvas')
      done.width = canvas.width
      done.height = canvas.height
      const dctx = done.getContext('2d')!
      dctx.scale(dpr, dpr)
      const font = `${Math.round(ch * 0.92)}px ui-monospace, Menlo, monospace`
      dctx.font = font
      dctx.textBaseline = 'top'
      ctx.font = font
      ctx.textBaseline = 'top'

      const r = rng(scene.seed)
      const drops = Array.from({ length: cols }, () => ({ delay: r.range(0, 1.1), speed: rows / r.range(0.9, 1.7), painted: 0 }))
      const trail = 7
      const start = performance.now()

      const paintCell = (c: number, row: number) => {
        const i = (row * cols + c) * 4
        const [R, G, B] = [px[i], px[i + 1], px[i + 2]]
        const lum = (0.2126 * R + 0.7152 * G + 0.0722 * B) / 255
        if (lum < 0.06) return
        const boost = 1.35
        dctx.fillStyle = `rgb(${Math.min(255, R * boost)},${Math.min(255, G * boost)},${Math.min(255, B * boost)})`
        dctx.fillText(RAMP[Math.min(RAMP.length - 1, Math.floor(lum * RAMP.length))], c * cw, row * ch)
      }

      const frame = (now: number) => {
        const t = (now - start) / 1000
        let active = false
        ctx.clearRect(0, 0, box.w, box.h)
        for (let c = 0; c < cols; c++) {
          const d = drops[c]
          const head = Math.floor((t - d.delay) * d.speed)
          const upto = Math.min(rows, head - trail)
          while (d.painted < upto) paintCell(c, d.painted++)
          if (head - trail < rows) active = true
        }
        ctx.drawImage(done, 0, 0, box.w, box.h)
        for (let c = 0; c < cols; c++) {
          const d = drops[c]
          const head = Math.floor((t - d.delay) * d.speed)
          for (let k = 0; k <= trail; k++) {
            const row = head - k
            if (row < 0 || row >= rows) continue
            ctx.fillStyle = k === 0 ? '#ffffff' : `rgba(240,194,114,${1 - k / (trail + 1)})`
            ctx.fillText(RAIN[(Math.random() * RAIN.length) | 0], c * cw, row * ch)
          }
        }
        if (active) raf = requestAnimationFrame(frame)
      }
      raf = requestAnimationFrame(frame)
    })
    return () => {
      cancelled = true
      cancelAnimationFrame(raf)
    }
  }, [p.url, box.w, box.h, scene.seed])

  return (
    <SceneFrame className="bg-black">
      <motion.div
        className="absolute inset-0 flex items-center justify-center"
        initial={{ opacity: 1 }}
        exit={{ opacity: 0, scale: 1.06, filter: 'blur(14px)', transition: { duration: 0.8 } }}
      >
        <div className="relative" style={{ width: box.w, height: box.h }}>
          <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
          <motion.div
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 4.5, duration: 1.6, ease: 'easeInOut' }}
          >
            <Img photo={p} filter={scene.filter} />
          </motion.div>
        </div>
      </motion.div>
    </SceneFrame>
  )
}

// ───────────────────────── Carousel slide projector ─────────────────────────

export function Projector({ scene }: SceneProps) {
  const { w, h } = useViewport()
  const p = scene.photos[0]
  const screenW = Math.min(w * 0.7, h * 0.72 * 1.5)
  const screenH = screenW / 1.5
  const sx = (w - screenW) / 2
  const sy = h * 0.08
  const inset = screenW * 0.04
  const img = { x: sx + inset, y: sy + inset, w: screenW - inset * 2, h: screenH - inset * 2 }
  const dust = useMemo(() => {
    const r = rng(scene.seed)
    return Array.from({ length: 28 }, () => ({ x: r.range(25, 75), y: r.range(20, 95), s: r.range(1, 3), d: r.range(4, 9), delay: r.range(-9, 0) }))
  }, [scene.seed])
  const lensL = `${w / 2 - 14}px ${h + 4}px`
  const lensR = `${w / 2 + 14}px ${h + 4}px`

  return (
    <SceneFrame className="bg-[#0b0806]">
      {/* light beam with floating dust (blur sits outside the clip so the edges actually soften) */}
      <motion.div
        className="absolute inset-0 mix-blend-screen"
        style={{ filter: 'blur(5px)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0, transition: { delay: 0.35, duration: 0.5 } }}
        transition={{ delay: 0.3, duration: 0.4 }}
      >
        <div
          className="absolute inset-0"
          style={{
            clipPath: `polygon(${lensL}, ${img.x}px ${img.y}px, ${img.x + img.w}px ${img.y}px, ${lensR})`,
            background: 'linear-gradient(to top, rgba(255,235,190,.2), rgba(255,235,190,.05))',
          }}
        >
          {dust.map((d, i) => (
            <div
              key={i}
              className="dust absolute rounded-full bg-[#fff3d6]"
              style={{ left: `${d.x}%`, top: `${d.y}%`, width: d.s, height: d.s, animationDuration: `${d.d}s`, animationDelay: `${d.delay}s` }}
            />
          ))}
        </div>
      </motion.div>

      {/* pull-down screen */}
      <motion.div
        className="absolute"
        style={{ left: sx, top: sy - screenW * 0.02, width: screenW }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0, transition: { delay: 0.5, duration: 0.5 } }}
      >
        <div className="mx-[-2%] h-[1.4vmin] rounded-full bg-gradient-to-b from-zinc-500 to-zinc-800" />
        <motion.div
          className="relative overflow-hidden"
          style={{ height: screenH, background: 'linear-gradient(180deg,#d9d3c6,#c9c2b3)' }}
          initial={{ filter: 'brightness(.12)' }}
          animate={{ filter: ['brightness(.12)', 'brightness(1)'] }}
          exit={{ filter: 'brightness(.12)', transition: { delay: 0.3, duration: 0.5 } }}
          transition={{ delay: 0.3, duration: 0.35 }}
        >
          <div className="absolute overflow-hidden" style={{ inset }}>
            {/* the slide: drops in with a clunk, then the focus is pulled */}
            <motion.div
              className="flicker absolute inset-0"
              initial={{ x: '-105%', y: 0, filter: 'blur(9px)' }}
              animate={{ x: '0%', y: [0, -7, 4, -2, 0], filter: 'blur(0px)' }}
              exit={{ x: '105%', transition: { duration: 0.22, ease: 'easeIn' } }}
              transition={{
                x: { delay: 1.15, duration: 0.2, ease: 'easeOut' },
                y: { delay: 1.33, duration: 0.4 },
                filter: { delay: 1.6, duration: 0.8, ease: 'easeInOut' },
              }}
            >
              <Img photo={p} style={{ filter: `${filterCss(scene.filter) ?? ''} sepia(.22) contrast(1.05)` }} />
              <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at center, rgba(255,240,210,.1), transparent 55%, rgba(0,0,0,.5) 100%)' }} />
            </motion.div>
            {/* the dark blink as the carousel advances */}
            <motion.div
              className="absolute inset-0 bg-black"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.85, 0] }}
              transition={{ delay: 1.0, duration: 0.3 }}
            />
          </div>
        </motion.div>
        <div className="stamp mt-[1.5vh] text-center text-[1.6vmin] opacity-70">
          SLIDE {String(scene.id).padStart(2, '0')} · {caption(p, scene.seed).toUpperCase()}
        </div>
      </motion.div>
    </SceneFrame>
  )
}
