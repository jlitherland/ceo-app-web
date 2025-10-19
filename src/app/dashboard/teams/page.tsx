'use client'

/**
 * Teams Page
 * Displays team wall with posts, likes, and file uploads
 * Exact port of iOS BeautifulTeamView
 */

import { useEffect, useState } from 'react'
import { TeamWallService } from '@/lib/services/teamWallService'
import { versionService } from '@/lib/services/versionService'
import type { TeamWallPost, Team, TrackVersion } from '@/lib/types/database'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import { Users, Plus, Send, Image as ImageIcon, FileText, Music, Video, RefreshCw, LogOut, Trash2, Settings } from 'lucide-react'
import { WaveformAudioPlayer } from '@/components/audio/WaveformAudioPlayer'

export default function TeamsPage() {
  const [teams, setTeams] = useState<Team[]>([])
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null)
  const [wallPosts, setWallPosts] = useState<TeamWallPost[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [isPosting, setIsPosting] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [showCreateTeamModal, setShowCreateTeamModal] = useState(false)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [inviteLink, setInviteLink] = useState('')
  const [copySuccess, setCopySuccess] = useState(false)
  const [newTeamName, setNewTeamName] = useState('')
  const [newTeamDescription, setNewTeamDescription] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [filePreview, setFilePreview] = useState<string | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [teamWallService] = useState(() => new TeamWallService())
  const [showTeamSettingsModal, setShowTeamSettingsModal] = useState(false)
  const [teamAvatarFile, setTeamAvatarFile] = useState<File | null>(null)
  const [teamAvatarPreview, setTeamAvatarPreview] = useState<string | null>(null)
  const [teamTagline, setTeamTagline] = useState('')
  const [teamBackgroundFile, setTeamBackgroundFile] = useState<File | null>(null)
  const [teamBackgroundPreview, setTeamBackgroundPreview] = useState<string | null>(null)
  const [isSavingSettings, setIsSavingSettings] = useState(false)
  const [feedFilter, setFeedFilter] = useState<'all' | 'audio' | 'visual' | 'text'>('all')
  const [postVersions, setPostVersions] = useState<Map<string, TrackVersion[]>>(new Map())
  const supabase = createSupabaseBrowserClient()

  // Filter posts based on selected filter
  const filteredPosts = wallPosts.filter(post => {
    if (feedFilter === 'all') return true
    if (feedFilter === 'audio') return post.file_type === 'music' || post.file_type === 'audio'
    if (feedFilter === 'visual') return post.file_type === 'photo' || post.file_type === 'video'
    if (feedFilter === 'text') return post.file_type === 'text' || !post.file_type || post.file_type === ''
    return true
  })

  // Load current user ID
  useEffect(() => {
    async function loadUser() {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        setCurrentUserId(session.user.id)
      }
    }
    loadUser()
  }, [])

  // Load user's teams
  useEffect(() => {
    loadTeams()
  }, [])

  // Load wall posts when team is selected
  useEffect(() => {
    if (selectedTeam) {
      loadWallPosts(selectedTeam.id)
    }
  }, [selectedTeam])

  async function loadTeams() {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        console.log('No session found')
        setIsLoading(false)
        return
      }

      console.log('Loading teams for user:', session.user.id)

      // First, get teams created by the user
      const { data: ownedTeams, error: ownedError } = await supabase
        .from('teams')
        .select('*')
        .eq('owner_id', session.user.id)
        .order('created_at', { ascending: false })

      if (ownedError) {
        console.error('Error loading owned teams - Full error:', JSON.stringify(ownedError, null, 2))
        console.error('Error details:', {
          message: ownedError.message,
          details: ownedError.details,
          hint: ownedError.hint,
          code: ownedError.code
        })
        throw ownedError
      }

      console.log('Owned teams:', ownedTeams)

      // Then, get teams where user is a member
      const { data: memberTeams, error: memberError } = await supabase
        .from('team_members')
        .select('team_id, teams(*)')
        .eq('user_id', session.user.id)
        .eq('status', 'active')

      if (memberError) {
        console.error('Error loading member teams:', memberError)
        // Don't throw here, just use owned teams
      }

      console.log('Member teams:', memberTeams)

      // Combine both lists, removing duplicates
      const allTeams: Team[] = [...(ownedTeams || [])]

      if (memberTeams) {
        memberTeams.forEach((member: any) => {
          if (member.teams && !allTeams.find(t => t.id === member.teams.id)) {
            allTeams.push(member.teams)
          }
        })
      }

      console.log('All teams:', allTeams)

      setTeams(allTeams)
      if (allTeams.length > 0) {
        setSelectedTeam(allTeams[0])
      }
      setIsLoading(false)
    } catch (error) {
      console.error('Error loading teams:', error)
      setIsLoading(false)
    }
  }

  async function loadWallPosts(teamId: string) {
    try {
      setIsLoading(true)
      const posts = await teamWallService.loadWallPosts(teamId)
      setWallPosts(posts)

      // Load likes for all posts
      const postIds = posts.map(p => p.id)
      await teamWallService.loadLikesForTeam(postIds)

      // Load versions for audio posts
      const audioPosts = posts.filter(p => p.file_type === 'music' || p.file_type === 'audio')
      const versionsMap = new Map<string, TrackVersion[]>()

      for (const post of audioPosts) {
        const versions = await versionService.getVersions(post.id)
        if (versions.length > 0) {
          versionsMap.set(post.id, versions)
        }
      }

      setPostVersions(versionsMap)
      setIsLoading(false)
    } catch (error) {
      console.error('Error loading wall posts:', error)
      setIsLoading(false)
    }
  }

  async function handlePostMessage() {
    if (!selectedTeam || !message.trim()) return

    setIsPosting(true)
    try {
      const success = await teamWallService.postMessage(selectedTeam.id, message)
      if (success) {
        setMessage('')
        // Reload posts
        await loadWallPosts(selectedTeam.id)
      }
    } catch (error) {
      console.error('Error posting message:', error)
    }
    setIsPosting(false)
  }

  function handleFileSelect(event: React.ChangeEvent<HTMLInputElement>) {
    if (!event.target.files || event.target.files.length === 0) return

    const file = event.target.files[0]
    setSelectedFile(file)

    // Create preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setFilePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    } else {
      setFilePreview(null)
    }
  }

  function clearFileSelection() {
    setSelectedFile(null)
    setFilePreview(null)
  }

  async function handleFileUpload() {
    if (!selectedTeam || !selectedFile) return

    setIsPosting(true)

    try {
      const success = await teamWallService.postFile(selectedTeam.id, selectedFile, message.trim())
      if (success) {
        setMessage('')
        clearFileSelection()
        // Reload posts
        await loadWallPosts(selectedTeam.id)
      }
    } catch (error) {
      console.error('Error uploading file:', error)
      alert('Failed to upload file. Please try again.')
    }

    setIsPosting(false)
  }

  async function handleGenerateInviteLink() {
    if (!selectedTeam) return

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      // Create an invite token (you could store this in database for tracking)
      const inviteToken = btoa(`${selectedTeam.id}:${Date.now()}`)
      const link = `${window.location.origin}/invite/${inviteToken}`

      setInviteLink(link)
      setShowInviteModal(true)
    } catch (error) {
      console.error('Error generating invite link:', error)
    }
  }

  async function handleCopyInviteLink() {
    try {
      await navigator.clipboard.writeText(inviteLink)
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 2000)
    } catch (error) {
      console.error('Error copying to clipboard:', error)
    }
  }

  async function handleLikePost(postId: string) {
    try {
      const isLiked = await teamWallService.isPostLikedByCurrentUser(postId)

      // Optimistic update - trigger re-render immediately
      setWallPosts([...wallPosts])

      if (isLiked) {
        await teamWallService.unlikePost(postId)
      } else {
        await teamWallService.likePost(postId)
      }

      // Force another re-render to show the updated like state
      setWallPosts([...wallPosts])
    } catch (error) {
      console.error('Error liking post:', error)
      // On error, reload to sync with server state
      if (selectedTeam) {
        await loadWallPosts(selectedTeam.id)
      }
    }
  }

  async function handleDeletePost(postId: string) {
    if (!confirm('Are you sure you want to delete this post?')) return

    try {
      await teamWallService.deletePost(postId)
      // Reload posts
      if (selectedTeam) {
        await loadWallPosts(selectedTeam.id)
      }
    } catch (error) {
      console.error('Error deleting post:', error)
    }
  }

  async function handleRefresh() {
    if (!selectedTeam) return
    setIsRefreshing(true)
    try {
      await teamWallService.refreshCurrentTeam()
      const posts = await teamWallService.loadWallPosts(selectedTeam.id, true)
      setWallPosts(posts)
      const postIds = posts.map(p => p.id)
      await teamWallService.loadLikesForTeam(postIds)
    } catch (error) {
      console.error('Error refreshing:', error)
    }
    setIsRefreshing(false)
  }

  function handleOpenTeamSettings() {
    if (!selectedTeam) return

    // Pre-fill existing settings
    setTeamTagline(selectedTeam.tagline || '')
    setTeamAvatarPreview(selectedTeam.avatar_url || null)
    setTeamBackgroundPreview(selectedTeam.background_image_url || null)
    setShowTeamSettingsModal(true)
  }

  function handleTeamAvatarSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      setTeamAvatarFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setTeamAvatarPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  function handleTeamBackgroundSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      setTeamBackgroundFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setTeamBackgroundPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  async function handleSaveTeamSettings() {
    if (!selectedTeam || !currentUserId) return

    // Only team owner can update settings
    if (selectedTeam.owner_id !== currentUserId) {
      alert('Only the team owner can update settings')
      return
    }

    setIsSavingSettings(true)
    try {
      let avatarUrl = selectedTeam.avatar_url
      let backgroundUrl = selectedTeam.background_image_url

      // Upload avatar if new file selected
      if (teamAvatarFile) {
        const fileExt = teamAvatarFile.name.split('.').pop()
        const fileName = `${selectedTeam.id}-avatar-${Date.now()}.${fileExt}`
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('team-assets')
          .upload(fileName, teamAvatarFile, { upsert: true })

        if (uploadError) throw uploadError

        const { data: { publicUrl } } = supabase.storage
          .from('team-assets')
          .getPublicUrl(fileName)

        avatarUrl = publicUrl
      }

      // Upload background if new file selected
      if (teamBackgroundFile) {
        const fileExt = teamBackgroundFile.name.split('.').pop()
        const fileName = `${selectedTeam.id}-background-${Date.now()}.${fileExt}`
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('team-assets')
          .upload(fileName, teamBackgroundFile, { upsert: true })

        if (uploadError) throw uploadError

        const { data: { publicUrl } } = supabase.storage
          .from('team-assets')
          .getPublicUrl(fileName)

        backgroundUrl = publicUrl
      }

      // Update team record
      const { error: updateError } = await supabase
        .from('teams')
        .update({
          tagline: teamTagline.trim() || null,
          avatar_url: avatarUrl,
          background_image_url: backgroundUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedTeam.id)

      if (updateError) throw updateError

      // Reload teams to show updated data
      await loadTeams()

      // Close modal and reset state
      setShowTeamSettingsModal(false)
      setTeamAvatarFile(null)
      setTeamBackgroundFile(null)
      setTeamTagline('')
      setTeamAvatarPreview(null)
      setTeamBackgroundPreview(null)

    } catch (error) {
      console.error('Error saving team settings:', error)
      alert('Failed to save team settings. Please try again.')
    }
    setIsSavingSettings(false)
  }

  async function handleCreateTeam() {
    if (!newTeamName.trim()) return

    setIsCreating(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        console.error('No session found when creating team')
        return
      }

      console.log('Creating team with user ID:', session.user.id)

      const { data, error } = await supabase
        .from('teams')
        .insert({
          name: newTeamName.trim(),
          description: newTeamDescription.trim() || '',
          owner_id: session.user.id
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating team - Full error:', JSON.stringify(error, null, 2))
        console.error('Error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        })
        throw error
      }

      console.log('Team created successfully:', data)

      // Close modal and reset form
      setShowCreateTeamModal(false)
      setNewTeamName('')
      setNewTeamDescription('')

      // Reload teams
      await loadTeams()
    } catch (error: any) {
      console.error('Error creating team:', error)
      const errorMessage = error?.message || 'Failed to create team. Please try again.'
      alert(`Error: ${errorMessage}`)
    }
    setIsCreating(false)
  }

  async function handleLeaveOrDisbandTeam() {
    if (!selectedTeam) return

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    const isOwner = selectedTeam.owner_id === session.user.id

    const confirmMessage = isOwner
      ? `Are you sure you want to disband "${selectedTeam.name}"? This will delete the team and all its posts permanently.`
      : `Are you sure you want to leave "${selectedTeam.name}"?`

    if (!confirm(confirmMessage)) return

    try {
      if (isOwner) {
        // Owner disbands team - delete the entire team
        const { error } = await supabase
          .from('teams')
          .delete()
          .eq('id', selectedTeam.id)

        if (error) throw error
      } else {
        // Member leaves team - remove from team_members
        const { error } = await supabase
          .from('team_members')
          .delete()
          .eq('team_id', selectedTeam.id)
          .eq('user_id', session.user.id)

        if (error) throw error
      }

      // Reload teams
      setSelectedTeam(null)
      await loadTeams()
    } catch (error) {
      console.error('Error leaving/disbanding team:', error)
      alert('Failed to complete action. Please try again.')
    }
  }

  function formatTimestamp(timestamp: string): string {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 1) return 'just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  if (isLoading && teams.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#1a1a1a]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-orange mx-auto mb-4"></div>
          <p className="text-gray-500 text-sm">Loading teams...</p>
        </div>
      </div>
    )
  }

  if (teams.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#1a1a1a]">
        <div className="text-center">
          <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">No Teams Yet</h2>
          <p className="text-gray-500 mb-6 text-sm">Create your first team to get started</p>
          <button
            onClick={() => setShowCreateTeamModal(true)}
            className="bg-brand-orange text-white px-6 py-2.5 rounded-lg hover:bg-brand-orange-dark transition-colors flex items-center gap-2 mx-auto text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            Create Team
          </button>
        </div>

        {/* Create Team Modal */}
        {showCreateTeamModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowCreateTeamModal(false)}>
            <div className="bg-[#2a2a2a] rounded-xl p-6 w-full max-w-md mx-4 border border-white/10" onClick={(e) => e.stopPropagation()}>
              <h2 className="text-xl font-semibold text-white mb-5">Create New Team</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-2 uppercase tracking-wide">
                    Team Name
                  </label>
                  <input
                    type="text"
                    value={newTeamName}
                    onChange={(e) => setNewTeamName(e.target.value)}
                    placeholder="e.g., Production Team"
                    className="w-full bg-white/5 text-white px-4 py-2.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-orange/50 placeholder-gray-600 text-sm"
                    disabled={isCreating}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-2 uppercase tracking-wide">
                    Description (Optional)
                  </label>
                  <textarea
                    value={newTeamDescription}
                    onChange={(e) => setNewTeamDescription(e.target.value)}
                    placeholder="What's this team for?"
                    rows={3}
                    className="w-full bg-white/5 text-white px-4 py-2.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-orange/50 placeholder-gray-600 text-sm resize-none"
                    disabled={isCreating}
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => {
                      setShowCreateTeamModal(false)
                      setNewTeamName('')
                      setNewTeamDescription('')
                    }}
                    className="flex-1 px-4 py-2.5 bg-white/5 text-white rounded-lg hover:bg-white/10 transition-colors text-sm font-medium"
                    disabled={isCreating}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateTeam}
                    disabled={!newTeamName.trim() || isCreating}
                    className="flex-1 px-4 py-2.5 bg-brand-orange text-white rounded-lg hover:bg-brand-orange-dark disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                  >
                    {isCreating ? 'Creating...' : 'Create Team'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-white relative">
      {/* Background Image with translucent overlay */}
      {selectedTeam?.background_image_url && (
        <div className="fixed inset-0 z-0">
          <img
            src={selectedTeam.background_image_url}
            alt="Team background"
            className="w-full h-full object-cover opacity-10"
          />
        </div>
      )}

      {/* Content */}
      <div className="relative z-10">
        {/* Minimal Header */}
        <div className="sticky top-0 z-20 bg-[#1a1a1a]/95 backdrop-blur-sm border-b border-white/5">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {/* Team Avatar and Name */}
                {selectedTeam ? (
                  <div className="flex items-center gap-3">
                    {selectedTeam.avatar_url ? (
                      <img
                        src={selectedTeam.avatar_url}
                        alt={selectedTeam.name}
                        className="w-10 h-10 rounded-full object-cover border-2 border-brand-orange/30"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-brand-orange/10 flex items-center justify-center border-2 border-brand-orange/30">
                        <Users className="w-5 h-5 text-brand-orange" />
                      </div>
                    )}
                    <div>
                      <h1 className="text-xl font-semibold text-white">{selectedTeam.name}</h1>
                      {selectedTeam.tagline && (
                        <p className="text-xs text-gray-400 -mt-0.5">{selectedTeam.tagline}</p>
                      )}
                    </div>
                  </div>
                ) : (
                  <h1 className="text-xl font-semibold text-white">Teams</h1>
                )}

                {/* Team Selector - inline pills */}
                {teams.length > 1 && (
                  <div className="flex gap-2">
                    {teams.map(team => (
                      <button
                        key={team.id}
                        onClick={() => setSelectedTeam(team)}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                          selectedTeam?.id === team.id
                            ? 'bg-brand-orange text-white'
                            : 'bg-white/5 text-gray-400 hover:bg-white/10'
                        }`}
                      >
                        {team.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            <div className="flex gap-2">
              {selectedTeam && (
                <>
                  {selectedTeam.owner_id === currentUserId && (
                    <button
                      onClick={handleOpenTeamSettings}
                      className="text-gray-400 hover:text-white p-2 rounded-lg hover:bg-white/5 transition-colors"
                      title="Team settings"
                    >
                      <Settings className="w-5 h-5" />
                    </button>
                  )}
                  <button
                    onClick={handleGenerateInviteLink}
                    className="text-gray-400 hover:text-white p-2 rounded-lg hover:bg-white/5 transition-colors"
                    title="Invite members"
                  >
                    <Users className="w-5 h-5" />
                  </button>
                  <button
                    onClick={handleLeaveOrDisbandTeam}
                    className="text-gray-400 hover:text-red-400 p-2 rounded-lg hover:bg-white/5 transition-colors"
                    title={selectedTeam.owner_id === currentUserId ? "Disband team" : "Leave team"}
                  >
                    {selectedTeam.owner_id === currentUserId ? (
                      <Trash2 className="w-5 h-5" />
                    ) : (
                      <LogOut className="w-5 h-5" />
                    )}
                  </button>
                </>
              )}
              <button
                onClick={() => setShowCreateTeamModal(true)}
                className="text-gray-400 hover:text-white p-2 rounded-lg hover:bg-white/5 transition-colors"
                title="Create team"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto">
        {selectedTeam && (
          <>
            {/* Minimal Message Composer - Fixed at bottom */}
            <div className="fixed bottom-0 left-0 right-0 bg-[#1a1a1a]/95 backdrop-blur-sm border-t border-white/5 z-10">
              <div className="max-w-4xl mx-auto px-4 py-3">
                {/* File Preview */}
                {selectedFile && (
                  <div className="mb-2">
                    {filePreview ? (
                      <div className="relative inline-block">
                        <img
                          src={filePreview}
                          alt="Preview"
                          className="h-20 w-20 object-cover rounded-lg"
                        />
                        <button
                          onClick={clearFileSelection}
                          className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs transition-colors"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <div className="inline-flex items-center gap-2 bg-white/5 rounded-lg px-3 py-2">
                        {selectedFile.type.startsWith('audio/') ? (
                          <Music className="w-4 h-4 text-brand-orange" />
                        ) : selectedFile.type.startsWith('video/') ? (
                          <Video className="w-4 h-4 text-brand-orange" />
                        ) : (
                          <FileText className="w-4 h-4 text-brand-orange" />
                        )}
                        <span className="text-xs text-white">{selectedFile.name}</span>
                        <button
                          onClick={clearFileSelection}
                          className="text-gray-400 hover:text-red-400 transition-colors ml-2"
                        >
                          ✕
                        </button>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        if (selectedFile) {
                          handleFileUpload()
                        } else {
                          handlePostMessage()
                        }
                      }
                    }}
                    placeholder={selectedFile ? "Add a caption..." : "Message..."}
                    className="flex-1 bg-white/5 text-white px-4 py-2 rounded-full text-sm focus:outline-none focus:ring-1 focus:ring-white/20 placeholder-gray-500"
                    disabled={isPosting}
                  />
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      onChange={handleFileSelect}
                      className="hidden"
                      accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.mp3,.wav,.m4a"
                      disabled={isPosting}
                    />
                    <div className={`p-2 rounded-full transition-colors ${selectedFile ? 'bg-brand-orange' : 'hover:bg-white/5'}`}>
                      <Plus className={`w-5 h-5 ${selectedFile ? 'text-white' : 'text-gray-400'}`} />
                    </div>
                  </label>
                  <button
                    onClick={selectedFile ? handleFileUpload : handlePostMessage}
                    disabled={(selectedFile ? !selectedFile : !message.trim()) || isPosting}
                    className="bg-brand-orange/10 text-brand-orange p-2 rounded-full hover:bg-brand-orange hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Smart Feed Filters */}
            {wallPosts.length > 0 && (
              <div className="px-4 pt-4 max-w-4xl mx-auto">
                <div className="flex gap-2 overflow-x-auto pb-2">
                  <button
                    onClick={() => setFeedFilter('all')}
                    className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap ${
                      feedFilter === 'all'
                        ? 'bg-brand-orange text-white'
                        : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    All Posts
                  </button>
                  <button
                    onClick={() => setFeedFilter('audio')}
                    className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap ${
                      feedFilter === 'audio'
                        ? 'bg-brand-orange text-white'
                        : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    Audio Only
                  </button>
                  <button
                    onClick={() => setFeedFilter('visual')}
                    className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap ${
                      feedFilter === 'visual'
                        ? 'bg-brand-orange text-white'
                        : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    Visual Only
                  </button>
                  <button
                    onClick={() => setFeedFilter('text')}
                    className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap ${
                      feedFilter === 'text'
                        ? 'bg-brand-orange text-white'
                        : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    Text/Discussion Only
                  </button>
                </div>
              </div>
            )}

            {/* Wall Posts - with bottom padding for fixed composer */}
            <div className="px-4 pt-4 pb-32 space-y-8 max-w-4xl mx-auto">
              {isLoading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-orange mx-auto"></div>
                </div>
              ) : filteredPosts.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500 text-sm">
                    {wallPosts.length === 0 ? 'No messages yet' : `No ${feedFilter === 'all' ? '' : feedFilter + ' '}posts found`}
                  </p>
                  {feedFilter !== 'all' && (
                    <button
                      onClick={() => setFeedFilter('all')}
                      className="mt-2 text-brand-orange text-sm hover:underline"
                    >
                      Show all posts
                    </button>
                  )}
                </div>
              ) : (
                filteredPosts.map(post => (
                  <div key={post.id}>
                    {/* Post Header */}
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-9 h-9 bg-gradient-to-br from-brand-orange to-brand-orange-dark rounded-full flex items-center justify-center text-xs font-semibold">
                        {post.author_name[0]}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-white text-sm">{post.author_name}</p>
                        <p className="text-xs text-gray-500">{formatTimestamp(post.created_at)}</p>
                      </div>
                      <button
                        onClick={() => handleLikePost(post.id)}
                        className={`transition-colors ${
                          currentUserId && teamWallService.isPostLikedByCurrentUserSync(post.id, currentUserId)
                            ? 'text-brand-orange'
                            : 'text-gray-600 hover:text-brand-orange'
                        }`}
                        title="Like"
                      >
                        <svg
                          className="w-5 h-5"
                          fill={currentUserId && teamWallService.isPostLikedByCurrentUserSync(post.id, currentUserId) ? 'currentColor' : 'none'}
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                          />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDeletePost(post.id)}
                        className="text-gray-600 hover:text-red-400 text-xs"
                      >
                        Delete
                      </button>
                    </div>

                    {/* Post Content */}
                    {post.message && (
                      <div className="mb-3">
                        <p className="text-white text-sm leading-relaxed">{post.message}</p>
                      </div>
                    )}

                    {post.file_type === 'photo' && post.file_url ? (
                      <img
                        src={post.file_url}
                        alt="Post"
                        className="w-full max-h-[600px] object-contain rounded-xl mb-3 bg-black/20"
                      />
                    ) : post.file_type === 'video' && post.file_url ? (
                      <video
                        src={post.file_url}
                        controls
                        className="w-full max-h-[600px] object-contain rounded-xl mb-3 bg-black/20"
                      />
                    ) : post.file_type === 'music' && post.file_url ? (
                      <div className="mb-3">
                        <WaveformAudioPlayer
                          postId={post.id}
                          audioUrl={post.file_url}
                          fileName={post.file_name || 'Audio Track'}
                          onLike={async (timestamp) => {
                            await teamWallService.likePost(post.id, timestamp)
                            setWallPosts([...wallPosts]) // Force re-render
                          }}
                          likes={teamWallService.postLikes.get(post.id) || []}
                          currentUserId={currentUserId || undefined}
                          versionCount={postVersions.get(post.id)?.length || 1}
                          activeVersionId={post.active_version_id || null}
                          onVersionChange={async (version) => {
                            // Set the new active version
                            await versionService.setActiveVersion(post.id, version.id)
                            // Reload posts to update UI
                            if (selectedTeam) {
                              await loadWallPosts(selectedTeam.id)
                            }
                          }}
                        />
                      </div>
                    ) : post.file_type === 'document' && post.file_url ? (
                      <div className="mb-3">
                        <a
                          href={post.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 bg-white/5 p-3 rounded-xl hover:bg-white/10 transition-colors"
                        >
                          <FileText className="w-5 h-5 text-brand-orange flex-shrink-0" />
                          <span className="text-white text-sm truncate">{post.file_name || 'Document'}</span>
                        </a>
                      </div>
                    ) : null}

                    {/* Post Actions */}
                    <div className="flex items-center gap-6">
                      <button
                        onClick={() => handleLikePost(post.id)}
                        className={`flex items-center gap-1.5 transition-colors ${
                          currentUserId && teamWallService.isPostLikedByCurrentUserSync(post.id, currentUserId)
                            ? 'text-brand-orange'
                            : 'text-gray-500 hover:text-brand-orange'
                        }`}
                      >
                        <svg
                          className="w-5 h-5 transition-all"
                          fill={currentUserId && teamWallService.isPostLikedByCurrentUserSync(post.id, currentUserId) ? 'currentColor' : 'none'}
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                          />
                        </svg>
                        <span className="text-xs font-medium">
                          {teamWallService.getLikeCount(post.id) > 0
                            ? teamWallService.getLikeCount(post.id)
                            : 'Like'}
                        </span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowInviteModal(false)}>
          <div className="bg-[#2a2a2a] rounded-xl p-6 w-full max-w-md mx-4 border border-white/10" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-semibold text-white mb-3">Invite to {selectedTeam?.name}</h2>

            <p className="text-gray-400 text-sm mb-4">
              Share this link with people you want to invite:
            </p>

            <div className="bg-white/5 rounded-lg p-3 mb-4 flex items-center gap-3">
              <input
                type="text"
                value={inviteLink}
                readOnly
                className="flex-1 bg-transparent text-white focus:outline-none text-sm"
              />
              <button
                onClick={handleCopyInviteLink}
                className="bg-brand-orange text-white px-4 py-2 rounded-lg hover:bg-brand-orange-dark transition-colors text-sm font-medium"
              >
                {copySuccess ? 'Copied!' : 'Copy'}
              </button>
            </div>

            <button
              onClick={() => setShowInviteModal(false)}
              className="w-full px-4 py-2.5 bg-white/5 text-white rounded-lg hover:bg-white/10 transition-colors text-sm font-medium"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Create Team Modal */}
      {showCreateTeamModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowCreateTeamModal(false)}>
          <div className="bg-[#2a2a2a] rounded-xl p-6 w-full max-w-md mx-4 border border-white/10" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-semibold text-white mb-5">Create New Team</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-2 uppercase tracking-wide">
                  Team Name
                </label>
                <input
                  type="text"
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  placeholder="e.g., Production Team"
                  className="w-full bg-white/5 text-white px-4 py-2.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-orange/50 placeholder-gray-600 text-sm"
                  disabled={isCreating}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-2 uppercase tracking-wide">
                  Description (Optional)
                </label>
                <textarea
                  value={newTeamDescription}
                  onChange={(e) => setNewTeamDescription(e.target.value)}
                  placeholder="What's this team for?"
                  rows={3}
                  className="w-full bg-white/5 text-white px-4 py-2.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-orange/50 placeholder-gray-600 text-sm resize-none"
                  disabled={isCreating}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => {
                    setShowCreateTeamModal(false)
                    setNewTeamName('')
                    setNewTeamDescription('')
                  }}
                  className="flex-1 px-4 py-2.5 bg-white/5 text-white rounded-lg hover:bg-white/10 transition-colors text-sm font-medium"
                  disabled={isCreating}
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateTeam}
                  disabled={!newTeamName.trim() || isCreating}
                  className="flex-1 px-4 py-2.5 bg-brand-orange text-white rounded-lg hover:bg-brand-orange-dark disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                >
                  {isCreating ? 'Creating...' : 'Create Team'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Team Settings Modal */}
      {showTeamSettingsModal && selectedTeam && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowTeamSettingsModal(false)}>
          <div className="bg-[#2a2a2a] rounded-xl p-6 w-full max-w-md mx-4 border border-white/10 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-semibold text-white mb-5">Team Settings</h2>

            <div className="space-y-5">
              {/* Team Avatar */}
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-2 uppercase tracking-wide">
                  Team Avatar
                </label>
                <div className="flex items-center gap-4">
                  {teamAvatarPreview ? (
                    <img
                      src={teamAvatarPreview}
                      alt="Team avatar preview"
                      className="w-20 h-20 rounded-full object-cover border-2 border-white/10"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center border-2 border-white/10">
                      <Users className="w-8 h-8 text-gray-500" />
                    </div>
                  )}
                  <label className="flex-1 cursor-pointer">
                    <div className="px-4 py-2 bg-white/5 text-white rounded-lg hover:bg-white/10 transition-colors text-sm text-center border border-white/10">
                      {teamAvatarFile ? 'Change Avatar' : 'Upload Avatar'}
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleTeamAvatarSelect}
                      className="hidden"
                      disabled={isSavingSettings}
                    />
                  </label>
                </div>
              </div>

              {/* Team Tagline */}
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-2 uppercase tracking-wide">
                  Team Tagline
                </label>
                <input
                  type="text"
                  value={teamTagline}
                  onChange={(e) => setTeamTagline(e.target.value)}
                  placeholder="e.g., Making hits together"
                  maxLength={100}
                  className="w-full bg-white/5 text-white px-4 py-2.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-orange/50 placeholder-gray-600 text-sm"
                  disabled={isSavingSettings}
                />
                <p className="text-xs text-gray-500 mt-1">{teamTagline.length}/100 characters</p>
              </div>

              {/* Background Image */}
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-2 uppercase tracking-wide">
                  Background Image
                </label>
                {teamBackgroundPreview ? (
                  <div className="relative w-full h-32 rounded-lg overflow-hidden border border-white/10 mb-2">
                    <img
                      src={teamBackgroundPreview}
                      alt="Background preview"
                      className="w-full h-full object-cover opacity-30"
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <p className="text-white text-sm font-medium">Preview (will show translucent)</p>
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-32 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center mb-2">
                    <ImageIcon className="w-8 h-8 text-gray-500" />
                  </div>
                )}
                <label className="block cursor-pointer">
                  <div className="w-full px-4 py-2 bg-white/5 text-white rounded-lg hover:bg-white/10 transition-colors text-sm text-center border border-white/10">
                    {teamBackgroundFile ? 'Change Background' : 'Upload Background'}
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleTeamBackgroundSelect}
                    className="hidden"
                    disabled={isSavingSettings}
                  />
                </label>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => {
                    setShowTeamSettingsModal(false)
                    setTeamAvatarFile(null)
                    setTeamBackgroundFile(null)
                    setTeamTagline('')
                    setTeamAvatarPreview(null)
                    setTeamBackgroundPreview(null)
                  }}
                  className="flex-1 px-4 py-2.5 bg-white/5 text-white rounded-lg hover:bg-white/10 transition-colors text-sm font-medium"
                  disabled={isSavingSettings}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveTeamSettings}
                  disabled={isSavingSettings}
                  className="flex-1 px-4 py-2.5 bg-brand-orange text-white rounded-lg hover:bg-brand-orange-dark disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                >
                  {isSavingSettings ? 'Saving...' : 'Save Settings'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  )
}
