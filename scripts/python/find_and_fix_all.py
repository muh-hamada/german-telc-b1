#!/usr/bin/env python3
"""
Find all remaining incomplete explanations and prepare them for translation.
"""
import json
import re

# Read the file as text first to handle the trailing commas
with open('/Users/mham/projects/german-telc-b1/app/admin-dashboard/src/data/english-b1/grammer-study-questions.json', 'r', encoding='utf-8') as f:
    content = f.read()

# Remove ALL trailing commas before closing braces in explanation objects
content_fixed = re.sub(r',(\s+})', r'\1', content, flags=re.MULTILINE)

# Now try to parse as JSON
try:
    data = json.loads(content_fixed)
    print("✓ Successfully parsed JSON after removing trailing commas")
except json.JSONDecodeError as e:
    print(f"JSON error: {e}")
    # Save the fixed version anyway
    with open('/Users/mham/projects/german-telc-b1/app/admin-dashboard/src/data/english-b1/grammer-study-questions.json', 'w', encoding='utf-8') as f:
        f.write(content_fixed)
    print("Saved file with trailing commas removed")
    exit(1)

# Find all incomplete explanations
incomplete = []
required_langs = {'de', 'ar', 'en', 'Fr', 'ru', 'es'}

for topic_idx, topic in enumerate(data):
    if 'sentences' not in topic:
        continue
    for sent_idx, sentence in enumerate(topic['sentences']):
        if 'question' not in sentence or 'options' not in sentence['question']:
            continue
        for opt_idx, option in enumerate(sentence['question']['options']):
            if 'explanation' not in option:
                continue
            exp = option['explanation']
            existing_langs = set(exp.keys())
            missing_langs = required_langs - existing_langs
            
            if missing_langs:
                incomplete.append({
                    'topic': topic.get('name', 'Unknown'),
                    'topic_idx': topic_idx,
                    'sent_idx': sent_idx,
                    'opt_idx': opt_idx,
                    'choice': option.get('choice', ''),
                    'missing': sorted(list(missing_langs)),
                    'en': exp.get('en', '')
                })

print(f"\nFound {len(incomplete)} incomplete explanations")
print(f"Saving to incomplete_for_translation.json...")

with open('/Users/mham/projects/german-telc-b1/incomplete_for_translation.json', 'w', encoding='utf-8') as f:
    json.dump(incomplete, f, indent=2, ensure_ascii=False)

# Save the cleaned data
with open('/Users/mham/projects/german-telc-b1/app/admin-dashboard/src/data/english-b1/grammer-study-questions.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=2, ensure_ascii=False)

print("✓ File saved with proper JSON formatting")
print(f"\nNow need to translate {len(incomplete)} entries")

