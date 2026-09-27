import type { FC } from 'hono/jsx'
import type { PromptRow } from '../types'

export const Alert: FC<{ type?: 'error' | 'success' | 'warn' | 'info'; children: any }> = ({
  type = 'info',
  children,
}) => <div class={`alert alert-${type}`}>{children}</div>

export const KycBadge: FC<{ status: string }> = ({ status }) => {
  const map: Record<string, string> = {
    pending: '⏳ Pending Review',
    approved: '✅ Approved',
    rejected: '❌ Rejected',
    none: '➕ Not Submitted',
  }
  const cls = status === 'approved' ? 'badge-approved' : status === 'rejected' ? 'badge-rejected' : 'badge-pending'
  return <span class={`badge ${cls}`}>{map[status] ?? status}</span>
}

export const PromptCard: FC<{ p: PromptRow }> = ({ p }) => {
  const mediaUrl = `/media/${p.media_key}`
  return (
    <a href={`/p/${p.id}`} class="prompt-card">
      <div class="prompt-media-wrap">
        {p.media_type === 'video' ? (
          <video class="prompt-media" src={mediaUrl} muted preload="metadata" />
        ) : (
          <img class="prompt-media" src={mediaUrl} alt={p.title} loading="lazy" />
        )}
        <span class={`badge prompt-type-badge ${p.media_type === 'video' ? 'badge-video' : 'badge-image'}`}>
          {p.media_type === 'video' ? '🎬 Video' : '🖼️ Image'}
        </span>
      </div>
      <div class="prompt-body">
        <p class="prompt-title">{p.title}</p>
        <div class="prompt-meta">
          <span>{p.is_admin_post ? '🛠️ Admin' : `👤 ${p.author_name ?? ''}`}</span>
          <span>👁️ {p.views}</span>
        </div>
      </div>
    </a>
  )
}

export const EmptyState: FC<{ emoji?: string; text: string }> = ({ emoji = '🗂️', text }) => (
  <div class="empty-state">
    <div class="emoji">{emoji}</div>
    <p>{text}</p>
  </div>
)
