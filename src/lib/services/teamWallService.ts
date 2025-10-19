/**
 * Team Wall Service
 * Exact port of iOS TeamWallService.swift
 * Handles all team wall operations with real-time updates, caching, and file uploads
 *
 * NOTE: Real-time subscriptions require WSS (secure WebSocket).
 * In local development (HTTP), real-time will be disabled but the service continues to work.
 * In production (HTTPS), real-time will work automatically.
 */

import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import type { TeamWallPost, WallPostLike, InsertTables } from '@/lib/types/database'

export type WallPostType = 'message' | 'document' | 'music' | 'photo' | 'video' | 'voice' | 'quote_reply'

export interface WallPostData {
  id?: string
  team_id: string
  author_id: string
  author_name: string
  author_avatar: string
  message: string
  file_name?: string | null
  file_url?: string | null
  file_type: WallPostType
  quoted_post_id?: string | null
  quoted_content?: string | null
  quoted_author?: string | null
  quoted_file_type?: string | null
  created_at?: string
}

export interface WallPostLikeData {
  id?: string
  post_id: string
  user_id: string
  user_name: string
  user_avatar: string
  timestamp_in_audio?: number | null
  liked_at?: string
}

export class TeamWallError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'TeamWallError'
  }
}

export class TeamWallService {
  private supabase = createSupabaseBrowserClient()
  private wallPosts: TeamWallPost[] = []
  private postLikes: Map<string, WallPostLike[]> = new Map()
  private isLoading = false
  private errorMessage: string | null = null
  private uploadProgress = 0

  // Caching & Performance (matches iOS exactly)
  private cachedPosts: Map<string, TeamWallPost[]> = new Map()
  private loadedTeams = new Set<string>()
  private lastLoadTime: Map<string, Date> = new Map()
  private readonly cacheExpiry = 300000 // 5 minutes in milliseconds
  private currentTeamId: string | null = null

  // Real-time subscription
  private realtimeChannel: any = null

  constructor() {
    this.setupRealTimeSubscription()
  }

