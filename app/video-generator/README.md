# Video Generator - README

This directory contains the automated YouTube Shorts video generation system for TELC exam questions.

## Overview

The system automatically generates short vertical videos (YouTube Shorts format) from exam questions stored in Firebase. Each video includes:
- Intro screen with app branding
- Question display with countdown timer
- Answer reveal with correct answer highlighted
- Outro screen with call-to-action

## Structure

```
video-generator/
├── frontend/          # React app that renders video screens
│   ├── src/
│   │   ├── screens/   # Intro, Question, Answer, Outro screens
│   │   ├── config/    # App configurations
│   │   └── styles/    # CSS styling
│   └── package.json
├── functions/         # Firebase Cloud Functions
│   ├── src/
│   │   ├── services/  # Core services (Puppeteer, FFmpeg, YouTube)
│   │   └── index.ts   # Main function entry point
│   └── package.json
└── YOUTUBE_SETUP.md   # YouTube API setup instructions
```

## Setup

### 1. Frontend Setup

```bash
cd frontend
npm install
npm run dev  # Start development server
```

The frontend runs on http://localhost:3000 and renders the video screens for Puppeteer to capture.

### 2. Cloud Functions Setup

```bash
cd functions
npm install
npm run build
```

### 3. YouTube API Setup

See [YOUTUBE_SETUP.md](YOUTUBE_SETUP.md) for detailed instructions on setting up YouTube OAuth credentials.

### 4. Environment Variables

Set the following environment variables for Cloud Functions:

```bash
firebase functions:config:set \
  youtube.client_id="YOUR_CLIENT_ID" \
  youtube.client_secret="YOUR_CLIENT_SECRET" \
  youtube.refresh_token="YOUR_REFRESH_TOKEN" \
  frontend.url="http://localhost:3000"  # or your deployed URL
```

## Deployment

### Deploy Frontend

The frontend can be:
1. Deployed to Firebase Hosting
2. Run locally during Cloud Function execution
3. Deployed to any static hosting service

### Deploy Cloud Functions

```bash
cd functions
npm run deploy
```

This deploys:
- `generateYouTubeShort` - Scheduled function (runs daily)
- `generateVideoManual` - HTTP function for manual triggers
- `getProcessingStats` - HTTP function to check stats

## Usage

### Automatic (Scheduled)

The `generateYouTubeShort` function runs automatically once per day at 10 AM UTC. It:
1. Selects the next unprocessed question
2. Generates the video
3. Uploads to YouTube
4. Tracks the processed question

### Manual Trigger

Trigger video generation manually via HTTP:

```bash
# Generate video for next unprocessed question
curl "https://YOUR_REGION-YOUR_PROJECT.cloudfunctions.net/generateVideoManual?appId=german-a1"

# Generate video for specific question
curl "https://YOUR_REGION-YOUR_PROJECT.cloudfunctions.net/generateVideoManual?appId=german-a1&examId=1&questionId=6"
```

### Check Stats

```bash
curl "https://YOUR_REGION-YOUR_PROJECT.cloudfunctions.net/getProcessingStats?appId=german-a1"
```

## Configuration

### Supported Apps

- `german-a1` - German TELC A1
- `german-b1` - German TELC B1
- `german-b2` - German TELC B2
- `english-b1` - English TELC B1
- `english-b2` - English TELC B2

### Video Specifications

- Resolution: 1080x1920 (vertical)
- Frame Rate: 30 FPS
- Duration: ~19 seconds
  - Intro: 2s
  - Question: 10s
  - Answer: 4s
  - Outro: 3s
- Format: MP4 (H.264)

## Firestore Collections

### `video_generation_data/{appId}`

Tracks processed questions and statistics:

```typescript
{
  processed_questions: {
    "reading-part2-exam1-q6": {
      processed_at: Timestamp,
      video_id: "youtube_video_id",
      video_url: "https://youtube.com/shorts/...",
      duration_seconds: 19,
      processing_time_ms: 45000
    }
  },
  last_processed: Timestamp,
  total_videos: 1
}
```

## Troubleshooting

### Frontend not loading in Puppeteer

- Ensure `FRONTEND_URL` environment variable is set correctly
- Check that the frontend is accessible from the Cloud Function
- Review Cloud Function logs for connection errors

### FFmpeg errors

- Ensure all screenshot frames are captured successfully
- Check that temp directory has sufficient space
- Verify FFmpeg is available in the Cloud Function environment

### YouTube upload fails

- Verify OAuth credentials are set correctly
- Check YouTube API quota limits
- Ensure video meets YouTube Shorts requirements

## Cost Optimization

- Memory: 2GB (adjust based on performance needs)
- Timeout: 540 seconds (9 minutes)
- Temp files are automatically cleaned up after processing
- Processed questions are tracked to avoid duplicates

## Development

### Local Testing

1. Start the frontend:
```bash
cd frontend && npm run dev
```

2. Run Cloud Functions emulator:
```bash
cd functions && npm run serve
```

3. Test manually:
```bash
curl "http://localhost:5001/YOUR_PROJECT/us-central1/generateVideoManual?appId=german-a1"
```

## License

Part of the TELC Exam Preparation app system.

