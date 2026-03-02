#!/usr/bin/env node

const fs = require('fs').promises;

// Configuration
const INPUT_FILE = 'app/update-messages.json';
const OUTPUT_FILE = 'app/update-messages.json';

// All target locales we need to support
const TARGET_LOCALES = {
  'pt-BR': 'Portuguese (Brazil)',
  'ja': 'Japanese',
  'ko': 'Korean',
  'zh': 'Chinese (Simplified)',
  'zh-TW': 'Chinese (Traditional)',
  'hi': 'Hindi',
  'nl': 'Dutch',
  'pl': 'Polish',
  'sv': 'Swedish',
  'da': 'Danish',
  'fi': 'Finnish',
  'nb': 'Norwegian',
  'th': 'Thai',
  'vi': 'Vietnamese',
  'id': 'Indonesian',
  'ms': 'Malay',
  'uk': 'Ukrainian',
  'cs': 'Czech',
  'el': 'Greek',
  'he': 'Hebrew',
  'ro': 'Romanian',
  'hu': 'Hungarian'
};

// OpenAI API configuration
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!OPENAI_API_KEY) {
  console.error('❌ Error: OPENAI_API_KEY environment variable is not set');
  console.error('Please set it using: export OPENAI_API_KEY=your_api_key');
  process.exit(1);
}

// Function to call OpenAI API for translation
async function translateMessage(englishMessage) {
  const localesList = Object.entries(TARGET_LOCALES)
    .map(([code, name]) => `"${code}": "${name}"`)
    .join(', ');

  const prompt = `Translate the following app update message to multiple languages. This is for a Telc German exam preparation app.

English message: "${englishMessage}"

Please provide translations in the following format (JSON):
{
  ${Object.entries(TARGET_LOCALES).map(([code, name]) => `"${code}": "${name} translation"`).join(',\n  ')}
}

Important guidelines:
1. Keep the emoji at the beginning of the message
2. Maintain the enthusiastic, motivational tone
3. Keep the message concise and user-friendly
4. Ensure cultural appropriateness for each language
5. For Chinese (Simplified) use simplified characters, for Chinese (Traditional) use traditional characters
6. For right-to-left languages (Arabic, Hebrew), the text should still flow naturally
7. Return ONLY the JSON object, no additional explanation`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are a professional translator specializing in mobile app localization. You provide accurate, culturally appropriate translations while maintaining the tone and style of the original message.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 2000
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  const content = data.choices[0].message.content.trim();
  
  // Extract JSON from the response
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Could not extract JSON from OpenAI response');
  }

  return JSON.parse(jsonMatch[0]);
}

// Function to delay between API calls
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Main function
async function main() {
  console.log('🚀 Starting translation of update messages...\n');

  try {
    // Read the input file
    const fileContent = await fs.readFile(INPUT_FILE, 'utf-8');
    const messages = JSON.parse(fileContent);

    console.log(`📖 Loaded ${messages.length} messages\n`);

    // Process each message
    for (let i = 0; i < messages.length; i++) {
      const message = messages[i];
      console.log(`\n📝 Processing message ${i + 1}/${messages.length}...`);
      console.log(`   English: ${message.en.substring(0, 60)}...`);

      try {
        // Get translations
        const translations = await translateMessage(message.en);
        
        // Add new translations to the message object
        Object.assign(message, translations);
        
        console.log(`   ✅ Successfully translated to ${Object.keys(translations).length} languages`);
        
        // Save progress after each message
        await fs.writeFile(OUTPUT_FILE, JSON.stringify(messages, null, 2), 'utf-8');
        console.log(`   💾 Progress saved`);
        
        // Wait a bit between API calls to avoid rate limiting
        if (i < messages.length - 1) {
          await delay(2000);
        }
      } catch (error) {
        console.error(`   ❌ Error translating message ${i + 1}:`, error.message);
        console.log(`   ⏭️  Continuing with next message...`);
      }
    }

    console.log('\n\n✨ Translation complete!');
    console.log(`📄 Output saved to: ${OUTPUT_FILE}`);
    console.log(`\n📊 Summary:`);
    console.log(`   - Total messages: ${messages.length}`);
    console.log(`   - Languages per message: ${Object.keys(messages[0]).length}`);

  } catch (error) {
    console.error('\n❌ Fatal error:', error.message);
    process.exit(1);
  }
}

// Run the script
main();
