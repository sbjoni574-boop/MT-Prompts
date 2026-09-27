import type { KycRow, PromptRow, AppUser } from '../types'
import { EmptyState } from './components'

export function AdminDashboard({
  stats,
}: {
  stats: { users: number; prompts: number; pendingKyc: number; approvedKyc: number }
}) {
  return (
    <div>
      <p class="page-title">🛠️ Admin Panel</p>

      <div class="admin-stats">
        <div class="admin-stat-card">
          <div class="num">{stats.users}</div>
          <div class="lab">Users</div>
        </div>
        <div class="admin-stat-card">
          <div class="num">{stats.prompts}</div>
          <div class="lab">Prompts</div>
        </div>
        <div class="admin-stat-card">
          <div class="num">{stats.pendingKyc}</div>
          <div class="lab">Pending KYC</div>
        </div>
      </div>

      <a href="/admin/kyc" class="list-link">
        <span>🪪 KYC Requests {stats.pendingKyc > 0 ? `(${stats.pendingKyc} pending)` : ''}</span>
        <span class="arrow">›</span>
      </a>
      <a href="/admin/prompts" class="list-link">
        <span>🗂️ Sabhi Prompts Manage Karo</span>
        <span class="arrow">›</span>
      </a>
      <a href="/admin/add-prompt" class="list-link">
        <span>➕ Admin Prompt Post Karo</span>
        <span class="arrow">›</span>
      </a>
      <a href="/admin/users" class="list-link">
        <span>👥 Users List</span>
        <span class="arrow">›</span>
      </a>
    </div>
  )
}

export function AdminKycListPage({ requests, filter }: { requests: KycRow[]; filter: string }) {
  return (
    <div>
      <p class="page-title">🪪 KYC Requests</p>

      <div class="tab-bar">
        <a href="/admin/kyc?status=pending" class={`tab-link ${filter === 'pending' ? 'active' : ''}`}>⏳ Pending</a>
        <a href="/admin/kyc?status=approved" class={`tab-link ${filter === 'approved' ? 'active' : ''}`}>✅ Approved</a>
        <a href="/admin/kyc?status=rejected" class={`tab-link ${filter === 'rejected' ? 'active' : ''}`}>❌ Rejected</a>
        <a href="/admin/kyc?status=all" class={`tab-link ${filter === 'all' ? 'active' : ''}`}>Sabhi</a>
      </div>

      {requests.length === 0 ? (
        <EmptyState emoji="🪪" text="Koi request nahi mili." />
      ) : (
        requests.map((r) => (
          <div class="card">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
              <strong>{r.full_name}</strong>
              <span class={`badge ${r.status === 'approved' ? 'badge-approved' : r.status === 'rejected' ? 'badge-rejected' : 'badge-pending'}`}>
                {r.status}
              </span>
            </div>
            <p style="font-size:13px;color:var(--text-dim);margin:4px 0;">📱 {r.mobile_number}</p>
            <p style="font-size:13px;color:var(--text-dim);margin:4px 0;">🎵 {r.tiktok_id}</p>
            <p style="font-size:13px;color:var(--text-dim);margin:4px 0;">🎂 DOB: {r.dob}</p>
            <p style="font-size:12px;color:var(--text-dim);margin:4px 0;">🗓️ {r.created_at}</p>

            {r.status === 'pending' ? (
              <div>
                <div class="action-btns" style="margin-top:10px;">
                  <form method="post" action={`/admin/kyc/${r.id}/approve`}>
                    <button class="btn btn-success btn-sm" type="submit">✅ Approve</button>
                  </form>
                </div>
                <form method="post" action={`/admin/kyc/${r.id}/reject`} style="margin-top:8px;display:flex;gap:6px;">
                  <input class="form-input" style="flex:1;" type="text" name="admin_note" placeholder="Reject reason (optional)" maxlength={200} />
                  <button class="btn btn-danger btn-sm" type="submit">❌ Reject</button>
                </form>
              </div>
            ) : null}
          </div>
        ))
      )}

      <div style="margin-top:14px;">
        <a href="/admin" class="small-link">← Wapas Admin Panel</a>
      </div>
    </div>
  )
}

