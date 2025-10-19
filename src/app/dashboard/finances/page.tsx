'use client'

import { useState, useMemo, lazy, Suspense } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  PiggyBank,
  CreditCard,
  Music,
  Upload,
  ChevronRight,
  AlertCircle,
  BarChart3,
  Calculator
} from 'lucide-react'
import { financeService } from '@/lib/services/financeService'
import { taxService } from '@/lib/services/taxService'
import { getCategoryInfo, TransactionCategory } from '@/lib/types/finance'
import { TaxFilingStatus } from '@/lib/types/tax'
import type {
  CategorizedTransaction,
  NetWorth,
  BankAccount,
  ExpectedPayment,
  RoyaltyStatement
} from '@/lib/types/finance'
import TransactionFilters from '@/components/finances/TransactionFilters'
import ExportMenu from '@/components/finances/ExportMenu'

// Lazy load heavy components
const FinanceCharts = lazy(() => import('@/components/finances/FinanceCharts'))

export default function FinancesPage() {
  const [useDemoData, setUseDemoData] = useState(false)
  const [transactions, setTransactions] = useState<CategorizedTransaction[]>([])
  const [accounts, setAccounts] = useState<BankAccount[]>([])
  const [expectedPayments, setExpectedPayments] = useState<ExpectedPayment[]>([])
  const [statements, setStatements] = useState<RoyaltyStatement[]>([])
  const [showCharts, setShowCharts] = useState(false)
  const [showTaxAssistant, setShowTaxAssistant] = useState(false)

  // Filters
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<TransactionCategory | 'all'>('all')
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'merchant'>('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  // Filtered and sorted transactions
  const filteredTransactions = useMemo(() => {
    let filtered = transactions

    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      filtered = filtered.filter(t =>
        t.merchantName.toLowerCase().includes(search) ||
        t.description.toLowerCase().includes(search)
      )
    }

    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(t => t.category === selectedCategory)
    }

    // Sort
    filtered = [...filtered].sort((a, b) => {
      let comparison = 0

      switch (sortBy) {
        case 'date':
          comparison = a.date.getTime() - b.date.getTime()
          break
        case 'amount':
          comparison = Math.abs(a.amount) - Math.abs(b.amount)
          break
        case 'merchant':
          comparison = a.merchantName.localeCompare(b.merchantName)
          break
      }

      return sortOrder === 'asc' ? comparison : -comparison
    })

    return filtered
  }, [transactions, searchTerm, selectedCategory, sortBy, sortOrder])

  // Calculate financial metrics
  const netWorth: NetWorth = useMemo(() => {
    if (!useDemoData || accounts.length === 0) {
      return {
        netWorth: 0,
        cashOnHand: 0,
        investments: 0,
        owedRevenue: 0,
        creditCardDebt: 0
      }
    }
    const owedRevenue = financeService.getTotalOwed(expectedPayments)
    return financeService.calculateNetWorth(accounts, owedRevenue)
  }, [useDemoData, accounts, expectedPayments])

  const monthlyTotals = useMemo(() => {
    if (!useDemoData || transactions.length === 0) {
      return { income: 0, expenses: 0 }
    }
    return financeService.calculateMonthlyTotals(transactions)
  }, [useDemoData, transactions])

  const monthlyNet = monthlyTotals.income - monthlyTotals.expenses
  const overduePayments = useMemo(() =>
    financeService.getOverduePayments(expectedPayments),
    [expectedPayments]
  )

  // Tax calculations
  const taxSnapshot = useMemo(() => {
    if (!useDemoData || transactions.length === 0) return null

    return taxService.createTaxSnapshot(
      transactions,
      {
        filingStatus: TaxFilingStatus.SINGLE,
        selfEmployed: true,
        deductions: [],
        dependents: 0,
        otherIncome: 0,
        paymentFrequency: 'Quarterly' as any,
        state: 'California'
      },
      0, // Tax savings
      0  // Paid taxes
    )
  }, [useDemoData, transactions])

  const handleToggleDemoData = () => {
    if (!useDemoData) {
      // Load demo data
      setTransactions(financeService.generateDemoTransactions())
      setAccounts(financeService.generateDemoBankAccounts())
      setExpectedPayments(financeService.generateDemoExpectedPayments())
      setStatements(financeService.generateDemoRoyaltyStatements())
    } else {
      // Clear demo data
      setTransactions([])
      setAccounts([])
      setExpectedPayments([])
      setStatements([])
    }
    setUseDemoData(!useDemoData)
  }

  const handleConnectBank = () => {
    // This would trigger Plaid Link in production
    alert('Bank connection coming soon! Use Demo Data to explore the interface.')
  }

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-900 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-black dark:text-white">Finances</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowCharts(!showCharts)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              showCharts ? 'bg-brand-orange text-white' : 'bg-gray-100 dark:bg-neutral-700 text-gray-700 dark:text-neutral-300 hover:bg-gray-200 dark:hover:bg-neutral-600'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span className="text-sm">Charts</span>
          </button>

          <button
            onClick={() => setShowTaxAssistant(!showTaxAssistant)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              showTaxAssistant ? 'bg-brand-orange text-white' : 'bg-gray-100 dark:bg-neutral-700 text-gray-700 dark:text-neutral-300 hover:bg-gray-200 dark:hover:bg-neutral-600'
            }`}
          >
            <Calculator className="w-4 h-4" />
            <span className="text-sm">Tax Assistant</span>
          </button>

          <button
            onClick={handleToggleDemoData}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 dark:bg-neutral-700 hover:bg-gray-200 dark:hover:bg-neutral-600 transition-colors"
          >
            <div className={`w-2 h-2 rounded-full ${useDemoData ? 'bg-brand-orange' : 'bg-gray-400 dark:bg-gray-500'}`} />
            <span className="text-sm text-gray-700 dark:text-neutral-300">Demo Data</span>
          </button>
        </div>
      </div>

      {/* Empty State */}
      {!useDemoData && transactions.length === 0 && statements.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-20 px-4"
        >
          <div className="w-20 h-20 rounded-full bg-brand-orange/10 flex items-center justify-center mb-6">
            <TrendingUp className="w-10 h-10 text-brand-orange" />
          </div>

          <h2 className="text-2xl font-bold text-black dark:text-white mb-3">Track Your Music Revenue</h2>
          <p className="text-gray-600 dark:text-neutral-400 text-center max-w-md mb-8">
            Upload royalty statements or connect your bank to track income, expenses, and what you're owed.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 w-full max-w-lg">
            <button
              className="flex-1 flex items-center justify-between px-6 py-4 rounded-xl bg-brand-orange hover:bg-brand-orange-dark transition-colors group shadow-sm"
            >
              <div className="flex items-center gap-3">
                <Upload className="w-6 h-6 text-white" />
                <div className="text-left">
                  <div className="font-semibold text-white">Upload Statement</div>
                  <div className="text-sm text-white/90">CSV from DistroKid, TuneCore, etc.</div>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-white group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              onClick={handleConnectBank}
              className="flex-1 flex items-center justify-between px-6 py-4 rounded-xl bg-gray-100 dark:bg-neutral-700 hover:bg-gray-200 transition-colors group shadow-sm"
            >
              <div className="flex items-center gap-3">
                <Wallet className="w-6 h-6 text-gray-700 dark:text-neutral-300" />
                <div className="text-left">
                  <div className="font-semibold text-gray-900 dark:text-white">Connect Bank</div>
                  <div className="text-sm text-gray-600 dark:text-neutral-400">Auto-track all income & expenses</div>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-700 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </motion.div>
      )}

      {/* Dashboard Content */}
      {(useDemoData && accounts.length > 0) && (
        <div className="space-y-6">
          {/* Net Worth Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-8 px-6 rounded-2xl bg-gradient-to-br from-brand-orange/5 to-brand-orange/10 border border-brand-orange/20"
          >
            <div className="text-6xl font-bold text-brand-orange mb-3">
              ${netWorth.netWorth.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="flex items-center justify-center gap-2 text-gray-700 dark:text-neutral-300">
              {monthlyNet >= 0 ? (
                <TrendingUp className="w-5 h-5 text-brand-orange" />
              ) : (
                <TrendingDown className="w-5 h-5 text-red-500" />
              )}
              <span className="text-lg font-semibold text-brand-orange">
                {monthlyNet >= 0 ? '+' : ''}${Math.abs(monthlyNet).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
              <span className="text-gray-600 dark:text-neutral-400">this month</span>
            </div>
          </motion.div>

          {/* Royalty Statements Section */}
          {statements.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="space-y-3"
            >
              <div className="flex items-center justify-between">
                <button className="flex items-center gap-2 text-brand-orange hover:text-brand-orange-dark transition-colors">
                  <Upload className="w-5 h-5" />
                  <span className="font-medium">Upload Statement</span>
                </button>
                <button className="flex items-center gap-2 text-brand-orange hover:text-brand-orange-dark transition-colors">
                  <span className="font-medium">View All</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2">
                {statements.slice(0, 3).map((statement) => (
                  <motion.div
                    key={statement.id}
                    whileHover={{ scale: 1.01 }}
                    className="p-4 rounded-xl bg-gray-50 hover:bg-gray-100 dark:bg-neutral-700 transition-colors cursor-pointer shadow-sm border border-gray-200 dark:border-neutral-700"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">{statement.statementType}</div>
                        <div className="text-sm text-gray-600 dark:text-neutral-400">
                          {statement.startDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })} •
                          ${statement.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-brand-orange" />
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Assets Breakdown */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-2xl bg-gray-50 border border-gray-200 overflow-hidden shadow-sm"
          >
            <AssetRow
              icon={<Wallet className="w-5 h-5" />}
              label="Cash"
              amount={netWorth.cashOnHand}
            />
            <div className="h-px bg-gray-200 mx-4" />
            <AssetRow
              icon={<TrendingUp className="w-5 h-5" />}
              label="Invested"
              amount={netWorth.investments}
            />
            <div className="h-px bg-gray-200 mx-4" />
            <AssetRow
              icon={<Music className="w-5 h-5" />}
              label="Owed"
              amount={netWorth.owedRevenue}
              showWarning={netWorth.owedRevenue > 0}
            />
            {netWorth.creditCardDebt > 0 && (
              <>
                <div className="h-px bg-gray-200 mx-4" />
                <AssetRow
                  icon={<CreditCard className="w-5 h-5" />}
                  label="Debt"
                  amount={-netWorth.creditCardDebt}
                  isDebt
                />
              </>
            )}
          </motion.div>

          {/* Monthly Snapshot */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="rounded-2xl bg-gray-50 border border-gray-200 overflow-hidden shadow-sm"
          >
            <AssetRow
              icon={<TrendingDown className="w-5 h-5 text-brand-orange/80" />}
              label="Income"
              amount={monthlyTotals.income}
            />
            <div className="h-px bg-gray-200 mx-4" />
            <AssetRow
              icon={<TrendingUp className="w-5 h-5 text-brand-orange/80" />}
              label="Expenses"
              amount={monthlyTotals.expenses}
              secondary
            />
          </motion.div>

          {/* Overdue Payments */}
          {overduePayments.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="p-6 rounded-2xl bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 shadow-sm"
            >
              <div className="flex items-start gap-3 mb-4">
                <AlertCircle className="w-6 h-6 text-brand-orange flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-lg font-bold text-brand-orange mb-1">
                    You're Owed ${financeService.getTotalOwed(expectedPayments).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </h3>
                  <p className="text-sm text-gray-700 dark:text-neutral-300">
                    {overduePayments.length} payment{overduePayments.length > 1 ? 's' : ''} overdue
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                {overduePayments.map((payment) => (
                  <div
                    key={payment.id}
                    className="p-4 rounded-xl bg-white dark:bg-neutral-800 cursor-pointer hover:bg-gray-50 dark:hover:bg-neutral-700 transition-colors border border-gray-200 dark:border-neutral-700"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-gray-900 dark:text-white">{payment.distributor}</div>
                        <div className="text-sm text-brand-orange">
                          ${payment.expectedAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })} • {payment.daysLate} days late
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-brand-orange" />
                    </div>
                  </div>
                ))}
              </div>

              <button className="w-full mt-4 px-6 py-3 rounded-xl bg-brand-orange hover:bg-brand-orange-dark transition-colors font-semibold text-white shadow-sm">
                Contact Distributors
              </button>
            </motion.div>
          )}

          {/* Tax Assistant Summary */}
          {showTaxAssistant && taxSnapshot && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl bg-gradient-to-br from-brand-orange/5 to-brand-orange/10 border border-brand-orange/20 p-6 shadow-sm"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Tax Assistant</h2>
                  <p className="text-gray-600 dark:text-neutral-400 text-sm">Estimated quarterly payments</p>
                </div>
                <div className={`px-4 py-2 rounded-full text-sm font-semibold ${
                  taxSnapshot.riskLevel === 'None' || taxSnapshot.riskLevel === 'Low'
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                    : taxSnapshot.riskLevel === 'Medium'
                    ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                    : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                }`}>
                  {taxSnapshot.riskLevel} Risk
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 shadow-sm">
                  <div className="text-gray-600 dark:text-neutral-400 text-sm mb-1">YTD Income</div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">${taxSnapshot.ytdIncome.toFixed(2)}</div>
                </div>

                <div className="p-4 rounded-xl bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 shadow-sm">
                  <div className="text-gray-600 dark:text-neutral-400 text-sm mb-1">Estimated Annual Tax</div>
                  <div className="text-2xl font-bold text-brand-orange">${taxSnapshot.estimatedAnnualTax.toFixed(2)}</div>
                </div>

                <div className="p-4 rounded-xl bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 shadow-sm">
                  <div className="text-gray-600 dark:text-neutral-400 text-sm mb-1">Next Payment</div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">${taxSnapshot.nextPaymentAmount.toFixed(2)}</div>
                  <div className="text-xs text-gray-500 dark:text-neutral-400 mt-1">
                    Due {taxSnapshot.nextPaymentDue.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </div>
                </div>
              </div>

              {taxSnapshot.savingsDeficit > 0 && (
                <div className="mt-4 p-4 rounded-xl bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="font-semibold text-yellow-800 dark:text-yellow-400">Savings Needed</div>
                      <div className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                        You need to save ${taxSnapshot.savingsDeficit.toFixed(2)} more for your next tax payment.
                        Try saving ${(taxSnapshot.savingsDeficit / 4).toFixed(2)} per week.
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* Charts */}
          {showCharts && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <Suspense fallback={
                <div className="flex items-center justify-center p-12 bg-gray-50 dark:bg-neutral-800 rounded-2xl">
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-brand-orange border-t-transparent" />
                </div>
              }>
                <FinanceCharts transactions={filteredTransactions} />
              </Suspense>
            </motion.div>
          )}

          {/* Transaction Filters & Export */}
          {transactions.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Transactions</h2>
                <ExportMenu transactions={filteredTransactions} monthlyIncome={monthlyTotals.income} monthlyExpenses={monthlyTotals.expenses} />
              </div>

              <TransactionFilters
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                selectedCategory={selectedCategory}
                onCategoryChange={setSelectedCategory}
                sortBy={sortBy}
                onSortChange={setSortBy}
                sortOrder={sortOrder}
                onSortOrderChange={setSortOrder}
              />

              {/* Transaction List */}
              <div className="space-y-2">
                {filteredTransactions.map((transaction) => {
                  const categoryInfo = getCategoryInfo(transaction.category)
                  return (
                    <motion.div
                      key={transaction.id}
                      whileHover={{ scale: 1.01 }}
                      className="p-4 rounded-xl bg-white dark:bg-neutral-800 hover:bg-white/95 dark:hover:bg-neutral-700/95 transition-all cursor-pointer shadow-sm"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-11 h-11 rounded-full bg-brand-orange/10 flex items-center justify-center flex-shrink-0">
                          <Music className="w-5 h-5 text-brand-orange" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-black dark:text-white truncate">{transaction.merchantName}</div>
                          <div className="flex items-center gap-2 text-sm text-black/60 dark:text-neutral-400">
                            <span>{transaction.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                            <span>•</span>
                            <span>{categoryInfo.displayName}</span>
                          </div>
                        </div>
                        <div className="font-bold text-brand-orange">
                          {transaction.amount >= 0 ? '+' : ''}${Math.abs(transaction.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </div>

              {filteredTransactions.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  No transactions match your filters
                </div>
              )}
            </motion.div>
          )}
        </div>
      )}
    </div>
  )
}

// Asset Row Component
function AssetRow({
  icon,
  label,
  amount,
  showWarning = false,
  isDebt = false,
  secondary = false
}: {
  icon: React.ReactNode
  label: string
  amount: number
  showWarning?: boolean
  isDebt?: boolean
  secondary?: boolean
}) {
  return (
    <div className="flex items-center gap-4 px-4 py-4">
      <div className="text-brand-orange">{icon}</div>
      <div className="flex-1 text-gray-900 dark:text-white">{label}</div>
      {showWarning && <AlertCircle className="w-4 h-4 text-brand-orange" />}
      <div className={`text-xl font-bold ${isDebt ? 'text-red-500' : secondary ? 'text-gray-700 dark:text-neutral-300' : 'text-brand-orange'}`}>
        ${Math.abs(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </div>
    </div>
  )
}
