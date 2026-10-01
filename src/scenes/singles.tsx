import { motion, type TargetAndTransition } from 'motion/react'
import { useMemo } from 'react'
import { rng, type Scene } from '../lib/director'
import { Backdrop, DateStamp, Img, Polaroid, SceneFrame, Tape } from '../components/shared'
import { caption, filterCss, fit, useViewport } from '../lib/display'

export type SceneProps = { scene: Scene }

const easeIn = [0.55, 0, 0.85, 0.35] as const
const easeOutBack = [0.2, 0.9, 0.3, 1.15] as const
const smooth = [0.7, 0, 0.2, 1] as const

/** True when cropping the photo to fill the screen would lose little. */
const fillsScreen = (pw: number, ph: number, w: number, h: number) => Math.abs(Math.log(pw / ph / (w / h))) < 0.42

// ───────────────────────── Ken Burns ─────────────────────────

export function KenBurns({ scene }: SceneProps) {
  const { w, h } = useViewport()
  const p = scene.photos[0]
  const plan = useMemo(() => {
    const r = rng(scene.seed)
    const cx = r.int(30, 70)
    const cy = r.int(30, 70)
    const wipeDirs = ['inset(0 100% 0 0)', 'inset(0 0 0 100%)', 'inset(100% 0 0 0)', 'inset(0 0 100% 0)']
    const entries: Record<string, { initial: TargetAndTransition; animate: TargetAndTransition; reverse: TargetAndTransition }> = {
      iris: {
        initial: { clipPath: `circle(0% at ${cx}% ${cy}%)` },
        animate: { clipPath: `circle(85% at ${cx}% ${cy}%)` },
        reverse: { clipPath: `circle(0% at ${100 - cx}% ${100 - cy}%)` },
      },
      wipe: (() => {
        const i = r.int(0, 3)
        return {
          initial: { clipPath: wipeDirs[i] },
          animate: { clipPath: 'inset(0 0 0 0)' },
          reverse: { clipPath: wipeDirs[i ^ 1] },
        }
      })(),
      diamond: {
        initial: { clipPath: 'polygon(50% 50%, 50% 50%, 50% 50%, 50% 50%)' },
        animate: { clipPath: 'polygon(50% -60%, 160% 50%, 50% 160%, -60% 50%)' },
        reverse: { clipPath: 'polygon(50% 50%, 50% 50%, 50% 50%, 50% 50%)' },
      },
      zoomblur: {
        initial: { scale: 1.6, opacity: 0, filter: 'blur(28px)' },
        animate: { scale: 1, opacity: 1, filter: 'blur(0px)' },
        reverse: { scale: 0.6, opacity: 0, filter: 'blur(28px)' },
      },
      slam: {
        initial: { scale: 3, opacity: 0, rotate: r.range(-12, 12) },
        animate: { scale: 1, opacity: 1, rotate: 0 },
        reverse: { scale: 3, opacity: 0 },
      },
    }
    const entryName = r.pick(Object.keys(entries))
    const entry = entries[entryName]
    const s = r.sign()
    const exits: TargetAndTransition[] = [
      { ...entry.reverse, transition: { duration: 1, ease: smooth } },
      { x: `${s * 115}vw`, rotate: s * 8, transition: { duration: 0.9, ease: easeIn } },
      { scale: 1.35, opacity: 0, filter: 'blur(20px)', transition: { duration: 1 } },
      { y: '115vh', rotate: s * 14, transition: { duration: 0.95, ease: easeIn } },
    ]
    const zoomIn = r.next() < 0.6
    return {
      entry,
      entryName,
      exit: r.pick(exits),
      from: zoomIn ? 1.02 : 1.24,
      to: zoomIn ? r.range(1.18, 1.28) : 1.03,
      dx: r.range(-4, 4),
      dy: r.range(-3, 3),
    }
  }, [scene.seed])

  const cover = fillsScreen(p.w, p.h, w, h)
  const box = fit(p, w * 0.86, h * 0.86)

  return (
    <SceneFrame>
      {!cover && <Backdrop photo={p} />}
      <motion.div
        className="absolute inset-0"
        initial={plan.entry.initial}
        animate={plan.entry.animate}
        exit={plan.exit}
        transition={{ duration: plan.entryName === 'slam' ? 0.7 : 1.4, ease: plan.entryName === 'slam' ? easeOutBack : smooth }}
      >
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          initial={{ scale: plan.from, x: '0%', y: '0%' }}
          animate={{ scale: plan.to, x: `${plan.dx}%`, y: `${plan.dy}%` }}
          transition={{ duration: scene.duration / 1000 + 2.5, ease: 'linear' }}
        >
          {cover ? (
            <Img photo={p} filter={scene.filter} />
          ) : (
            <div style={{ width: box.w, height: box.h }} className="shadow-[0_30px_80px_rgba(0,0,0,.6)]">
              <Img photo={p} filter={scene.filter} />
            </div>
          )}
        </motion.div>
        <DateStamp photo={p} className="right-[5vw] bottom-[5vh]" />
      </motion.div>
    </SceneFrame>
  )
}

