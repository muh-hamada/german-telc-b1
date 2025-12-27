// Environment variables are automatically loaded from .env file
// For local development: create .env file with OPENAI_API_KEY
// For production: set in Firebase Console or use Secret Manager

// Use a getter function to ensure environment variables are loaded
export function getOpenAIKey(): string {
  return process.env.OPENAI_API_KEY || '';
}