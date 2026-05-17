# AdMob "Encouraging Clicks" Policy Violation Report

**Date:** 22 April 2026  
**App:** German Exam Prep | B1 Prüfung (iOS)  
**Violation:** Encouraging Clicks — Policy Issue  
**AdMob Status:** Disabled ad serving (reported 22 April 2026)  
**Status:** ✅ Fixed — 22 April 2026

---

## 1. Violation Summary

AdMob flagged the app for **"Encouraging Clicks"** and disabled ad serving entirely. The violation is under the [Policies for ad units that offer rewards](https://support.google.com/admob/answer/7313578), specifically **Implementation requirement #2**:

> Publishers must not include any text or icons, **other than to describe the reward(s) offered**, to mislead or incentivize users towards a particular choice **(such as by indicating "watch this ad to support our business").**

The app contained a "Support us by watching an ad" feature that used emotional/charity-based language to encourage users to watch rewarded ads — with no actual in-app reward given. Google explicitly lists this exact phrasing as a prohibited example.

---

## 2. All Violating Content

### 2.1 Locale Strings (all 6 languages)

| Key | English Text | Violation Reason |
|---|---|---|
| `supportAd.title` | "Support us by watching an ad" | Almost verbatim match to Google's prohibited example |
| `supportAd.subtitle` | "Tap to watch" | No reward described |
| `supportAd.thankYou` | "Thank You!" | Emotional reinforcement |
| `supportAd.appreciation` | "Your support means the world to us and helps keep this app free for everyone." | Emotional/guilt-based incentive |
| `supportAdModal.title` | "Support Us!" | Emotional incentive |
| `supportAdModal.subtitle` | "Help keep this app free by watching a short ad." | Charity framing, no reward |
| `writing.rewardedAdModal.message` | "...Watching this short ad helps keep our service free for everyone." | "Support our business" framing |
| `writing.rewardedAdModal.title` | "AI Evaluation Support" | Word "Support" in context of ads |

### 2.2 UI Elements

| Component | Location | Violation |
|---|---|---|
| `SupportAdButton` | HomeScreen, ProfileScreen | Heart icon (❤️) next to ad button draws emotional attention to ad unit |
| `SupportThankYouModal` | After watching any support ad | `hearts.gif` animation + emotional "Thank You!" text celebrates ad interaction |
| `SupportAdScreen` | GrammarStudyScreen (between questions) | `support_us_watch_ads.png` image + "Support Us!" text |

### 2.3 Core Problem

The `SupportAdButton` and `SupportAdScreen` components use a **rewarded ad format** but provide **no actual in-app reward** — the user watches the ad and receives only a "Thank You!" message with hearts. This makes the entire feature a "donate by watching ads" mechanism, which is not a valid rewarded ad use case under Google's policy.

---

## 3. Implemented Fix

### 3.1 Strategy: Real Reward — 1 Hour Ad-Free Experience

Instead of removing the feature (which generates significant revenue), the fix adds a **real, tangible in-app reward**: watching the rewarded ad grants **1 hour of banner-ad-free browsing**. This is:

- A real, non-monetary, non-transferable, in-app reward ✅
- Described accurately in all user-facing text ✅
- Something users genuinely value (removes distracting banner ads) ✅
- Compliant because all language describes what the **user** receives ✅

### 3.2 String Changes (all 6 locales)

| Key | Before (violating) | After (compliant) |
|---|---|---|
| `supportAd.title` | "Support us by watching an ad" | "Get 1 hour ad-free" |
| `supportAd.subtitle` | "Tap to watch" | "Watch a short video" |
| `supportAd.thankYou` | "Thank You!" | "You're ad-free!" |
| `supportAd.appreciation` | "Your support means the world to us and helps keep this app free for everyone." | "Enjoy 1 hour without banner ads. The timer starts now!" |
| `supportAdModal.title` | "Support Us!" | "Go ad-free for 1 hour" |
| `supportAdModal.subtitle` | "Help keep this app free by watching a short ad." | "Watch a short video to remove banner ads for 1 hour." |
| `supportAdModal.watchAd` | "Watch Ad" | "Watch & Go Ad-Free" |
| `writing.rewardedAdModal.title` | "AI Evaluation Support" | "AI Evaluation" |
| `writing.rewardedAdModal.message` | "...Watching this short ad helps keep our service free for everyone." | "...Watch a short video to unlock your AI evaluation." |

### 3.3 UI Changes

| Change | Before | After |
|---|---|---|
| `SupportAdButton` icon | Heart (❤️) `FontAwesome: heart` | Shield check `MaterialIcons: verified-user` |
| `SupportThankYouModal` image | `hearts.gif` (emotional) | `diamond.gif` (reward/achievement) |

### 3.4 Reward Delivery

When the user completes watching the ad, the `EARNED_REWARD` callback now calls `frequentUserRewardService.grantAdFreeDay(userId, 1, 'gift')` to activate a 1-hour ad-free period. This is stored in Firestore and picked up by the existing `useAdFreeStatus` hook, which already hides banner ads when `isAdFree` is `true`.

### 3.5 Writing Evaluation Rewarded Ad (Kept As-Is)

The writing evaluation rewarded ad flow remains unchanged in functionality. Only the descriptive text was updated to remove "support" framing and focus on describing the reward (AI evaluation unlock). The "Watch Ad and Evaluate" button and "Maybe Later" option remain.

---

## 4. Files Changed

| File | Change |
|---|---|
| `src/locales/en.json` | Updated `supportAd`, `supportAdModal`, `writing.rewardedAdModal` strings |
| `src/locales/de.json` | Same (German translations) |
| `src/locales/ar.json` | Same (Arabic translations) |
| `src/locales/fr.json` | Same (French translations) |
| `src/locales/es.json` | Same (Spanish translations) |
| `src/locales/ru.json` | Same (Russian translations) |
| `src/components/SupportAdButton.tsx` | Replaced heart icon with shield icon; added ad-free reward activation |
| `src/components/SupportAdScreen.tsx` | Added ad-free reward activation on earned reward |
| `src/components/SupportThankYouModal.tsx` | Replaced `hearts.gif` with `diamond.gif` |

---

## 5. Policy Compliance Verification

| Requirement | Implementation | Status |
|---|---|---|
| Reward must be non-monetary, non-transferable, in-app | 1-hour ad-free period, stored per user in Firestore | ✅ |
| Text must only describe the reward offered | "Get 1 hour ad-free", "Watch & Go Ad-Free" | ✅ |
| Must not use emotional/charity language | All "support us", "means the world", "keep free" text removed | ✅ |
| Must not use icons to draw excessive attention to ads | Heart icon replaced with neutral shield/check icon | ✅ |
| Post-ad celebration must not excessively celebrate ad interaction | Hearts animation replaced with achievement-style visual | ✅ |
| Skipping must not impede normal usage | Skip button remains, no punishment for skipping | ✅ |
| Reward must be delivered upon completion | `grantAdFreeDay()` called on `EARNED_REWARD` event | ✅ |
