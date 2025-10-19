/**
 * Database Types
 *
 * These types are generated from your Supabase database schema.
 * Run `npm run generate:types` to update these types.
 *
 * To generate types, run:
 * npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/lib/types/database.ts
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          first_name: string
          last_name: string
          username: string | null
          avatar_url: string | null
          role: string
          onboarding_completed: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          first_name: string
          last_name: string
          username?: string | null
          avatar_url?: string | null
          role?: string
          onboarding_completed?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          first_name?: string
          last_name?: string
          username?: string | null
          avatar_url?: string | null
          role?: string
          onboarding_completed?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      teams: {
        Row: {
          id: string
          name: string
          description: string
          avatar_url: string | null
          tagline: string | null
          background_image_url: string | null
          owner_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description: string
          avatar_url?: string | null
          tagline?: string | null
          background_image_url?: string | null
          owner_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string
          avatar_url?: string | null
          tagline?: string | null
          background_image_url?: string | null
          owner_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      team_members: {
        Row: {
          id: string
          team_id: string
          user_id: string
          role: string
          status: string
          joined_date: string
          created_at: string
        }
        Insert: {
          id?: string
          team_id: string
          user_id: string
          role?: string
          status?: string
          joined_date?: string
          created_at?: string
        }
        Update: {
          id?: string
          team_id?: string
          user_id?: string
          role?: string
          status?: string
          joined_date?: string
          created_at?: string
        }
      }
      team_wall_posts: {
        Row: {
          id: string
          team_id: string
          author_id: string
          author_name: string
          author_avatar: string
          message: string
          file_name: string | null
          file_url: string | null
          file_type: string
          quoted_post_id: string | null
          quoted_content: string | null
          quoted_author: string | null
          quoted_file_type: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          team_id: string
          author_id: string
          author_name: string
          author_avatar: string
          message: string
          file_name?: string | null
          file_url?: string | null
          file_type?: string
          quoted_post_id?: string | null
          quoted_content?: string | null
          quoted_author?: string | null
          quoted_file_type?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          team_id?: string
          author_id?: string
          author_name?: string
          author_avatar?: string
          message?: string
          file_name?: string | null
          file_url?: string | null
          file_type?: string
          quoted_post_id?: string | null
          quoted_content?: string | null
          quoted_author?: string | null
          quoted_file_type?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      wall_post_likes: {
        Row: {
          id: string
          post_id: string
          user_id: string
          user_name: string
          user_avatar: string
          timestamp_in_audio: number | null
          liked_at: string
        }
        Insert: {
          id?: string
          post_id: string
          user_id: string
          user_name: string
          user_avatar: string
          timestamp_in_audio?: number | null
          liked_at?: string
        }
        Update: {
          id?: string
          post_id?: string
          user_id?: string
          user_name?: string
          user_avatar?: string
          timestamp_in_audio?: number | null
          liked_at?: string
        }
      }
      timestamp_comments: {
        Row: {
          id: string
          post_id: string
          user_id: string
          user_name: string
          user_avatar: string
          timestamp: number
          text: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          post_id: string
          user_id: string
          user_name: string
          user_avatar: string
          timestamp: number
          text: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          post_id?: string
          user_id?: string
          user_name?: string
          user_avatar?: string
          timestamp?: number
          text?: string
          created_at?: string
          updated_at?: string
        }
      }
      track_versions: {
        Row: {
          id: string
          post_id: string
          version_number: number
          parent_version_id: string | null
          title: string
          audio_url: string
          file_name: string | null
          is_active: boolean
          created_by: string
          created_at: string
          updated_at: string
          metadata: Record<string, any>
        }
        Insert: {
          id?: string
          post_id: string
          version_number?: number
          parent_version_id?: string | null
          title: string
          audio_url: string
          file_name?: string | null
          is_active?: boolean
          created_by: string
          created_at?: string
          updated_at?: string
          metadata?: Record<string, any>
        }
        Update: {
          id?: string
          post_id?: string
          version_number?: number
          parent_version_id?: string | null
          title?: string
          audio_url?: string
          file_name?: string | null
          is_active?: boolean
          created_by?: string
          created_at?: string
          updated_at?: string
          metadata?: Record<string, any>
        }
      }
      // Add more tables as needed
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

// Helper types for easier access
export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row']

export type InsertTables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert']

export type UpdateTables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update']

// Common entity types
export type User = Tables<'users'>
export type Team = Tables<'teams'>
export type TeamMember = Tables<'team_members'>
export type TeamWallPost = Tables<'team_wall_posts'>
export type TimestampComment = Tables<'timestamp_comments'>
export type WallPostLike = Tables<'wall_post_likes'>
export type TrackVersion = Tables<'track_versions'>

// Legacy alias for compatibility
export type WallPost = TeamWallPost
