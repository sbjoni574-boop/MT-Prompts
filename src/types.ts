// --- Minimal local stand-ins for the Cloudflare D1 / R2 types ---------------
// This app originally targeted Cloudflare Workers (D1 + R2 bindings). It now
// runs on plain Node.js (e.g. Render) via server/db.js and server/r2.js,
// which implement this same small surface area on top of better-sqlite3 and
// the local filesystem. Declaring the shapes locally keeps src/ unchanged
// and avoids depending on @cloudflare/workers-types.

export interface D1Result<T = unknown> {
  results: T[]
  success: boolean
}

export interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement
  first<T = Record<string, unknown>>(colName?: string): Promise<T | null>
  all<T = Record<string, unknown>>(): Promise<D1Result<T>>
  run(): Promise<{ success: boolean; meta: { last_row_id: number | bigint; changes: number } }>
}

export interface D1Database {
  prepare(sql: string): D1PreparedStatement
}

export interface R2HTTPMetadata {
  contentType?: string
}

export interface R2PutOptions {
  httpMetadata?: R2HTTPMetadata
}

export interface R2Object {
  body: ReadableStream
  httpEtag: string
  writeHttpMetadata(headers: Headers): void
}

export interface R2Bucket {
  put(key: string, data: ArrayBuffer | ArrayBufferView | Buffer, options?: R2PutOptions): Promise<unknown>
  get(key: string): Promise<R2Object | null>
  delete(key: string): Promise<void>
}

export type Bindings = {
  DB: D1Database
  R2: R2Bucket
}

export type AppUser = {
  id: number
  name: string
  mobile: string
  role: 'user' | 'admin'
  avatar_key: string | null
  bio: string | null
  kyc_status: 'none' | 'pending' | 'approved' | 'rejected'
  created_at: string
}

export type PromptRow = {
  id: number
  user_id: number
  title: string
  prompt_text: string
  prompt_type: 'image' | 'video'
  category: string | null
  media_key: string
  media_type: 'image' | 'video'
  is_admin_post: number
  status: 'published' | 'hidden'
  views: number
  created_at: string
  author_name?: string
}

export type KycRow = {
  id: number
  user_id: number
  full_name: string
  mobile_number: string
  tiktok_id: string
  dob: string
  status: 'pending' | 'approved' | 'rejected'
  admin_note: string | null
  created_at: string
  reviewed_at: string | null
  user_name?: string
  user_mobile?: string
}

export type Env = {
  Bindings: Bindings
  Variables: {
    user: AppUser | null
  }
}
