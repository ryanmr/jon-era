import { motion } from 'motion/react'
import type { CSSProperties, ReactNode } from 'react'
import type { FilterName } from '../lib/director'
import { filterCss } from '../lib/display'
import type { Photo } from '../lib/prepare'

/** The orange '17 8 11 date print from old point-and-shoots. */
export function DateStamp({ photo, className = '' }: { photo: Photo; className?: string }) {
  if (!photo.date) return null
  const d = photo.date
  const text = `'${String(d.getFullYear()).slice(2)}  ${d.getMonth() + 1}  ${d.getDate()}`
  return <div className={`stamp pointer-events-none absolute text-[clamp(12px,1.6vw,26px)] ${className}`}>{text}</div>
}

export function Img({
  photo,
  filter = 'none',
  className = '',
  style,
  position = '50% 35%',
}: {
  photo: Photo
  filter?: FilterName
  className?: string
  style?: CSSProperties
  position?: string
}) {
  return (
    <img
      src={photo.url}
      alt=""
      draggable={false}
      className={`block h-full w-full object-cover ${className}`}
      style={{ filter: filterCss(filter), objectPosition: position, ...style }}
    />
  )
}

/** Full-bleed blurred version of the photo, so portrait shots never sit on a void. */
export function Backdrop({ photo, dim = 0.55 }: { photo: Photo; dim?: number }) {
  return (
    <motion.div
      className="absolute inset-0 overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1.2 }}
    >
      <img src={photo.tiny} alt="" className="absolute inset-0 h-full w-full scale-125 object-cover blur-2xl" />
      <div className="absolute inset-0" style={{ background: `rgba(16,10,6,${dim})` }} />
    </motion.div>
  )
}

export function Polaroid({
  photo,
  width,
  filter = 'none',
  captionText,
  square = true,
  imgStyle,
  children,
  className = '',
}: {
  photo: Photo
  width: number
  filter?: FilterName
  captionText?: string
  square?: boolean
  imgStyle?: CSSProperties
  children?: ReactNode
  className?: string
}) {
  const pad = width * 0.055
  const inner = width - pad * 2
  const imgH = square ? inner : Math.min(inner * (photo.h / photo.w), inner * 1.3)
  return (
    <div className={`polaroid relative ${className}`} style={{ width, padding: pad, paddingBottom: pad * 4.2 }}>
      <div className="relative overflow-hidden bg-black" style={{ height: imgH }}>
        <Img photo={photo} filter={filter} style={imgStyle} />
        <div className="pointer-events-none absolute inset-0 shadow-[inset_0_0_12px_rgba(0,0,0,.35)]" />
        {children}
      </div>
      {captionText && (
        <div
          className="font-hand absolute right-0 left-0 text-center text-ink/85"
          style={{ bottom: pad * 1.1, fontSize: Math.max(16, width * 0.085), lineHeight: 1 }}
        >
          {captionText}
        </div>
      )}
    </div>
  )
}

export function Tape({ style }: { style?: CSSProperties }) {
  return <div className="tape absolute z-10 h-[9%] w-[38%]" style={style} />
}

/** Drifting warm light leak, screen-blended over the whole scene. */
export function LightLeak({ seed }: { seed: number }) {
  const fromLeft = seed % 2 === 0
  return (
    <motion.div
      className="pointer-events-none absolute inset-0 z-30 mix-blend-screen"
      initial={{ opacity: 0 }}
      animate={{ opacity: [0, 0.85, 0.35, 0.7, 0] }}
      exit={{ opacity: 0 }}
      transition={{ duration: 6, times: [0, 0.2, 0.5, 0.7, 1], ease: 'easeInOut' }}
    >
      <motion.div
        className="absolute h-[120vh] w-[70vw] rounded-full blur-3xl"
        style={{
          background: 'radial-gradient(circle, rgba(255,120,40,.75), rgba(255,60,30,.25) 50%, transparent 70%)',
          top: '-20vh',
          left: fromLeft ? '-30vw' : '60vw',
        }}
        animate={{ x: fromLeft ? '25vw' : '-25vw', y: '8vh' }}
        transition={{ duration: 7, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute h-[60vh] w-[40vw] rounded-full blur-3xl"
        style={{
          background: 'radial-gradient(circle, rgba(255,210,120,.6), transparent 70%)',
          bottom: '-15vh',
          left: fromLeft ? '20vw' : '45vw',
        }}
        animate={{ x: fromLeft ? '15vw' : '-15vw' }}
        transition={{ duration: 7, ease: 'easeInOut' }}
      />
    </motion.div>
  )
}

/** Wraps a scene so AnimatePresence waits for every child exit, with a stage background. */
export function SceneFrame({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <motion.div className={`absolute inset-0 overflow-hidden ${className}`} initial={{ opacity: 1 }} exit={{ opacity: 1 }}>
      {children}
    </motion.div>
  )
}
