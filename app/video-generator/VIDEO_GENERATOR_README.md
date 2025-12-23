# Video Generator for TELC Exam Questions

Automated system to generate YouTube Shorts videos from TELC exam questions.

## 🎯 Overview

This system automatically creates engaging vertical videos (1080x1920) from exam questions, perfect for YouTube Shorts. Each video includes:
- **Intro** (2s): App branding and level
- **Question** (10s): Situation with answer options and countdown timer
- **Answer** (4s): Correct answer highlighted
- **Outro** (3s): Call-to-action with app download info

**Total duration**: ~19 seconds

## 🏗️ Architecture

```
┌─────────────┐
│  Scheduler  │ Daily at 10 AM UTC
└──────┬──────┘
       │
       ▼
┌─────────────────┐
│ Cloud Function  │
└────────┬────────┘
         │
         ├─► Select unprocessed question
         ├─► Launch Puppeteer
         ├─► Capture screenshots (React app)
         ├─► Assemble video (FFmpeg)
         ├─► Upload to YouTube
         └─► Track in Firestore
```

## 📁 Structure

```
video-generator/
├── frontend/              # React app for rendering screens
│   ├── src/
│   │   ├── screens/      # Intro, Question, Answer, Outro
│   │   ├── config/       # App configurations
│   │   └── styles/       # CSS styling
│   └── package.json
│
├── functions/            # Firebase Cloud Functions
│   ├── src/
│   │   ├── services/    # Core services
│   │   │   ├── questionSelector.ts
│   │   │   ├── screenshotCapture.ts
│   │   │   ├── videoAssembly.ts
│   │   │   ├── youtubeUpload.ts
│   │   │   └── trackingService.ts
│   │   └── index.ts
│   └── package.json
│
├── scripts/              # Helper scripts
│   ├── get-refresh-token.js
│   └── setup.sh
│
├── GETTING_STARTED.md    # Quick start guide
├── YOUTUBE_SETUP.md      # YouTube API setup
└── README.md             # This file
```

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- Firebase CLI: `npm install -g firebase-tools`
- Google Cloud account (for YouTube API)
- YouTube channel

### Installation

```bash
# Run setup script
cd app/video-generator
chmod +x scripts/setup.sh
./scripts/setup.sh
```

Or manually:

```bash
# Install dependencies
cd frontend && npm install
cd ../functions && npm install
```

### Configuration

1. **Set up YouTube API** (see [YOUTUBE_SETUP.md](YOUTUBE_SETUP.md))
2. **Configure Firebase Functions**:

```bash
cd functions
firebase functions:config:set \
  youtube.client_id="YOUR_CLIENT_ID" \
  youtube.client_secret="YOUR_CLIENT_SECRET" \
  youtube.refresh_token="YOUR_REFRESH_TOKEN" \
  frontend.url="http://localhost:3000"
```

### Run Locally

```bash
# Terminal 1: Frontend
cd frontend
npm run dev

# Terminal 2: Functions (optional - for testing)
cd functions
npm run serve
```

### Deploy

```bash
cd functions
npm run build
npm run deploy
```

## 📖 Documentation

- **[GETTING_STARTED.md](GETTING_STARTED.md)** - Step-by-step setup guide
- **[YOUTUBE_SETUP.md](YOUTUBE_SETUP.md)** - YouTube API configuration
- **Frontend README** - React app documentation
- **Functions README** - Cloud Functions details

## 🎮 Usage

### Automatic (Scheduled)

The system runs automatically once per day at 10 AM UTC via Cloud Scheduler.

### Manual Trigger

```bash
# Generate next unprocessed question
curl "https://YOUR_REGION-YOUR_PROJECT.cloudfunctions.net/generateVideoManual?appId=german-a1"

# Generate specific question
curl "https://YOUR_REGION-YOUR_PROJECT.cloudfunctions.net/generateVideoManual?appId=german-a1&examId=1&questionId=6"
```

### Check Stats

```bash
curl "https://YOUR_REGION-YOUR_PROJECT.cloudfunctions.net/getProcessingStats?appId=german-a1"
```

## 🎨 Customization

### Screen Design

