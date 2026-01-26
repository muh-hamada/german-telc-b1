#!/usr/bin/env node

const fs = require('fs').promises;

// Configuration
const INPUT_FILE = 'spanish-grammar-questions-raw-2.txt';
const OUTPUT_FILE = 'spanish-grammar-questions-complete.json';
const PROGRESS_FILE = 'spanish-grammar-questions-progress.json';
const PARALLEL_BATCH_SIZE = 1; // Process 1 question at a time for detailed explanations

// Parse command line arguments
const args = process.argv.slice(2);
let maxItems = null;
let startFromScratch = false;

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--scratch' || args[i] === '-s') {
    startFromScratch = true;
  } else if (args[i] === '--max' || args[i] === '-m') {
    maxItems = parseInt(args[i + 1]);
    i++;
  } else if (!isNaN(parseInt(args[i]))) {
    maxItems = parseInt(args[i]);
  }
}

// OpenAI API configuration
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!OPENAI_API_KEY) {
  console.error('❌ Error: OPENAI_API_KEY environment variable is not set');
  console.error('Please set it using: export OPENAI_API_KEY=your_api_key');
  process.exit(1);
}

// Function to parse a raw question line
function parseRawQuestion(line) {
  // Match pattern: "Sentence with **word** here. (option1, option2)"
  // Allow for optional text before ** (handle cases where sentence starts with **)
  const regex = /^(.*?)\*\*(.+?)\*\*(.+?)\s*\((.+)\)\s*$/;
  const match = line.trim().match(regex);
  
  if (!match) {
    throw new Error(`Could not parse line: ${line}`);
  }
  
  const beforeWord = match[1]; // Can be empty string
  const correctAnswer = match[2];
  const afterWord = match[3];
  const optionsStr = match[4];
  
  // Full sentence with **
  const fullSentence = `${beforeWord}**${correctAnswer}**${afterWord}`;
  
  // Rendered sentence with blank
  const renderedSentence = `${beforeWord}____${afterWord}`;
  
  // Parse incorrect options - split by comma
  const incorrectOptions = optionsStr.split(',').map(opt => opt.trim());
  
  return {
    fullSentence,
    renderedSentence,
    correctAnswer,
    incorrectOptions
  };
}

