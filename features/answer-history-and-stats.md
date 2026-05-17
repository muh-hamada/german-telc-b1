# Feature Spec: Answer History & Section Stats

## 1. How Answers Are Stored Today

### Storage Backends

| User State | Storage Backend | Location |
|---|---|---|
| **Authenticated** | Firebase Firestore | Path from `activeExamConfig.firebaseCollections.userProgress` (e.g., `users/{uid}/progress` for B1, `users/{uid}/german_b2_progress` for B2) |
| **Anonymous (not logged in)** | AsyncStorage (on-device only) | Key: `user_progress` |

**Anonymous user behaviour**: Progress is fully stored locally. When the user signs in for the first time, local progress is automatically migrated to Firestore and the local copy is cleared. If both local and Firebase data exist (e.g., re-login on a new device), they are merged — the most recently attempted exam wins per `(examType, examId)` pair.

There is **no anonymous user record in Firestore**. Anonymous progress lives purely in AsyncStorage and is lost if the user uninstalls the app without ever signing in.

---

### Core Data Types

#### `UserAnswer`
The atomic unit — one answer per question within an exam attempt.

```ts
interface UserAnswer {
  questionId: number;       // e.g. 1, 2, 3 — matches question ID in exam data
  answer: string;           // The user's selected/typed answer
  isCorrect: boolean;       // Whether the answer was marked correct
  timestamp: number;        // Unix ms when this answer was submitted
  correctAnswer?: string;   // The correct answer (stored for review)
  explanation?: Record<string, string>; // Localised explanation text
  transcript?: string;      // For speaking/listening questions
  assessment?: any;         // WritingAssessment blob for writing exams
}
```

#### `ExamProgress`
One record per `(examType, examId)` pair. Only the **most recent** attempt is stored inline; all historical attempts are preserved in `historicalResults`.

```ts
interface ExamProgress {
  examId: string;           // e.g. "1", "2" — matches exam data ID
  examType: ExamType;       // see ExamType enum below
  answers: UserAnswer[];    // Answers from the LAST attempt only
  completed: boolean;
  score?: number;           // Correct answers in last attempt
  maxScore?: number;        // Total questions in last attempt
  lastAttempt: number;      // Unix ms of last attempt
  historicalResults?: HistoricalResult[]; // Every attempt's score/maxScore
}

interface HistoricalResult {
  timestamp: number;
  score: number;
  maxScore: number;
}
```

#### `ExamType` — all values in use

```ts
type ExamType =
  | 'grammar-part1'
  | 'grammar-part2'
  | 'reading-part1'
  | 'reading-part2'
  | 'reading-part3'
  | 'writing'
  | 'writing-part1'
  | 'writing-part2'
  | 'speaking-part1'
  | 'speaking-part2'
  | 'speaking-part3'
  | 'listening-practice'
  | 'listening-part1'
  | 'listening-part2'
  | 'listening-part3';
```

#### `UserProgress`
The top-level document stored in Firestore (or AsyncStorage).

```ts
interface UserProgress {
  userId?: string;
  exams: ExamProgress[];            // One entry per (examType, examId) pair
  totalScore: number;               // Sum of all latest exam scores
  totalMaxScore: number;            // Sum of all latest exam maxScores
  lastUpdated: number;              // Unix ms
  historicalTotalScores?: HistoricalTotalScore[]; // Aggregated score history
}

interface HistoricalTotalScore {
  timestamp: number;
  totalScore: number;
  totalMaxScore: number;
}
```

---

### Second Firestore Collection: `examResults`

In addition to the progress document, every completed exam also writes an **immutable result document** to the top-level `examResults` collection:

```
examResults/{auto-id}
  uid: string
  examType: string
  examId: string
  answers: UserAnswer[]
  score: number
  maxScore: number
  percentage: number
  completedAt: Timestamp
```

This collection is append-only — it is never read back in the current app. It exists for potential backend analytics. **For the two new features below, all reads come from the `userProgress` document, not `examResults`.**

---

### Write Flow (per exam submission)

```
Screen.handleComplete(score, answers)
  └─> ProgressContext.updateExamProgress(examType, examId, answers, score, maxScore)
        ├─ [if authenticated] FirebaseProgressService.updateExamProgress(uid, ...)
        │     ├─ FirestoreService.updateExamProgress(uid, ...)   ← reads + writes userProgress doc
        │     └─ FirestoreService.saveExamResult(uid, ...)       ← appends to examResults collection
        └─ [if anonymous]    StorageService.updateExamProgress(...)  ← writes to AsyncStorage
```

