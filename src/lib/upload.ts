import type { Bindings } from '../types'

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-matroska']

export const MAX_IMAGE_BYTES = 8 * 1024 * 1024 // 8MB
export const MAX_VIDEO_BYTES = 25 * 1024 * 1024 // 25MB

export type UploadResult = { key: string; mediaType: 'image' | 'video' } | { error: string }

function extFromType(type: string): string {
  const map: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/gif': 'gif',
    'video/mp4': 'mp4',
    'video/webm': 'webm',
    'video/quicktime': 'mov',
    'video/x-matroska': 'mkv',
  }
  return map[type] || 'bin'
}

function randomId(): string {
  return crypto.getRandomValues(new Uint32Array(4)).join('')
}

export async function storeMedia(
  r2: R2Bucket,
  file: File,
  folder: string
): Promise<UploadResult> {
  const type = file.type
  const isImage = IMAGE_TYPES.includes(type)
  const isVideo = VIDEO_TYPES.includes(type)

  if (!isImage && !isVideo) {
    return { error: 'Sirf image (jpg/png/webp/gif) ya video (mp4/webm/mov/mkv) allowed hai.' }
  }
  if (isImage && file.size > MAX_IMAGE_BYTES) {
    return { error: 'Image size 8MB se zyada nahi honi chahiye.' }
  }
  if (isVideo && file.size > MAX_VIDEO_BYTES) {
    return { error: 'Video size 25MB se zyada nahi honi chahiye.' }
  }
  if (file.size === 0) {
    return { error: 'File khaali hai, dobara try karo.' }
  }

  const ext = extFromType(type)
  const key = `${folder}/${Date.now()}-${randomId()}.${ext}`
  const buf = await file.arrayBuffer()
  await r2.put(key, buf, { httpMetadata: { contentType: type } })

  return { key, mediaType: isImage ? 'image' : 'video' }
}

export async function storeAvatar(r2: R2Bucket, file: File): Promise<UploadResult> {
  const type = file.type
  if (!IMAGE_TYPES.includes(type)) {
    return { error: 'DP ke liye sirf image (jpg/png/webp/gif) allowed hai.' }
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return { error: 'DP image size 8MB se zyada nahi honi chahiye.' }
  }
  if (file.size === 0) {
    return { error: 'File khaali hai, dobara try karo.' }
  }
  const ext = extFromType(type)
  const key = `avatars/${Date.now()}-${randomId()}.${ext}`
  const buf = await file.arrayBuffer()
  await r2.put(key, buf, { httpMetadata: { contentType: type } })
  return { key, mediaType: 'image' }
}

export async function deleteMedia(r2: R2Bucket, key: string | null | undefined) {
  if (!key) return
  try {
    await r2.delete(key)
  } catch {
    // ignore
  }
}
