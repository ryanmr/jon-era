import { motion } from 'motion/react'
import { useMemo } from 'react'
import { rng } from '../lib/director'
import { Img, Polaroid, SceneFrame, Tape } from '../components/shared'
import { caption, useViewport } from '../lib/display'
import { CrtScreen, type SceneProps } from './singles'

const easeIn = [0.55, 0, 0.85, 0.35] as const
const smooth = [0.7, 0, 0.2, 1] as const

// ───────────────────────── Polaroids tossed on the table ─────────────────────────

export function Scatter({ scene }: SceneProps) {
  const { w, h } = useViewport()
  const n = scene.photos.length
  const pw = Math.min(w * (n <= 3 ? 0.27 : n <= 4 ? 0.23 : 0.2), (h * (n <= 3 ? 0.62 : 0.46)) / 1.18)
  const plan = useMemo(() => {
    const r = rng(scene.seed)
    const rows = n <= 3 ? 1 : 2
    const perRow = [Math.ceil(n / rows), Math.floor(n / rows)]
    const slots: { x: number; y: number }[] = []
    perRow.slice(0, rows).forEach((count, row) => {
      for (let c = 0; c < count; c++) {
        slots.push({
          x: ((c + 0.5) / count) * w * 0.84 + w * 0.08 + r.range(-w, w) * 0.025,
          y: rows === 1 ? h * 0.48 + r.range(-h, h) * 0.05 : ((row + 0.5) / rows) * h * 0.86 + h * 0.06 + r.range(-h, h) * 0.03,
        })
      }
    })
    const exitSign = r.sign()
    return {
      exitSign,
      cards: scene.photos.map((_, i) => {
        const angle = r.range(0, Math.PI * 2)
        return {
          ...slots[i],
          rot: r.range(-13, 13),
          from: { x: Math.cos(angle) * w * 1.1, y: Math.sin(angle) * h * 1.2, rotate: r.range(-200, 200) },
          tape: r.next() < 0.45,
          tapeRot: r.range(-12, 12),
          exitRot: exitSign * r.range(30, 110),
          exitY: r.range(-h, h) * 0.3,
        }
      }),
    }
  }, [scene.seed, scene.photos, n, w, h])

  return (
    <SceneFrame>
      {scene.photos.map((p, i) => {
        const c = plan.cards[i]
        return (
          <motion.div
            key={p.id}
            className="absolute"
            style={{ left: c.x - pw / 2, top: c.y - (pw * 1.18) / 2 }}
            initial={{ ...c.from, scale: 1.35 }}
            animate={{ x: 0, y: 0, rotate: c.rot, scale: 1 }}
            exit={{
              x: plan.exitSign * w * 1.4,
              y: c.exitY,
              rotate: c.exitRot,
              transition: { duration: 0.85, delay: (plan.exitSign > 0 ? n - 1 - i : i) * 0.06, ease: easeIn },
            }}
            transition={{ type: 'spring', stiffness: 70, damping: 13, delay: 0.25 + i * 0.5 }}
          >
            <Polaroid photo={p} width={pw} filter={scene.filter} captionText={caption(p, scene.seed + i)} />
            {c.tape && <Tape style={{ top: '-3%', left: '31%', transform: `rotate(${c.tapeRot}deg)` }} />}
          </motion.div>
        )
      })}
    </SceneFrame>
  )
}

// ───────────────────────── Bento mosaic ─────────────────────────

type Rect = [col: number, row: number, cs: number, rs: number]
const MOSAICS: Record<number, { cols: number; rows: number; rects: Rect[] }[]> = {
  2: [{ cols: 2, rows: 1, rects: [[0, 0, 1, 1], [1, 0, 1, 1]] }],
  3: [{ cols: 3, rows: 2, rects: [[0, 0, 2, 2], [2, 0, 1, 1], [2, 1, 1, 1]] }],
  4: [
    { cols: 4, rows: 2, rects: [[0, 0, 2, 2], [2, 0, 2, 1], [2, 1, 1, 1], [3, 1, 1, 1]] },
    { cols: 2, rows: 2, rects: [[0, 0, 1, 1], [1, 0, 1, 1], [0, 1, 1, 1], [1, 1, 1, 1]] },
  ],
  5: [
    { cols: 4, rows: 2, rects: [[0, 0, 2, 2], [2, 0, 1, 1], [3, 0, 1, 1], [2, 1, 1, 1], [3, 1, 1, 1]] },
    { cols: 3, rows: 2, rects: [[0, 0, 1, 2], [1, 0, 1, 1], [2, 0, 1, 1], [1, 1, 1, 1], [2, 1, 1, 1]] },
  ],
  6: [
    { cols: 3, rows: 2, rects: [[0, 0, 1, 1], [1, 0, 1, 1], [2, 0, 1, 1], [0, 1, 1, 1], [1, 1, 1, 1], [2, 1, 1, 1]] },
    { cols: 4, rows: 3, rects: [[0, 0, 2, 2], [2, 0, 2, 1], [2, 1, 1, 1], [3, 1, 1, 2], [0, 2, 2, 1], [2, 2, 1, 1]] },
  ],
}

