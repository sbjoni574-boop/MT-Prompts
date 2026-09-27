export function LoginPage({ error }: { error?: string }) {
  return (
    <div class="auth-wrap">
      <div class="auth-logo">🔐</div>
      <p class="auth-title">Login Karo</p>
      <p class="auth-sub">MT Prompts me wapas aane ke liye login karo</p>

      {error ? <div class="alert alert-error">{error}</div> : null}

      <form method="post" action="/login" data-once>
        <div class="form-group">
          <label class="form-label">Mobile Number</label>
          <input class="form-input" type="tel" name="mobile" placeholder="9876543210" required maxlength={15} />
        </div>
        <div class="form-group">
          <label class="form-label">Password</label>
          <input class="form-input" type="password" name="password" placeholder="••••••••" required minlength={6} />
        </div>
        <button class="btn btn-primary btn-block" type="submit">Login</button>
      </form>

      <p class="auth-switch">
        Naya account? <a href="/register">Register Karo</a>
      </p>
    </div>
  )
}

export function RegisterPage({ error }: { error?: string }) {
  return (
    <div class="auth-wrap">
      <div class="auth-logo">✨</div>
      <p class="auth-title">Account Banao</p>
      <p class="auth-sub">MT Prompts join karo — image &amp; video prompts explore karo</p>

      {error ? <div class="alert alert-error">{error}</div> : null}

      <form method="post" action="/register" data-once>
        <div class="form-group">
          <label class="form-label">Pura Naam</label>
          <input class="form-input" type="text" name="name" placeholder="Aapka naam" required maxlength={60} />
        </div>
        <div class="form-group">
          <label class="form-label">Mobile Number</label>
          <input class="form-input" type="tel" name="mobile" placeholder="9876543210" required maxlength={15} />
        </div>
        <div class="form-group">
          <label class="form-label">Password</label>
          <input class="form-input" type="password" name="password" placeholder="Kam se kam 6 characters" required minlength={6} />
        </div>
        <button class="btn btn-primary btn-block" type="submit">Register Karo</button>
      </form>

      <p class="auth-switch">
        Already account hai? <a href="/login">Login Karo</a>
      </p>
    </div>
  )
}
