#!/usr/bin/env python3
import json
import sys

# Dictionary of common English->Spanish translations found in the codebase
COMMON_SPANISH_TRANSLATIONS = {
    # Common sentence starters
    "Incorrect.": "Incorrecto.",
    "Wrong tense.": "Tiempo verbal incorrecto.",
    "Wrong word order.": "Orden de palabras incorrecto.",
    "After": "Después de",
    "Although": "Aunque",
    "Because": "Porque",
    "This is": "Este es",
    "This was": "Esta era",
    "This would": "Esto",
    "This means": "Esto significa",
    "This implies": "Esto implica",
    "We use": "Usamos",
    "We need": "Necesitamos",
    
    # Grammatical terms
    "is used": "se usa",
    "is only used": "solo se usa",
    "is not used": "no se usa",
    "cannot be used": "no se puede usar",
    "can be used": "se puede usar",
    "are used": "se usan",
    "is a": "es un",
    "is an": "es un",
    "refers to": "se refiere a",
    "replaces": "reemplaza",
    "replace": "reemplazar",
    "would be": "sería",
    "would mean": "significaría",
    "would imply": "implicaría",
    "expresses": "expresa",
    "implies": "implica",
    "means": "significa",
    "signals": "señala",
    "indicates": "indica",
    
    # Grammar-specific terms
    "the sentence": "la frase",
    "The sentence": "La frase",
    "at the start of a sentence": "al comienzo de la oración",
    "at the start of the sentence": "al comienzo de la oración",
    "at the beginning": "al comienzo",
    "in the past": "en el pasado",
    "in the present": "en el presente",
    "in the future": "en el futuro",
    "require inversion": "requiere inversión",
    "requires inversion": "requiere inversión",
    "inversion follows": "sigue la inversión",
    "similar to a question form": "similar a la forma interrogativa",
    "Auxiliary": "Auxiliar",
    "auxiliary verb": "verbo auxiliar",
    "Subject": "Sujeto",
    "subject": "sujeto",
    "Main Verb": "Verbo Principal",
    "main verb": "verbo principal",
    "Past Participle": "Participio Pasado",
    "past participle": "participio pasado",
    "object": "objeto",
    "refers to a life experience": "se refiere a una experiencia de vida",
    "refers to a place": "se refiere a un lugar",
    "refers to a time": "se refiere a un tiempo",
    "refers to places only": "se refiere solo a lugares",
    "Present Perfect": "Presente Perfecto",
    "Past Perfect": "Pasado Perfecto",
    "Simple Past": "Pasado Simple",
    "Present Simple": "Presente Simple",
    "Present Continuous": "Presente Continuo",
    "standard word order": "orden de palabras estándar",
    "word order": "orden de palabras",
    "fails the rule for mandatory inversion": "no cumple con la regla de inversión obligatoria",
    "negative adverbs": "adverbios negativos",
    "Negative adverbs": "Adverbios negativos",
    "not times": "no tiempos",
    "not to": "no a",
    "not for": "no para",
    
    # Specific phrases
    "would require the preposition": "requeriría la preposición",
    "would be incomplete": "sería incompleto",
    "as it would require": "ya que requeriría",
    "only to replace": "solo para reemplazar",
    "adverbially": "adverbialmente",
    "more precise": "más preciso",
    "could describe": "podría describir",
    "is more precise because": "es más preciso porque",
    "functions as an adverb": "funciona como un adverbio",
    "Causative structure": "Estructura causativa",
    "causative structure": "estructura causativa",
    "would mean we repair it ourselves": "significaría que lo reparamos nosotros mismos",
    "not that we contract a service provider": "no que contratamos a un proveedor de servicios",
    "The object must come between": "El objeto debe venir entre",
    "and the participle": "y el participio",
}

