import type { Context, Next } from 'hono'
import { getUserFromRequest } from './auth'
import type { Bindings } from '../types'

export async function loadUser(c: Context<{ Bindings: Bindings }>, next: Next) {
  const user = await getUserFromRequest(c)
  c.set('user' as never, user as never)
  await next()
}

export async function requireAuth(c: Context<any>, next: Next) {
  const user = c.get('user')
  if (!user) {
    return c.redirect('/login')
  }
  await next()
}

export async function requireAdmin(c: Context<any>, next: Next) {
  const user = c.get('user')
  if (!user || user.role !== 'admin') {
    return c.redirect('/')
  }
  await next()
}

export async function requireApprovedKyc(c: Context<any>, next: Next) {
  const user = c.get('user')
  if (!user) return c.redirect('/login')
  if (user.role === 'admin') {
    await next()
    return
  }
  if (user.kyc_status !== 'approved') {
    return c.redirect('/kyc')
  }
  await next()
}
