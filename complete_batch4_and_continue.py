#!/usr/bin/env python3
"""Complete batch 4 and process batches 5-11"""

import json

# Load files
with open('a2-vocabulary-complete.json', 'r', encoding='utf-8') as f:
    complete_data = json.load(f)

# Translations for the remaining 15 words of batch 4
remaining_translations = {
    "beenden": {
        "trans": {"en": "to finish, to end", "es": "terminar, finalizar", "fr": "terminer, finir", "ru": "заканчивать", "ar": "ينهي"},
        "sent": [{"en": "You must definitely finish your training.", "es": "Debes terminar tu formación sin falta.", "fr": "Tu dois absolument finir ta formation.", "ru": "Ты обязательно должен закончить обучение.", "ar": "يجب أن تنهي تدريبك بالتأكيد."}]
    },
    "beginnen": {
        "trans": {"en": "to begin, to start", "es": "comenzar, empezar", "fr": "commencer", "ru": "начинать", "ar": "يبدأ"},
        "sent": [{"en": "When does the course begin?", "es": "¿Cuándo comienza el curso?", "fr": "Quand le cours commence-t-il ?", "ru": "Когда начинается курс?", "ar": "متى تبدأ الدورة؟"}]
    },
    "begründen": {
        "trans": {"en": "to justify, to give reasons", "es": "justificar, fundamentar", "fr": "justifier, motiver", "ru": "обосновывать", "ar": "يبرر"},
        "sent": [{"en": "Can you explain that?", "es": "¿Puedes explicar eso?", "fr": "Pouvez-vous expliquer cela ?", "ru": "Можешь это объяснить?", "ar": "هل يمكنك تفسير ذلك؟"}]
    },
    "bei": {
        "trans": {"en": "at, by, with", "es": "en, con, cerca de", "fr": "chez, à, près de", "ru": "у, при, около", "ar": "عند، لدى"},
        "sent": [
            {"en": "I live with my parents.", "es": "Vivo con mis padres.", "fr": "J'habite chez mes parents.", "ru": "Я живу у родителей.", "ar": "أعيش مع والدي."},
            {"en": "Hamburg is near the North Sea.", "es": "Hamburgo está cerca del Mar del Norte.", "fr": "Hambourg est près de la mer du Nord.", "ru": "Гамбург находится у Северного моря.", "ar": "هامبورغ بالقرب من بحر الشمال."}
        ]
    },
    "beide": {
        "trans": {"en": "both", "es": "ambos", "fr": "tous les deux", "ru": "оба", "ar": "كلاهما"},
        "sent": [
            {"en": "I like both.", "es": "Me gustan ambos.", "fr": "J'aime les deux.", "ru": "Мне нравятся оба.", "ar": "أحب كليهما."},
            {"en": "Both children are still small.", "es": "Ambos niños todavía son pequeños.", "fr": "Les deux enfants sont encore petits.", "ru": "Оба ребенка еще маленькие.", "ar": "كلا الطفلين لا يزالان صغيرين."}
        ]
    },
    "Bein": {
        "trans": {"en": "leg", "es": "pierna", "fr": "jambe", "ru": "нога", "ar": "ساق"},
        "sent": [{"en": "My leg hurts.", "es": "Me duele la pierna.", "fr": "Ma jambe me fait mal.", "ru": "У меня болит нога.", "ar": "ساقي تؤلمني."}]
    },
    "bekannt": {
        "trans": {"en": "known, well-known", "es": "conocido", "fr": "connu", "ru": "известный", "ar": "معروف"},
        "sent": [{"en": "The actor is very well-known.", "es": "El actor es muy conocido.", "fr": "L'acteur est très connu.", "ru": "Актер очень известен.", "ar": "الممثل معروف جداً."}]
    },
    "Bekannte": {
        "trans": {"en": "acquaintance", "es": "conocido/a", "fr": "connaissance", "ru": "знакомый/знакомая", "ar": "معارف"},
        "sent": [{"en": "A friend of mine told me that.", "es": "Un conocido mío me dijo eso.", "fr": "Une de mes connaissances m'a dit cela.", "ru": "Мой знакомый мне это сказал.", "ar": "أخبرني أحد معارفي بذلك."}]
    },
    "bekommen": {
        "trans": {"en": "to get, to receive", "es": "recibir, conseguir", "fr": "recevoir, obtenir", "ru": "получать", "ar": "يحصل، يتلقى"},
        "sent": [
            {"en": "What are you having? - A coffee, please.", "es": "¿Qué vas a tomar? - Un café, por favor.", "fr": "Qu'est-ce que vous prenez ? - Un café, s'il vous plaît.", "ru": "Что будете заказывать? - Кофе, пожалуйста.", "ar": "ماذا ستأخذ؟ - قهوة، من فضلك."},
            {"en": "I got a letter.", "es": "Recibí una carta.", "fr": "J'ai reçu une lettre.", "ru": "Я получил письмо.", "ar": "تلقيت رسالة."}
        ]
    },
    "beliebt": {
        "trans": {"en": "popular", "es": "popular", "fr": "populaire, apprécié", "ru": "популярный", "ar": "محبوب"},
        "sent": [{"en": "This song is very popular.", "es": "Esta canción es muy popular.", "fr": "Cette chanson est très populaire.", "ru": "Эта песня очень популярна.", "ar": "هذه الأغنية محبوبة جداً."}]
    },
    "benutzen": {
        "trans": {"en": "to use", "es": "usar, utilizar", "fr": "utiliser", "ru": "использовать", "ar": "يستخدم"},
        "sent": [{"en": "May I use your phone?", "es": "¿Puedo usar tu teléfono?", "fr": "Puis-je utiliser votre téléphone ?", "ru": "Могу я воспользоваться вашим телефоном?", "ar": "هل يمكنني استخدام هاتفك؟"}]
    },
    "bequem": {
        "trans": {"en": "comfortable", "es": "cómodo", "fr": "confortable", "ru": "удобный", "ar": "مريح"},
        "sent": [
            {"en": "I'm looking for comfortable shoes.", "es": "Busco zapatos cómodos.", "fr": "Je cherche des chaussures confortables.", "ru": "Я ищу удобную обувь.", "ar": "أبحث عن أحذية مريحة."},
            {"en": "Sit down! Make yourself comfortable!", "es": "¡Siéntate! ¡Ponte cómodo!", "fr": "Asseyez-vous ! Mettez-vous à l'aise !", "ru": "Садитесь! Устраивайтесь поудобнее!", "ar": "اجلس! اجعل نفسك مرتاحاً!"}
        ]
    },
    "beraten": {
        "trans": {"en": "to advise, to counsel", "es": "asesorar, aconsejar", "fr": "conseiller", "ru": "консультировать, советовать", "ar": "ينصح، يستشير"},
        "sent": [{"en": "I would like to get some advice.", "es": "Me gustaría recibir asesoramiento.", "fr": "Je voudrais obtenir des conseils.", "ru": "Я хотел бы получить консультацию.", "ar": "أود الحصول على بعض النصائح."}]
    },
    "Berg": {
        "trans": {"en": "mountain", "es": "montaña", "fr": "montagne", "ru": "гора", "ar": "جبل"},
        "sent": [
            {"en": "We went up a high mountain.", "es": "Subimos a una montaña alta.", "fr": "Nous avons gravi une haute montagne.", "ru": "Мы поднялись на высокую гору.", "ar": "صعدنا جبلاً عالياً."},
            {"en": "In the mountains there is still a lot of snow.", "es": "En las montañas todavía hay mucha nieve.", "fr": "Il y a encore beaucoup de neige dans les montagnes.", "ru": "В горах еще много снега.", "ar": "لا يزال هناك الكثير من الثلج في الجبال."}
        ]
    },
    "berichten": {
        "trans": {"en": "to report", "es": "informar, reportar", "fr": "rapporter, informer", "ru": "сообщать, докладывать", "ar": "يُبلّغ، يُخبر"},
        "sent": [{"en": "All newspapers are reporting on the accident.", "es": "Todos los periódicos informan sobre el accidente.", "fr": "Tous les journaux rapportent l'accident.", "ru": "Все газеты сообщают о происшествии.", "ar": "جميع الصحف تُخبر عن الحادث."}]
    }
}

# Update words without translations
for word_obj in complete_data:
    word = word_obj["word"]
    if word in remaining_translations and "translations" not in word_obj:
        trans_data = remaining_translations[word]
        word_obj["translations"] = trans_data["trans"]
        for i, sent in enumerate(word_obj["exampleSentences"]):
            if i < len(trans_data["sent"]):
                sent["translations"] = trans_data["sent"][i]

print(f"Completed remaining words of batch 4")
print(f"Total words with translations: {len([w for w in complete_data if 'translations' in w])}")

# Save
with open('a2-vocabulary-complete.json', 'w', encoding='utf-8') as f:
    json.dump(complete_data, f, ensure_ascii=False, indent=2)

print("Batch 4 now complete!")

