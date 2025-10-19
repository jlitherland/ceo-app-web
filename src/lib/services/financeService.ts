import {
  CategorizedTransaction,
  NetWorth,
  ExpectedPayment,
  RoyaltyStatement,
  TransactionCategory,
  DistributorType,
  PaymentStatus,
  BankAccount,
  AccountType
} from '@/lib/types/finance'

export class FinanceService {
  private static instance: FinanceService

  static getInstance(): FinanceService {
    if (!FinanceService.instance) {
      FinanceService.instance = new FinanceService()
    }
    return FinanceService.instance
  }

  // Generate demo transactions
  generateDemoTransactions(): CategorizedTransaction[] {
    const now = new Date()
    const transactions: CategorizedTransaction[] = []

    // Income transactions
    const incomeData = [
      { merchant: 'DistroKid', amount: 245.67, category: TransactionCategory.STREAMING_ROYALTIES, days: 5 },
      { merchant: 'TuneCore', amount: 892.34, category: TransactionCategory.STREAMING_ROYALTIES, days: 12 },
      { merchant: 'ASCAP', amount: 1205.50, category: TransactionCategory.PERFORMING_RIGHTS, days: 18 },
      { merchant: 'Spotify', amount: 567.80, category: TransactionCategory.STREAMING_ROYALTIES, days: 25 },
      { merchant: 'YouTube Music', amount: 342.15, category: TransactionCategory.STREAMING_ROYALTIES, days: 8 },
      { merchant: 'Apple Music', amount: 678.90, category: TransactionCategory.STREAMING_ROYALTIES, days: 15 },
      { merchant: 'Live Show Payment', amount: 2500.00, category: TransactionCategory.LIVE_PERFORMANCE, days: 3 },
      { merchant: 'Merch Sales', amount: 450.00, category: TransactionCategory.MERCHANDISE, days: 7 }
    ]

    incomeData.forEach((data, index) => {
      transactions.push({
        id: `demo-income-${index}`,
        plaidTransactionId: `plaid-${index}`,
        date: new Date(now.getTime() - data.days * 24 * 60 * 60 * 1000),
        amount: data.amount,
        merchantName: data.merchant,
        description: `${data.merchant} payment`,
        category: data.category,
        confidence: 0.95,
        manuallySet: false
      })
    })

    // Expense transactions
    const expenseData = [
      { merchant: 'Splice', amount: 49.99, category: TransactionCategory.SOFTWARE, days: 7 },
      { merchant: 'Sweetwater', amount: 299.00, category: TransactionCategory.EQUIPMENT, days: 10 },
      { merchant: 'Fiverr', amount: 150.00, category: TransactionCategory.MIXING, days: 15 },
      { merchant: 'Meta Ads', amount: 75.00, category: TransactionCategory.MARKETING, days: 20 },
      { merchant: 'DistroKid Annual', amount: 19.99, category: TransactionCategory.DISTRIBUTION, days: 4 },
      { merchant: 'Adobe Creative Cloud', amount: 54.99, category: TransactionCategory.SOFTWARE, days: 11 },
      { merchant: 'Guitar Center', amount: 189.50, category: TransactionCategory.EQUIPMENT, days: 22 },
      { merchant: 'Instagram Ads', amount: 100.00, category: TransactionCategory.MARKETING, days: 6 }
    ]

    expenseData.forEach((data, index) => {
      transactions.push({
        id: `demo-expense-${index}`,
        plaidTransactionId: `plaid-expense-${index}`,
        date: new Date(now.getTime() - data.days * 24 * 60 * 60 * 1000),
        amount: -data.amount,
        merchantName: data.merchant,
        description: `${data.merchant} purchase`,
        category: data.category,
        confidence: 0.90,
        manuallySet: false
      })
    })

    return transactions.sort((a, b) => b.date.getTime() - a.date.getTime())
  }

  // Generate demo bank accounts
  generateDemoBankAccounts(): BankAccount[] {
    return [
      {
        id: 'account-1',
        name: 'Chase Checking',
        type: AccountType.CHECKING,
        balance: 5420.50,
        mask: '4321'
      },
      {
        id: 'account-2',
        name: 'Ally Savings',
        type: AccountType.SAVINGS,
        balance: 12500.00,
        mask: '8765'
      },
      {
        id: 'account-3',
        name: 'Chase Credit Card',
        type: AccountType.CREDIT,
        balance: -1250.75,
        mask: '2468'
      }
    ]
  }

  // Calculate net worth from accounts
  calculateNetWorth(accounts: BankAccount[], owedRevenue: number = 0): NetWorth {
    let cashOnHand = 0
    let investments = 0
    let creditCardDebt = 0

    accounts.forEach(account => {
      if (account.type === AccountType.CHECKING || account.type === AccountType.SAVINGS) {
        cashOnHand += account.balance
      } else if (account.type === AccountType.INVESTMENT) {
        investments += account.balance
      } else if (account.type === AccountType.CREDIT) {
        creditCardDebt += Math.abs(account.balance)
      }
    })

    const netWorth = cashOnHand + investments + owedRevenue - creditCardDebt

    return {
      netWorth,
      cashOnHand,
      investments,
      owedRevenue,
      creditCardDebt
    }
  }