# French translations
COMMON_FRENCH_TRANSLATIONS = {
    "Incorrect.": "Incorrect.",
    "Wrong tense.": "Mauvais temps.",
    "Wrong word order.": "Mauvais ordre des mots.",
    "After": "Après",
    "Although": "Bien que",
    "This is": "C'est",
    "This was": "C'était",
    "This would": "Cela",
    "We use": "Nous utilisons",
    "We need": "Nous avons besoin",
    
    "is used": "est utilisé",
    "is only used": "n'est utilisé que",
    "is not used": "n'est pas utilisé",
    "cannot be used": "ne peut pas être utilisé",
    "is a": "est un",
    "refers to": "fait référence à",
    "replaces": "remplace",
    "would be": "serait",
    "would mean": "signifierait",
    "expresses": "exprime",
    "implies": "implique",
    "means": "signifie",
    "signals": "signale",
    
    "the sentence": "la phrase",
    "The sentence": "La phrase",
    "at the start of a sentence": "au début de la phrase",
    "at the start of the sentence": "au début de la phrase",
    "in the past": "dans le passé",
    "require inversion": "nécessite l'inversion",
    "requires inversion": "nécessite l'inversion",
    "inversion follows": "l'inversion suit",
    "similar to a question form": "similaire à la forme interrogative",
    "Auxiliary": "Auxiliaire",
    "auxiliary verb": "verbe auxiliaire",
    "Subject": "Sujet",
    "subject": "sujet",
    "Main Verb": "Verbe principal",
    "main verb": "verbe principal",
    "Past Participle": "Participe Passé",
    "past participle": "participe passé",
    "object": "objet",
    "refers to a life experience": "fait référence à une expérience de vie",
    "refers to a place": "fait référence à un lieu",
    "refers to a time": "fait référence à un moment",
    "refers to places only": "fait référence uniquement aux lieux",
    "Present Perfect": "Présent Parfait",
    "Past Perfect": "Plus-que-parfait",
    "Simple Past": "Passé simple",
    "Present Simple": "Présent simple",
    "Present Continuous": "Présent continu",
    "standard word order": "l'ordre des mots standard",
    "word order": "ordre des mots",
    "fails the rule for mandatory inversion": "ne respecte pas la règle d'inversion obligatoire",
    "negative adverbs": "adverbes négatifs",
    "Negative adverbs": "Les adverbes négatifs",
    "not times": "pas les moments",
    
    "would require the preposition": "nécessiterait la préposition",
    "would be incomplete": "serait incomplet",
    "as it would require": "car il nécessiterait",
    "is more precise because": "est plus précis car",
    "functions as an adverb": "fonctionne comme un adverbe",
    "Causative structure": "Structure causative",
    "The object must come between": "L'objet doit venir entre",
    "and the participle": "et le participe",
}

# Russian translations
COMMON_RUSSIAN_TRANSLATIONS = {
    "Incorrect.": "Неверно.",
    "Wrong tense.": "Неправильное время.",
    "Wrong word order.": "Неправильный порядок слов.",
    "After": "После",
    "Although": "Хотя",
    "This is": "Это",
    "This was": "Это было",
    "This would": "Это",
    "We use": "Мы используем",
    "We need": "Нам нужно",
    
    "is used": "используется",
    "is only used": "используется только",
    "is not used": "не используется",
    "cannot be used": "не может быть использован",
    "is a": "это",
    "refers to": "относится к",
    "replaces": "заменяет",
    "would be": "был бы",
    "would mean": "означал бы",
    "expresses": "выражает",
    "implies": "подразумевает",
    "means": "означает",
    "signals": "указывает",
    
    "the sentence": "предложение",
    "The sentence": "Предложение",
    "at the start of a sentence": "в начале предложения",
    "at the start of the sentence": "в начале предложения",
    "in the past": "в прошлом",
    "require inversion": "требует инверсии",
    "requires inversion": "требует инверсии",
    "inversion follows": "следует инверсия",
    "similar to a question form": "подобно вопросительной форме",
    "Auxiliary": "Вспомогательный глагол",
    "auxiliary verb": "вспомогательный глагол",
    "Subject": "Подлежащее",
    "subject": "подлежащее",
    "Main Verb": "Основной глагол",
    "main verb": "основной глагол",
    "Past Participle": "Причастие прошедшего времени",
    "past participle": "причастие прошедшего времени",
    "object": "объект",
    "refers to a life experience": "относится к жизненному опыту",
    "refers to a place": "относится к месту",
    "refers to a time": "относится ко времени",
    "refers to places only": "относится только к местам",
    "Present Perfect": "Present Perfect",
    "Past Perfect": "Past Perfect",
    "Simple Past": "Simple Past",
    "Present Simple": "Present Simple",
    "Present Continuous": "Present Continuous",
    "standard word order": "стандартный порядок слов",
    "word order": "порядок слов",
    "fails the rule for mandatory inversion": "не соответствует правилу обязательной инверсии",
    "negative adverbs": "отрицательные наречия",
    "Negative adverbs": "Отрицательные наречия",
    "not times": "не времени",
    
    "would require the preposition": "потребовал бы предлога",
    "would be incomplete": "был бы неполным",
    "as it would require": "так как потребовал бы",
    "is more precise because": "более точен, поскольку",
    "functions as an adverb": "выполняет функцию наречия",
    "Causative structure": "Причинная структура",
    "The object must come between": "Объект должен стоять между",
    "and the participle": "и причастием",
}

