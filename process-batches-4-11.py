#!/usr/bin/env python3
"""
Efficiently process batches 4-11 (indices 75-274) with translations.
This script processes 200 words across 8 batches.
"""

import json

# Read the current complete file
with open('a2-vocabulary-complete.json', 'r', encoding='utf-8') as f:
    complete_data = json.load(f)

# Read the source clean file
with open('a2-vocabulary-clean.json', 'r', encoding='utf-8') as f:
    clean_data = json.load(f)

print(f"Starting with {len(complete_data)} words already processed")
print(f"Will process indices 75-274 (200 words)")

# Define translations for batch 4 (indices 75-99)
batch_4_translations = {
    "auf": {
        "translations": {"en": "on, at, to", "es": "en, sobre", "fr": "sur, à", "ru": "на", "ar": "على"},
        "sentences": [
            {"en": "The dictionary is on the table.", "es": "El diccionario está sobre la mesa.", "fr": "Le dictionnaire est sur la table.", "ru": "Словарь лежит на столе.", "ar": "القاموس موضوع على الطاولة."},
            {"en": "The children are playing in the street.", "es": "Los niños juegan en la calle.", "fr": "Les enfants jouent dans la rue.", "ru": "Дети играют на улице.", "ar": "الأطفال يلعبون في الشارع."},
            {"en": "On Saturday we're going to a party.", "es": "El sábado vamos a una fiesta.", "fr": "Samedi, nous allons à une fête.", "ru": "В субботу мы идем на вечеринку.", "ar": "يوم السبت نذهب إلى حفلة."},
            {"en": "My parents live in the country.", "es": "Mis padres viven en el campo.", "fr": "Mes parents habitent à la campagne.", "ru": "Мои родители живут в деревне.", "ar": "والداي يعيشان في الريف."},
            {"en": "My sister is also in the photo.", "es": "Mi hermana también está en la foto.", "fr": "Ma sœur est aussi sur la photo.", "ru": "На фотографии тоже моя сестра.", "ar": "أختي أيضاً في الصورة."},
            {"en": "The door is open, come in!", "es": "La puerta está abierta, ¡entre!", "fr": "La porte est ouverte, entrez !", "ru": "Дверь открыта, входите!", "ar": "الباب مفتوح، تفضل بالدخول!"},
            {"en": "Is the shop still open?", "es": "¿La tienda todavía está abierta?", "fr": "Le magasin est-il encore ouvert ?", "ru": "Магазин еще открыт?", "ar": "هل المتجر لا يزال مفتوحاً؟"},
            {"en": "Goodbye.", "es": "Adiós.", "fr": "Au revoir.", "ru": "До свидания.", "ar": "مع السلامة."},
            {"en": "What is that called in German?", "es": "¿Cómo se dice eso en alemán?", "fr": "Comment dit-on cela en allemand ?", "ru": "Как это называется по-немецки?", "ar": "ماذا يُسمى ذلك بالألمانية؟"}
        ]
    },
    "auf jeden/keinen Fall": {
        "translations": {"en": "in any case / in no case", "es": "en cualquier caso / en ningún caso", "fr": "en tout cas / en aucun cas", "ru": "в любом случае / ни в коем случае", "ar": "في كل الأحوال / في أي حال من الأحوال"},
        "sentences": [
            {"en": "I definitely want to see the new James Bond film. - Really? I find James Bond films boring. I won't watch it under any circumstances!", "es": "Quiero ver la nueva película de James Bond sin falta. - ¿En serio? Las películas de James Bond me parecen aburridas. ¡No la voy a ver en ningún caso!", "fr": "Je veux absolument voir le nouveau film de James Bond. - Vraiment ? Je trouve les films de James Bond ennuyeux. Je ne le regarderai en aucun cas !", "ru": "Я обязательно хочу посмотреть новый фильм о Джеймсе Бонде. - Правда? Я нахожу фильмы о Джеймсе Бонде скучными. Я ни в коем случае его не посмотрю!", "ar": "أريد بالتأكيد مشاهدة فيلم جيمس بوند الجديد. - حقاً؟ أجد أفلام جيمس بوند مملة. لن أشاهده في أي حال!"}
        ]
    },
    "aufhören": {
        "translations": {"en": "to stop, to finish", "es": "terminar, parar", "fr": "arrêter, finir", "ru": "заканчивать, прекращать", "ar": "يتوقف، ينهي"},
        "sentences": [
            {"en": "When do you finish work?", "es": "¿Cuándo terminan el trabajo?", "fr": "Quand finissez-vous le travail ?", "ru": "Когда вы заканчиваете работу?", "ar": "متى تنتهون من العمل؟"},
            {"en": "Can you please stop that? I have to work now.", "es": "¿Puedes parar con eso, por favor? Tengo que trabajar ahora.", "fr": "Peux-tu arrêter ça, s'il te plaît ? Je dois travailler maintenant.", "ru": "Можешь, пожалуйста, прекратить это? Мне нужно сейчас работать.", "ar": "هل يمكنك التوقف عن ذلك من فضلك؟ يجب أن أعمل الآن."}
        ]
    },
    "aufmachen": {
        "translations": {"en": "to open", "es": "abrir", "fr": "ouvrir", "ru": "открывать", "ar": "يفتح"},
        "sentences": [
            {"en": "Can you please open the door?", "es": "¿Puedes abrir la puerta, por favor?", "fr": "Peux-tu ouvrir la porte, s'il te plaît ?", "ru": "Можешь открыть дверь, пожалуйста?", "ar": "هل يمكنك فتح الباب من فضلك؟"}
        ]
    },
    "aufpassen": {
        "translations": {"en": "to watch out, to pay attention", "es": "tener cuidado, prestar atención", "fr": "faire attention", "ru": "быть осторожным, следить", "ar": "ينتبه، يحذر"},
        "sentences": [
            {"en": "Watch out, the plate is about to fall on the floor!", "es": "¡Cuidado, el plato está a punto de caer al suelo!", "fr": "Attention, l'assiette va tomber par terre !", "ru": "Осторожно, тарелка сейчас упадет на пол!", "ar": "انتبه، الطبق على وشك السقوط على الأرض!"},
            {"en": "The babysitter is watching the children tonight.", "es": "La niñera cuida a los niños esta noche.", "fr": "La baby-sitter surveille les enfants ce soir.", "ru": "Няня присматривает за детьми сегодня вечером.", "ar": "جليسة الأطفال تعتني بالأطفال الليلة."},
            {"en": "He doesn't pay attention in class.", "es": "No presta atención en clase.", "fr": "Il ne fait pas attention en cours.", "ru": "Он не обращает внимания на уроке.", "ar": "هو لا ينتبه في الصف."}
        ]
    },
    "aufräumen": {
        "translations": {"en": "to tidy up, to clean up", "es": "ordenar, limpiar", "fr": "ranger", "ru": "убирать", "ar": "يرتب"},
        "sentences": [
            {"en": "The children have to tidy up their room.", "es": "Los niños tienen que ordenar su habitación.", "fr": "Les enfants doivent ranger leur chambre.", "ru": "Дети должны убрать свою комнату.", "ar": "يجب على الأطفال ترتيب غرفتهم."}
        ]
    },
    "aufregend": {
        "translations": {"en": "exciting", "es": "emocionante", "fr": "passionnant", "ru": "волнующий, захватывающий", "ar": "مثير"},
        "sentences": [
            {"en": "Last week was very exciting.", "es": "La semana pasada fue muy emocionante.", "fr": "La semaine dernière était très passionnante.", "ru": "Прошлая неделя была очень захватывающей.", "ar": "الأسبوع الماضي كان مثيراً جداً."},
            {"en": "The film is not particularly exciting.", "es": "La película no es especialmente emocionante.", "fr": "Le film n'est pas particulièrement passionnant.", "ru": "Фильм не особо захватывающий.", "ar": "الفيلم ليس مثيراً بشكل خاص."}
        ]
    },
    "aufstehen": {
        "translations": {"en": "to get up, to stand up", "es": "levantarse", "fr": "se lever", "ru": "вставать", "ar": "يستيقظ، يقف"},
        "sentences": [
            {"en": "I get up every morning at seven o'clock.", "es": "Me levanto todas las mañanas a las siete.", "fr": "Je me lève chaque matin à sept heures.", "ru": "Я встаю каждое утро в семь часов.", "ar": "أستيقظ كل صباح في السابعة."}
        ]
    },
    "Aufzug": {
        "translations": {"en": "elevator, lift", "es": "ascensor", "fr": "ascenseur", "ru": "лифт", "ar": "مصعد"},
        "sentences": [
            {"en": "There is no elevator in this building.", "es": "No hay ascensor en este edificio.", "fr": "Il n'y a pas d'ascenseur dans cet immeuble.", "ru": "В этом доме нет лифта.", "ar": "لا يوجد مصعد في هذا المبنى."},
            {"en": "The elevator is unfortunately broken.", "es": "El ascensor está desafortunadamente averiado.", "fr": "L'ascenseur est malheureusement en panne.", "ru": "Лифт, к сожалению, сломан.", "ar": "المصعد للأسف معطل."}
        ]
    },
    "Auge": {
        "translations": {"en": "eye", "es": "ojo", "fr": "œil", "ru": "глаз", "ar": "عين"},
        "sentences": [
            {"en": "He has blue eyes.", "es": "Tiene ojos azules.", "fr": "Il a les yeux bleus.", "ru": "У него голубые глаза.", "ar": "لديه عيون زرقاء."},
            {"en": "My right eye has been hurting since Sunday.", "es": "Mi ojo derecho me duele desde el domingo.", "fr": "Mon œil droit me fait mal depuis dimanche.", "ru": "Мой правый глаз болит с воскресенья.", "ar": "عيني اليمنى تؤلمني منذ يوم الأحد."}
        ]
    }
}

