# Quick Start Guide - Admin Dashboard

## 🚀 Get Started in 5 Minutes

### Prerequisites
- Firebase account (free tier is fine)
- Node.js 16+ installed
- Basic command line knowledge

### Step 1: Firebase Setup (3 minutes)

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project
3. Enable **Firestore Database** (production mode)
4. Enable **Authentication** → Email/Password
5. Add a web app and copy the config

### Step 2: Configure Dashboard (1 minute)

1. Create `.env` file in `app/admin-dashboard/`:
   ```bash
   cd app/admin-dashboard
   touch .env
   ```

2. Paste your Firebase config:
   ```env
   REACT_APP_FIREBASE_API_KEY=AIza...
   REACT_APP_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   REACT_APP_FIREBASE_PROJECT_ID=your-project-id
   REACT_APP_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   REACT_APP_FIREBASE_MESSAGING_SENDER_ID=123...
   REACT_APP_FIREBASE_APP_ID=1:123...
   ```

### Step 3: Create Admin User (30 seconds)

1. Firebase Console → Authentication → Add user
2. Enter email and password
3. Click "Add user"

### Step 4: Run Dashboard (30 seconds)

```bash
npm start
```

Browser opens at http://localhost:3000

### Step 5: Login & Migrate Data (30 seconds)

1. Login with your admin credentials
2. Click "Start Migration" button
3. Wait for completion
4. Done! All 13 documents are now in Firestore

## 🎉 You're Ready!

Now you can:
- ✅ View all exam data documents
- ✅ Edit JSON content with rich editor
- ✅ Validate data structure
- ✅ Save changes to Firebase
- ✅ Delete documents (with confirmation)

## 📦 Deploy to Production (Optional)

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# Initialize
firebase init
# Select: Firestore, Hosting
# Public directory: build
# Single-page app: Yes

# Deploy
npm run deploy
```

Your dashboard is now live!

## 🆘 Having Issues?

### "Login failed"
- Check `.env` credentials are correct
- Verify user exists in Firebase Console
- Ensure Authentication is enabled

### "Migration failed"
- Deploy Firestore rules: `firebase deploy --only firestore:rules`
- Check console for specific errors
- Verify JSON file paths

### "Cannot deploy"
- Run `firebase login` to re-authenticate
- Check `firebase use` shows correct project
- Ensure `build/` directory exists

## 📚 Full Documentation

- `README.md` - Full feature documentation
- `SETUP_GUIDE.md` - Detailed setup instructions
- `IMPLEMENTATION_SUMMARY.md` - Technical overview

## 💡 Pro Tips

1. **Test in development** before deploying
2. **Backup data** before major edits
3. **Use validation** before saving
4. **Check Firebase usage** to stay within free tier
5. **Set billing alerts** if using paid tier

## 🔗 Useful Links

- [Firebase Console](https://console.firebase.google.com/)
- [Firestore Documentation](https://firebase.google.com/docs/firestore)
- [React Native Firebase](https://rnfirebase.io/)

---

**Estimated Total Time**: ~5 minutes to get running locally

Need help? Check the detailed guides in the dashboard directory!