export function Mosaic({ scene }: SceneProps) {
  const n = Math.min(6, Math.max(2, scene.photos.length))
  const plan = useMemo(() => {
    const r = rng(scene.seed)
    const layout = r.pick(MOSAICS[n])
    const flipAxis = r.next() < 0.5 ? 'rotateY' : 'rotateX'
    const exitMode = r.pick(['drop', 'flip', 'shrink'] as const)
    const order = scene.photos.map((_, i) => i).sort(() => r.next() - 0.5)
    return {
      layout,
      flipAxis,
      exitMode,
      tiles: scene.photos.slice(0, n).map((_, i) => ({
        delay: 0.15 + order.indexOf(i) * 0.22,
        dropRot: r.range(-35, 35),
        kb: { s: r.range(1.08, 1.2), x: r.range(-4, 4), y: r.range(-4, 4) },
      })),
    }
  }, [scene.seed, scene.photos, n])

  return (
    <SceneFrame>
      <div
        className="absolute inset-[5vmin] grid gap-[1.2vmin]"
        style={{
          gridTemplateColumns: `repeat(${plan.layout.cols}, 1fr)`,
          gridTemplateRows: `repeat(${plan.layout.rows}, 1fr)`,
          perspective: 1600,
        }}
      >
        {scene.photos.slice(0, n).map((p, i) => {
          const [c, r, cs, rs] = plan.layout.rects[i]
          const t = plan.tiles[i]
          const turn = (v: number) => (plan.flipAxis === 'rotateY' ? { rotateY: v } : { rotateX: v })
          const exit =
            plan.exitMode === 'drop'
              ? { y: '110vh', rotate: t.dropRot, transition: { duration: 0.9, delay: t.delay * 0.4, ease: easeIn } }
              : plan.exitMode === 'flip'
                ? { ...turn(-90), opacity: 0, transition: { duration: 0.5, delay: t.delay * 0.4, ease: easeIn } }
                : { scale: 0, opacity: 0, transition: { duration: 0.5, delay: t.delay * 0.4, ease: easeIn } }
          return (
            <motion.div
              key={p.id}
              className="relative overflow-hidden rounded-[0.6vmin] shadow-[0_15px_40px_rgba(0,0,0,.55)]"
              style={{ gridColumn: `${c + 1} / span ${cs}`, gridRow: `${r + 1} / span ${rs}` }}
              initial={{ ...turn(90), opacity: 0 }}
              animate={{ ...turn(0), opacity: 1 }}
              exit={exit}
              transition={{ duration: 0.9, delay: t.delay, ease: smooth }}
            >
              <motion.div
                className="absolute inset-0"
                initial={{ scale: 1, x: '0%', y: '0%' }}
                animate={{ scale: t.kb.s, x: `${t.kb.x}%`, y: `${t.kb.y}%` }}
                transition={{ duration: scene.duration / 1000 + 2, ease: 'linear' }}
              >
                <Img photo={p} filter={scene.filter} />
              </motion.div>
            </motion.div>
          )
        })}
      </div>
    </SceneFrame>
  )
}

// ───────────────────────── Split screens ─────────────────────────

export function Splits({ scene }: SceneProps) {
  const plan = useMemo(() => {
    const r = rng(scene.seed)
    return {
      skew: r.next() < 0.45 ? r.sign() * r.range(7, 12) : 0,
      panels: scene.photos.map((_, i) => ({ up: i % 2 === 0, pan: r.range(6, 12) * r.sign() })),
    }
  }, [scene.seed, scene.photos])

  return (
    <SceneFrame>
      <div
        className="absolute inset-0 flex gap-[0.6vmin] bg-cream/80"
        style={{ transform: plan.skew ? `skewX(${plan.skew}deg) scale(1.25)` : undefined }}
      >
        {scene.photos.map((p, i) => {
          const pl = plan.panels[i]
          return (
            <motion.div
              key={p.id}
              className="relative h-full flex-1 overflow-hidden"
              initial={{ clipPath: pl.up ? 'inset(100% 0 0 0)' : 'inset(0 0 100% 0)' }}
              animate={{ clipPath: 'inset(0% 0 0% 0)' }}
              exit={{ y: pl.up ? '-110vh' : '110vh', transition: { duration: 0.8, delay: i * 0.09, ease: easeIn } }}
              transition={{ duration: 1.1, delay: 0.1 + i * 0.32, ease: smooth }}
            >
              <motion.div
                className="absolute -inset-[8%]"
                style={{ transform: plan.skew ? `skewX(${-plan.skew}deg)` : undefined }}
                initial={{ y: `${-pl.pan / 2}%` }}
                animate={{ y: `${pl.pan / 2}%` }}
                transition={{ duration: scene.duration / 1000 + 1.5, ease: 'linear' }}
              >
                <Img photo={p} filter={scene.filter} />
              </motion.div>
            </motion.div>
          )
        })}
      </div>
    </SceneFrame>
  )
}

