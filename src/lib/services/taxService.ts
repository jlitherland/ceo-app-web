import {
  TaxJurisdiction,
  TaxFilingStatus,
  TaxPaymentFrequency,
  TaxRiskLevel,
  TaxNotificationType,
  type TaxConfiguration,
  type TaxBracket,
  type TaxPayment,
  type TaxSummary,
  type TaxSnapshot,
  type TaxNotification
} from '@/lib/types/tax'
import type { CategorizedTransaction } from '@/lib/types/finance'

export class TaxService {
  private static instance: TaxService

  static getInstance(): TaxService {
    if (!TaxService.instance) {
      TaxService.instance = new TaxService()
    }
    return TaxService.instance
  }

  // 2025 Federal Tax Brackets (Single)
  private readonly federalBrackets2025: TaxBracket[] = [
    { id: '1', jurisdiction: TaxJurisdiction.FEDERAL, rate: 10, minIncome: 0, maxIncome: 11600, year: 2025, filingStatus: TaxFilingStatus.SINGLE },
    { id: '2', jurisdiction: TaxJurisdiction.FEDERAL, rate: 12, minIncome: 11600, maxIncome: 47150, year: 2025, filingStatus: TaxFilingStatus.SINGLE },
    { id: '3', jurisdiction: TaxJurisdiction.FEDERAL, rate: 22, minIncome: 47150, maxIncome: 100525, year: 2025, filingStatus: TaxFilingStatus.SINGLE },
    { id: '4', jurisdiction: TaxJurisdiction.FEDERAL, rate: 24, minIncome: 100525, maxIncome: 191950, year: 2025, filingStatus: TaxFilingStatus.SINGLE },
    { id: '5', jurisdiction: TaxJurisdiction.FEDERAL, rate: 32, minIncome: 191950, maxIncome: 243725, year: 2025, filingStatus: TaxFilingStatus.SINGLE },
    { id: '6', jurisdiction: TaxJurisdiction.FEDERAL, rate: 35, minIncome: 243725, maxIncome: 609350, year: 2025, filingStatus: TaxFilingStatus.SINGLE },
    { id: '7', jurisdiction: TaxJurisdiction.FEDERAL, rate: 37, minIncome: 609350, maxIncome: null, year: 2025, filingStatus: TaxFilingStatus.SINGLE }
  ]

  // Standard deduction for 2025
  private readonly standardDeduction2025 = {
    [TaxFilingStatus.SINGLE]: 14600,
    [TaxFilingStatus.MARRIED_JOINT]: 29200,
    [TaxFilingStatus.MARRIED_SEPARATE]: 14600,
    [TaxFilingStatus.HEAD_OF_HOUSEHOLD]: 21900
  }

  // Calculate estimated tax on income
  calculateEstimatedTax(income: number, config: TaxConfiguration): number {
    if (income <= 0) return 0

    // Calculate self-employment tax
    const selfEmploymentTax = config.selfEmployed ? this.calculateSelfEmploymentTax(income) : 0

    // Calculate deductions
    const standardDeduction = this.standardDeduction2025[config.filingStatus]
    const itemizedDeductions = config.deductions.reduce((sum, d) => sum + d.amount, 0)
    const totalDeductions = Math.max(standardDeduction, itemizedDeductions)

    // Calculate taxable income
    const selfEmploymentTaxDeduction = config.selfEmployed ? selfEmploymentTax * 0.5 : 0
    const taxableIncome = Math.max(0, income - totalDeductions - selfEmploymentTaxDeduction)

    // Calculate federal tax
    const federalTax = this.calculateProgressiveTax(taxableIncome, this.federalBrackets2025)

    // Estimate state tax (simplified - use 5% average)
    const stateTax = taxableIncome * 0.05

    return federalTax + stateTax + selfEmploymentTax
  }

  // Calculate self-employment tax (15.3% on 92.35% of net earnings)
  private calculateSelfEmploymentTax(income: number): number {
    const netEarnings = income * 0.9235
    return netEarnings * 0.153
  }

