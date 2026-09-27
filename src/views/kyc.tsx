import type { AppUser, KycRow } from '../types'

export function KycFormPage({ user, error }: { user: AppUser; error?: string }) {
  return (
    <div>
      <p class="page-title">🪪 KYC Verification</p>
      <p class="page-sub">
        Prompt post karne ke liye pehle ye form bharo. Admin approve karega uske baad hi aap
        prompt post kar payenge.
      </p>

      {error ? <div class="alert alert-error">{error}</div> : null}

      <div class="alert alert-info">18+ hona zaroori hai. Sahi jaankari bharo, galat details par form reject ho sakta hai.</div>

      <form method="post" action="/kyc" data-once>
        <div class="form-group">
          <label class="form-label">Pura Naam</label>
          <input class="form-input" type="text" name="full_name" value={user.name} required maxlength={80} />
        </div>

        <div class="form-group">
          <label class="form-label">Mobile Number</label>
          <input class="form-input" type="tel" name="mobile_number" value={user.mobile} required maxlength={15} />
        </div>

        <div class="form-group">
          <label class="form-label">TikTok ID / Username</label>
          <input class="form-input" type="text" name="tiktok_id" placeholder="@yourusername" required maxlength={60} />
        </div>

        <div class="form-group">
          <label class="form-label">Date of Birth (18+ hona zaroori hai)</label>
          <input class="form-input" type="date" name="dob" required />
        </div>

        <button type="submit" class="btn btn-primary btn-block">Submit Karo</button>
      </form>

      <div style="margin-top:14px;">
        <a href="/profile" class="small-link">← Wapas Profile par jao</a>
      </div>
    </div>
  )
}

export function KycStatusPage({ kyc }: { kyc: KycRow }) {
  const map: Record<string, { icon: string; title: string; sub: string; alert: 'warn' | 'success' | 'error' }> = {
    pending: {
      icon: '⏳',
      title: 'Review Pending',
      sub: 'Aapka KYC form admin ke paas review ke liye gaya hai. Approval milte hi aap prompt post kar sakenge.',
      alert: 'warn',
    },
    approved: {
      icon: '✅',
      title: 'KYC Approved!',
      sub: 'Congratulations! Ab aap prompts post kar sakte hain.',
      alert: 'success',
    },
    rejected: {
      icon: '❌',
      title: 'KYC Rejected',
      sub: kyc.admin_note ? `Reason: ${kyc.admin_note}` : 'Aapka form reject ho gaya. Dobara sahi details ke saath submit karo.',
      alert: 'error',
    },
  }
  const info = map[kyc.status] ?? map.pending

  return (
    <div>
      <div class="kyc-status-box card">
        <div class="kyc-status-icon">{info.icon}</div>
        <p class="page-title" style="margin-bottom:4px;">{info.title}</p>
        <p class="page-sub">{info.sub}</p>
      </div>

      <div class="card">
        <p class="form-label">Submitted Details</p>
        <p style="font-size:14px;margin:6px 0;">👤 {kyc.full_name}</p>
        <p style="font-size:14px;margin:6px 0;">📱 {kyc.mobile_number}</p>
        <p style="font-size:14px;margin:6px 0;">🎵 TikTok: {kyc.tiktok_id}</p>
        <p style="font-size:14px;margin:6px 0;">🎂 DOB: {kyc.dob}</p>
      </div>

      {kyc.status === 'rejected' ? (
        <a href="/kyc/new" class="btn btn-primary btn-block">🔁 Dobara Submit Karo</a>
      ) : null}

      {kyc.status === 'approved' ? (
        <a href="/submit-prompt" class="btn btn-primary btn-block">➕ Prompt Post Karo</a>
      ) : null}

      <div style="margin-top:14px;">
        <a href="/profile" class="small-link">← Wapas Profile par jao</a>
      </div>
    </div>
  )
}
