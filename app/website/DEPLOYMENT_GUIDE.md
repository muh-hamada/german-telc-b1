# Multi-Site Deployment Guide

This guide explains how to build and deploy the TELC and DELE exam preparation websites.

## Overview

The website codebase now supports building two separate versions:
- **TELC version**: Deploys to `telc-exam-preperation.web.app`
- **DELE version**: Deploys to `dele-exam-preperation.web.app`

Both sites share the same codebase, with text dynamically changed based on the exam type.

## Local Development

### First time setup:
```bash
cd app/website
npm install  # Install dependencies including env-cmd
```

### Test TELC version locally:
```bash
cd app/website
npm run start  # Will use .env.telc by default
# or explicitly:
env-cmd -f .env.telc npm start
```

### Test DELE version locally:
```bash
cd app/website
env-cmd -f .env.dele npm start
```

The site will open at `http://localhost:3000`

## Building

### Build both versions:
```bash
cd app/website
npm run build:all
```

This will:
1. Build the TELC version → outputs to `build/`
2. Build the DELE version → outputs to `build-dele/`

### Build individually:
```bash
# TELC only
npm run build:telc

# DELE only
npm run build:dele
```

## Deployment

### Deploy to both sites:
```bash
cd app/website
npm run deploy
```

This single command will:
1. Build both TELC and DELE versions
2. Deploy TELC build to `telc-exam-preperation.web.app`
3. Deploy DELE build to `dele-exam-preperation.web.app`

### Deploy to specific site:
```bash
# TELC only
firebase deploy --only hosting:telc

# DELE only
firebase deploy --only hosting:dele
```

## What Changed

### What Changed

**Environment Variables:**
- `.env.telc` - Sets `REACT_APP_EXAM_TYPE=telc` and `REACT_APP_EXAM_TYPE_UPPER=TELC`
- `.env.dele` - Sets `REACT_APP_EXAM_TYPE=dele` and `REACT_APP_EXAM_TYPE_UPPER=DELE`

**HTML Meta Tags:**
- `public/index.html` now uses `%REACT_APP_EXAM_TYPE_UPPER%` for dynamic titles and descriptions

### New Files:
- `src/contexts/ExamTypeContext.tsx` - Provides exam type throughout the app
- `src/config/available-apps.config.ts` - JSON configuration for available apps per exam type
- `.env.telc` - Environment variables for TELC builds
- `.env.dele` - Environment variables for DELE builds

### Modified Files:
- `firebase.json` - Multi-site hosting configuration
- `.firebaserc` - Hosting targets for both sites
- `package.json` - New build and deploy scripts (now uses env-cmd)
- `public/index.html` - Dynamic meta tags using environment variables
- `src/App.tsx` - Added ExamTypeProvider
- `src/config/apps.config.ts` - Added examType field
- `src/components/AppSelectorModal.tsx` - Dynamic language/level selection
- All page components (Home, Privacy, Terms, Support, DataDeletion)
- Header and Footer components

### How It Works:
1. Environment files (`.env.telc` or `.env.dele`) define exam type variables
2. `env-cmd` loads the appropriate `.env` file during build
3. Environment variables are injected into `index.html` for meta tags
4. ExamTypeContext reads `REACT_APP_EXAM_TYPE` and provides it to all components
5. Components use `getExamTypeName()` to display "TELC" or "DELE"
6. AppSelectorModal reads from `available-apps.config.ts` to show relevant languages
7. Firebase multi-site hosting deploys each build to its respective site

## Verification

After deployment, verify both sites:

### TELC site:
- Visit: `https://telc-exam-preperation.web.app`
- Check: Header shows "TELC Exam Preparation"
- Check: Page title shows "TELC Exam Preparation"
- Check: All pages reference "TELC"
- Check: App selector shows German (A1, B1, B2) and English (B1, B2)

### DELE site:
- Visit: `https://dele-exam-preperation.web.app`
- Check: Header shows "DELE Exam Preparation"
- Check: Page title shows "DELE Exam Preparation"
- Check: All pages reference "DELE"
- Check: App selector shows Spanish (B1)

## Troubleshooting

### env-cmd not found:
Make sure you installed dependencies:
```bash
cd app/website
npm install
```

### Build fails with environment variable error:
Make sure you're using the npm scripts which set the environment variable:
```bash
npm run build:telc  # Not just "npm run build"
```

### Deploy fails:
1. Make sure you're logged into Firebase: `firebase login`
2. Verify your Firebase project is correct: `firebase use telc-b1-german`
3. Check that both sites exist in Firebase Console

### Wrong exam type showing:
The exam type is set at build time, not runtime. Make sure you:
1. Built with the correct environment variable
2. Deployed the correct build directory to the correct site

## Future: Adding DELE Apps

When DELE apps are ready:
1. Add them to `src/config/apps.config.ts` with `examType: 'dele'`
2. The DELE website will automatically show them
3. The TELC website will continue showing only TELC apps

## Adding New Languages or Levels

To add a new language or level to either exam type, simply edit `src/config/available-apps.config.ts`:

### Example: Adding Spanish B2 to DELE

```typescript
{
  examType: 'dele',
  languages: [
    {
      id: 'spanish',
      flag: '🇪🇸',
      label: 'Spanish',
      availableLevels: [
        { level: 'B1', label: 'Intermediate', isAvailable: true },
        { level: 'B2', label: 'Upper Intermediate', isAvailable: true }, // NEW!
      ],
    },
  ],
}
```

### Example: Adding French to TELC

```typescript
{
  id: 'french',
  flag: '🇫🇷',
  label: 'French',
  availableLevels: [
    { level: 'B1', label: 'Intermediate', isAvailable: true },
    { level: 'B2', label: 'Upper Intermediate', isAvailable: false }, // Coming soon
  ],
}
```

The UI will automatically update to show the new options. No need to modify any component code!
