# 🚀 Deployment Guide - German TELC B1 Website

This guide will walk you through deploying your website to Firebase Hosting.

## Prerequisites

- Node.js installed (v14 or higher)
- Firebase account
- Firebase project created (telc-b1-german)

## Step-by-Step Deployment

### 1. Install Firebase CLI

If you haven't installed Firebase CLI yet:

```bash
npm install -g firebase-tools
```

### 2. Login to Firebase

```bash
firebase login
```

This will open your browser for authentication.

### 3. Initialize Firebase (Already Done)

The project is already initialized with:
- `firebase.json` - Hosting configuration
- `.firebaserc` - Project configuration

### 4. Build the Production Version

From the `website` directory:

```bash
npm run build
```

This creates an optimized production build in the `build` folder.

### 5. Test Locally (Optional)

Preview your site locally before deploying:

```bash
firebase serve
```

Visit `http://localhost:5000` to see your site.

### 6. Deploy to Firebase Hosting

```bash
firebase deploy
```

Or deploy only hosting:

```bash
firebase deploy --only hosting
```

### 7. Access Your Live Website

After successful deployment, your website will be available at:
- **Primary URL**: https://telc-b1-german.web.app
- **Custom Domain** (if configured): https://telc-b1-german.firebaseapp.com

## 🔄 Updating the Website

Whenever you make changes:

1. Make your changes to the code
2. Test locally: `npm start`
3. Build: `npm run build`
4. Deploy: `firebase deploy`

## 🌐 Custom Domain Setup

To add a custom domain (e.g., www.german-telc-b1.com):

1. Go to Firebase Console → Hosting
2. Click "Add custom domain"
3. Follow the DNS configuration steps
4. Wait for SSL certificate provisioning (24-48 hours)

## 📊 Monitoring

View your website analytics and performance:

1. Go to Firebase Console
2. Navigate to Hosting dashboard
3. View:
   - Traffic statistics
   - Bandwidth usage
   - Deploy history
   - Performance metrics

## 🔧 Troubleshooting

### Build Fails

```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Deploy Fails

```bash
# Check Firebase login
firebase login --reauth

# Verify project
firebase projects:list

# Use specific project
firebase use telc-b1-german
```

### 404 Errors on Page Refresh

This is already handled by the rewrite rule in `firebase.json`:
```json
"rewrites": [
  {
    "source": "**",
    "destination": "/index.html"
  }
]
```

## 🚀 CI/CD with GitHub Actions (Optional)

For automatic deployment on git push:

1. Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Firebase Hosting

on:
  push:
    branches:
      - main

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '16'
      - run: cd app/website && npm ci && npm run build
      - uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: '${{ secrets.GITHUB_TOKEN }}'
          firebaseServiceAccount: '${{ secrets.FIREBASE_SERVICE_ACCOUNT }}'
          channelId: live
          projectId: telc-b1-german
          entryPoint: ./app/website
```

2. Add Firebase service account to GitHub secrets

## 📈 Performance Optimization

Already implemented:
- ✅ Code splitting with React Router
- ✅ Asset caching (1 year)
- ✅ Optimized images
- ✅ Minified CSS/JS
- ✅ Gzip compression

## 🔒 Security Headers (Optional)

Add to `firebase.json` for enhanced security:

```json
"headers": [
  {
    "source": "**",
    "headers": [
      {
        "key": "X-Content-Type-Options",
        "value": "nosniff"
      },
      {
        "key": "X-Frame-Options",
        "value": "DENY"
      },
      {
        "key": "X-XSS-Protection",
        "value": "1; mode=block"
      }
    ]
  }
]
```

## 📱 Update App Store Links

Before deploying, update the download links in `src/pages/Home.tsx`:

```tsx
// Replace #android and #ios with actual URLs
<a href="https://play.google.com/store/apps/details?id=com.mhamada.telcb1german">
<a href="https://apps.apple.com/app/id[YOUR_APP_ID]">
```

## ✅ Pre-Deployment Checklist

- [ ] Test all pages locally
- [ ] Update contact email if needed
- [ ] Add app store links
- [ ] Add app screenshots
- [ ] Test on mobile devices
- [ ] Check all links work
- [ ] Verify meta tags for SEO
- [ ] Run `npm run build` successfully
- [ ] Test with `firebase serve`
- [ ] Deploy with `firebase deploy`

## 🎉 Success!

Your website is now live! Share the URL:
- https://telc-b1-german.web.app

For support: muhammad.aref.ali.hamada@gmail.com

