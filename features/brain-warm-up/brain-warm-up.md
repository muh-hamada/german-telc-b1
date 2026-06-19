## Task: Integrate Brain Games into this app

### What to do
Add a "Brain Warm-up" button on the home screen. When tapped, it opens a full-screen modal from the `rn-app-lib` library that:
1. Shows a motivational message about how brain games improve studying (with "National Institutes of Health" cited at the bottom)
2. Has a "Play a quick game" button and a "Maybe later" dismiss option
3. If user taps play, transitions to a games hub screen (2-col grid of brain training games)
4. User can play games, see results, and dismiss back

The library handles ALL of this internally — you just render the wrapper component with config.

### Installation

```bash
npm install muh-hamada/rn-app-lib
```

If Metro can't resolve it, add to `metro.config.js`:
```js
const path = require('path');
const libPath = path.resolve(__dirname, 'node_modules/rn-app-lib');
module.exports = {
  ...existingConfig,
  watchFolders: [...(existingConfig.watchFolders || []), libPath],
};
```

### Implementation

Add this to the home screen:

```tsx
import { BrainGamesWrapper, type GameConfig } from 'rn-app-lib';

```

Then in the home screen JSX, add:

```tsx
<BrainGamesWrapper
  renderTrigger={(onPress) => (
    <TouchableOpacity onPress={onPress} style={styles.brainGameButton}>
      <Text style={styles.brainGameButtonText}>🧠 Warm up your brain</Text>
    </TouchableOpacity>
  )}
  theme="purple"
  language="en"
  scoreTracking={true}
  onGameEnd={(gameId, result) => {
    // Optional: save scores, analytics, etc.
    console.log(`${gameId} ended:`, result);
  }}
  onDismiss={() => {
    // Optional: called when user taps "Maybe later"
  }}
/>
```

### Props explained

| Prop | Type | Description |
|------|------|-------------|
| `renderTrigger` | `(onPress: () => void) => ReactNode` | Renders your button; call `onPress` to open the modal |
| `games` | `GameConfig[]` | Which games to show (need `id`, `title`, `image`) |
| `theme` | `'purple' \| 'green' \| 'yellow'` | Color theme for all game UI |
| `language` | string | One of: `en`, `es`, `fr`, `de`, `pt`, `it`, `nl`, `ru`, `zh`, `ja`, `ko`, `ar`, `hi`, `tr`, `pl` |
| `scoreTracking` | `boolean` | Show/hide scores |
| `onGameEnd` | `(gameId, result) => void` | Callback with game results |
| `onDismiss` | `() => void` | Called when "Maybe later" is tapped |
| `bestScores` | `Record<GameId, number>` | Optional best scores to display |
| `onPlaySound` | `(sound) => void` | Optional sound callback |

### Game images required

You need two PNG thumbnail images for the game cards grid. Place them at whatever path you use in `require()` above. These are ~200x200 thumbnails showing a preview of each game.

### Important notes

- No native dependencies — pure React Native Views
- All text is automatically localized based on the `language` prop (15 languages)
- The component renders nothing visible itself — only the trigger button you provide via `renderTrigger`, plus the modal when open
- Style the trigger button however you want to match your app's design
- Set `language` to match the app's current locale
- The `title` field in GameConfig is a fallback only — the UI uses localized game names internally
```