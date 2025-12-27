/**
 * Cloud Function: Generate AI-Powered Prep Plan Recommendations
 * 
 * This function receives assessment results and generates personalized study recommendations
 * using OpenAI GPT-4o-mini.
 */

import * as functions from 'firebase-functions';
import OpenAI from 'openai';
import * as admin from 'firebase-admin';

// Lazy-initialize OpenAI client to ensure environment variables are loaded
let openaiClient: OpenAI | null = null;
function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    openaiClient = new OpenAI({
      apiKey: functions.config().openai?.key || process.env.OPENAI_API_KEY,
    });
  }
  return openaiClient;
}

interface DiagnosticAssessment {
  assessmentId: string;
  completedAt: number;
  sections: {
    reading?: { score: number; maxScore: number; percentage: number; level: string };
    listening?: { score: number; maxScore: number; percentage: number; level: string };
    grammar?: { score: number; maxScore: number; percentage: number; level: string };
    writing?: { score: number; maxScore: number; percentage: number; level: string };
    speaking?: { score: number; maxScore: number; percentage: number; level: string };
  };
  overallLevel: string;
  strengths: string[];
  weaknesses: string[];
  examLevel: 'A1' | 'B1' | 'B2';
}

interface PrepPlanConfig {
  examDate: Date;
  dailyStudyHours: number;
  studyDaysPerWeek: number;
  preferredStudyTime: 'morning' | 'afternoon' | 'evening' | 'flexible';
}

interface PrepPlanRecommendations {
  recommendations: string[];
  studyTips: string[];
  focusAreas: string[];
  motivationalMessage: string;
}

/**
 * Main Cloud Function
 */
export const generatePrepPlan = functions.https.onCall(
  async (data, context) => {
    // Authentication check
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'User must be authenticated to generate a prep plan'
      );
    }

    const userId = context.auth.uid;

    // Verify premium status
    const isPremium = await checkPremiumStatus(userId);
    if (!isPremium) {
      throw new functions.https.HttpsError(
        'permission-denied',
        'Prep Plan is a premium feature. Please upgrade to access.'
      );
    }

    // Validate input
    const { assessment, config } = data;
    if (!assessment || !config) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Assessment and config are required'
      );
    }

    try {
      // Generate AI recommendations
      const recommendations = await generateAIRecommendations(
        assessment as DiagnosticAssessment,
        config as PrepPlanConfig
      );

      // Log analytics
      await admin.firestore().collection('analytics').add({
        event: 'prep_plan_generated',
        userId,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        examLevel: assessment.examLevel,
        overallLevel: assessment.overallLevel,
        weaknesses: assessment.weaknesses,
      });

      return {
        success: true,
        recommendations,
      };
    } catch (error) {
      console.error('[generatePrepPlan] Error:', error);
      throw new functions.https.HttpsError(
        'internal',
        'Failed to generate prep plan recommendations',
        error
      );
    }
  }
);

/**
 * Check if user has premium access
 */
async function checkPremiumStatus(userId: string): Promise<boolean> {
  try {
    const userDoc = await admin.firestore().collection('users').doc(userId).get();
    const userData = userDoc.data();
    
    if (!userData) {
      return false;
    }

    // Check if premium or if premium never expires
    return (
      userData.isPremium === true ||
      (userData.premiumExpiresAt && userData.premiumExpiresAt.toMillis() > Date.now())
    );
  } catch (error) {
    console.error('[checkPremiumStatus] Error:', error);
    return false;
  }
}

/**
 * Generate AI-powered recommendations using OpenAI
 */
