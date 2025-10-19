'use client'

/**
 * CEO Assistant Page
 * Chat interface for music business questions
 */

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Send, Trash2 } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

const SUGGESTED_QUESTIONS = [
  "Help me timeblock my day or week",
  "How do I budget for a music release?",
  "What should I know before signing with a label?",
  "How can I maximize my streaming revenue?",
  "What tax deductions are available for musicians?"
]

const SYSTEM_PROMPT = `You are an assistant specialized in music industry knowledge with extensive training on contracts, royalty structures, financial planning, and independent artist business models. You understand industry exploitation patterns and can translate complex legal and financial language into clear terms. You provide guidance on music business planning, budgeting, and tax considerations while encouraging artist independence and warning against restrictive practices.

IMPORTANT: Never suggest that artists change their creative style, sound, or artistic direction for commercial reasons. Do not recommend copying other artists' styles or suggest compromising artistic authenticity to chase trends or maximize revenue. Focus purely on business optimization, marketing strategies, and financial management while respecting the artist's creative integrity.

Be professional and direct in your responses. Avoid excessive enthusiasm, exclamation marks, or trying to appear overly human. Format your responses with proper headings, lists, and emphasis where appropriate to make the information clear and readable.`

export default function AssistantPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = async () => {
    const question = input.trim()
    if (!question || isLoading) return

    // Add user message
    const userMessage: Message = {
      role: 'user',
      content: question,
      timestamp: new Date()
    }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      // Get user JWT for authentication
      const supabase = createSupabaseBrowserClient()
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        throw new Error('Authentication required. Please sign in.')
      }

      // Build messages array in proper Claude API format
      const apiMessages: Array<{ role: 'user' | 'assistant', content: string }> = [
        // Add system prompt as first user message
        { role: 'user', content: SYSTEM_PROMPT },
        { role: 'assistant', content: 'I understand. I\'m ready to help with music business questions while respecting your creative integrity.' },
        // Add conversation history
        ...messages.map(msg => ({
          role: msg.role,
          content: msg.content
        })),
        // Add current question
        { role: 'user' as const, content: question }
      ]

      // Call Railway backend Claude API
      const response = await fetch('/api/claude', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          messages: apiMessages,
          max_tokens: 2048,
          temperature: 0.7
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to get response')
      }

      const data = await response.json()
      const assistantContent = data.response || 'Sorry, I could not generate a response.'

      const assistantMessage: Message = {
        role: 'assistant',
        content: assistantContent,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      console.error('Error:', error)
      const errorMessage: Message = {
        role: 'assistant',
        content: error instanceof Error ? error.message : 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleSuggestedQuestion = async (question: string) => {
    setInput(question)

    // Add user message
    const userMessage: Message = {
      role: 'user',
      content: question,
      timestamp: new Date()
    }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      // Get user JWT for authentication
      const supabase = createSupabaseBrowserClient()
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        throw new Error('Authentication required. Please sign in.')
      }

      // Build messages array in proper Claude API format
      const apiMessages: Array<{ role: 'user' | 'assistant', content: string }> = [
        // Add system prompt as first user message
        { role: 'user', content: SYSTEM_PROMPT },
        { role: 'assistant', content: 'I understand. I\'m ready to help with music business questions while respecting your creative integrity.' },
        // Add conversation history
        ...messages.map(msg => ({
          role: msg.role,
          content: msg.content
        })),
        // Add current question
        { role: 'user' as const, content: question }
      ]

      // Call Railway backend Claude API
      const response = await fetch('/api/claude', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          messages: apiMessages,
          max_tokens: 2048,
          temperature: 0.7
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to get response')
      }

      const data = await response.json()
      const assistantContent = data.response || 'Sorry, I could not generate a response.'

      const assistantMessage: Message = {
        role: 'assistant',
        content: assistantContent,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      console.error('Error:', error)
      const errorMessage: Message = {
        role: 'assistant',
        content: error instanceof Error ? error.message : 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleClearChat = () => {
    setMessages([])
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="h-screen flex flex-col bg-white dark:bg-neutral-900">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
        <div className="px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <div className="w-3 h-3 rounded-full bg-brand-orange"></div>
              <div className="w-3 h-3 rounded-full bg-brand-orange"></div>
              <div className="w-3 h-3 rounded-full bg-brand-orange"></div>
            </div>
            {messages.length > 0 && (
              <button
                onClick={handleClearChat}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-600 dark:text-neutral-400 hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        <div className="max-w-3xl mx-auto">
          {messages.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center h-full py-8"
            >
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-brand-orange/10 to-brand-orange/20 flex items-center justify-center mb-6">
                <Sparkles className="w-8 h-8 text-brand-orange" />
              </div>
              <h2 className="text-2xl font-bold text-black dark:text-white mb-3">
                Hi, I'm the CEO Assistant
              </h2>
              <p className="text-sm text-gray-600 dark:text-neutral-400 text-center max-w-md mb-8">
                Ask me anything about contracts, royalties, finances, or growing your music career.
              </p>

              <div className="w-full max-w-2xl space-y-3">
                <p className="text-xs font-semibold text-gray-500 dark:text-neutral-500 mb-3 uppercase">
                  Suggested Questions:
                </p>
                {SUGGESTED_QUESTIONS.map((question, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestedQuestion(question)}
                    className="w-full text-left flex items-start gap-3 p-4 rounded-xl bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 hover:bg-gray-100 dark:hover:bg-neutral-700 transition-colors"
                  >
                    <Sparkles className="w-4 h-4 text-brand-orange flex-shrink-0 mt-1" />
                    <span className="text-sm text-gray-700 dark:text-neutral-300">{question}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          ) : (
            <div className="space-y-6 pb-6">
              <AnimatePresence>
                {messages.map((message, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {message.role === 'user' ? (
                      <div className="max-w-[80%]">
                        <div className="bg-brand-orange text-white rounded-2xl px-4 py-3">
                          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="max-w-[80%]">
                        <div className="flex items-start gap-2 mb-2">
                          <div className="flex gap-1">
                            <div className="w-2 h-2 rounded-full bg-brand-orange"></div>
                            <div className="w-2 h-2 rounded-full bg-brand-orange"></div>
                            <div className="w-2 h-2 rounded-full bg-brand-orange"></div>
                          </div>
                        </div>
                        <div className="bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-2xl px-4 py-3">
                          <div className="prose prose-sm dark:prose-invert max-w-none text-gray-900 dark:text-white">
                            <ReactMarkdown>{message.content}</ReactMarkdown>
                          </div>
                        </div>
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>

              {isLoading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-start"
                >
                  <div className="bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-2xl px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 rounded-full bg-brand-orange animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-2 h-2 rounded-full bg-brand-orange animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-2 h-2 rounded-full bg-brand-orange animate-bounce" style={{ animationDelay: '300ms' }}></div>
                      </div>
                      <span className="text-sm text-gray-500 dark:text-neutral-500">Thinking...</span>
                    </div>
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </div>

      {/* Input */}
      <div className="border-t border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-6 py-4">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-end gap-2">
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about contracts, royalties, finance..."
                disabled={isLoading}
                rows={1}
                className="w-full px-4 py-3 pr-12 rounded-2xl border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-black dark:text-white placeholder-gray-400 dark:placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-brand-orange resize-none disabled:opacity-50"
                style={{ minHeight: '48px', maxHeight: '120px' }}
              />
            </div>
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="flex-shrink-0 w-12 h-12 rounded-full bg-brand-orange text-white flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-orange-600 transition-colors"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