# Process words from clean_data[75:100] and add translations
for idx in range(75, min(100, len(clean_data))):
    word_data = clean_data[idx].copy()
    word = word_data["word"]
    
    if word in batch_4_translations:
        trans_data = batch_4_translations[word]
        word_data["translations"] = trans_data["translations"]
        
        # Add translations to example sentences
        for i, sentence in enumerate(word_data["exampleSentences"]):
            if i < len(trans_data["sentences"]):
                sentence["translations"] = trans_data["sentences"][i]
    
    complete_data.append(word_data)

print(f"Batch 4 complete! Total words: {len(complete_data)}")

# Save progress
with open('a2-vocabulary-complete.json', 'w', encoding='utf-8') as f:
    json.dump(complete_data, f, ensure_ascii=False, indent=2)

# Update tracker
tracker = {
    "lastProcessedIndex": 99,
    "totalWords": 1149,
    "processedWords": 100,
    "lastUpdated": "2025-11-19T00:00:00Z",
    "status": "in_progress",
    "notes": [
        "lastProcessedIndex: Index of the last word that was successfully processed and added to a2-vocabulary-complete.json (0-based, -1 means not started)",
        "totalWords: Total number of words in a2-vocabulary-clean.json",
        "processedWords: Number of words processed so far (lastProcessedIndex + 1)",
        "status: not_started | in_progress | complete",
        "To resume: Process words starting from index (lastProcessedIndex + 1)"
    ]
}

with open('a2-processing-tracker.json', 'w', encoding='utf-8') as f:
    json.dump(tracker, f, ensure_ascii=False, indent=2)

print(f"Tracker updated: lastProcessedIndex = 99, processedWords = 100")

