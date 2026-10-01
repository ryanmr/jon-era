import { motion } from 'motion/react'
import { useEffect, useMemo, useState } from 'react'
import { rng } from '../lib/director'
import { useViewport } from '../lib/display'
import type { Photo } from '../lib/prepare'
import { Confetti } from './Confetti'
import { LightLeak } from './shared'

const NAME_LINES = ['JONATHAN', 'SCHAUER']
const FONT = '"Fraunces Variable", Georgia, serif'
/** When the wall breaks apart and the tiles start swarming into the name. */
const SWARM_AT = 2.2
const MESSAGE_AT = 5.4

type Cell = { x: number; y: number; photo: number; delay: number }

/** Rasterises the name and returns the grid cells that fall inside the letters. */
async function nameCells(w: number, h: number, size: number) {
  await document.fonts.load(`900 100px ${FONT}`).catch(() => {})
  const areaW = w * 0.92
  const areaH = h * 0.56
  const gc = Math.floor(areaW / size)
  const gr = Math.floor(areaH / size)
  const SS = 4 // supersample each cell 4×4
  const canvas = document.createElement('canvas')
  canvas.width = gc * SS
  canvas.height = gr * SS
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!
  ctx.font = `900 100px ${FONT}`
  const widest = Math.max(...NAME_LINES.map((l) => ctx.measureText(l).width))
  const lineGap = 0.9
  const fontPx = Math.min((canvas.width * 0.94 * 100) / widest, canvas.height / (NAME_LINES.length * lineGap))
  ctx.font = `900 ${fontPx}px ${FONT}`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillStyle = '#fff'
  // Fraunces Black has hairline serifs that vanish at mosaic resolution; a stroke fattens them up.
  ctx.strokeStyle = '#fff'
  ctx.lineWidth = fontPx * 0.05
  ctx.lineJoin = 'round'
  NAME_LINES.forEach((line, i) => {
    const y = canvas.height / 2 + (i - (NAME_LINES.length - 1) / 2) * fontPx * lineGap
    ctx.fillText(line, canvas.width / 2, y)
    ctx.strokeText(line, canvas.width / 2, y)
  })
  const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data
  const left = (w - gc * size) / 2
  const top = h * 0.4 - (gr * size) / 2
  const cells: { x: number; y: number }[] = []
  for (let r = 0; r < gr; r++) {
    for (let c = 0; c < gc; c++) {
      let hit = 0
      for (let dy = 0; dy < SS; dy++) {
        for (let dx = 0; dx < SS; dx++) {
          if (data[((r * SS + dy) * canvas.width + c * SS + dx) * 4 + 3] > 128) hit++
        }
      }
      if (hit >= SS * SS * 0.45) cells.push({ x: left + c * size, y: top + r * size })
    }
  }
  return cells
}

