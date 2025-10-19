# CEO App - Web Platform

> A beautiful, modern web application for independent music artists to manage their entire business—streaming analytics, contracts, finances, team collaboration, and more.

## 🎯 Overview

CEO App is a comprehensive music business management platform that brings together:

- **Streaming Analytics** - Real-time insights from Luminate API with geographic data
- **Fair Deal Contracts** - Pre-built templates and AI-powered analysis
- **Financial Dashboard** - Bank integration, smart categorization, tax planning
- **Team Collaboration** - Real-time wall, file sharing, presence indicators
- **Code Sculpture** - 3D visualization of your creative journey
- **AI Assistant** - Context-aware help for all your music business questions

## 🚀 Tech Stack

### Core
- **Next.js 15.5.6** with Turbopack - Latest React framework with App Router
- **React 19.1.0** - Latest React with concurrent features
- **TypeScript 5** - Full type safety and modern DX
- **Tailwind CSS 4.0** - Utility-first styling with custom theme
- **Framer Motion 12** - Smooth animations and transitions

### Data & Auth
- **Supabase** - PostgreSQL database, OAuth authentication, real-time, storage
- **React Query 5** (TanStack) - Server state management and caching
- **Zustand 5** - Lightweight client state management
- **Zod 4** - Schema validation

### UI Components
- **shadcn/ui** - Beautiful, accessible component primitives
- **Lucide React** - Modern icon system
- **Recharts 3** - Interactive data visualization

### Security & Monitoring
- **Sentry** - Error monitoring and performance tracking
- **DOMPurify** - Input sanitization and XSS prevention
- **Web Vitals** - Core Web Vitals monitoring
- **Rate Limiting** - Built-in API protection

### Integrations
- **Luminate API** - Streaming data and analytics
- **Plaid** - Bank account integration
- **Railway** - AI assistant backend with Claude

### Testing
- **Vitest 3** - Fast unit testing
- **React Testing Library 16** - Component testing
- **JSDOM** - Browser environment simulation

## 📁 Project Structure

```
ceo-app-web/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/            # Authentication pages
│   │   ├── (dashboard)/       # Protected dashboard routes
│   │   │   ├── analytics/
│   │   │   ├── contracts/
│   │   │   ├── finances/
│   │   │   ├── teams/
│   │   │   └── sculpture/
│   │   ├── api/               # API routes (server-side)
│   │   ├── globals.css        # Global styles + Tailwind
│   │   └── layout.tsx         # Root layout
│   │
│   ├── components/            # React components
│   │   ├── ui/               # Base UI components (shadcn)
│   │   ├── dashboard/        # Dashboard-specific
│   │   ├── analytics/        # Analytics module
│   │   ├── contracts/        # Contracts module
│   │   ├── finances/         # Finances module
│   │   ├── teams/            # Teams module
│   │   ├── sculpture/        # Code Sculpture
│   │   ├── auth/             # Auth components
│   │   └── shared/           # Shared/common components
│   │
│   └── lib/                  # Core libraries
│       ├── supabase/         # Supabase clients
│       │   ├── client.ts     # Browser client
│       │   └── server.ts     # Server client
│       ├── services/         # Business logic services
│       ├── hooks/            # Custom React hooks
│       ├── types/            # TypeScript types
│       │   └── database.ts   # Supabase DB types
│       └── utils.ts          # Utility functions
│
├── public/                   # Static assets
├── tailwind.config.ts        # Tailwind configuration
├── next.config.js            # Next.js configuration
├── tsconfig.json             # TypeScript configuration
└── package.json              # Dependencies and scripts
```

## 🛠️ Getting Started

### Prerequisites

- Node.js 18+ and npm
- A Supabase account and project
- (Optional) Luminate API credentials
- (Optional) Plaid developer account

### Installation

1. **Clone and install dependencies:**

```bash
cd /Users/j/Projects/ceo-app-web
npm install
```

2. **Set up environment variables:**

```bash
cp .env.local.example .env.local
```

Then edit `.env.local` with your actual credentials.

3. **Run the development server:**

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Database Setup

1. Go to your Supabase project dashboard
2. Run the SQL migrations (if provided in `/supabase/migrations`)
3. Generate TypeScript types:

```bash
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/lib/types/database.ts
```

## 🎨 Design System

### Brand Colors

```css
Primary Orange:   #FF6B00
Orange Dark:      #E65100
Income Green:     #10B981
Expense Red:      #EF4444
```

### Component Philosophy

- **Minimal & Borderless** - Clean aesthetic with subtle shadows
- **Glassmorphism** - Backdrop blur for depth
- **Smooth Animations** - Framer Motion for delightful micro-interactions
- **Responsive** - Mobile-first with desktop enhancements
- **Accessible** - WCAG 2.1 AA compliant

### Custom Utilities

```tsx
// Utility classes
.glass              // Glassmorphism effect
.gradient-text      // Orange gradient text
.transition-smooth  // Standard transition timing
.card-hover         // Card hover effect
.animated-gradient  // Animated background gradient
.skeleton           // Loading skeleton
```

## 📝 Development Guidelines

### Code Style

- Use TypeScript for all new files
- Follow the existing folder structure
- Components use PascalCase (e.g., `DashboardLayout.tsx`)
- Utilities use camelCase (e.g., `formatCurrency.ts`)
- Always extract reusable logic into custom hooks
- Keep components small and focused (< 200 lines)

### Performance Best Practices

