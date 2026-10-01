import { motion, type TargetAndTransition, type Transition } from 'motion/react'
import { useMemo } from 'react'
import { rng, type Rng } from '../lib/director'
import { Confetti } from '../components/Confetti'
import { LightLeak, SceneFrame } from '../components/shared'
import type { SceneProps } from './singles'

export type ShowInfo = { years?: [number, number]; count: number }

const NAME = ['Jonathan', 'Schauer']
const LETTER_COUNT = NAME.join('').length
const CENTER = (LETTER_COUNT - 1) / 2
const easeIn = [0.55, 0, 0.85, 0.35] as const

// The wobble pop-in and gravity fall-out are the favourites, so they're weighted up.
const ENTRANCES = ['pop', 'pop', 'pop', 'drop', 'flip', 'scatter', 'zoom', 'wave', 'typewriter'] as const
const EXITS = ['fall', 'fall', 'fall', 'explode', 'blow', 'shrink', 'rise'] as const
const BACKDROPS = ['sunburst', 'confetti', 'both'] as const
type Entrance = (typeof ENTRANCES)[number]
type Exit = (typeof EXITS)[number]

type LetterPlan = { enter: TargetAndTransition; enterT: Transition; exit: TargetAndTransition }

function planLetter(i: number, entrance: Entrance, exit: Exit, r: Rng): LetterPlan {
  const rot = r.range(-60, 60)
  const enter: Record<Entrance, [TargetAndTransition, Transition]> = {
    pop: [{ scale: 0, opacity: 0, rotate: rot / 2 }, { duration: 0.7, delay: 0.6 + i * 0.06, ease: [0.2, 0.9, 0.3, 1.45] }],
    drop: [{ y: '-80vh', rotate: rot, opacity: 0 }, { type: 'spring', stiffness: 90, damping: 10, delay: 0.6 + i * 0.07 }],
    flip: [{ rotateX: -100, opacity: 0, y: 30 }, { duration: 0.7, delay: 0.6 + i * 0.06, ease: [0.2, 0.9, 0.3, 1.3] }],
    scatter: [
      { x: `${r.range(-90, 90)}vw`, y: `${r.range(-90, 90)}vh`, rotate: r.range(-540, 540), scale: r.range(0.3, 2), opacity: 0 },
      { type: 'spring', stiffness: 45, damping: 12, delay: 0.3 + r.range(0, 0.8) },
    ],
    zoom: [{ scale: 6, opacity: 0, filter: 'blur(18px)' }, { duration: 0.55, delay: 0.5 + i * 0.08, ease: [0.3, 0, 0.2, 1] }],
    wave: [{ y: '70vh', opacity: 0, rotate: r.range(-20, 20) }, { type: 'spring', stiffness: 120, damping: 14, delay: 0.5 + i * 0.05 }],
    typewriter: [{ opacity: 0, scale: 1.5 }, { duration: 0.12, delay: 0.6 + i * 0.11 }],
  }
  const t = (delay: number, duration = 1): Transition => ({ duration, delay, ease: easeIn })
  const exits: Record<Exit, TargetAndTransition> = {
    fall: { y: '110vh', rotate: r.range(-90, 90), transition: t(r.range(0, 0.35)) },
    explode: {
      x: `${(i - CENTER) * r.range(6, 14)}vw`,
      y: `${r.range(-90, 90)}vh`,
      rotate: r.range(-540, 540),
      scale: r.range(0.4, 2.2),
      opacity: 0,
      transition: { duration: 0.9, delay: r.range(0, 0.12), ease: [0.2, 0.6, 0.4, 1] },
    },
    blow: { x: '140vw', y: `${r.range(-35, 15)}vh`, rotate: r.range(120, 420), transition: t((LETTER_COUNT - 1 - i) * 0.035, 1.1) },
    shrink: { scale: 0, rotate: r.sign() * 360, opacity: 0, transition: t(Math.abs(i - CENTER) * 0.05, 0.6) },
    rise: { y: '-115vh', rotate: r.range(-30, 30), transition: t(r.range(0, 0.5), 1.4) },
  }
  const [from, enterT] = enter[entrance]
  return { enter: from, enterT, exit: exits[exit] }
}

