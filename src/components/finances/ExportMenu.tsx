'use client'

import { Download, FileText, FileSpreadsheet } from 'lucide-react'
import { CategorizedTransaction, getCategoryInfo } from '@/lib/types/finance'
import jsPDF from 'jspdf'

interface ExportMenuProps {
  transactions: CategorizedTransaction[]
  monthlyIncome: number
  monthlyExpenses: number
}

export default function ExportMenu({ transactions, monthlyIncome, monthlyExpenses }: ExportMenuProps) {
  const exportToCSV = () => {
    if (transactions.length === 0) {
      alert('No transactions to export')
      return
    }

    const headers = ['Date', 'Merchant', 'Category', 'Amount', 'Type']
    const rows = transactions.map(t => [
      t.date.toLocaleDateString(),
      t.merchantName,
      getCategoryInfo(t.category).displayName,
      Math.abs(t.amount).toFixed(2),
      t.amount >= 0 ? 'Income' : 'Expense'
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `transactions-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const exportToPDF = () => {
    if (transactions.length === 0) {
      alert('No transactions to export')
      return
    }

    const doc = new jsPDF()

    // Title
    doc.setFontSize(20)
    doc.setTextColor(255, 107, 0)
    doc.text('Financial Report', 20, 20)

    // Summary
    doc.setFontSize(12)
    doc.setTextColor(0, 0, 0)
    doc.text(`Report Date: ${new Date().toLocaleDateString()}`, 20, 35)
    doc.text(`Monthly Income: $${monthlyIncome.toFixed(2)}`, 20, 45)
    doc.text(`Monthly Expenses: $${monthlyExpenses.toFixed(2)}`, 20, 55)
    doc.text(`Net: $${(monthlyIncome - monthlyExpenses).toFixed(2)}`, 20, 65)

    // Transactions
    doc.setFontSize(14)
    doc.text('Recent Transactions', 20, 80)

    doc.setFontSize(10)
    let yPos = 90

    transactions.slice(0, 30).forEach((t, idx) => {
      if (yPos > 270) {
        doc.addPage()
        yPos = 20
      }

      const date = t.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      const category = getCategoryInfo(t.category).displayName
      const amount = `${t.amount >= 0 ? '+' : ''}$${Math.abs(t.amount).toFixed(2)}`

      doc.text(`${date} | ${t.merchantName}`, 20, yPos)
      doc.text(category, 100, yPos)
      doc.setTextColor(t.amount >= 0 ? 16 : 239, t.amount >= 0 ? 185 : 68, t.amount >= 0 ? 129 : 68)
      doc.text(amount, 160, yPos)
      doc.setTextColor(0, 0, 0)

      yPos += 10
    })

    doc.save(`financial-report-${new Date().toISOString().split('T')[0]}.pdf`)
  }

  return (
    <div className="relative group">
      <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#FF6B00] hover:bg-[#E65100] transition-colors text-black font-medium">
        <Download className="w-4 h-4" />
        <span>Export</span>
      </button>

      <div className="absolute right-0 mt-2 w-48 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
        <div className="rounded-lg bg-white shadow-lg overflow-hidden">
          <button
            onClick={exportToCSV}
            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-100 transition-colors text-left"
          >
            <FileSpreadsheet className="w-5 h-5 text-green-600" />
            <div>
              <div className="font-medium text-gray-900">Export CSV</div>
              <div className="text-xs text-gray-500">Spreadsheet format</div>
            </div>
          </button>

          <button
            onClick={exportToPDF}
            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-100 transition-colors text-left border-t"
          >
            <FileText className="w-5 h-5 text-red-600" />
            <div>
              <div className="font-medium text-gray-900">Export PDF</div>
              <div className="text-xs text-gray-500">Printable report</div>
            </div>
          </button>
        </div>
      </div>
    </div>
  )
}