Edit files in `frontend/src/screens/`:
- `IntroScreen.tsx` / `IntroScreen.css`
- `QuestionScreen.tsx` / `QuestionScreen.css`
- `AnswerScreen.tsx` / `AnswerScreen.css`
- `OutroScreen.tsx` / `OutroScreen.css`

### Video Timing

Adjust in `functions/src/services/screenshotCapture.ts`:
```typescript
const duration = 2; // seconds for intro
const duration = 10; // seconds for question
const duration = 4; // seconds for answer
const duration = 3; // seconds for outro
```

### Supported Apps

Currently configured for:
- `german-a1` - German TELC A1
- `german-b1` - German TELC B1
- `german-b2` - German TELC B2
- `english-b1` - English TELC B1
- `english-b2` - English TELC B2

Add more in `frontend/src/config/apps.ts` and `functions/src/config/apps.ts`.

## 🔧 Technical Details

### Frontend
- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: CSS (no preprocessor)
- **Firebase**: Direct SDK access for Firestore

### Cloud Functions
- **Runtime**: Node.js 20
- **Memory**: 2GB
- **Timeout**: 540 seconds (9 minutes)
- **Trigger**: Pub/Sub (Cloud Scheduler)

### Video Processing
- **Screenshots**: Puppeteer (headless Chrome)
- **Assembly**: FFmpeg
- **Format**: MP4 (H.264, 1080x1920, 30 FPS)
- **Upload**: YouTube Data API v3

### Data Storage
- **Questions**: Firestore (`{app}_telc_exam_data`)
- **Tracking**: Firestore (`video_generation_data/{appId}`)
- **Temp Files**: `/tmp` (auto-cleaned)

## 📊 Monitoring

### View Logs

```bash
firebase functions:log
firebase functions:log --only generateYouTubeShort
```

### Firestore Collections

Check `video_generation_data/{appId}` for:
- Processed questions
- Video IDs and URLs
- Processing times
- Error logs

### YouTube Studio

Monitor your Shorts:
- Views and engagement
- Upload status
- Any errors or issues

## ⚠️ Troubleshooting

### Common Issues

**"Question not found"**
- Verify question exists in Firestore
- Check appId, examId, questionId parameters

**"Missing YouTube OAuth credentials"**
- Set environment variables with `firebase functions:config:set`
- For local dev, create `.runtimeconfig.json`

**Function timeout**
- Increase timeout in `index.ts`
- Check frontend is accessible
- Review Puppeteer logs

**YouTube quota exceeded**
- Default limit: 10,000 units/day (~6 videos)
- Request quota increase in Google Cloud Console

See [GETTING_STARTED.md](GETTING_STARTED.md#troubleshooting) for more.

## 💰 Cost Estimation

### Firebase
- Cloud Functions: ~$0.40 per 1M invocations
- Firestore: ~$0.18 per 100K reads
- Estimated: **< $5/month** for daily videos

### YouTube API
- Free tier: 10,000 units/day
- Video upload: ~1600 units
- **~6 free videos per day**

### Hosting
- Firebase Hosting (frontend): Free tier sufficient
- Estimated: **$0/month**

**Total**: **< $5/month**

## 🛡️ Security

- OAuth credentials stored in Firebase Functions config (encrypted)
- No credentials in source code
- `.runtimeconfig.json` in `.gitignore`
- Minimal OAuth scope (youtube.upload only)

## 📈 Scaling

To generate more videos:
1. Adjust scheduler frequency in `index.ts`
2. Request YouTube API quota increase
3. Add more question types (beyond Reading Part 2)
4. Support multiple apps/languages

## 🤝 Contributing

When adding features:
1. Test locally first
2. Update documentation
3. Test with manual trigger before deploying
4. Monitor logs after deployment

## 📝 License

Part of the TELC Exam Preparation app ecosystem.

## 🔗 Resources

- [Firebase Functions](https://firebase.google.com/docs/functions)
- [Puppeteer](https://pptr.dev/)
- [FFmpeg](https://ffmpeg.org/)
- [YouTube Data API](https://developers.google.com/youtube/v3)
- [YouTube Shorts](https://support.google.com/youtube/answer/10059070)

---

**Need help?** See [GETTING_STARTED.md](GETTING_STARTED.md) or check the troubleshooting section.

