export interface Profile {
  id: string
  email: string | null
  full_name: string | null
  onboarding_completed: boolean
  created_at: string
  updated_at: string
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
      }
    }
  }
}
