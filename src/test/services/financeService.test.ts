/**
 * Finance Service Tests
 */

import { describe, it, expect } from 'vitest'
import { financeService } from '@/lib/services/financeService'
import { TransactionCategory } from '@/lib/types/finance'

describe('Finance Service', () => {
  describe('categorizeTransaction', () => {
    it('should categorize streaming revenue correctly', () => {
      const result = financeService.categorizeTransaction(
        'Spotify Payment',
        150.50,
        'Monthly streaming revenue'
      )

      expect(result).toBe(TransactionCategory.STREAMING_ROYALTIES)
    })

    it('should categorize sync licensing correctly', () => {
      const result = financeService.categorizeTransaction(
        'Sync Music Licensing',
        5000,
        'TV show placement fee'
      )

      expect(result).toBe(TransactionCategory.SYNC_LICENSING)
    })

    it('should categorize production expenses correctly', () => {
      const result = financeService.categorizeTransaction(
        'Studio Time',
        -500,
        'recording session at studio'
      )

      expect(result).toBe(TransactionCategory.RECORDING_STUDIO)
    })

    it('should handle unknown transactions', () => {
      const result = financeService.categorizeTransaction(
        'Random Merchant',
        100,
        'merchandise sales'
      )

      expect(result).toBe(TransactionCategory.MERCHANDISE)
    })
  })

  describe('calculateNetWorth', () => {
    it('should calculate net worth correctly', () => {
      const accounts = [
        {
          id: '1',
          name: 'Checking',
          type: 'checking' as any,
          balance: 5000,
          mask: '1234',
        },
        {
          id: '2',
          name: 'Savings',
          type: 'savings' as any,
          balance: 10000,
          mask: '5678',
        },
      ]

      const owedRevenue = 2000

      const netWorth = financeService.calculateNetWorth(accounts, owedRevenue)

      expect(netWorth.netWorth).toBe(17000)
      expect(netWorth.cashOnHand).toBe(15000)
      expect(netWorth.owedRevenue).toBe(2000)
    })
  })

  describe('calculateMonthlyTotals', () => {
    it('should calculate monthly income and expenses', () => {
      const now = new Date()
      const transactions = [
        {
          id: '1',
          amount: 1000,
          merchantName: 'Spotify',
          description: 'Streaming revenue',
          date: now,
          category: TransactionCategory.STREAMING_REVENUE,
          pending: false,
        },
        {
          id: '2',
          amount: -500,
          merchantName: 'Studio',
          description: 'Recording',
          date: now,
          category: TransactionCategory.PRODUCTION_COSTS,
          pending: false,
        },
        {
          id: '3',
          amount: 2000,
          merchantName: 'Live Nation',
          description: 'Performance',
          date: now,
          category: TransactionCategory.PERFORMANCE_FEES,
          pending: false,
        },
      ]

      const totals = financeService.calculateMonthlyTotals(transactions)

      expect(totals.income).toBe(3000)
      expect(totals.expenses).toBe(500)
    })
  })

  describe('demo data generation', () => {
    it('should generate demo transactions', () => {
      const transactions = financeService.generateDemoTransactions()

      expect(transactions.length).toBeGreaterThan(0)
      expect(transactions[0]).toHaveProperty('id')
      expect(transactions[0]).toHaveProperty('amount')
      expect(transactions[0]).toHaveProperty('category')
    })

    it('should generate demo bank accounts', () => {
      const accounts = financeService.generateDemoBankAccounts()

      expect(accounts.length).toBeGreaterThan(0)
      expect(accounts[0]).toHaveProperty('name')
      expect(accounts[0]).toHaveProperty('balance')
    })

    it('should generate demo expected payments', () => {
      const payments = financeService.generateDemoExpectedPayments()

      expect(payments.length).toBeGreaterThan(0)
      expect(payments[0]).toHaveProperty('distributor')
      expect(payments[0]).toHaveProperty('expectedAmount')
    })
  })
})
