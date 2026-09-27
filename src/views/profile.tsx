import type { AppUser, PromptRow } from '../types'
import { PromptCard, EmptyState } from './components'
import { KycBadge } from './components'

export function ProfilePage({
  user,
  myPrompts,
  totalViews,
}: {
  user: AppUser
  myPrompts: PromptRow[]
  totalViews: number
}) {
  return (
    <div>
      <div class="profile-header">
        <div class="profile-avatar-wrap">
          <img
            class="profile-avatar"
            src={user.avatar_key ? `/media/${user.avatar_key}` : '/static/default-avatar.svg'}
            alt="dp"
          />
        </div>
        <div class="profile-name">{user.name}</div>
        <div class="profile-mobile">📱 {user.mobile}</div>
        <div style="margin-top:8px;">
          {user.role === 'admin' ? (
            <span class="badge badge-admin">🛠️ Admin</span>
          ) : (
            <KycBadge status={user.kyc_status} />
          )}
        </div>
      </div>

      <div class="stat-row">
        <div class="stat-box">
          <div class="stat-num">{myPrompts.length}</div>
          <div class="stat-label">Prompts</div>
        </div>
        <div class="stat-box">
          <div class="stat-num">{totalViews}</div>
          <div class="stat-label">Total Views</div>
        </div>
      </div>

      <a href="/profile/edit" class="list-link">
        <span>✏️ Profile Edit Karo (DP / Bio)</span>
        <span class="arrow">›</span>
      </a>

      {user.role !== 'admin' ? (
        <a href="/kyc" class="list-link">
          <span>🪪 KYC Status</span>
          <span class="arrow"><KycBadge status={user.kyc_status} /></span>
        </a>
      ) : null}

      {user.role !== 'admin' && user.kyc_status === 'approved' ? (
        <a href="/submit-prompt" class="list-link">
          <span>➕ Naya Prompt Post Karo</span>
          <span class="arrow">›</span>
        </a>
      ) : null}

      {user.role === 'admin' ? (
        <a href="/admin" class="list-link">
          <span>🛠️ Admin Panel</span>
          <span class="arrow">›</span>
        </a>
      ) : null}

      <form method="post" action="/logout" style="margin-top:16px;">
        <button type="submit" class="btn btn-secondary btn-block">🚪 Logout</button>
      </form>

      <p class="page-title" style="margin-top:24px;">Mere Prompts</p>
      {myPrompts.length === 0 ? (
        <EmptyState emoji="🗂️" text="Aapne abhi tak koi prompt post nahi kiya." />
      ) : (
        <div class="prompt-grid">
          {myPrompts.map((p) => <PromptCard p={p} />)}
        </div>
      )}
    </div>
  )
}

export function ProfileEditPage({ user, error }: { user: AppUser; error?: string }) {
  return (
    <div>
      <p class="page-title">✏️ Profile Edit</p>

      {error ? <div class="alert alert-error">{error}</div> : null}

      <form method="post" action="/profile/edit" enctype="multipart/form-data" data-once>
        <div class="form-group">
          <label class="form-label">DP (Profile Photo)</label>
          <div class="upload-box" id="avatar-upload-box">
            <input id="avatar-input" type="file" name="avatar" accept="image/*" />
            <div>📷 DP change karne ke liye tap karo</div>
            <img
              id="avatar-preview-img"
              src={user.avatar_key ? `/media/${user.avatar_key}` : '/static/default-avatar.svg'}
              style="display:block; max-height:220px; margin:10px auto 0; border-radius:50%;"
            />
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Naam</label>
          <input class="form-input" type="text" name="name" value={user.name} required maxlength={60} />
        </div>

        <div class="form-group">
          <label class="form-label">Bio</label>
          <textarea class="form-textarea" name="bio" placeholder="Apne baare me kuch likho..." maxlength={200}>
            {user.bio ?? ''}
          </textarea>
        </div>

        <button type="submit" class="btn btn-primary btn-block">Save Karo</button>
      </form>

      <div style="margin-top:14px;">
        <a href="/profile" class="small-link">← Wapas Profile par jao</a>
      </div>
    </div>
  )
}
