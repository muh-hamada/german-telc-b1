# YouTube API Setup Guide

This guide walks you through setting up YouTube Data API v3 credentials for automated video uploads.

## Prerequisites

- Google Cloud Console account
- YouTube channel where videos will be uploaded
- Admin access to the YouTube channel

## Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" → "New Project"
3. Enter project name: `telc-video-generator` (or your preferred name)
4. Click "Create"

## Step 2: Enable YouTube Data API v3

1. In your project, go to "APIs & Services" → "Library"
2. Search for "YouTube Data API v3"
3. Click on it and click "Enable"

## Step 3: Create OAuth 2.0 Credentials

### Configure OAuth Consent Screen

1. Go to "APIs & Services" → "OAuth consent screen"
2. Select "External" user type (unless you have Google Workspace)
3. Click "Create"
4. Fill in the required fields:
   - **App name**: TELC Video Generator
   - **User support email**: Your email
   - **Developer contact information**: Your email
5. Click "Save and Continue"
6. On the "Scopes" page, click "Add or Remove Scopes"
7. Add the following scope:
   - `https://www.googleapis.com/auth/youtube.upload`
8. Click "Save and Continue"
9. On "Test users", add your Google account email
10. Click "Save and Continue"

### Create OAuth Client ID

1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth client ID"
3. Select "Web application"
4. Configure:
   - **Name**: Video Generator OAuth Client
   - **Authorized redirect URIs**: `http://localhost:3000/oauth2callback`
5. Click "Create"
6. **Save the Client ID and Client Secret** (you'll need these later)

## Step 4: Obtain Refresh Token

You need to run a one-time OAuth flow to get a refresh token.

### Option A: Using Provided Script

We've included a helper script in the `scripts/` directory:

```bash
cd app/video-generator/scripts
npm install
npm run get-token
```

The script will:
1. Prompt you for your Client ID and Client Secret
2. Open your browser for authorization
3. Display your refresh token

You can also run it directly:

```bash
cd app/video-generator/scripts
npm install
node get-refresh-token.js
```

**Note**: If the browser doesn't open automatically, the script will display the authorization URL - just copy and paste it into your browser manually.

### Option B: Using OAuth Playground

1. Go to [OAuth 2.0 Playground](https://developers.google.com/oauthplayground/)
2. Click the gear icon (⚙️) in the top right
3. Check "Use your own OAuth credentials"
4. Enter your Client ID and Client Secret
5. In "Step 1", find and select:
   - `https://www.googleapis.com/auth/youtube.upload`
6. Click "Authorize APIs"
7. Sign in with the Google account that owns the YouTube channel
8. Grant permissions
9. Click "Exchange authorization code for tokens"
10. **Copy the Refresh Token** from the response

## Step 5: Configure Firebase Functions

Set the credentials as environment variables:

```bash
cd app/video-generator/functions

# Set YouTube credentials
firebase functions:config:set \
  youtube.client_id="YOUR_CLIENT_ID_HERE" \
  youtube.client_secret="YOUR_CLIENT_SECRET_HERE" \
  youtube.refresh_token="YOUR_REFRESH_TOKEN_HERE"

# Set frontend URL (adjust based on your deployment)
firebase functions:config:set frontend.url="http://localhost:3000"

# Verify configuration
firebase functions:config:get
```

### For Local Development

Create a `.runtimeconfig.json` file in the `functions/` directory:

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

**⚠️ Important**: Add `.runtimeconfig.json` to `.gitignore` to avoid committing secrets!

## Step 6: Test the Setup

### Using the Manual Trigger Function

```bash
# Deploy the function
cd functions
npm run deploy

# Trigger a test video generation
curl "https://YOUR_REGION-YOUR_PROJECT.cloudfunctions.net/generateVideoManual?appId=german-a1"
```

### Expected Response

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

## Troubleshooting

### Error: "invalid_client"

- Double-check your Client ID and Client Secret
- Ensure there are no extra spaces or quotes
- Verify the credentials are from the correct Google Cloud project

### Error: "invalid_grant"

- The refresh token may have expired (shouldn't happen if configured correctly)
- Re-run the OAuth flow with `prompt: 'consent'` to get a new refresh token

### Error: "insufficient permissions"

- Ensure you added the `youtube.upload` scope during OAuth consent setup
- Make sure you're using the correct Google account (one that owns the YouTube channel)

### Error: "The request cannot be completed because you have exceeded your quota"

- YouTube Data API has daily quota limits
- Check your quota usage in Google Cloud Console
- Request a quota increase if needed (default is 10,000 units/day)
- Each video upload costs approximately 1600 units

## API Quotas

YouTube Data API v3 has the following default quotas:

- **Daily quota**: 10,000 units
- **Video upload**: ~1600 units per video
- **Maximum videos per day**: ~6 videos

To increase quota:
1. Go to Google Cloud Console
2. Navigate to "APIs & Services" → "Quotas"
3. Find "YouTube Data API v3"
4. Request a quota increase (explain your use case)

## Security Best Practices

1. **Never commit credentials to git**
   - Add `.runtimeconfig.json` to `.gitignore`
   - Use Firebase Functions config for production

2. **Rotate credentials periodically**
   - Generate new OAuth credentials every few months
   - Revoke old tokens in Google Cloud Console

3. **Limit OAuth scope**
   - Only request `youtube.upload` scope
   - Don't request unnecessary permissions

4. **Monitor API usage**
   - Set up billing alerts in Google Cloud
   - Monitor quota usage regularly

## Additional Resources

- [YouTube Data API Documentation](https://developers.google.com/youtube/v3)
- [OAuth 2.0 for Server-Side Web Apps](https://developers.google.com/identity/protocols/oauth2/web-server)
- [YouTube API Quota Calculator](https://developers.google.com/youtube/v3/determine_quota_cost)
- [Firebase Functions Configuration](https://firebase.google.com/docs/functions/config-env)

## Support

If you encounter issues:

1. Check Cloud Functions logs:
   ```bash
   firebase functions:log
   ```

2. Enable debug logging:
   ```bash
   firebase functions:config:set debug.enabled="true"
   ```

3. Test OAuth credentials with OAuth Playground

4. Review YouTube API quotas in Google Cloud Console