// ───────────────────────── Polaroid drop ─────────────────────────

export function Drop({ scene }: SceneProps) {
  const { w, h } = useViewport()
  const p = scene.photos[0]
  const r = useMemo(() => rng(scene.seed), [scene.seed])
  const plan = useMemo(
    () => ({
      startRot: r.range(-55, 55),
      endRot: r.range(-6, 6),
      startX: r.range(-25, 25),
      exitSign: r.sign(),
      tape: r.next() < 0.6,
      tapeRot: r.range(-8, 8),
    }),
    [r],
  )
  const width = Math.min(w * 0.42, (h * 0.8) / 1.18)

  return (
    <SceneFrame>
      <Backdrop photo={p} dim={0.62} />
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.div
          initial={{ y: '-125vh', x: `${plan.startX}vw`, rotate: plan.startRot, scale: 1.3 }}
          animate={{ y: 0, x: 0, rotate: plan.endRot, scale: 1 }}
          exit={{
            x: `${plan.exitSign * 140}vw`,
            y: '-15vh',
            rotate: plan.exitSign * 75,
            transition: { duration: 0.85, ease: easeIn },
          }}
          transition={{ type: 'spring', stiffness: 65, damping: 10, mass: 1.3 }}
        >
          <Polaroid photo={p} width={width} filter={scene.filter} captionText={caption(p, scene.seed)} />
          {plan.tape && <Tape style={{ top: '-3%', left: '31%', transform: `rotate(${plan.tapeRot}deg)` }} />}
        </motion.div>
      </div>
    </SceneFrame>
  )
}

// ───────────────────────── Developing Polaroid ─────────────────────────

export function Develop({ scene }: SceneProps) {
  const { w, h } = useViewport()
  const p = scene.photos[0]
  const r = useMemo(() => rng(scene.seed), [scene.seed])
  const rot = useMemo(() => r.range(-4, 4), [r])
  const width = Math.min(w * 0.4, (h * 0.8) / 1.18)

  return (
    <SceneFrame>
      <Backdrop photo={p} dim={0.7} />
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.div
          initial={{ y: '75vh', rotate: 0 }}
          animate={{ y: 0, rotate: [0, 0, -5, 4, -3, 2, rot] }}
          exit={{ y: '120vh', rotate: rot * 6, transition: { duration: 0.9, ease: easeIn } }}
          transition={{
            y: { duration: 2.2, ease: [0.15, 0.6, 0.3, 1] },
            rotate: { duration: 3.8, times: [0, 0.5, 0.6, 0.7, 0.8, 0.9, 1] },
          }}
        >
          <Polaroid photo={p} width={width} captionText={caption(p, scene.seed)}>
            {/* sepia ghost of the photo fades first, then the murky chemistry clears */}
            <motion.img
              src={p.url}
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
              style={{ filter: 'sepia(1) contrast(.55) brightness(1.35) blur(2px)', objectPosition: '50% 35%' }}
              initial={{ opacity: 1 }}
              animate={{ opacity: 0 }}
              transition={{ delay: 3.2, duration: 3 }}
            />
            <motion.div
              className="absolute inset-0"
              style={{ background: 'linear-gradient(160deg,#4d5148,#3a3a33)' }}
              initial={{ opacity: 1 }}
              animate={{ opacity: 0 }}
              transition={{ delay: 1.2, duration: 3.2, ease: 'easeIn' }}
            />
          </Polaroid>
        </motion.div>
      </div>
    </SceneFrame>
  )
}