// ───────────────────────── 35mm film strip ─────────────────────────

function Sprockets({ band, labels, pitch, offset }: { band: number; labels: number; pitch: number; offset: number }) {
  return (
    <div className="relative" style={{ height: band }}>
      <div className="sprockets absolute inset-x-0 top-[28%] h-[44%]" />
      {Array.from({ length: labels }, (_, i) => (
        <div key={i} className="stamp absolute top-0 text-[1.1vmin] opacity-80" style={{ left: offset + i * pitch }}>
          {i % 2 ? `${12 + i}A` : `KODAK 400  ▸ ${12 + i}`}
        </div>
      ))}
    </div>
  )
}

export function Filmstrip({ scene }: SceneProps) {
  const { w, h } = useViewport()
  const r = useMemo(() => rng(scene.seed), [scene.seed])
  const tilt = useMemo(() => r.range(-6, 6), [r])
  const fh = h * 0.4
  const fw = fh * 1.45
  const band = fh * 0.17
  const gap = fh * 0.06
  const stripW = scene.photos.length * (fw + gap) + gap
  const startX = w * 0.06
  const endX = stripW > w * 0.88 ? w * 0.94 - stripW : startX - w * 0.08
  const secs = scene.duration / 1000 + 1

  return (
    <SceneFrame>
      <div className="absolute inset-0 flex items-center" style={{ transform: `rotate(${tilt}deg)` }}>
        <motion.div
          className="film-base shrink-0 shadow-[0_30px_80px_rgba(0,0,0,.8)]"
          style={{ width: stripW }}
          initial={{ x: w + 40 }}
          animate={{ x: [w + 40, startX, endX] }}
          exit={{ x: -stripW - w * 0.2, transition: { duration: 1.1, ease: easeIn } }}
          transition={{ duration: secs, times: [0, 0.14, 1], ease: ['easeOut', 'linear'] }}
        >
          <Sprockets band={band} labels={scene.photos.length} pitch={fw + gap} offset={gap + fw * 0.06} />
          <div className="flex" style={{ gap, paddingInline: gap }}>
            {scene.photos.map((p) => (
              <div key={p.id} className="overflow-hidden rounded-[3px]" style={{ width: fw, height: fh }}>
                <Img photo={p} filter={scene.filter} />
              </div>
            ))}
          </div>
          <Sprockets band={band} labels={0} pitch={0} offset={0} />
        </motion.div>
      </div>
    </SceneFrame>
  )
}

// ───────────────────────── Photo-booth strips ─────────────────────────

export function Booth({ scene }: SceneProps) {
  const { w, h } = useViewport()
  const perStrip = scene.photos.length === 6 ? 3 : 4
  const strips: (typeof scene.photos)[] = []
  for (let i = 0; i < scene.photos.length; i += perStrip) strips.push(scene.photos.slice(i, i + perStrip))
  const stripH = h * 0.9
  const pad = stripH * 0.025
  const label = stripH * 0.09
  const frame = Math.min((stripH - label - pad * (perStrip + 1)) / perStrip, w * 0.26)
  const stripCount = strips.length
  const plan = useMemo(() => {
    const r = rng(scene.seed)
    return Array.from({ length: stripCount }, () => ({ rot: r.range(-5, 5), fall: r.range(-30, 30), bw: r.next() < 0.5 }))
  }, [scene.seed, stripCount])

  return (
    <SceneFrame>
      <div className="absolute inset-0 flex items-center justify-center gap-[6vw]">
        {strips.map((strip, si) => (
          <motion.div
            key={si}
            className="bg-paper shadow-[0_30px_70px_rgba(0,0,0,.7)]"
            style={{ padding: pad, display: 'flex', flexDirection: 'column', gap: pad }}
            initial={{ y: '-115vh', rotate: 0 }}
            animate={{ y: 0, rotate: plan[si].rot }}
            exit={{ y: '120vh', rotate: plan[si].fall, transition: { duration: 0.9, delay: si * 0.15, ease: easeIn } }}
            transition={{ y: { duration: 2.4, delay: 0.2 + si * 0.6, ease: [0.3, 0.7, 0.4, 1] }, rotate: { duration: 1, delay: 2.4 + si * 0.6 } }}
          >
            {strip.map((p) => (
              <div key={p.id} className="overflow-hidden bg-black" style={{ width: frame, height: frame }}>
                <Img photo={p} style={{ filter: plan[si].bw ? 'grayscale(1) contrast(1.25)' : 'sepia(.3) contrast(1.1)' }} />
              </div>
            ))}
            <div className="font-hand flex items-center justify-center text-ink/70" style={{ height: label - pad, fontSize: label * 0.42 }}>
              the era of J.S.
            </div>
          </motion.div>
        ))}
      </div>
    </SceneFrame>
  )
}

