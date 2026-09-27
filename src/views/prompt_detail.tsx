import type { PromptRow, AppUser } from '../types'

export function PromptDetailPage({
  p,
  authorAvatar,
  currentUser,
}: {
  p: PromptRow
  authorAvatar: string | null
  currentUser: AppUser | null
}) {
  const mediaUrl = `/media/${p.media_key}`
  const canDelete = currentUser && (currentUser.role === 'admin' || currentUser.id === p.user_id)

  return (
    <div>
      <div class="detail-media">
        {p.media_type === 'video' ? (
          <video src={mediaUrl} controls autoplay muted loop />
        ) : (
          <img src={mediaUrl} alt={p.title} />
        )}
      </div>

      <div class="author-row">
        <img src={authorAvatar ?? '/static/default-avatar.svg'} alt="author" />
        <div>
          <div class="name">{p.is_admin_post ? 'MT Prompts (Admin)' : p.author_name}</div>
          <div class="sub">
            <span class={`badge ${p.media_type === 'video' ? 'badge-video' : 'badge-image'}`}>
              {p.media_type === 'video' ? '🎬 Video Prompt' : '🖼️ Image Prompt'}
            </span>
            {' '}👁️ {p.views} views
          </div>
        </div>
      </div>

      <p class="page-title" style="margin-bottom:8px;">{p.title}</p>
      {p.category ? <p class="page-sub" style="margin-top:-4px;">📂 {p.category}</p> : null}

      <div class="prompt-text-box" id="prompt-text-content">{p.prompt_text}</div>
      <button class="btn btn-primary btn-block copy-btn" onclick="copyPromptText(this)">
        📋 Prompt Copy Karo
      </button>

      {canDelete ? (
        <form method="post" action={`/p/${p.id}/delete`} style="margin-top:14px;"
          onsubmit="return confirm('Ye prompt delete karna hai?')">
          <button type="submit" class="btn btn-danger btn-block btn-sm">🗑️ Delete Prompt</button>
        </form>
      ) : null}

      <div style="margin-top:16px;">
        <a href="/" class="small-link">← Wapas feed par jao</a>
      </div>
    </div>
  )
}
