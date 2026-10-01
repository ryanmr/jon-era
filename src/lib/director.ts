import type { MediaItem } from './library'
import { prepare, preparedPhotos, type Photo } from './prepare'

/** No photo may reappear within this window (when the library is big enough to allow it). */
export const NO_REPEAT_MS = 120_000

export const SINGLE_KINDS = ['kenburns', 'drop', 'develop', 'flip', 'spin', 'crt', 'tiles', 'sweep', 'year', 'shutter', 'magazine', 'vinyl', 'newspaper', 'puzzle', 'ascii', 'projector'] as const
export const COLLAGE_KINDS = ['scatter', 'mosaic', 'splits', 'filmstrip', 'booth', 'screens', 'carousel'] as const
export type SingleKind = (typeof SINGLE_KINDS)[number]
export type CollageKind = (typeof COLLAGE_KINDS)[number]
export type SceneKind = 'title' | 'finale' | SingleKind | CollageKind

export const FILTERS = {
  none: undefined,
  warm: 'sepia(.25) saturate(1.25) contrast(1.05) brightness(1.04)',
  bw: 'grayscale(1) contrast(1.18) brightness(1.03)',
  faded: 'contrast(.86) saturate(.72) brightness(1.1) sepia(.18)',
  punch: 'contrast(1.22) saturate(1.4)',
  sepia: 'sepia(.85) contrast(1.06) brightness(1.02)',
  dream: 'saturate(1.3) brightness(1.08) contrast(.92) hue-rotate(-8deg)',
} as const
export type FilterName = keyof typeof FILTERS

export type Scene = {
  id: number
  kind: SceneKind
  photos: Photo[]
  duration: number
  filter: FilterName
  lightLeak: boolean
  seed: number
}

const COLLAGE_COUNT: Record<CollageKind, [number, number]> = {
  scatter: [3, 6],
  mosaic: [4, 6],
  splits: [2, 4],
  filmstrip: [5, 7],
  booth: [4, 8],
  screens: [4, 6],
  carousel: [5, 7],
}

const DURATION: Partial<Record<SceneKind, number>> = {
  title: 6500,
  finale: 15000,
  develop: 8000,
  puzzle: 8500,
  ascii: 8500,
  newspaper: 7500,
  tiles: 8000,
  scatter: 9000,
  mosaic: 8500,
  filmstrip: 9500,
  booth: 8500,
  screens: 8500,
  carousel: 9500,
}

/** The title card returns every 10–14 scenes. */
const TITLE_GAP: [number, number] = [10, 14]
const COLLAGE_CHANCE = 0.4
/** The finale never comes back within this window (measured from show start for the first one). */
const FINALE_GAP_MS = NO_REPEAT_MS + 5000
/** Once the finale is allowed again, the chance any given scene is the finale. */
const FINALE_CHANCE = 0.25

const pick = <T,>(xs: readonly T[]) => xs[Math.floor(Math.random() * xs.length)]
const randInt = (lo: number, hi: number) => lo + Math.floor(Math.random() * (hi - lo + 1))

function pickFilter(): FilterName {
  const r = Math.random()
  if (r < 0.5) return 'none'
  return pick(['warm', 'bw', 'faded', 'punch', 'sepia', 'dream'] as const)
}

export class Director {
  private lastShown = new Map<string, number>()
  private broken = new Set<string>()
  private count = 0
  private nextTitleAt = 0
  private firstShowAt?: number
  private lastFinaleAt?: number
  private finaleRequested = false
  private recentKinds: SceneKind[] = []

  private items: MediaItem[]

  constructor(items: MediaItem[]) {
    this.items = items
  }

  /**
   * Picks n photos nobody has seen in the last NO_REPEAT_MS, preferring never-shown ones so
   * the whole folder cycles before anything repeats. Only if the folder is too small does it
   * fall back to the least-recently-shown photos.
   */
  private pickPhotos(n: number, at: number): MediaItem[] {
    const pool = this.items.filter((i) => !this.broken.has(i.id))
    const keyed = pool.map((item) => {
      const last = this.lastShown.get(item.id)
      // Never-shown items sort first in random order; shown ones by age with a little jitter.
      const key = last === undefined ? -1e15 * Math.random() - 1 : last + Math.random() * 30_000
      return { item, last, key }
    })
    keyed.sort((a, b) => a.key - b.key)
    // Scene start times are estimates (exit + gap jitter), so keep a few seconds of slack.
    const fresh = keyed.filter((k) => k.last === undefined || at - k.last >= NO_REPEAT_MS + 5000)
    const stale = keyed.filter((k) => !fresh.includes(k))
    const chosen = [...fresh, ...stale].slice(0, n).map((k) => k.item)
    for (const item of chosen) this.lastShown.set(item.id, at)
    return chosen
  }