// ───────────────────────── 3D card flip ─────────────────────────

export function Flip({ scene }: SceneProps) {
  const { w, h } = useViewport()
  const p = scene.photos[0]
  const r = useMemo(() => rng(scene.seed), [scene.seed])
  const plan = useMemo(() => ({ tilt: r.range(-25, 25), axis: r.next() < 0.5 ? 'rotateY' : 'rotateX' }), [r])
  const box = fit(p, w * 0.66, h * 0.72)
  const border = Math.max(8, Math.min(box.w, box.h) * 0.035)
  const axis = plan.axis as 'rotateY' | 'rotateX'
  const faceFlip = axis === 'rotateY' ? 'rotateY(180deg)' : 'rotateX(180deg)'
  const turn = (v: number | number[]) => (axis === 'rotateY' ? { rotateY: v } : { rotateX: v })

  return (
    <SceneFrame>
      <Backdrop photo={p} />
      <div className="absolute inset-0 flex items-center justify-center" style={{ perspective: 1800 }}>
        <motion.div
          className="relative"
          style={{ width: box.w + border * 2, height: box.h + border * 2, transformStyle: 'preserve-3d' }}
          initial={{ scale: 0.25, y: '45vh', rotate: plan.tilt, opacity: 0, ...turn(0) }}
          animate={{ scale: 1, y: 0, rotate: 0, opacity: 1, ...turn([0, 0, 180]) }}
          exit={{ ...turn(540), scale: 0.2, opacity: 0, transition: { duration: 1, ease: easeIn } }}
          transition={{
            default: { duration: 1.1, ease: smooth },
            opacity: { duration: 0.4 },
            [axis]: { duration: 2.6, times: [0, 0.45, 1], ease: 'easeInOut' as const },
          }}
        >
          {/* back of the print */}
          <div
            className="paper-back absolute inset-0 flex flex-col items-center justify-center gap-[2vh] rounded-sm shadow-2xl"
            style={{ backfaceVisibility: 'hidden' }}
          >
            <div className="font-hand text-ink/80" style={{ fontSize: Math.max(22, box.w * 0.07) }}>
              {caption(p, scene.seed)}
            </div>
            <div className="font-display text-ink/40 italic" style={{ fontSize: Math.max(12, box.w * 0.028) }}>
              The Era of Jonathan Schauer
            </div>
          </div>
          {/* front */}
          <div
            className="absolute inset-0 rounded-sm bg-cream shadow-[0_30px_80px_rgba(0,0,0,.6)]"
            style={{ backfaceVisibility: 'hidden', transform: faceFlip, padding: border }}
          >
            <Img photo={p} filter={scene.filter} />
          </div>
        </motion.div>
      </div>
    </SceneFrame>
  )
}

// ───────────────────────── Spin-in over a sunburst ─────────────────────────

export function Spin({ scene }: SceneProps) {
  const { w, h } = useViewport()
  const p = scene.photos[0]
  const r = useMemo(() => rng(scene.seed), [scene.seed])
  const plan = useMemo(() => ({ dir: r.sign(), rest: r.range(-5, 5), turns: r.int(1, 3) }), [r])
  const box = fit(p, w * 0.6, h * 0.7)
  const border = Math.max(10, Math.min(box.w, box.h) * 0.04)

  return (
    <SceneFrame>
      <motion.div
        className="absolute inset-0 flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0, transition: { duration: 0.8 } }}
        transition={{ duration: 1.5 }}
      >
        <div className="sunburst absolute h-[220vmax] w-[220vmax] shrink-0" />
        <div className="absolute inset-0" style={{ background: 'radial-gradient(circle, transparent 20%, #140d09 75%)' }} />
      </motion.div>
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.div
          className="bg-cream shadow-[0_40px_90px_rgba(0,0,0,.7)]"
          style={{ width: box.w + border * 2, height: box.h + border * 2, padding: border }}
          initial={{ scale: 0, rotate: plan.dir * 360 * plan.turns }}
          animate={{ scale: 1, rotate: plan.rest }}
          exit={{ scale: 0, rotate: -plan.dir * 360 * plan.turns, transition: { duration: 0.9, ease: easeIn } }}
          transition={{ type: 'spring', stiffness: 45, damping: 11 }}
        >
          <div className="relative h-full w-full">
            <Img photo={p} filter={scene.filter} />
            <DateStamp photo={p} className="right-[4%] bottom-[4%]" />
          </div>
        </motion.div>
      </div>
    </SceneFrame>
  )
}

