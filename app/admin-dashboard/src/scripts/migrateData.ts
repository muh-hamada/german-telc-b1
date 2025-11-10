// /**
//  * Data Migration Script
//  * 
//  * This script reads JSON files from the local data directory
//  * and uploads them to Firebase Firestore.
//  * 
//  * Usage:
//  * 1. Make sure your Firebase credentials are set in .env
//  * 2. Use the Migration Panel in the dashboard UI
//  * 
//  * Note: This script is meant to be run once to initialize the Firestore collection.
//  * The UI-based migration (MigrationPanel) is recommended over running this directly.
//  */

// import { firestoreService } from '../services/firestore.service';

// // Import JSON data from local data folder
// import examInfoData from '../data/exam-info.json';
// import grammarPart1Data from '../data/grammar-part1.json';
// import grammarPart2Data from '../data/grammar-part2.json';
// import listeningPart1Data from '../data/listening-part1.json';
// import listeningPart2Data from '../data/listening-part2.json';
// import listeningPart3Data from '../data/listening-part3.json';
// import readingPart1Data from '../data/reading-part1.json';
// import readingPart2Data from '../data/reading-part2.json';
// import readingPart3Data from '../data/reading-part3.json';
// import speakingPart1Data from '../data/speaking-part1.json';
// import speakingPart2Data from '../data/speaking-part2.json';
// import speakingPart3Data from '../data/speaking-part3.json';
// import writingData from '../data/writing.json';

// const DATA_MAP: Record<string, any> = {
//   'exam-info': examInfoData,
//   'grammar-part1': grammarPart1Data,
//   'grammar-part2': grammarPart2Data,
//   'listening-part1': listeningPart1Data,
//   'listening-part2': listeningPart2Data,
//   'listening-part3': listeningPart3Data,
//   'reading-part1': readingPart1Data,
//   'reading-part2': readingPart2Data,
//   'reading-part3': readingPart3Data,
//   'speaking-part1': speakingPart1Data,
//   'speaking-part2': speakingPart2Data,
//   'speaking-part3': speakingPart3Data,
//   'writing': writingData,
// };

// async function migrateData() {
//   console.log('Starting data migration...');
//   console.log('================================\n');

//   let successCount = 0;
//   let errorCount = 0;

//   for (const [docId, data] of Object.entries(DATA_MAP)) {
//     try {
//       console.log(`Migrating: ${docId}...`);
      
//       // Initialize document in Firestore
//       await firestoreService.initializeDocument(docId, data);
      
//       console.log(`✓ Successfully migrated: ${docId}\n`);
//       successCount++;
//     } catch (error: any) {
//       console.error(`✗ Failed to migrate ${docId}:`, error.message, '\n');
//       errorCount++;
//     }
//   }

//   console.log('================================');
//   console.log('Migration complete!');
//   console.log(`Success: ${successCount}, Errors: ${errorCount}`);
  
//   if (errorCount > 0) {
//     console.log('\nNote: Some documents failed to migrate. Please check the errors above.');
//   }
// }

// // Export for use in component or standalone execution
// export { migrateData };

// // Check if running as standalone script
// if (require.main === module) {
//   migrateData()
//     .then(() => {
//       console.log('\nMigration script finished. You can close this window.');
//       process.exit(0);
//     })
//     .catch((error) => {
//       console.error('\nMigration script failed:', error);
//       process.exit(1);
//     });
// }


export {};