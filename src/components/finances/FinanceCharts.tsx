'use client'

import { useMemo } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts'
import { getCategoryInfo, type CategorizedTransaction } from '@/lib/types/finance'

interface FinanceChartsProps {
  transactions: CategorizedTransaction[]
}

export default function FinanceCharts({ transactions }: FinanceChartsProps) {
  const categoryData = useMemo(() => {
    const categoryTotals = new Map<string, number>()

    transactions.forEach(t => {
      if (t.amount < 0) { // Only expenses for category breakdown
        const category = getCategoryInfo(t.category).displayName
        categoryTotals.set(category, (categoryTotals.get(category) || 0) + Math.abs(t.amount))
      }
    })

    return Array.from(categoryTotals.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8) // Top 8 categories
  }, [transactions])

  const monthlyData = useMemo(() => {
    const months = new Map<string, { income: number; expenses: number }>()
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

    transactions.forEach(t => {
      const monthKey = `${monthNames[t.date.getMonth()]} ${t.date.getFullYear()}`
      const existing = months.get(monthKey) || { income: 0, expenses: 0 }

      if (t.amount > 0) {
        existing.income += t.amount
      } else {
        existing.expenses += Math.abs(t.amount)
      }

      months.set(monthKey, existing)
    })

    return Array.from(months.entries())
      .map(([month, data]) => ({ month, ...data }))
      .slice(-6) // Last 6 months
  }, [transactions])

  const COLORS = ['#FF6B00', '#F97316', '#FB923C', '#FDBA74', '#FED7AA', '#FFEDD5', '#FFF7ED', '#FFF9F5']

  if (transactions.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        No transaction data available
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Monthly Income vs Expenses */}
      <div className="rounded-2xl bg-white border border-gray-200 p-6 shadow-sm">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Income vs Expenses</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={monthlyData}>
            <XAxis dataKey="month" stroke="#FFFFFF60" />
            <YAxis stroke="#FFFFFF60" />
            <Tooltip
              contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px' }}
              labelStyle={{ color: '#FFFFFF' }}
            />
            <Legend />
            <Bar dataKey="income" fill="#10B981" name="Income" />
            <Bar dataKey="expenses" fill="#EF4444" name="Expenses" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Category Breakdown */}
      <div className="rounded-2xl bg-white border border-gray-200 p-6 shadow-sm">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Spending by Category</h3>
        <div className="flex flex-col md:flex-row items-center gap-8">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry) => `${entry.name}: $${entry.value.toFixed(0)}`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px' }}
              />
            </PieChart>
          </ResponsiveContainer>

          <div className="flex-1 space-y-2">
            {categoryData.map((cat, idx) => (
              <div key={cat.name} className="flex items-center gap-3">
                <div
                  className="w-4 h-4 rounded"
                  style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                />
                <span className="text-sm text-gray-700 flex-1">{cat.name}</span>
                <span className="text-sm font-semibold text-[#FF6B00]">
                  ${cat.value.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