// ───────────────────────── Retro CRT TV ─────────────────────────

/** Screen content that powers on like a tube TV and collapses to a line on exit. */
export function CrtScreen({ scene, index = 0, delay = 0.5 }: { scene: Scene; index?: number; delay?: number }) {
  const p = scene.photos[index]
  return (
    <motion.div
      className="absolute inset-0 origin-center overflow-hidden"
      initial={{ scaleX: 0, scaleY: 0.006, filter: 'brightness(4)' }}
      animate={{ scaleX: [0, 1, 1], scaleY: [0.006, 0.006, 1], filter: ['brightness(4)', 'brightness(4)', 'brightness(1)'] }}
      exit={{
        scaleY: [1, 0.006, 0.006],
        scaleX: [1, 1, 0],
        filter: ['brightness(1)', 'brightness(3)', 'brightness(5)'],
        transition: { duration: 0.55, times: [0, 0.55, 1], delay: delay * 0.25 },
      }}
      transition={{ duration: 0.9, times: [0, 0.35, 1], delay }}
    >
      <div className="flicker absolute inset-0" style={{ filter: 'saturate(1.25) contrast(1.1)' }}>
        <Img photo={p} filter={scene.filter} />
      </div>
      <div className="scanlines absolute inset-0" />
      <div className="rolling-bar absolute inset-x-0 top-0" />
      <div className="crt-glow absolute inset-0" />
    </motion.div>
  )
}

