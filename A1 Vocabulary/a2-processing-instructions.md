# A2 Vocabulary Processing Instructions

## Goal
Transform `a2-vocabulary-clean.json` into `a2-vocabulary-complete.json` by adding translations to all vocabulary entries to match the structure of A1 vocabulary batches.

## Current Structure (a2-vocabulary-clean.json)
```json
{
  "word": "anfangen",
  "article": "",
  "type": "verb",
  "exampleSentences": [
    {
      "text": "Der Unterricht fängt gleich an."
    }
  ]
}
```

## Target Structure (a2-vocabulary-complete.json)
```json
{
  "word": "anfangen",
  "article": "",
  "translations": {
    "en": "to start",
    "es": "comenzar",
    "fr": "commencer",
    "ru": "начинать",
    "ar": "يبدأ"
  },
  "type": "verb",
  "exampleSentences": [
    {
      "text": "Der Unterricht fängt gleich an.",
      "translations": {
        "en": "The lesson is starting soon.",
        "es": "La clase comienza pronto.",
        "fr": "Le cours commence bientôt.",
        "ru": "Урок скоро начинается.",
        "ar": "الدرس يبدأ قريباً."
      }
    }
  ]
}
```

## Processing Requirements

### 1. Word Translations
- Add a `translations` object at the word level with 5 languages:
  - `en`: English
  - `es`: Spanish
  - `fr`: French
  - `ru`: Russian
  - `ar`: Arabic

### 2. Example Sentence Translations
- For EACH example sentence, add a `translations` object with the same 5 languages
- Translations should be natural and contextually appropriate, not literal

### 3. Translation Quality Guidelines
- **Nouns**: Include article context where relevant (der/die/das should inform gender in target languages)
- **Verbs**: Use infinitive form for word translation, conjugate appropriately in sentences
- **Adjectives**: Consider context and grammatical agreement in target languages
- **Prepositions**: Choose appropriate equivalents based on usage context
- **Phrases**: Translate idiomatically, not word-for-word

### 4. Data Integrity
- Preserve all existing fields: `word`, `article`, `type`, `exampleSentences`
- Maintain JSON structure and formatting
- Keep array order consistent with source file

## Processing Workflow

### Step 1: Initialize
1. Create `a2-vocabulary-complete.json` with empty array `[]`
2. Check `a2-processing-tracker.json` for last processed index (start at 0 if new)

### Step 2: Process in Batches
1. Process 20-50 words per session (manageable AI context)
2. For each word:
   - Add word-level translations
   - Add translations for each example sentence
3. Append processed words to `a2-vocabulary-complete.json`

### Step 3: Update Tracker
1. After each batch, update `a2-processing-tracker.json` with:
   - `lastProcessedIndex`: Index of last completed word
   - `totalWords`: Total count in source file
   - `lastUpdated`: Timestamp
   - `status`: "in_progress" or "complete"

### Step 4: Validation
- Verify all words have translations object with 5 languages
- Verify all example sentences have translations object with 5 languages
- Check JSON validity
- Ensure no duplicate words

### Step 5: Resume Processing
- Always check tracker file before starting
- Continue from `lastProcessedIndex + 1`
- Process next batch

## File Structure

### Input Files
- `a2-vocabulary-clean.json` - Source vocabulary (read-only)
- `a2-processing-tracker.json` - Processing state tracker

### Output Files
- `a2-vocabulary-complete.json` - Final vocabulary with translations

## Commands for Processing

### Check Current Status
```bash
cat a2-processing-tracker.json
```

### Count Total Words
```bash
jq 'length' a2-vocabulary-clean.json
```

### Validate Output
```bash
jq 'length' a2-vocabulary-complete.json
```

### Resume Processing
1. Read tracker to get `lastProcessedIndex`
2. Read source file from index `lastProcessedIndex + 1`
3. Process batch (20-50 words)
4. Append to output file
5. Update tracker

## Notes
- The source file contains over 1,000 words
- Processing will take multiple sessions
- Always maintain the tracker file
- Back up files before major processing sessions
- Test with small batches first (5-10 words) to ensure quality