  // Calculate progressive tax using brackets
  private calculateProgressiveTax(income: number, brackets: TaxBracket[]): number {
    let tax = 0
    let remainingIncome = income

    const sortedBrackets = [...brackets].sort((a, b) => a.minIncome - b.minIncome)

    for (const bracket of sortedBrackets) {
      if (remainingIncome <= 0) break

      const bracketMax = bracket.maxIncome ?? Infinity
      const bracketMin = bracket.minIncome
      const bracketRange = Math.min(remainingIncome, bracketMax - bracketMin)

      if (bracketRange > 0) {
        tax += (bracketRange * bracket.rate) / 100
        remainingIncome -= bracketRange
      }
    }

    return tax
  }

  // Generate quarterly tax payments
  generateQuarterlyPayments(annualTax: number, year: number): TaxPayment[] {
    const quarterlyAmount = annualTax / 4
    const payments: TaxPayment[] = []

    // Q1 - April 15
    payments.push({
      id: `q1-${year}`,
      jurisdiction: TaxJurisdiction.FEDERAL,
      description: 'Federal Estimated Tax',
      dueDate: new Date(year, 3, 15), // April 15
      amount: quarterlyAmount,
      frequency: TaxPaymentFrequency.QUARTERLY,
      period: `Q1 ${year}`,
      isPaid: false,
      riskLevel: TaxRiskLevel.NONE
    })

    // Q2 - June 15
    payments.push({
      id: `q2-${year}`,
      jurisdiction: TaxJurisdiction.FEDERAL,
      description: 'Federal Estimated Tax',
      dueDate: new Date(year, 5, 15), // June 15
      amount: quarterlyAmount,
      frequency: TaxPaymentFrequency.QUARTERLY,
      period: `Q2 ${year}`,
      isPaid: false,
      riskLevel: TaxRiskLevel.NONE
    })

    // Q3 - September 15
    payments.push({
      id: `q3-${year}`,
      jurisdiction: TaxJurisdiction.FEDERAL,
      description: 'Federal Estimated Tax',
      dueDate: new Date(year, 8, 15), // September 15
      amount: quarterlyAmount,
      frequency: TaxPaymentFrequency.QUARTERLY,
      period: `Q3 ${year}`,
      isPaid: false,
      riskLevel: TaxRiskLevel.NONE
    })

    // Q4 - January 15 of next year
    payments.push({
      id: `q4-${year}`,
      jurisdiction: TaxJurisdiction.FEDERAL,
      description: 'Federal Estimated Tax',
      dueDate: new Date(year + 1, 0, 15), // January 15
      amount: quarterlyAmount,
      frequency: TaxPaymentFrequency.QUARTERLY,
      period: `Q4 ${year}`,
      isPaid: false,
      riskLevel: TaxRiskLevel.NONE
    })

    return payments
  }

  // Calculate YTD income from transactions
  calculateYTDIncome(transactions: CategorizedTransaction[]): number {
    const now = new Date()
    const yearStart = new Date(now.getFullYear(), 0, 1)

    return transactions
      .filter(t => t.date >= yearStart && t.amount > 0)
      .reduce((sum, t) => sum + t.amount, 0)
  }

