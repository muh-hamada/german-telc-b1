#!/usr/bin/env python3
import json
import sys

# Dictionary of manual translations for all incomplete items
# These are accurate translations based on the existing pattern in the file
TRANSLATIONS = {
    # Lines 2712-2716
    "Negative adverbs at the start of a sentence require inversion, similar to a question form: Auxiliary ('have') + Subject ('I') + Main Verb ('seen').": {
        "Fr": "Les adverbes négatifs au début de la phrase nécessitent l'inversion, similaire à la forme interrogative : Auxiliaire ('have') + Sujet ('I') + Verbe principal ('seen').",
        "ru": "Отрицательные наречия в начале предложения требуют инверсии, подобно вопросительной форме: вспомогательный глагол ('have') + подлежащее ('I') + основной глагол ('seen').",
        "es": "Los adverbios negativos al comienzo de la oración requieren inversión, similar a la forma interrogativa: Auxiliar ('have') + Sujeto ('I') + Verbo principal ('seen')."
    },
    # Lines 2721-2725
    "Incorrect. This is standard word order and fails the rule for mandatory inversion.": {
        "Fr": "Incorrect. Ceci est l'ordre des mots standard et ne respecte pas la règle d'inversion obligatoire.",
        "ru": "Неверно. Это стандартный порядок слов, который не соответствует правилу обязательной инверсии.",
        "es": "Incorrecto. Este es el orden de palabras estándar y no cumple con la regla de inversión obligatoria."
    },
    # Lines 2730-2734
    "Wrong tense. The sentence refers to a life experience (Present Perfect).": {
        "Fr": "Mauvais temps. La phrase fait référence à une expérience de vie (Présent Parfait).",
        "ru": "Неправильное время. Предложение относится к жизненному опыту (Present Perfect).",
        "es": "Tiempo verbal incorrecto. La frase se refiere a una experiencia de vida (Presente Perfecto)."
    },
    # Lines 2769-2774
    "After 'Hardly' at the start of the sentence, inversion follows (had + subject + V3).": {
        "ru": "После 'Hardly' в начале предложения следует инверсия (had + подлежащее + V3).",
        "es": "Después de 'Hardly' al comienzo de la oración, sigue la inversión (had + sujeto + V3)."
    },
    # Lines 2788-2792
    "Incorrect. No inversion is allowed (no auxiliary or modal to invert).": {
        "Fr": "Incorrect. Aucune inversion n'est autorisée (pas d'auxiliaire ou de modal à inverser).",
        "ru": "Неверно. Инверсия не разрешена (нет вспомогательного или модального глагола для инверсии).",
        "es": "Incorrecto. No se permite inversión (no hay auxiliar o modal para invertir)."
    },
    # Lines 2827-2831
    "Incorrect. This is a normal statement (Hardly + normal word order = weak emphasis).": {
        "Fr": "Incorrect. Ceci est une déclaration normale (Hardly + ordre normal des mots = faible emphase).",
        "ru": "Неверно. Это обычное утверждение (Hardly + обычный порядок слов = слабое выделение).",
        "es": "Incorrecto. Esta es una declaración normal (Hardly + orden normal de palabras = énfasis débil)."
    },
    # Lines 2845-2849
    "Incorrect. 'After' is not a negative adverbial; it does not trigger inversion.": {
        "Fr": "Incorrect. 'After' n'est pas un adverbe négatif ; il ne déclenche pas d'inversion.",
        "ru": "Неверно. 'After' не является отрицательным наречием; оно не вызывает инверсию.",
        "es": "Incorrecto. 'After' no es un adverbio negativo; no desencadena inversión."
    },
    # Lines 2884-2889
    "'When' introduces a relative clause about time, so it takes inversion just like in a question.": {
        "ru": "'When' вводит относительное придаточное предложение о времени, поэтому требует инверсии, как в вопросе.",
        "es": "'When' introduce una cláusula relativa sobre el tiempo, por lo que toma inversión al igual que en una pregunta."
    },
    # Lines 2903-2907
    "Incorrect. The meaning would be wrong (the ringing happened first, then sitting down).": {
        "Fr": "Incorrect. Le sens serait incorrect (la sonnerie s'est produite en premier, puis l'assise).",
        "ru": "Неверно. Смысл был бы неправильным (звонок произошел первым, затем присаживание).",
        "es": "Incorrecto. El significado sería incorrecto (el timbre sonó primero, luego sentarse)."
    },
    # Lines 2960-2964
    "Incorrect. No inversion; the word order is normal.": {
        "Fr": "Incorrect. Pas d'inversion ; l'ordre des mots est normal.",
        "ru": "Неверно. Нет инверсии; порядок слов обычный.",
        "es": "Incorrecto. Sin inversión; el orden de palabras es normal."
    },
    # More translations needed - this is a sample
    # For the remaining 70+ items, I'll add common patterns
}

# Read incomplete explanations
with open('/Users/mham/projects/german-telc-b1/incomplete_explanations.json', 'r', encoding='utf-8') as f:
    incomplete_list = json.load(f)

# Read the JSON file properly
with open('/Users/mham/projects/german-telc-b1/app/admin-dashboard/src/data/english-b1/grammer-study-questions.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

print(f"Processing {len(incomplete_list)} incomplete explanations...")
print(f"Starting translations...\n")

fixed_count = 0
not_found_count = 0

# Process each incomplete item
for item in incomplete_list:
    en_text = item['translations'].get('en', '')
    missing_langs = item['missing']
    
    if not en_text or en_text not in TRANSLATIONS:
        not_found_count += 1
        continue
    
    # Find this explanation in the data structure
    # We need to locate it by matching the English text
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
                    # Found it! Add missing translations
                    for lang in missing_langs:
                        if lang in TRANSLATIONS[en_text]:
                            option['explanation'][lang] = TRANSLATIONS[en_text][lang]
                    found = True
                    fixed_count += 1
                    print(f"✓ Fixed: Added {', '.join(missing_langs)} for: {en_text[:50]}...")
                    break
            if found:
                break
        if found:
            break

print(f"\n{'='*60}")
print(f"Summary:")
print(f"  Fixed with manual translations: {fixed_count}")
print(f"  Not found in translation dictionary: {not_found_count}")
print(f"{'='*60}\n")

# Write the updated JSON back
with open('/Users/mham/projects/german-telc-b1/app/admin-dashboard/src/data/english-b1/grammer-study-questions.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=2, ensure_ascii=False)

print("File updated successfully!")
print("\nNote: This script only handles entries with manual translations.")
print(f"You still need to translate {not_found_count} more entries.")

