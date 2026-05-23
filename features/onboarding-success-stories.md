# Product Requirements Document (PRD)

## Feature: Onboarding Success Stories (Social Proof Screen)

## 1. Document Overview

- **Status:** Draft / Ready for Engineering

- **Author:** Product Team

- **Target Audience:** Frontend Engineers (Mobile), Backend Engineers, Admin Dashboard Engineers

- **Objective:** Increase onboarding conversion rate by showing real, high-quality social proof (App Store & Google Play reviews) in a visually dynamic and engaging way before the user completes registration.


## 2. Feature Flag & Flow Control (Remote Config)

To safely roll out this screen and perform A/B testing, the entire screen must be guarded by a Remote Config feature flag.

- **Parameter Name:** `enable_onboarding_reviews_screen` (Boolean)

- **Behavior:**

  - **`true`:** The Reviews Screen is shown as a dedicated step in the onboarding flow (typically right before the "Create Account / Login" step).

  - **`false`:** The app completely skips the Reviews Screen and transitions the user directly to the next step.

- **Fallback Behavior:** If Remote Config cannot be reached or fails to load within the timeout limit (e.g., 2 seconds), default this flag to `false` and skip the screen to guarantee a frictionless user experience.


## 3. Mobile Client Requirements

### 3.1 Screen Layout & UI Design

The layout must conform to the existing light-mode visual design system of the application:

- **Background Color:** `#F8F9FA` (Clean Light Gray)

- **Header Section (Static):**

  - **Title:** "REAL SUCCESS STORIES" (Bold, `#1A1A1A`, matching main header styles).

  - **Subtitle:** "Join the thousands of learners who've aced their B1 exam." (Regular, `#666666`).

- **Footer Section (Static Overlay):**

  - **Gradient Mask:** A fading gradient background (`#F8F9FA` to transparent, moving bottom-to-top) overlaying the bottom 15% of the screen. This ensures cards seamlessly "spawn" and slide out from behind the button.

  - **Primary Action Button:** Full-width "CONTINUE" button utilizing the primary brand blue (`#0077B6` / `#0084C7`), rounded corners, white bold text.

- **Review Cards:**

  - **Background:** Pure White (`#FFFFFF`).

  - **Corners:** Rounded (`border-radius: 16px`).

  - **Drop Shadow:** Ultra-subtle elevation shadow (`rgba(0, 0, 0, 0.04)` blur 8px, y-offset 4px).

  - **Interior Elements:** \* User Profile Picture (Circular, $48\text{px} \times 48\text{px}$ placeholder fallback if not provided).

    - User Name (Bold, `#1A1A1A`).

    - 5-Star Rating Indicator (using brand gold `#FFB03A`).

    - Review Content text (Regular, `#4A4A4A`, maximum 3 lines with ellipsis truncation if exceeded).


### 3.2 Dynamic Floating Animation Engine

To achieve a premium, floating-bubble aesthetic, cards must move with a slow vertical drift and horizontal zigzag.

- **Animation Axis Parameters:**

  - **Vertical Axis (Y-Axis):** Linear upwards movement at a slow, configurable constant velocity (e.g., 40-60 pixels per second).

  - **Horizontal Axis (X-Axis):** Slight zigzag pattern defined by a sine wave formula:

    $$X\_{\text{offset}} = A \cdot \sin(B \cdot t + \phi)$$

    - **Amplitude (**$A$**):** Restrict deflection between $10\text{px}$ and $25\text{px}$ to prevent cards from drifting off-screen.

    - **Frequency (**$B$**):** The sway cycle must complete a full loop every 5–7 seconds to maintain a relaxed, premium visual pace.

    - **Phase Offset (**$\phi$**):** Staggered randomly per card so they do not sway in parallel unison.

- **Opacity Transitions (Fading):**

  - **Spawn Zone (Bottom):** Cards transition from `opacity: 0` to `opacity: 1` as they travel up from the bottom 15% marker.

  - **Death Zone (Top):** Cards transition from `opacity: 1` to `opacity: 0` as they approach the bottom of the header subtitle text to avoid overlapping the static text.


