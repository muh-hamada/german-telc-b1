#!/usr/bin/env python3
import json

# Read the current file
with open('app/update-messages.json', 'r', encoding='utf-8') as f:
    messages = json.load(f)

# Additional translations for messages 5-10
additional_translations = [
    # Message 5 (index 4)
    {
        "pt-BR": "💪 Prepare-se para arrasar no exame Telc! Polimos o app e adicionamos novos aprimoramentos para tornar sua experiência de preparação ainda melhor.",
        "ja": "💪 Telc試験で優秀な成績を収める準備をしましょう！アプリを磨き上げ、準備体験をさらに良くするための新しい機能を追加しました。",
        "ko": "💪 Telc 시험에서 우수한 성적을 거둘 준비를 하세요! 앱을 개선하고 준비 경험을 더 나아가게 할 새로운 기능을 추가했습니다.",
        "zh": "💪 准备在Telc考试中取得优异成绩！我们优化了应用程序并添加了新功能，让您的备考体验更加出色。",
        "zh-TW": "💪 準備在Telc考試中取得優異成績！我們優化了應用程式並添加了新功能，讓您的備考體驗更加出色。",
        "hi": "💪 Telc परीक्षा में उत्कृष्टता प्राप्त करने के लिए तैयार हो जाएं! हमने ऐप को बेहतर बनाया है और आपके तैयारी अनुभव को और भी बेहतर बनाने के लिए नई सुधार जोड़े हैं।",
        "nl": "💪 Maak je klaar om het Telc-examen te halen! We hebben de app gepolijst en nieuwe verbeteringen toegevoegd om je voorbereidingservaring nog beter te maken.",
        "pl": "💪 Przygotuj się na zdanie egzaminu Telc! Dopracowaliśmy aplikację i dodaliśmy nowe ulepszenia, aby Twoje doświadczenie przygotowawcze było jeszcze lepsze.",
        "sv": "💪 Gör dig redo att klara Telc-provet! Vi har polerat appen och lagt till nya förbättringar för att göra din förberedelseupplevelse ännu bättre.",
        "da": "💪 Gør dig klar til at bestå Telc-eksamenen! Vi har poleret appen og tilføjet nye forbedringer for at gøre din forberedelsesoplevelse endnu bedre.",
        "fi": "💪 Valmistaudu suorittamaan Telc-koe loistavasti! Olemme hionut sovellusta ja lisänneet uusia parannuksia tehdäksemme valmistautumiskokemuksestasi entistä paremman.",
        "nb": "💪 Gjør deg klar til å mestre Telc-eksamen! Vi har pusset opp appen og lagt til nye forbedringer for å gjøre forberedelsesopplevelsen din enda bedre.",
        "th": "💪 เตรียมพร้อมสำหรับการสอบ Telc ให้เป็นเลิศ! เราได้ปรับปรุงแอปและเพิ่มการปรับปรุงใหม่เพื่อทำให้ประสบการณ์การเตรียมตัวของคุณดียิ่งขึ้น",
        "vi": "💪 Sẵn sàng vượt qua kỳ thi Telc! Chúng tôi đã hoàn thiện ứng dụng và thêm các cải tiến mới để trải nghiệm chuẩn bị của bạn tốt hơn nữa.",
        "id": "💪 Bersiaplah untuk lulus ujian Telc! Kami telah menyempurnakan aplikasi dan menambahkan peningkatan baru untuk membuat pengalaman persiapan Anda lebih baik lagi.",
        "ms": "💪 Bersedia untuk cemerlang dalam Peperiksaan Telc! Kami telah memperhalusi aplikasi dan menambah peningkatan baharu untuk menjadikan pengalaman persediaan anda lebih baik.",
        "uk": "💪 Готуйтеся блискуче скласти іспит Telc! Ми відшліфували додаток і додали нові покращення, щоб зробити ваш досвід підготовки ще кращим.",
        "cs": "💪 Připravte se na úspěch u zkoušky Telc! Vylepšili jsme aplikaci a přidali nová vylepšení, aby byla vaše zkušenost s přípravou ještě lepší.",
        "el": "💪 Ετοιμαστείτε να περάσετε την εξέταση Telc! Βελτιώσαμε την εφαρμογή και προσθέσαμε νέες βελτιώσεις για να κάνουμε την εμπειρία προετοιμασίας σας ακόμα καλύτερη.",
        "he": "💪 התכונן להצליח בבחינת Telc! שיפרנו את האפליקציה והוספנו שיפורים חדשים כדי להפוך את חוויית ההכנה שלך לטובה עוד יותר.",
        "ro": "💪 Pregătește-te să promovezi examenul Telc! Am perfecționat aplicația și am adăugat noi îmbunătățiri pentru a face experiența ta de pregătire și mai bună.",
        "hu": "💪 Készülj fel a Telc vizsga sikeres letételére! Finomítottuk az alkalmazást és új fejlesztéseket adtunk hozzá, hogy felkészülési élményed még jobb legyen."
    },
    # Message 6 (index 5)
    {
        "pt-BR": "🌟 Pequenos ajustes, grande impacto! Carregamento mais rápido, estabilidade aprimorada e fluxo de perguntas mais inteligente — tudo para mantê-lo focado no que realmente importa: passar no seu exame!",
        "ja": "🌟 小さな調整、大きな影響！より速い読み込み、改善された安定性、よりスマートな質問フロー — すべては本当に重要なこと、つまり試験に合格することに集中するためです！",
        "ko": "🌟 작은 조정, 큰 영향! 더 빠른 로딩, 향상된 안정성, 더 스마트한 질문 흐름 — 모두 정말 중요한 것, 즉 시험을 통과하는 데 집중할 수 있도록 합니다!",
        "zh": "🌟 小调整，大影响！更快的加载速度、更好的稳定性和更智能的题目流程 — 一切都是为了让您专注于真正重要的事情：通过考试！",
        "zh-TW": "🌟 小調整，大影響！更快的載入速度、更好的穩定性和更智能的題目流程 — 一切都是為了讓您專注於真正重要的事情：通過考試！",
        "hi": "🌟 छोटे बदलाव, बड़ा प्रभाव! तेज़ लोडिंग, बेहतर स्थिरता और स्मार्ट प्रश्न प्रवाह — सब कुछ आपको वास्तव में महत्वपूर्ण बात पर केंद्रित रखने के लिए: अपनी परीक्षा उत्तीर्ण करना!",
        "nl": "🌟 Kleine aanpassingen, grote impact! Sneller laden, verbeterde stabiliteit en slimmere vraagstroom — allemaal om je gefocust te houden op wat echt belangrijk is: je examen halen!",
        "pl": "🌟 Małe poprawki, duży wpływ! Szybsze ładowanie, lepsza stabilność i mądrzejszy przepływ pytań — wszystko po to, abyś mógł skupić się na tym, co naprawdę ważne: zdaniu egzaminu!",
        "sv": "🌟 Små justeringar, stor påverkan! Snabbare laddning, förbättrad stabilitet och smartare frågeflöde — allt för att hålla dig fokuserad på det som verkligen betyder något: att klara ditt prov!",
        "da": "🌟 Små justeringer, stor effekt! Hurtigere indlæsning, forbedret stabilitet og smartere spørgsmålsflow — alt sammen for at holde dig fokuseret på det, der virkelig betyder noget: at bestå din eksamen!",
        "fi": "🌟 Pienet säädöt, suuri vaikutus! Nopeampi lataus, parannettu vakaus ja älykkäämpi kysymysvirta — kaikki pitääksemme sinut keskittyneenä siihen mikä todella merkitsee: kokeen läpäisemiseen!",
        "nb": "🌟 Små justeringer, stor innvirkning! Raskere lasting, forbedret stabilitet og smartere spørsmålsflyt — alt for å holde deg fokusert på det som virkelig betyr noe: å bestå eksamen din!",
        "th": "🌟 การปรับเล็กๆ ผลกระทบใหญ่! โหลดเร็วขึ้น เสถียรภาพที่ดีขึ้น และการไหลของคำถามที่ชาญฉลาดขึ้น — ทั้งหมดเพื่อให้คุณมุ่งเน้นไปที่สิ่งที่สำคัญจริงๆ: ผ่านการสอบ!",
        "vi": "🌟 Điều chỉnh nhỏ, tác động lớn! Tải nhanh hơn, ổn định được cải thiện và luồng câu hỏi thông minh hơn — tất cả để giúp bạn tập trung vào điều thực sự quan trọng: vượt qua kỳ thi!",
        "id": "🌟 Penyesuaian kecil, dampak besar! Pemuatan lebih cepat, stabilitas yang ditingkatkan, dan alur pertanyaan yang lebih cerdas — semuanya untuk membuat Anda tetap fokus pada yang benar-benar penting: lulus ujian Anda!",
        "ms": "🌟 Pelarasan kecil, kesan besar! Pemuatan lebih pantas, kestabilan dipertingkatkan, dan aliran soalan yang lebih bijak — semuanya untuk memastikan anda fokus pada perkara yang benar-benar penting: lulus peperiksaan anda!",
        "uk": "🌟 Невеликі налаштування, великий вплив! Швидше завантаження, покращена стабільність і розумніший потік питань — все для того, щоб ви зосередилися на тому, що дійсно важливо: складанні іспиту!",
        "cs": "🌟 Malé úpravy, velký dopad! Rychlejší načítání, vylepšená stabilita a chytřejší tok otázek — to vše, abyste zůstali soustředěni na to, co je opravdu důležité: úspěšně složit zkoušku!",
        "el": "🌟 Μικρές προσαρμογές, μεγάλος αντίκτυπος! Ταχύτερη φόρτωση, βελτιωμένη σταθερότητα και εξυπνότερη ροή ερωτήσεων — όλα για να σας κρατήσουν επικεντρωμένους σε αυτό που πραγματικά έχει σημασία: την επιτυχία στην εξέταση!",
        "he": "🌟 כוונונים קטנים, השפעה גדולה! טעינה מהירה יותר, יציבות משופרת וזרימת שאלות חכמה יותר — הכל כדי לשמור אותך ממוקד במה שבאמת חשוב: לעבור את הבחינה!",
        "ro": "🌟 Ajustări mici, impact mare! Încărcare mai rapidă, stabilitate îmbunătățită și flux de întrebări mai inteligent — totul pentru a te menține concentrat pe ceea ce contează cu adevărat: promovarea examenului!",
        "hu": "🌟 Apró finomítások, nagy hatás! Gyorsabb betöltés, jobb stabilitás és okosabb kérdésfolyam — mindezt azért, hogy a valóban fontos dologra koncentrálhass: a vizsga sikeres letételére!"
    },
    # Message 7 (index 6)
    {
        "pt-BR": "🧠 Prática mais nítida, experiência mais suave! Corrigimos bugs, otimizamos o desempenho e tornamos o estudo para Telc mais agradável do que nunca.",
        "ja": "🧠 より鋭い練習、よりスムーズな体験！バグを修正し、パフォーマンスを最適化し、Telcの学習をこれまで以上に楽しくしました。",
        "ko": "🧠 더 날카로운 연습, 더 부드러운 경험! 버그를 수정하고 성능을 최적화하여 Telc 학습을 그 어느 때보다 즐겁게 만들었습니다.",
        "zh": "🧠 更精准的练习，更流畅的体验！我们修复了错误，优化了性能，让Telc学习比以往更加愉快。",
        "zh-TW": "🧠 更精準的練習，更流暢的體驗！我們修復了錯誤，優化了性能，讓Telc學習比以往更加愉快。",
        "hi": "🧠 अधिक तीक्ष्ण अभ्यास, अधिक सुगम अनुभव! हमने बग ठीक किए, प्रदर्शन को अनुकूलित किया और Telc के लिए अध्ययन को पहले से कहीं अधिक आनंददायक बना दिया।",
        "nl": "🧠 Scherpere oefening, soepelere ervaring! We hebben bugs opgelost, prestaties geoptimaliseerd en studeren voor Telc aangenamer gemaakt dan ooit.",
        "pl": "🧠 Ostrzejsza praktyka, płynniejsze doświadczenie! Naprawiliśmy błędy, zoptymalizowaliśmy wydajność i sprawiliśmy, że nauka do Telc jest przyjemniejsza niż kiedykolwiek.",
        "sv": "🧠 Skarpare övning, smidigare upplevelse! Vi fixade buggar, optimerade prestanda och gjorde studier för Telc trevligare än någonsin.",
        "da": "🧠 Skarpere øvelse, glattere oplevelse! Vi har rettet fejl, optimeret ydeevne og gjort studier til Telc mere fornøjelige end nogensinde.",
        "fi": "🧠 Tarkempi harjoittelu, sujuvampi kokemus! Korjasimme vikoja, optimoimme suorituskykyä ja teimme Telc-opiskelusta miellyttävämpää kuin koskaan.",
        "nb": "🧠 Skarpere øving, jevnere opplevelse! Vi fikset feil, optimaliserte ytelsen og gjorde studier for Telc mer hyggelig enn noensinne.",
        "th": "🧠 ฝึกฝนที่คมชัดขึ้น ประสบการณ์ที่ราบรื่นขึ้น! เราแก้ไขบั๊ก ปรับปรุงประสิทธิภาพ และทำให้การเรียนเพื่อ Telc สนุกกว่าที่เคย",
        "vi": "🧠 Luyện tập sắc bén hơn, trải nghiệm mượt mà hơn! Chúng tôi đã sửa lỗi, tối ưu hóa hiệu suất và làm cho việc học Telc trở nên thú vị hơn bao giờ hết.",
        "id": "🧠 Latihan lebih tajam, pengalaman lebih lancar! Kami memperbaiki bug, mengoptimalkan kinerja, dan membuat belajar untuk Telc lebih menyenangkan dari sebelumnya.",
        "ms": "🧠 Latihan lebih tajam, pengalaman lebih lancar! Kami membetulkan pepijat, mengoptimumkan prestasi, dan menjadikan pembelajaran untuk Telc lebih menyeronokkan daripada sebelumnya.",
        "uk": "🧠 Чіткіша практика, плавніший досвід! Ми виправили помилки, оптимізували продуктивність і зробили вивчення Telc приємнішим, ніж будь-коли.",
        "cs": "🧠 Ostřejší cvičení, plynulejší zkušenost! Opravili jsme chyby, optimalizovali výkon a učinili studium pro Telc příjemnějším než kdy jindy.",
        "el": "🧠 Πιο αιχμηρή πρακτική, πιο ομαλή εμπειρία! Διορθώσαμε σφάλματα, βελτιστοποιήσαμε την απόδοση και κάναμε τη μελέτη για το Telc πιο ευχάριστη από ποτέ.",
        "he": "🧠 תרגול חד יותר, חוויה חלקה יותר! תיקנו באגים, ייעלנו ביצועים והפכנו את הלימוד ל-Telc למהנה יותר מתמיד.",
        "ro": "🧠 Practică mai precisă, experiență mai fluidă! Am corectat erori, am optimizat performanța și am făcut studiul pentru Telc mai plăcut ca niciodată.",
        "hu": "🧠 Élesebb gyakorlás, gördülékenyebb élmény! Javítottunk hibákat, optimalizáltuk a teljesítményt és a Telc tanulást kellemessebbé tettük, mint valaha."
    },
    # Message 8 (index 7)
    {
        "pt-BR": "✨ Sua jornada Telc acabou de melhorar! Atualizamos os exercícios, adicionamos transições mais suaves e melhoramos a prática de voz. Atualize e veja a diferença!",
        "ja": "✨ あなたのTelcの旅がさらに良くなりました！演習をアップグレードし、よりスムーズな移行を追加し、音声練習を改善しました。更新して違いを確認してください！",
        "ko": "✨ Telc 여정이 더 나아졌습니다! 연습 문제를 업그레이드하고 더 부드러운 전환을 추가하며 음성 연습을 개선했습니다. 업데이트하고 차이를 확인하세요!",
        "zh": "✨ 您的Telc旅程刚刚变得更好！我们升级了练习，添加了更流畅的过渡，并改进了语音练习。更新并查看区别！",
        "zh-TW": "✨ 您的Telc旅程剛剛變得更好！我們升級了練習，添加了更流暢的過渡，並改進了語音練習。更新並查看區別！",
        "hi": "✨ आपकी Telc यात्रा अभी बेहतर हुई! हमने अभ्यास को उन्नत किया, अधिक सुगम संक्रमण जोड़े और वॉइस प्रैक्टिस में सुधार किया। अपडेट करें और अंतर देखें!",
        "nl": "✨ Je Telc-reis is net beter geworden! We hebben oefeningen geüpgraded, soepelere overgangen toegevoegd en spraakpraktijk verbeterd. Update en zie het verschil!",
        "pl": "✨ Twoja podróż z Telc właśnie stała się lepsza! Ulepszyliśmy ćwiczenia, dodaliśmy płynniejsze przejścia i poprawiliśmy praktykę głosową. Zaktualizuj i zobacz różnicę!",
        "sv": "✨ Din Telc-resa har bara blivit bättre! Vi har uppgraderat övningar, lagt till smidigare övergångar och förbättrat röstövning. Uppdatera och se skillnaden!",
        "da": "✨ Din Telc-rejse er lige blevet bedre! Vi har opgraderet øvelser, tilføjet glattere overgange og forbedret stemmepraksis. Opdater og se forskellen!",
        "fi": "✨ Telc-matkasi parani juuri! Olemme päivittäneet harjoituksia, lisänneet sujuvampia siirtymiä ja parantaneet ääniopetusta. Päivitä ja näe ero!",
        "nb": "✨ Din Telc-reise har bare blitt bedre! Vi har oppgradert øvelser, lagt til jevnere overganger og forbedret taleøving. Oppdater og se forskjellen!",
        "th": "✨ การเดินทาง Telc ของคุณดีขึ้นแล้ว! เราได้อัปเกรดแบบฝึกหัด เพิ่มการเปลี่ยนที่ราบรื่นขึ้น และปรับปรุงการฝึกเสียง อัปเดตและดูความแตกต่าง!",
        "vi": "✨ Hành trình Telc của bạn vừa trở nên tốt hơn! Chúng tôi đã nâng cấp bài tập, thêm chuyển đổi mượt mà hơn và cải thiện thực hành giọng nói. Cập nhật và xem sự khác biệt!",
        "id": "✨ Perjalanan Telc Anda baru saja menjadi lebih baik! Kami telah meningkatkan latihan, menambahkan transisi yang lebih lancar, dan meningkatkan latihan suara. Perbarui dan lihat perbedaannya!",
        "ms": "✨ Perjalanan Telc anda baru sahaja menjadi lebih baik! Kami telah menaik taraf senaman, menambah peralihan yang lebih lancar, dan memperbaiki amalan suara. Kemas kini dan lihat perbezaannya!",
        "uk": "✨ Ваша подорож Telc щойно покращилася! Ми оновили вправи, додали плавніші переходи та покращили голосову практику. Оновіть і побачте різницю!",
        "cs": "✨ Vaše cesta Telc se právě zlepšila! Upgradovali jsme cvičení, přidali plynulejší přechody a vylepšili hlasovou praxi. Aktualizujte a uvidíte rozdíl!",
        "el": "✨ Το ταξίδι σας στο Telc μόλις έγινε καλύτερο! Αναβαθμίσαμε τις ασκήσεις, προσθέσαμε πιο ομαλές μεταβάσεις και βελτιώσαμε την φωνητική πρακτική. Ενημερώστε και δείτε τη διαφορά!",
        "he": "✨ המסע שלך ב-Telc הרגע השתפר! שדרגנו תרגילים, הוספנו מעברים חלקים יותר ושיפרנו את תרגול הקול. עדכן וראה את ההבדל!",
        "ro": "✨ Călătoria ta Telc tocmai a devenit mai bună! Am actualizat exercițiile, am adăugat tranziții mai fluide și am îmbunătățit practica vocală. Actualizează și vezi diferența!",
        "hu": "✨ A Telc utazásod még jobbá vált! Frissítettük a gyakorlatokat, simább átmeneteket adtunk hozzá és javítottuk a hanggyakorlatot. Frissíts és lásd a különbséget!"
    },
    # Message 9 (index 8)
    {
        "pt-BR": "📈 Mais progresso, menos bugs! Esta atualização traz melhor rastreamento, desempenho mais rápido e uma interface mais limpa para manter seu aprendizado no caminho certo.",
        "ja": "📈 より多くの進歩、より少ないバグ！このアップデートは、より良い追跡、より速いパフォーマンス、よりクリーンなインターフェースをもたらし、学習を順調に進めます。",
        "ko": "📈 더 많은 진행, 더 적은 버그! 이 업데이트는 더 나은 추적, 더 빠른 성능, 더 깔끔한 인터페이스를 제공하여 학습을 제대로 진행하게 합니다.",
        "zh": "📈 更多进步，更少错误！此更新带来更好的跟踪、更快的性能和更清晰的界面，让您的学习保持正轨。",
        "zh-TW": "📈 更多進步，更少錯誤！此更新帶來更好的追蹤、更快的性能和更清晰的界面，讓您的學習保持正軌。",
        "hi": "📈 अधिक प्रगति, कम बग! यह अपडेट बेहतर ट्रैकिंग, तेज़ प्रदर्शन और एक स्वच्छ इंटरफ़ेस लाता है ताकि आपकी सीखने को सही रास्ते पर रखा जा सके।",
        "nl": "📈 Meer vooruitgang, minder bugs! Deze update brengt betere tracking, snellere prestaties en een schonere interface om je leerproces op koers te houden.",
        "pl": "📈 Więcej postępów, mniej błędów! Ta aktualizacja przynosi lepsze śledzenie, szybszą wydajność i czystszy interfejs, aby utrzymać Twoją naukę na właściwej ścieżce.",
        "sv": "📈 Mer framsteg, färre buggar! Den här uppdateringen ger bättre spårning, snabbare prestanda och ett renare gränssnitt för att hålla ditt lärande på rätt spår.",
        "da": "📈 Mere fremskridt, færre fejl! Denne opdatering bringer bedre sporing, hurtigere ydeevne og en renere grænseflade for at holde din læring på rette spor.",
        "fi": "📈 Enemmän edistystä, vähemmän vikoja! Tämä päivitys tuo parempaa seurantaa, nopeampaa suorituskykyä ja selkeämmän käyttöliittymän pitääkseen oppimisesi oikeilla raiteilla.",
        "nb": "📈 Mer fremgang, færre feil! Denne oppdateringen gir bedre sporing, raskere ytelse og et renere grensesnitt for å holde læringen din på rett spor.",
        "th": "📈 ความก้าวหน้ามากขึ้น บั๊กน้อยลง! การอัปเดตนี้นำมาซึ่งการติดตามที่ดีขึ้น ประสิทธิภาพที่เร็วขึ้น และอินเทอร์เฟซที่สะอาดขึ้นเพื่อให้การเรียนรู้ของคุณอยู่ในเส้นทางที่ถูกต้อง",
        "vi": "📈 Tiến bộ hơn, ít lỗi hơn! Bản cập nhật này mang đến theo dõi tốt hơn, hiệu suất nhanh hơn và giao diện sạch hơn để giữ cho việc học của bạn đúng hướng.",
        "id": "📈 Lebih banyak kemajuan, lebih sedikit bug! Pembaruan ini membawa pelacakan yang lebih baik, kinerja lebih cepat, dan antarmuka yang lebih bersih untuk menjaga pembelajaran Anda tetap di jalur.",
        "ms": "📈 Lebih banyak kemajuan, kurang pepijat! Kemas kini ini membawa penjejakan yang lebih baik, prestasi yang lebih pantas, dan antara muka yang lebih bersih untuk mengekalkan pembelajaran anda di landasan yang betul.",
        "uk": "📈 Більше прогресу, менше помилок! Це оновлення приносить краще відстеження, швидшу продуктивність і чистіший інтерфейс, щоб тримати ваше навчання на правильному шляху.",
        "cs": "📈 Více pokroku, méně chyb! Tato aktualizace přináší lepší sledování, rychlejší výkon a čistší rozhraní, aby vaše učení zůstalo na správné cestě.",
        "el": "📈 Περισσότερη πρόοδος, λιγότερα σφάλματα! Αυτή η ενημέρωση φέρνει καλύτερη παρακολούθηση, ταχύτερη απόδοση και καθαρότερη διεπαφή για να κρατήσει τη μάθησή σας στο σωστό δρόμο.",
        "he": "📈 יותר התקדמות, פחותבאגים! העדכון הזה מביא מעקב טוב יותר, ביצועים מהירים יותר וממשק נקי יותר כדי לשמור על הלמידה שלך במסלול הנכון.",
        "ro": "📈 Mai mult progres, mai puține erori! Această actualizare aduce urmărire mai bună, performanță mai rapidă și o interfață mai curată pentru a menține învățarea ta pe drumul cel bun.",
        "hu": "📈 Több haladás, kevesebb hiba! Ez a frissítés jobb nyomon követést, gyorsabb teljesítményt és tisztább felületet hoz, hogy a tanulásodat a helyes úton tartsa."
    },
    # Message 10 (index 9)
    {
        "pt-BR": "🎉 Atualização completa – modo de sucesso LIGADO! Prepare-se para uma experiência de preparação Telc mais motivadora, estável e eficiente. Atualize e continue avançando em direção ao seu objetivo!",
        "ja": "🎉 アップデート完了 – 成功モードON！より意欲的で、安定した、効率的なTelc準備体験に備えてください。更新して、目標に向かって進み続けましょう！",
        "ko": "🎉 업데이트 완료 – 성공 모드 ON! 더 의욕적이고 안정적이며 효율적인 Telc 준비 경험을 준비하세요. 업데이트하고 목표를 향해 계속 나아가세요!",
        "zh": "🎉 更新完成 – 成功模式已开启！准备迎接更具激励性、更稳定、更高效的Telc备考体验。更新并继续朝着目标前进！",
        "zh-TW": "🎉 更新完成 – 成功模式已開啟！準備迎接更具激勵性、更穩定、更高效的Telc備考體驗。更新並繼續朝著目標前進！",
        "hi": "🎉 अपडेट पूर्ण – सफलता मोड चालू! अधिक प्रेरक, स्थिर और कुशल Telc तैयारी अनुभव के लिए तैयार हो जाएं। अपडेट करें और अपने लक्ष्य की ओर बढ़ते रहें!",
        "nl": "🎉 Update voltooid – succesmodus AAN! Bereid je voor op een meer motiverende, stabiele en efficiënte Telc-voorbereidingservaring. Update en blijf op weg naar je doel!",
        "pl": "🎉 Aktualizacja ukończona – tryb sukcesu WŁĄCZONY! Przygotuj się na bardziej motywujące, stabilne i wydajne doświadczenie przygotowawcze do Telc. Zaktualizuj i kontynuuj dążenie do celu!",
        "sv": "🎉 Uppdatering klar – framgångsläge PÅ! Gör dig redo för en mer motiverande, stabil och effektiv Telc-förberedelseupplevelse. Uppdatera och fortsätt mot ditt mål!",
        "da": "🎉 Opdatering fuldført – succestilstand TIL! Gør dig klar til en mere motiverende, stabil og effektiv Telc-forberedelsesoplevelse. Opdater og fortsæt med at bevæge dig mod dit mål!",
        "fi": "🎉 Päivitys valmis – menestystila PÄÄLLÄ! Valmistaudu motivoivampaan, vakaampaan ja tehokkaampaan Telc-valmistautumiskokemukseen. Päivitä ja jatka etenemistä kohti tavoitettasi!",
        "nb": "🎉 Oppdatering fullført – suksessmodus PÅ! Gjør deg klar for en mer motiverende, stabil og effektiv Telc-forberedelsesopplevelse. Oppdater og fortsett mot målet ditt!",
        "th": "🎉 อัปเดตเสร็จสมบูรณ์ – โหมดความสำเร็จเปิด! เตรียมพร้อมสำหรับประสบการณ์การเตรียมตัว Telc ที่สร้างแรงบันดาลใจ เสถียร และมีประสิทธิภาพมากขึ้น อัปเดตและเดินหน้าสู่เป้าหมายของคุณต่อไป!",
        "vi": "🎉 Hoàn tất cập nhật – chế độ thành công BẬT! Sẵn sàng cho trải nghiệm chuẩn bị Telc mang tính động lực, ổn định và hiệu quả hơn. Cập nhật và tiếp tục tiến tới mục tiêu của bạn!",
        "id": "🎉 Pembaruan selesai – mode sukses AKTIF! Bersiaplah untuk pengalaman persiapan Telc yang lebih memotivasi, stabil, dan efisien. Perbarui dan terus bergerak menuju tujuan Anda!",
        "ms": "🎉 Kemas kini selesai – mod kejayaan HIDUP! Bersedia untuk pengalaman persediaan Telc yang lebih bermotivasi, stabil, dan cekap. Kemas kini dan terus bergerak ke arah matlamat anda!",
        "uk": "🎉 Оновлення завершено – режим успіху УВІМКНЕНО! Готуйтеся до більш мотивуючого, стабільного та ефективного досвіду підготовки до Telc. Оновіть і продовжуйте рухатися до своєї мети!",
        "cs": "🎉 Aktualizace dokončena – režim úspěchu ZAPNUTÝ! Připravte se na motivující, stabilnější a efektivnější zkušenost s přípravou na Telc. Aktualizujte a pokračujte směrem k vašemu cíli!",
        "el": "🎉 Ενημέρωση ολοκληρώθηκε – λειτουργία επιτυχίας ΕΝΕΡΓΗ! Ετοιμαστείτε για μια πιο παρακινητική, σταθερή και αποδοτική εμπειρία προετοιμασίας Telc. Ενημερώστε και συνεχίστε να κινείστε προς τον στόχο σας!",
        "he": "🎉 העדכון הושלם – מצב הצלחה מופעל! התכונן לחוויית הכנה ל-Telc מעוררת מוטיבציה, יציבה ויעילה יותר. עדכן והמשך לנוע לקראת המטרה שלך!",
        "ro": "🎉 Actualizare completată – modul succes ACTIVAT! Pregătește-te pentru o experiență de pregătire Telc mai motivantă, stabilă și eficientă. Actualizează și continuă să te miști spre obiectivul tău!",
        "hu": "🎉 Frissítés kész – sikermód BEKAPCSOLVA! Készülj fel egy motiválóbb, stabilabb és hatékonyabb Telc felkészülési élményre. Frissíts és haladj tovább a célod felé!"
    }
]

# Add translations to messages 5-10
for i in range(4, 10):
    for key, value in additional_translations[i-4].items():
        messages[i][key] = value

# Write the updated file
with open('app/update-messages.json', 'w', encoding='utf-8') as f:
    json.dump(messages, f, ensure_ascii=False, indent=2)

print("✅ Successfully added all missing locale translations!")
print(f"📊 Total messages: {len(messages)}")
print(f"📊 Locales per message: {len(messages[0])}")