  // Calculate estimated annual income
  estimateAnnualIncome(ytdIncome: number): number {
    const now = new Date()
    const dayOfYear = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24))
    const daysInYear = (now.getFullYear() % 4 === 0) ? 366 : 365

    const annualized = (ytdIncome * daysInYear) / dayOfYear
    const minEstimate = ytdIncome * 1.25

    return Math.max(annualized, minEstimate)
  }

  // Create tax snapshot
  createTaxSnapshot(
    transactions: CategorizedTransaction[],
    config: TaxConfiguration,
    taxSavings: number,
    paidTaxes: number
  ): TaxSnapshot {
    const ytdIncome = this.calculateYTDIncome(transactions)
    const estimatedAnnualIncome = this.estimateAnnualIncome(ytdIncome)
    const estimatedAnnualTax = this.calculateEstimatedTax(estimatedAnnualIncome, config)

    // Find next payment
    const now = new Date()
    const year = now.getFullYear()
    const allPayments = this.generateQuarterlyPayments(estimatedAnnualTax, year)
    const nextPayment = allPayments.find(p => p.dueDate > now && !p.isPaid)

    const nextPaymentDue = nextPayment?.dueDate ?? new Date(year + 1, 0, 15)
    const nextPaymentAmount = nextPayment?.amount ?? estimatedAnnualTax / 4

    const savedForNextPayment = taxSavings
    const savingsDeficit = Math.max(0, nextPaymentAmount - savedForNextPayment)

    // Calculate risk level
    let riskLevel: TaxRiskLevel
    const coverageRatio = savedForNextPayment / nextPaymentAmount

    if (coverageRatio >= 1) {
      riskLevel = TaxRiskLevel.NONE
    } else if (coverageRatio >= 0.9) {
      riskLevel = TaxRiskLevel.LOW
    } else if (coverageRatio >= 0.7) {
      riskLevel = TaxRiskLevel.MEDIUM
    } else if (coverageRatio >= 0.5) {
      riskLevel = TaxRiskLevel.HIGH
    } else {
      riskLevel = TaxRiskLevel.CRITICAL
    }

    return {
      date: now,
      ytdIncome,
      ytdTaxesPaid: paidTaxes,
      estimatedAnnualIncome,
      estimatedAnnualTax,
      requiredSavingsRate: estimatedAnnualIncome > 0 ? (estimatedAnnualTax / estimatedAnnualIncome) * 100 : 0,
      nextPaymentDue,
      nextPaymentAmount,
      savedForNextPayment,
      savingsDeficit,
      riskLevel
    }
  }

  // Generate tax summaries by quarter
  generateTaxSummaries(
    transactions: CategorizedTransaction[],
    config: TaxConfiguration
  ): TaxSummary[] {
    const now = new Date()
    const year = now.getFullYear()
    const summaries: TaxSummary[] = []

    // Generate summaries for each quarter
    for (let quarter = 1; quarter <= 4; quarter++) {
      const quarterStart = new Date(year, (quarter - 1) * 3, 1)
      const quarterEnd = new Date(year, quarter * 3, 0)

      // Skip future quarters
      if (quarterStart > now) continue

      // Filter transactions for this quarter
      const quarterTransactions = transactions.filter(
        t => t.date >= quarterStart && t.date <= quarterEnd
      )

      const totalIncome = quarterTransactions
        .filter(t => t.amount > 0)
        .reduce((sum, t) => sum + t.amount, 0)

      const totalDeductions = config.deductions.reduce((sum, d) => sum + d.amount, 0) / 4 // Spread deductions across quarters

      const taxableIncome = Math.max(0, totalIncome - totalDeductions)

      const selfEmploymentTax = config.selfEmployed ? this.calculateSelfEmploymentTax(totalIncome) : 0
      const federalTax = this.calculateProgressiveTax(taxableIncome, this.federalBrackets2025)
      const stateTax = taxableIncome * 0.05 // Simplified
      const localTax = 0 // Simplified

      const totalTaxLiability = federalTax + stateTax + localTax + selfEmploymentTax
      const effectiveTaxRate = totalIncome > 0 ? (totalTaxLiability / totalIncome) * 100 : 0

      summaries.push({
        id: `q${quarter}-${year}`,
        periodStart: quarterStart,
        periodEnd: quarterEnd,
        totalIncome,
        totalDeductions,
        taxableIncome,
        federalTax,
        stateTax,
        localTax,
        selfEmploymentTax,
        totalTaxLiability,
        effectiveTaxRate
      })
    }

    return summaries
  }

  // Create notification for new income
  createIncomeNotification(transaction: CategorizedTransaction, config: TaxConfiguration): TaxNotification {
    const estimatedTax = this.calculateEstimatedTax(transaction.amount, config)

    return {
      id: `income-${transaction.id}`,
      date: new Date(),
      title: `New Income: ${transaction.merchantName}`,
      message: `You received $${transaction.amount.toFixed(2)} from ${transaction.merchantName}. Consider setting aside $${estimatedTax.toFixed(2)} for taxes.`,
      type: TaxNotificationType.NEW_INCOME,
      isRead: false
    }
  }

  // Create payment reminder notification
  createPaymentReminderNotification(payment: TaxPayment): TaxNotification {
    const daysUntil = Math.ceil((payment.dueDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))

    return {
      id: `reminder-${payment.id}`,
      date: new Date(),
      title: `Tax Payment Due Soon`,
      message: `Your ${payment.period} estimated tax payment of $${payment.amount.toFixed(2)} is due in ${daysUntil} days.`,
      type: TaxNotificationType.PAYMENT_UPCOMING,
      isRead: false
    }
  }
}

export const taxService = TaxService.getInstance()
