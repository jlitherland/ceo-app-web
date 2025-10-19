# Deployment Guide

Complete guide for deploying CEO App Web to production.

## Prerequisites

1. **Accounts Required**
   - [Vercel](https://vercel.com) account
   - [Supabase](https://supabase.com) project
   - [Sentry](https://sentry.io) account (optional but recommended)
   - [Railway](https://railway.app) account (for AI backend)
   - [Luminate](https://luminatedata.com) API access (optional)
   - [Plaid](https://plaid.com) account (optional, for bank integration)

2. **Local Setup**
   ```bash
   npm install
   cp .env.local.example .env.local
   # Fill in your environment variables
   ```

## Deployment Steps

### 1. Supabase Setup

```bash
# Create a new Supabase project at https://supabase.com

# Enable OAuth providers:
# 1. Go to Authentication > Providers
# 2. Enable Google OAuth
# 3. Enable Apple OAuth
# 4. Configure redirect URLs:
#    - http://localhost:3000/auth/callback (development)
#    - https://your-domain.com/auth/callback (production)

# Configure Row Level Security (RLS):
# 1. Go to Database > Tables
# 2. Create policies for users, teams, wall_posts tables
# 3. Enable RLS on all tables

# Get your credentials:
# Settings > API
# - NEXT_PUBLIC_SUPABASE_URL
# - NEXT_PUBLIC_SUPABASE_ANON_KEY
# - SUPABASE_SERVICE_ROLE_KEY (keep secret!)
```

### 2. Sentry Setup

```bash
# Create a new project at https://sentry.io

# 1. Choose "Next.js" as platform
# 2. Copy your DSN
# 3. Add to environment variables:
#    NEXT_PUBLIC_SENTRY_DSN=your-dsn-here

# 4. Configure data scrubbing:
#    Settings > Security & Privacy > Data Scrubbing
#    Enable automatic scrubbing of:
#    - Authorization headers
#    - Cookies
#    - Environment variables
```

### 3. Railway Backend Setup

```bash
# Deploy the AI backend to Railway:
# 1. Create new project at https://railway.app
# 2. Deploy from GitHub repository
# 3. Add environment variables:
#    - SUPABASE_URL
#    - SUPABASE_SERVICE_ROLE_KEY
#    - CLAUDE_API_KEY
#    - LUMINATE_API_KEY

# 4. Get your Railway URL:
#    RAILWAY_API_URL=https://your-app.up.railway.app
#    RAILWAY_API_KEY=your-railway-api-key (optional)
```

### 4. Vercel Deployment

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Link project
vercel link

# Add environment variables
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY
vercel env add NEXT_PUBLIC_SENTRY_DSN
vercel env add RAILWAY_API_URL
vercel env add RAILWAY_API_KEY

# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

Or deploy via Vercel Dashboard:

1. Import your GitHub repository
2. Configure environment variables in Settings > Environment Variables
3. Deploy

### 5. Post-Deployment Configuration

#### Update OAuth Redirect URLs

```bash
# Supabase:
# 1. Go to Authentication > URL Configuration
# 2. Add Site URL: https://your-domain.com
# 3. Add Redirect URL: https://your-domain.com/auth/callback

# Google OAuth:
# 1. Go to Google Cloud Console
# 2. Add https://your-domain.com to authorized domains
# 3. Add https://your-project.supabase.co/auth/v1/callback to redirect URIs

# Apple OAuth:
# 1. Go to Apple Developer Console
# 2. Add https://your-project.supabase.co/auth/v1/callback to redirect URIs
```

#### Configure Custom Domain

```bash
# In Vercel Dashboard:
# 1. Go to Settings > Domains
# 2. Add your custom domain
# 3. Configure DNS records as shown
# 4. Wait for SSL certificate provisioning (automatic)
```

#### Test Production Deployment

```bash
# Test critical flows:
1. Visit https://your-domain.com
2. Test OAuth login (Google & Apple)
3. Upload and analyze a test contract
4. Test finance dashboard with demo data
5. Verify rate limiting (make 11 contract analysis requests)
6. Check Sentry for any errors
7. Review Web Vitals in console
```

## Environment Variables

### Required

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Railway AI Backend
RAILWAY_API_URL=https://your-app.up.railway.app
```

### Optional

```bash
# Sentry (highly recommended)
NEXT_PUBLIC_SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx

# Railway API Key (if using authentication)
RAILWAY_API_KEY=your-railway-api-key

# Luminate API (for streaming analytics)
LUMINATE_API_KEY=your-luminate-api-key

# Plaid (for bank integration)
PLAID_CLIENT_ID=your-plaid-client-id
PLAID_SECRET=your-plaid-secret
PLAID_ENV=production

# App Configuration
NEXT_PUBLIC_APP_URL=https://your-domain.com
NODE_ENV=production

# Analytics (optional)
NEXT_PUBLIC_ANALYTICS_ENDPOINT=https://your-analytics-endpoint.com/api/vitals
```

## Performance Optimization

### Enable Vercel Analytics

```bash
# Install Vercel Analytics
npm install @vercel/analytics

# Add to root layout (already configured)
import { Analytics } from '@vercel/analytics/react'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
```

### Enable Caching

```bash
# next.config.ts already configured with:
# - Image optimization
# - Package import optimization
# - Security headers

# Vercel automatically handles:
# - CDN caching
# - Edge caching
# - Compression (gzip, brotli)
```

### Database Optimization

```bash
# Supabase:
# 1. Enable connection pooling
# 2. Add database indexes:
#    - users.email
#    - teams.created_by
#    - wall_posts.team_id
# 3. Enable point-in-time recovery
# 4. Configure automatic backups
```

## Monitoring

### Sentry Dashboard

```bash
# Monitor:
# 1. Error rate and trends
# 2. Performance metrics
# 3. Release tracking
# 4. User feedback

# Set up alerts:
# 1. Error spike detection
# 2. Performance degradation
# 3. New issue notifications
```

### Vercel Analytics

```bash
# Monitor:
# 1. Core Web Vitals (LCP, FID, CLS)
# 2. Page load times
# 3. Geographic performance
# 4. Device performance
```

### Supabase Metrics

```bash
# Monitor:
# 1. Database usage
# 2. API requests
# 3. Storage usage
# 4. Active connections
```

## Troubleshooting

### Common Issues

#### 1. OAuth Not Working

```bash
# Check:
# - Redirect URLs match exactly (no trailing slash)
# - OAuth provider credentials are correct
# - Supabase project URL is correct
# - Browser allows third-party cookies

# Debug:
# - Check browser console for errors
# - Verify Supabase auth logs
# - Test with different OAuth provider
```

#### 2. Rate Limiting Too Aggressive

```bash
# Adjust in src/lib/ratelimit.ts:
export const rateLimits = {
  contractAnalysis: {
    limit: 20, // Increase from 10
    window: 60 * 60 * 1000
  }
}

# For production with multiple servers:
# - Use Redis for rate limiting (@upstash/ratelimit)
# - Share rate limit state across instances
```

#### 3. Slow Performance

```bash
# Check:
# - Vercel Analytics for slow pages
# - Sentry for performance issues
# - Supabase query performance
# - Large bundle sizes (use Vercel bundle analyzer)

# Optimize:
# - Add more lazy loading
# - Reduce initial bundle size
# - Optimize images
# - Enable Vercel Edge Functions
```

#### 4. Build Failures

```bash
# Common causes:
# - Missing environment variables
# - Type errors in production build
# - Dependency conflicts

# Debug:
# - Run `npm run build` locally
# - Check Vercel build logs
# - Verify all environment variables are set
# - Clear Vercel cache and rebuild
```

## Rollback Procedure

```bash
# Vercel Dashboard:
# 1. Go to Deployments
# 2. Find last working deployment
# 3. Click "..." menu
# 4. Select "Promote to Production"

# Or via CLI:
vercel rollback
```

## Scaling Considerations

### Database

```bash
# Supabase scaling:
# - Upgrade to Pro plan for higher limits
# - Enable read replicas
# - Use connection pooling
# - Optimize queries with indexes
```

### API Routes

```bash
# Vercel scaling:
# - Serverless functions auto-scale
# - Monitor function execution times
# - Consider Edge Functions for global performance
# - Use caching for expensive operations
```

### Storage

```bash
# Supabase Storage:
# - Upload to storage buckets, not database
# - Configure appropriate bucket policies
# - Use CDN for file delivery
# - Implement file cleanup strategy
```

## Security Checklist

- [ ] All environment variables configured
- [ ] HTTPS enabled
- [ ] OAuth providers configured
- [ ] RLS policies enabled
- [ ] Rate limiting tested
- [ ] Security headers verified
- [ ] Sentry configured and working
- [ ] Input sanitization tested
- [ ] API keys rotated
- [ ] Backup strategy implemented

## Support

- Documentation: [Link to docs]
- GitHub Issues: [Link to repo]
- Email: support@ceoapp.com

Last updated: January 2025
