export interface Profile {
  id: string
  email: string | null
  full_name: string | null
  onboarding_completed: boolean
  onboarding_step: string | null
  created_at: string
  updated_at: string
}

export interface Persona {
  id: string
  user_id: string
  expertise: string | null
  tone: string | null
  phrases_to_avoid: string | null
  target_audience: string | null
  created_at: string
  updated_at: string
}

export interface TelegramConnection {
  id: string
  user_id: string
  telegram_chat_id: number
  telegram_user_id: number | null
  connected_at: string
}

export interface TelegramConnectionToken {
  token: string
  user_id: string
  created_at: string
  expires_at: string
}

export interface Product {
  id: string
  user_id: string
  name: string
  description: string | null
  url: string | null
  keywords: string[]
  subreddits: string[]
  created_at: string
  updated_at: string
}

export interface Mention {
  id: string
  product_id: string
  user_id: string
  reddit_post_id: string
  reddit_permalink: string
  reddit_title: string
  reddit_content: string | null
  reddit_author: string
  reddit_subreddit: string
  reddit_created_at: string
  intent: 'pain_point' | 'recommendation_request'
  confidence: number
  draft_reply: string | null
  status: 'pending' | 'approved' | 'discarded' | 'regenerated'
  created_at: string
  updated_at: string
}

export interface MonitoringState {
  id: number
  last_checked_at: string | null
  last_run_stats: {
    products: number
    posts_found: number
    mentions_created: number
  } | null
}

// For Supabase client type inference
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: Omit<Profile, 'created_at' | 'updated_at'> & {
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Omit<Profile, 'id' | 'created_at'>>
        Relationships: []
      }
      personas: {
        Row: Persona
        Insert: Omit<Persona, 'id' | 'created_at' | 'updated_at'> & {
          id?: string
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Omit<Persona, 'id' | 'user_id' | 'created_at'>>
        Relationships: []
      }
      telegram_connections: {
        Row: TelegramConnection
        Insert: Omit<TelegramConnection, 'id' | 'connected_at'> & {
          id?: string
          connected_at?: string
        }
        Update: Partial<Omit<TelegramConnection, 'id' | 'user_id'>>
        Relationships: []
      }
      telegram_connection_tokens: {
        Row: TelegramConnectionToken
        Insert: TelegramConnectionToken
        Update: never // Tokens should not be updated, only created/deleted
        Relationships: []
      }
      products: {
        Row: Product
        Insert: Omit<Product, 'id' | 'created_at' | 'updated_at'> & {
          id?: string
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Omit<Product, 'id' | 'user_id' | 'created_at'>>
        Relationships: []
      }
      mentions: {
        Row: Mention
        Insert: Omit<Mention, 'id' | 'created_at' | 'updated_at'> & {
          id?: string
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Omit<Mention, 'id' | 'product_id' | 'user_id' | 'created_at'>>
        Relationships: []
      }
      monitoring_state: {
        Row: MonitoringState
        Insert: MonitoringState
        Update: Partial<Omit<MonitoringState, 'id'>>
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
