# Vocabulary Upload Guide

## Overview
The Vocabulary Upload feature allows you to upload vocabulary words from JSON files to Firebase Firestore collections for use in the mobile app's Vocabulary Builder feature.

## Accessing the Feature

1. Log in to the Admin Dashboard
2. From the Apps Selection page, click on **"Vocabulary Upload"** in the Admin Actions section
3. Or navigate directly to `/vocabulary-upload`

## How to Use

### Step 1: Select an App
Choose which app you want to upload vocabulary for:
- **German TELC B1** → Uploads to `vocabulary_data_german_a1`
- **German TELC B2** → Uploads to `vocabulary_data_german_b2`
- **English TELC B1** → Uploads to `vocabulary_data_english_a1`

The system will automatically check for existing words in the collection.

### Step 2: Select Your JSON File
Click the file input and select a JSON file containing vocabulary words. The file must:
- Be a valid JSON file (`.json` extension)
- Contain an array of vocabulary word objects
- Follow the required format (see below)

### Step 3: Choose Upload Mode

#### Append Mode (Default)
- Adds new words to the existing collection
- Existing words remain unchanged
- Safe option for adding more vocabulary

#### Clean Mode (⚠️ Use with Caution)
- **Deletes ALL existing words** in the collection
- Then uploads the new words
- Useful for complete data refresh
- **Cannot be undone**

### Step 4: Upload
Click the "Upload" button. The system will:
1. Validate your selection
2. Ask for confirmation
3. (If Clean mode) Delete existing words
4. Upload words in batches of 500
5. Show progress in real-time

## JSON Format

### Required Structure
```json
[
  {
    "id": 1,
    "word": "Hallo",
    "article": "",
    "translations": {
      "en": "hello",
      "es": "hola",
      "fr": "bonjour",
      "ru": "привет",
      "ar": "مرحبا"
    },
    "type": "interjection",
    "exampleSentences": [
      {
        "text": "Hallo! Wie geht's?",
        "translations": {
          "en": "Hello! How are you?",
          "es": "¡Hola! ¿Cómo estás?",
          "fr": "Bonjour ! Comment vas-tu ?"
        }
      }
    ]
  },
  {
    "id": 2,
    "word": "Haus",
    "article": "das",
    "translations": {
      "en": "house",
      "es": "casa",
      "fr": "maison"
    },
    "type": "noun",
    "exampleSentences": [
      {
        "text": "Das Haus ist groß.",
        "translations": {
          "en": "The house is big.",
          "es": "La casa es grande."
        }
      }
    ]
  }
]
```

### Field Descriptions

#### Required Fields
- **`word`** (string): The vocabulary word
- **`translations`** (object): Translations in different languages
  - Supported language codes: `en`, `es`, `fr`, `ru`, `ar`, `de`
  - At least one translation is required
- **`type`** (string): Word type
  - Examples: `noun`, `verb`, `adjective`, `adverb`, `preposition`, `conjunction`, `interjection`
- **`exampleSentences`** (array): Array of example sentences
  - Each sentence must have:
    - `text` (string): The example sentence in the target language
    - `translations` (object): Translations of the example sentence

#### Optional Fields
- **`id`** (number): Unique identifier for the word
  - If not provided, will be auto-generated (1, 2, 3, ...)
  - If provided, must be unique
- **`article`** (string): Article for nouns (German)
  - Use: `der`, `die`, `das`, or empty string

## Firebase Collections

The vocabulary data is stored in the following Firestore collections:

| App | Collection Name | Level |
|-----|----------------|-------|
| German B1 | `vocabulary_data_german_a1` | A1 |
| German B2 | `vocabulary_data_german_b2` | B2 |
| English B1 | `vocabulary_data_english_a1` | A1 |

Each word is stored as a document with its `id` as the document ID.

## Best Practices

### 1. Test with Small Files First
- Upload a small subset (10-20 words) first
- Verify the data in Firebase Console
- Then upload the full dataset

### 2. Keep Backups
- Always keep a copy of your JSON file
- Consider exporting existing data before using Clean mode
- Use version control for your vocabulary files

### 3. Validate Your Data
- Check for duplicate IDs
- Ensure all required fields are present
- Verify translation quality
- Test example sentences

### 4. Use Append Mode When Possible
- Safer than Clean mode
- Preserves existing user progress
- Only use Clean mode when necessary

### 5. ID Management
- If not providing IDs, let the system auto-generate them
- If providing IDs, ensure they're sequential and unique
- IDs are used to track user progress, so keep them consistent

## Troubleshooting

### "Invalid format: JSON must be an array"
- Your JSON file should contain an array `[...]`, not an object `{...}`
- Check that your file starts with `[` and ends with `]`

### "Invalid format: Each word must have required fields"
- Ensure every word object has: `word`, `translations`, `type`
- Check for typos in field names
- Verify the structure matches the example above

### "Failed to parse JSON"
- Your JSON file has syntax errors
- Use a JSON validator to check your file
- Common issues: missing commas, extra commas, unclosed brackets

### Upload Fails Midway
- Check your internet connection
- Verify Firebase permissions
- Try uploading in smaller batches (split your file)

### Existing Words Not Showing
- Wait a few seconds and refresh
- Check you're on the correct app
- Verify the collection name in Firebase Console

## Support

If you encounter issues:
1. Check the browser console for error messages
2. Verify your Firebase permissions
3. Ensure you're logged in with the correct admin account
4. Check the Firebase Console to see if data was partially uploaded

## Example Files

You can find example vocabulary files in:
- `/Users/mham/Desktop/a1-german-vocabulary.json`
- `/Users/mham/Desktop/a1-german-vocabulary_new.json`

These files demonstrate the correct format and structure.

---

**Last Updated:** 2025-01-18  
**Version:** 1.0

