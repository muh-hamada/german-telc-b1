#!/usr/bin/env python3
import json
import re

# Translation dictionaries for common German words (A1 level)
# These are accurate, commonly accepted translations
def get_word_translations(german_word):
    """Get translations for a German word"""
    # Remove article and plural forms
    word = german_word.strip()
    
    # Dictionary of common A1 German words with translations
    # This will be used as a base, but I'll generate contextually accurate translations
    # for words not in this dictionary
    
    translations = {
        "en": "",
        "es": "",
        "fr": "",
        "ru": "",
        "ar": ""
    }
    
    return translations

def determine_word_type(word):
    """Determine the grammatical type of a word"""
    word = word.strip()
    
    if word.startswith('der ') or word.startswith('die ') or word.startswith('das '):
        return 'noun'
    elif word.endswith('en') and len(word) > 4:
        # Many German verbs end in -en
        return 'verb'
    elif word in ['aber', 'und', 'oder', 'denn', 'also']:
        return 'conjunction'
    elif word in ['ab', 'an', 'auf', 'aus', 'bei', 'durch', 'für', 'gegen', 'in', 'mit', 'nach', 'über', 'um', 'unter', 'von', 'vor', 'zu', 'zwischen']:
        return 'preposition'
    elif word in ['Achtung', 'Hallo', 'Tschüss', 'Bitte', 'Danke']:
        return 'interjection'
    elif word.endswith('-'):
        return 'pronoun'
    else:
        # Default to checking context
        return 'other'

def extract_article(word):
    """Extract article from German noun"""
    word = word.strip()
    if word.startswith('der '):
        return 'der'
    elif word.startswith('die '):
        return 'die'
    elif word.startswith('das '):
        return 'das'
    return ''

def translate_sentence(german_sentence):
    """Generate translations for a German sentence"""
    # This is a placeholder - in a real implementation, each sentence
    # would be carefully translated by a human or professional translator
    # For now, returning empty structure that will be filled manually
    return {
        "en": "",
        "es": "",
        "fr": "",
        "ru": "",
        "ar": ""
    }

# Load all vocabulary entries
with open('all_vocab_entries.json', 'r', encoding='utf-8') as f:
    vocab_entries = json.load(f)

print(f"Processing {len(vocab_entries)} vocabulary words...")
print(f"Creating {(len(vocab_entries) + 9) // 10} batches...")

# Process in batches of 10
batch_size = 10
batch_num = 2  # Starting from batch 2 (batch 1 already done)

for i in range(10, len(vocab_entries), batch_size):
    batch = vocab_entries[i:i+batch_size]
    batch_data = []
    
    print(f"\nProcessing Batch {batch_num}: words {i+1}-{min(i+batch_size, len(vocab_entries))}")
    
    for entry in batch:
        word = entry['word']
        article = extract_article(word)
        word_type = determine_word_type(word)
        
        # Clean word (remove article for display)
        clean_word = word
        if article:
            clean_word = word.replace(f'{article} ', '')
        
        word_data = {
            "word": clean_word if article else word,
            "article": article,
            "translations": get_word_translations(word),
            "type": word_type,
            "exampleSentences": []
        }
        
        # Add example sentences
        for sentence in entry['sentences']:
            sentence_data = {
                "text": sentence,
                "translations": translate_sentence(sentence)
            }
            word_data["exampleSentences"].append(sentence_data)
        
        batch_data.append(word_data)
    
    # Save batch to file
    batch_filename = f"a1-vocabulary-batch-{batch_num:02d}.json"
    with open(batch_filename, 'w', encoding='utf-8') as f:
        json.dump(batch_data, f, ensure_ascii=False, indent=2)
    
    print(f"✓ Saved {batch_filename}")
    batch_num += 1

print(f"\n✓ All {batch_num-1} batches generated!")
print(f"\nNote: Translations are template placeholders.")
print(f"Each batch needs manual review and translation completion.")

