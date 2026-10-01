import { AnimatePresence, motion } from 'motion/react'
import { useCallback, useEffect, useRef, useState, type ComponentType } from 'react'
import { Director, type Scene, type SceneKind } from '../lib/director'
import type { MediaItem } from '../lib/library'
import { warmAll } from '../lib/prepare'
import { Booth, Carousel, Filmstrip, Mosaic, Scatter, Screens, Splits } from '../scenes/collages'
import { Crt, Develop, Drop, Flip, KenBurns, Shutter, Spin, Sweep, Tiles, Year, type SceneProps } from '../scenes/singles'
import { Ascii, Magazine, Newspaper, Projector, Puzzle, Vinyl } from '../scenes/extras'
import { Title, type ShowInfo } from '../scenes/Title'
import { toggleFullscreen } from '../lib/display'
import { Finale } from './Finale'
import { LightLeak } from './shared'

const SCENES: Record<Exclude<SceneKind, 'title' | 'finale'>, ComponentType<SceneProps>> = {
  kenburns: KenBurns,
  drop: Drop,
  develop: Develop,
  flip: Flip,
  spin: Spin,
  crt: Crt,
  tiles: Tiles,
  sweep: Sweep,
  year: Year,
  shutter: Shutter,
  magazine: Magazine,
  vinyl: Vinyl,
  newspaper: Newspaper,
  puzzle: Puzzle,
  ascii: Ascii,
  projector: Projector,
  scatter: Scatter,
  mosaic: Mosaic,
  splits: Splits,
  filmstrip: Filmstrip,
  booth: Booth,
  screens: Screens,
  carousel: Carousel,
}

/** The beat of empty stage between one scene leaving and the next arriving. */
const gapMs = () => 900 + Math.random() * 900

