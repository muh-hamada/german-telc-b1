#!/usr/bin/env python3
import json

with open('a2-vocabulary-complete.json', 'r', encoding='utf-8') as f:
    complete = json.load(f)

# Batch 12: indices 275-299 with comprehensive translations
batch_12 = [
    {
        "word": "erlauben",
        "article": "",
        "translations": {"en": "to allow, to permit", "es": "permitir", "fr": "permettre", "ru": "разрешать", "ar": "يسمح"},
        "type": "verb",
        "exampleSentences": [{
            "text": "Meine Kinder dürfen diesen Film sehen. Ich habe es ihnen erlaubt.",
            "translations": {"en": "My children are allowed to watch this film. I permitted them to.", "es": "Mis hijos pueden ver esta película. Se lo permití.", "fr": "Mes enfants peuvent regarder ce film. Je le leur ai permis.", "ru": "Мои дети могут смотреть этот фильм. Я им это разрешил.", "ar": "يُسمح لأطفالي بمشاهدة هذا الفيلم. سمحت لهم بذلك."}
        }]
    },
    {
        "word": "erlaubt sein",
        "article": "",
        "translations": {"en": "to be allowed", "es": "estar permitido", "fr": "être autorisé", "ru": "быть разрешенным", "ar": "يكون مسموحاً"},
        "type": "expression",
        "exampleSentences": [{
            "text": "Parken ist hier nicht erlaubt.",
            "translations": {"en": "Parking is not allowed here.", "es": "No está permitido estacionar aquí.", "fr": "Le stationnement n'est pas autorisé ici.", "ru": "Парковка здесь не разрешена.", "ar": "لا يُسمح بالوقوف هنا."}
        }]
    },
    {
        "word": "Erlaubnis",
        "article": "die",
        "translations": {"en": "permission", "es": "permiso", "fr": "autorisation", "ru": "разрешение", "ar": "إذن"},
        "type": "noun",
        "exampleSentences": [{
            "text": "Haben Sie eine Arbeitserlaubnis?",
            "translations": {"en": "Do you have a work permit?", "es": "¿Tiene permiso de trabajo?", "fr": "Avez-vous un permis de travail ?", "ru": "У вас есть разрешение на работу?", "ar": "هل لديك تصريح عمل؟"}
        }]
    },
    {
        "word": "Ermäßigung",
        "article": "die",
        "translations": {"en": "discount, reduction", "es": "descuento", "fr": "réduction", "ru": "скидка", "ar": "تخفيض"},
        "type": "noun",
        "exampleSentences": [{
            "text": "Für Schüler, Studenten und Rentner gibt es eine Ermäßigung.",
            "translations": {"en": "There is a discount for pupils, students and pensioners.", "es": "Hay descuento para alumnos, estudiantes y jubilados.", "fr": "Il y a une réduction pour les élèves, étudiants et retraités.", "ru": "Есть скидка для школьников, студентов и пенсионеров.", "ar": "هناك تخفيض للطلاب والمتقاعدين."}
        }]
    },
    {
        "word": "erreichen",
        "article": "",
        "translations": {"en": "to reach, to catch", "es": "alcanzar, llegar", "fr": "atteindre, joindre", "ru": "достигать, успеть", "ar": "يصل، يلحق"},
        "type": "verb",
        "exampleSentences": [
            {
                "text": "Wenn wir uns beeilen, erreichen wir noch den Zug um acht Uhr.",
                "translations": {"en": "If we hurry, we can still catch the eight o'clock train.", "es": "Si nos apuramos, todavía alcanzamos el tren de las ocho.", "fr": "Si nous nous dépêchons, nous pouvons encore attraper le train de huit heures.", "ru": "Если мы поторопимся, мы еще успеем на поезд в восемь часов.", "ar": "إذا أسرعنا، يمكننا اللحاق بقطار الثامنة."}
            },
            {
                "text": "Bis 18 Uhr können Sie mich im Büro erreichen.",
                "translations": {"en": "You can reach me at the office until 6 PM.", "es": "Me puede contactar en la oficina hasta las 18:00.", "fr": "Vous pouvez me joindre au bureau jusqu'à 18 heures.", "ru": "До 18 часов вы можете связаться со мной в офисе.", "ar": "يمكنك الوصول إلي في المكتب حتى السادسة مساءً."}
            }
        ]
    },
    {
        "word": "erst",
        "article": "",
        "translations": {"en": "only, not until", "es": "solo, no hasta", "fr": "seulement, pas avant", "ru": "только, лишь", "ar": "فقط، ليس قبل"},
        "type": "adverb",
        "exampleSentences": [
            {
                "text": "Wir können erst morgen kommen.",
                "translations": {"en": "We can only come tomorrow.", "es": "Solo podemos venir mañana.", "fr": "Nous ne pouvons venir que demain.", "ru": "Мы можем приехать только завтра.", "ar": "يمكننا القدوم غداً فقط."}
            },
            {
                "text": "Dina ist keine 18, sie ist erst 16 Jahre alt.",
                "translations": {"en": "Dina is not 18, she's only 16 years old.", "es": "Dina no tiene 18, solo tiene 16 años.", "fr": "Dina n'a pas 18 ans, elle n'a que 16 ans.", "ru": "Дине не 18, ей только 16 лет.", "ar": "دينا ليست 18، هي فقط 16 عاماً."}
            }
        ]
    },
    {
        "word": "Erwachsene",
        "article": "der",
        "translations": {"en": "adult", "es": "adulto", "fr": "adulte", "ru": "взрослый", "ar": "بالغ"},
        "type": "noun",
        "exampleSentences": [
            {
                "text": "Erwachsene zahlen zehn Euro, für Kinder ist der Eintritt frei.",
                "translations": {"en": "Adults pay ten euros, children enter for free.", "es": "Los adultos pagan diez euros, la entrada es gratis para niños.", "fr": "Les adultes paient dix euros, l'entrée est gratuite pour les enfants.", "ru": "Взрослые платят десять евро, детям вход бесплатный.", "ar": "يدفع البالغون عشرة يوروهات، الدخول مجاني للأطفال."}
            },
            {
                "text": "Dieser Film ist nur für Erwachsene.",
                "translations": {"en": "This film is only for adults.", "es": "Esta película es solo para adultos.", "fr": "Ce film est réservé aux adultes.", "ru": "Этот фильм только для взрослых.", "ar": "هذا الفيلم للبالغين فقط."}
            }
        ]
    },
    {
        "word": "erzählen",
        "article": "",
        "translations": {"en": "to tell, to narrate", "es": "contar", "fr": "raconter", "ru": "рассказывать", "ar": "يحكي"},
        "type": "verb",
        "exampleSentences": [
            {
                "text": "Wir müssen euch etwas erzählen!",
                "translations": {"en": "We have to tell you something!", "es": "¡Tenemos que contarles algo!", "fr": "Nous devons vous raconter quelque chose !", "ru": "Мы должны вам кое-что рассказать!", "ar": "يجب أن نخبركم شيئاً!"}
            },
            {
                "text": "Erzählst du mir eine Geschichte?",
                "translations": {"en": "Will you tell me a story?", "es": "¿Me cuentas una historia?", "fr": "Me racontes-tu une histoire ?", "ru": "Расскажешь мне историю?", "ar": "هل تحكي لي قصة؟"}
            }
        ]
    },
    {
        "word": "essen",
        "article": "",
        "translations": {"en": "to eat", "es": "comer", "fr": "manger", "ru": "есть", "ar": "يأكل"},
        "type": "verb",
        "exampleSentences": [{
            "text": "Was gibt es zu essen?",
            "translations": {"en": "What is there to eat?", "es": "¿Qué hay para comer?", "fr": "Qu'est-ce qu'il y a à manger ?", "ru": "Что есть поесть?", "ar": "ما الذي يوجد للأكل؟"}
        }]
    },
    {
        "word": "Essen",
        "article": "das",
        "translations": {"en": "food, meal", "es": "comida", "fr": "repas, nourriture", "ru": "еда", "ar": "طعام"},
        "type": "noun",
        "exampleSentences": [
            {
                "text": "Das Essen in der Cafeteria ist meistens ganz gut.",
                "translations": {"en": "The food in the cafeteria is usually quite good.", "es": "La comida en la cafetería suele ser bastante buena.", "fr": "La nourriture à la cafétéria est généralement assez bonne.", "ru": "Еда в кафетерии обычно довольно хорошая.", "ar": "الطعام في الكافتيريا عادةً جيد جداً."}
            },
            {
                "text": "Darf ich Sie zum Essen einladen?",
                "translations": {"en": "May I invite you to dinner?", "es": "¿Puedo invitarle a comer?", "fr": "Puis-je vous inviter à dîner ?", "ru": "Могу я пригласить вас поужинать?", "ar": "هل يمكنني دعوتك لتناول الطعام؟"}
            }
        ]
    },
    {
        "word": "etwas",
        "article": "",
        "translations": {"en": "something, somewhat", "es": "algo", "fr": "quelque chose", "ru": "что-то", "ar": "شيء ما"},
        "type": "pronoun/adverb",
        "exampleSentences": [
            {
                "text": "Ich muss dir etwas erzählen!",
                "translations": {"en": "I have to tell you something!", "es": "¡Tengo que contarte algo!", "fr": "Je dois te raconter quelque chose !", "ru": "Я должен тебе кое-что рассказать!", "ar": "يجب أن أخبرك شيئاً!"}
            },
            {
                "text": "Haben Sie etwas zum Schreiben?",
                "translations": {"en": "Do you have something to write with?", "es": "¿Tiene algo para escribir?", "fr": "Avez-vous quelque chose pour écrire ?", "ru": "У вас есть чем написать?", "ar": "هل لديك شيء للكتابة؟"}
            },
            {
                "text": "Ich habe leider nur Tee. Etwas anderes kann ich dir leider nicht anbieten.",
                "translations": {"en": "I only have tea, unfortunately. I can't offer you anything else.", "es": "Lamentablemente solo tengo té. No puedo ofrecerte nada más.", "fr": "Je n'ai malheureusement que du thé. Je ne peux rien vous offrir d'autre.", "ru": "У меня, к сожалению, только чай. Больше ничего не могу предложить.", "ar": "للأسف لدي فقط شاي. لا يمكنني أن أقدم لك شيئاً آخر."}
            }
        ]
    },
    {
        "word": "Fach",
        "article": "das",
        "translations": {"en": "subject, compartment", "es": "asignatura, compartimento", "fr": "matière, compartiment", "ru": "предмет, отделение", "ar": "مادة، حجرة"},
        "type": "noun",
        "exampleSentences": [{
            "text": "Welches Fach magst du in der Schule am liebsten?",
            "translations": {"en": "Which subject do you like best at school?", "es": "¿Qué asignatura te gusta más en la escuela?", "fr": "Quelle matière préfères-tu à l'école ?", "ru": "Какой предмет тебе больше всего нравится в школе?", "ar": "ما هي المادة التي تفضلها في المدرسة؟"}
        }]
    },
    {
        "word": "(ab)fahren",
        "article": "",
        "translations": {"en": "to drive, to depart", "es": "conducir, salir", "fr": "conduire, partir", "ru": "ехать, отправляться", "ar": "يقود، يغادر"},
        "type": "verb",
        "exampleSentences": [
            {
                "text": "Ich fahre mit dem Auto zur Arbeit.",
                "translations": {"en": "I drive to work by car.", "es": "Voy al trabajo en coche.", "fr": "Je vais au travail en voiture.", "ru": "Я езжу на работу на машине.", "ar": "أذهب إلى العمل بالسيارة."}
            },
            {
                "text": "Achtung an Gleis 17! Der Zug München - Paris fährt jetzt ab.",
                "translations": {"en": "Attention on platform 17! The Munich - Paris train is now departing.", "es": "¡Atención en la vía 17! El tren Múnich - París sale ahora.", "fr": "Attention sur la voie 17 ! Le train Munich - Paris part maintenant.", "ru": "Внимание на платформе 17! Поезд Мюнхен - Париж отправляется.", "ar": "انتباه على الرصيف 17! قطار ميونخ - باريس يغادر الآن."}
            }
        ]
    },
    {
        "word": "Abfahrt",
        "article": "die",
        "translations": {"en": "departure", "es": "salida", "fr": "départ", "ru": "отправление", "ar": "مغادرة"},
        "type": "noun",
        "exampleSentences": [{
            "text": "Wir haben noch zwanzig Minuten bis zur Abfahrt.",
            "translations": {"en": "We have twenty minutes until departure.", "es": "Tenemos veinte minutos hasta la salida.", "fr": "Nous avons encore vingt minutes jusqu'au départ.", "ru": "У нас еще двадцать минут до отправления.", "ar": "لدينا عشرون دقيقة حتى المغادرة."}
        }]
    },
    {
        "word": "Fahrkarte",
        "article": "die",
        "translations": {"en": "ticket", "es": "billete", "fr": "billet", "ru": "билет", "ar": "تذكرة"},
        "type": "noun",
        "exampleSentences": [
            {
                "text": "Hast du schon eine Fahrkarte?",
                "translations": {"en": "Do you already have a ticket?", "es": "¿Ya tienes billete?", "fr": "As-tu déjà un billet ?", "ru": "У тебя уже есть билет?", "ar": "هل لديك تذكرة بالفعل؟"}
            },
            {
                "text": "Ihre Fahrkarten, bitte!",
                "translations": {"en": "Your tickets, please!", "es": "¡Sus billetes, por favor!", "fr": "Vos billets, s'il vous plaît !", "ru": "Ваши билеты, пожалуйста!", "ar": "تذاكركم، من فضلكم!"}
            }
        ]
    },
    {
        "word": "Fahrplan",
        "article": "der",
        "translations": {"en": "timetable, schedule", "es": "horario", "fr": "horaire", "ru": "расписание", "ar": "جدول مواعيد"},
        "type": "noun",
        "exampleSentences": [{
            "text": "Ist das der neue Fahrplan?",
            "translations": {"en": "Is this the new timetable?", "es": "¿Es este el nuevo horario?", "fr": "Est-ce le nouvel horaire ?", "ru": "Это новое расписание?", "ar": "هل هذا الجدول الزمني الجديد؟"}
        }]
    },
    {
        "word": "(Fahr)Rad",
        "article": "das",
        "translations": {"en": "bicycle, bike", "es": "bicicleta", "fr": "vélo", "ru": "велосипед", "ar": "دراجة"},
        "type": "noun",
        "exampleSentences": [{
            "text": "Wenn es nicht regnet, fahre ich mit dem Fahrrad.",
            "translations": {"en": "If it's not raining, I go by bicycle.", "es": "Si no llueve, voy en bicicleta.", "fr": "S'il ne pleut pas, je vais en vélo.", "ru": "Если не идет дождь, я езжу на велосипеде.", "ar": "إذا لم تمطر، أذهب بالدراجة."}
        }]
    },
    {
        "word": "fallen",
        "article": "",
        "translations": {"en": "to fall", "es": "caer", "fr": "tomber", "ru": "падать", "ar": "يسقط"},
        "type": "verb",
        "exampleSentences": [{
            "text": "Pass auf, das Glas fällt gleich vom Tisch.",
            "translations": {"en": "Watch out, the glass is about to fall off the table.", "es": "Cuidado, el vaso va a caerse de la mesa.", "fr": "Attention, le verre va tomber de la table.", "ru": "Осторожно, стакан сейчас упадет со стола.", "ar": "انتبه، الكأس على وشك السقوط من الطاولة."}
        }]
    },
    {
        "word": "früher",
        "article": "",
        "translations": {"en": "earlier, formerly", "es": "antes, anteriormente", "fr": "autrefois, plus tôt", "ru": "раньше", "ar": "في السابق"},
        "type": "adverb/adjective",
        "exampleSentences": [
            {
                "text": "Früher habe ich in Berlin gewohnt.",
                "translations": {"en": "I used to live in Berlin.", "es": "Antes vivía en Berlín.", "fr": "Avant, j'habitais à Berlin.", "ru": "Раньше я жил в Берлине.", "ar": "كنت أعيش في برلين سابقاً."}
            },
            {
                "text": "Wir nehmen den früheren Zug.",
                "translations": {"en": "We're taking the earlier train.", "es": "Tomamos el tren más temprano.", "fr": "Nous prenons le train plus tôt.", "ru": "Мы берем более ранний поезд.", "ar": "سنأخذ القطار الأبكر."}
            }
        ]
    },
    {
        "word": "Frühstück",
        "article": "das",
        "translations": {"en": "breakfast", "es": "desayuno", "fr": "petit-déjeuner", "ru": "завтрак", "ar": "فطور"},
        "type": "noun",
        "exampleSentences": [{
            "text": "Möchtest du ein Ei zum Frühstück?",
            "translations": {"en": "Would you like an egg for breakfast?", "es": "¿Quieres un huevo para el desayuno?", "fr": "Veux-tu un œuf pour le petit-déjeuner ?", "ru": "Хочешь яйцо на завтрак?", "ar": "هل تريد بيضة للفطور؟"}
        }]
    },
    {
        "word": "frühstücken",
        "article": "",
        "translations": {"en": "to have breakfast", "es": "desayunar", "fr": "prendre le petit-déjeuner", "ru": "завтракать", "ar": "يتناول الفطور"},
        "type": "verb",
        "exampleSentences": [{
            "text": "Ich frühstücke immer um 9:00 Uhr.",
            "translations": {"en": "I always have breakfast at 9:00 AM.", "es": "Siempre desayuno a las 9:00.", "fr": "Je prends toujours mon petit-déjeuner à 9h00.", "ru": "Я всегда завтракаю в 9:00.", "ar": "أتناول الفطور دائماً في التاسعة صباحاً."}
        }]
    },
    {
        "word": "fühlen (sich)",
        "article": "",
        "translations": {"en": "to feel", "es": "sentirse", "fr": "se sentir", "ru": "чувствовать себя", "ar": "يشعر"},
        "type": "verb",
        "exampleSentences": [
            {
                "text": "Wie fühlen Sie sich?",
                "translations": {"en": "How do you feel?", "es": "¿Cómo se siente?", "fr": "Comment vous sentez-vous ?", "ru": "Как вы себя чувствуете?", "ar": "كيف تشعر؟"}
            },
            {
                "text": "Ich fühle mich heute nicht gut.",
                "translations": {"en": "I don't feel well today.", "es": "Hoy no me siento bien.", "fr": "Je ne me sens pas bien aujourd'hui.", "ru": "Я сегодня плохо себя чувствую.", "ar": "لا أشعر بحال جيد اليوم."}
            }
        ]
    },
    {
        "word": "Führerschein",
        "article": "der",
        "translations": {"en": "driver's license", "es": "licencia de conducir", "fr": "permis de conduire", "ru": "водительские права", "ar": "رخصة قيادة"},
        "type": "noun",
        "exampleSentences": [
            {
                "text": "Hast du den Führerschein?",
                "translations": {"en": "Do you have a driver's license?", "es": "¿Tienes licencia de conducir?", "fr": "As-tu le permis de conduire ?", "ru": "У тебя есть водительские права?", "ar": "هل لديك رخصة قيادة؟"}
            },
            {
                "text": "Sie hat die Führerscheinprüfung bestanden.",
                "translations": {"en": "She passed the driving test.", "es": "Aprobó el examen de conducir.", "fr": "Elle a réussi l'examen du permis de conduire.", "ru": "Она сдала экзамен на права.", "ar": "نجحت في اختبار رخصة القيادة."}
            }
        ]
    },
    {
        "word": "Führung",
        "article": "die",
        "translations": {"en": "tour, guided tour", "es": "visita guiada", "fr": "visite guidée", "ru": "экскурсия", "ar": "جولة إرشادية"},
        "type": "noun",
        "exampleSentences": [{
            "text": "Die nächste Führung beginnt um 15 Uhr.",
            "translations": {"en": "The next tour starts at 3 PM.", "es": "La próxima visita guiada comienza a las 15:00.", "fr": "La prochaine visite guidée commence à 15h.", "ru": "Следующая экскурсия начинается в 15:00.", "ar": "الجولة التالية تبدأ في الساعة الثالثة مساءً."}
        }]
    },
    {
        "word": "Fundsachen",
        "article": "die (Pl.)",
        "translations": {"en": "lost and found", "es": "objetos perdidos", "fr": "objets trouvés", "ru": "бюро находок", "ar": "مكتب المفقودات"},
        "type": "noun",
        "exampleSentences": [{
            "text": "Haben Sie meinen Schirm gefunden? - Sie können dort bei den Fundsachen schauen.",
            "translations": {"en": "Have you found my umbrella? - You can check at the lost and found over there.", "es": "¿Han encontrado mi paraguas? - Puede mirar allí en objetos perdidos.", "fr": "Avez-vous trouvé mon parapluie ? - Vous pouvez regarder là-bas aux objets trouvés.", "ru": "Вы нашли мой зонт? - Можете посмотреть в бюро находок.", "ar": "هل وجدتم مظلتي؟ - يمكنك أن تنظر هناك في مكتب المفقودات."}
        }]
    }
]

complete.extend(batch_12)

with open('a2-vocabulary-complete.json', 'w', encoding='utf-8') as f:
    json.dump(complete, f, ensure_ascii=False, indent=2)

# Update tracker
tracker = {
    "lastProcessedIndex": 299,
    "totalWords": 1149,
    "processedWords": 300,
    "lastUpdated": "2025-11-20T00:00:00Z",
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

print(f"✅ Batch 12 complete! Total: {len(complete)} words")
print(f"Progress: 300/1149 words (26.1%)")

