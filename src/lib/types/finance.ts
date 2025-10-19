// Finance Module Types
// Ported from iOS CEO App4 Finance module

export enum TransactionCategory {
  // Income categories
  STREAMING_ROYALTIES = 'streaming_royalties',
  PERFORMING_RIGHTS = 'performing_rights',
  MECHANICAL_ROYALTIES = 'mechanical_royalties',
  SYNC_LICENSING = 'sync_licensing',
  LIVE_PERFORMANCE = 'live_performance',
  MERCHANDISE = 'merchandise',
  TEACHING_LESSONS = 'teaching_lessons',
  SESSION_WORK = 'session_work',
  BEAT_SALES = 'beat_sales',
  NFT_SALES = 'nft_sales',
  CROWDFUNDING = 'crowdfunding',
  GRANTS_SPONSORSHIPS = 'grants_sponsorships',
  OTHER_INCOME = 'other_income',

  // Expense categories
  RECORDING_STUDIO = 'recording_studio',
  MIXING = 'mixing',
  MASTERING = 'mastering',
  EQUIPMENT = 'equipment',
  SOFTWARE = 'software',
  MARKETING = 'marketing',
  DISTRIBUTION = 'distribution',
  PR_SERVICES = 'pr_services',
  MUSIC_VIDEOS = 'music_videos',
  WEBSITE_HOSTING = 'website_hosting',
  LEGAL_BUSINESS = 'legal_business',
  INSURANCE = 'insurance',
  TRAVEL = 'travel',
  OTHER_EXPENSES = 'other_expenses'
}

export interface TransactionCategoryInfo {
  value: TransactionCategory
  displayName: string
  iconName: string
  isIncome: boolean
}

export const TRANSACTION_CATEGORIES: Record<TransactionCategory, TransactionCategoryInfo> = {
  [TransactionCategory.STREAMING_ROYALTIES]: {
    value: TransactionCategory.STREAMING_ROYALTIES,
    displayName: 'Streaming Royalties',
    iconName: 'music',
    isIncome: true
  },
  [TransactionCategory.PERFORMING_RIGHTS]: {
    value: TransactionCategory.PERFORMING_RIGHTS,
    displayName: 'Performing Rights',
    iconName: 'radio',
    isIncome: true
  },
  [TransactionCategory.MECHANICAL_ROYALTIES]: {
    value: TransactionCategory.MECHANICAL_ROYALTIES,
    displayName: 'Mechanical Royalties',
    iconName: 'disc',
    isIncome: true
  },
  [TransactionCategory.SYNC_LICENSING]: {
    value: TransactionCategory.SYNC_LICENSING,
    displayName: 'Sync Licensing',
    iconName: 'tv',
    isIncome: true
  },
  [TransactionCategory.LIVE_PERFORMANCE]: {
    value: TransactionCategory.LIVE_PERFORMANCE,
    displayName: 'Live Performance',
    iconName: 'mic',
    isIncome: true
  },
  [TransactionCategory.MERCHANDISE]: {
    value: TransactionCategory.MERCHANDISE,
    displayName: 'Merchandise',
    iconName: 'shopping-bag',
    isIncome: true
  },
  [TransactionCategory.TEACHING_LESSONS]: {
    value: TransactionCategory.TEACHING_LESSONS,
    displayName: 'Teaching/Lessons',
    iconName: 'user-check',
    isIncome: true
  },
  [TransactionCategory.SESSION_WORK]: {
    value: TransactionCategory.SESSION_WORK,
    displayName: 'Session Work',
    iconName: 'users',
    isIncome: true
  },
  [TransactionCategory.BEAT_SALES]: {
    value: TransactionCategory.BEAT_SALES,
    displayName: 'Beat Sales',
    iconName: 'zap',
    isIncome: true
  },
  [TransactionCategory.NFT_SALES]: {
    value: TransactionCategory.NFT_SALES,
    displayName: 'NFT Sales',
    iconName: 'hexagon',
    isIncome: true
  },
  [TransactionCategory.CROWDFUNDING]: {
    value: TransactionCategory.CROWDFUNDING,
    displayName: 'Crowdfunding',
    iconName: 'heart',
    isIncome: true
  },
  [TransactionCategory.GRANTS_SPONSORSHIPS]: {
    value: TransactionCategory.GRANTS_SPONSORSHIPS,
    displayName: 'Grants/Sponsorships',
    iconName: 'award',
    isIncome: true
  },
  [TransactionCategory.OTHER_INCOME]: {
    value: TransactionCategory.OTHER_INCOME,
    displayName: 'Other Income',
    iconName: 'plus-circle',
    isIncome: true
  },
  [TransactionCategory.RECORDING_STUDIO]: {
    value: TransactionCategory.RECORDING_STUDIO,
    displayName: 'Recording Studio',
    iconName: 'mic',
    isIncome: false
  },
  [TransactionCategory.MIXING]: {
    value: TransactionCategory.MIXING,
    displayName: 'Mixing',
    iconName: 'sliders',
    isIncome: false
  },
  [TransactionCategory.MASTERING]: {
    value: TransactionCategory.MASTERING,
    displayName: 'Mastering',
    iconName: 'volume-2',
    isIncome: false
  },
  [TransactionCategory.EQUIPMENT]: {
    value: TransactionCategory.EQUIPMENT,
    displayName: 'Equipment',
    iconName: 'headphones',
    isIncome: false
  },
  [TransactionCategory.SOFTWARE]: {
    value: TransactionCategory.SOFTWARE,
    displayName: 'Software',
    iconName: 'code',
    isIncome: false
  },
  [TransactionCategory.MARKETING]: {
    value: TransactionCategory.MARKETING,
    displayName: 'Marketing',
    iconName: 'trending-up',
    isIncome: false
  },
  [TransactionCategory.DISTRIBUTION]: {
    value: TransactionCategory.DISTRIBUTION,
    displayName: 'Distribution',
    iconName: 'send',
    isIncome: false
  },
  [TransactionCategory.PR_SERVICES]: {
    value: TransactionCategory.PR_SERVICES,
    displayName: 'PR Services',
    iconName: 'megaphone',
    isIncome: false
  },
  [TransactionCategory.MUSIC_VIDEOS]: {
    value: TransactionCategory.MUSIC_VIDEOS,
    displayName: 'Music Videos',
    iconName: 'video',
    isIncome: false
  },
  [TransactionCategory.WEBSITE_HOSTING]: {
    value: TransactionCategory.WEBSITE_HOSTING,
    displayName: 'Website/Hosting',
    iconName: 'globe',
    isIncome: false
  },
  [TransactionCategory.LEGAL_BUSINESS]: {
    value: TransactionCategory.LEGAL_BUSINESS,
    displayName: 'Legal/Business',
    iconName: 'file-text',
    isIncome: false
  },
  [TransactionCategory.INSURANCE]: {
    value: TransactionCategory.INSURANCE,
    displayName: 'Insurance',
    iconName: 'shield',
    isIncome: false
  },
  [TransactionCategory.TRAVEL]: {
    value: TransactionCategory.TRAVEL,
    displayName: 'Travel',
    iconName: 'plane',
    isIncome: false
  },
  [TransactionCategory.OTHER_EXPENSES]: {
    value: TransactionCategory.OTHER_EXPENSES,
    displayName: 'Other Expenses',
    iconName: 'minus-circle',
    isIncome: false
  }
}

