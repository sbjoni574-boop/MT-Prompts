import type { PromptRow } from '../types'
import { PromptCard, EmptyState } from './components'

export function HomePage({ prompts, activeType }: { prompts: PromptRow[]; activeType: string }) {
  return (
    <div>
      <p class="page-title">🔥 AI Prompts Feed</p>
      <p class="page-sub">Best AI Image &amp; Video prompts — copy karo aur use karo.</p>

      <div class="filter-bar">
        <a href="/" class={`filter-chip ${activeType === 'all' ? 'active' : ''}`}>Sabhi</a>
        <a href="/explore?type=image" class={`filter-chip ${activeType === 'image' ? 'active' : ''}`}>🖼️ Image</a>
        <a href="/explore?type=video" class={`filter-chip ${activeType === 'video' ? 'active' : ''}`}>🎬 Video</a>
      </div>

      {prompts.length === 0 ? (
        <EmptyState emoji="🗂️" text="Abhi koi prompt nahi mila." />
      ) : (
        <div class="prompt-grid">
          {prompts.map((p) => <PromptCard p={p} />)}
        </div>
      )}
    </div>
  )
}
