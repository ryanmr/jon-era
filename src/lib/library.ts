import { del, get, set } from 'idb-keyval'

export type MediaItem = {
  id: string
  name: string
  file: File
  date?: Date
}

const IMAGE_EXT = /\.(jpe?g|png|gif|webp|avif|heic|heif)$/i
const HANDLE_KEY = 'era-folder-handle'

/** Sniffs the ISO-BMFF `ftyp` box — exports often hand out JPEGs named .HEIC, and vice versa. */
export async function isHeic(f: File): Promise<boolean> {
  const head = new Uint8Array(await f.slice(0, 12).arrayBuffer())
  const box = String.fromCharCode(...head.slice(4, 8))
  const brand = String.fromCharCode(...head.slice(8, 12))
  return box === 'ftyp' && /^(hei[cfmsx]|hev[cmsx]|mif1|msf1)$/.test(brand)
}

/** Pulls YYYYMMDD out of names like 20170811_174439, IMG-20171007-WA0006, PXL_20210422_… */
export function dateFromName(name: string): Date | undefined {
  const m = name.match(/(?:^|\D)((?:19|20)\d{2})(\d{2})(\d{2})(?:\D|$)/)
  if (!m) return
  const [y, mo, d] = [+m[1], +m[2], +m[3]]
  if (mo < 1 || mo > 12 || d < 1 || d > 31) return
  return new Date(y, mo - 1, d)
}

export function buildLibrary(files: File[]): MediaItem[] {
  return files
    .filter((f) => IMAGE_EXT.test(f.name))
    .map((file) => ({ id: `${file.name}:${file.size}`, name: file.name, file, date: dateFromName(file.name) }))
}

async function walkHandle(dir: FileSystemDirectoryHandle, out: File[]) {
  for await (const entry of dir.values()) {
    if (entry.name.startsWith('.')) continue
    if (entry.kind === 'file') out.push(await entry.getFile())
    else await walkHandle(entry, out)
  }
  return out
}

export const canPickDirectory = () => typeof window.showDirectoryPicker === 'function'

export async function pickDirectory(): Promise<{ name: string; files: File[] }> {
  const handle = await window.showDirectoryPicker({ id: 'era-photos', mode: 'read' })
  await set(HANDLE_KEY, handle).catch(() => {})
  return { name: handle.name, files: await walkHandle(handle, []) }
}

export async function savedDirectoryName(): Promise<string | undefined> {
  try {
    const handle = await get<FileSystemDirectoryHandle>(HANDLE_KEY)
    return handle?.name
  } catch {
    return undefined
  }
}

/** Must be called from a user gesture: re-grants read permission on the remembered folder. */
export async function resumeDirectory(): Promise<{ name: string; files: File[] } | undefined> {
  const handle = await get<FileSystemDirectoryHandle>(HANDLE_KEY)
  if (!handle) return
  const perm = await handle.requestPermission({ mode: 'read' })
  if (perm !== 'granted') return
  try {
    return { name: handle.name, files: await walkHandle(handle, []) }
  } catch {
    await del(HANDLE_KEY)
    return
  }
}

function readEntries(reader: FileSystemDirectoryReader): Promise<FileSystemEntry[]> {
  return new Promise((resolve, reject) => reader.readEntries(resolve, reject))
}

async function walkEntry(entry: FileSystemEntry, out: File[]) {
  if (entry.name.startsWith('.')) return
  if (entry.isFile) {
    out.push(await new Promise<File>((res, rej) => (entry as FileSystemFileEntry).file(res, rej)))
  } else if (entry.isDirectory) {
    const reader = (entry as FileSystemDirectoryEntry).createReader()
    // readEntries returns batches; keep reading until empty.
    for (let batch = await readEntries(reader); batch.length; batch = await readEntries(reader)) {
      for (const child of batch) await walkEntry(child, out)
    }
  }
}

export async function filesFromDrop(dt: DataTransfer): Promise<{ name: string; files: File[] }> {
  const entries = [...dt.items].map((i) => i.webkitGetAsEntry()).filter((e): e is FileSystemEntry => !!e)
  const out: File[] = []
  for (const e of entries) await walkEntry(e, out)
  const name = entries.length === 1 && entries[0].isDirectory ? entries[0].name : `${out.length} files`
  return { name, files: out }
}
