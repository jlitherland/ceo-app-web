'use client'

import { useState } from 'react'
import { X, Search, BookOpen } from 'lucide-react'
import { MUSIC_CONTRACT_GLOSSARY, type GlossaryTerm } from '@/lib/types/contracts'
import { cn } from '@/lib/utils'

interface GlossaryDrawerProps {
  isOpen: boolean
  onClose: () => void
}

export function GlossaryDrawer({ isOpen, onClose }: GlossaryDrawerProps) {
  const [searchQuery, setSearchQuery] = useState('')

  // Filter glossary terms based on search
  const filteredTerms = MUSIC_CONTRACT_GLOSSARY.filter((term) => {
    const query = searchQuery.toLowerCase()
    return (
      term.term.toLowerCase().includes(query) ||
      term.definition.toLowerCase().includes(query)
    )
  })

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          'fixed inset-0 bg-black transition-opacity z-40',
          isOpen ? 'opacity-50' : 'opacity-0 pointer-events-none'
        )}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={cn(
          'fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl transform transition-transform duration-300 ease-in-out z-50 flex flex-col',
          isOpen ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-brand-orange-light rounded-lg">
              <BookOpen className="w-5 h-5 text-brand-orange" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Contract Glossary
              </h2>
              <p className="text-sm text-gray-500">
                {filteredTerms.length} terms
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search terms..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-orange focus:border-brand-orange"
            />
          </div>
        </div>

        {/* Terms List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {filteredTerms.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No terms found</p>
              <p className="text-sm text-gray-400 mt-1">
                Try a different search query
              </p>
            </div>
          ) : (
            filteredTerms.map((term, index) => (
              <GlossaryTermCard key={index} term={term} />
            ))
          )}
        </div>
      </div>
    </>
  )
}

function GlossaryTermCard({ term }: { term: GlossaryTerm }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:border-brand-orange transition-colors">
      <h3 className="font-semibold text-gray-900 mb-2">{term.term}</h3>
      <p className="text-sm text-gray-600 mb-2 leading-relaxed">
        {term.definition}
      </p>
      {term.example && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <p className="text-xs font-medium text-gray-500 mb-1">Example:</p>
          <p className="text-xs text-gray-600 italic leading-relaxed">
            {term.example}
          </p>
        </div>
      )}
    </div>
  )
}
