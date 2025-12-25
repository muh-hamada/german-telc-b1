# Environment Variables Setup

This project uses `.env` files for configuration instead of the deprecated `.runtimeconfig.json` approach.

## Setup

1. Copy the example file:
   ```bash
   cp .env.example .env
   ```

2. Fill in your configuration in `.env`:
   - **YOUTUBE_CLIENT_ID**: Your Google OAuth Client ID
   - **YOUTUBE_CLIENT_SECRET**: Your Google OAuth Client Secret
   - **YOUTUBE_REFRESH_TOKEN**: Your YouTube OAuth Refresh Token
   - **YOUTUBE_CHANNEL_ID**: (Optional) Your YouTube Channel ID
   - **FRONTEND_URL**: URL where the frontend app is running (default: http://localhost:3000)
   - **APP_ID**: The ID of the app to generate videos for (e.g., `german-a1`)
   - **EXAM_COLLECTION**: (Optional) Override the Firestore collection for exam data
   - **EXAM_DOCUMENT**: The document name in the collection (default: `reading-part2`)
   - **TRACKING_COLLECTION**: The collection for storing processed question data (default: `video_generation_data`)
   - **VIDEO_INTRO_DURATION**: Duration of the intro segment in seconds (default: 2)
   - **VIDEO_QUESTION_DURATION**: Duration of the question segment in seconds (default: 10)
   - **VIDEO_ANSWER_DURATION**: Duration of the answer segment in seconds (default: 4)
   - **VIDEO_OUTRO_DURATION**: Duration of the outro segment in seconds (default: 3)

## Finding Your YouTube Channel ID

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a project or select an existing one
3. Enable the YouTube Data API v3
4. Create OAuth 2.0 credentials
5. Generate a refresh token (see YOUTUBE_SETUP.md for detailed steps)

## Finding Your YouTube Channel ID

If you manage multiple YouTube channels or want to upload to a specific channel:

1. Go to [YouTube Studio](https://studio.youtube.com/)
2. Select the channel you want to upload to
3. Click on **Settings** (gear icon) → **Channel** → **Advanced settings**
4. Your Channel ID will be displayed there
5. Copy the Channel ID and add it to your `.env` file:
   ```
   YOUTUBE_CHANNEL_ID=UCxxxxxxxxxxxxxxxxxx
   ```

**Note:** If you leave `YOUTUBE_CHANNEL_ID` empty, videos will be uploaded to the default channel associated with your OAuth credentials.

## Important Notes

- **Never commit `.env` file to version control** - it contains sensitive credentials
- The `.env` file is already in `.gitignore`
- For production deployment, set these as environment variables in your Firebase project
- The `.env.example` file is safe to commit and serves as a template

## Deployment

For production deployment to Firebase, use the Google Cloud Console to set environment variables or use `.env` files with Firebase Functions.

**Note:** The old `firebase functions:config:set` method is deprecated and should no longer be used. Instead, Firebase Functions automatically loads variables from the `.env` file in the functions directory during deployment.

To deploy with your local `.env` values:
```bash
firebase deploy --only functions
```