  /** Makes the next planned scene the finale (the E key), regardless of the usual spacing. */
  requestFinale() {
    this.finaleRequested = true
  }

  private pickKind(at: number): SceneKind {
    if (import.meta.env.DEV) {
      // Dev-only: `window.__eraForce = 'tiles'` pins the scene type for previewing effects.
      const forced = (window as unknown as { __eraForce?: SceneKind }).__eraForce
      if (forced) return forced
    }
    if (this.finaleRequested) return 'finale'
    if (this.count >= this.nextTitleAt) return 'title'
    const sinceFinale = at - (this.lastFinaleAt ?? this.firstShowAt ?? at)
    if (sinceFinale >= FINALE_GAP_MS && this.recentKinds[0] !== 'title' && Math.random() < FINALE_CHANCE) return 'finale'
    const usable = this.items.length - this.broken.size
    const collage = usable >= 3 && Math.random() < COLLAGE_CHANCE
    const options: readonly SceneKind[] = collage ? COLLAGE_KINDS : SINGLE_KINDS
    const avoid = new Set(this.recentKinds)
    return pick(options.filter((k) => !avoid.has(k)))
  }

  /** Plans and fully decodes the next scene; `showAt` is when it is expected on screen. */
  async next(showAt: number): Promise<Scene> {
    this.firstShowAt ??= showAt
    for (let attempt = 0; attempt < 8; attempt++) {
      const kind = this.pickKind(showAt)
      if (kind === 'finale') {
        // The finale uses every photo as a tiny mosaic tile, so it sits outside the no-repeat rule.
        const photos = await preparedPhotos(
          this.items.filter((i) => !this.broken.has(i.id)),
          2500,
        )
        this.finaleRequested = false
        if (!photos.length) continue
        this.lastFinaleAt = showAt
        this.count++
        this.recentKinds = [kind, ...this.recentKinds].slice(0, 3)
        return { id: this.count, kind, photos, duration: DURATION.finale!, filter: 'none', lightLeak: false, seed: Math.floor(Math.random() * 2 ** 31) }
      }
      let n = 1
      if (kind === 'title') n = 0
      else if (kind in COLLAGE_COUNT) {
        const [lo, hi] = COLLAGE_COUNT[kind as CollageKind]
        n = kind === 'booth' ? pick([4, 6, 8]) : randInt(lo, hi)
        n = Math.min(n, this.items.length - this.broken.size)
      }
      const items = this.pickPhotos(n, showAt)
      const results = await Promise.allSettled(items.map(prepare))
      const failed = items.filter((_, i) => results[i].status === 'rejected')
      if (failed.length) {
        failed.forEach((f) => this.broken.add(f.id))
        console.warn('Skipping unreadable photos:', failed.map((f) => f.name))
        continue
      }
      if (kind === 'title') this.nextTitleAt = this.count + randInt(...TITLE_GAP)
      this.count++
      this.recentKinds = [kind, ...this.recentKinds].slice(0, 3)
      const filterless = kind === 'develop' || kind === 'sweep' || kind === 'title' || kind === 'newspaper'
      return {
        id: this.count,
        kind,
        photos: results.map((r) => (r as PromiseFulfilledResult<Photo>).value),
        duration: DURATION[kind] ?? 7000,
        filter: filterless ? 'none' : pickFilter(),
        lightLeak: kind !== 'title' && Math.random() < 0.3,
        seed: Math.floor(Math.random() * 2 ** 31),
      }
    }
    throw new Error('Could not read any photos in this folder')
  }

  get size() {
    return this.items.length - this.broken.size
  }
}

/** Small deterministic RNG so a scene's random layout is stable across re-renders. */
export function rng(seed: number) {
  let a = seed >>> 0
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
  return {
    next,
    range: (lo: number, hi: number) => lo + next() * (hi - lo),
    int: (lo: number, hi: number) => lo + Math.floor(next() * (hi - lo + 1)),
    pick: <T,>(xs: readonly T[]) => xs[Math.floor(next() * xs.length)],
    sign: () => (next() < 0.5 ? -1 : 1),
  }
}
export type Rng = ReturnType<typeof rng>