---

### What Is NOT Stored

- **In-progress / partial answers** — answers are only saved when the user submits the full exam (taps "Submit" / "Check Answers"). There is no draft/autosave mechanism.
- **Per-question timing** — no time-per-question is recorded.
- **Attempt count per exam** — inferrable from `historicalResults.length`, but not stored as a dedicated field.

---

## 2. Feature 1 — Load Last Answer Modal

### Goal
When a user opens an exam they have previously attempted, show a modal asking:
- **"Resume"** → pre-populate the UI with their last saved answers
- **"Start Fresh"** → open the exam with a blank state

### Data Available
`getExamProgress(examType, examId)` (already in `ProgressContext`) returns the `ExamProgress` for that `(examType, examId)`. The `answers` array on that object contains the last attempt's full `UserAnswer[]`, keyed by `questionId`.

### Logic
- If `ExamProgress` exists and `answers.length > 0` → show the modal
- If no prior record, open the exam directly (no modal)
- Anonymous users: same logic — their progress comes from AsyncStorage via the same `getExamProgress` API

### Key Questions — Resolved
1. **UI entry point**: ✅ Modal appears after exam data loads inside the screen, not on the ExamSelectionModal.
2. **Answer format per exam type**: ✅ Each UI component converts `UserAnswer[]` to its internal state format (see Implementation below).
3. **Partial vs full attempts**: ✅ Only matching `questionId` entries are restored; missing questions remain blank.
4. **Writing exams**: ✅ Only the raw written text is restored (`initialAnswers?.[0]?.answer`), not the AI assessment.

### Implementation — Complete ✅

#### New Files

| File | Purpose |
|---|---|
| `src/components/ResumeExamModal.tsx` | Reusable modal component. Shows last score, answered count, last attempt date. "Resume" and "Start Fresh" buttons. Uses `useAppTheme()` for dark/light mode. |

#### Translations (6 locales: en, de, ar, es, fr, ru)

Added `resume.*` section to each locale file with keys: `title`, `message`, `lastScore`, `answeredCount`, `lastAttempt`, `resumeButton`, `startFresh`.

#### UI Components Modified (22 files in `src/components/exam-ui/`)

All UI components received an `initialAnswers?: UserAnswer[]` prop. Each converts `UserAnswer[]` to its internal state format during `useState` initialization:

| Group | UI Components | Internal State | Conversion |
|---|---|---|---|
| **A — Direct** | `ListeningPart1UI`, `ListeningPart1UIA1`, `ListeningPart2UI`, `ListeningPart2UIA1`, `ListeningPart2A2UI`, `ListeningPart3UI`, `ListeningPart3UIA1` | `UserAnswer[]` | `initialAnswers ?? []` |
| **B — Boolean** | `ReadingPart1A1UI`, `ReadingPart2A2UI`, `ReadingPart3A1UI` | `{ [key: number]: boolean }` | `ua.answer === 'true'` |
| **C — String key** | `ReadingPart1UI`, `ReadingPart3UI`, `ReadingPart3A2UI`, `DeleReadingPart1UI`, `DeleReadingPart3UI`, `ListeningPart1A2UI`, `ListeningPart3A2UI`, `LanguagePart2UI` | `{ [key: number]: string }` | Direct `ua.answer` mapping |
| **D — Gap ID** | `DeleGrammarPart1UI` | `{ [gapId: string]: string }` | `ua.questionId.toString()` → `ua.answer` |
| **E — Index lookup** | `LanguagePart1UI`, `ReadingPart2UI`, `DeleReadingPart2UI`, `DeleGrammarPart2UI` | `{ [key: number]: number }` | `findIndex(opt => opt.text === ua.answer)`, wrapped in try/catch |
| **F — parseInt** | `ReadingPart1A2UI`, `ReadingPart2A1UI` | `{ [key: number]: number }` | `parseInt(ua.answer, 10)`, skip if `isNaN` |
| **G — Complex** | `DeleListeningUI` | Mixed | Parts 1-3: option index lookup; Parts 4-5: `ua.answer.toLowerCase()` |
| **H — Text** | `WritingPart2UIA1` | `string` | `initialAnswers?.[0]?.answer ?? ''` |

All Group E and G initializers are wrapped in `try/catch` with empty-state fallback for safety.

#### Practice Screens Modified (23 screens in `src/screens/practice/`)

