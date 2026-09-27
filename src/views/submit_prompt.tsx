export function SubmitPromptPage({ error }: { error?: string }) {
  return (
    <div>
      <p class="page-title">➕ Naya Prompt Post Karo</p>
      <p class="page-sub">AI Image ya Video Prompt share karo — cover image/video ke saath.</p>

      {error ? <div class="alert alert-error">{error}</div> : null}

      <form method="post" action="/submit-prompt" enctype="multipart/form-data" data-once>
        <div class="form-group">
          <label class="form-label">Cover Image / Video</label>
          <div class="upload-box" id="media-upload-box">
            <input id="media-input" type="file" name="media" accept="image/*,video/*" required />
            <div>📤 Upload karne ke liye tap karo</div>
            <div id="preview-img-label" class="form-hint"></div>
            <img id="preview-img" style="display:none;" />
          </div>
          <div class="form-hint">Image max 8MB, Video max 25MB</div>
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
          <input class="form-input" type="text" name="title" placeholder="e.g. Cyberpunk Neon City" required maxlength={100} />
        </div>

        <div class="form-group">
          <label class="form-label">Category (optional)</label>
          <input class="form-input" type="text" name="category" placeholder="e.g. Portrait, Anime, Nature" maxlength={40} />
        </div>

        <div class="form-group">
          <label class="form-label">Prompt Text</label>
          <textarea class="form-textarea" name="prompt_text" placeholder="Full AI prompt yahan paste karo..." required maxlength={3000} rows={6}></textarea>
        </div>

        <button type="submit" class="btn btn-primary btn-block">🚀 Post Karo</button>
      </form>

      <div style="margin-top:14px;">
        <a href="/profile" class="small-link">← Wapas Profile par jao</a>
      </div>
    </div>
  )
}
