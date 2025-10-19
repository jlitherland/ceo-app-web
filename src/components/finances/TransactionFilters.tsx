'use client'

import { useState } from 'react'
import { Search, Filter, X } from 'lucide-react'
import { TransactionCategory, TRANSACTION_CATEGORIES } from '@/lib/types/finance'

interface TransactionFiltersProps {
  searchTerm: string
  onSearchChange: (term: string) => void
  selectedCategory: TransactionCategory | 'all'
  onCategoryChange: (category: TransactionCategory | 'all') => void
  sortBy: 'date' | 'amount' | 'merchant'
  onSortChange: (sort: 'date' | 'amount' | 'merchant') => void
  sortOrder: 'asc' | 'desc'
  onSortOrderChange: (order: 'asc' | 'desc') => void
}

export default function TransactionFilters({
  searchTerm,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  sortBy,
  onSortChange,
  sortOrder,
  onSortOrderChange
}: TransactionFiltersProps) {
  const [showFilters, setShowFilters] = useState(false)

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search transactions..."
          className="w-full pl-12 pr-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#FF6B00] transition-colors shadow-sm"
        />
        {searchTerm && (
          <button
            onClick={() => onSearchChange('')}
            className="absolute right-4 top-1/2 -translate-y-1/2"
          >
            <X className="w-5 h-5 text-gray-400 hover:text-gray-600 transition-colors" />
          </button>
        )}
      </div>

      {/* Filter Toggle */}
      <button
        onClick={() => setShowFilters(!showFilters)}
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors text-gray-700"
      >
        <Filter className="w-4 h-4" />
        <span className="text-sm font-medium">
          {showFilters ? 'Hide Filters' : 'Show Filters'}
        </span>
      </button>

      {/* Filters Panel */}
      {showFilters && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-xl bg-gray-50 border border-gray-200 shadow-sm">
          {/* Category Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => onCategoryChange(e.target.value as TransactionCategory | 'all')}
              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:border-[#FF6B00]"
            >
              <option value="all">All Categories</option>
              <optgroup label="Income">
                {Object.values(TransactionCategory)
                  .filter(cat => TRANSACTION_CATEGORIES[cat].isIncome)
                  .map(cat => (
                    <option key={cat} value={cat}>
                      {TRANSACTION_CATEGORIES[cat].displayName}
                    </option>
                  ))}
              </optgroup>
              <optgroup label="Expenses">
                {Object.values(TransactionCategory)
                  .filter(cat => !TRANSACTION_CATEGORIES[cat].isIncome)
                  .map(cat => (
                    <option key={cat} value={cat}>
                      {TRANSACTION_CATEGORIES[cat].displayName}
                    </option>
                  ))}
              </optgroup>
            </select>
          </div>

          {/* Sort By */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
            <select
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value as 'date' | 'amount' | 'merchant')}
              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:border-[#FF6B00]"
            >
              <option value="date">Date</option>
              <option value="amount">Amount</option>
              <option value="merchant">Merchant</option>
            </select>
          </div>

          {/* Sort Order */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Order</label>
            <select
              value={sortOrder}
              onChange={(e) => onSortOrderChange(e.target.value as 'asc' | 'desc')}
              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:border-[#FF6B00]"
            >
              <option value="desc">Newest First</option>
              <option value="asc">Oldest First</option>
            </select>
          </div>
        </div>
      )}
    </div>
  )
}
