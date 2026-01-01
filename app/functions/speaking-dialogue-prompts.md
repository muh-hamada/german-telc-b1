# Speaking Dialogue Generation Prompts

Use these prompts to generate the static dialogues. Save the output of each as a JSON file in `app/functions/src/data/` or append them to a central JSON file.

### Important Format Rules:
- **AI Turns:** Use the key `"text"`.
- **User Turns:** Use the key `"instruction"`.
- **Instruction Format:** The `instruction` must be an object containing translations for the following language codes: `de`, `ar`, `en`, `ru`, `es`, `fr`.
- **Instruction Content:** Describe what the user is expected to say or do in that turn, translated into each of the 6 languages.
- audio_url: only for the AI turn. Keep it with the placeholder. I will add the url later.

---

## 1. German A1 (TELC)
**Prompt:**
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
**Prompt:**
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
**Prompt:**
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
**Prompt:**
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
**Prompt:**
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
**Prompt:**
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
