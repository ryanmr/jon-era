import { useEffect, useState } from 'react'
import { FILTERS, type FilterName } from './director'
import type { Photo } from './prepare'

export function useViewport() {
  const [size, setSize] = useState({ w: window.innerWidth, h: window.innerHeight })
  useEffect(() => {
    const onResize = () => setSize({ w: window.innerWidth, h: window.innerHeight })
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])
  return size
}

/** Largest w×h with the photo's aspect that fits in maxW×maxH. */
export function fit(photo: Photo, maxW: number, maxH: number) {
  const scale = Math.min(maxW / photo.w, maxH / photo.h)
  return { w: Math.round(photo.w * scale), h: Math.round(photo.h * scale) }
}

export const isPortrait = (p: Photo) => p.h > p.w * 1.05

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const NO_DATE_CAPTIONS = ['a classic', 'iconic.', 'legendary', 'remember this?', "the good ol' days", 'core memory', 'an era.']

export function caption(p: Photo, seed = 0) {
  if (p.date) return `${MONTHS[p.date.getMonth()]} ${p.date.getFullYear()}`
  let hash = seed
  for (const ch of p.id) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0
  return NO_DATE_CAPTIONS[hash % NO_DATE_CAPTIONS.length]
}

export function filterCss(f: FilterName, extra = '') {
  return [FILTERS[f], extra].filter(Boolean).join(' ') || undefined
}

export function toggleFullscreen() {
  if (document.fullscreenElement) void document.exitFullscreen()
  else void document.documentElement.requestFullscreen?.().catch(() => {})
}
