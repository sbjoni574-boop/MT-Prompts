export type Bindings = {
  DB: D1Database
  R2: R2Bucket
}

export type AppUser = {
  id: number
  name: string
  mobile: string
  role: 'user' | 'admin'
  avatar_key: string | null
  bio: string | null
  kyc_status: 'none' | 'pending' | 'approved' | 'rejected'
  created_at: string
}

export type PromptRow = {
  id: number
  user_id: number
  title: string
  prompt_text: string
  prompt_type: 'image' | 'video'
  category: string | null
  media_key: string
  media_type: 'image' | 'video'
  is_admin_post: number
  status: 'published' | 'hidden'
  views: number
  created_at: string
  author_name?: string
}

export type KycRow = {
  id: number
  user_id: number
  full_name: string
  mobile_number: string
  tiktok_id: string
  dob: string
  status: 'pending' | 'approved' | 'rejected'
  admin_note: string | null
  created_at: string
  reviewed_at: string | null
  user_name?: string
  user_mobile?: string
}

export type Env = {
  Bindings: Bindings
  Variables: {
    user: AppUser | null
  }
}
