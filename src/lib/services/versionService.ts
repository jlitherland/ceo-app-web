/**
 * Version Control Service
 * Manages track versions for Samply-style version stacking
 */

import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import type { TrackVersion, InsertTables } from '@/lib/types/database'

export class VersionService {
  private supabase = createSupabaseBrowserClient()

  /**
   * Get all versions for a post
   */
  async getVersions(postId: string): Promise<TrackVersion[]> {
    try {
      const { data, error } = await this.supabase
        .from('track_versions')
        .select('*')
        .eq('post_id', postId)
        .order('version_number', { ascending: true })

      if (error) throw error

      return data || []
    } catch (error) {
      console.error('Error fetching versions:', error)
      return []
    }
  }

  /**
   * Get active version for a post
   */
  async getActiveVersion(postId: string): Promise<TrackVersion | null> {
    try {
      const { data, error} = await this.supabase
        .from('track_versions')
        .select('*')
        .eq('post_id', postId)
        .eq('is_active', true)
        .single()

      if (error) throw error

      return data
    } catch (error) {
      console.error('Error fetching active version:', error)
      return null
    }
  }

  /**
   * Create a new version
   */
  async createVersion(
    postId: string,
    title: string,
    audioUrl: string,
    fileName?: string,
    parentVersionId?: string
  ): Promise<TrackVersion | null> {
    try {
      // Get current user
      const { data: { user } } = await this.supabase.auth.getUser()
      if (!user) {
        throw new Error('User not authenticated')
      }

      // Get current max version number
      const { data: versions } = await this.supabase
        .from('track_versions')
        .select('version_number')
        .eq('post_id', postId)
        .order('version_number', { ascending: false })
        .limit(1)

      const nextVersionNumber = versions && versions.length > 0
        ? versions[0].version_number + 1
        : 1

      // Create new version
      const newVersion: InsertTables<'track_versions'> = {
        post_id: postId,
        version_number: nextVersionNumber,
        parent_version_id: parentVersionId || null,
        title,
        audio_url: audioUrl,
        file_name: fileName || null,
        is_active: false, // New versions start inactive
        created_by: user.id
      }

      const { data, error } = await this.supabase
        .from('track_versions')
        .insert(newVersion)
        .select()
        .single()

      if (error) throw error

      return data
    } catch (error) {
      console.error('Error creating version:', error)
      return null
    }
  }

  /**
   * Set active version for a post
   */
  async setActiveVersion(postId: string, versionId: string): Promise<boolean> {
    try {
      // Deactivate all versions for this post
      await this.supabase
        .from('track_versions')
        .update({ is_active: false })
        .eq('post_id', postId)

      // Activate the selected version
      const { error } = await this.supabase
        .from('track_versions')
        .update({ is_active: true })
        .eq('id', versionId)

      if (error) throw error

      // Update the post's active_version_id
      await this.supabase
        .from('team_wall_posts')
        .update({ active_version_id: versionId })
        .eq('id', postId)

      return true
    } catch (error) {
      console.error('Error setting active version:', error)
      return false
    }
  }

  /**
   * Delete a version
   */
  async deleteVersion(versionId: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('track_versions')
        .delete()
        .eq('id', versionId)

      if (error) throw error

      return true
    } catch (error) {
      console.error('Error deleting version:', error)
      return false
    }
  }

  /**
   * Update version metadata
   */
  async updateVersionMetadata(
    versionId: string,
    metadata: Record<string, any>
  ): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('track_versions')
        .update({ metadata })
        .eq('id', versionId)

      if (error) throw error

      return true
    } catch (error) {
      console.error('Error updating version metadata:', error)
      return false
    }
  }

  /**
   * Subscribe to version changes for a post
   */
  subscribeToVersions(
    postId: string,
    callback: (versions: TrackVersion[]) => void
  ) {
    const channel = this.supabase
      .channel(`versions:${postId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'track_versions',
          filter: `post_id=eq.${postId}`
        },
        async () => {
          // Reload versions when any change occurs
          const versions = await this.getVersions(postId)
          callback(versions)
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
export const versionService = new VersionService()
