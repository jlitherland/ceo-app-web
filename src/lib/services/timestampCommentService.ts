/**
 * Timestamp Comment Service
 * Manages timestamped comments on audio posts
 * Ported from iOS TimestampCommentService
 */

import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import type { TimestampComment, InsertTables } from '@/lib/types/database'

export class TimestampCommentService {
  private supabase = createSupabaseBrowserClient()

  /**
   * Add a timestamped comment to an audio post
   */
  async addComment(
    postId: string,
    timestamp: number,
    text: string
  ): Promise<TimestampComment | null> {
    try {
      // Get current user
      const { data: { user } } = await this.supabase.auth.getUser()
      if (!user) {
        throw new Error('User not authenticated')
      }

      // Get user profile for name and avatar
      const { data: profile } = await this.supabase
        .from('users')
        .select('first_name, last_name, avatar_url')
        .eq('id', user.id)
        .single()

      const userName = profile
        ? `${profile.first_name} ${profile.last_name}`.trim()
        : user.email?.split('@')[0] || 'User'

      const userAvatar = profile?.avatar_url || ''

      // Insert comment
      const newComment: InsertTables<'timestamp_comments'> = {
        post_id: postId,
        user_id: user.id,
        user_name: userName,
        user_avatar: userAvatar,
        timestamp,
        text: text.trim()
      }

      const { data, error } = await this.supabase
        .from('timestamp_comments')
        .insert(newComment)
        .select()
        .single()

      if (error) throw error

      return data
    } catch (error) {
      console.error('Error adding timestamp comment:', error)
      return null
    }
  }

  /**
   * Get all comments for a post, sorted by timestamp
   */
  async getComments(postId: string): Promise<TimestampComment[]> {
    try {
      const { data, error } = await this.supabase
        .from('timestamp_comments')
        .select('*')
        .eq('post_id', postId)
        .order('timestamp', { ascending: true })

      if (error) throw error

      return data || []
    } catch (error) {
      console.error('Error fetching timestamp comments:', error)
      return []
    }
  }

  /**
   * Get recent comments (limited count)
   */
  async getRecentComments(postId: string, limit: number = 3): Promise<TimestampComment[]> {
    try {
      const { data, error } = await this.supabase
        .from('timestamp_comments')
        .select('*')
        .eq('post_id', postId)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) throw error

      return data || []
    } catch (error) {
      console.error('Error fetching recent comments:', error)
      return []
    }
  }

  /**
   * Delete a comment (user can only delete their own)
   */
  async deleteComment(commentId: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('timestamp_comments')
        .delete()
        .eq('id', commentId)

      if (error) throw error

      return true
    } catch (error) {
      console.error('Error deleting timestamp comment:', error)
      return false
    }
  }

  /**
   * Update a comment (user can only update their own)
   */
  async updateComment(commentId: string, newText: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('timestamp_comments')
        .update({ text: newText.trim() })
        .eq('id', commentId)

      if (error) throw error

      return true
    } catch (error) {
      console.error('Error updating timestamp comment:', error)
      return false
    }
  }

  /**
   * Subscribe to real-time comment updates
   */
  subscribeToComments(
    postId: string,
    callback: (comments: TimestampComment[]) => void
  ) {
    const channel = this.supabase
      .channel(`comments:${postId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'timestamp_comments',
          filter: `post_id=eq.${postId}`
        },
        async () => {
          // Reload comments when any change occurs
          const comments = await this.getComments(postId)
          callback(comments)
        }
      )
      .subscribe()

    // Return unsubscribe function
    return () => {
      channel.unsubscribe()
    }
  }
}

// Singleton instance
export const timestampCommentService = new TimestampCommentService()
