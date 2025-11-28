#!/usr/bin/env python3
"""
Generate all missing translations by using a comprehensive translation approach
"""
import json
import re

# Read files
with open('/Users/mham/projects/german-telc-b1/incomplete_explanations.json', 'r', encoding='utf-8') as f:
    incomplete = json.load(f)

with open('/Users/mham/projects/german-telc-b1/app/admin-dashboard/src/data/english-b1/grammer-study-questions.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# Create a comprehensive dictionary by analyzing ALL existing complete translations
translation_patterns = {'Fr': {}, 'ru': {}, 'es': {}}

print("Analyzing existing translations to build translation dictionary...")
for topic in data:
    if 'sentences' not in topic:
        continue
    for sentence in topic['sentences']:
        if 'question' not in sentence or 'options' not in sentence['question']:
            continue
        for option in sentence['question']['options']:
            if 'explanation' not in option:
                continue
            exp = option['explanation']
            # If this has all 6 languages, use it as a reference
            if all(lang in exp for lang in ['de', 'ar', 'en', 'Fr', 'ru', 'es']):
                en = exp['en']
                # Store each phrase mapping
                for lang in ['Fr', 'ru', 'es']:
                    translation_patterns[lang][en] = exp[lang]

print(f"Found {len([v for patterns in translation_patterns.values() for v in patterns])} translation patterns")

# Now use these patterns to translate
fixed_count = 0
still_missing = []

for item in incomplete:
    en_text = item['translations'].get('en', '')
    missing_langs = item['missing']
    
    if not en_text:
        continue
    
    # Try to find exact match
    translations_found = {}
    for lang in missing_langs:
        if en_text in translation_patterns[lang]:
            translations_found[lang] = translation_patterns[lang][en_text]
    
    if not translations_found:
        still_missing.append({
            'en': en_text,
            'missing': missing_langs
        })
        continue
    
    # Update in data structure
    found = False
    for topic in data:
        if 'sentences' not in topic:
            continue
        for sentence in topic['sentences']:
            if 'question' not in sentence or 'options' not in sentence['question']:
                continue
            for option in sentence['question']['options']:
                if 'explanation' not in option:
                    continue
                if option['explanation'].get('en') == en_text:
                    for lang, trans in translations_found.items():
                        option['explanation'][lang] = trans
                    found = True
                    fixed_count += 1
                    print(f"✓ Fixed: {en_text[:60]}...")
                    break
            if found:
                break
        if found:
            break

print(f"\n{'='*60}")
print(f"Summary:")
print(f"  Successfully fixed (exact matches): {fixed_count}")
print(f"  Still need translation: {len(still_missing)}")
print(f"{'='*60}\n")

if fixed_count > 0:
    print("Writing updated JSON...")
    with open('/Users/mham/projects/german-telc-b1/app/admin-dashboard/src/data/english-b1/grammer-study-questions.json', 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    print("File updated successfully!")

if still_missing:
    print(f"\n{len(still_missing)} entries still need translation:")
    with open('/Users/mham/projects/german-telc-b1/still_need_translation.json', 'w', encoding='utf-8') as f:
        json.dump(still_missing, f, indent=2, ensure_ascii=False)
    print("Saved to still_need_translation.json")
    
    # Print first 5
    for i, item in enumerate(still_missing[:5]):
        print(f"\n{i+1}. Missing: {', '.join(item['missing'])}")
        print(f"   English: \"{item['en']}\"")
    if len(still_missing) > 5:
        print(f"\n... and {len(still_missing) - 5} more")