Each screen received the same pattern:

1. **Imports**: `ExamProgress` from `exam.types`, `ResumeExamModal` from `../../components/ResumeExamModal`
2. **State**: `uiKey` (number), `resumedAnswers` (UserAnswer[] | undefined), `showResumeModal` (boolean), `savedProgress` (ExamProgress | null)
3. **Progress check**: After exam data loads, calls `getExamProgress(examType, String(id))`. If answers exist, sets `savedProgress` and `showResumeModal(true)`.
4. **Modal JSX**: `<ResumeExamModal>` rendered in the main return block (not in loading/error conditionals).
5. **UI remount**: `key={uiKey}` on UI component forces remount on Resume/Start Fresh. `initialAnswers={resumedAnswers}` passes saved answers.

| Section | Screens |
|---|---|
| Grammar | `GrammarPart1Screen`, `GrammarPart2Screen` |
| Reading | `ReadingPart1Screen`, `ReadingPart1A1Screen`, `ReadingPart1A2Screen`, `ReadingPart2Screen`, `ReadingPart2A1Screen`, `ReadingPart2A2Screen`, `ReadingPart3Screen`, `ReadingPart3A1Screen`, `ReadingPart3A2Screen` |
| Listening | `ListeningPart1Screen`, `ListeningPart1A1Screen`, `ListeningPart1A2Screen`, `ListeningPart2Screen`, `ListeningPart2A1Screen`, `ListeningPart2A2Screen`, `ListeningPart3Screen`, `ListeningPart3A1Screen`, `ListeningPart3A2Screen`, `ListeningPart4Screen`, `ListeningPart5Screen` |
| Writing | `WritingPart1Screen`, `WritingPart2Screen` |

#### Safety Measures
- All `initialAnswers` usage is null-safe (`?? []`, `?? ''`, optional chaining)
- Index-lookup conversions (Group E/G) use try/catch with fallback to empty state
- `parseInt` conversions (Group F) check for `isNaN` before assignment
- Modal handles `savedProgress: null` — returns `null` (renders nothing)
- `key={uiKey}` pattern ensures clean remount — no stale state mixing

#### Bugs Found & Fixed During Testing

**examId type mismatch in `getExamProgress`** — `updateExamProgress` receives `examId` as a JS number (from `route.params?.examId ?? 0`) even though the TypeScript signature declares `string`. At runtime the value is stored as a number (e.g. `0`). `getExamProgress` then searches with `String(id)` (e.g. `"0"`). Strict equality `0 === "0"` is `false`, so the lookup always returned `null` and the modal never appeared. **Fix:** changed `getExamProgress` to compare with `String(exam.examId) === String(examId)`, coercing both sides to string.

**Modal placement inside `isLoading` conditional** — In 21 of 23 screens the `<ResumeExamModal>` JSX was rendered inside the `if (isLoading)` early return block. The progress check runs after data loads (when `isLoading` becomes `false`), so the modal was unmounted before it could display. **Fix:** moved `<ResumeExamModal>` to the main `return` block in all screens.

**GrammarPart2Screen missing `catch` block** — `Alert.alert(failedToLoad)` was placed outside the `try/catch`, so the error alert fired on every load regardless of success or failure. **Fix:** added the missing `catch` keyword to properly scope the alert.

**WritingPart1Screen not implemented** — The screen was missed in the initial pass. Added full resume modal support (imports, state vars, progress check, `ResumeExamModal` JSX, `key={uiKey}`, `initialAnswers`). Also added `initialAnswers?: UserAnswer[]` prop to `WritingPart1UIA1` with mapping from `ua.questionId` → `field.question_number` → `field.id`.

**Writing Part 2 score displayed as `0/1` instead of `0/10`** — `WritingPart2Screen.handleComplete` passed `answers.length` (always `1` for a single writing submission) as `maxScore` to `updateExamProgress`. Writing evaluation scores are on a 10-point scale. Two-part fix:
- **`WritingPart2Screen`**: now reads `answers[0]?.assessment?.maxScore` from the evaluation result and uses it as `maxScore`, falling back to `answers.length`.
- **`ResumeExamModal`**: now derives `effectiveMaxScore` from `savedProgress.answers[0]?.assessment?.maxScore` before falling back to `savedProgress.maxScore`. This retroactively fixes the display for any existing saved progress that has `maxScore: 1` but contains the full assessment blob. Safe for all other exam types — `assessment.maxScore` is only present on writing evaluation answers (Part 2 / WritingUI), never on reading, listening, grammar, or WritingPart1 answers.

