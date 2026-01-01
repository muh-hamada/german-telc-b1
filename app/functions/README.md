# Firebase Cloud Functions - Writing Assessment

This directory contains Firebase Cloud Functions for the German TELC B1 Writing Assessment application.

## Overview

The cloud function provides server-side OpenAI integration for evaluating writing responses. This architecture offers several benefits:

- **Security**: API keys are stored server-side, not in the mobile app
- **Cost Control**: Centralized API usage monitoring
- **Reliability**: Better error handling and retry logic
- **Scalability**: Functions scale automatically with demand

## Functions

### `evaluateWriting`

An HTTP callable function that evaluates both text and image-based writing responses using OpenAI's GPT-4o model.

**Request Parameters:**
- `userAnswer` (string, optional): Text answer from the user
- `imageBase64` (string, optional): Base64-encoded image of handwritten text
- `incomingEmail` (string, required): The incoming email context
- `writingPoints` (string[], required): List of points to address
- `examTitle` (string, required): Title of the exam

**Response:**
Returns a `WritingAssessment` object with:
- Overall score and max score
- User input (extracted text for images)
- Detailed criteria feedback (task completion, communicative design, formal correctness)
- Corrected answer with markdown highlighting

## Setup

### Prerequisites

1. Node.js 20 or higher
2. Firebase CLI installed globally: `npm install -g firebase-tools`
3. Firebase project configured (Project ID: `telc-b1-german`)

### Installation

```bash
cd /Users/mham/projects/german-telc-b1/app/functions
npm install
```

### Configuration

**IMPORTANT: Set up your OpenAI API key before deploying**

Firebase now uses `.env` files for environment variables (the old `functions.config()` API is deprecated).

#### For Both Local Development and Production:

1. Create a `.env` file in the `functions` directory:
```bash
cd app/functions
cat > .env << 'EOF'
OPENAI_API_KEY=your-openai-api-key-here
EOF
```

2. The `.env` file is automatically loaded by Firebase Functions (v5.0.0+)

3. For production deployment, the `.env` file is uploaded with your functions

**Note**: The `.env` file is gitignored to prevent accidentally committing secrets. Use `.env.example` as a template.

#### Alternative: Firebase Secret Manager (More Secure for Production)

For production, you can use Google Cloud Secret Manager:

```bash
# Store secret in Secret Manager
firebase functions:secrets:set OPENAI_API_KEY

# Grant access to the function
# Then update your function to use it:
# import { defineSecret } from 'firebase-functions/params';
# const openaiApiKey = defineSecret('OPENAI_API_KEY');
```

See: https://firebase.google.com/docs/functions/config-env

## Development

### Local Testing

Run the Firebase emulator to test functions locally:

```bash
npm run serve
```

The function will be available at:
`http://localhost:5001/telc-b1-german/us-central1/evaluateWriting`

### Build

Compile TypeScript to JavaScript:

```bash
npm run build
```

## Deployment

### Deploy to Firebase

```bash
# Deploy all functions
npm run deploy

# Or using Firebase CLI directly
firebase deploy --only functions

# Deploy specific function
firebase deploy --only functions:evaluateWriting
```

After deployment, the function will be available at:
`https://us-central1-telc-b1-german.cloudfunctions.net/evaluateWriting`

### First Time Deployment

If this is your first time deploying:

1. Login to Firebase:
```bash
firebase login
```

2. Initialize Firebase (if not already done):
```bash
cd /Users/mham/projects/german-telc-b1/app
firebase init functions
# Select existing project: telc-b1-german
# Choose TypeScript
# Use existing functions directory
```

3. Deploy:
```bash
cd functions
npm run deploy
```

## Mobile App Integration

The mobile app calls this function via the `http.service.ts` service:

```typescript
import { evaluateWriting, evaluateWritingWithImage } from '../../services/http.service';

// Text evaluation
const result = await evaluateWriting({
  userAnswer: 'User text...',
  incomingEmail: 'Email context...',
  writingPoints: ['Point 1', 'Point 2'],
  examTitle: 'Writing Exercise 1'
});

// Image evaluation
const result = await evaluateWritingWithImage({
  imageBase64: 'base64-encoded-image...',
  incomingEmail: 'Email context...',
  writingPoints: ['Point 1', 'Point 2'],
  examTitle: 'Writing Exercise 1'
});
```

## Monitoring

### View Logs

```bash
# View recent logs
npm run logs

# Or with Firebase CLI
firebase functions:log
```

### Firebase Console

Monitor function execution, errors, and performance in the Firebase Console:
https://console.firebase.google.com/project/telc-b1-german/functions

## Cost Considerations

- **Firebase Functions**: Free tier includes 2M invocations/month
- **OpenAI API**: Charged per token usage
- **Cloud Function Runtime**: Charged for execution time and memory

Monitor usage in Firebase and OpenAI dashboards to stay within budget.

## Troubleshooting

### Function not found error
- Ensure the function is deployed: `firebase deploy --only functions`
- Check the Firebase Console to verify the function exists

### Authentication errors
- The function currently doesn't require authentication
- To enable auth, uncomment the authentication check in `src/index.ts`

### OpenAI API errors
- Verify the API key is valid
- Check OpenAI API quota and billing
- Review function logs for detailed error messages

### Timeout errors
- Default timeout is 60 seconds
- Increase if needed in `src/index.ts`:
```typescript
export const evaluateWriting = functions
  .runWith({ timeoutSeconds: 120 })
  .https.onCall(async (data, context) => { ... });
```

## Security Notes

- **API Key**: Now stored securely using `.env` file (gitignored). Never commit the `.env` file!
- **Production**: Consider using Firebase Secret Manager for enhanced security.
- **Authentication**: Consider enabling authentication to prevent unauthorized access.
- **Rate Limiting**: Implement rate limiting to prevent abuse.
- **CORS**: Firebase callable functions handle CORS automatically.

## Support

For issues or questions, refer to:
- [Firebase Functions Documentation](https://firebase.google.com/docs/functions)
- [OpenAI API Documentation](https://platform.openai.com/docs)