### 3.3 Infinite Loop Queue Logic (Zero Empty Space)

The user must experience an endless, non-repeating flow of reviews without encountering empty gaps.

- **Configuration Array:** Sourced from `onboarding_reviews_data` (array of objects up to 10 entries) in Remote Config.

- **Spawn Lifecycle:**

  1. The app initializes an active queue of cards distributed evenly across the vertical viewport on load.

  2. As Card $N$ completes its upward trajectory and hits `opacity: 0` at the top boundary, it is unmounted.

  3. Immediately, Card $N + 1$ (modulo array size) is initialized at the bottom boundary with a slightly randomized offset delay.

  4. This loop runs continuously, allowing the sequence to seamlessly repeat (e.g., Review 1 to 10, then back to 1) for as long as the user stays on the screen.


## 4. Remote Config Data Schema

The reviews must be stored as an array of JSON objects inside Remote Config to allow instantaneous updates without submitting new app builds.

    {
      "enable_onboarding_reviews_screen": true,
      "onboarding_reviews_data": [
        {
          "id": "rev_01",
          "user_name": "Sarah Kim",
          "avatar_url": "[https://assets.yourdomain.com/avatars/user_01.jpg](https://assets.yourdomain.com/avatars/user_01.jpg)",
          "rating": 5,
          "text": "The AI speaking assessment was incredible. It really built my confidence for the oral exam!",
          "source": "App Store"
        },
        {
          "id": "rev_02",
          "user_name": "Ahmed Kahn",
          "avatar_url": "[https://assets.yourdomain.com/avatars/user_02.jpg](https://assets.yourdomain.com/avatars/user_02.jpg)",
          "rating": 5,
          "text": "I tried other apps, but this one's layout and content are the absolute best for the Telc format.",
          "source": "Google Play"
        }
      ]
    }


## 5. Admin Dashboard Requirements

A new management block must be added to the Admin Panel under the **App Configuration** section.


### 5.1 Onboarding Reviews Management Panel

- **UI Location:** `Admin Dashboard > App Config > Onboarding Flow`

- **Current List View:**

  - Displays the list of reviews currently saved to `onboarding_reviews_data`.

  - Allows re-ordering (drag-and-drop to adjust presentation order in the loop sequence).

  - Includes an **"Add Reviews"** primary action button.

  - Shows validation alerts (e.g., "Recommended: Select between 5 and 10 reviews for optimal visual loop spacing").


### 5.2 Import Reviews Modal

Clicking the "Add Reviews" button opens a fullscreen modal that bridges real-world feedback from mobile marketplaces.

- **Data Integrations:** Connects to App Store Connect API and Google Play Developer API to pull native reviews.

- **Modal Layout:**

  - **Header:** Title, selected count indicator (e.g., `"Selected: 4 reviews"`), and a search/filter bar (filter by rating, keywords, or platform).

  - **Lazy Loading / Infinite Scroll:**

    - Initial payload loads the last **30 reviews** sorted by date (newest first).

    - When the admin scrolls to the bottom of the modal, a loading indicator is triggered, fetching the next **30 reviews** asynchronously.

  - **Review Selection Mechanics:**

    - Multi-select checkboxes on each store review card.

    - The card UI displays App Store/Play Store badges, user name, date, rating, and original review text.

    - A editable **"Profile Picture Customization"** utility is embedded in the card (allows the admin to select from a set of default stock human avatars or upload a clean generic avatar, since official store APIs do not provide user profile photos for privacy reasons).

- **Save/Update Pipeline:**

  - Clicking "Confirm Selection" closes the modal and adds the items to the working configuration draft.

  - Clicking "Save Changes" on the main panel triggers a validated schema write, updating the `onboarding_reviews_data` payload directly in the Remote Config system.
