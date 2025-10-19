/**
 * Auth Layout
 * Minimal layout for authentication pages
 */

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-orange-50/30 to-white flex items-center justify-center p-4">
      {children}
    </div>
  )
}
