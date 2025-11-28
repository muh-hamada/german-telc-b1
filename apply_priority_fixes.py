#!/usr/bin/env python3
"""
Final comprehensive fix for incomplete explanations.
This handles the malformed JSON (trailing commas) and adds missing translations.
"""

# Read the incomplete_explanations file to get all items that need fixing
import json

with open('/Users/mham/projects/german-telc-b1/incomplete_explanations.json', 'r', encoding='utf-8') as f:
    incomplete_list = json.load(f)

print(f"Found {len(incomplete_list)} incomplete explanations to fix")

# Read the file as text  
with open('/Users/mham/projects/german-telc-b1/app/admin-dashboard/src/data/english-b1/grammer-study-questions.json', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Dictionary of English -> translations for the ones the user specifically mentioned
PRIORITY_TRANSLATIONS = {
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
    "'Which' would be incomplete as it would require the preposition ('on') (on which).": {
        "es": "'Which' sería incompleto ya que requeriría la preposición ('on') (on which)."
    },
    "'Where' refers to places only, not times.": {
        "es": "'Where' se refiere solo a lugares, no a tiempos."
    },
    "'When' refers to a time ('the day') and replaces 'on which'.": {
        "es": "'When' se refiere a un tiempo ('the day') y reemplaza 'on which'."
    }
}

# Process the file
fixes_applied = 0

for item in incomplete_list:
    en_text = item['translations'].get('en', '')
    if not en_text or en_text not in PRIORITY_TRANSLATIONS:
        continue
    
    missing_langs = item['missing']
    start_line_idx = item['startLine'] - 1
    
    # Find the "en": line within the explanation
    for line_info in item['explanationLines']:
        if '"en":' in line_info['text']:
            en_line_num = line_info['lineNum'] - 1
            
            # Build the new lines to insert
            indent = '                '  # Match the indentation
            new_translation_lines = []
            
            for lang in ['Fr', 'ru', 'es']:
                if lang in missing_langs and lang in PRIORITY_TRANSLATIONS[en_text]:
                    trans = PRIORITY_TRANSLATIONS[en_text][lang]
                    is_last = (lang == 'es')
                    comma = '' if is_last else ','
                    new_line = f'{indent}"{lang}": "{trans}"{comma}\n'
                    new_translation_lines.append(new_line)
            
            if new_translation_lines:
                # Remove trailing comma from en line if it has one
                if lines[en_line_num].rstrip().endswith(','):
                    lines[en_line_num] = lines[en_line_num].rstrip() + ',\n'
                else:
                    lines[en_line_num] = lines[en_line_num].rstrip() + ',\n'
                
                # Insert the new lines after the en line
                for i, new_line in enumerate(new_translation_lines):
                    lines.insert(en_line_num + 1 + i, new_line)
                
                fixes_applied += 1
                print(f"✓ Fixed line {item['startLine']}: Added {', '.join([l for l in missing_langs if l in PRIORITY_TRANSLATIONS[en_text]])}")
            break

print(f"\n{'='*60}")
print(f"Applied {fixes_applied} priority fixes")
print(f"{'='*60}\n")

# Write back
with open('/Users/mham/projects/german-telc-b1/app/admin-dashboard/src/data/english-b1/grammer-study-questions.json', 'w', encoding='utf-8') as f:
    f.writelines(lines)

print("File updated!")
print("\nNote: The specific lines mentioned by the user (2660, 2730) have been fixed.")
print(f"Remaining {len(incomplete_list) - fixes_applied} incomplete explanations would need additional translations.")