export function Crt({ scene }: SceneProps) {
  const { w, h } = useViewport()
  const screenW = Math.min(w * 0.56, h * 0.62 * (4 / 3))
  const screenH = screenW * 0.75
  const pad = screenW * 0.06
  const panel = screenW * 0.2

  return (
    <SceneFrame>
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.div
          className="relative"
          initial={{ y: '20vh', opacity: 0, scale: 0.9 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: '10vh', opacity: 0, scale: 0.95, transition: { delay: 0.55, duration: 0.6 } }}
          transition={{ duration: 0.8, ease: smooth }}
        >
          {/* rabbit ears */}
          <div className="absolute bottom-full left-1/2 h-0 w-0">
            <div className="absolute bottom-0 h-[22vh] w-[3px] origin-bottom -rotate-[28deg] rounded bg-gradient-to-t from-zinc-500 to-zinc-300" />
            <div className="absolute bottom-0 h-[26vh] w-[3px] origin-bottom rotate-[22deg] rounded bg-gradient-to-t from-zinc-500 to-zinc-300" />
            <div className="absolute -bottom-2 -left-6 h-5 w-12 rounded-t-full bg-zinc-800" />
          </div>
          <div
            className="flex rounded-[2.2vmin] shadow-[0_40px_90px_rgba(0,0,0,.75)]"
            style={{
              padding: pad,
              gap: pad,
              background:
                'repeating-linear-gradient(92deg, rgba(0,0,0,.12) 0 3px, transparent 3px 11px), linear-gradient(180deg,#7a4a26,#4a2a14)',
            }}
          >
            <div
              className="relative overflow-hidden bg-black shadow-[inset_0_0_30px_rgba(0,0,0,.9)]"
              style={{ width: screenW, height: screenH, borderRadius: '7% / 9%', outline: `${pad * 0.25}px solid #1b1b1b` }}
            >
              <CrtScreen scene={scene} />
            </div>
            <div className="flex flex-col items-center justify-between rounded-lg bg-[#2b2219] py-[4%]" style={{ width: panel }}>
              {[0, 1].map((i) => (
                <motion.div
                  key={i}
                  className="aspect-square w-[58%] rounded-full bg-gradient-to-br from-zinc-300 to-zinc-600 shadow-lg"
                  initial={{ rotate: 0 }}
                  animate={{ rotate: i ? 120 : -200 }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                >
                  <div className="mx-auto h-1/2 w-[12%] bg-zinc-800" />
                </motion.div>
              ))}
              <div className="flex w-[70%] flex-col gap-[6%]">
                {Array.from({ length: 6 }, (_, i) => (
                  <div key={i} className="h-[3px] rounded bg-black/50" />
                ))}
              </div>
              <div className="stamp text-[1.2vmin]">CH 3</div>
            </div>
          </div>
        </motion.div>
      </div>
    </SceneFrame>
  )
}

// ───────────────────────── Tiles that assemble, then explode ─────────────────────────

export function Tiles({ scene }: SceneProps) {
  const { w, h } = useViewport()
  const p = scene.photos[0]
  const box = fit(p, w * 0.8, h * 0.82)
  const portrait = box.h > box.w
  const cols = portrait ? 4 : 6
  const rows = portrait ? 6 : 4
  const tw = box.w / cols
  const th = box.h / rows
  const tiles = useMemo(() => {
    const r = rng(scene.seed)
    return Array.from({ length: cols * rows }, (_, i) => {
      const c = i % cols
      const row = Math.floor(i / cols)
      const fromCenterX = c + 0.5 - cols / 2
      const fromCenterY = row + 0.5 - rows / 2
      return {
        c,
        row,
        from: { x: r.range(-w, w) * 0.9, y: r.range(-h, h) * 0.9, rotate: r.range(-220, 220), scale: r.range(0.2, 0.7) },
        delay: r.range(0, 1.3),
        out: {
          x: fromCenterX * tw * r.range(3, 7),
          y: fromCenterY * th * r.range(3, 7) + r.range(0, h * 0.3),
          rotate: r.range(-300, 300),
        },
        outDelay: r.range(0, 0.25),
      }
    })
  }, [scene.seed, cols, rows, w, h, tw, th])

  return (
    <SceneFrame>
      <Backdrop photo={p} dim={0.72} />
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.div
          className="relative"
          style={{ width: box.w, height: box.h }}
          initial={{ scale: 1 }}
          animate={{ scale: 1.06 }}
          transition={{ duration: scene.duration / 1000, ease: 'linear' }}
        >
          <motion.div
            className="absolute inset-0 shadow-[0_30px_80px_rgba(0,0,0,.7)]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.2 } }}
            transition={{ delay: 2.6, duration: 0.6 }}
          />
          {tiles.map((t) => (
            <motion.div
              key={`${t.c}-${t.row}`}
              className="absolute"
              style={{
                left: t.c * tw,
                top: t.row * th,
                width: tw + 0.75,
                height: th + 0.75,
                backgroundImage: `url(${p.url})`,
                backgroundSize: `${box.w}px ${box.h}px`,
                backgroundPosition: `${-t.c * tw}px ${-t.row * th}px`,
                filter: filterCss(scene.filter),
              }}
              initial={{ ...t.from, opacity: 0 }}
              animate={{ x: 0, y: 0, rotate: 0, scale: 1, opacity: 1 }}
              exit={{ ...t.out, opacity: 0, scale: 0.6, transition: { duration: 1, delay: t.outDelay, ease: [0.4, 0, 1, 1] } }}
              transition={{ duration: 1.4, delay: t.delay, ease: [0.2, 0.8, 0.2, 1] }}
            />
          ))}
        </motion.div>
      </div>
    </SceneFrame>
  )
}

// ───────────────────────── Black & white → colour sweep ─────────────────────────

export function Sweep({ scene }: SceneProps) {
  const { w, h } = useViewport()
  const p = scene.photos[0]
  const r = useMemo(() => rng(scene.seed), [scene.seed])
  const plan = useMemo(() => ({ vertical: r.next() < 0.35, exit: r.sign() }), [r])
  const box = fit(p, w * 0.72, h * 0.74)
  const border = Math.max(8, Math.min(box.w, box.h) * 0.03)
  const hidden = plan.vertical ? 'inset(0 0 100% 0)' : 'inset(0 100% 0 0)'

  return (
    <SceneFrame>
      <Backdrop photo={p} dim={0.75} />
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-[2vh]">
        <motion.div
          className="relative bg-cream shadow-[0_30px_80px_rgba(0,0,0,.7)]"
          style={{ width: box.w + border * 2, height: box.h + border * 2, padding: border }}
          initial={{ y: 60, opacity: 0, rotate: -2 }}
          animate={{ y: 0, opacity: 1, rotate: 0 }}
          exit={{ x: `${plan.exit * 120}vw`, rotate: plan.exit * 12, transition: { duration: 0.85, ease: easeIn } }}
          transition={{ duration: 0.9, ease: smooth }}
        >
          <div className="relative h-full w-full overflow-hidden">
            <Img photo={p} style={{ filter: 'grayscale(1) contrast(1.2) brightness(.95)' }} />
            <motion.div
              className="absolute inset-0"
              initial={{ clipPath: hidden }}
              animate={{ clipPath: 'inset(0 0 0 0)' }}
              transition={{ delay: 1.1, duration: 2.8, ease: 'easeInOut' }}
            >
              <Img photo={p} style={{ filter: 'saturate(1.25) contrast(1.05)' }} />
            </motion.div>
            <motion.div
              className={`absolute bg-gold/90 shadow-[0_0_24px_8px_rgba(232,179,90,.7)] ${plan.vertical ? 'inset-x-0 h-[3px]' : 'inset-y-0 w-[3px]'}`}
              initial={plan.vertical ? { top: '0%', opacity: 1 } : { left: '0%', opacity: 1 }}
              animate={plan.vertical ? { top: '100%', opacity: [1, 1, 0] } : { left: '100%', opacity: [1, 1, 0] }}
              transition={{ delay: 1.1, duration: 2.8, ease: 'easeInOut' }}
            />
          </div>
        </motion.div>
        <motion.div
          className="font-hand text-gold"
          style={{ fontSize: 'clamp(24px, 3.4vw, 60px)' }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ delay: 3.6, duration: 0.8 }}
        >
          {caption(p, scene.seed)}
        </motion.div>
      </div>
    </SceneFrame>
  )
}