export interface CategorizedTransaction {
  id: string
  plaidTransactionId: string
  date: Date
  amount: number // Positive = income, Negative = expense
  merchantName: string
  description: string
  category: TransactionCategory
  confidence: number // 0-1
  manuallySet: boolean
  linkedStatementId?: string
  notes?: string
}

export interface NetWorth {
  netWorth: number
  cashOnHand: number
  investments: number
  owedRevenue: number
  creditCardDebt: number
}

export enum AccountType {
  CHECKING = 'checking',
  SAVINGS = 'savings',
  CREDIT = 'credit',
  INVESTMENT = 'investment'
}

export interface BankAccount {
  id: string
  name: string
  type: AccountType
  balance: number
  mask?: string
}

export enum DistributorType {
  DISTROKID = 'DistroKid',
  TUNECORE = 'TuneCore',
  CD_BABY = 'CD Baby',
  AMUSE = 'Amuse',
  DITTO = 'Ditto',
  SPOTIFY = 'Spotify',
  APPLE_MUSIC = 'Apple Music',
  OTHER = 'Other'
}

export enum PaymentStatus {
  PENDING = 'pending',
  OVERDUE = 'overdue',
  PAID = 'paid'
}

export interface ExpectedPayment {
  id: string
  statementId: string
  distributor: DistributorType
  expectedAmount: number
  expectedDate: Date
  periodStart: Date
  periodEnd: Date
  status: PaymentStatus
  actualTransactionId?: string
  actualAmount?: number
  actualDate?: Date
  notes?: string
  daysLate?: number
}

export interface RoyaltyStatement {
  id: string
  statementType: string
  distributor: DistributorType
  startDate: Date
  endDate: Date
  totalAmount: number
  uploadedAt: Date
}

export function getCategoryInfo(category: TransactionCategory): TransactionCategoryInfo {
  return TRANSACTION_CATEGORIES[category]
}

export function getIncomeCategories(): TransactionCategory[] {
  return Object.values(TransactionCategory).filter(cat =>
    TRANSACTION_CATEGORIES[cat].isIncome
  )
}

export function getExpenseCategories(): TransactionCategory[] {
  return Object.values(TransactionCategory).filter(cat =>
    !TRANSACTION_CATEGORIES[cat].isIncome
  )
}
