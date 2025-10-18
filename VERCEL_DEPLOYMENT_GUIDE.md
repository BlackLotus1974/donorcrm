# Vercel Deployment Guide - Donor CRM

## 🚀 Deploy to Vercel in 5 Minutes

### Prerequisites
- ✅ GitHub repository: https://github.com/BlackLotus1974/donor-crm
- ✅ Vercel account (sign up at https://vercel.com)
- ✅ Supabase project running

---

## 📋 Environment Variables for Vercel

Copy and paste these **exact values** into Vercel:

### **Required Environment Variables:**

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://flqgkpytrqpkqmedmtuf.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZscWdrcHl0cnFwa3FtZWRtdHVmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2OTU0NDgsImV4cCI6MjA3NjI3MTQ0OH0.tK3fERyqheOxtFSICkHuU0aVLzg9AwXgnECAPElgBXg
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZscWdrcHl0cnFwa3FtZWRtdHVmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDY5NTQ0OCwiZXhwIjoyMDc2MjcxNDQ4fQ.jatPHfLaKxVvZnnNI5QycHnCx0gX6gFIdiBVybgPbFU

# Node Environment
NODE_ENV=production
```

---

## 🎯 Step-by-Step Deployment

### **Step 1: Import Your GitHub Repository**

1. Go to https://vercel.com/new
2. Click **"Import Git Repository"**
3. Select your repository: `BlackLotus1974/donor-crm`
4. Click **"Import"**

### **Step 2: Configure Project Settings**

On the import page, configure:

**Framework Preset:** Next.js (should auto-detect)

**Root Directory:** `./` (leave as default)

**Build Command:**
```bash
npm run build
```

**Output Directory:**
```bash
.next
```

**Install Command:**
```bash
npm install
```

### **Step 3: Add Environment Variables**

Click **"Environment Variables"** section and add:

1. **Variable Name:** `NEXT_PUBLIC_SUPABASE_URL`
   **Value:** `https://flqgkpytrqpkqmedmtuf.supabase.co`

2. **Variable Name:** `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   **Value:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZscWdrcHl0cnFwa3FtZWRtdHVmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2OTU0NDgsImV4cCI6MjA3NjI3MTQ0OH0.tK3fERyqheOxtFSICkHuU0aVLzg9AwXgnECAPElgBXg`

3. **Variable Name:** `SUPABASE_SERVICE_ROLE_KEY`
   **Value:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZscWdrcHl0cnFwa3FtZWRtdHVmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDY5NTQ0OCwiZXhwIjoyMDc2MjcxNDQ4fQ.jatPHfLaKxVvZnnNI5QycHnCx0gX6gFIdiBVybgPbFU`

4. **Variable Name:** `NODE_ENV`
   **Value:** `production`

**Important:** Make sure to apply these to **"Production", "Preview", and "Development"** environments!

### **Step 4: Deploy**

1. Click **"Deploy"**
2. Wait 2-3 minutes for the build to complete
3. You'll get a URL like: `https://donor-crm-xxx.vercel.app`

---

## 🔧 Post-Deployment Configuration

### **Update Supabase URL Configuration**

After deployment, you need to add your Vercel URL to Supabase's allowed URLs:

1. Go to your Supabase dashboard: https://supabase.com/dashboard/project/flqgkpytrqpkqmedmtuf
2. Click **"Authentication"** → **"URL Configuration"**
3. Add your Vercel URL to **"Site URL"**: `https://your-app.vercel.app`
4. Add to **"Redirect URLs"**:
   - `https://your-app.vercel.app/auth/callback`
   - `https://your-app.vercel.app/auth/confirm`
   - `https://your-app.vercel.app/*`

### **Test Your Deployment**

1. Visit your Vercel URL
2. Try to sign up for a new account
3. Test the onboarding flow
4. Verify dashboard access

---

## 🎨 Custom Domain (Optional)

To use your own domain:

1. Go to your Vercel project dashboard
2. Click **"Settings"** → **"Domains"**
3. Add your domain (e.g., `donor-crm.yourdomain.com`)
4. Update DNS records as instructed by Vercel
5. Update Supabase URL configuration with new domain

---

## 🔍 Troubleshooting

### **Build Fails**

If the build fails, check:
- All environment variables are correctly set
- No TypeScript errors (run `npm run build` locally first)
- Dependencies are correctly listed in `package.json`

### **Authentication Not Working**

If sign-up/login fails:
- Verify Vercel URL is added to Supabase redirect URLs
- Check browser console for CORS errors
- Verify environment variables are set correctly

### **Database Connection Issues**

If you see database errors:
- Confirm Supabase project is active
- Check `NEXT_PUBLIC_SUPABASE_URL` is correct
- Verify RLS policies allow access

---

## 📊 Monitoring & Analytics

### **Vercel Analytics** (Recommended)

Enable Vercel Analytics for free:
1. Go to project dashboard
2. Click **"Analytics"**
3. Enable Web Analytics
4. Enable Speed Insights

### **Vercel Logs**

View real-time logs:
1. Project dashboard → **"Deployments"**
2. Click on a deployment
3. Click **"Functions"** tab to see API logs

---

## 🚦 CI/CD - Automatic Deployments

Vercel automatically deploys:
- **Production:** Every push to `master` branch
- **Preview:** Every push to feature branches
- **Pull Requests:** Every PR gets a preview URL

To customize:
1. Project Settings → **"Git"**
2. Configure production branch
3. Set up ignored build paths if needed

---

## 💰 Pricing

**Hobby Plan (Free):**
- Perfect for this project
- 100GB bandwidth/month
- Unlimited deployments
- Free SSL certificate
- Custom domains

**Pro Plan ($20/month):**
- Needed if you exceed free limits
- Better performance
- More analytics
- Team collaboration

---

## 🔐 Security Best Practices

### **After Deployment:**

1. ✅ Enable Vercel's **Security Headers**
   - Project Settings → Headers
   - Add CSP, HSTS, etc.

2. ✅ Set up **Environment Variable Protection**
   - Vercel automatically hides sensitive env vars
   - Never expose `SUPABASE_SERVICE_ROLE_KEY` to client

3. ✅ Enable **DDoS Protection** (included free)

4. ✅ Monitor **Usage & Logs** regularly

---

## 🎉 Success Checklist

After deployment, verify:
- [ ] Application loads at Vercel URL
- [ ] Can create new account
- [ ] Can complete onboarding
- [ ] Dashboard displays correctly
- [ ] Can create/view donors
- [ ] Supabase connection working
- [ ] No console errors
- [ ] Mobile responsive

---

## 📞 Need Help?

- **Vercel Docs:** https://vercel.com/docs
- **Supabase Docs:** https://supabase.com/docs
- **GitHub Repo:** https://github.com/BlackLotus1974/donor-crm

---

## 🚀 What's Next?

After successful deployment:
1. Set up custom domain
2. Configure email service (Resend/SendGrid)
3. Add payment processing (Stripe)
4. Set up monitoring and alerts
5. Plan user testing with real nonprofits

**Your Donor CRM is now LIVE!** 🎊
