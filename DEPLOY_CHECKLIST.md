# 🚀 Quick Deployment Checklist

Deploy your CEO App Web in **10 minutes** with this checklist.

## Pre-Deployment (5 minutes)

### 1. Push to GitHub
```bash
cd /Users/j/Projects/ceo-app-web

# Initialize Git (if not already done)
git init
git add .
git commit -m "Ready for deployment"

# Create GitHub repo at github.com/new, then:
git remote add origin https://github.com/YOUR_USERNAME/ceo-app-web.git
git branch -M main
git push -u origin main
```

### 2. Verify Environment Variables
Open your `.env.local` and verify you have:
- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] `SUPABASE_SERVICE_ROLE_KEY`
- [ ] `RAILWAY_API_URL`
- [ ] All other keys from `.env.local.example`

## Deploy to Vercel (5 minutes)

### Step 1: Sign Up
- [ ] Go to [vercel.com](https://vercel.com)
- [ ] Click "Sign Up" with GitHub

### Step 2: Import Project
- [ ] Click "Add New Project"
- [ ] Select your `ceo-app-web` repository
- [ ] Click "Import"

### Step 3: Configure
- [ ] Framework: **Next.js** (auto-detected ✅)
- [ ] Root Directory: `./` (leave default)
- [ ] Build Command: `npm run build` (auto-detected ✅)

### Step 4: Add Environment Variables
Click "Environment Variables" and add each one from your `.env.local`:

**Required Variables:**
```
NEXT_PUBLIC_SUPABASE_URL = (your value)
NEXT_PUBLIC_SUPABASE_ANON_KEY = (your value)
SUPABASE_SERVICE_ROLE_KEY = (your value)
RAILWAY_API_URL = https://ceo-app-working-production.up.railway.app
NODE_ENV = production
```

**Update this one to your Vercel URL:**
```
NEXT_PUBLIC_APP_URL = https://your-project-name.vercel.app
```

**Optional but recommended:**
```
LUMINATE_API_KEY = (your value)
LUMINATE_USERNAME = (your value)
LUMINATE_PASSWORD = (your value)
PLAID_CLIENT_ID = (your value)
PLAID_SECRET = (your value)
PLAID_ENV = sandbox
```

### Step 5: Deploy
- [ ] Click "Deploy"
- [ ] Wait 2-3 minutes ⏳
- [ ] Get your URL: `https://your-project-name.vercel.app` 🎉

## Post-Deployment Configuration

### Update Supabase OAuth URLs
1. [ ] Go to [Supabase Dashboard](https://app.supabase.com)
2. [ ] Select your project
3. [ ] Go to **Authentication** → **URL Configuration**
4. [ ] Add to "Redirect URLs":
   ```
   https://your-project-name.vercel.app/auth/callback
   https://your-project-name.vercel.app/auth/callback-client
   ```
5. [ ] Click "Save"

### Enable Password Protection (Make it Private)
1. [ ] Go to Vercel project dashboard
2. [ ] Click **Settings** → **Deployment Protection**
3. [ ] Enable "Password Protection"
4. [ ] Set a strong password
5. [ ] Click "Save"

### Test Your Deployment
- [ ] Visit your Vercel URL
- [ ] Enter password (if you set one)
- [ ] Try signing in with Apple/Google
- [ ] Create a test post in Teams
- [ ] Verify files upload correctly
- [ ] Check real-time updates work (refresh button)

## Share with Your Team

**Send them:**
1. **URL**: `https://your-project-name.vercel.app`
2. **Password**: (the one you set above)
3. **Instructions**: "Sign in with Apple or Google"

## Automatic Updates

Every time you push to GitHub, Vercel automatically rebuilds and deploys:

```bash
# Make changes to your code
git add .
git commit -m "Added new features"
git push origin main

# Vercel automatically deploys! ✅
# Check deployment at: vercel.com/your-username/ceo-app-web
```

## Troubleshooting

### ❌ Build Failed
1. Check environment variables are set correctly in Vercel
2. Look at the build logs in Vercel dashboard
3. Make sure all dependencies are in `package.json`

### ❌ Can't Sign In
1. Verify Supabase redirect URLs include your Vercel domain
2. Check `NEXT_PUBLIC_SUPABASE_URL` is correct
3. Make sure `NEXT_PUBLIC_SUPABASE_ANON_KEY` is set

### ❌ Real-time Not Working
- Real-time requires HTTPS (Vercel provides this automatically ✅)
- If it still doesn't work, use the refresh button
- Check Supabase project status

### ❌ 404 on Pages
- Make sure you pushed all files to GitHub
- Check the deployment logs in Vercel
- Verify build completed successfully

## Custom Domain (Optional)

Want `app.yourcompany.com` instead of `.vercel.app`?

1. [ ] Go to Vercel project → **Settings** → **Domains**
2. [ ] Add your custom domain
3. [ ] Update DNS records (Vercel shows you how)
4. [ ] Wait for DNS propagation (5-60 minutes)
5. [ ] Update `NEXT_PUBLIC_APP_URL` in Vercel environment variables
6. [ ] Update Supabase OAuth redirect URLs

## Cost

**Vercel Free Tier includes:**
- ✅ Unlimited projects
- ✅ 100 GB bandwidth/month
- ✅ Automatic HTTPS
- ✅ Custom domains
- ✅ Password protection
- ✅ Perfect for small teams!

**Upgrade needed if:**
- More than 100 GB bandwidth/month
- Need advanced analytics
- Want team collaboration features

## Need Help?

- 📖 [Vercel Documentation](https://vercel.com/docs)
- 🎥 [Vercel YouTube Tutorials](https://www.youtube.com/@Vercel)
- 💬 [Vercel Discord](https://vercel.com/discord)
- 📧 Email Vercel support

---

**You're done! Your app is live and private. Share the URL and password with your team!** 🎉