// ───────────────────────── Giant year ─────────────────────────

export function Year({ scene }: SceneProps) {
  const { w, h } = useViewport()
  const p = scene.photos[0]
  const r = useMemo(() => rng(scene.seed), [scene.seed])
  const year = String(p.date?.getFullYear() ?? '')
  const letters = useMemo(() => year.split('').map(() => ({ rot: r.range(-40, 40), fall: r.range(-30, 30), d: r.range(0, 0.3) })), [r, year])
  const side = useMemo(() => r.sign(), [r])
  if (!p.date) return <KenBurns scene={scene} />

  const box = fit(p, w * 0.44, h * 0.62)
  const border = Math.max(8, Math.min(box.w, box.h) * 0.035)

  return (
    <SceneFrame>
      <div className="absolute inset-0 flex items-center" style={{ justifyContent: side > 0 ? 'flex-start' : 'flex-end', padding: '0 4vw' }}>
        <div className="font-display flex leading-none font-black" style={{ fontSize: Math.min(w * 0.24, h * 0.6) }}>
          {year.split('').map((ch, i) => (
            <motion.span
              key={i}
              className="outline-text inline-block"
              initial={{ y: '-90vh', rotate: letters[i].rot, opacity: 0 }}
              animate={{ y: 0, rotate: 0, opacity: 1 }}
              exit={{ y: '110vh', rotate: letters[i].fall, transition: { duration: 0.9, delay: letters[i].d, ease: easeIn } }}
              transition={{ type: 'spring', stiffness: 80, damping: 9, delay: 0.12 * i }}
            >
              {ch}
            </motion.span>
          ))}
        </div>
      </div>
      <div className="absolute inset-0 flex items-center" style={{ justifyContent: side > 0 ? 'flex-end' : 'flex-start', padding: '0 9vw' }}>
        <motion.div
          className="relative bg-cream shadow-[0_40px_90px_rgba(0,0,0,.75)]"
          style={{ width: box.w + border * 2, height: box.h + border * 2, padding: border }}
          initial={{ x: `${side * 100}vw`, rotate: side * 25 }}
          animate={{ x: 0, rotate: -side * 4 }}
          exit={{ x: `${-side * 130}vw`, rotate: -side * 40, transition: { duration: 0.85, ease: easeIn } }}
          transition={{ type: 'spring', stiffness: 50, damping: 12, delay: 0.9 }}
        >
          <Img photo={p} filter={scene.filter} />
          <div className="font-hand absolute -bottom-[7vh] left-0 text-gold" style={{ fontSize: 'clamp(22px, 3vw, 54px)' }}>
            {caption(p)}
          </div>
        </motion.div>
      </div>
    </SceneFrame>
  )
}

