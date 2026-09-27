import { jsxRenderer } from 'hono/jsx-renderer'
import type { AppUser } from './types'

export const renderer = jsxRenderer(({ children }, c) => {
  const user = c.get('user') as AppUser | null | undefined
  const path = new URL(c.req.url).pathname

  const navItem = (href: string, label: string, icon: string) => {
    const active = path === href
    return (
      <a href={href} class={`nav-item ${active ? 'active' : ''}`}>
        <span class="nav-icon">{icon}</span>
        <span class="nav-label">{label}</span>
      </a>
    )
  }

  return (
    <html lang="hi">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <title>MT Prompts — AI Image &amp; Video Prompts</title>
        <meta
          name="description"
          content="MT Prompts — AI Image aur Video Prompts ka collection. Prompt post karo, dekho, copy karo."
        />
        <link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' rx='20' fill='%236C5CE7'/%3E%3Ctext x='50' y='68' font-size='55' text-anchor='middle' fill='white' font-family='sans-serif' font-weight='bold'%3EM%3C/text%3E%3C/svg%3E" />
        <link href="/static/style.css" rel="stylesheet" />
      </head>
      <body>
        <header class="topbar">
          <a href="/" class="brand">
            <span class="brand-mark">MT</span>
            <span class="brand-name">Prompts</span>
          </a>
          <div class="topbar-actions">
            {user ? (
              <a href="/profile" class="avatar-chip">
                <img
                  src={user.avatar_key ? `/media/${user.avatar_key}` : '/static/default-avatar.svg'}
                  alt="dp"
                />
                <span>{user.name.split(' ')[0]}</span>
              </a>
            ) : (
              <a href="/login" class="btn btn-primary btn-sm">Login</a>
            )}
          </div>
        </header>

        <main class="app-main">{children}</main>

        <nav class="bottom-nav">
          {navItem('/', 'Home', '🏠')}
          {navItem('/explore?type=video', 'Videos', '🎬')}
          {user && user.role === 'admin'
            ? navItem('/admin', 'Admin', '🛠️')
            : navItem('/kyc', 'Post Karo', '➕')}
          {user
            ? navItem('/profile', 'Profile', '👤')
            : navItem('/login', 'Login', '🔑')}
        </nav>
      </body>
    </html>
  )
})
