import { motion } from 'motion/react'
import { useEffect, useRef, useState, type DragEvent } from 'react'
import { Stage } from './components/Stage'
import { toggleFullscreen } from './lib/display'
import {
  buildLibrary,
  canPickDirectory,
  filesFromDrop,
  pickDirectory,
  resumeDirectory,
  savedDirectoryName,
  type MediaItem,
} from './lib/library'
import type { ShowInfo } from './scenes/Title'

type Loaded = { name: string; items: MediaItem[]; info: ShowInfo }

function load(name: string, files: File[]): Loaded {
  const items = buildLibrary(files)
  const years = items.map((i) => i.date?.getFullYear()).filter((y): y is number => !!y)
  return {
    name,
    items,
    info: { count: items.length, years: years.length ? [Math.min(...years), Math.max(...years)] : undefined },
  }
}

export default function App() {
  const [loaded, setLoaded] = useState<Loaded>()
  const [playing, setPlaying] = useState(false)
  const [saved, setSaved] = useState<string>()
  const [busy, setBusy] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [error, setError] = useState<string>()
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    void savedDirectoryName().then(setSaved)
  }, [])

  const accept = (name: string, files: File[]) => {
    const l = load(name, files)
    if (!l.items.length) {
      setError(`No photos found in “${name}”.`)
      return
    }
    setError(undefined)
    setLoaded(l)
  }

  useEffect(() => {
    if (!import.meta.env.DEV) return
    // Lets browser automation load photos without a native folder picker.
    ;(window as unknown as { __eraLoad: (name: string, files: File[]) => void }).__eraLoad = (name, files) => setLoaded(load(name, files))
  }, [])

  const run = async (fn: () => Promise<{ name: string; files: File[] } | undefined>) => {
    setBusy(true)
    try {
      const res = await fn()
      if (res) accept(res.name, res.files)
    } catch (e) {
      if ((e as Error).name !== 'AbortError') setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  const choose = () => {
    if (canPickDirectory()) void run(pickDirectory)
    else inputRef.current?.click()
  }

  const onDrop = (e: DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const dt = e.dataTransfer
    void run(() => filesFromDrop(dt))
  }

  const start = () => {
    if (!document.fullscreenElement) toggleFullscreen()
    setPlaying(true)
  }

  if (loaded && playing) return <Stage items={loaded.items} info={loaded.info} onExit={() => setPlaying(false)} />

  return (
    <div
      className={`stage-bg relative flex min-h-full flex-col items-center justify-center overflow-hidden px-4 text-center transition ${dragging ? 'brightness-125' : ''}`}
      onDragOver={(e) => {
        e.preventDefault()
        setDragging(true)
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
    >
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-40">
        <div className="sunburst h-[220vmax] w-[220vmax] shrink-0" />
      </div>
      <div className="pointer-events-none absolute inset-0" style={{ background: 'radial-gradient(circle, transparent 10%, #140d09 70%)' }} />

      <motion.div className="relative" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1 }}>
        <div className="font-hand -rotate-3 text-gold" style={{ fontSize: 'clamp(30px,5vw,90px)', lineHeight: 1 }}>
          The Era of
        </div>
        <h1 className="font-display font-black text-cream" style={{ fontSize: 'clamp(44px,10vw,200px)', lineHeight: 0.92, fontVariationSettings: '"SOFT" 100, "WONK" 1' }}>
          Jonathan
          <br />
          Schauer
        </h1>
      </motion.div>

      <motion.div
        className="relative mt-[6vh] flex w-full max-w-md flex-col items-center gap-3"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        {loaded ? (
          <>
            <p className="font-hand text-2xl text-gold">
              {loaded.items.length} photos from “{loaded.name}”{loaded.info.years && ` · ${loaded.info.years[0]}–${loaded.info.years[1]}`}
            </p>
            <button
              onClick={start}
              className="w-full rounded-full bg-gold px-8 py-4 text-xl font-semibold text-night shadow-[0_10px_40px_rgba(232,179,90,.35)] transition hover:scale-[1.03] hover:bg-[#f0c272] active:scale-100"
            >
              Start the show
            </button>
            <button onClick={choose} className="text-sm text-cream/60 underline-offset-4 hover:text-cream hover:underline">
              Use a different folder
            </button>
          </>
        ) : (
          <>
            {saved && canPickDirectory() && (
              <button
                disabled={busy}
                onClick={() => void run(resumeDirectory)}
                className="w-full rounded-full bg-gold px-8 py-4 text-lg font-semibold text-night transition hover:scale-[1.03] hover:bg-[#f0c272] disabled:opacity-60"
              >
                Use “{saved}” again
              </button>
            )}
            <button
              disabled={busy}
              onClick={choose}
              className={`w-full rounded-full px-8 py-4 text-lg font-semibold transition hover:scale-[1.03] disabled:opacity-60 ${
                saved && canPickDirectory() ? 'border border-cream/30 text-cream hover:bg-cream/10' : 'bg-gold text-night hover:bg-[#f0c272]'
              }`}
            >
              {busy ? 'Reading photos…' : 'Choose the photo folder'}
            </button>
            <p className="text-sm text-cream/50">…or drag the folder anywhere onto this page</p>
          </>
        )}
        {error && <p className="text-sm text-rust">{error}</p>}
        <p className="mt-6 text-xs text-cream/35">Space pauses · → skips · F toggles fullscreen · Esc returns here</p>
      </motion.div>

      <input
        ref={inputRef}
        type="file"
        className="hidden"
        multiple
        // @ts-expect-error non-standard but universally supported folder picking
        webkitdirectory=""
        onChange={(e) => {
          const files = [...(e.target.files ?? [])]
          const name = files[0]?.webkitRelativePath.split('/')[0] || 'photos'
          if (files.length) accept(name, files)
          e.target.value = ''
        }}
      />
    </div>
  )
}
