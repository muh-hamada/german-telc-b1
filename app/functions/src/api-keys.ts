// Environment variables are automatically loaded from .env file
// For local development: create .env file with OPENAI_API_KEY
// For production: set in Firebase Console or use Secret Manager
export const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';