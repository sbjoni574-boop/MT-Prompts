import { Hono } from 'hono'
import { renderer } from './renderer'
import type { Env } from './types'
import { loadUser, requireAuth, requireAdmin, requireApprovedKyc } from './lib/middleware'
import {
  hashPassword,
  verifyPassword,
  createSession,
  destroySession,
  setSessionCookie,
  clearSessionCookie,
  getSessionToken,
  isValidMobile,
  isAdult,
} from './lib/auth'
import { storeMedia, storeAvatar, deleteMedia } from './lib/upload'

import { HomePage } from './views/home'
import { PromptDetailPage } from './views/prompt_detail'
import { LoginPage, RegisterPage } from './views/auth'
import { SetupAdminPage } from './views/setup'
import { ProfilePage, ProfileEditPage } from './views/profile'
import { KycFormPage, KycStatusPage } from './views/kyc'
import { SubmitPromptPage } from './views/submit_prompt'
import {
  AdminDashboard,
  AdminKycListPage,
  AdminPromptsPage,
  AdminUsersPage,
  AdminAddPromptPage,
} from './views/admin'

import type { PromptRow, KycRow, AppUser } from './types'

const app = new Hono<Env>()

app.use(renderer)
app.use(loadUser)

// ---------------------------------------------------------------------------
// Media serving from R2
// ---------------------------------------------------------------------------
app.get('/media/*', async (c) => {
  const key = c.req.path.replace(/^\/media\//, '')
  const obj = await c.env.R2.get(key)
  if (!obj) return c.text('Not found', 404)
  const headers = new Headers()
  obj.writeHttpMetadata(headers)
  headers.set('etag', obj.httpEtag)
  headers.set('Cache-Control', 'public, max-age=31536000, immutable')
  return new Response(obj.body, { headers })
})

// ---------------------------------------------------------------------------
// Public: Home / Explore / Prompt detail
// ---------------------------------------------------------------------------
app.get('/', async (c) => {
  const { results } = await c.env.DB.prepare(
    `SELECT p.*, u.name as author_name FROM prompts p
     JOIN users u ON u.id = p.user_id
     WHERE p.status = 'published'
     ORDER BY p.created_at DESC LIMIT 60`
  ).all<PromptRow>()
  return c.render(<HomePage prompts={results ?? []} activeType="all" />)
})

app.get('/explore', async (c) => {
  const type = c.req.query('type') === 'video' ? 'video' : 'image'
  const { results } = await c.env.DB.prepare(
    `SELECT p.*, u.name as author_name FROM prompts p
     JOIN users u ON u.id = p.user_id
     WHERE p.status = 'published' AND p.media_type = ?
     ORDER BY p.created_at DESC LIMIT 60`
  )
    .bind(type)
    .all<PromptRow>()
  return c.render(<HomePage prompts={results ?? []} activeType={type} />)
})

app.get('/p/:id', async (c) => {
  const id = Number(c.req.param('id'))
  if (!id) return c.text('Not found', 404)

  const p = await c.env.DB.prepare(
    `SELECT p.*, u.name as author_name FROM prompts p
     JOIN users u ON u.id = p.user_id
     WHERE p.id = ?`
  )
    .bind(id)
    .first<PromptRow>()

  if (!p) return c.render(<div class="empty-state"><div class="emoji">🔍</div><p>Prompt nahi mila.</p></div>)

  // increment views (best-effort, fire and forget)
  c.executionCtx?.waitUntil(
    c.env.DB.prepare('UPDATE prompts SET views = views + 1 WHERE id = ?').bind(id).run()
  )

  const author = await c.env.DB.prepare('SELECT avatar_key FROM users WHERE id = ?').bind(p.user_id).first<{ avatar_key: string | null }>()
  const authorAvatar = author?.avatar_key ? `/media/${author.avatar_key}` : null

  const currentUser = c.get('user') as AppUser | null
  return c.render(<PromptDetailPage p={p} authorAvatar={authorAvatar} currentUser={currentUser} />)
})

app.post('/p/:id/delete', requireAuth, async (c) => {
  const id = Number(c.req.param('id'))
  const user = c.get('user') as AppUser
  const p = await c.env.DB.prepare('SELECT * FROM prompts WHERE id = ?').bind(id).first<PromptRow>()
  if (!p) return c.redirect('/')
  if (user.role !== 'admin' && user.id !== p.user_id) {
    return c.redirect(`/p/${id}`)
  }
  await deleteMedia(c.env.R2, p.media_key)
  await c.env.DB.prepare('DELETE FROM prompts WHERE id = ?').bind(id).run()
  return c.redirect(user.role === 'admin' ? '/admin/prompts' : '/profile')
})

// ---------------------------------------------------------------------------
// Auth: register / login / logout
// ---------------------------------------------------------------------------
app.get('/register', (c) => c.render(<RegisterPage />))

app.post('/register', async (c) => {
  const body = await c.req.parseBody()
  const name = String(body.name ?? '').trim()
  const mobile = String(body.mobile ?? '').trim()
  const password = String(body.password ?? '')

  if (!name || !mobile || !password) {
    return c.render(<RegisterPage error="Sabhi fields bharo." />)
  }
  if (!isValidMobile(mobile)) {
    return c.render(<RegisterPage error="Sahi mobile number daalo (7-15 digits)." />)
  }
  if (password.length < 6) {
    return c.render(<RegisterPage error="Password kam se kam 6 characters ka hona chahiye." />)
  }

  const existing = await c.env.DB.prepare('SELECT id FROM users WHERE mobile = ?').bind(mobile).first()
  if (existing) {
    return c.render(<RegisterPage error="Ye mobile number already registered hai. Login karo." />)
  }

  const passwordHash = await hashPassword(password)
  const result = await c.env.DB.prepare(
    'INSERT INTO users (name, mobile, password_hash, role, kyc_status) VALUES (?, ?, ?, ?, ?)'
  )
    .bind(name, mobile, passwordHash, 'user', 'none')
    .run()

  const userId = result.meta.last_row_id as number
  const token = await createSession(c.env.DB, userId)
  setSessionCookie(c, token)
  return c.redirect('/')
})

app.get('/login', (c) => c.render(<LoginPage />))

app.post('/login', async (c) => {
  const body = await c.req.parseBody()
  const mobile = String(body.mobile ?? '').trim()
  const password = String(body.password ?? '')

  const user = await c.env.DB.prepare('SELECT * FROM users WHERE mobile = ?').bind(mobile).first<any>()
  if (!user) {
    return c.render(<LoginPage error="Mobile number ya password galat hai." />)
  }
  const ok = await verifyPassword(password, user.password_hash)
  if (!ok) {
    return c.render(<LoginPage error="Mobile number ya password galat hai." />)
  }

  const token = await createSession(c.env.DB, user.id)
  setSessionCookie(c, token)
  return c.redirect('/')
})

app.post('/logout', async (c) => {
  const token = getSessionToken(c)
  if (token) await destroySession(c.env.DB, token)
  clearSessionCookie(c)
  return c.redirect('/')
})

// ---------------------------------------------------------------------------
// Profile
// ---------------------------------------------------------------------------
app.get('/profile', requireAuth, async (c) => {
  const user = c.get('user') as AppUser
  const { results } = await c.env.DB.prepare(
    `SELECT p.*, u.name as author_name FROM prompts p
     JOIN users u ON u.id = p.user_id
     WHERE p.user_id = ? ORDER BY p.created_at DESC`
  )
    .bind(user.id)
    .all<PromptRow>()
  const myPrompts = results ?? []
  const totalViews = myPrompts.reduce((sum, p) => sum + (p.views ?? 0), 0)
  return c.render(<ProfilePage user={user} myPrompts={myPrompts} totalViews={totalViews} />)
})

app.get('/profile/edit', requireAuth, async (c) => {
  const user = c.get('user') as AppUser
  return c.render(<ProfileEditPage user={user} />)
})

app.post('/profile/edit', requireAuth, async (c) => {
  const user = c.get('user') as AppUser
  const body = await c.req.parseBody()
  const name = String(body.name ?? '').trim()
  const bio = String(body.bio ?? '').trim().slice(0, 200)
  const avatarFile = body.avatar as File | undefined

  if (!name) {
    return c.render(<ProfileEditPage user={user} error="Naam khaali nahi ho sakta." />)
  }

  let avatarKey = user.avatar_key
  if (avatarFile && avatarFile.size > 0) {
    const result = await storeAvatar(c.env.R2, avatarFile)
    if ('error' in result) {
      return c.render(<ProfileEditPage user={user} error={result.error} />)
    }
    await deleteMedia(c.env.R2, user.avatar_key)
    avatarKey = result.key
  }

  await c.env.DB.prepare('UPDATE users SET name = ?, bio = ?, avatar_key = ? WHERE id = ?')
    .bind(name, bio, avatarKey, user.id)
    .run()

  return c.redirect('/profile')
})

// ---------------------------------------------------------------------------
// KYC
// ---------------------------------------------------------------------------
app.get('/kyc', requireAuth, async (c) => {
  const user = c.get('user') as AppUser

  if (user.kyc_status === 'none') {
    return c.render(<KycFormPage user={user} />)
  }

  const kyc = await c.env.DB.prepare(
    'SELECT * FROM kyc_requests WHERE user_id = ? ORDER BY created_at DESC LIMIT 1'
  )
    .bind(user.id)
    .first<KycRow>()

  if (!kyc) {
    return c.render(<KycFormPage user={user} />)
  }
  return c.render(<KycStatusPage kyc={kyc} />)
})

app.get('/kyc/new', requireAuth, async (c) => {
  const user = c.get('user') as AppUser
  return c.render(<KycFormPage user={user} />)
})

app.post('/kyc', requireAuth, async (c) => {
  const user = c.get('user') as AppUser
  const body = await c.req.parseBody()
  const fullName = String(body.full_name ?? '').trim()
  const mobileNumber = String(body.mobile_number ?? '').trim()
  const tiktokId = String(body.tiktok_id ?? '').trim()
  const dob = String(body.dob ?? '').trim()

  if (!fullName || !mobileNumber || !tiktokId || !dob) {
    return c.render(<KycFormPage user={user} error="Sabhi fields bharo." />)
  }
  if (!isValidMobile(mobileNumber)) {
    return c.render(<KycFormPage user={user} error="Sahi mobile number daalo." />)
  }
  if (!isAdult(dob)) {
    return c.render(<KycFormPage user={user} error="Sirf 18+ users hi KYC submit kar sakte hain." />)
  }

  await c.env.DB.prepare(
    `INSERT INTO kyc_requests (user_id, full_name, mobile_number, tiktok_id, dob, status)
     VALUES (?, ?, ?, ?, ?, 'pending')`
  )
    .bind(user.id, fullName, mobileNumber, tiktokId, dob)
    .run()

  await c.env.DB.prepare('UPDATE users SET kyc_status = ? WHERE id = ?').bind('pending', user.id).run()

  return c.redirect('/kyc')
})

// ---------------------------------------------------------------------------
// Submit prompt (approved users only)
// ---------------------------------------------------------------------------
app.get('/submit-prompt', requireAuth, requireApprovedKyc, (c) => c.render(<SubmitPromptPage />))

app.post('/submit-prompt', requireAuth, requireApprovedKyc, async (c) => {
  const user = c.get('user') as AppUser
  const body = await c.req.parseBody()
  const title = String(body.title ?? '').trim()
  const promptText = String(body.prompt_text ?? '').trim()
  const promptType = String(body.prompt_type ?? 'image') === 'video' ? 'video' : 'image'
  const category = String(body.category ?? '').trim() || null
  const mediaFile = body.media as File | undefined

  if (!title || !promptText || !mediaFile || mediaFile.size === 0) {
    return c.render(<SubmitPromptPage error="Sabhi fields bharo aur media upload karo." />)
  }

  const result = await storeMedia(c.env.R2, mediaFile, 'prompts')
  if ('error' in result) {
    return c.render(<SubmitPromptPage error={result.error} />)
  }

  await c.env.DB.prepare(
    `INSERT INTO prompts (user_id, title, prompt_text, prompt_type, category, media_key, media_type, is_admin_post, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, 0, 'published')`
  )
    .bind(user.id, title, promptText, promptType, category, result.key, result.mediaType)
    .run()

  return c.redirect('/profile')
})

// ---------------------------------------------------------------------------
// One-time Admin bootstrap (only works if no admin exists yet)
// ---------------------------------------------------------------------------
app.get('/setup-admin', async (c) => {
  const existingAdmin = await c.env.DB.prepare("SELECT id FROM users WHERE role = 'admin' LIMIT 1").first()
  if (existingAdmin) return c.redirect('/login')
  return c.render(<SetupAdminPage />)
})

app.post('/setup-admin', async (c) => {
  const existingAdmin = await c.env.DB.prepare("SELECT id FROM users WHERE role = 'admin' LIMIT 1").first()
  if (existingAdmin) return c.redirect('/login')

  const body = await c.req.parseBody()
  const name = String(body.name ?? '').trim()
  const mobile = String(body.mobile ?? '').trim()
  const password = String(body.password ?? '')

  if (!name || !mobile || !password) {
    return c.render(<SetupAdminPage error="Sabhi fields bharo." />)
  }
  if (!isValidMobile(mobile)) {
    return c.render(<SetupAdminPage error="Sahi mobile number daalo." />)
  }
  if (password.length < 6) {
    return c.render(<SetupAdminPage error="Password kam se kam 6 characters ka hona chahiye." />)
  }

  const existingMobile = await c.env.DB.prepare('SELECT id FROM users WHERE mobile = ?').bind(mobile).first()
  if (existingMobile) {
    return c.render(<SetupAdminPage error="Ye mobile number already registered hai." />)
  }

  const passwordHash = await hashPassword(password)
  const result = await c.env.DB.prepare(
    "INSERT INTO users (name, mobile, password_hash, role, kyc_status) VALUES (?, ?, ?, 'admin', 'approved')"
  )
    .bind(name, mobile, passwordHash)
    .run()

  const userId = result.meta.last_row_id as number
  const token = await createSession(c.env.DB, userId)
  setSessionCookie(c, token)
  return c.redirect('/admin')
})

// ---------------------------------------------------------------------------
// Admin panel
// ---------------------------------------------------------------------------
app.get('/admin', requireAuth, requireAdmin, async (c) => {
  const users = await c.env.DB.prepare('SELECT COUNT(*) as n FROM users').first<{ n: number }>()
  const prompts = await c.env.DB.prepare('SELECT COUNT(*) as n FROM prompts').first<{ n: number }>()
  const pendingKyc = await c.env.DB.prepare("SELECT COUNT(*) as n FROM kyc_requests WHERE status = 'pending'").first<{ n: number }>()
  const approvedKyc = await c.env.DB.prepare("SELECT COUNT(*) as n FROM kyc_requests WHERE status = 'approved'").first<{ n: number }>()

  return c.render(
    <AdminDashboard
      stats={{
        users: users?.n ?? 0,
        prompts: prompts?.n ?? 0,
        pendingKyc: pendingKyc?.n ?? 0,
        approvedKyc: approvedKyc?.n ?? 0,
      }}
    />
  )
})

app.get('/admin/kyc', requireAuth, requireAdmin, async (c) => {
  const status = c.req.query('status') ?? 'pending'
  let query = `SELECT k.*, u.name as user_name, u.mobile as user_mobile FROM kyc_requests k
               JOIN users u ON u.id = k.user_id`
  const binds: any[] = []
  if (status !== 'all') {
    query += ' WHERE k.status = ?'
    binds.push(status)
  }
  query += ' ORDER BY k.created_at DESC LIMIT 100'

  const stmt = binds.length ? c.env.DB.prepare(query).bind(...binds) : c.env.DB.prepare(query)
  const { results } = await stmt.all<KycRow>()

  return c.render(<AdminKycListPage requests={results ?? []} filter={status} />)
})

app.post('/admin/kyc/:id/approve', requireAuth, requireAdmin, async (c) => {
  const id = Number(c.req.param('id'))
  const kyc = await c.env.DB.prepare('SELECT * FROM kyc_requests WHERE id = ?').bind(id).first<KycRow>()
  if (!kyc) return c.redirect('/admin/kyc')

  await c.env.DB.prepare(
    "UPDATE kyc_requests SET status = 'approved', reviewed_at = datetime('now') WHERE id = ?"
  )
    .bind(id)
    .run()
  await c.env.DB.prepare("UPDATE users SET kyc_status = 'approved' WHERE id = ?").bind(kyc.user_id).run()

  return c.redirect('/admin/kyc?status=pending')
})

app.post('/admin/kyc/:id/reject', requireAuth, requireAdmin, async (c) => {
  const id = Number(c.req.param('id'))
  const body = await c.req.parseBody()
  const note = String(body.admin_note ?? '').trim() || null

  const kyc = await c.env.DB.prepare('SELECT * FROM kyc_requests WHERE id = ?').bind(id).first<KycRow>()
  if (!kyc) return c.redirect('/admin/kyc')

  await c.env.DB.prepare(
    "UPDATE kyc_requests SET status = 'rejected', admin_note = ?, reviewed_at = datetime('now') WHERE id = ?"
  )
    .bind(note, id)
    .run()
  await c.env.DB.prepare("UPDATE users SET kyc_status = 'rejected' WHERE id = ?").bind(kyc.user_id).run()

  return c.redirect('/admin/kyc?status=pending')
})

app.get('/admin/prompts', requireAuth, requireAdmin, async (c) => {
  const { results } = await c.env.DB.prepare(
    `SELECT p.*, u.name as author_name FROM prompts p
     JOIN users u ON u.id = p.user_id
     ORDER BY p.created_at DESC LIMIT 200`
  ).all<PromptRow>()
  return c.render(<AdminPromptsPage prompts={results ?? []} />)
})

app.get('/admin/users', requireAuth, requireAdmin, async (c) => {
  const { results } = await c.env.DB.prepare('SELECT * FROM users ORDER BY created_at DESC LIMIT 300').all<AppUser>()
  return c.render(<AdminUsersPage users={results ?? []} />)
})

app.get('/admin/add-prompt', requireAuth, requireAdmin, (c) => c.render(<AdminAddPromptPage />))

app.post('/admin/add-prompt', requireAuth, requireAdmin, async (c) => {
  const user = c.get('user') as AppUser
  const body = await c.req.parseBody()
  const title = String(body.title ?? '').trim()
  const promptText = String(body.prompt_text ?? '').trim()
  const promptType = String(body.prompt_type ?? 'image') === 'video' ? 'video' : 'image'
  const category = String(body.category ?? '').trim() || null
  const mediaFile = body.media as File | undefined

  if (!title || !promptText || !mediaFile || mediaFile.size === 0) {
    return c.render(<AdminAddPromptPage error="Sabhi fields bharo aur media upload karo." />)
  }

  const result = await storeMedia(c.env.R2, mediaFile, 'prompts')
  if ('error' in result) {
    return c.render(<AdminAddPromptPage error={result.error} />)
  }

  await c.env.DB.prepare(
    `INSERT INTO prompts (user_id, title, prompt_text, prompt_type, category, media_key, media_type, is_admin_post, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, 1, 'published')`
  )
    .bind(user.id, title, promptText, promptType, category, result.key, result.mediaType)
    .run()

  return c.redirect('/admin/prompts')
})

export default app
