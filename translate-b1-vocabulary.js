#!/usr/bin/env node

const fs = require('fs').promises;

// Configuration
const INPUT_FILE = 'b1-vocabulary-clean.json';
const OUTPUT_FILE = 'b1-vocabulary-complete.json';
const PROGRESS_FILE = 'b1-translation-progress.json';
const BATCH_SIZE = 5; // Save progress every 5 items
const PARALLEL_BATCH_SIZE = 10; // Process 10 items in parallel simultaneously

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

// Function to call OpenAI API for translation
async function translateWithOpenAI(germanWord, germanSentences) {
  const prompt = `Translate the following German vocabulary entry to multiple languages.

German word: "${germanWord}"
Example sentences in German:
${germanSentences.map((s, i) => `${i + 1}. ${s}`).join('\n')}

Please provide translations in the following format (JSON):
{
  "wordTranslations": {
    "en": "English translation",
    "es": "Spanish translation",
    "fr": "French translation",
    "ru": "Russian translation",
    "ar": "Arabic translation"
  },
  "sentenceTranslations": [
    {
      "en": "English translation of sentence 1",
      "es": "Spanish translation of sentence 1",
      "fr": "French translation of sentence 1",
      "ru": "Russian translation of sentence 1",
      "ar": "Arabic translation of sentence 1"
    }
  ]
}

Important: 
- Provide accurate, natural translations
- Maintain the same meaning and context
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
            content: 'You are a professional translator specializing in German language. You provide accurate translations in multiple languages. Always respond with valid JSON only.'
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
    
    const translations = JSON.parse(jsonContent);
    return translations;
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

// Function to process a single vocabulary entry
async function processEntry(entry) {
  console.log(`  Processing: "${entry.word}"`);
  
  const germanSentences = entry.exampleSentences.map(s => s.text);
  
  try {
    const translations = await translateWithOpenAI(entry.word, germanSentences);
    
    const processedEntry = {
      word: entry.word,
      article: entry.article,
      translations: translations.wordTranslations,
      type: entry.type,
      exampleSentences: entry.exampleSentences.map((sentence, idx) => ({
        text: sentence.text,
        translations: translations.sentenceTranslations[idx]
      }))
    };
    
    return processedEntry;
  } catch (error) {
    console.error(`  ❌ Failed to process "${entry.word}":`, error.message);
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
  
  console.log('🚀 B1 Vocabulary Translation Script\n');
  console.log(`⏰ Started at: ${new Date().toLocaleTimeString()}\n`);
  
  // Load input file
  const inputData = await fs.readFile(INPUT_FILE, 'utf8');
  const vocabulary = JSON.parse(inputData);
  console.log(`📖 Loaded ${vocabulary.length} vocabulary entries from ${INPUT_FILE}`);
  
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
      console.log(`📍 Resuming from entry ${startIndex + 1} (${outputData.length} entries already processed)`);
    }
  }
  
  // Determine how many items to process
  const itemsToProcess = maxItems ? Math.min(maxItems, vocabulary.length - startIndex) : vocabulary.length - startIndex;
  const endIndex = startIndex + itemsToProcess;
  
  console.log(`📝 Processing ${itemsToProcess} entries (from ${startIndex + 1} to ${endIndex})`);
  console.log(`🚀 Parallel processing: ${PARALLEL_BATCH_SIZE} entries at once`);
  console.log(`💾 Saving progress regularly\n`);
  
  let batchStartTime = Date.now();
  
  // Process in parallel batches
  for (let i = startIndex; i < endIndex; i += PARALLEL_BATCH_SIZE) {
    const batchEnd = Math.min(i + PARALLEL_BATCH_SIZE, endIndex);
    const batchEntries = vocabulary.slice(i, batchEnd);
    const batchSize = batchEntries.length;
    
    const currentNum = i + 1;
    const progress = ((batchEnd - startIndex) / itemsToProcess * 100).toFixed(1);
    
    console.log(`\n[${currentNum}-${batchEnd}/${vocabulary.length}] (${progress}%)`);
    console.log(`  Processing ${batchSize} entries in parallel...`);
    
    try {
      // Process all entries in this batch simultaneously
      const processedBatch = await Promise.all(
        batchEntries.map((entry, idx) => {
          console.log(`    → ${i + idx + 1}. "${entry.word}"`);
          return processEntry(entry);
        })
      );
      
      outputData.push(...processedBatch);
      
      // Save progress after each parallel batch
      await fs.writeFile(OUTPUT_FILE, JSON.stringify(outputData, null, 2));
      await saveProgress(batchEnd, outputData.length);
      console.log(`  ✅ Batch completed (${outputData.length} total entries)`);
      
      // Show time statistics
      const elapsed = Date.now() - startTime;
      const processed = batchEnd - startIndex;
      const remaining = itemsToProcess - processed;
      
      if (remaining > 0) {
        const avgTime = elapsed / processed;
        const estimatedRemaining = avgTime * remaining;
        console.log(`  ⏱️  Elapsed: ${formatDuration(elapsed)} | ETA: ${formatDuration(estimatedRemaining)}`);
      }
      
      // Small delay between parallel batches to avoid rate limiting
      if (batchEnd < endIndex) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
      
    } catch (error) {
      console.error(`\n❌ Error processing batch starting at entry ${currentNum}`);
      console.error(`Error details:`, error.message);
      console.error(`Saving progress and exiting...`);
      await fs.writeFile(OUTPUT_FILE, JSON.stringify(outputData, null, 2));
      await saveProgress(i, outputData.length);
      process.exit(1);
    }
  }
  
  const endTime = Date.now();
  const duration = endTime - startTime;
  
  console.log('\n✨ Translation complete!');
  console.log(`📊 Total entries processed: ${outputData.length}`);
  console.log(`📁 Output saved to: ${OUTPUT_FILE}`);
  console.log(`⏱️  Total time: ${formatDuration(duration)}`);
  console.log(`⏰ Finished at: ${new Date().toLocaleTimeString()}`);
  
  // Calculate average time per entry
  const avgTimePerEntry = duration / itemsToProcess;
  const avgSeconds = (avgTimePerEntry / 1000).toFixed(2);
  console.log(`\n📈 Performance Metrics:`);
  console.log(`   • Average time per entry: ${avgSeconds}s`);
  console.log(`   • Entries processed per minute: ${(60 / avgSeconds).toFixed(1)}`);
  console.log(`   • Parallel batch size: ${PARALLEL_BATCH_SIZE} entries at once`);
  
  // Clean up progress file if we finished everything
  if (endIndex >= vocabulary.length) {
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

