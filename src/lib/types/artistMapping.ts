/**
 * Artist Mapping Types
 * For aggregating multiple Luminate artist IDs into a single view
 */

export interface ArtistMapping {
  displayName: string // Display name for the artist
  luminateIds: string[] // Array of Luminate artist IDs to aggregate
  primaryId: string // Primary ID (used for caching and as default)
}

export interface ArtistAggregationPreference {
  [artistName: string]: string[] // Map of artist name to array of IDs
}

// For the UI - represents a selectable artist profile
export interface SelectableArtistProfile {
  id: string
  name: string
  selected: boolean
}
