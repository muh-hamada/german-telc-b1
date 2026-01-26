# Speaking Dialogue Generation

### Important Format Rules:
- **AI Turns:** Use the key `"text"`. The text should NOT mention "telc". Use greetings that fit all times of the day, like Hello and Welcome.
- **User Turns:** Use the key `"instruction"`.
- **Instruction Format:** The `instruction` must be an object containing translations for the following language codes: `de`, `ar`, `en`, `ru`, `es`, `fr`.
- **Instruction Content:** Describe what the user is expected to say or do in that turn, translated into each of the 6 languages.
- audio_url: only for the AI turn. Keep it with the placeholder. I will add the url later.

---

## 1. German A1 (TELC)
Generate a realistic TELC German A1 speaking assessment dialogue in JSON format.
The dialogue must cover:
1. **Part 1: Personal Introduction** (AI asks simple introductory questions)
2. **Part 2: Planning Task** (AI and user plan a simple meeting or shopping trip)
3. **Part 3: Opinion/Question** (AI asks a basic question about a daily topic)

Requirements:
- Difficulty: Strictly A1 level.
- Language: Entirely in German.
- Format: Return ONLY a JSON array.
  - For AI: `{"speaker": "ai", "text": "...", "audio_url": "PLACEHOLDER"}`
  - For User: `{"speaker": "user", "instruction": {"de": "...", "ar": "...", "en": "...", "ru": "...", "es": "...", "fr": "..."}}`
- Length: 6-8 exchanges.

---

## 2. German B1 (TELC)
Generate a realistic TELC German B1 speaking assessment dialogue in JSON format.
The dialogue must cover:
1. **Part 1: Personal Introduction** (AI asks about hobbies/work)
2. **Part 2: Planning Task** (AI and user plan an event together, e.g., a party or excursion)
3. **Part 3: Opinion Sharing** (AI asks for the user's opinion on a specific topic like 'Media' or 'Environment')

Requirements:
- Difficulty: Strictly B1 level.
- Language: Entirely in German.
- Format: Return ONLY a JSON array.
  - For AI: `{"speaker": "ai", "text": "...", "audio_url": "PLACEHOLDER"}`
  - For User: `{"speaker": "user", "instruction": {"de": "...", "ar": "...", "en": "...", "ru": "...", "es": "...", "fr": "..."}}`
- Length: 8-10 exchanges.

---

## 3. German B2 (TELC)
Generate a realistic TELC German B2 speaking assessment dialogue in JSON format.
The dialogue must cover:
1. **Part 1: Presentation** (AI asks the user to start their presentation; User gives a short presentation; AI asks 1-2 follow-up questions)
2. **Part 2: Discussion** (AI and user discuss a controversial topic or article)
3. **Part 3: Problem Solving** (AI and user solve a complex organizational problem together)

Requirements:
- Difficulty: Strictly B2 level.
- Language: Entirely in German.
- Format: Return ONLY a JSON array.
  - For AI: `{"speaker": "ai", "text": "...", "audio_url": "PLACEHOLDER"}`
  - For User: `{"speaker": "user", "instruction": {"de": "...", "ar": "...", "en": "...", "ru": "...", "es": "...", "fr": "..."}}`
- Length: 10-12 exchanges.

---

## 4. English A1 (TELC)
Generate a realistic TELC English A1 speaking assessment dialogue in JSON format.
The dialogue must cover:
1. **Part 1: Personal Introduction** (AI asks simple introductory questions)
2. **Part 2: Planning Task** (AI and user plan a simple meeting or activity)
3. **Part 3: Opinion/Question** (AI asks a basic question about a daily topic)

Requirements:
- Difficulty: Strictly A1 level.
- Language: Entirely in English.
- Format: Return ONLY a JSON array.
  - For AI: `{"speaker": "ai", "text": "...", "audio_url": "PLACEHOLDER"}`
  - For User: `{"speaker": "user", "instruction": {"de": "...", "ar": "...", "en": "...", "ru": "...", "es": "...", "fr": "..."}}`
- Length: 6-8 exchanges.

---

## 5. English B1 (TELC)
Generate a realistic TELC English B1 speaking assessment dialogue in JSON format.
The dialogue must cover:
1. **Part 1: Personal Introduction** (AI asks about interests/routine)
2. **Part 2: Planning Task** (AI and user plan an event together)
3. **Part 3: Opinion Sharing** (AI asks for the user's opinion on a specific topic)

Requirements:
- Difficulty: Strictly B1 level.
- Language: Entirely in English.
- Format: Return ONLY a JSON array.
  - For AI: `{"speaker": "ai", "text": "...", "audio_url": "PLACEHOLDER"}`
  - For User: `{"speaker": "user", "instruction": {"de": "...", "ar": "...", "en": "...", "ru": "...", "es": "...", "fr": "..."}}`
- Length: 8-10 exchanges.

---

## 6. English B2 (TELC)
Generate a realistic TELC English B2 speaking assessment dialogue in JSON format.
The dialogue must cover:
1. **Part 1: Presentation** (AI asks the user to start their presentation; User gives a short presentation; AI asks 1-2 follow-up questions)
2. **Part 2: Discussion** (AI and user discuss a relevant social topic)
3. **Part 3: Problem Solving** (AI and user collaborate on a task)

Requirements:
- Difficulty: Strictly B2 level.
- Language: Entirely in English.
- Format: Return ONLY a JSON array.
  - For AI: `{"speaker": "ai", "text": "...", "audio_url": "PLACEHOLDER"}`
  - For User: `{"speaker": "user", "instruction": {"de": "...", "ar": "...", "en": "...", "ru": "...", "es": "...", "fr": "..."}}`
- Length: 10-12 exchanges.

---

## 7. Spanish B1 (DELE)
Generate a realistic DELE Spanish B1 speaking assessment dialogue in JSON format.
The dialogue must cover:
1. **Task 1: Monologue** (AI asks the user to talk about themselves, their daily routine, interests, or past experiences)
2. **Task 2: Dialogue** (AI and user have a conversation about everyday situations like shopping, travel, or making plans)
3. **Task 3: Conversation** (AI and user discuss a specific topic, expressing opinions and describing events)

Requirements:
- Difficulty: Strictly B1 level (DELE Spanish B1 standard).
- Language: Entirely in Spanish.
- Format: Return ONLY a JSON array.
  - For AI: `{"speaker": "ai", "text": "...", "audio_url": "PLACEHOLDER"}`
  - For User: `{"speaker": "user", "instruction": {"de": "...", "ar": "...", "en": "...", "ru": "...", "es": "...", "fr": "..."}}`
- Length: 8-10 exchanges.
- Context: Use neutral greetings that work for any time of day (e.g., "Hola" instead of "Buenos días").
- Topics: Focus on familiar topics such as work, studies, leisure, travel, personal experiences, and everyday situations.