export function Finale({ photos, years }: { photos: Photo[]; years?: [number, number] }) {
  const { w, h } = useViewport()
  const size = Math.max(9, Math.round(Math.min(w, h) / 58))
  const [seed] = useState(() => Math.floor(Math.random() * 2 ** 31))
  const [cells, setCells] = useState<Cell[]>([])
  const [go, setGo] = useState(false)
  const [party, setParty] = useState(false)

  // The wall of every photo, filling the screen.
  const wall = useMemo(() => {
    const n = photos.length
    const cols = Math.ceil(Math.sqrt((n * w) / h))
    const rows = Math.ceil(n / cols)
    return { cols, rows, tw: w / cols, th: h / rows }
  }, [photos.length, w, h])

  const focus = useMemo(() => {
    const r = rng(seed)
    const i = r.int(0, photos.length - 1)
    return { x: ((i % wall.cols) + 0.5) * wall.tw, y: (Math.floor(i / wall.cols) + 0.5) * wall.th }
  }, [seed, photos.length, wall])

  useEffect(() => {
    let cancelled = false
    void nameCells(w, h, size).then((pts) => {
      if (cancelled) return
      const r = rng(seed)
      setCells(
        pts.map((pt) => ({
          ...pt,
          photo: r.int(0, photos.length - 1),
          // sweep in roughly left-to-right, with some sparkle
          delay: SWARM_AT + (pt.x / w) * 1.1 + r.range(0, 0.45),
        })),
      )
    })
    return () => {
      cancelled = true
    }
  }, [w, h, size, seed, photos.length])

  // Flip the tiles to their target positions on the next frames so CSS transitions run.
  useEffect(() => {
    if (!cells.length) return
    const raf = requestAnimationFrame(() => requestAnimationFrame(() => setGo(true)))
    const t = setTimeout(() => setParty(true), MESSAGE_AT * 1000 - 400)
    return () => {
      cancelAnimationFrame(raf)
      clearTimeout(t)
    }
  }, [cells.length])

  const wallPos = (i: number) => ({
    x: ((i % wall.cols) + 0.5) * wall.tw,
    y: (Math.floor(i / wall.cols) + 0.5) * wall.th,
  })
  const startScale = (Math.min(wall.tw, wall.th) / size) * 0.45

  return (
    <motion.div
      className="absolute inset-0 overflow-hidden bg-night"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.9 } }}
      transition={{ duration: 0.4 }}
    >
      <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 70% 60% at 50% 40%, #3a2416 0%, #1a100a 60%, #0d0805 100%)' }} />

      {/* 1. camera pulls back to reveal every photo, then the wall dissolves */}
      <motion.div
        className="absolute inset-0"
        style={{ transformOrigin: `${focus.x}px ${focus.y}px` }}
        initial={{ scale: wall.cols * 0.9, opacity: 1 }}
        animate={{ scale: [wall.cols * 0.9, 1, 1, 0.94], opacity: [1, 1, 1, 0] }}
        transition={{ duration: SWARM_AT + 1.6, times: [0, 1.7 / (SWARM_AT + 1.6), SWARM_AT / (SWARM_AT + 1.6), 1], ease: [[0.7, 0, 0.2, 1], 'linear', 'easeIn'] }}
      >
        {photos.map((p, i) => (
          <div
            key={p.id}
            className="absolute bg-cover bg-center"
            style={{
              left: (i % wall.cols) * wall.tw,
              top: Math.floor(i / wall.cols) * wall.th,
              width: wall.tw + 0.5,
              height: wall.th + 0.5,
              backgroundImage: `url(${p.thumb})`,
            }}
          />
        ))}
      </motion.div>

      {/* 2. hundreds of tiles swarm out of the wall into the name */}
      {cells.map((c, i) => {
        const from = wallPos(c.photo)
        return (
          <div
            key={i}
            className="twinkle absolute top-0 left-0 rounded-[2px] bg-cover bg-center"
            style={{
              width: size - 1,
              height: size - 1,
              backgroundImage: `url(${photos[c.photo].thumb})`,
              willChange: 'transform, opacity',
              opacity: go ? 1 : 0,
              transform: go
                ? `translate(${c.x}px, ${c.y}px) scale(1) rotate(0deg)`
                : `translate(${from.x - size / 2}px, ${from.y - size / 2}px) scale(${startScale}) rotate(${(i % 7) * 25 - 75}deg)`,
              transition: `transform 1.5s cubic-bezier(.2,.75,.2,1) ${c.delay}s, opacity .5s ease ${c.delay}s`,
              animationDelay: `${(i * 0.37) % 6}s`,
            }}
          />
        )
      })}

      {/* 3. a gold shimmer rolls across the finished name */}
      <div className="pointer-events-none absolute inset-x-0 overflow-hidden mix-blend-screen" style={{ top: h * 0.12, height: h * 0.56 }}>
        <motion.div
          className="absolute inset-y-0 w-[40%]"
          style={{ background: 'linear-gradient(100deg, rgba(255,214,140,0) 0%, rgba(255,214,140,.5) 50%, rgba(255,214,140,0) 100%)', filter: 'blur(20px)' }}
          initial={{ x: '-60vw' }}
          animate={{ x: '160vw' }}
          transition={{ delay: MESSAGE_AT - 1, duration: 1.8, ease: 'easeInOut', repeat: Infinity, repeatDelay: 3.5 }}
        />
      </div>

      {party && <Confetti seed={seed} count={110} />}
      {party && <LightLeak seed={seed} />}

      {/* 4. the sendoff */}
      <div className="absolute inset-x-0 flex flex-col items-center gap-[1.5vh] px-4 text-center" style={{ top: h * 0.72 }}>
        <motion.div
          className="font-hand text-gold drop-shadow-[0_4px_20px_rgba(0,0,0,.8)]"
          // padding keeps Caveat's overhanging "!" and descenders inside the write-on clip
          style={{ fontSize: 'clamp(28px, 4.6vw, 96px)', lineHeight: 1.05, padding: '0.15em 0.4em' }}
          initial={{ clipPath: 'inset(0 100% 0 0)' }}
          animate={{ clipPath: 'inset(0 0% 0 0)' }}
          transition={{ delay: MESSAGE_AT, duration: 2.4, ease: 'easeInOut' }}
        >
          So long and thanks for all the <span className="text-cream">(star)</span>fish, Jon!
        </motion.div>
        <motion.div
          className="font-display flex items-center gap-[2vw] text-cream/70 uppercase"
          style={{ fontSize: 'clamp(12px, 1.4vw, 26px)', letterSpacing: '0.3em' }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: MESSAGE_AT + 2.4, duration: 1 }}
        >
          <span className="h-px w-[6vw] bg-cream/40" />
          The Era of Jonathan Schauer{years ? ` · ${years[0]} — ${years[1]}` : ''}
          <span className="h-px w-[6vw] bg-cream/40" />
        </motion.div>
      </div>
    </motion.div>
  )
}
