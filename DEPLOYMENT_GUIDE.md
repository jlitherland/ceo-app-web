# CEO App Web - Private Deployment Guide

This guide will help you deploy your web app privately so others can access it.

## Best Option for Private Deployment: Vercel

**Vercel** is the recommended platform because:
- ✅ Created by the Next.js team (perfect compatibility)
- ✅ Free tier available
- ✅ Automatic HTTPS (fixes WebSocket/real-time issues)
- ✅ Easy password protection for privacy
- ✅ Automatic deployments from GitHub
- ✅ Zero configuration needed

---

## Option 1: Vercel (Recommended - 10 minutes)

### Step 1: Prepare Your Repository

1. Make sure your code is in a Git repository (GitHub, GitLab, or Bitbucket)
2. Ensure `.env.local` is in your `.gitignore` (it already is - never commit secrets!)

```bash
# If not already in Git
cd /Users/j/Projects/ceo-app-web
git init
git add .
git commit -m "Initial commit"

# Create a GitHub repo and push
# Go to github.com/new and create a new repo, then:
git remote add origin https://github.com/YOUR_USERNAME/ceo-app-web.git
git branch -M main
git push -u origin main
```

### Step 2: Deploy to Vercel

1. **Go to [vercel.com](https://vercel.com)** and sign up (use your GitHub account)

2. **Click "Add New Project"**

3. **Import your GitHub repository**
   - Select your `ceo-app-web` repository
   - Click "Import"

4. **Configure the project:**
   - Framework Preset: **Next.js** (auto-detected)
   - Root Directory: `./` (leave default)
   - Build Command: `npm run build` (auto-detected)
   - Output Directory: `.next` (auto-detected)

5. **Add Environment Variables** (click "Environment Variables"):

   Copy all variables from your `.env.local`:

   ```
   NEXT_PUBLIC_SUPABASE_URL=your-project-url.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   LUMINATE_API_KEY=your-luminate-api-key
   LUMINATE_USERNAME=your-username
   LUMINATE_PASSWORD=your-password
   RAILWAY_API_URL=https://ceo-app-working-production.up.railway.app
   RAILWAY_API_KEY=your-railway-api-key-if-needed
   PLAID_CLIENT_ID=your-plaid-client-id
   PLAID_SECRET=your-plaid-secret
   PLAID_ENV=sandbox
   NEXT_PUBLIC_APP_URL=https://your-app-name.vercel.app
   NODE_ENV=production
   ```

6. **Click "Deploy"**
   - Wait 2-3 minutes for the build
   - You'll get a URL like: `https://ceo-app-web-xyz.vercel.app`

### Step 3: Add Password Protection (Make it Private)

**Option A: Vercel Password Protection (Easiest)**

1. Go to your project settings on Vercel
2. Click "Deployment Protection"
3. Enable "Password Protection"
4. Set a password
5. Share the URL + password with your team

**Option B: Custom Domain (Professional)**

1. In Vercel project settings, click "Domains"
2. Add your custom domain (e.g., `app.ceoapp.com`)
3. Follow DNS instructions to point your domain to Vercel
4. Enable password protection as above

### Step 4: Test Your Deployment

1. Visit your Vercel URL
2. Enter the password if you set one
3. Try signing in with Apple/Google OAuth
4. Test posting to the team wall
5. Verify real-time updates work (they will with HTTPS!)

---

## Option 2: Netlify (Alternative)

Similar to Vercel but less optimized for Next.js:

1. Go to [netlify.com](https://netlify.com)
2. Click "Add new site" → "Import from Git"
3. Connect your GitHub repo
4. Build settings:
   - Build command: `npm run build`
   - Publish directory: `.next`
5. Add environment variables (same as Vercel)
6. Deploy
7. Enable password protection in Site Settings → Access Control

---

## Option 3: Self-Hosted (Advanced)

If you want full control, host on your own server:

### Requirements:
- A Linux server (DigitalOcean, AWS EC2, Linode, etc.)
- Node.js 20+ installed
- Nginx or Apache for reverse proxy
- SSL certificate (Let's Encrypt)

### Quick Setup (Ubuntu/Debian):

```bash
# 1. Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# 2. Clone your repo
git clone https://github.com/YOUR_USERNAME/ceo-app-web.git
cd ceo-app-web

# 3. Install dependencies
npm install

# 4. Create .env.local with your production values
nano .env.local
# (paste all your environment variables)

# 5. Build the app
npm run build

# 6. Start the production server
npm start
# Or use PM2 for auto-restart:
npm install -g pm2
pm2 start npm --name "ceo-app" -- start
pm2 save
pm2 startup
```

### Set up Nginx reverse proxy:

```nginx
# /etc/nginx/sites-available/ceo-app
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Enable site and get SSL
sudo ln -s /etc/nginx/sites-available/ceo-app /etc/nginx/sites-enabled/
sudo certbot --nginx -d your-domain.com
sudo systemctl restart nginx
```

---

## Option 4: Railway (Quick & Easy)

Railway is another great option:

1. Go to [railway.app](https://railway.app)
2. Click "New Project" → "Deploy from GitHub"
3. Select your repo
4. Add environment variables
5. Railway auto-detects Next.js and deploys
6. Get a URL like: `https://ceo-app-production.up.railway.app`

---

## Recommended: Vercel with Password Protection

**Why?**
- ✅ Fastest setup (10 minutes)
- ✅ Free for small teams
- ✅ Perfect Next.js support
- ✅ Automatic HTTPS (real-time works!)
- ✅ Password protection built-in
- ✅ Auto-deploys on git push
- ✅ Zero server maintenance

**Cost:** Free for up to:
- 100 GB bandwidth/month
- Unlimited deployments
- Commercial use allowed

---

## Security Checklist

Before sharing your site:

- [ ] All environment variables are set in production
- [ ] `.env.local` is NOT committed to Git
- [ ] Password protection is enabled (if using Vercel/Netlify)
- [ ] HTTPS is enabled (automatic on Vercel/Netlify)
- [ ] Supabase Row Level Security (RLS) is enabled
- [ ] Railway API requires authentication
- [ ] Test all features work in production

---

## Updating Your Site

With Vercel (automatic):
```bash
git add .
git commit -m "Update features"
git push origin main
# Vercel automatically rebuilds and deploys!
```

With self-hosted:
```bash
git pull origin main
npm install
npm run build
pm2 restart ceo-app
```

---

## Sharing Access

Once deployed, share with your team:

1. **URL**: `https://your-app-name.vercel.app`
2. **Password**: (if you set one)
3. **Login**: They can sign in with Apple/Google OAuth

Users will need to be added to your Supabase project for full access.

---

## Troubleshooting

### Build fails on Vercel
- Check your environment variables are set correctly
- Make sure Node.js version matches (20+)
- Check build logs for specific errors

### Real-time doesn't work
- Ensure HTTPS is enabled (automatic on Vercel)
- Check Supabase project settings allow your domain

### OAuth doesn't work
- Add your Vercel URL to Supabase OAuth redirect URLs
- Update `NEXT_PUBLIC_APP_URL` to your production URL

### Database errors
- Verify all Supabase environment variables are correct
- Check Supabase database is accessible from Vercel IPs

---

## Next Steps

1. **Deploy to Vercel** (follow Step 1-4 above)
2. **Enable password protection**
3. **Share the URL** with your team
4. **Update OAuth redirect URLs** in Supabase to include your production URL

Need help? Check the [Vercel Documentation](https://vercel.com/docs) or ask me!
