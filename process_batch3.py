#!/usr/bin/env python3
"""
Script to process A2 vocabulary batches and add translations.
This processes batches 3-11 (indices 50-274).
"""

import json
import sys

# Batch 3 translations (indices 50-74)
batch_3 = [
  {
    "word": "Auskunft",
    "article": "die",
    "translations": {
      "en": "information",
      "es": "información",
      "fr": "information, renseignement",
      "ru": "информация",
      "ar": "معلومات"
    },
    "type": "noun",
    "exampleSentences": [
      {
        "text": "Wo ist die Auskunft?",
        "translations": {
          "en": "Where is the information desk?",
          "es": "¿Dónde está el mostrador de información?",
          "fr": "Où est le bureau d'information ?",
          "ru": "Где справочное бюро?",
          "ar": "أين مكتب المعلومات؟"
        }
      },
      {
        "text": "Können Sie mir bitte eine Auskunft geben?",
        "translations": {
          "en": "Can you please give me some information?",
          "es": "¿Puede darme información, por favor?",
          "fr": "Pouvez-vous me donner un renseignement, s'il vous plaît ?",
          "ru": "Можете ли вы дать мне информацию, пожалуйста?",
          "ar": "هل يمكنك إعطائي معلومات من فضلك؟"
        }
      }
    ]
  },
  {
    "word": "Ausland",
    "article": "das",
    "translations": {
      "en": "foreign country, abroad",
      "es": "extranjero",
      "fr": "étranger",
      "ru": "зарубежье",
      "ar": "الخارج"
    },
    "type": "noun",
    "exampleSentences": [
      {
        "text": "Fahren Sie ins Ausland?",
        "translations": {
          "en": "Are you going abroad?",
          "es": "¿Va al extranjero?",
          "fr": "Allez-vous à l'étranger ?",
          "ru": "Вы едете за границу?",
          "ar": "هل تسافر إلى الخارج؟"
        }
      }
    ]
  },
  {
    "word": "ausmachen",
    "article": "",
    "translations": {
      "en": "to turn off, to switch off",
      "es": "apagar",
      "fr": "éteindre",
      "ru": "выключать",
      "ar": "يطفئ"
    },
    "type": "verb",
    "exampleSentences": [
      {
        "text": "Mach bitte das Licht aus!",
        "translations": {
          "en": "Please turn off the light!",
          "es": "¡Apaga la luz, por favor!",
          "fr": "Éteins la lumière, s'il te plaît !",
          "ru": "Выключи, пожалуйста, свет!",
          "ar": "من فضلك، أطفئ الضوء!"
        }
      }
    ]
  },
  {
    "word": "auspacken",
    "article": "",
    "translations": {
      "en": "to unpack",
      "es": "desempacar",
      "fr": "déballer",
      "ru": "распаковывать",
      "ar": "يفتح الحقيبة"
    },
    "type": "verb",
    "exampleSentences": [
      {
        "text": "Packst du bitte den Koffer aus?",
        "translations": {
          "en": "Could you please unpack the suitcase?",
          "es": "¿Puedes desempacar la maleta, por favor?",
          "fr": "Peux-tu déballer la valise, s'il te plaît ?",
          "ru": "Распакуешь, пожалуйста, чемодан?",
          "ar": "هل يمكنك فتح الحقيبة من فضلك؟"
        }
      }
    ]
  },
  {
    "word": "ausruhen (sich)",
    "article": "",
    "translations": {
      "en": "to rest",
      "es": "descansar",
      "fr": "se reposer",
      "ru": "отдыхать",
      "ar": "يستريح"
    },
    "type": "verb",
    "exampleSentences": [
      {
        "text": "Ruh dich erst mal aus! Du bist sicher müde.",
        "translations": {
          "en": "Take a rest first! You must be tired.",
          "es": "¡Descansa primero! Seguro estás cansado.",
          "fr": "Repose-toi d'abord ! Tu es sûrement fatigué.",
          "ru": "Сначала отдохни! Ты наверняка устал.",
          "ar": "استرح أولاً! أنت بالتأكيد متعب."
        }
      },
      {
        "text": "Er ruht sich nach der Arbeit immer aus.",
        "translations": {
          "en": "He always rests after work.",
          "es": "Siempre descansa después del trabajo.",
          "fr": "Il se repose toujours après le travail.",
          "ru": "Он всегда отдыхает после работы.",
          "ar": "هو يستريح دائماً بعد العمل."
        }
      }
    ]
  },
  {
    "word": "aussehen",
    "article": "",
    "translations": {
      "en": "to look, to appear",
      "es": "parecer",
      "fr": "avoir l'air",
      "ru": "выглядеть",
      "ar": "يبدو"
    },
    "type": "verb",
    "exampleSentences": [
      {
        "text": "Wie sieht er aus? - Groß und blond.",
        "translations": {
          "en": "What does he look like? - Tall and blond.",
          "es": "¿Cómo es? - Alto y rubio.",
          "fr": "À quoi ressemble-t-il ? - Grand et blond.",
          "ru": "Как он выглядит? - Высокий и блондин.",
          "ar": "كيف يبدو؟ - طويل وأشقر."
        }
      },
      {
        "text": "Sie sieht wie ihre Mutter aus.",
        "translations": {
          "en": "She looks like her mother.",
          "es": "Se parece a su madre.",
          "fr": "Elle ressemble à sa mère.",
          "ru": "Она похожа на свою мать.",
          "ar": "تبدو مثل والدتها."
        }
      },
      {
        "text": "Das Kleid sieht hübsch aus.",
        "translations": {
          "en": "The dress looks pretty.",
          "es": "El vestido se ve bonito.",
          "fr": "La robe a l'air jolie.",
          "ru": "Платье выглядит красиво.",
          "ar": "الفستان يبدو جميلاً."
        }
      }
    ]
  },
  {
    "word": "außer",
    "article": "",
    "translations": {
      "en": "except, besides",
      "es": "excepto, salvo",
      "fr": "sauf, excepté",
      "ru": "кроме",
      "ar": "باستثناء"
    },
    "type": "preposition",
    "exampleSentences": [
      {
        "text": "Außer Lisa möchte niemand den Film sehen.",
        "translations": {
          "en": "Except for Lisa, nobody wants to see the film.",
          "es": "Excepto Lisa, nadie quiere ver la película.",
          "fr": "Sauf Lisa, personne ne veut voir le film.",
          "ru": "Кроме Лизы, никто не хочет смотреть фильм.",
          "ar": "باستثناء ليزا، لا أحد يريد مشاهدة الفيلم."
        }
      },
      {
        "text": "Wir haben täglich außer Samstag geöffnet.",
        "translations": {
          "en": "We're open daily except Saturday.",
          "es": "Abrimos diariamente excepto los sábados.",
          "fr": "Nous sommes ouverts tous les jours sauf le samedi.",
          "ru": "Мы открыты ежедневно, кроме субботы.",
          "ar": "نحن مفتوحون يومياً باستثناء يوم السبت."
        }
      }
    ]
  },
  {
    "word": "außerdem",
    "article": "",
    "translations": {
      "en": "besides, moreover",
      "es": "además",
      "fr": "en outre, d'ailleurs",
      "ru": "кроме того",
      "ar": "علاوة على ذلك"
    },
    "type": "adverb",
    "exampleSentences": [
      {
        "text": "Vier Brötchen, möchten Sie außerdem noch etwas?",
        "translations": {
          "en": "Four rolls, would you like anything else besides that?",
          "es": "Cuatro panecillos, ¿desea algo más además?",
          "fr": "Quatre petits pains, voulez-vous autre chose en plus ?",
          "ru": "Четыре булочки, хотите еще что-нибудь кроме этого?",
          "ar": "أربعة لفائف، هل تريد شيئاً آخر أيضاً؟"
        }
      }
    ]
  },
  {
    "word": "außerhalb",
    "article": "",
    "translations": {
      "en": "outside",
      "es": "fuera de",
      "fr": "à l'extérieur de",
      "ru": "за пределами",
      "ar": "خارج"
    },
    "type": "adverb",
    "exampleSentences": [
      {
        "text": "Die Wohnung ist nicht in der Stadt, sie liegt etwas außerhalb.",
        "translations": {
          "en": "The apartment is not in the city, it's located somewhat outside.",
          "es": "El apartamento no está en la ciudad, está un poco afuera.",
          "fr": "L'appartement n'est pas en ville, il se trouve un peu à l'extérieur.",
          "ru": "Квартира не в городе, она находится немного за его пределами.",
          "ar": "الشقة ليست في المدينة، إنها تقع خارج المدينة قليلاً."
        }
      }
    ]
  },
  {
    "word": "aussprechen",
    "article": "",
    "translations": {
      "en": "to pronounce",
      "es": "pronunciar",
      "fr": "prononcer",
      "ru": "произносить",
      "ar": "ينطق"
    },
    "type": "verb",
    "exampleSentences": [
      {
        "text": "Wie spricht man das Wort aus?",
        "translations": {
          "en": "How do you pronounce this word?",
          "es": "¿Cómo se pronuncia esta palabra?",
          "fr": "Comment prononce-t-on ce mot ?",
          "ru": "Как произносится это слово?",
          "ar": "كيف تنطق هذه الكلمة؟"
        }
      }
    ]
  },
  {
    "word": "aussteigen",
    "article": "",
    "translations": {
      "en": "to get off, to get out",
      "es": "bajarse",
      "fr": "descendre",
      "ru": "выходить",
      "ar": "ينزل"
    },
    "type": "verb",
    "exampleSentences": [
      {
        "text": "Wo müssen wir aussteigen? – An der nächsten Haltestelle.",
        "translations": {
          "en": "Where do we have to get off? – At the next stop.",
          "es": "¿Dónde tenemos que bajarnos? – En la próxima parada.",
          "fr": "Où devons-nous descendre ? – Au prochain arrêt.",
          "ru": "Где нам нужно выходить? – На следующей остановке.",
          "ar": "أين يجب أن ننزل؟ – في المحطة التالية."
        }
      }
    ]
  },
  {
    "word": "Ausstellung",
    "article": "die",
    "translations": {
      "en": "exhibition",
      "es": "exposición",
      "fr": "exposition",
      "ru": "выставка",
      "ar": "معرض"
    },
    "type": "noun",
    "exampleSentences": [
      {
        "text": "Gehen wir morgen zusammen in die Ausstellung?",
        "translations": {
          "en": "Shall we go to the exhibition together tomorrow?",
          "es": "¿Vamos juntos a la exposición mañana?",
          "fr": "Allons-nous ensemble à l'exposition demain ?",
          "ru": "Пойдем вместе на выставку завтра?",
          "ar": "هل نذهب معاً إلى المعرض غداً؟"
        }
      }
    ]
  },
  {
    "word": "austragen",
    "article": "",
    "translations": {
      "en": "to deliver",
      "es": "repartir, entregar",
      "fr": "livrer, distribuer",
      "ru": "доставлять",
      "ar": "يوزع"
    },
    "type": "verb",
    "exampleSentences": [
      {
        "text": "Er trägt jeden Morgen die Zeitung aus.",
        "translations": {
          "en": "He delivers the newspaper every morning.",
          "es": "Reparte el periódico todas las mañanas.",
          "fr": "Il livre le journal tous les matins.",
          "ru": "Он доставляет газету каждое утро.",
          "ar": "يوزع الصحيفة كل صباح."
        }
      }
    ]
  },
  {
    "word": "Ausweis",
    "article": "der",
    "translations": {
      "en": "ID, identification card",
      "es": "documento de identidad",
      "fr": "carte d'identité",
      "ru": "удостоверение личности",
      "ar": "بطاقة الهوية"
    },
    "type": "noun",
    "exampleSentences": [
      {
        "text": "Darf ich bitte mal Ihren Ausweis sehen? – Hier ist mein Ausweis.",
        "translations": {
          "en": "May I see your ID, please? – Here is my ID.",
          "es": "¿Puedo ver su identificación, por favor? – Aquí está mi identificación.",
          "fr": "Puis-je voir votre pièce d'identité, s'il vous plaît ? – Voici ma pièce d'identité.",
          "ru": "Могу я увидеть ваше удостоверение, пожалуйста? – Вот мое удостоверение.",
          "ar": "هل يمكنني رؤية بطاقة الهوية الخاصة بك من فضلك؟ – إليك بطاقة الهوية الخاصة بي."
        }
      }
    ]
  },
  {
    "word": "Auto",
    "article": "das",
    "translations": {
      "en": "car",
      "es": "coche, auto",
      "fr": "voiture",
      "ru": "машина, автомобиль",
      "ar": "سيارة"
    },
    "type": "noun",
    "exampleSentences": [
      {
        "text": "Er fährt mit dem Auto.",
        "translations": {
          "en": "He's driving by car.",
          "es": "Va en coche.",
          "fr": "Il va en voiture.",
          "ru": "Он едет на машине.",
          "ar": "يسافر بالسيارة."
        }
      }
    ]
  },
  {
    "word": "Autobahn",
    "article": "die",
    "translations": {
      "en": "highway, motorway",
      "es": "autopista",
      "fr": "autoroute",
      "ru": "автобан, автомагистраль",
      "ar": "طريق سريع"
    },
    "type": "noun",
    "exampleSentences": [
      {
        "text": "Darf ich mit dem Motorroller auf der Autobahn fahren?",
        "translations": {
          "en": "Am I allowed to drive a scooter on the highway?",
          "es": "¿Puedo conducir un scooter en la autopista?",
          "fr": "Puis-je conduire un scooter sur l'autoroute ?",
          "ru": "Можно ли мне ехать на скутере по автобану?",
          "ar": "هل يُسمح لي بقيادة دراجة نارية على الطريق السريع؟"
        }
      },
      {
        "text": "Das Dorf liegt direkt an der Autobahn.",
        "translations": {
          "en": "The village is right next to the highway.",
          "es": "El pueblo está justo al lado de la autopista.",
          "fr": "Le village est juste à côté de l'autoroute.",
          "ru": "Деревня находится прямо у автобана.",
          "ar": "القرية تقع مباشرة بجوار الطريق السريع."
        }
      }
    ]
  },
  {
    "word": "Apparat",
    "article": "der",
    "translations": {
      "en": "device, appliance",
      "es": "aparato",
      "fr": "appareil",
      "ru": "аппарат, прибор",
      "ar": "جهاز"
    },
    "type": "noun",
    "exampleSentences": [
      {
        "text": "Was machen wir mit deinem alten Apparat?",
        "translations": {
          "en": "What should we do with your old device?",
          "es": "¿Qué hacemos con tu aparato viejo?",
          "fr": "Que faisons-nous de ton vieil appareil ?",
          "ru": "Что нам делать с твоим старым прибором?",
          "ar": "ماذا سنفعل بجهازك القديم؟"
        }
      },
      {
        "text": "Ich habe einen neuen Fotoapparat.",
        "translations": {
          "en": "I have a new camera.",
          "es": "Tengo una cámara nueva.",
          "fr": "J'ai un nouvel appareil photo.",
          "ru": "У меня новый фотоаппарат.",
          "ar": "لدي كاميرا جديدة."
        }
      }
    ]
  },
  {
    "word": "arbeiten",
    "article": "",
    "translations": {
      "en": "to work",
      "es": "trabajar",
      "fr": "travailler",
      "ru": "работать",
      "ar": "يعمل"
    },
    "type": "verb",
    "exampleSentences": [
      {
        "text": "Wo arbeiten Sie?",
        "translations": {
          "en": "Where do you work?",
          "es": "¿Dónde trabaja?",
          "fr": "Où travaillez-vous ?",
          "ru": "Где вы работаете?",
          "ar": "أين تعمل؟"
        }
      },
      {
        "text": "Ich arbeite als Krankenschwester in einem Krankenhaus.",
        "translations": {
          "en": "I work as a nurse in a hospital.",
          "es": "Trabajo como enfermera en un hospital.",
          "fr": "Je travaille comme infirmière dans un hôpital.",
          "ru": "Я работаю медсестрой в больнице.",
          "ar": "أعمل كممرضة في مستشفى."
        }
      }
    ]
  },
  {
    "word": "Arbeit",
    "article": "die",
    "translations": {
      "en": "work, job",
      "es": "trabajo",
      "fr": "travail",
      "ru": "работа",
      "ar": "عمل"
    },
    "type": "noun",
    "exampleSentences": [
      {
        "text": "Mein Bruder sucht Arbeit.",
        "translations": {
          "en": "My brother is looking for work.",
          "es": "Mi hermano busca trabajo.",
          "fr": "Mon frère cherche du travail.",
          "ru": "Мой брат ищет работу.",
          "ar": "أخي يبحث عن عمل."
        }
      }
    ]
  },
  {
    "word": "arbeitslos",
    "article": "",
    "translations": {
      "en": "unemployed",
      "es": "desempleado",
      "fr": "au chômage",
      "ru": "безработный",
      "ar": "عاطل عن العمل"
    },
    "type": "adjective",
    "exampleSentences": [
      {
        "text": "Seit wann ist er schon arbeitslos?",
        "translations": {
          "en": "Since when has he been unemployed?",
          "es": "¿Desde cuándo está desempleado?",
          "fr": "Depuis quand est-il au chômage ?",
          "ru": "С какого времени он безработный?",
          "ar": "منذ متى وهو عاطل عن العمل؟"
        }
      },
      {
        "text": "Es gibt bei uns viele Leute, die schon lange arbeitslos sind.",
        "translations": {
          "en": "We have many people who have been unemployed for a long time.",
          "es": "Tenemos muchas personas que están desempleadas desde hace mucho tiempo.",
          "fr": "Nous avons beaucoup de gens qui sont au chômage depuis longtemps.",
          "ru": "У нас много людей, которые уже давно безработные.",
          "ar": "لدينا العديد من الأشخاص العاطلين عن العمل لفترة طويلة."
        }
      }
    ]
  },
  {
    "word": "ärgern (sich)",
    "article": "",
    "translations": {
      "en": "to be annoyed, to get angry",
      "es": "enojarse",
      "fr": "s'énerver, se fâcher",
      "ru": "злиться, раздражаться",
      "ar": "يغضب، ينزعج"
    },
    "type": "verb",
    "exampleSentences": [
      {
        "text": "Warum ärgerst du dich? - Ich ärgere mich, weil das Wetter schlecht ist.",
        "translations": {
          "en": "Why are you annoyed? - I'm annoyed because the weather is bad.",
          "es": "¿Por qué estás enojado? - Estoy enojado porque el tiempo está mal.",
          "fr": "Pourquoi tu t'énerves ? - Je suis énervé parce que le temps est mauvais.",
          "ru": "Почему ты злишься? - Я злюсь, потому что плохая погода.",
          "ar": "لماذا أنت منزعج؟ - أنا منزعج لأن الطقس سيئ."
        }
      }
    ]
  },
  {
    "word": "arm",
    "article": "",
    "translations": {
      "en": "poor",
      "es": "pobre",
      "fr": "pauvre",
      "ru": "бедный",
      "ar": "فقير"
    },
    "type": "adjective",
    "exampleSentences": [
      {
        "text": "Sie haben nicht viel Geld, sie sind arm.",
        "translations": {
          "en": "They don't have much money, they are poor.",
          "es": "No tienen mucho dinero, son pobres.",
          "fr": "Ils n'ont pas beaucoup d'argent, ils sont pauvres.",
          "ru": "У них немного денег, они бедные.",
          "ar": "ليس لديهم الكثير من المال، إنهم فقراء."
        }
      }
    ]
  },
  {
    "word": "Arm",
    "article": "der",
    "translations": {
      "en": "arm",
      "es": "brazo",
      "fr": "bras",
      "ru": "рука",
      "ar": "ذراع"
    },
    "type": "noun",
    "exampleSentences": [
      {
        "text": "Mein Arm tut weh.",
        "translations": {
          "en": "My arm hurts.",
          "es": "Me duele el brazo.",
          "fr": "Mon bras me fait mal.",
          "ru": "У меня болит рука.",
          "ar": "ذراعي يؤلمني."
        }
      }
    ]
  },
  {
    "word": "Artikel",
    "article": "der",
    "translations": {
      "en": "article",
      "es": "artículo",
      "fr": "article",
      "ru": "артикль, статья",
      "ar": "أداة التعريف، مقال"
    },
    "type": "noun",
    "exampleSentences": [
      {
        "text": "Im Deutschen gibt es drei Artikel: der, die und das.",
        "translations": {
          "en": "In German there are three articles: der, die and das.",
          "es": "En alemán hay tres artículos: der, die y das.",
          "fr": "En allemand, il y a trois articles : der, die et das.",
          "ru": "В немецком языке есть три артикля: der, die и das.",
          "ar": "في الألمانية توجد ثلاث أدوات تعريف: der, die و das."
        }
      },
      {
        "text": "Ich habe in der Zeitung einen interessanten Artikel gelesen.",
        "translations": {
          "en": "I read an interesting article in the newspaper.",
          "es": "Leí un artículo interesante en el periódico.",
          "fr": "J'ai lu un article intéressant dans le journal.",
          "ru": "Я прочитал интересную статью в газете.",
          "ar": "قرأت مقالاً مثيراً للاهتمام في الصحيفة."
        }
      }
    ]
  },
  {
    "word": "auch",
    "article": "",
    "translations": {
      "en": "also, too",
      "es": "también",
      "fr": "aussi",
      "ru": "также, тоже",
      "ar": "أيضاً"
    },
    "type": "adverb",
    "exampleSentences": [
      {
        "text": "Ich bin auch Spanier.",
        "translations": {
          "en": "I'm also Spanish.",
          "es": "Yo también soy español.",
          "fr": "Je suis aussi espagnol.",
          "ru": "Я тоже испанец.",
          "ar": "أنا أيضاً إسباني."
        }
      },
      {
        "text": "Maria muss auch am Wochenende arbeiten.",
        "translations": {
          "en": "Maria also has to work on weekends.",
          "es": "María también tiene que trabajar los fines de semana.",
          "fr": "Maria doit aussi travailler le week-end.",
          "ru": "Мария тоже должна работать по выходным.",
          "ar": "يجب على ماريا أيضاً العمل في عطلة نهاية الأسبوع."
        }
      }
    ]
  }
]

# Load existing file
with open('a2-vocabulary-complete.json', 'r', encoding='utf-8') as f:
    existing_data = json.load(f)

# Add batch 3
existing_data.extend(batch_3)

# Save updated file
with open('a2-vocabulary-complete.json', 'w', encoding='utf-8') as f:
    json.dump(existing_data, f, ensure_ascii=False, indent=2)

print(f"Batch 3 complete! Total words now: {len(existing_data)}")