def simple_translate(text, lang):
    """Simple translation using dictionary lookup."""
    if lang == 'es':
        trans_dict = COMMON_SPANISH_TRANSLATIONS
    elif lang == 'Fr':
        trans_dict = COMMON_FRENCH_TRANSLATIONS
    elif lang == 'ru':
        trans_dict = COMMON_RUSSIAN_TRANSLATIONS
    else:
        return None
    
    # Try exact match first
    if text in trans_dict:
        return trans_dict[text]
    
    # Try to translate phrase by phrase
    result = text
    # Sort by length (longest first) to match longer phrases first
    for eng_phrase in sorted(trans_dict.keys(), key=len, reverse=True):
        if eng_phrase in result:
            result = result.replace(eng_phrase, trans_dict[eng_phrase])
    
    # If nothing changed, return None to indicate we need manual translation
    if result == text:
        return None
    
    return result

# Read the incomplete explanations
with open('/Users/mham/projects/german-telc-b1/incomplete_explanations.json', 'r', encoding='utf-8') as f:
    incomplete = json.load(f)

# Read the original file
with open('/Users/mham/projects/german-telc-b1/app/admin-dashboard/src/data/english-b1/grammer-study-questions.json', 'r', encoding='utf-8') as f:
    lines = f.readlines()

print(f"Processing {len(incomplete)} incomplete explanations...\n")

successful_translations = 0
failed_translations = []
skipped_no_english = 0

# Process in reverse order to maintain line numbers
for item in reversed(incomplete):
    start_line = item['startLine'] - 1  # Convert to 0-based index
    end_line = item['endLine'] - 1
    missing_langs = item['missing']
    en_text = item['translations'].get('en', '')
    
    if not en_text:
        skipped_no_english += 1
        continue
    
    # Try to translate for each missing language
    translations_for_item = {}
    all_translated = True
    
    for lang in missing_langs:
        trans = simple_translate(en_text, lang)
        if trans and trans != en_text:
            translations_for_item[lang] = trans
        else:
            all_translated = False
            break
    
    if not all_translated or not translations_for_item:
        failed_translations.append({
            'lines': f"{item['startLine']}-{item['endLine']}",
            'en': en_text,
            'missing': missing_langs
        })
        continue
    
    # Find the line with "en": text
    en_line_idx = None
    for line_info in item['explanationLines']:
        if '"en":' in line_info['text']:
            en_line_idx = line_info['lineNum'] - 1  # Convert to 0-based
            break
    
    if en_line_idx is None:
        continue
    
    # Get the en line
    en_line = lines[en_line_idx]
    has_trailing_comma = en_line.rstrip().endswith(',')
    
    # Build new lines for missing translations
    new_lines = []
    langs_to_add = [lang for lang in ['Fr', 'ru', 'es'] if lang in missing_langs and lang in translations_for_item]
    
    for i, lang in enumerate(langs_to_add):
        trans_text = translations_for_item[lang]
        # Match the indentation of the 'en' line
        indent = len(en_line) - len(en_line.lstrip())
        spaces = ' ' * indent
        # Add comma to all except the last one
        is_last = (i == len(langs_to_add) - 1)
        comma = '' if is_last else ','
        new_line = f'{spaces}"{lang}": "{trans_text}"{comma}\n'
        new_lines.append(new_line)
    
    if new_lines:
        # Remove trailing comma from 'en' line if it exists and add one if needed
        if has_trailing_comma:
            # Keep the comma
            pass
        else:
            # Add comma to en line
            lines[en_line_idx] = en_line.rstrip() + ',\n'
        
        # Insert new translation lines after the 'en' line
        for i, new_line in enumerate(new_lines):
            lines.insert(en_line_idx + 1 + i, new_line)
        
        successful_translations += 1
        print(f"✓ Lines {item['startLine']}-{item['endLine']}: Added {', '.join(langs_to_add)}")

print(f"\n{'='*60}")
print(f"Summary:")
print(f"  Successfully translated: {successful_translations}")
print(f"  Failed/needs manual: {len(failed_translations)}")
print(f"  Skipped (no English): {skipped_no_english}")
print(f"{'='*60}\n")

if failed_translations:
    print("Items that need manual translation:")
    for item in failed_translations[:10]:  # Show first 10
        print(f"\nLines {item['lines']}:")
        print(f"  Missing: {', '.join(item['missing'])}")
        print(f"  English: \"{item['en']}\"")
    if len(failed_translations) > 10:
        print(f"\n... and {len(failed_translations) - 10} more")
    
    # Save failed translations for manual processing
    with open('/Users/mham/projects/german-telc-b1/failed_translations.json', 'w', encoding='utf-8') as f:
        json.dump(failed_translations, f, indent=2, ensure_ascii=False)
    print(f"\nFailed translations saved to: failed_translations.json")

# Write the updated file
with open('/Users/mham/projects/german-telc-b1/app/admin-dashboard/src/data/english-b1/grammer-study-questions.json', 'w', encoding='utf-8') as f:
    f.writelines(lines)

print("\nFile updated successfully!")