// Function to call OpenAI API for grammar question generation
async function generateGrammarQuestion(parsedQuestion) {
  const { fullSentence, renderedSentence, correctAnswer, incorrectOptions } = parsedQuestion;
  
  const prompt = `You are a Spanish grammar expert creating a B1-level multiple choice question.

Given:
- Full sentence: "${fullSentence}"
- Correct answer: "${correctAnswer}"
- Incorrect options: ${incorrectOptions.map(o => `"${o}"`).join(', ')}

Please provide:
1. Translation of the full sentence to: English (en), German (de), French (fr), Russian (ru), Arabic (ar), Spanish (es)
2. For EACH option (correct and incorrect), provide:
   - A detailed grammatical explanation of WHY it is correct or WHY it is incorrect
   - Translate this explanation to all languages: English (en), German (de), French (fr), Russian (ru), Arabic (ar), Spanish (es)

Return the response in the following JSON format:
{
  "translations": {
    "en": "English translation of full sentence",
    "de": "German translation",
    "fr": "French translation",
    "ru": "Russian translation",
    "ar": "Arabic translation",
    "es": "Spanish (same as original)"
  },
  "options": [
    {
      "choice": "${correctAnswer}",
      "is_correct": true,
      "explanation": {
        "en": "Detailed grammatical explanation in English",
        "de": "Detailed grammatical explanation in German",
        "fr": "Detailed grammatical explanation in French",
        "ru": "Detailed grammatical explanation in Russian",
        "ar": "Detailed grammatical explanation in Arabic",
        "es": "Detailed grammatical explanation in Spanish"
      }
    },
    {
      "choice": "${incorrectOptions[0]}",
      "is_correct": false,
      "explanation": {
        "en": "Explanation of why this is wrong in English",
        "de": "Explanation in German",
        "fr": "Explanation in French",
        "ru": "Explanation in Russian",
        "ar": "Explanation in Arabic",
        "es": "Explanation in Spanish"
      }
    },
    {
      "choice": "${incorrectOptions[1] || ''}",
      "is_correct": false,
      "explanation": {
        "en": "Explanation of why this is wrong in English",
        "de": "Explanation in German",
        "fr": "Explanation in French",
        "ru": "Explanation in Russian",
        "ar": "Explanation in Arabic",
        "es": "Explanation in Spanish"
      }
    }
  ]
}

Important:
- Provide detailed, educational grammatical explanations
- Explanations should help learners understand the grammar rule
- Be specific about tenses, verb forms, prepositions, etc.
- Return ONLY the JSON object, no additional text`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a professional Spanish grammar teacher and linguist specializing in B1-level Spanish grammar. You provide detailed, accurate grammatical explanations in multiple languages. Always respond with valid JSON only.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 3000
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`OpenAI API error: ${response.status} - ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content.trim();
    
    // Remove markdown code blocks if present
    let jsonContent = content;
    if (content.startsWith('```json')) {
      jsonContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    } else if (content.startsWith('```')) {
      jsonContent = content.replace(/```\n?/g, '').trim();
    }
    
    const result = JSON.parse(jsonContent);
    return result;
  } catch (error) {
    console.error('Error calling OpenAI API:', error.message);
    throw error;
  }
}

// Function to save progress
async function saveProgress(processedCount, totalProcessed) {
  const progress = {
    processedCount,
    totalProcessed,
    lastUpdate: new Date().toISOString()
  };
  await fs.writeFile(PROGRESS_FILE, JSON.stringify(progress, null, 2));
}

// Function to load progress
async function loadProgress() {
  try {
    const data = await fs.readFile(PROGRESS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return { processedCount: 0, totalProcessed: 0 };
  }
}

// Function to load existing output
async function loadExistingOutput() {
  try {
    const data = await fs.readFile(OUTPUT_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

// Function to process a single question
async function processQuestion(rawLine, lineNumber) {
  console.log(`  Processing line ${lineNumber}: "${rawLine.substring(0, 50)}..."`);
  
  try {
    // Parse the raw question
    const parsedQuestion = parseRawQuestion(rawLine);
    
    // Generate translations and explanations
    const aiResult = await generateGrammarQuestion(parsedQuestion);
    
    // Construct the final question object
    const questionObject = {
      translations: aiResult.translations,
      text: parsedQuestion.fullSentence,
      question: {
        type: "multiple_choice",
        rendered_sentence: parsedQuestion.renderedSentence,
        options: aiResult.options
      }
    };
    
    return questionObject;
  } catch (error) {
    console.error(`  ❌ Failed to process line ${lineNumber}:`, error.message);
    throw error;
  }
}

// Function to format duration
function formatDuration(milliseconds) {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  const remainingMinutes = minutes % 60;
  const remainingSeconds = seconds % 60;
  
  if (hours > 0) {
    return `${hours}h ${remainingMinutes}m ${remainingSeconds}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${remainingSeconds}s`;
  } else {
    return `${seconds}s`;
  }
}

// Main function
async function main() {
  const startTime = Date.now();
  
  console.log('🚀 Spanish B1 Grammar Questions Generation Script\n');
  console.log(`⏰ Started at: ${new Date().toLocaleTimeString()}\n`);
  
  // Load input file
  const inputData = await fs.readFile(INPUT_FILE, 'utf8');
  const rawLines = inputData.split('\n').filter(line => line.trim().length > 0);
  console.log(`📖 Loaded ${rawLines.length} grammar questions from ${INPUT_FILE}`);
  
  // Determine starting point
  let startIndex = 0;
  let outputData = [];
  
  if (startFromScratch) {
    console.log('🔄 Starting from scratch...');
    // Delete progress file if it exists
    try {
      await fs.unlink(PROGRESS_FILE);
      await fs.unlink(OUTPUT_FILE);
    } catch (error) {
      // Files don't exist, that's fine
    }
  } else {
    const progress = await loadProgress();
    startIndex = progress.processedCount;
    outputData = await loadExistingOutput();
    
    if (startIndex > 0) {
      console.log(`📍 Resuming from question ${startIndex + 1} (${outputData.length} questions already processed)`);
    }
  }
  
  // Determine how many items to process
  const itemsToProcess = maxItems ? Math.min(maxItems, rawLines.length - startIndex) : rawLines.length - startIndex;
  const endIndex = startIndex + itemsToProcess;
  
  console.log(`📝 Processing ${itemsToProcess} questions (from ${startIndex + 1} to ${endIndex})`);
  console.log(`🐌 Processing: ${PARALLEL_BATCH_SIZE} question at a time for detailed analysis`);
  console.log(`💾 Saving progress regularly\n`);
  
  // Process questions one at a time
  for (let i = startIndex; i < endIndex; i++) {
    const lineNumber = i + 1;
    const rawLine = rawLines[i];
    
    const progress = ((i + 1 - startIndex) / itemsToProcess * 100).toFixed(1);
    
    console.log(`\n[${lineNumber}/${rawLines.length}] (${progress}%)`);
    
    try {
      const processedQuestion = await processQuestion(rawLine, lineNumber);
      outputData.push(processedQuestion);
      
      // Save progress after each question
      await fs.writeFile(OUTPUT_FILE, JSON.stringify(outputData, null, 2));
      await saveProgress(i + 1, outputData.length);
      console.log(`  ✅ Question completed (${outputData.length} total questions)`);
      
      // Show time statistics
      const elapsed = Date.now() - startTime;
      const processed = i + 1 - startIndex;
      const remaining = itemsToProcess - processed;
      
      if (remaining > 0) {
        const avgTime = elapsed / processed;
        const estimatedRemaining = avgTime * remaining;
        console.log(`  ⏱️  Elapsed: ${formatDuration(elapsed)} | ETA: ${formatDuration(estimatedRemaining)}`);
      }
      
      // Small delay to avoid rate limiting
      if (i + 1 < endIndex) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
    } catch (error) {
      console.error(`\n❌ Error processing question ${lineNumber}`);
      console.error(`Error details:`, error.message);
      console.error(`Saving progress and exiting...`);
      await fs.writeFile(OUTPUT_FILE, JSON.stringify(outputData, null, 2));
      await saveProgress(i, outputData.length);
      process.exit(1);
    }
  }
  
  const endTime = Date.now();
  const duration = endTime - startTime;
  
  console.log('\n✨ Generation complete!');
  console.log(`📊 Total questions processed: ${outputData.length}`);
  console.log(`📁 Output saved to: ${OUTPUT_FILE}`);
  console.log(`⏱️  Total time: ${formatDuration(duration)}`);
  console.log(`⏰ Finished at: ${new Date().toLocaleTimeString()}`);
  
  // Calculate average time per question
  const avgTimePerEntry = duration / itemsToProcess;
  const avgSeconds = (avgTimePerEntry / 1000).toFixed(2);
  console.log(`\n📈 Performance Metrics:`);
  console.log(`   • Average time per question: ${avgSeconds}s`);
  console.log(`   • Questions processed per minute: ${(60 / avgSeconds).toFixed(1)}`);
  
  // Clean up progress file if we finished everything
  if (endIndex >= rawLines.length) {
    try {
      await fs.unlink(PROGRESS_FILE);
      console.log('🧹 Progress file cleaned up');
    } catch (error) {
      // File doesn't exist, that's fine
    }
  }
}

// Run the script
main().catch(error => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});
