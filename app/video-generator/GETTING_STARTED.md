# Getting Started with Video Generator

This guide will help you get the YouTube Shorts video generator up and running.

## Quick Start

### 1. Install Dependencies

```bash
# Install frontend dependencies
cd app/video-generator/frontend
npm install

# Install Cloud Functions dependencies
cd ../functions
npm install
```

### 2. Start the Frontend

```bash
cd app/video-generator/frontend
npm run dev
```

The frontend will be available at http://localhost:3000

### 3. Test the Screens

Open your browser and visit:
- http://localhost:3000/intro?appId=german-a1
- http://localhost:3000/question?appId=german-a1&examId=1&questionId=6
- http://localhost:3000/answer?appId=german-a1&examId=1&questionId=6
- http://localhost:3000/outro?appId=german-a1

### 4. Set Up YouTube API (Required for Production)

Follow the detailed instructions in [YOUTUBE_SETUP.md](YOUTUBE_SETUP.md) to:
1. Create a Google Cloud project
2. Enable YouTube Data API v3
3. Set up OAuth 2.0 credentials
4. Obtain a refresh token using the provided script:

```bash
cd app/video-generator/scripts
npm install
npm run get-token
```

### 5. Configure Firebase Functions

```bash
cd app/video-generator/functions

# Set YouTube credentials (from step 4)
firebase functions:config:set \
  youtube.client_id="YOUR_CLIENT_ID" \
  youtube.client_secret="YOUR_CLIENT_SECRET" \
  youtube.refresh_token="YOUR_REFRESH_TOKEN"

# Set frontend URL
firebase functions:config:set frontend.url="http://localhost:3000"
```

For local development, create `functions/.runtimeconfig.json`:

```json
{
  "youtube": {
    "client_id": "YOUR_CLIENT_ID",
    "client_secret": "YOUR_CLIENT_SECRET",
    "refresh_token": "YOUR_REFRESH_TOKEN"
  },
  "frontend": {
    "url": "http://localhost:3000"
  }
}
```

### 6. Deploy Cloud Functions

```bash
cd app/video-generator/functions
npm run build
npm run deploy
```

This deploys three functions:
- `generateYouTubeShort` - Scheduled (runs daily at 10 AM UTC)
- `generateVideoManual` - HTTP endpoint for manual triggers
- `getProcessingStats` - HTTP endpoint to check stats

## Testing the System

### Test with Local Emulator (Optional)

```bash
# Terminal 1: Start frontend
cd app/video-generator/frontend
npm run dev

# Terminal 2: Start Firebase emulator
cd app/video-generator/functions
npm run serve
```

### Test with Manual Trigger

After deploying, trigger a video generation:

```bash
# Get your function URL from the deploy output
curl "https://YOUR_REGION-YOUR_PROJECT.cloudfunctions.net/generateVideoManual?appId=german-a1"
```

Expected response:
```json
{
  "success": true,
  "videoUrl": "https://www.youtube.com/shorts/VIDEO_ID",
  "videoId": "VIDEO_ID",
  "processingTimeSeconds": "45.23",
  "question": {
    "appId": "german-a1",
    "examId": 1,
    "questionId": 6
  }
}
```

### Check Processing Stats

```bash
curl "https://YOUR_REGION-YOUR_PROJECT.cloudfunctions.net/getProcessingStats?appId=german-a1"
```

Response:
```json
{
  "appId": "german-a1",
  "stats": {
    "total_videos": 5,
    "last_processed": "2024-01-15T10:00:00.000Z",
    "processed_count": 5
  }
}
```

## Development Workflow

### Making Changes to Screens

1. Edit files in `frontend/src/screens/`
2. Changes appear immediately (hot reload)
3. Test in browser at http://localhost:3000
4. Once satisfied, the Cloud Function will use these screens

### Making Changes to Cloud Functions

1. Edit files in `functions/src/`
2. Build: `npm run build`
3. Test locally: `npm run serve`
4. Deploy: `npm run deploy`