export function Stage({ items, info, onExit }: { items: MediaItem[]; info: ShowInfo; onExit: () => void }) {
  const [director] = useState(() => new Director(items))
  const [scene, setScene] = useState<Scene | null>(null)
  const [paused, setPaused] = useState(false)
  const [error, setError] = useState<string>()
  const [hud, setHud] = useState(true)
  const nextRef = useRef<Promise<Scene> | null>(null)
  const started = useRef(false)

  const queueNext = useCallback(
    (expectedIn: number) => {
      nextRef.current = director.next(Date.now() + expectedIn)
      nextRef.current.catch((e: Error) => setError(e.message))
    },
    [director],
  )

  useEffect(() => {
    if (!import.meta.env.DEV) return
    // Dev-only: re-plan the queued scene (pairs with window.__eraForce) and skip to it.
    const w = window as unknown as { __eraNext: () => void; __eraDirector: Director }
    w.__eraNext = () => {
      queueNext(0)
      setScene(null)
    }
    w.__eraDirector = director
  }, [queueNext, director])

  const advance = useCallback(async () => {
    try {
      const s = await nextRef.current!
      queueNext(s.duration + 2500)
      setScene(s)
    } catch {
      /* surfaced via setError */
    }
  }, [queueNext])

  useEffect(() => {
    if (started.current) return
    started.current = true
    queueNext(0)
    void advance()
    const signal = { stopped: false }
    void warmAll(items, signal)
    return () => {
      signal.stopped = true
    }
  }, [advance, queueNext, items])

  // Hold each scene for its duration, then trigger its exit.
  useEffect(() => {
    if (!scene || paused) return
    const t = setTimeout(() => setScene(null), scene.duration)
    return () => clearTimeout(t)
  }, [scene, paused])

  const onExitComplete = useCallback(() => {
    setTimeout(() => void advance(), gapMs())
  }, [advance])

  /** E key: re-plan so the very next scene is the finale, and move on to it now. */
  const playFinale = useCallback(() => {
    director.requestFinale()
    queueNext(0)
    setScene(null)
  }, [director, queueNext])

  // Keyboard controls + auto-hiding HUD/cursor.
  useEffect(() => {
    let idle: ReturnType<typeof setTimeout>
    const poke = () => {
      setHud(true)
      clearTimeout(idle)
      idle = setTimeout(() => setHud(false), 2500)
    }
    const onKey = (e: KeyboardEvent) => {
      poke()
      if (e.key === ' ' || e.key === 'k') {
        e.preventDefault()
        setPaused((p) => !p)
      } else if (e.key === 'ArrowRight' || e.key === 'n') setScene(null)
      else if (e.key === 'f') toggleFullscreen()
      else if (e.key === 'e') playFinale()
      else if (e.key === 'Escape' && !document.fullscreenElement) onExit()
    }
    poke()
    window.addEventListener('mousemove', poke)
    window.addEventListener('keydown', onKey)
    return () => {
      clearTimeout(idle)
      window.removeEventListener('mousemove', poke)
      window.removeEventListener('keydown', onKey)
    }
  }, [onExit, playFinale])

  const SceneView = scene && scene.kind !== 'title' && scene.kind !== 'finale' ? SCENES[scene.kind] : null

  return (
    <div className={`stage-bg fixed inset-0 overflow-hidden ${hud ? '' : 'hide-cursor'}`}>
      <AnimatePresence mode="wait" onExitComplete={onExitComplete}>
        {scene && (
          <motion.div key={scene.id} className="absolute inset-0" exit={{ opacity: 1 }}>
            {scene.kind === 'title' ? (
              <Title scene={scene} info={info} />
            ) : scene.kind === 'finale' ? (
              <Finale photos={scene.photos} years={info.years} />
            ) : (
              SceneView && <SceneView scene={scene} />
            )}
            {scene.lightLeak && <LightLeak seed={scene.seed} />}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="vignette pointer-events-none absolute inset-0 z-[70]" />
      <div className="pointer-events-none absolute inset-0 z-[70] overflow-hidden">
        <div className="grain absolute" />
      </div>

      <div
        className={`font-hand pointer-events-none absolute bottom-[2.2vh] left-[2.4vw] z-50 text-cream/35 transition-opacity duration-1000 ${scene?.kind === 'title' || scene?.kind === 'finale' ? 'opacity-0' : ''}`}
        style={{ fontSize: 'clamp(14px,1.5vw,28px)' }}
      >
        The Era of Jonathan Schauer
      </div>

      {error && (
        <div className="absolute inset-0 z-50 flex items-center justify-center text-center">
          <div className="rounded-2xl bg-night/90 p-8">
            <p className="text-xl">{error}</p>
            <button className="mt-4 rounded-full bg-gold px-5 py-2 text-night" onClick={onExit}>
              Choose another folder
            </button>
          </div>
        </div>
      )}

      <motion.div
        className="absolute right-[2vw] bottom-[2vh] z-[80] flex items-center gap-2 rounded-full bg-night/70 px-3 py-2 text-sm text-cream/90 backdrop-blur"
        animate={{ opacity: hud ? 1 : 0, y: hud ? 0 : 10 }}
        style={{ pointerEvents: hud ? 'auto' : 'none' }}
      >
        <HudButton label={paused ? 'Play (space)' : 'Pause (space)'} onClick={() => setPaused((p) => !p)}>
          {paused ? '▶' : '❚❚'}
        </HudButton>
        <HudButton label="Next (→)" onClick={() => setScene(null)}>
          ⏭
        </HudButton>
        <HudButton label="Play the finale next (e)" onClick={playFinale}>
          🎉
        </HudButton>
        <HudButton label="Fullscreen (f)" onClick={toggleFullscreen}>
          ⛶
        </HudButton>
        <span className="px-2 text-xs text-cream/60 tabular-nums">
          {scene ? scene.kind : '…'} · {director.size} photos
        </span>
        <HudButton label="Back to start (esc)" onClick={onExit}>
          ✕
        </HudButton>
      </motion.div>
      {paused && (
        <div className="font-hand absolute top-[3vh] right-[3vw] z-50 rounded-full bg-night/70 px-4 py-1 text-2xl text-gold">paused</div>
      )}
    </div>
  )
}

function HudButton({ children, label, onClick }: { children: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      title={label}
      aria-label={label}
      onClick={onClick}
      className="grid h-9 w-9 place-items-center rounded-full transition hover:bg-cream/15 focus-visible:outline-2 focus-visible:outline-gold"
    >
      {children}
    </button>
  )
}
