/**
 * Contract Analysis Types
 * Matches iOS app models for consistency
 */

export type ContractType =
  | 'Synchronization Representation Agreement'
  | 'Record Label Agreement'
  | 'Production Deal'
  | 'Publishing Agreement'
  | 'Distribution Agreement'
  | 'Management Agreement'
  | 'Producer Agreement'
  | 'Work For Hire Agreement'
  | 'Performance Contract'
  | 'Unknown Contract Type'

export type SeverityLevel = 'High' | 'Medium' | 'Low'

export interface ContractAnalysisResults {
  contractType: ContractType
  overallFairness: number // 0.0 to 1.0
  summary: string
  componentRatings: ComponentRating[]
  concernAreas: ConcernArea[]
  keyTerms: ContractKeyTerm[]
}

export interface ComponentRating {
  name: string
  rating: number // 0.0 to 1.0
  details: string
  industryComparison?: string
}

export interface ConcernArea {
  title: string
  description: string
  suggestion?: string
  severityLevel: SeverityLevel
  clauseText?: string
}

export interface ContractKeyTerm {
  name: string
  value: string
}

export interface GlossaryTerm {
  term: string
  definition: string
  example?: string
}

export const CONTRACT_TYPE_DESCRIPTIONS: Record<ContractType, string> = {
  'Synchronization Representation Agreement':
    'An agreement where a company represents an artist to secure synchronization placements in various media.',
  'Record Label Agreement':
    'A contract between an artist and a record label for the creation and distribution of recordings.',
  'Production Deal':
    'An agreement where a production company funds recording in exchange for ownership or licensing rights.',
  'Publishing Agreement':
    'A contract covering ownership and administration of musical compositions.',
  'Distribution Agreement':
    'An agreement focused solely on distributing music to various platforms.',
  'Management Agreement':
    'A contract where a manager represents an artist in exchange for a percentage of income.',
  'Producer Agreement':
    'A contract between an artist and producer outlining compensation and rights for produced recordings.',
  'Work For Hire Agreement':
    'An agreement where creative services are provided for a flat fee with no retained rights.',
  'Performance Contract': 'A contract for live performances or appearances.',
  'Unknown Contract Type': "The contract type couldn't be definitively identified.",
}

export const MUSIC_CONTRACT_GLOSSARY: GlossaryTerm[] = [
  {
    term: 'Master Recording',
    definition:
      'The original recording of a song. Ownership of the master gives you control over how the recording is used.',
    example: `Who owns the master determines who profits from streaming and licensing.`,
  },
  {
    term: 'Publishing Rights',
    definition:
      'Rights to the musical composition (lyrics and melody), separate from the recording.',
    example:
      'Publishing rights generate income from performance royalties, mechanical royalties, and sync licenses.',
  },
  {
    term: 'Mechanical Royalties',
    definition: 'Payments for the reproduction of a musical composition.',
    example: `Earned when your song is streamed, downloaded, or pressed to physical media.`,
  },
  {
    term: 'Performance Royalties',
    definition: 'Payments when a song is played publicly (radio, venues, streaming).',
    example: `PROs like ASCAP, BMI, and SESAC collect these for songwriters and publishers.`,
  },
  {
    term: 'Synchronization License',
    definition: 'Permission to use a song in visual media (TV, films, ads, games).',
    example: `A sync placement in a commercial can generate significant upfront fees.`,
  },
  {
    term: 'Points',
    definition: 'Percentage points of royalties, typically for producers.',
    example: `A producer might get 3 points, meaning 3% of artist royalties.`,
  },
  {
    term: 'Recoupment',
    definition:
      'When a label recovers its investment (advance, marketing, etc.) from your earnings.',
    example: `You won't see additional royalties until your advance is fully recouped.`,
  },
  {
    term: 'All-In Deal',
    definition:
      'An advance that covers all recording costs, including producer fees.',
    example: `You're responsible for paying the producer out of your advance.`,
  },
  {
    term: 'Term',
    definition: 'The duration of the contract.',
    example: `A 3-album deal might last several years depending on delivery schedules.`,
  },
  {
    term: 'Territory',
    definition: 'The geographic area where the agreement applies.',
    example: `"Worldwide" means the deal covers all countries.`,
  },
  {
    term: 'Option Period',
    definition:
      'Additional albums or time the label can add to the deal at their discretion.',
    example: `A 1+4 deal means 1 album guaranteed, with 4 optional albums.`,
  },
  {
    term: 'Sunset Clause',
    definition:
      'Reduces commission after the management contract ends (common in management deals).',
    example: `Commission might drop from 20% to 10% for deals made during the contract term.`,
  },
  {
    term: 'Controlled Composition Clause',
    definition:
      'Limits the mechanical royalty rate a label pays for songs you wrote.',
    example: `Labels often cap it at 75% of statutory rate to reduce costs.`,
  },
  {
    term: 'Cross-Collateralization',
    definition:
      'Using profits from one project to recoup losses from another.',
    example: `Album 2's success might be used to recoup losses from Album 1.`,
  },
  {
    term: '360 Deal',
    definition:
      'Label takes a percentage of all revenue streams (touring, merch, endorsements).',
    example: `Common with newer artists; label invests more but takes a broader cut.`,
  },
  {
    term: 'Work For Hire',
    definition:
      'You create something for a fee but retain no ownership or future royalties.',
    example: `Common for session musicians or production work for commercials.`,
  },
  {
    term: 'Advance',
    definition:
      'Upfront payment against future royalties; essentially a loan.',
    example: `A $50,000 advance must be recouped before you earn additional royalties.`,
  },
  {
    term: 'Net Receipts',
    definition:
      'Revenue after certain deductions (varies by contract).',
    example: `Your royalty might be 15% of net receipts after distribution fees.`,
  },
  {
    term: 'Reversion',
    definition:
      'Rights return to you after a certain period or condition.',
    example: `Masters may revert after 7 years or if the label doesn't exploit them.`,
  },
]
