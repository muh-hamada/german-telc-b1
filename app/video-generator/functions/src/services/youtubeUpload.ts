import { google } from 'googleapis';
import * as fs from 'fs';
import { VideoMetadata } from '../types';

const youtube = google.youtube('v3');

/**
 * Upload video to YouTube
 * 
 * IMPORTANT: Videos will be uploaded to the channel associated with the OAuth2 credentials.
 * To upload to a specific channel:
 * 1. Create OAuth2 credentials for an account that owns or manages the target channel
 * 2. Make sure the account has "Manager" permissions on the channel (if not the owner)
 * 3. Use those credentials in YOUTUBE_CLIENT_ID, YOUTUBE_CLIENT_SECRET, and YOUTUBE_REFRESH_TOKEN
 * 
 * Note: You cannot specify channelId in the API request. The channel is determined by the OAuth token.
 */
export async function uploadToYouTube(
  videoPath: string,
  metadata: VideoMetadata
): Promise<{ videoId: string; videoUrl: string }> {
  console.log('Starting YouTube upload...');

  // Get OAuth2 client from environment variables
  const oauth2Client = getOAuth2Client();

  try {
    const videoStream = fs.createReadStream(videoPath);
    
    const requestBody: any = {
      snippet: {
        title: metadata.title,
        description: metadata.description,
        tags: metadata.tags,
        categoryId: metadata.categoryId,
        defaultLanguage: 'en',
        defaultAudioLanguage: 'en',
      },
      status: {
        privacyStatus: 'public',
        selfDeclaredMadeForKids: false,
      },
    };

    const response = await youtube.videos.insert({
      auth: oauth2Client,
      part: ['snippet', 'status'],
      requestBody,
      media: {
        body: videoStream,
      },
    });

    const videoId = response.data.id!;
    const videoUrl = `https://www.youtube.com/shorts/${videoId}`;

    console.log(`Video uploaded successfully: ${videoUrl}`);

    return {
      videoId,
      videoUrl,
    };
  } catch (error) {
    console.error('Error uploading to YouTube:', error);
    throw error;
  }
}

/**
 * Get OAuth2 client configured with credentials
 */
function getOAuth2Client() {
  const clientId = process.env.YOUTUBE_CLIENT_ID;
  const clientSecret = process.env.YOUTUBE_CLIENT_SECRET;
  const refreshToken = process.env.YOUTUBE_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error(
      'Missing YouTube OAuth credentials. Please set YOUTUBE_CLIENT_ID, YOUTUBE_CLIENT_SECRET, and YOUTUBE_REFRESH_TOKEN environment variables.'
    );
  }

  const oauth2Client = new google.auth.OAuth2(
    clientId,
    clientSecret,
    'http://localhost' // Redirect URI (not used for refresh token flow)
  );

  oauth2Client.setCredentials({
    refresh_token: refreshToken,
  });

  return oauth2Client;
}


/**
 * Generate video metadata from question data
 */
export function generateVideoMetadata(
  appId: string,
  appDisplayName: string,
  questionIndex: number,
  questionText: string | undefined
): VideoMetadata {
  // Truncate question text if too long
  const safeQuestionText = questionText || '';
  const truncatedQuestion = safeQuestionText.length > 60 
    ? safeQuestionText.substring(0, 57) + '...'
    : safeQuestionText;

  const title = `${appDisplayName} Exam - Reading Question`;
  
  const description = `
Practice your ${appDisplayName} exam skills with this quick question!
https://telc-exam-preperation.web.app/

Question: ${truncatedQuestion}

Download our app for hundreds more practice questions:
• Comprehensive exam preparation
• Real exam format questions
• Track your progress
• Study at your own pace

🎯 Perfect for TELC exam preparation!

#TELC #LanguageLearning #ExamPrep #${appDisplayName.replace(/\s+/g, '')}
`.trim();

  // Extract language and level from appId (e.g., "german-a1" -> ["german", "a1"])
  const [language, level] = appId.split('-');

  const tags = [
    'TELC',
    'exam',
    'preparation',
    'practice',
    'language learning',
    language,
    level.toUpperCase(),
    `${language} ${level}`,
    'study',
    'test prep',
    'education',
  ];

  return {
    title,
    description,
    tags,
    categoryId: '27', // Education category
  };
}

/**
 * Generate video metadata for vocabulary videos
 */
export function generateVocabularyVideoMetadata(
  appId: string,
  appDisplayName: string,
  word: string,
  article: string,
  translation: string,
  exampleSentence: string
): VideoMetadata {
  // Extract language and level from appId (e.g., "german-a1" -> ["german", "a1"])
  const [language, level] = appId.split('-');
  const languageCapitalized = language.charAt(0).toUpperCase() + language.slice(1);
  const levelUppercase = level.toUpperCase();

  // Format word with article for title
  const wordWithArticle = article ? `${article} ${word}` : word;
  
  const title = `Learn ${languageCapitalized}: ${wordWithArticle} - ${translation} 🇩🇪 | TELC ${levelUppercase} Vocabulary`;
  
  const description = `
📚 Word of the Day: ${wordWithArticle}
📝 Translation: ${translation}
🗣️ Example: ${exampleSentence}

Master ${languageCapitalized} vocabulary for your TELC ${levelUppercase} exam!

Download our app for comprehensive vocabulary practice:
https://telc-exam-preperation.web.app/

✨ App Features:
• 1000+ vocabulary words with audio pronunciation
• Example sentences with translations
• Progress tracking
• Spaced repetition learning
• Exam-focused content

Perfect for TELC exam preparation and ${languageCapitalized} language learners!

#${languageCapitalized}Learning #TELC${levelUppercase} #Vocabulary #LanguageLearning #${languageCapitalized}Language #LearnGerman #StudyGerman #GermanVocabulary #TELCExam #LanguageStudy
`.trim();

  const tags = [
    'TELC',
    `TELC ${levelUppercase}`,
    `${languageCapitalized} learning`,
    'vocabulary',
    `${languageCapitalized} vocabulary`,
    'language learning',
    `learn ${language}`,
    language,
    levelUppercase,
    `${language} ${level}`,
    'word of the day',
    'pronunciation',
    'education',
    'language study',
    `${languageCapitalized} words`,
  ];

  return {
    title,
    description,
    tags,
    categoryId: '27', // Education category
  };
}

