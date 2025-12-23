# **PRD: Automated TELC Exam YouTube Shorts Video Generation**

## **1\. Objective**

Create a fully automated pipeline to generate short YouTube videos from TELC exam questions, using Firebase Cloud Functions, Puppeteer screenshots, and FFmpeg. Each video:

* Has a short intro (logo \+ title)  
* Displays a question with two answer options  
* Shows a countdown timer  
* Reveals the correct answer  
* Ends with an outro (logo \+ call-to-action)

The process runs automatically once per day (scheduler) and uploads directly to YouTube.

---

## **2\. Target Platform**

* YouTube Shorts (vertical 1080×1920, ≤60 seconds)  
* Initial focus: YouTube only  
* Future scalability: TikTok / Instagram Reels (optional)

---

## **3\. Architecture Overview**

\[Scheduler\] → \[Firebase Cloud Function\] → \[Puppeteer Headless Chrome\] → \[Screenshots\] → \[FFmpeg Video Assembly\] → \[YouTube API Upload\]

### **Components**

1. **Scheduler**  
   * Runs once per day (cron)  
   * Triggers Cloud Function  
2. **Cloud Function**  
   * Node.js environment  
   * Launches headless Chromium  
   * Loads web app in **mobile viewport** (1080×1920)  
   * Handles screenshot capture and timing  
3. **Video Generation**  
   * **Intro (2s)**: App logo \+ title (“Prepare for your {level} {language} TELC exam”)  
   * **Question (10–15s)**: Show question \+ answer options \+ countdown timer  
     1. The answers could be true/false or multiple-choice  
   * **Answer Reveal (3–5s)**: Highlight correct answer  
   * **Outro (2–3s)**: App logo \+ “Download our app for more questions”  
4. **Video Processing**  
   * Screenshots → FFmpeg → MP4  
   * Format: vertical 1080×1920, short-duration (\<60s total)  
5. **YouTube Upload**  
   * YouTube Data API v3  
   * Auto-publish  
   * Include title, description, tags  
   * Flag as “Short” (≤60s, vertical)

---

## **4\. Functional Requirements**

| ID | Requirement |
| ----- | ----- |
| FR1 | The function must generate a video automatically once per day. |
| FR2 | Video must include intro, question, answer reveal, and outro in sequence. |
| FR3 | The question format is: situation \+ answer options (A / B). |
| FR4 | Timer should display remaining seconds visually over the question. |
| FR5 | Screenshots should be captured programmatically at fixed intervals. |
| FR6 | Video frames must be stitched using FFmpeg to produce MP4. |
| FR7 | Video must upload automatically to YouTube using API. |
| FR8 | Cloud Function must run on Firebase (2nd-gen recommended). |
| FR9 | Video should be rendered in mobile viewport (1080×1920). |
| FR10 | Intro and outro must include app logo and text. |

---

## **5\. Non-Functional Requirements**

| ID | Requirement |
| ----- | ----- |
| NFR1 | Execution time limits are not critical; Cloud Function may run until video generation completes. |
| NFR2 | The process must be fully automated, with no manual intervention. |
| NFR3 | Cloud Function must log progress and errors for monitoring. |
| NFR4 | Video output must meet YouTube Shorts specifications (vertical, ≤60s). |
| NFR5 | Screenshots and FFmpeg processing must produce consistent visual quality. |

---

## **6\. Video Content Specification**

1. **Intro (2s)**  
   * Square logo centered  
   * Text: “Prepare for your {level} {language} TELC exam”  
   * Simple fade-in/out animation  
2. **Question Display (10–15s)**  
   * Situation text at the top  
   * Answer options: A / B / C / etc or True/False  
   * Countdown timer (visual)  
   * Optionally highlight user choice (static simulation)  
3. **Answer Reveal (3–5s)**  
   * Highlight correct answer  
   * Optional visual effect (e.g., green highlight)  
4. **Outro (2–3s)**  
   * Logo \+ app name  
   * Call-to-action text: “Download our app for more questions”

**Total video length:** \<60 seconds

---

## **7\. Frontend App**

Create the frontend app that renders the question and answers

1. Screens  
   1. Intro screen  
   2. Outro screen  
   3. Question screen with answers screen  
   4. Answer reveal screen  
2. Data loading  
   1. The app takes in the URL query parameter the appId and the question name (reading-part1)  
   2. We create a new collection on Firebase with video\_data\_generation  
      1. Each appId is a separate doc  
      2. We store the question ID we processed successfully  
      3. We read this data not to process the same question again  
      4. We store metadata like processing time, etc  
3. Design  
   1. The app should have a simple and clean design  
   2. The design should be modern  
   3. In all screens except the intro and outro, the logo should be on the top right side of the screen

---

## **8\. Technical Implementation Notes**

* **Puppeteer**  
  * Headless Chrome  
  * Viewport: 1080×1920  
  * Capture screenshots at fixed FPS (e.g., 30 FPS)  
  * Can simulate timer progression via `page.evaluate()`  
* **FFmpeg**  
  * Stitch screenshots into MP4  
  * Optionally add simple transitions or overlays  
* **Firebase Cloud Functions**  
  * Use 2nd-gen functions to allow Chromium execution  
  * Triggered by the scheduler  
  * Handle logging and retries  
* **YouTube API**  
  * OAuth 2.0 credentials  
  * Auto-publish  
  * Set title, description, tags, and Shorts flag

---

## **9\. Operational Notes**

* **Scheduler**  
  * Cron job in Firebase  
  * Default: 1x/day  
  * Configurable for future frequency increase  
* **Error Handling**  
  * Log all errors  
  * Retry failed runs  
  * Notify via console/logs  
* **Assets**  
  * App logo (PNG)  
  * Font for titles  
  * Background colors / branding