### Adding New Apps

To support a new exam type (e.g., English B2):

1. Add to `frontend/src/config/apps.ts`:
```typescript
'english-b2': {
  id: 'english-b2',
  displayName: 'English TELC B2',
  language: 'English',
  level: 'B2',
}
```

2. Add to `functions/src/config/apps.ts`:
```typescript
'english-b2': {
  id: 'english-b2',
  displayName: 'English TELC B2',
  language: 'English',
  level: 'B2',
  collectionName: 'english_b2_telc_exam_data',
}
```

3. Update the scheduler in `functions/src/index.ts` to cycle through apps

## Troubleshooting

### Frontend Issues

**Problem**: Screens show "Question not found"
- Check that the appId, examId, and questionId are correct
- Verify the question exists in Firestore
- Check browser console for Firebase errors

**Problem**: Screens don't render correctly
- Clear browser cache
- Check CSS files are loaded
- Verify viewport is set to 1080x1920

### Cloud Function Issues

**Problem**: Function timeout
- Increase timeout in `functions/src/index.ts`
- Check Puppeteer is launching successfully
- Verify frontend is accessible from the function

**Problem**: Screenshot capture fails
- Ensure frontend URL is correct
- Check that screens are loading (look for `screenReady` signal)
- Review function logs: `firebase functions:log`

**Problem**: FFmpeg errors
- Verify all screenshot frames were captured
- Check temp directory has space
- Review FFmpeg command in logs

**Problem**: YouTube upload fails
- Verify OAuth credentials are set correctly
- Check API quota hasn't been exceeded
- Ensure video meets YouTube requirements

### Common Issues

**Error**: "Missing YouTube OAuth credentials"
- Set the environment variables with `firebase functions:config:set`
- For local dev, create `.runtimeconfig.json`

**Error**: "No unprocessed questions available"
- All questions have been processed
- Check `video_generation_data` collection in Firestore
- Manually reset or add new questions

**Error**: "Request failed with status code 403" (YouTube)
- OAuth token may have expired (shouldn't happen with refresh token)
- Check API quotas in Google Cloud Console
- Re-generate OAuth credentials

## Monitoring

### View Logs

```bash
# View all logs
firebase functions:log

# Tail logs in real-time
firebase functions:log --only generateYouTubeShort
```

### Check Firestore

1. Open Firebase Console
2. Go to Firestore Database
3. Check `video_generation_data/{appId}` collection
4. Review `processed_questions` to see what's been done

### Monitor YouTube

1. Go to YouTube Studio
2. Check your Shorts uploads
3. Monitor views, engagement
4. Review any upload errors

## Production Checklist

Before going to production:

- [ ] YouTube OAuth credentials configured
- [ ] Frontend deployed and accessible
- [ ] Cloud Functions deployed successfully
- [ ] Tested manual trigger endpoint
- [ ] Verified scheduled function is enabled
- [ ] Checked Firestore permissions
- [ ] Set up monitoring/alerts
- [ ] Tested with multiple question types
- [ ] Verified video quality and duration
- [ ] Confirmed videos appear as Shorts on YouTube

## Next Steps

1. **Customize the design**: Edit CSS files in `frontend/src/screens/`
2. **Add more question types**: Extend beyond Reading Part 2
3. **Multi-language support**: Add translations for different languages
4. **Analytics**: Track video performance and adjust strategy
5. **Scaling**: Adjust scheduler to run more frequently

## Resources

- [README.md](README.md) - Full system documentation
- [YOUTUBE_SETUP.md](YOUTUBE_SETUP.md) - Detailed YouTube API setup
- [Firebase Functions Docs](https://firebase.google.com/docs/functions)
- [Puppeteer Documentation](https://pptr.dev/)
- [FFmpeg Documentation](https://ffmpeg.org/documentation.html)
- [YouTube Data API](https://developers.google.com/youtube/v3)

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review function logs
3. Test individual components (frontend, screenshots, video assembly)
4. Verify all prerequisites are met