async function generateAIRecommendations(
  assessment: DiagnosticAssessment,
  config: PrepPlanConfig
): Promise<PrepPlanRecommendations> {
  // Build section breakdown text
  const sectionBreakdown = Object.entries(assessment.sections)
    .map(([section, data]) => {
      if (data) {
        return `- ${capitalize(section)}: ${data.percentage.toFixed(1)}% (${data.level})`;
      }
      return '';
    })
    .filter(Boolean)
    .join('\n');

  // Calculate days until exam
  const daysUntilExam = Math.ceil(
    (new Date(config.examDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );
  const weeksUntilExam = Math.ceil(daysUntilExam / 7);

  const prompt = `You are an expert German language teacher specializing in TELC exam preparation. 
A student has completed a diagnostic assessment for the TELC ${assessment.examLevel} German exam. 

Assessment Results:
${sectionBreakdown}

Overall Level: ${assessment.overallLevel}
Strengths: ${assessment.strengths.join(', ')}
Weaknesses: ${assessment.weaknesses.join(', ')}

Study Plan Configuration:
- Days until exam: ${daysUntilExam} (${weeksUntilExam} weeks)
- Daily study time: ${config.dailyStudyHours} hours
- Study days per week: ${config.studyDaysPerWeek}
- Preferred study time: ${config.preferredStudyTime}

Please provide:
1. **5 specific, actionable study recommendations** prioritizing weaknesses
2. **3 study tips** for effective preparation
3. **2-3 key focus areas** for the first few weeks
4. **A motivational message** (1-2 sentences)

Format your response as JSON with this structure:
{
  "recommendations": ["recommendation 1", "recommendation 2", ...],
  "studyTips": ["tip 1", "tip 2", "tip 3"],
  "focusAreas": ["area 1", "area 2", "area 3"],
  "motivationalMessage": "Your motivational message here"
}

Be specific and practical. Reference the student's actual scores and weaknesses.`;

  try {
    const openai = getOpenAIClient();
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content:
            'You are an expert German language teacher. Provide practical, encouraging study advice in JSON format only.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 800,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    const parsed = JSON.parse(content);
    
    // Validate structure
    if (
      !parsed.recommendations ||
      !parsed.studyTips ||
      !parsed.focusAreas ||
      !parsed.motivationalMessage
    ) {
      throw new Error('Invalid response structure from OpenAI');
    }

    return {
      recommendations: parsed.recommendations,
      studyTips: parsed.studyTips,
      focusAreas: parsed.focusAreas,
      motivationalMessage: parsed.motivationalMessage,
    };
  } catch (error) {
    console.error('[generateAIRecommendations] OpenAI error:', error);
    
    // Fallback to generic recommendations if AI fails
    return generateFallbackRecommendations(assessment, config);
  }
}

/**
 * Generate fallback recommendations if AI fails
 */
function generateFallbackRecommendations(
  assessment: DiagnosticAssessment,
  config: PrepPlanConfig
): PrepPlanRecommendations {
  const weaknesses = assessment.weaknesses;
  const strengths = assessment.strengths;

  const recommendations: string[] = [];
  const studyTips: string[] = [
    'Practice consistently at the same time each day to build a habit',
    'Focus on your weak areas first when your energy is highest',
    'Review your mistakes and understand why answers were incorrect',
  ];
  const focusAreas: string[] = [];
  
  // Generate recommendations based on weaknesses
  if (weaknesses.includes('listening')) {
    recommendations.push(
      'Practice listening with authentic German content daily (podcasts, news, interviews)'
    );
    focusAreas.push('Listening comprehension');
  }
  
  if (weaknesses.includes('writing')) {
    recommendations.push(
      'Write at least 2-3 short texts per week and get AI feedback to improve your writing skills'
    );
    focusAreas.push('Writing practice');
  }
  
  if (weaknesses.includes('reading')) {
    recommendations.push(
      'Read German articles and texts at your level, focusing on understanding main ideas'
    );
    focusAreas.push('Reading comprehension');
  }
  
  if (weaknesses.includes('grammar')) {
    recommendations.push(
      'Review grammar rules systematically, focusing on areas where you made mistakes'
    );
    focusAreas.push('Grammar fundamentals');
  }
  
  if (weaknesses.includes('speaking')) {
    recommendations.push(
      'Practice speaking regularly, even if just recording yourself answering common questions'
    );
    focusAreas.push('Speaking fluency');
  }

  // Add general recommendations
  recommendations.push(
    'Take full mock exams in the final weeks to simulate real exam conditions'
  );

  // Add motivation based on strengths
  let motivationalMessage = `You're on the right track! `;
  if (strengths.length > 0) {
    motivationalMessage += `Your ${strengths.join(' and ')} skills are strong. `;
  }
  motivationalMessage += `With ${config.dailyStudyHours} hours of focused daily practice, you'll be well-prepared for the exam!`;

  return {
    recommendations,
    studyTips,
    focusAreas,
    motivationalMessage,
  };
}

/**
 * Capitalize first letter of a string
 */
function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

