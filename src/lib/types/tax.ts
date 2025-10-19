// Tax Assistant Types
// Ported from iOS CEO App4 Tax Assistant module

export enum TaxJurisdiction {
  FEDERAL = 'Federal',
  STATE = 'State',
  LOCAL = 'Local',
  SELF_EMPLOYMENT = 'Self-Employment'
}

export enum TaxFilingStatus {
  SINGLE = 'Single',
  MARRIED_JOINT = 'Married Filing Jointly',
  MARRIED_SEPARATE = 'Married Filing Separately',
  HEAD_OF_HOUSEHOLD = 'Head of Household'
}

export enum TaxPaymentFrequency {
  ANNUAL = 'Annual',
  QUARTERLY = 'Quarterly',
  MONTHLY = 'Monthly'
}

export enum TaxRiskLevel {
  NONE = 'None',
  LOW = 'Low',
  MEDIUM = 'Medium',
  HIGH = 'High',
  CRITICAL = 'Critical'
}

export enum TaxDeductionCategory {
  BUSINESS_EXPENSE = 'Business Expense',
  HOME_OFFICE = 'Home Office',
  RETIREMENT = 'Retirement Contribution',
  HEALTH_INSURANCE = 'Health Insurance',
  EDUCATION = 'Education',
  CHARITABLE = 'Charitable Contribution',
  INTEREST = 'Mortgage/Loan Interest',
  EQUIPMENT = 'Studio Equipment',
  TRAVEL = 'Business Travel',
  OTHER = 'Other'
}

export interface TaxBracket {
  id: string
  jurisdiction: TaxJurisdiction
  rate: number // Percentage (e.g., 22 for 22%)
  minIncome: number
  maxIncome: number | null
  year: number
  filingStatus: TaxFilingStatus
}

export interface TaxConfiguration {
  filingStatus: TaxFilingStatus
  selfEmployed: boolean
  deductions: TaxDeduction[]
  dependents: number
  otherIncome: number
  paymentFrequency: TaxPaymentFrequency
  state: string
  city?: string
}

export interface TaxDeduction {
  id: string
  name: string
  amount: number
  category: TaxDeductionCategory
  isPredicted: boolean
}

export interface TaxPayment {
  id: string
  jurisdiction: TaxJurisdiction
  description: string
  dueDate: Date
  amount: number
  frequency: TaxPaymentFrequency
  period: string
  isPaid: boolean
  paymentDate?: Date
  riskLevel: TaxRiskLevel
}

export interface TaxSummary {
  id: string
  periodStart: Date
  periodEnd: Date
  totalIncome: number
  totalDeductions: number
  taxableIncome: number
  federalTax: number
  stateTax: number
  localTax: number
  selfEmploymentTax: number
  totalTaxLiability: number
  effectiveTaxRate: number
}

export interface TaxSnapshot {
  date: Date
  ytdIncome: number
  ytdTaxesPaid: number
  estimatedAnnualIncome: number
  estimatedAnnualTax: number
  requiredSavingsRate: number
  nextPaymentDue: Date
  nextPaymentAmount: number
  savedForNextPayment: number
  savingsDeficit: number
  riskLevel: TaxRiskLevel
}

export interface TaxNotification {
  id: string
  date: Date
  title: string
  message: string
  type: TaxNotificationType
  isRead: boolean
}

export enum TaxNotificationType {
  PAYMENT_DUE = 'Payment Due',
  PAYMENT_UPCOMING = 'Payment Upcoming',
  INSUFFICIENT_FUNDS = 'Insufficient Funds',
  NEW_INCOME = 'New Income',
  TAX_RATE = 'Tax Rate',
  DEDUCTION = 'Deduction',
  ALERT = 'Alert',
  INFO = 'Info'
}

// Helper functions
export function getTaxBracketColor(jurisdiction: TaxJurisdiction): string {
  switch (jurisdiction) {
    case TaxJurisdiction.FEDERAL:
      return '#3B82F6'
    case TaxJurisdiction.STATE:
      return '#10B981'
    case TaxJurisdiction.LOCAL:
      return '#F59E0B'
    case TaxJurisdiction.SELF_EMPLOYMENT:
      return '#8B5CF6'
  }
}

export function getRiskLevelColor(level: TaxRiskLevel): string {
  switch (level) {
    case TaxRiskLevel.NONE:
      return '#6B7280'
    case TaxRiskLevel.LOW:
      return '#10B981'
    case TaxRiskLevel.MEDIUM:
      return '#F59E0B'
    case TaxRiskLevel.HIGH:
      return '#F97316'
    case TaxRiskLevel.CRITICAL:
      return '#EF4444'
  }
}

export function getNotificationTypeColor(type: TaxNotificationType): string {
  switch (type) {
    case TaxNotificationType.PAYMENT_DUE:
      return '#EF4444'
    case TaxNotificationType.PAYMENT_UPCOMING:
      return '#F97316'
    case TaxNotificationType.INSUFFICIENT_FUNDS:
      return '#EF4444'
    case TaxNotificationType.NEW_INCOME:
      return '#10B981'
    case TaxNotificationType.TAX_RATE:
      return '#3B82F6'
    case TaxNotificationType.DEDUCTION:
      return '#8B5CF6'
    case TaxNotificationType.ALERT:
      return '#EF4444'
    case TaxNotificationType.INFO:
      return '#3B82F6'
  }
}

export function formatTaxPeriod(start: Date, end: Date): string {
  const startMonth = start.getMonth()
  const endMonth = end.getMonth()
  const year = start.getFullYear()

  // Check if it's a quarter
  if (endMonth - startMonth === 2) {
    const quarter = Math.floor(startMonth / 3) + 1
    return `Q${quarter} ${year}`
  }

  // Otherwise format as month range
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return `${monthNames[startMonth]}-${monthNames[endMonth]} ${year}`
}

export function getDaysUntilDate(date: Date): number {
  const now = new Date()
  const diff = date.getTime() - now.getTime()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

export function formatTimeRemaining(payment: TaxPayment): string {
  if (payment.isPaid) return 'Paid'

  const days = getDaysUntilDate(payment.dueDate)

  if (days < 0) return `Overdue by ${Math.abs(days)} days`
  if (days === 0) return 'Due today'
  if (days === 1) return 'Due tomorrow'
  if (days < 30) return `Due in ${days} days`

  return payment.dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}
