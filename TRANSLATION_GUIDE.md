# B1 Vocabulary Translation Script

This script translates the B1 vocabulary from `b1-vocabulary.json` to multiple languages (English, Spanish, French, Russian, Arabic) using the OpenAI API.

## Prerequisites

1. Node.js installed (v14 or higher)
2. OpenAI API key

## Setup

Set your OpenAI API key as an environment variable:

```bash
export OPENAI_API_KEY='your_api_key_here'
```

## Usage

### Basic usage (process all items)
```bash
node translate-b1-vocabulary.js
```

### Test with a specific number of items
```bash
node translate-b1-vocabulary.js 5
# or
node translate-b1-vocabulary.js --max 10
```

### Start from scratch (delete previous progress)
```bash
node translate-b1-vocabulary.js --scratch
# or combine with max items
node translate-b1-vocabulary.js --scratch 5
```

### Continue from where you left off
```bash
node translate-b1-vocabulary.js
# The script automatically resumes from the last saved position
```

## How it works

1. **Batch Processing**: Processes vocabulary entries in batches of 5 items
2. **Progress Saving**: Saves progress to `b1-vocabulary-complete.json` after each batch
3. **Resume Capability**: Can resume from where it left off if interrupted
4. **Progress Tracking**: Maintains a progress file (`b1-translation-progress.json`)
5. **Rate Limiting**: Includes a 500ms delay between API calls to avoid rate limits

## Output Format

The output file `b1-vocabulary-complete.json` will have the following structure:

```json
[
  {
    "word": "abschreiben",
    "article": "",
    "translations": {
      "en": "to copy",
      "es": "copiar",
      "fr": "copier",
      "ru": "списывать",
      "ar": "نسخ"
    },
    "type": "verb",
    "exampleSentences": [
      {
        "text": "Er hat die Hausaufgaben von mir abgeschrieben.",
        "translations": {
          "en": "He copied the homework from me.",
          "es": "Él copió la tarea de mí.",
          "fr": "Il a copié les devoirs de moi.",
          "ru": "Он списал домашнее задание у меня.",
          "ar": "نسخ الواجب المنزلي مني."
        }
      }
    ]
  }
]
```

## Files Created

- `b1-vocabulary-complete.json` - The main output file with translations
- `b1-translation-progress.json` - Progress tracking file (automatically deleted when complete)

## Error Handling

If the script encounters an error:
1. It saves the current progress to disk
2. Logs the error details
3. Exits gracefully

You can then fix any issues and run the script again to resume from where it stopped.

## Cost Estimation

Using GPT-4o-mini model:
- Approximate cost: $0.001 - $0.002 per vocabulary entry
- Total estimated cost for ~600 entries: $0.60 - $1.20

## Tips

1. **Test first**: Start with a small number (e.g., 5-10 items) to verify everything works
2. **Monitor progress**: The script shows real-time progress with percentages
3. **Check output**: Review the generated `b1-vocabulary-complete.json` periodically
4. **API limits**: The script includes rate limiting, but if you hit API limits, just run it again later to resume

## Quick Command Reference

```bash
# Test with 3 items
node translate-b1-vocabulary.js 3

# Process 50 items
node translate-b1-vocabulary.js 50

# Continue processing (resumes automatically)
node translate-b1-vocabulary.js

# Start fresh, delete all previous progress
node translate-b1-vocabulary.js --scratch

# Start fresh and process 10 items
node translate-b1-vocabulary.js --scratch 10

# Check progress
cat b1-translation-progress.json
```

## Checking Current Progress

To see how many entries have been processed:

```bash
# View progress file
cat b1-translation-progress.json

# Count completed entries
node -e "console.log(JSON.parse(require('fs').readFileSync('b1-vocabulary-complete.json')).length + ' entries completed')"
```

