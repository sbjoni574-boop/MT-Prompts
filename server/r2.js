// Minimal Cloudflare R2-compatible wrapper backed by the local filesystem.
// Implements only the subset of the R2Bucket API used by src/lib/upload.ts
// and src/index.tsx's /media/* route, so that code runs unmodified on Render.

import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import { Readable } from 'stream'

const fsp = fs.promises

export function createLocalR2(rootDir) {
  if (!fs.existsSync(rootDir)) fs.mkdirSync(rootDir, { recursive: true })

  function safePath(key) {
    // Prevent path traversal outside rootDir
    const resolved = path.normalize(path.join(rootDir, key))
    if (!resolved.startsWith(path.normalize(rootDir))) {
      throw new Error('Invalid object key')
    }
    return resolved
  }

  function metaPath(filePath) {
    return filePath + '.meta.json'
  }

  return {
    async put(key, data, options = {}) {
      const filePath = safePath(key)
      const dir = path.dirname(filePath)
      await fsp.mkdir(dir, { recursive: true })

      let buf
      if (Buffer.isBuffer(data)) {
        buf = data
      } else if (data instanceof ArrayBuffer) {
        buf = Buffer.from(data)
      } else if (ArrayBuffer.isView(data)) {
        buf = Buffer.from(data.buffer, data.byteOffset, data.byteLength)
      } else {
        buf = Buffer.from(await new Response(data).arrayBuffer())
      }

      await fsp.writeFile(filePath, buf)

      const contentType = options?.httpMetadata?.contentType || 'application/octet-stream'
      const etag = crypto.createHash('md5').update(buf).digest('hex')
      await fsp.writeFile(metaPath(filePath), JSON.stringify({ contentType, etag }))

      return { key }
    },

    async get(key) {
      const filePath = safePath(key)
      if (!fs.existsSync(filePath)) return null

      let meta = { contentType: 'application/octet-stream', etag: '' }
      try {
        meta = JSON.parse(await fsp.readFile(metaPath(filePath), 'utf-8'))
      } catch {
        // no metadata file, fall back to defaults
      }

      const body = Readable.toWeb(fs.createReadStream(filePath))

      return {
        body,
        httpEtag: meta.etag ? `"${meta.etag}"` : '',
        writeHttpMetadata(headers) {
          headers.set('Content-Type', meta.contentType)
        },
      }
    },

    async delete(key) {
      const filePath = safePath(key)
      try {
        await fsp.unlink(filePath)
      } catch {
        // ignore missing file
      }
      try {
        await fsp.unlink(metaPath(filePath))
      } catch {
        // ignore missing meta
      }
    },
  }
}
