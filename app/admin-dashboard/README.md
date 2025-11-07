# B1 Telc Exam Data - Admin Dashboard

This is the admin dashboard for managing the B1 Telc German exam content stored in Firebase Firestore.

## Features

- 🔐 Firebase Authentication (Email/Password)
- 📝 Rich JSON Editor with Monaco Editor (VS Code editor)
- ✅ Validation for all data types
- 💾 CRUD operations for exam content
- 🚀 Firebase Hosting deployment
- 🔄 Data migration from local JSON files

## Getting Started

### Prerequisites

- Node.js 16+ and npm
- Firebase project with Firestore enabled
- Firebase CLI installed: `npm install -g firebase-tools`

### Installation

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in the root directory with your Firebase credentials:
```env
REACT_APP_FIREBASE_API_KEY=your-api-key
REACT_APP_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your-project-id
REACT_APP_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
REACT_APP_FIREBASE_APP_ID=your-app-id
```

3. Create admin user in Firebase Console:
   - Go to Firebase Console → Authentication
   - Enable Email/Password authentication
   - Add a user manually with email and password

4. Initialize Firebase in your project:
```bash
firebase login
firebase init
```

### Data Migration

To migrate the existing JSON data from the React Native app to Firestore:

```bash
npm run migrate
```

This will upload all 13 JSON files to the `b1_telc_exam_data` collection.

### Development

Run the development server:

```bash
npm start
```

The app will open at [http://localhost:3000](http://localhost:3000)

### Deployment

Deploy to Firebase Hosting:

```bash
npm run deploy
```

Or deploy only the hosting:

```bash
npm run deploy:hosting
```

Or deploy only Firestore rules:

```bash
npm run deploy:rules
```

## Project Structure

```
admin-dashboard/
├── public/
├── src/
│   ├── components/
│   │   └── ProtectedRoute.tsx
│   ├── context/
│   │   └── AuthContext.tsx
│   ├── data/                           # JSON files for migration (can be deleted after migration)
│   │   ├── exam-info.json
│   │   ├── grammar-part1.json
│   │   ├── grammar-part2.json
│   │   └── ... (13 files total)
│   ├── pages/
│   │   ├── LoginPage.tsx
│   │   ├── DashboardPage.tsx
│   │   └── EditorPage.tsx
│   ├── services/
│   │   ├── firebase.service.ts
│   │   └── firestore.service.ts
│   ├── scripts/
│   │   └── migrateData.ts
│   ├── utils/
│   │   └── validators.ts
│   └── App.tsx
├── firebase.json
├── firestore.rules
└── package.json
```

**Note**: The `src/data/` folder contains copies of the JSON files from the React Native app. These are only needed for the initial migration to Firestore and can be safely deleted afterward.

## Usage

### Login

Use the email and password you created in Firebase Console to log in.

### Dashboard

- View all 13 exam data documents
- See metadata: size, creation date, last updated
- Click "Edit" to modify a document
- Click "Delete" to remove a document (with confirmation)

### Editor

- Edit JSON content with syntax highlighting
- **Format JSON**: Auto-format the JSON for readability
- **Validate**: Check if the JSON structure is correct
- **Save**: Save changes to Firestore (validates before saving)
- **Cancel**: Return to dashboard (warns if unsaved changes)

## Data Types

The dashboard manages 13 types of exam data:

1. `exam-info` - Exam overview and structure
2. `grammar-part1` - Grammar exercises part 1
3. `grammar-part2` - Grammar exercises part 2
4. `listening-part1` - Listening comprehension part 1
5. `listening-part2` - Listening comprehension part 2
6. `listening-part3` - Listening comprehension part 3
7. `reading-part1` - Reading comprehension part 1
8. `reading-part2` - Reading comprehension part 2
9. `reading-part3` - Reading comprehension part 3
10. `speaking-part1` - Speaking exercises part 1
11. `speaking-part2` - Speaking exercises part 2
12. `speaking-part3` - Speaking exercises part 3
13. `writing` - Writing exercises

## Validation

Each data type has specific validation rules to ensure data integrity:

- Grammar: Validates exams array, questions, answers structure
- Reading: Validates headings, texts, questions, and answers
- Listening: Validates audio URLs, statements, and correct answers
- Speaking: Validates topics, scenarios, vocabulary, and dialogues
- Writing: Validates email prompts and writing points

## Security

- Only authenticated users can access the dashboard
- Firestore security rules enforce authentication for all operations
- All data is validated before saving to prevent corruption

## Support

For issues or questions, please refer to the main project documentation.