export function Title({ scene, info }: SceneProps & { info: ShowInfo }) {
  const plan = useMemo(() => {
    const r = rng(scene.seed)
    const entrance = r.pick(ENTRANCES)
    const exit = r.pick(EXITS)
    return {
      entrance,
      exit,
      backdrop: r.pick(BACKDROPS),
      writeOn: r.next() < 0.5,
      letters: Array.from({ length: LETTER_COUNT }, (_, i) => planLetter(i, entrance, exit, r)),
    }
  }, [scene.seed])

  const settled = { x: 0, y: 0, rotate: 0, rotateX: 0, scale: 1, opacity: 1, filter: 'blur(0px)' }
  let li = 0
  return (
    <SceneFrame>
      {plan.backdrop !== 'confetti' && (
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.6 }}
          exit={{ opacity: 0, transition: { duration: 0.9 } }}
          transition={{ duration: 2 }}
        >
          <div className="sunburst h-[220vmax] w-[220vmax] shrink-0" />
        </motion.div>
      )}
      <div className="absolute inset-0" style={{ background: 'radial-gradient(circle, transparent 10%, #140d09 70%)' }} />
      {plan.backdrop !== 'sunburst' && <Confetti seed={scene.seed} />}
      <LightLeak seed={scene.seed} />

      <div className="absolute inset-0 flex flex-col items-center justify-center text-center" style={{ perspective: 900 }}>
        <motion.div
          className="font-hand text-gold"
          style={{ fontSize: 'clamp(32px, 6vw, 120px)', lineHeight: 1.1, padding: '0.1em 0.3em' }}
          initial={plan.writeOn ? { clipPath: 'inset(0 100% 0 0)', rotate: -4 } : { opacity: 0, y: -20, rotate: -4 }}
          animate={plan.writeOn ? { clipPath: 'inset(0 0% 0 0)', rotate: -4 } : { opacity: 1, y: 0, rotate: -4 }}
          exit={{ opacity: 0, y: -40, transition: { duration: 0.6 } }}
          transition={{ duration: plan.writeOn ? 1.3 : 1, delay: 0.2, ease: 'easeInOut' }}
        >
          The Era of
        </motion.div>
        {NAME.map((word) => (
          <div key={word} className="font-display flex font-black text-cream" style={{ fontSize: 'clamp(48px, 12vw, 260px)', lineHeight: 0.92 }}>
            {word.split('').map((ch) => {
              const i = li++
              const l = plan.letters[i]
              return (
                <motion.span
                  key={i}
                  className="inline-block drop-shadow-[0_10px_30px_rgba(0,0,0,.6)]"
                  style={{ fontVariationSettings: '"SOFT" 100, "WONK" 1' }}
                  initial={l.enter}
                  animate={settled}
                  exit={l.exit}
                  transition={l.enterT}
                >
                  {plan.entrance === 'wave' ? (
                    // keep bobbing gently once the wave has landed
                    <motion.span
                      className="inline-block"
                      animate={{ y: [0, -14, 0] }}
                      transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut', delay: 1.5 + i * 0.1 }}
                    >
                      {ch}
                    </motion.span>
                  ) : (
                    ch
                  )}
                </motion.span>
              )
            })}
          </div>
        ))}
        <motion.div
          className="mt-[3vh] flex items-center gap-[2vw] text-gold/80"
          style={{ fontSize: 'clamp(14px, 1.8vw, 34px)', letterSpacing: '0.3em' }}
          initial={{ opacity: 0, scaleX: 0.6 }}
          animate={{ opacity: 1, scaleX: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.5 } }}
          transition={{ duration: 1.2, delay: plan.entrance === 'typewriter' ? 2.6 : 2.2 }}
        >
          <span className="h-px w-[8vw] bg-gold/60" />
          <span className="font-display uppercase">{info.years ? `${info.years[0]} — ${info.years[1]}` : 'A Retrospective'}</span>
          <span className="h-px w-[8vw] bg-gold/60" />
        </motion.div>
      </div>
    </SceneFrame>
  )
}
