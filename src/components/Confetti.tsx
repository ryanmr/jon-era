import { motion } from 'motion/react'
import { useMemo, type CSSProperties } from 'react'
import { rng } from '../lib/director'

/** Confetti pieces falling through the title (pure CSS animation, cheap at 70 pieces). */
export function Confetti({ seed, count = 70 }: { seed: number; count?: number }) {
  const pieces = useMemo(() => {
    const r = rng(seed ^ 0x9e3779b9)
    const colors = ['#e8b35a', '#c4622d', '#f6eedf', '#5fb3a6', '#d9534f', '#f0c272']
    return Array.from({ length: count }, () => ({
      left: r.range(0, 100),
      w: r.range(6, 13),
      h: r.range(10, 22),
      color: r.pick(colors),
      duration: r.range(3.5, 7),
      delay: r.range(-6, 2.5),
      dx: r.range(-12, 12),
      rot: r.range(360, 1080) * r.sign(),
      round: r.next() < 0.3,
    }))
  }, [seed, count])
  return (
    <motion.div className="pointer-events-none absolute inset-0 overflow-hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.8 } }}>
      {pieces.map((p, i) => (
        <div
          key={i}
          className="confetti absolute top-0"
          style={
            {
              left: `${p.left}%`,
              width: p.w,
              height: p.round ? p.w : p.h,
              borderRadius: p.round ? '50%' : 2,
              background: p.color,
              animationDuration: `${p.duration}s`,
              animationDelay: `${p.delay}s`,
              '--dx': `${p.dx}vw`,
              '--rot': `${p.rot}deg`,
            } as CSSProperties
          }
        />
      ))}
    </motion.div>
  )
}