export function AdminPromptsPage({ prompts }: { prompts: PromptRow[] }) {
  return (
    <div>
      <p class="page-title">🗂️ Sabhi Prompts</p>
      {prompts.length === 0 ? (
        <EmptyState emoji="🗂️" text="Koi prompt nahi mila." />
      ) : (
        <div class="admin-table-wrap">
          <table class="admin-table">
            <thead>
              <tr>
                <th>ID</th><th>Title</th><th>Type</th><th>Author</th><th>Views</th><th>Action</th>
              </tr>
            </thead>
            <tbody>
              {prompts.map((p) => (
                <tr>
                  <td>{p.id}</td>
                  <td><a href={`/p/${p.id}`}>{p.title}</a></td>
                  <td>{p.media_type}</td>
                  <td>{p.is_admin_post ? 'Admin' : p.author_name}</td>
                  <td>{p.views}</td>
                  <td>
                    <form method="post" action={`/p/${p.id}/delete`} onsubmit="return confirm('Delete?')">
                      <button class="btn btn-danger btn-sm" type="submit">🗑️</button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div style="margin-top:14px;">
        <a href="/admin" class="small-link">← Wapas Admin Panel</a>
      </div>
    </div>
  )
}

export function AdminUsersPage({ users }: { users: AppUser[] }) {
  return (
    <div>
      <p class="page-title">👥 Users</p>
      <div class="admin-table-wrap">
        <table class="admin-table">
          <thead>
            <tr><th>ID</th><th>Name</th><th>Mobile</th><th>Role</th><th>KYC</th><th>Joined</th></tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr>
                <td>{u.id}</td>
                <td>{u.name}</td>
                <td>{u.mobile}</td>
                <td>{u.role}</td>
                <td>{u.kyc_status}</td>
                <td>{u.created_at}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style="margin-top:14px;">
        <a href="/admin" class="small-link">← Wapas Admin Panel</a>
      </div>
    </div>
  )
}

export function AdminAddPromptPage({ error }: { error?: string }) {
  return (
    <div>
      <p class="page-title">➕ Admin Prompt Post Karo</p>
      <p class="page-sub">Ye prompt directly publish ho jayega (KYC ki zarurat nahi).</p>

      {error ? <div class="alert alert-error">{error}</div> : null}

      <form method="post" action="/admin/add-prompt" enctype="multipart/form-data" data-once>
        <div class="form-group">
          <label class="form-label">Cover Image / Video</label>
          <div class="upload-box" id="media-upload-box">
            <input id="media-input" type="file" name="media" accept="image/*,video/*" required />
            <div>📤 Upload karne ke liye tap karo</div>
            <img id="preview-img" style="display:none;" />
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Prompt Type</label>
          <select class="form-select" name="prompt_type" required>
            <option value="image">🖼️ Image Prompt</option>
            <option value="video">🎬 Video Prompt</option>
          </select>
        </div>

        <div class="form-group">
          <label class="form-label">Title</label>
          <input class="form-input" type="text" name="title" required maxlength={100} />
        </div>

        <div class="form-group">
          <label class="form-label">Category (optional)</label>
          <input class="form-input" type="text" name="category" maxlength={40} />
        </div>

        <div class="form-group">
          <label class="form-label">Prompt Text</label>
          <textarea class="form-textarea" name="prompt_text" required maxlength={3000} rows={6}></textarea>
        </div>

        <button type="submit" class="btn btn-primary btn-block">🚀 Publish Karo</button>
      </form>

      <div style="margin-top:14px;">
        <a href="/admin" class="small-link">← Wapas Admin Panel</a>
      </div>
    </div>
  )
}