// ───────────────────────── Wall of TVs ─────────────────────────

export function Screens({ scene }: SceneProps) {
  const { w, h } = useViewport()
  const n = scene.photos.length
  const cols = n <= 4 ? 2 : 3
  const rows = 2
  const slots = cols * rows
  const order = useMemo(() => {
    const r = rng(scene.seed)
    return Array.from({ length: slots }, (_, i) => i).sort(() => r.next() - 0.5)
  }, [scene.seed, slots])
  const gap = Math.min(w, h) * 0.025
  const cellW = Math.min((w * 0.9 - gap * (cols - 1)) / cols, ((h * 0.86 - gap) / rows) * (4 / 3))
  const cellH = cellW * 0.75

  return (
    <SceneFrame>
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.div
          className="grid"
          style={{ gridTemplateColumns: `repeat(${cols}, ${cellW}px)`, gap }}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, transition: { delay: 0.9, duration: 0.4 } }}
          transition={{ duration: 0.6 }}
        >
          {Array.from({ length: slots }, (_, i) => (
            <div
              key={i}
              className="rounded-[1.4vmin] bg-gradient-to-b from-zinc-700 to-zinc-900 p-[1vmin] shadow-[0_20px_50px_rgba(0,0,0,.7)]"
              style={{ width: cellW, height: cellH }}
            >
              <div className="relative h-full w-full overflow-hidden bg-black" style={{ borderRadius: '8% / 11%' }}>
                {i < n ? (
                  <CrtScreen scene={scene} index={i} delay={0.3 + order[i] * 0.28} />
                ) : (
                  <div className="static-noise absolute inset-0 opacity-70" />
                )}
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </SceneFrame>
  )
}

// ───────────────────────── 3D carousel ─────────────────────────

export function Carousel({ scene }: SceneProps) {
  const { w, h } = useViewport()
  const n = scene.photos.length
  const cardW = Math.min(w * 0.22, h * 0.4)
  const cardH = cardW * 1.2
  const radius = (cardW / (2 * Math.tan(Math.PI / n))) * 1.25
  const r = useMemo(() => rng(scene.seed), [scene.seed])
  const dir = useMemo(() => r.sign(), [r])

  return (
    <SceneFrame>
      <div className="absolute inset-0 flex items-center justify-center" style={{ perspective: 1500 }}>
        <motion.div
          style={{ transformStyle: 'preserve-3d', width: cardW, height: cardH }}
          initial={{ scale: 0.2, rotateX: 70, opacity: 0 }}
          animate={{ scale: 1, rotateX: -8, opacity: 1 }}
          exit={{ y: '-80vh', rotateX: -70, scale: 0.4, opacity: 0, transition: { duration: 1, ease: easeIn } }}
          transition={{ duration: 1.6, ease: smooth }}
        >
          <motion.div
            className="relative h-full w-full"
            style={{ transformStyle: 'preserve-3d' }}
            initial={{ rotateY: 0 }}
            animate={{ rotateY: dir * 300 }}
            transition={{ duration: scene.duration / 1000 + 1, ease: 'linear' }}
          >
            {scene.photos.map((p, i) => (
              <div
                key={p.id}
                className="absolute inset-0"
                style={{ transform: `rotateY(${(i * 360) / n}deg) translateZ(${radius}px)`, transformStyle: 'preserve-3d' }}
              >
                <div style={{ backfaceVisibility: 'hidden' }}>
                  <Polaroid photo={p} width={cardW} filter={scene.filter} captionText={caption(p, scene.seed + i)} />
                </div>
                {/* back of the print, seen across the ring */}
                <div
                  className="paper-back absolute top-0 left-0 brightness-75"
                  style={{ width: cardW, height: cardW * 1.176, transform: 'rotateY(180deg)', backfaceVisibility: 'hidden' }}
                />
              </div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </SceneFrame>
  )
}
