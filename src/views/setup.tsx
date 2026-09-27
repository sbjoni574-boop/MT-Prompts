export function SetupAdminPage({ error }: { error?: string }) {
  return (
    <div class="auth-wrap">
      <div class="auth-logo">🛠️</div>
      <p class="auth-title">Admin Setup</p>
      <p class="auth-sub">
        Pehla Admin account banao. Ye page sirf ek baar kaam karega (jab tak koi admin exist
        nahi karta).
      </p>

      {error ? <div class="alert alert-error">{error}</div> : null}

      <form method="post" action="/setup-admin" data-once>
        <div class="form-group">
          <label class="form-label">Admin Naam</label>
          <input class="form-input" type="text" name="name" required maxlength={60} />
        </div>
        <div class="form-group">
          <label class="form-label">Mobile Number</label>
          <input class="form-input" type="tel" name="mobile" required maxlength={15} />
        </div>
        <div class="form-group">
          <label class="form-label">Password</label>
          <input class="form-input" type="password" name="password" required minlength={6} />
        </div>
        <button type="submit" class="btn btn-primary btn-block">Admin Account Banao</button>
      </form>
    </div>
  )
}
