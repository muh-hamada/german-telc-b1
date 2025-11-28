#!/usr/bin/env python3
import json
import re

# Read the incomplete explanations
with open('/Users/mham/projects/german-telc-b1/incomplete_explanations.json', 'r', encoding='utf-8') as f:
    incomplete = json.load(f)

# Read the original file
with open('/Users/mham/projects/german-telc-b1/app/admin-dashboard/src/data/english-b1/grammer-study-questions.json', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Manual translations for the specific entries the user mentioned
translations = {
    "Negative adverbs at the start of a sentence require inversion, similar to a question form: Auxiliary ('have') + Subject ('I') + Main Verb ('seen').": {
        "Fr": "Les adverbes négatifs au début de la phrase nécessitent l'inversion, similaire à la forme interrogative : Auxiliaire ('have') + Sujet ('I') + Verbe principal ('seen').",
        "ru": "Отрицательные наречия в начале предложения требуют инверсии, подобно вопросительной форме: вспомогательный глагол ('have') + подлежащее ('I') + основной глагол ('seen').",
        "es": "Los adverbios negativos al comienzo de la oración requieren inversión, similar a la forma interrogativa: Auxiliar ('have') + Sujeto ('I') + Verbo principal ('seen')."
    },
    "Incorrect. This is standard word order and fails the rule for mandatory inversion.": {
        "Fr": "Incorrect. Ceci est l'ordre des mots standard et ne respecte pas la règle d'inversion obligatoire.",
        "ru": "Неверно. Это стандартный порядок слов, который не соответствует правилу обязательной инверсии.",
        "es": "Incorrecto. Este es el orden de palabras estándar y no cumple con la regla de inversión obligatoria."
    },
    "Wrong tense. The sentence refers to a life experience (Present Perfect).": {
        "Fr": "Mauvais temps. La phrase fait référence à une expérience de vie (Présent Parfait).",
        "ru": "Неправильное время. Предложение относится к жизненному опыту (Present Perfect).",
        "es": "Tiempo verbal incorrecto. La frase se refiere a una experiencia de vida (Presente Perfecto)."
    },
    "After 'Hardly' at the start of the sentence, inversion follows (had + subject + V3).": {
        "ru": "После 'Hardly' в начале предложения следует инверсия (had + подлежащее + V3).",
        "es": "Después de 'Hardly' al comienzo de la oración, sigue la inversión (had + sujeto + V3)."
    }
}

print(f"Processing {len(incomplete)} incomplete explanations...")
print(f"Starting with items on lines 2712, 2721, 2730, and 2769...\n")

# Process each incomplete explanation
fixes_applied = 0
for item in incomplete:
    start_line = item['startLine'] - 1  # Convert to 0-based index
    end_line = item['endLine'] - 1
    missing_langs = item['missing']
    en_text = item['translations'].get('en', '')
    
    if not en_text:
        print(f"Warning: No English text found for lines {item['startLine']}-{item['endLine']}")
        continue
    
    # Check if we have translations for this text
    if en_text in translations:
        # Find the line with "en": text (should be the second to last line in the explanation)
        en_line_idx = None
        for i, line_info in enumerate(item['explanationLines']):
            if '"en":' in line_info['text']:
                en_line_idx = line_info['lineNum'] - 1  # Convert to 0-based
                break
        
        if en_line_idx is not None:
            # Check if there's a trailing comma
            en_line = lines[en_line_idx]
            has_trailing_comma = en_line.rstrip().endswith(',')
            
            # Build new lines for missing translations
            new_translations = []
            for lang in ['Fr', 'ru', 'es']:
                if lang in missing_langs and lang in translations[en_text]:
                    trans_text = translations[en_text][lang]
                    # Match the indentation of the 'en' line
                    indent = len(en_line) - len(en_line.lstrip())
                    spaces = ' ' * indent
                    # Add comma to all except the last one (es)
                    comma = ',' if lang != 'es' else ''
                    new_line = f'{spaces}"{lang}": "{trans_text}"{comma}\n'
                    new_translations.append(new_line)
            
            if new_translations:
                # Remove trailing comma from 'en' line if it has one
                if has_trailing_comma:
                    lines[en_line_idx] = en_line.rstrip()[:-1] + ',\n'
                else:
                    # Add comma to en line if it doesn't have one and we're adding more lines
                    if not en_line.rstrip().endswith(','):
                        lines[en_line_idx] = en_line.rstrip() + ',\n'
                
                # Insert new translation lines after the 'en' line
                for i, new_line in enumerate(new_translations):
                    lines.insert(en_line_idx + 1 + i, new_line)
                
                fixes_applied += 1
                print(f"✓ Fixed lines {item['startLine']}-{item['endLine']}: Added {', '.join(missing_langs)}")

print(f"\nApplied {fixes_applied} fixes.")

# Write the updated file
with open('/Users/mham/projects/german-telc-b1/app/admin-dashboard/src/data/english-b1/grammer-study-questions.json', 'w', encoding='utf-8') as f:
    f.writelines(lines)

print("File updated successfully!")