#### Feature 1 — Status: Complete ✅
User-tested and confirmed working: Reading Part 2 modal, Grammar Part 2 loads, Writing Part 1 modal, Writing Part 2 score display. Debug logs still present in `ProgressContext.tsx` and `ReadingPart2Screen.tsx` — remove before release.

---

## 3. Feature 2 — Section Stats on Menu Screens

### Goal
On section menu screens (e.g., `ReadingMenuScreen`, and equivalents for Grammar, Listening, Writing), show a compact stats summary with:
- How many exams have been attempted per part
- Average score (%) per part
- A "View Details" button that opens a modal with more data (and potentially a chart)

### Data Available per Section
From `userProgress.exams` (already in context), filter by `examType`:

For the Reading section (example):
```
reading-part1 exams → { attempted: N, avgScore: X% }
reading-part2 exams → { attempted: N, avgScore: X% }
reading-part3 exams → { attempted: N, avgScore: X% }
```

Each `ExamProgress` has:
- `score` / `maxScore` → percentage for most recent attempt
- `historicalResults[]` → all attempts, enabling trend/average-over-time chart

### Compact UI Component (inline on menu screen)
Should be visually small — one row or a tight card — not dominating the screen. Suggested content:

```
Reading Progress
Part 1: 3 attempts · avg 72%
Part 2: 1 attempt  · avg 60%
Part 3: 0 attempts
                     [Details →]
```

### Detail Modal Content
Opens when user taps "Details →":
- Per-part breakdown table (attempts, best score, average score)
- If `historicalResults` has ≥ 3 entries for any part → show a simple line chart of score over time
- Show when the section was last practiced (`lastAttempt`)

### Schema Analysis for Stats Computation
The data needed is entirely available in `userProgress.exams` (already loaded in context). No new Firestore reads required. Computation is pure client-side:

```ts
// Pseudocode — derive section stats from existing context data
function getSectionStats(userProgress: UserProgress, examTypes: ExamType[]) {
  return examTypes.map(examType => {
    const exams = userProgress.exams.filter(e => e.examType === examType);
    const attempted = exams.length;
    const avgScore = attempted > 0
      ? Math.round(exams.reduce((sum, e) => sum + (e.score || 0) / (e.maxScore || 1) * 100, 0) / attempted)
      : null;
    const lastAttempt = attempted > 0
      ? Math.max(...exams.map(e => e.lastAttempt))
      : null;
    return { examType, attempted, avgScore, lastAttempt };
  });
}
```

### Key Questions to Resolve Before Building
1. **Screens to update**: `ReadingMenuScreen`, `GrammarMenuScreen` (if exists), `ListeningMenuScreen` (if exists), `WritingMenuScreen` (if exists) — verify all section menu screens.
2. **Empty state**: What to show if the user has zero attempts in a section? Options: hide the component entirely, or show a "No practice yet" placeholder.
3. **Anonymous users**: Stats should show for anonymous users too (data from AsyncStorage). The same `userProgress` context is populated for both cases — no special handling needed.
4. **Chart library**: Confirm what charting library is available in the project before committing to the detail modal graph.
5. **Compact component placement**: Should the stats appear above the part cards (before the list), or inline inside each card? Above is simpler; inline requires modifying the `Card` component.

---

## 4. Implementation Notes for Both Features

### Accessing Progress
Both features use `useProgress()` from `ProgressContext`. The hook already exposes:
- `userProgress: UserProgress | null` — the full progress object
- `getExamProgress(examType, examId): ExamProgress | null` — for Feature 1

No new services or Firestore reads are needed for either feature.

### Anonymous Users
Both features work identically for anonymous users — `ProgressContext` loads from AsyncStorage when no user is logged in, and exposes the same shape. No special anonymous-user handling is needed in either feature.

### Performance
`userProgress.exams` is loaded once at app boot and updated in-memory after each submission. Stats computation is O(n) over the exams array — fast enough to run inline without memoization concerns, though `useMemo` is recommended for the menu screen component.

### Data Gaps / Edge Cases
- An exam with `answers: []` but `completed: true` exists for `listening-practice` (tracked as a binary complete/incomplete, no questions). Filter these out of score averages.
- `historicalResults` may not exist on older records (added in a later migration). Always default to `[]`.
- `maxScore` can be `0` in edge cases — always guard against division by zero.
