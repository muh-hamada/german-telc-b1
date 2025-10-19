# 📸 App Store Screenshot Demo Mode

## 🎬 Demo Data Configuration

The app now has a **DEMO MODE** feature that displays attractive, engaging progress data and hides ads - perfect for App Store screenshots!

### 🎯 Centralized Control

**All demo mode settings are controlled from ONE file:**
📄 `src/config/demo.config.ts`

Just change `DEMO_MODE` in this single file to enable/disable demo mode across the entire app!

### ✅ What's Enabled

When `DEMO_MODE = true`:

**ProgressCard will show:**

- **Average Score**: 85% (Excellent - shown in green)
- **Exams Completed**: 38 / 45
- **Completion Rate**: 84%
- **Total Score**: 3,215 / 3,600
- **Performance**: "Excellent" (in green)

**Ads will be hidden:**
- No banner ads displayed on any screen
- Clean, professional look for screenshots
- Focuses attention on app features, not ads

This data looks professional, achievable, and motivating for potential users!

### 📍 Architecture

**1. Central Config File: `src/config/demo.config.ts`**
   - Exports `DEMO_MODE` flag (true/false)
   - Exports `DEMO_STATS` with attractive progress data
   - **Single source of truth** for demo mode

**2. All Screens Import from Config**
   - 22+ screens automatically hide ads when `DEMO_MODE = true`
   - ProgressCard automatically shows demo data
   - No need to modify individual screens

**3. Files Updated (All import from config):**
   - ✅ All main screens (Home, Profile, MockExam, ExamStructure, Onboarding)
   - ✅ All practice menu screens (Reading, Grammar, Listening, Speaking)
   - ✅ All individual practice screens (Parts 1-3 for each section)
   - ✅ Writing, Speaking, and all Mock Exam screens

### 🎯 How to Use for Screenshots

#### Step 1: Take Screenshots (Current State)
The demo mode is **ALREADY ENABLED**. Just build and run the app to take screenshots:

```bash
cd app/GermanTelcB1App
npm run android  # or npm run ios
```

#### Step 2: Navigate to Screens
- Open the **Home Screen** - You'll see the progress card with demo data
- Open the **Profile Screen** - You'll see detailed progress with demo data

#### Step 3: Take Screenshots
- Use device screenshot tools or emulator screenshot features
- The progress card will display impressive, realistic data

### ⚠️ IMPORTANT: Before Production Release

**YOU MUST DISABLE DEMO MODE** before publishing to the App Store!

**🎯 ONLY ONE FILE TO UPDATE:**

Open `src/config/demo.config.ts` and change:

```typescript
export const DEMO_MODE = true; // Set to false for production
```

To:

```typescript
export const DEMO_MODE = false; // ✅ Production ready!
```

That's it! This single change updates **ALL screens** automatically! 🎉

### 🔍 Quick Verification Commands

**Check if demo mode is enabled:**
```bash
cd app/GermanTelcB1App
grep "DEMO_MODE = true" src/config/demo.config.ts
```

**Verify no other files have local DEMO_MODE definitions:**
```bash
# Should only return the config file!
grep -rn "export const DEMO_MODE" src/
```

### 📊 Demo Data Breakdown

The demo stats are intentionally designed to be:
- **Realistic**: 84% completion rate (not 100%)
- **Motivating**: 85% average score shows "Excellent" performance
- **Achievable**: 38/45 exams shows progress, not perfection
- **Professional**: Numbers are rounded and look authentic

### 💡 Tips for Best Screenshots

1. **Clean Background**: The progress card stands out well on the default background
2. **Font Clarity**: Make sure device display is at 100% (not zoomed)
3. **No Clutter**: Close any system notifications before taking screenshots
4. **Multiple Angles**: Take screenshots of both Home and Profile screens
5. **Different Devices**: Capture on both phone and tablet if possible
6. **No Ads**: Banner ads are automatically hidden in demo mode
7. **Professional Look**: App appears polished without ad distractions

### 🎨 Screenshot Ideas

**Home Screen:**
- Show the full screen with progress card at top
- Highlight the 85% score in green
- Show the navigation cards below

**Profile Screen:**
- Show detailed progress breakdown
- Capture the "Excellent" performance status
- Include user info section if available

### ✅ Checklist Before App Store Submission

- [ ] Take all necessary screenshots with demo mode enabled
- [ ] **Open `src/config/demo.config.ts`**
- [ ] **Change `DEMO_MODE = true` to `DEMO_MODE = false`**
- [ ] Verify: `grep "DEMO_MODE = true" src/config/demo.config.ts` (should return nothing)
- [ ] Test app without demo mode
- [ ] Verify ads are showing on all screens
- [ ] Verify progress shows real data (not demo 85%)
- [ ] Build production release
- [ ] 🎉 Submit to App Store!

---

## 🚀 Ready to Go!

Your app is now configured for perfect App Store screenshots with:
- ✅ **Centralized control** - Change one file to toggle demo mode
- ✅ **Professional data** - 85% score, "Excellent" performance
- ✅ **Clean screenshots** - No ads visible
- ✅ **22+ screens covered** - Consistent across entire app

**Remember:** Just change `DEMO_MODE` in `src/config/demo.config.ts` before going live! 🎉

