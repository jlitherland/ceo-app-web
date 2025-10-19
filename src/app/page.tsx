import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Minimal Header */}
      <header className="px-8 py-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="text-2xl font-bold tracking-tight">
            <span className="text-gray-900">CEO</span>
          </div>
          <div className="flex items-center gap-6">
            <Link
              href="/login"
              className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className="px-6 py-2.5 text-sm font-medium bg-gray-900 text-white rounded hover:bg-gray-800 transition-colors"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section - Centered */}
      <main className="flex-1 flex items-center justify-center px-8">
        <div className="max-w-4xl mx-auto text-center">
          {/* Tagline */}
          <p className="text-sm text-gray-500 tracking-wide mb-12">
            Your music business, simplified
          </p>

          {/* Main Headline */}
          <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-none mb-16">
            <span className="block text-gray-900 mb-2">The Operating</span>
            <span className="block text-gray-900 mb-2">System</span>
            <span className="block text-gray-900 mb-2">for</span>
            <span className="block text-[#FF6B00]">Independent</span>
            <span className="block text-[#FF6B00]">Artists</span>
          </h1>

          {/* CTA Button */}
          <div>
            <Link
              href="/signup"
              className="inline-block px-10 py-4 text-base font-medium bg-gray-900 text-white rounded hover:bg-gray-800 transition-colors"
            >
              Get Started
            </Link>
          </div>
        </div>
      </main>

      {/* Minimal Footer */}
      <footer className="px-8 py-6">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-xs text-gray-400">&copy; 2025 CEO. Built for independent artists.</p>
        </div>
      </footer>
    </div>
  )
}