  // Calculate monthly totals
  calculateMonthlyTotals(transactions: CategorizedTransaction[]): { income: number; expenses: number } {
    const now = new Date()
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    const thisMonthTransactions = transactions.filter(t => t.date >= monthAgo && t.date <= now)

    const income = thisMonthTransactions
      .filter(t => t.amount > 0)
      .reduce((sum, t) => sum + t.amount, 0)

    const expenses = thisMonthTransactions
      .filter(t => t.amount < 0)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0)

    return { income, expenses }
  }

  // Generate demo expected payments
  generateDemoExpectedPayments(): ExpectedPayment[] {
    const now = new Date()

    return [
      {
        id: 'payment-1',
        statementId: 'statement-1',
        distributor: DistributorType.DISTROKID,
        expectedAmount: 350.00,
        expectedDate: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
        periodStart: new Date(now.getTime() - 40 * 24 * 60 * 60 * 1000),
        periodEnd: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
        status: PaymentStatus.OVERDUE,
        daysLate: 10
      },
      {
        id: 'payment-2',
        statementId: 'statement-2',
        distributor: DistributorType.TUNECORE,
        expectedAmount: 892.34,
        expectedDate: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
        periodStart: new Date(now.getTime() - 35 * 24 * 60 * 60 * 1000),
        periodEnd: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
        status: PaymentStatus.PAID,
        actualTransactionId: 'demo-income-1',
        actualAmount: 892.34,
        actualDate: new Date(now.getTime() - 12 * 24 * 60 * 60 * 1000)
      }
    ]
  }

  // Generate demo royalty statements
  generateDemoRoyaltyStatements(): RoyaltyStatement[] {
    const now = new Date()

    return [
      {
        id: 'statement-1',
        statementType: 'Streaming Royalties',
        distributor: DistributorType.DISTROKID,
        startDate: new Date(now.getFullYear(), now.getMonth() - 1, 1),
        endDate: new Date(now.getFullYear(), now.getMonth(), 0),
        totalAmount: 1245.67,
        uploadedAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000)
      },
      {
        id: 'statement-2',
        statementType: 'Digital Distribution',
        distributor: DistributorType.TUNECORE,
        startDate: new Date(now.getFullYear(), now.getMonth() - 2, 1),
        endDate: new Date(now.getFullYear(), now.getMonth() - 1, 0),
        totalAmount: 2892.34,
        uploadedAt: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000)
      },
      {
        id: 'statement-3',
        statementType: 'Performance Rights',
        distributor: DistributorType.OTHER,
        startDate: new Date(now.getFullYear() - 1, 9, 1),
        endDate: new Date(now.getFullYear() - 1, 11, 31),
        totalAmount: 5678.90,
        uploadedAt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      }
    ]
  }

  // Get overdue payments
  getOverduePayments(payments: ExpectedPayment[]): ExpectedPayment[] {
    return payments.filter(p => p.status === PaymentStatus.OVERDUE)
  }

  // Get total owed
  getTotalOwed(payments: ExpectedPayment[]): number {
    return this.getOverduePayments(payments)
      .reduce((sum, p) => sum + p.expectedAmount, 0)
  }

  // Categorize transaction (mock smart categorization)
  categorizeTransaction(
    merchantName: string,
    amount: number,
    description: string
  ): TransactionCategory {
    const merchant = merchantName.toLowerCase()
    const desc = description.toLowerCase()

    // Income categories
    if (merchant.includes('distrokid') || merchant.includes('tunecore') ||
        merchant.includes('spotify') || merchant.includes('apple music') ||
        desc.includes('royalt') || desc.includes('streaming')) {
      return TransactionCategory.STREAMING_ROYALTIES
    }
    if (merchant.includes('ascap') || merchant.includes('bmi') || desc.includes('performing rights')) {
      return TransactionCategory.PERFORMING_RIGHTS
    }
    if (merchant.includes('sync') || desc.includes('licensing')) {
      return TransactionCategory.SYNC_LICENSING
    }
    if (merchant.includes('merch') || desc.includes('merchandise')) {
      return TransactionCategory.MERCHANDISE
    }

    // Expense categories (only if amount is negative)
    if (amount < 0) {
      if (merchant.includes('splice') || merchant.includes('adobe') ||
          merchant.includes('plugin') || desc.includes('software')) {
        return TransactionCategory.SOFTWARE
      }
      if (merchant.includes('sweetwater') || merchant.includes('guitar center') ||
          merchant.includes('music store') || desc.includes('equipment')) {
        return TransactionCategory.EQUIPMENT
      }
      if (merchant.includes('fiverr') || merchant.includes('mixing') ||
          merchant.includes('mastering')) {
        return TransactionCategory.MIXING
      }
      if (merchant.includes('ads') || merchant.includes('marketing') ||
          merchant.includes('facebook') || merchant.includes('instagram')) {
        return TransactionCategory.MARKETING
      }
      if (merchant.includes('studio') || desc.includes('recording')) {
        return TransactionCategory.RECORDING_STUDIO
      }

      return TransactionCategory.OTHER_EXPENSES
    }

    return TransactionCategory.OTHER_INCOME
  }
}

export const financeService = FinanceService.getInstance()
