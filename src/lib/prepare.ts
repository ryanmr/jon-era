import exifr from 'exifr'
import { isHeic, type MediaItem } from './library'

/** A display-ready photo: downscaled blob URL, its true size, and a tiny blur placeholder. */
export type Photo = {
  id: string
  name: string
  url: string
  w: number
  h: number
  tiny: string
  /** ~240px version for mosaics with hundreds of tiles. */
  thumb: string
  date?: Date
}

const MAX_EDGE = 2400
const cache = new Map<string, Promise<Photo>>()
const ready = new Map<string, Photo>()

function loadImage(src: string): Promise<HTMLImageElement> {
  const img = new Image()
  img.decoding = 'async'
  img.src = src
  return img.decode().then(() => img)
}

function toBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((res, rej) => canvas.toBlob((b) => (b ? res(b) : rej(new Error('toBlob failed'))), 'image/jpeg', 0.88))
}

async function build(item: MediaItem): Promise<Photo> {
  let blob: Blob = item.file
  if (await isHeic(item.file)) {
    const { heicTo } = await import('heic-to')
    blob = await heicTo({ blob, type: 'image/jpeg', quality: 0.92 })
  }
  const tempUrl = URL.createObjectURL(blob)
  const img = await loadImage(tempUrl) // drawImage honours EXIF orientation in modern browsers
  const [source, sw, sh] = [img, img.naturalWidth, img.naturalHeight]

  const scale = Math.min(1, MAX_EDGE / Math.max(sw, sh))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(sw * scale)
  canvas.height = Math.round(sh * scale)
  canvas.getContext('2d')!.drawImage(source, 0, 0, canvas.width, canvas.height)
  const url = URL.createObjectURL(await toBlob(canvas))

  const tinyCanvas = document.createElement('canvas')
  const ts = 32 / Math.max(sw, sh)
  tinyCanvas.width = Math.max(1, Math.round(sw * ts))
  tinyCanvas.height = Math.max(1, Math.round(sh * ts))
  tinyCanvas.getContext('2d')!.drawImage(canvas, 0, 0, tinyCanvas.width, tinyCanvas.height)
  const tiny = tinyCanvas.toDataURL('image/jpeg', 0.7)

  const thumbCanvas = document.createElement('canvas')
  const th = Math.min(1, 240 / Math.max(sw, sh))
  thumbCanvas.width = Math.max(1, Math.round(sw * th))
  thumbCanvas.height = Math.max(1, Math.round(sh * th))
  thumbCanvas.getContext('2d')!.drawImage(canvas, 0, 0, thumbCanvas.width, thumbCanvas.height)
  const thumb = URL.createObjectURL(await toBlob(thumbCanvas))

  URL.revokeObjectURL(tempUrl)

  let date = item.date
  if (!date) {
    try {
      const exif = await exifr.parse(item.file, ['DateTimeOriginal', 'CreateDate'])
      const d = exif?.DateTimeOriginal ?? exif?.CreateDate
      if (d instanceof Date && !isNaN(+d)) date = d
    } catch {
      /* no EXIF — fine */
    }
  }
  return {
    id: item.id,
    name: item.name,
    url,
    w: canvas.width,
    h: canvas.height,
    tiny,
    thumb,
    date,
  }
}

export function prepare(item: MediaItem): Promise<Photo> {
  let p = cache.get(item.id)
  if (!p) {
    p = build(item)
    p.then(
      (photo) => ready.set(item.id, photo),
      () => cache.delete(item.id),
    )
    cache.set(item.id, p)
  }
  return p
}

export const isPrepared = (id: string) => cache.has(id)

/** Quietly converts everything in the background so later scenes start instantly. */
export async function warmAll(items: MediaItem[], signal: { stopped: boolean }) {
  for (const item of items) {
    if (signal.stopped) return
    if (isPrepared(item.id)) continue
    await prepare(item).catch(() => {})
    await new Promise((r) => setTimeout(r, 30))
  }
}

/** Every photo that is ready, waiting up to `waitMs` for the rest to finish converting. */
export async function preparedPhotos(items: MediaItem[], waitMs: number): Promise<Photo[]> {
  const all = Promise.allSettled(items.map(prepare))
  await Promise.race([all, new Promise((r) => setTimeout(r, waitMs))])
  return items.map((i) => ready.get(i.id)).filter((p): p is Photo => !!p)
}
