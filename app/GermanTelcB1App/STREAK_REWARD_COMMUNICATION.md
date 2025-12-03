# Streak Reward Communication - Translation Updates

## Summary

Added prominent reward messaging to `DailyStreaksCard` and `StreakModal` to communicate the 7-day streak reward and motivate users to come back daily.

## Changes Made

### 1. DailyStreaksCard.tsx
- ✅ Added reward progress indicator showing X/7 days
- ✅ Progress bar visualization
- ✅ Message encouraging users to complete remaining days
- ✅ Only shows when streak < 7 and reward not yet claimed

### 2. StreakModal.tsx
- ✅ Added prominent reward info box with gold/warning colors
- ✅ Shows reward title: "Exclusive Reward"
- ✅ Clear description: "Complete 7 consecutive days to unlock 24 hours ad-free"
- ✅ Progress indicator (X/7 days) with progress bar
- ✅ Motivational messages based on progress

## New Localization Strings

### English (en.json) ✅ DONE
### German (de.json) ✅ DONE
### Arabic (ar.json) ✅ DONE

### Spanish (es.json) - TO DO

Add these to the `streaks` section:

```json
"rewardProgress": "Recompensa de racha de 7 días",
"rewardProgressMessage": "¡Completa {{days}} día(s) más para obtener 24 horas sin anuncios!",
"rewardTitle": "Recompensa exclusiva",
"rewardDescription": "¡Completa 7 días consecutivos de estudio para desbloquear 24 horas de experiencia sin anuncios!",
"progress": "Progreso",
"almostThere": "¡Solo {{days}} día(s) más! ¡Ya casi llegas!",
"keepComingBack": "¡Regresa todos los días para desbloquear tu recompensa!",
```

### French (fr.json) - TO DO

Add these to the `streaks` section:

```json
"rewardProgress": "Récompense série de 7 jours",
"rewardProgressMessage": "Complétez encore {{days}} jour(s) pour obtenir 24 heures sans publicité!",
"rewardTitle": "Récompense exclusive",
"rewardDescription": "Complétez 7 jours consécutifs d'étude pour débloquer 24 heures d'expérience sans publicité!",
"progress": "Progrès",
"almostThere": "Plus que {{days}} jour(s)! Vous y êtes presque!",
"keepComingBack": "Revenez tous les jours pour débloquer votre récompense!",
```

### Russian (ru.json) - TO DO

Add these to the `streaks` section:

```json
"rewardProgress": "Награда за 7-дневную серию",
"rewardProgressMessage": "Завершите еще {{days}} день(ей), чтобы получить 24 часа без рекламы!",
"rewardTitle": "Эксклюзивная награда",
"rewardDescription": "Завершите 7 последовательных дней обучения, чтобы разблокировать 24 часа без рекламы!",
"progress": "Прогресс",
"almostThere": "Осталось всего {{days}} день(ей)! Вы почти у цели!",
"keepComingBack": "Возвращайтесь каждый день, чтобы разблокировать награду!",
```

## Visual Design

### DailyStreaksCard Reward Progress
- Background: Green (`colors.success[50]`)
- Border: Left border with green accent
- Progress bar: Green fill
- Shows: "🎁 7-Day Streak Reward" + "X/7 days" + Progress bar + Message

### StreakModal Reward Info Box
- Background: Warning/Gold (`colors.warning[50]`)
- Border: 2px warning color border
- Prominent placement below the weekly calendar
- Shows: 
  - Title: "🎁 Exclusive Reward"
  - Description of reward
  - Progress indicator with bar
  - Motivational message based on progress

## User Flow

1. User completes an activity
2. Streak modal appears showing current streak
3. **NEW**: Modal prominently displays reward progress box
4. **NEW**: Shows "Complete 7 consecutive days to unlock 24 hours ad-free!"
5. **NEW**: Progress bar shows visual progress (e.g., 3/7)
6. User goes to Profile screen
7. **NEW**: DailyStreaksCard shows reward progress section
8. **NEW**: Clear call-to-action to complete remaining days

## Status

- ✅ UI Components updated
- ✅ Styles added
- ✅ English localization done
- ✅ German localization done  
- ✅ Arabic localization done
- ⏳ Spanish localization - ready to add
- ⏳ French localization - ready to add
- ⏳ Russian localization - ready to add

## Next Steps

1. Add remaining translations (Spanish, French, Russian)
2. Test the visual appearance in different languages
3. Verify the reward progress updates correctly
4. Test on different screen sizes