```tsx
// ✅ Good: Code splitting with dynamic imports
const Analytics = dynamic(() => import('@/components/analytics/AnalyticsView'))

// ✅ Good: Optimistic UI updates
const { mutate } = useMutation({
  onMutate: async (newData) => {
    // Update UI immediately
    await queryClient.cancelQueries(['posts'])
    const previous = queryClient.getQueryData(['posts'])
    queryClient.setQueryData(['posts'], old => [...old, newData])
    return { previous }
  }
})

// ✅ Good: Memoization for expensive computations
const sortedData = useMemo(() =>
  data.sort((a, b) => b.streams - a.streams),
  [data]
)
```

### State Management

```tsx
// Client state: Zustand
import { create } from 'zustand'

interface AppState {
  sidebar: boolean
  toggleSidebar: () => void
}

export const useAppStore = create<AppState>((set) => ({
  sidebar: true,
  toggleSidebar: () => set((state) => ({ sidebar: !state.sidebar })),
}))

// Server state: React Query
const { data, isLoading } = useQuery({
  queryKey: ['teams'],
  queryFn: async () => {
    const supabase = createSupabaseBrowserClient()
    const { data } = await supabase.from('teams').select('*')
    return data
  },
  staleTime: 30_000, // 30 seconds
})
```

## 🔒 Security

CEO App implements enterprise-grade security. See [SECURITY.md](./SECURITY.md) for full details.

### Frontend Security
- ✅ HTTPS everywhere (Vercel auto-SSL)
- ✅ Input validation with Zod schemas
- ✅ HTML sanitization with DOMPurify
- ✅ No sensitive data in browser storage
- ✅ CSRF protection (Next.js built-in)
- ✅ No API keys exposed in client code
- ✅ Content Security Policy headers

### Backend Security
- ✅ OAuth 2.0 with PKCE flow (Supabase)
- ✅ JWT authentication with auto-refresh
- ✅ Row Level Security (RLS) policies
- ✅ Server-only API keys in environment variables
- ✅ Parameterized queries (Supabase automatic)
- ✅ Comprehensive security headers
- ✅ Rate limiting on all API routes:
  - Contract analysis: 10/hour per IP
  - General API: 100/minute per IP
  - Auth: 5/15min per IP
  - Luminate: 60/minute per IP
- ✅ Error monitoring with Sentry (sensitive data filtered)

## 📦 Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for complete deployment guide.

### Quick Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy to production
vercel --prod
```

### Environment Variables Checklist

Required variables in production:
- ✅ `NEXT_PUBLIC_SUPABASE_URL`
- ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- ✅ `SUPABASE_SERVICE_ROLE_KEY`
- ✅ `RAILWAY_API_URL`
- ⚠️ `NEXT_PUBLIC_SENTRY_DSN` (recommended)
- ⚠️ `RAILWAY_API_KEY` (optional)
- ⚠️ `LUMINATE_API_KEY` (optional)
- ⚠️ `PLAID_CLIENT_ID` (optional)
- ⚠️ `PLAID_SECRET` (optional)

### Post-Deployment Checklist

- [ ] OAuth redirect URLs updated
- [ ] Custom domain configured
- [ ] SSL certificate active
- [ ] Sentry receiving errors
- [ ] Web Vitals being tracked
- [ ] Rate limiting tested
- [ ] Database RLS policies enabled

## 🧪 Testing

```bash
# Run unit tests
npm test

# Run tests with UI
npm run test:ui

# Generate coverage report
npm run test:coverage

# Type checking
npx tsc --noEmit

# Linting
npm run lint

# Build verification
npm run build
```

### Test Structure

```
src/test/
├── utils/
│   └── test-utils.tsx        # Custom render functions
├── lib/
│   └── ratelimit.test.ts     # Rate limiting tests
└── services/
    └── financeService.test.ts # Service tests
```

### Writing Tests

```tsx
import { describe, it, expect } from 'vitest'
import { renderWithProviders, screen } from '@/test/utils/test-utils'
import { MyComponent } from '@/components/MyComponent'

describe('MyComponent', () => {
  it('renders correctly', () => {
    renderWithProviders(<MyComponent />)
    expect(screen.getByText('Hello')).toBeInTheDocument()
  })
})
```

## 📚 Key Features Implementation Status

| Feature | Status | Notes |
|---------|--------|-------|
| Landing Page | ✅ Complete | Modern, animated hero |
| Authentication | 🚧 In Progress | Supabase client configured |
| Dashboard Shell | 📋 Planned | Sidebar navigation |
| Analytics | 📋 Planned | Luminate integration |
| Contracts | 📋 Planned | Templates + AI analyzer |
| Finances | 📋 Planned | Plaid integration |
| Teams | 📋 Planned | Real-time collaboration |
| Code Sculpture | 📋 Planned | 3D visualization |
| AI Assistant | 📋 Planned | Railway API integration |
| PWA | 📋 Planned | Offline support |

## 🤝 Contributing

This is a proprietary project for CEO App. For questions or suggestions, contact the development team.

## 📄 License

Copyright © 2025 CEO App. All rights reserved.

---

## 🔗 Useful Links

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [shadcn/ui](https://ui.shadcn.com)
- [React Query](https://tanstack.com/query/latest)

## 💡 Tips for New Developers

1. **Start with the types** - Understanding `src/lib/types/database.ts` gives you the data structure
2. **Follow the patterns** - Look at existing components for structure
3. **Use the utilities** - `src/lib/utils.ts` has helpers for common tasks
4. **Leverage React Query** - Don't manually manage loading states
5. **Keep it DRY** - Extract reusable logic into hooks or utilities

---

Built with ❤️ for independent artists