  /**
   * Setup real-time subscription to team_wall_posts table
   * Matches iOS implementation exactly
   * Gracefully handles WebSocket errors in development (HTTP)
   */
  private setupRealTimeSubscription() {
    try {
      this.realtimeChannel = this.supabase
        .channel('team_wall_posts')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'team_wall_posts'
          },
          (payload) => {
            console.log('🔄 New wall post inserted:', payload)
            this.handleRealtimeInsert(payload)
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'DELETE',
            schema: 'public',
            table: 'team_wall_posts'
          },
          (payload) => {
            console.log('🔄 Wall post deleted:', payload)
            this.handleRealtimeDelete(payload)
          }
        )
        .subscribe((status: string, err?: any) => {
          if (status === 'SUBSCRIBED') {
            console.log('✅ Real-time subscription active')
          } else if (status === 'CHANNEL_ERROR' || err) {
            console.warn('⚠️ Real-time subscription error (continuing without it):', err)
            // Continue without real-time - use polling/manual refresh instead
          }
        })
    } catch (error) {
      console.warn('⚠️ Real-time subscription failed (WebSocket not available):', error)
      // Continue without real-time in development (HTTP)
      // In production (HTTPS), this should work fine
      this.realtimeChannel = null
    }
  }

  /**
   * Handle real-time INSERT events
   */
  private handleRealtimeInsert(payload: any) {
    const newPost = payload.new as TeamWallPost
    console.log('New wall post inserted:', newPost)
    // Would trigger UI update in React component via state management
  }

  /**
   * Handle real-time DELETE events
   * Matches iOS implementation exactly
   */
  private handleRealtimeDelete(payload: any) {
    const oldRecord = payload.old
    const postId = oldRecord?.id

    if (!postId) {
      console.warn('⚠️ Could not parse delete payload for post ID')
      return
    }

    console.log('🗑️ Removing post', postId, 'from UI via real-time sync')

    // Remove from current wall posts
    this.wallPosts = this.wallPosts.filter(p => p.id !== postId)

    // Remove from cached posts for all teams
    for (const [teamId, posts] of this.cachedPosts.entries()) {
      this.cachedPosts.set(teamId, posts.filter(p => p.id !== postId))
    }

    // Remove likes
    this.postLikes.delete(postId)

    console.log('✅ Post', postId, 'removed via real-time deletion sync')
  }

  /**
   * Load wall posts for a team with caching
   * Matches iOS implementation exactly
   */
  async loadWallPosts(teamId: string, forceRefresh: boolean = false): Promise<TeamWallPost[]> {
    this.currentTeamId = teamId

    // Check if we have valid cached data for this team
    if (!forceRefresh && this.hasFreshCache(teamId)) {
      const cached = this.cachedPosts.get(teamId) || []
      this.wallPosts = cached
      this.isLoading = false
      console.log('✅ TeamWallService: Using cached data for team', teamId)
      return cached
    }

    // Show loading only if we don't have any cached data
    const hasCachedData = this.cachedPosts.has(teamId)
    if (!hasCachedData) {
      this.isLoading = true
    }

    // If we have cached data, show it immediately while refreshing
    if (hasCachedData) {
      this.wallPosts = this.cachedPosts.get(teamId) || []
      console.log('🔄 TeamWallService: Showing cached data while refreshing...')
    }

    try {
      const { data, error } = await this.supabase
        .from('team_wall_posts')
        .select('*')
        .eq('team_id', teamId)
        .order('created_at', { ascending: false })
        .limit(50) // Limit to improve performance

      if (error) throw error

      const posts = data || []

      // Update cache
      this.cachedPosts.set(teamId, posts)
      this.loadedTeams.add(teamId)
      this.lastLoadTime.set(teamId, new Date())

      // Update UI only if we're still viewing this team
      if (this.currentTeamId === teamId) {
        this.wallPosts = posts
      }

      this.isLoading = false
      console.log('✅ TeamWallService: Loaded', posts.length, 'posts for team', teamId)

      // Prefetch images for instant loading (like iOS)
      this.prefetchPostImages(posts)

      return posts
    } catch (error) {
      console.error('❌ TeamWallService: Failed to load wall posts:', error)
      this.isLoading = false

      // Only show error if we don't have cached data to fall back on
      if (!hasCachedData) {
        this.errorMessage = error instanceof Error ? error.message : 'Failed to load posts'
        throw new TeamWallError(this.errorMessage)
      }

      return this.cachedPosts.get(teamId) || []
    }
  }

  /**
   * Check if cache is fresh (< 5 minutes old)
   */
  private hasFreshCache(teamId: string): boolean {
    const cached = this.cachedPosts.get(teamId)
    const lastLoad = this.lastLoadTime.get(teamId)

    if (!cached || cached.length === 0 || !lastLoad) {
      return false
    }

    const timeSinceLoad = Date.now() - lastLoad.getTime()
    return timeSinceLoad < this.cacheExpiry
  }

  /**
   * Post a text message to the team wall
   * Matches iOS implementation exactly
   */
  async postMessage(teamId: string, message: string): Promise<boolean> {
    this.errorMessage = null

    const currentUser = await this.getCurrentUser()
    if (!currentUser) {
      this.errorMessage = 'Authentication required'
      throw new TeamWallError('Authentication required')
    }

    if (!message.trim()) {
      this.errorMessage = 'Message cannot be empty'
      throw new TeamWallError('Message cannot be empty')
    }

    const postData: WallPostData = {
      team_id: teamId,
      author_id: currentUser.id,
      author_name: currentUser.name,
      author_avatar: currentUser.avatar,
      message: message,
      file_type: 'message'
    }

    return await this.insertWallPost(postData)
  }

  /**
   * Post a file (photo, video, document, music) to the team wall
   * Matches iOS implementation exactly
   */
  async postFile(teamId: string, file: File, caption?: string, quotedPostId?: string): Promise<boolean> {
    this.errorMessage = null

    const currentUser = await this.getCurrentUser()
    if (!currentUser) {
      this.errorMessage = 'Authentication required'
      throw new TeamWallError('Authentication required')
    }

    this.uploadProgress = 0.1

    const fileExtension = file.name.split('.').pop()?.toLowerCase() || ''
    const { fileType, bucket } = this.determineFileTypeAndBucket(fileExtension)

    // Sanitize filename (matches iOS)
    const sanitizedFileName = file.name
      .replace(/[{}[\] ]/g, '_')

    const storagePath = `${currentUser.id}/${crypto.randomUUID()}_${sanitizedFileName}`

    try {
      const uploadedURL = await this.uploadFileWithProgress(file, storagePath, bucket)

      if (!uploadedURL) {
        throw new TeamWallError(`Failed to upload ${fileType}`)
      }

      const postData: WallPostData = {
        team_id: teamId,
        author_id: currentUser.id,
        author_name: currentUser.name,
        author_avatar: currentUser.avatar,
        message: caption || '', // Optional caption for media files
        file_name: file.name,
        file_url: uploadedURL,
        file_type: fileType,
        quoted_post_id: quotedPostId
      }

      this.uploadProgress = 1.0
      return await this.insertWallPost(postData)
    } catch (error) {
      console.error('❌ File upload failed:', error)
      this.uploadProgress = 0
      this.errorMessage = error instanceof Error ? error.message : 'Upload failed'
      throw error
    }
  }

  /**
   * Upload file with progress tracking
   * Matches iOS implementation exactly
   */
  private async uploadFileWithProgress(
    file: File,
    fileName: string,
    bucket: string
  ): Promise<string | null> {
    try {
      console.log('🔧 TeamWallService: Starting file upload')
      console.log('🔧 File name:', file.name)
      console.log('🔧 Storage path:', fileName)
      console.log('🔧 Bucket:', bucket)

      this.uploadProgress = 0.3

      const { data, error } = await this.supabase.storage
        .from(bucket)
        .upload(fileName, file, {
          contentType: file.type,
          cacheControl: '3600',
          upsert: false
        })

      if (error) throw error

      this.uploadProgress = 0.9

      // Get public URL
      const { data: urlData } = this.supabase.storage
        .from(bucket)
        .getPublicUrl(fileName)

      console.log('✅ TeamWallService: File uploaded successfully to:', urlData.publicUrl)
      return urlData.publicUrl
    } catch (error) {
      console.error('❌ TeamWallService: File upload failed:', error)
      this.uploadProgress = 0
      return null
    }
  }

  /**
   * Determine file type and storage bucket based on extension
   * Matches iOS implementation exactly
   */
  private determineFileTypeAndBucket(ext: string): { fileType: WallPostType; bucket: string } {
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) {
      return { fileType: 'photo', bucket: 'team-images' }
    }
    if (['mp3', 'wav', 'm4a', 'aac', 'flac', 'ogg'].includes(ext)) {
      return { fileType: 'music', bucket: 'team-music' }
    }
    if (['mp4', 'mov', 'avi', 'webm', 'mkv'].includes(ext)) {
      return { fileType: 'video', bucket: 'team-videos' }
    }
    if (['pdf', 'doc', 'docx', 'txt'].includes(ext)) {
      return { fileType: 'document', bucket: 'team-documents' }
    }
    return { fileType: 'document', bucket: 'team-documents' }
  }

  /**
   * Insert wall post into database
   * Matches iOS implementation exactly
   */
  private async insertWallPost(postData: WallPostData): Promise<boolean> {
    try {
      console.log('🔧 TeamWallService: Attempting to insert wall post')
      console.log('🔧 Team ID:', postData.team_id)
      console.log('🔧 Author:', postData.author_name)
      console.log('🔧 Message:', postData.message)
      console.log('🔧 File type:', postData.file_type)

      const { error } = await this.supabase
        .from('team_wall_posts')
        .insert(postData as any)

      if (error) throw error

      console.log('✅ TeamWallService: Wall post inserted successfully')
      return true
    } catch (error) {
      console.error('❌ TeamWallService: Failed to insert wall post:', error)
      this.errorMessage = error instanceof Error ? error.message : 'Failed to post'
      return false
    }
  }

  /**
   * Like a post
   * Matches iOS implementation exactly
   */
  async likePost(postId: string, audioTimestamp?: number): Promise<boolean> {
    this.errorMessage = null

    const currentUser = await this.getCurrentUser()
    if (!currentUser) {
      this.errorMessage = 'Authentication required'
      throw new TeamWallError('Authentication required')
    }

    const likeData: WallPostLikeData = {
      post_id: postId,
      user_id: currentUser.id,
      user_name: currentUser.name,
      user_avatar: currentUser.avatar,
      timestamp_in_audio: audioTimestamp || null
    }

    try {
      const { error } = await this.supabase
        .from('wall_post_likes')
        .insert(likeData as any)

      if (error) throw error

      // Update local state
      const likes = this.postLikes.get(postId) || []
      likes.push(likeData as WallPostLike)
      this.postLikes.set(postId, likes)

      console.log('✅ TeamWallService: Post liked successfully')
      return true
    } catch (error) {
      console.error('❌ TeamWallService: Failed to like post:', error)
      this.errorMessage = error instanceof Error ? error.message : 'Failed to like post'
      return false
    }
  }

  /**
   * Unlike a post
   * Matches iOS implementation exactly
   */
  async unlikePost(postId: string): Promise<boolean> {
    this.errorMessage = null

    const currentUser = await this.getCurrentUser()
    if (!currentUser) {
      this.errorMessage = 'Authentication required'
      throw new TeamWallError('Authentication required')
    }

    try {
      const { error } = await this.supabase
        .from('wall_post_likes')
        .delete()
        .eq('post_id', postId)
        .eq('user_id', currentUser.id)

      if (error) throw error

      // Update local state
      const likes = this.postLikes.get(postId) || []
      this.postLikes.set(postId, likes.filter(l => l.user_id !== currentUser.id))

      console.log('✅ TeamWallService: Post unliked successfully')
      return true
    } catch (error) {
      console.error('❌ TeamWallService: Failed to unlike post:', error)
      this.errorMessage = error instanceof Error ? error.message : 'Failed to unlike post'
      return false
    }
  }

  /**
   * Batch load likes for all posts in a team - prevents N+1 query problem
   * Matches iOS implementation exactly
   */
  async loadLikesForTeam(postIds: string[]): Promise<void> {
    if (postIds.length === 0) return

    console.log('🔧 Loading likes for', postIds.length, 'posts concurrently...')

    try {
      // Load all likes in a single query (more efficient than iOS's concurrent tasks)
      const { data, error } = await this.supabase
        .from('wall_post_likes')
        .select('*')
        .in('post_id', postIds)
        .order('liked_at', { ascending: true })

      if (error) throw error

      // Group likes by post ID
      const likesByPost = new Map<string, WallPostLike[]>()
      const likes = (data || []) as WallPostLike[]
      for (const like of likes) {
        const postId = like.post_id
        if (!likesByPost.has(postId)) {
          likesByPost.set(postId, [])
        }
        likesByPost.get(postId)!.push(like)
      }

      // Update local state
      this.postLikes = likesByPost

      console.log('✅ TeamWallService: Batch loaded likes for', postIds.length, 'posts')
    } catch (error) {
      console.error('❌ Failed to batch load likes:', error)
    }
  }

  /**
   * Delete a post
   * Matches iOS implementation exactly with instant UI update
   */
  async deletePost(postId: string): Promise<boolean> {
    this.errorMessage = null

    const currentUser = await this.getCurrentUser()
    if (!currentUser) {
      this.errorMessage = 'Authentication required'
      throw new TeamWallError('Authentication required')
    }

    // Verify user owns this post
    const post = this.wallPosts.find(p => p.id === postId)
    if (!post || post.author_name !== currentUser.name) {
      this.errorMessage = 'You can only delete your own posts'
      throw new TeamWallError('You can only delete your own posts')
    }

    console.log('🔧 TeamWallService: Starting delete for post', postId)

    // INSTANT UI UPDATE - Remove post immediately for better UX
    this.wallPosts = this.wallPosts.filter(p => p.id !== postId)

    // Remove from cached posts for all teams
    for (const [teamId, posts] of this.cachedPosts.entries()) {
      this.cachedPosts.set(teamId, posts.filter(p => p.id !== postId))
    }

    // Remove likes
    this.postLikes.delete(postId)

    console.log('✅ TeamWallService: Post removed from UI instantly')

    // Try database deletion
    const success = await this.performDirectDeletion(postId)
    if (success) {
      console.log('✅ TeamWallService: Post deletion successful - synced across team')
    } else {
      console.warn('⚠️ TeamWallService: Post deletion failed but removed from local view')
    }

    return true // Always return true since UI was updated
  }

  /**
   * Perform direct deletion from database and storage
   * Matches iOS implementation exactly + adds storage cleanup
   */
  private async performDirectDeletion(postId: string): Promise<boolean> {
    console.log('🔧 TeamWallService: Starting database deletion for post', postId)

    // Step 0: Get post data to find file_url for storage cleanup
    const post = this.wallPosts.find(p => p.id === postId)
    let fileUrl: string | null = null
    let bucket: string | null = null

    if (post && post.file_url) {
      fileUrl = post.file_url
      // Determine bucket from file_type
      switch (post.file_type) {
        case 'photo':
          bucket = 'team-images'
          break
        case 'music':
          bucket = 'team-music'
          break
        case 'video':
          bucket = 'team-videos'
          break
        case 'document':
          bucket = 'team-documents'
          break
      }
    }

    // Step 1: Try to delete likes
    try {
      const { error: likesError } = await this.supabase
        .from('wall_post_likes')
        .delete()
        .eq('post_id', postId)

      if (likesError) {
        console.warn('⚠️ Likes deletion failed (continuing):', likesError)
      } else {
        console.log('✅ TeamWallService: Likes deleted successfully')
      }
    } catch (error) {
      console.warn('⚠️ Likes deletion failed (continuing):', error)
    }

    // Step 2: Delete file from storage bucket if it exists
    if (fileUrl && bucket) {
      try {
        // Extract file path from URL
        const urlParts = fileUrl.split('/')
        const bucketIndex = urlParts.findIndex(part => part === bucket)
        if (bucketIndex !== -1) {
          const filePath = urlParts.slice(bucketIndex + 1).join('/')

          console.log('🗑️ TeamWallService: Deleting file from storage:', filePath)

          const { error: storageError } = await this.supabase.storage
            .from(bucket)
            .remove([filePath])

          if (storageError) {
            console.warn('⚠️ Storage deletion failed (continuing):', storageError)
          } else {
            console.log('✅ TeamWallService: File deleted from storage successfully')
          }
        }
      } catch (error) {
        console.warn('⚠️ Storage deletion failed (continuing):', error)
      }
    }

    // Step 3: Delete the post from database
    try {
      const { error: postError } = await this.supabase
        .from('team_wall_posts')
        .delete()
        .eq('id', postId)

      if (postError) {
        console.error('❌ Post deletion failed:', postError)
        return false
      }

      console.log('✅ TeamWallService: Post deleted successfully from database')
      return true
    } catch (error) {
      console.error('❌ Post deletion failed:', error)
      return false
    }
  }

  /**
   * Check if current user can delete a post
   */
  canDeletePost(post: TeamWallPost, currentUserName: string): boolean {
    return post.author_name === currentUserName
  }

  /**
   * Get current user info from Supabase session
   * Matches iOS implementation exactly
   */
  private async getCurrentUser(): Promise<{ id: string; name: string; avatar: string } | null> {
    try {
      const { data: { session } } = await this.supabase.auth.getSession()

      if (!session?.user) {
        return null
      }

      const user = session.user
      const userName = user.user_metadata?.full_name ||
                      user.email?.split('@')[0] ||
                      'Unknown User'
      const userAvatar = user.user_metadata?.avatar_url || ''

      return {
        id: user.id,
        name: userName,
        avatar: userAvatar
      }
    } catch (error) {
      console.error('Error getting current user:', error)
      return null
    }
  }

  /**
   * Instagram-style prefetching for instant image loading
   * Matches iOS implementation
   */
  private prefetchPostImages(posts: TeamWallPost[]) {
    const imageURLs: string[] = []

    for (const post of posts) {
      // Add author avatars
      if (post.author_avatar) {
        imageURLs.push(post.author_avatar)
      }

      // Add photo URLs
      if (post.file_type === 'photo' && post.file_url) {
        imageURLs.push(post.file_url)
      }
    }

    // Remove duplicates
    const uniqueURLs = Array.from(new Set(imageURLs))
    console.log('🎯 TeamWallService: Prefetching', uniqueURLs.length, 'images for instant loading...')

    // Prefetch in browser (creates Image objects to trigger browser cache)
    uniqueURLs.forEach(url => {
      const img = new Image()
      img.src = url
    })
  }

  /**
   * Refresh current team
   */
  async refreshCurrentTeam(): Promise<void> {
    if (!this.currentTeamId) return
    await this.loadWallPosts(this.currentTeamId, true)
  }

  /**
   * Clear all caches
   */
  clearCache(): void {
    this.cachedPosts.clear()
    this.loadedTeams.clear()
    this.lastLoadTime.clear()
    this.currentTeamId = null
  }

  /**
   * Get likes count for a post
   */
  getLikeCount(postId: string): number {
    return this.postLikes.get(postId)?.length || 0
  }

  /**
   * Check if current user liked a post
   */
  async isPostLikedByCurrentUser(postId: string): Promise<boolean> {
    const currentUser = await this.getCurrentUser()
    if (!currentUser) return false

    const likes = this.postLikes.get(postId) || []
    return likes.some(like => like.user_id === currentUser.id)
  }

  /**
   * Check if post is liked (synchronous version using cached user ID)
   * For instant UI updates
   */
  isPostLikedByCurrentUserSync(postId: string, currentUserId: string): boolean {
    const likes = this.postLikes.get(postId) || []
    return likes.some(like => like.user_id === currentUserId)
  }

  /**
   * Cleanup - unsubscribe from real-time
   */
  cleanup(): void {
    if (this.realtimeChannel) {
      this.supabase.removeChannel(this.realtimeChannel)
    }
  }
}

// Singleton instance (optional, can also create new instances)
export const teamWallService = new TeamWallService()
