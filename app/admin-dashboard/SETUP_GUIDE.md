# Admin Dashboard Setup Guide

This guide will walk you through setting up the admin dashboard and configuring Firebase.

## Step 1: Firebase Project Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select existing project
3. Enable Firestore Database:
   - Go to "Build" → "Firestore Database"
   - Click "Create database"
   - Choose "Start in production mode"
   - Select a location close to your users
4. Enable Authentication:
   - Go to "Build" → "Authentication"
   - Click "Get started"
   - Enable "Email/Password" sign-in method

## Step 2: Get Firebase Configuration

1. In Firebase Console, go to Project Settings (gear icon)
2. Scroll down to "Your apps" section
3. Click "Web" icon (</>) to add a web app
4. Register app with a nickname (e.g., "Admin Dashboard")
5. Copy the Firebase configuration object

## Step 3: Configure Admin Dashboard

1. Navigate to the admin dashboard directory:
```bash
cd app/admin-dashboard
```

2. Create a `.env` file with your Firebase credentials:
```bash
touch .env
```

3. Add the following to `.env`:
```env
REACT_APP_FIREBASE_API_KEY=your-api-key-here
REACT_APP_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your-project-id
REACT_APP_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=123456789
REACT_APP_FIREBASE_APP_ID=1:123456789:web:abcdef
```

## Step 4: Create Admin User

1. In Firebase Console, go to "Authentication"
2. Click "Add user"
3. Enter email and password for the admin account
4. Click "Add user"

## Step 5: Deploy Firestore Rules

1. Install Firebase CLI if you haven't:
```bash
npm install -g firebase-tools
```

2. Login to Firebase:
```bash
firebase login
```

3. Initialize Firebase in the admin dashboard directory:
```bash
firebase init
```
   - Select "Firestore" and "Hosting"
   - Choose your Firebase project
   - Accept default files (firestore.rules, firebase.json)
   - Select "build" as public directory
   - Configure as single-page app: Yes

4. Deploy Firestore rules:
```bash
npm run deploy:rules
```

## Step 6: Migrate Data

1. Start the development server:
```bash
npm start
```

2. Login with your admin credentials

3. Click "Start Migration" button to upload data from JSON files to Firestore

Alternative: Run migration script directly (if configured):
```bash
npm run migrate
```

## Step 7: Deploy to Firebase Hosting

1. Build the production version:
```bash
npm run build
```

2. Deploy to Firebase Hosting:
```bash
npm run deploy
```

3. Access your dashboard at the provided hosting URL

## Step 8: Configure React Native App (Optional)

To make the React Native app read from Firebase instead of local JSON:

1. Install Firebase packages:
```bash
cd ../GermanTelcB1App
npm install @react-native-firebase/app @react-native-firebase/firestore
```

2. Follow platform-specific setup:
   - iOS: `cd ios && pod install`
   - Android: Configure google-services.json

3. Update `src/services/data.service.ts` to fetch from Firestore

## Troubleshooting

### Cannot login
- Verify Firebase Authentication is enabled
- Check that you created a user in Firebase Console
- Verify `.env` file has correct credentials

### Migration fails
- Check console for specific errors
- Verify Firestore rules allow authenticated writes
- Ensure JSON file paths are correct

### Deployment fails
- Run `firebase login` to re-authenticate
- Verify you selected correct project with `firebase use`
- Check that `firebase.json` exists and is configured correctly

## Security Notes

- Never commit `.env` file to version control
- Use environment variables for production deployments
- Rotate admin passwords regularly
- Consider adding IP restrictions in Firebase Console
- Enable 2FA for Firebase account

## Maintenance

### Backup Data
```bash
firebase firestore:export gs://your-bucket/backup-folder
```

### Update Security Rules
1. Edit `firestore.rules`
2. Run: `npm run deploy:rules`

### Monitor Usage
- Check Firebase Console → Usage tab
- Set up billing alerts if needed
- Monitor Firestore read/write operations

## Support

For issues, check:
1. Firebase Console → Logs
2. Browser console for client errors
3. Network tab for API errors
4. Firestore rules validation