// ───────────────────────── Camera viewfinder → flash → shutter ─────────────────────────

export function Shutter({ scene }: SceneProps) {
  const { w, h } = useViewport()
  const p = scene.photos[0]
  const cover = fillsScreen(p.w, p.h, w, h)
  const box = cover ? { w, h } : fit(p, w * 0.86, h * 0.86)
  const base = filterCss(scene.filter) ?? ''
  const bracket = 'absolute h-[7vmin] w-[7vmin] border-white/85'

  return (
    <SceneFrame>
      {!cover && <Backdrop photo={p} />}
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.div
          style={{ width: box.w, height: box.h }}
          className="relative"
          initial={{ x: 0 }}
          animate={{ x: [0, -14, 11, -7, 4, 0], scale: [1, 1, 1.015, 1, 1, 1.05] }}
          transition={{ delay: 1.9, duration: 0.5, scale: { delay: 1.9, duration: scene.duration / 1000 } }}
        >
          <motion.img
            src={p.url}
            alt=""
            draggable={false}
            className="block h-full w-full object-cover"
            style={{ objectPosition: '50% 35%' }}
            initial={{ filter: `${base} blur(22px) brightness(.8)` }}
            animate={{ filter: [`${base} blur(22px) brightness(.8)`, `${base} blur(0px) brightness(1)`] }}
            transition={{ duration: 1.3, delay: 0.3, ease: 'easeOut' }}
          />
          <DateStamp photo={p} className="right-[5%] bottom-[5%]" />
        </motion.div>
      </div>
      {/* viewfinder overlay */}
      <motion.div
        className="pointer-events-none absolute inset-[6vmin]"
        initial={{ opacity: 1 }}
        animate={{ opacity: [1, 1, 0] }}
        transition={{ duration: 2.2, times: [0, 0.85, 1] }}
      >
        <div className={`${bracket} top-0 left-0 border-t-4 border-l-4`} />
        <div className={`${bracket} top-0 right-0 border-t-4 border-r-4`} />
        <div className={`${bracket} bottom-0 left-0 border-b-4 border-l-4`} />
        <div className={`${bracket} right-0 bottom-0 border-r-4 border-b-4`} />
        <motion.div
          className="absolute top-1/2 left-1/2 h-[14vmin] w-[18vmin] -translate-x-1/2 -translate-y-1/2 border-2"
          initial={{ scale: 1.5, borderColor: 'rgba(255,255,255,.9)' }}
          animate={{ scale: 1, borderColor: ['rgba(255,255,255,.9)', 'rgba(110,255,140,1)'] }}
          transition={{ duration: 1.2, delay: 0.3, borderColor: { delay: 1.5, duration: 0.1 } }}
        />
        <div className="stamp absolute top-0 left-1/2 -translate-x-1/2 text-[2vmin]">● AF</div>
      </motion.div>
      {/* flash */}
      <motion.div
        className="pointer-events-none absolute inset-0 bg-white"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 1, 0] }}
        transition={{ delay: 1.75, duration: 0.7, times: [0, 0.12, 1] }}
      />
      {/* shutter blades close on exit */}
      <motion.div
        className="absolute inset-x-0 top-0 h-1/2 bg-[#0b0806]"
        initial={{ y: '-101%' }}
        exit={{ y: '0%', transition: { duration: 0.45, ease: easeIn } }}
      />
      <motion.div
        className="absolute inset-x-0 bottom-0 h-1/2 bg-[#0b0806]"
        initial={{ y: '101%' }}
        exit={{ y: '0%', transition: { duration: 0.45, ease: easeIn } }}
      />
    </SceneFrame>
  )
}
