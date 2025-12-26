# Localization TODO

## Prep Plan Feature - Translation Required

This document tracks the translation status for the Exam Prep Plan feature across all supported languages.

### Languages to translate:
- ✅ English (en.json) - COMPLETE (baseline)
- ⏳ German (de.json) - PENDING
- ⏳ Arabic (ar.json) - PENDING
- ⏳ Spanish (es.json) - PENDING
- ⏳ Russian (ru.json) - PENDING
- ⏳ French (fr.json) - PENDING

### Sections needing translation:

#### 1. prepPlan.* (all nested keys)
Complete section with nested objects for:
- home (new/active/inProgress states)
- onboarding (welcome, examDate, schedule, studyTime, summary, errors)
- diagnostic (title, sections, progress)
- results (sectionBreakdown, strengths, weaknesses, level indicators)
- dashboard (progress stats, tasks, quick actions, errors)
- weekly (week navigation, focus areas, tasks, difficulty levels)
- progress (readiness scores, section progress, weekly performance, consistency)
- settings (configuration updates, validation, confirmation modals)

**Lines in en.json:** 165-362

#### 2. errorBoundary.* (error handling)
Error boundary UI for graceful error handling:
- title
- message
- retry
- goHome
- reportIssue

**Lines in en.json:** 1353-1359

#### 3. speaking.* (new error keys)
Additional error messages for speaking component:
- networkError
- audioError
- apiError
- retryButton
- contactSupport

**Lines in en.json:** 915-919

---

## Translation Status

### German (de.json)
- [ ] prepPlan.* - 0% complete
- [ ] errorBoundary.* - 0% complete
- [ ] speaking.* (new keys) - 0% complete
- **Status:** Not started
- **Estimated effort:** 4-6 hours

### Arabic (ar.json)
- [ ] prepPlan.* - 0% complete
- [ ] errorBoundary.* - 0% complete
- [ ] speaking.* (new keys) - 0% complete
- **Status:** Not started
- **Estimated effort:** 4-6 hours
- **Note:** Requires RTL layout testing after translation

### Spanish (es.json)
- [ ] prepPlan.* - 0% complete
- [ ] errorBoundary.* - 0% complete
- [ ] speaking.* (new keys) - 0% complete
- **Status:** Not started
- **Estimated effort:** 4-6 hours

### Russian (ru.json)
- [ ] prepPlan.* - 0% complete
- [ ] errorBoundary.* - 0% complete
- [ ] speaking.* (new keys) - 0% complete
- **Status:** Not started
- **Estimated effort:** 4-6 hours

### French (fr.json)
- [ ] prepPlan.* - 0% complete
- [ ] errorBoundary.* - 0% complete
- [ ] speaking.* (new keys) - 0% complete
- **Status:** Not started
- **Estimated effort:** 4-6 hours

---

## Translation Process

### Recommended Workflow:
1. Use professional translator OR AI translation service (DeepL, ChatGPT)
2. Copy the exact structure from `en.json`
3. Replace only the string values (keep keys identical)
4. Preserve all interpolation variables: `{{variable}}`
5. Maintain formatting like icons (emojis) and punctuation
6. Test in-app to ensure proper display
7. For Arabic: Test RTL layout thoroughly

### Example Translation Structure:

**English (en.json):**
```json
"prepPlan": {
  "onboarding": {
    "title": "Exam Prep Plan",
    "examDate": {
      "title": "When is your exam?",
      "daysUntilExam": "{{days}} days until exam"
    }
  }
}
```

**German (de.json):**
```json
"prepPlan": {
  "onboarding": {
    "title": "Prüfungsvorbereitungsplan",
    "examDate": {
      "title": "Wann ist Ihre Prüfung?",
      "daysUntilExam": "{{days}} Tage bis zur Prüfung"
    }
  }
}
```

### Quality Checklist:
- [ ] All keys match exactly between languages
- [ ] All interpolation variables preserved: `{{variable}}`
- [ ] Pluralization handled correctly (use `_plural` suffix where needed)
- [ ] Cultural considerations (date formats, greetings, etc.)
- [ ] Proper capitalization and punctuation
- [ ] Icons/emojis preserved or culturally adapted
- [ ] No untranslated strings remaining
- [ ] Tested in app with real data

---

## Verification

After completing translations, run the verification script:

```bash
cd app/GermanTelcB1App
./scripts/verify-i18n.sh
```

This will check:
- Missing keys across language files
- Unused keys
- Inconsistent interpolation variables
- Structural differences

---

## Priority

**High Priority (Phase 7 requirement):**
- German (de.json) - Primary language for TELC exam

**Medium Priority:**
- Arabic (ar.json) - Large user base
- Spanish (es.json) - Growing user base

**Lower Priority:**
- Russian (ru.json)
- French (fr.json)

---

## Notes

- All translation work is deferred to professional translators or AI-assisted translation
- The English baseline (`en.json`) is complete and serves as the source of truth
- Do NOT use Google Translate for production translations - use DeepL or professional service
- Consider context when translating (exam prep is formal, dashboard is conversational)
- Some terms like "TELC" and "AI" should remain untranslated
- Badge indicators like "⭐ PREMIUM" should be adapted per language norms

---

## Contact

For translation questions or to report issues:
- Check the `en.json` file for context
- Review existing translations in the app for style consistency
- Test translations in the app before committing

