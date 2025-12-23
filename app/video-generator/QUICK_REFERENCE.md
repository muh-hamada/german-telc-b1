# 🎬 Video Generator - Quick Reference

## 📍 Location
`/app/video-generator/`

## 🎯 Purpose
Automatically generate YouTube Shorts videos from TELC exam questions

## 📁 Structure

```
video-generator/
├── frontend/              # React app (renders screens)
├── functions/             # Cloud Functions (orchestration)
├── scripts/               # Helper scripts
└── *.md                   # Documentation
```

## ⚡ Quick Commands

### Setup
```bash
cd app/video-generator
chmod +x scripts/setup.sh
./scripts/setup.sh
```

### Development
```bash
# Start frontend
cd frontend && npm run dev

# Build functions
cd functions && npm run build

# Test functions locally
cd functions && npm run serve
```

### Deploy
```bash
cd functions
npm run build
npm run deploy
```

### Get YouTube Token
```bash
cd scripts
npm install
npm run get-token
# Or directly:
# node get-refresh-token.js
```

### Configure
```bash
firebase functions:config:set \
  youtube.client_id="YOUR_ID" \
  youtube.client_secret="YOUR_SECRET" \
  youtube.refresh_token="YOUR_TOKEN" \
  frontend.url="http://localhost:3000"
```

## 🔗 URLs

**Frontend (local):**
- Intro: http://localhost:3000/intro?appId=german-a1
- Question: http://localhost:3000/question?appId=german-a1&examId=1&questionId=6
- Answer: http://localhost:3000/answer?appId=german-a1&examId=1&questionId=6
- Outro: http://localhost:3000/outro?appId=german-a1

**Functions (after deploy):**
- Manual: `https://REGION-PROJECT.cloudfunctions.net/generateVideoManual?appId=german-a1`
- Stats: `https://REGION-PROJECT.cloudfunctions.net/getProcessingStats?appId=german-a1`

## 📊 Key Files

| File | Purpose |
|------|---------|
| `frontend/src/App.tsx` | Main routing |
| `frontend/src/screens/*.tsx` | Video screens |
| `functions/src/index.ts` | Main Cloud Function |
| `functions/src/services/screenshotCapture.ts` | Puppeteer |
| `functions/src/services/videoAssembly.ts` | FFmpeg |
| `functions/src/services/youtubeUpload.ts` | YouTube API |

## 🎨 Video Specs

- **Resolution**: 1080x1920 (vertical)
- **Frame Rate**: 30 FPS
- **Format**: MP4 (H.264)
- **Duration**: ~19 seconds
  - Intro: 2s
  - Question: 10s
  - Answer: 4s
  - Outro: 3s

## 🔧 Configuration

### Apps Supported
- `german-a1`
- `german-b1`
- `german-b2`
- `english-b1`
- `english-b2`

### Firestore Collections
- Questions: `{app}_telc_exam_data` → `reading-part2`
- Tracking: `video_generation_data` → `{appId}`

### Environment Variables
```javascript
{
  youtube: {
    client_id: "...",
    client_secret: "...",
    refresh_token: "..."
  },
  frontend: {
    url: "http://localhost:3000"
  }
}
```

## 📖 Documentation

| File | Description |
|------|-------------|
| `GETTING_STARTED.md` | Step-by-step setup |
| `YOUTUBE_SETUP.md` | YouTube API config |
| `VIDEO_GENERATOR_README.md` | Full documentation |
| `README.md` | Overview |
| `IMPLEMENTATION_SUMMARY.md` | What was built |

## 🐛 Troubleshooting

**No questions found?**
→ Check Firestore: `{app}_telc_exam_data/reading-part2`

**Frontend not loading?**
→ Verify `frontend.url` in functions config

**YouTube upload fails?**
→ Check OAuth credentials and API quota

**Function timeout?**
→ Increase timeout in `functions/src/index.ts`

**See logs:**
```bash
firebase functions:log
```

## 🚀 Next Steps

1. ✅ Install dependencies (`scripts/setup.sh`)
2. ⚠️ Configure YouTube API (`YOUTUBE_SETUP.md`)
3. ⚠️ Set environment variables
4. ⚠️ Deploy functions
5. ⚠️ Test manual trigger
6. ⚠️ Verify scheduled run

## 💡 Tips

- Test screens in browser first at http://localhost:3000
- Use manual trigger for testing before enabling scheduler
- Monitor `video_generation_data` collection in Firestore
- Check YouTube Studio for uploaded videos
- Start with low frequency, scale up later

## 📞 Help

**Issues?**
1. Check `GETTING_STARTED.md` troubleshooting
2. Review function logs
3. Test individual components
4. Verify all prerequisites

**Want to customize?**
- Screens: Edit `frontend/src/screens/*.tsx`
- Timing: Edit `functions/src/services/screenshotCapture.ts`
- Schedule: Edit `functions/src/index.ts`

---

**Status**: ✅ Fully Implemented
**Date**: December 22, 2025
**Target**: German A1 (expandable to all apps)

