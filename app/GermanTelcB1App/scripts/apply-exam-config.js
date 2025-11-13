#!/usr/bin/env node

/**
 * Apply Exam Configuration Script
 * 
 * This script applies the selected exam configuration to the project by:
 * 1. Updating app.json with app name and display name
 * 2. Updating Android configuration (bundle ID, app name)
 * 3. Updating iOS configuration (bundle ID, display name)
 * 4. Generating the active exam configuration file
 * 
 * Usage: node apply-exam-config.js <exam-id> <platform>
 * Example: node apply-exam-config.js german-b1 android
 */

const fs = require('fs');
const path = require('path');

// Parse arguments
const examId = process.argv[2];
const platform = process.argv[3];

if (!examId || !platform) {
  console.error('❌ Error: Missing required arguments');
  console.error('Usage: node apply-exam-config.js <exam-id> <platform>');
  console.error('Example: node apply-exam-config.js german-b1 android');
  console.error('');
  console.error('Available exam IDs: german-b1, german-b2, english-b1');
  console.error('Available platforms: android, ios');
  process.exit(1);
}

if (!['android', 'ios'].includes(platform)) {
  console.error(`❌ Error: Invalid platform "${platform}". Must be "android" or "ios"`);
  process.exit(1);
}

// Load exam configurations (we need to read the TypeScript config files)
const configPath = path.join(__dirname, '../src/config/exams');
let config;

try {
  // For simplicity, we'll define the configs here
  // In a production setup, you might want to compile TypeScript or use a different approach
  const configs = {
    'german-b1': {
      id: 'german-b1',
      language: 'german',
      level: 'B1',
      appName: 'GermanTelcB1App',
      iosAppName: 'TelcExamApp',
      displayName: 'German TELC B1',
      admob: {
        androidAppId: 'ca-app-pub-5101905792101482~1016049874',
        iosAppId: '',
      },
      bundleId: {
        android: 'com.mhamada.telcb1german',
        ios: 'com.mhamada.telcb1german',
      },
      firebaseCollections: {
        examData: 'b1_telc_exam_data',
        userProgress: 'users/{uid}/progress',
      },
    },
    'german-b2': {
      id: 'german-b2',
      language: 'german',
      level: 'B2',
      appName: 'GermanTelcB2App',
      iosAppName: 'TelcExamApp',
      displayName: 'German TELC B2',
      admob: {
        androidAppId: 'ca-app-pub-5101905792101482~5846015787',
        iosAppId: '',
      },
      bundleId: {
        android: 'com.mhamada.telcb2german',
        ios: 'com.mhamada.telcb2german',
      },
      firebaseCollections: {
        examData: 'german_b2_telc_exam_data',
        userProgress: 'users/{uid}/german_b2_progress',
      },
    },
    'english-b1': {
      id: 'english-b1',
      language: 'english',
      level: 'B1',
      appName: 'EnglishTelcB1App',
      iosAppName: 'TelcExamApp',
      displayName: 'English TELC B1',
      admob: {
        androidAppId: '',
        iosAppId: '',
      },
      bundleId: {
        android: 'com.mhamada.telcb1english',
        ios: 'com.mhamada.telcb1english',
      },
      firebaseCollections: {
        examData: 'english_b1_telc_exam_data',
        userProgress: 'users/{uid}/english_b1_progress',
      },
    },
  };

  config = configs[examId];
  
  if (!config) {
    console.error(`❌ Error: Exam configuration not found for "${examId}"`);
    console.error('Available configurations:', Object.keys(configs).join(', '));
    process.exit(1);
  }
} catch (error) {
  console.error(`❌ Error loading configuration:`, error.message);
  process.exit(1);
}

console.log('');
console.log('================================================');
console.log(`📝 Applying Configuration: ${config.displayName}`);
console.log('================================================');
console.log(`   Exam ID: ${config.id}`);
console.log(`   Language: ${config.language}`);
console.log(`   Level: ${config.level}`);
console.log(`   Platform: ${platform}`);
console.log(`   Bundle ID: ${config.bundleId[platform]}`);
console.log(`   Admob Android App ID: ${config.admob.androidAppId}`);
console.log(`   Admob iOS App ID: ${config.admob.iosAppId}`);
console.log('');

// ==================== Helper Functions ====================

function updateAppJson(config) {
  const appJsonPath = path.join(__dirname, '../app.json');
  try {
    const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));
    
    appJson.name = platform === 'android' ? config.appName : config.iosAppName;
    appJson.displayName = config.displayName;
    appJson["react-native-google-mobile-ads"].android_app_id = config.admob.androidAppId;
    appJson["react-native-google-mobile-ads"].ios_app_id = config.admob.iosAppId;
    
    fs.writeFileSync(appJsonPath, JSON.stringify(appJson, null, 2) + '\n');
    console.log('✅ Updated app.json');
  } catch (error) {
    console.error('❌ Failed to update app.json:', error.message);
    throw error;
  }
}

function updateAndroidConfig(config) {
  const buildGradlePath = path.join(__dirname, '../android/app/build.gradle');
  try {
    let buildGradle = fs.readFileSync(buildGradlePath, 'utf8');
    
    // DO NOT Update namespace
    // Updating the namespace will cause the app to crash because
    // the namespace is used to understand the directory structure of the app.
    
    // Update applicationId
    buildGradle = buildGradle.replace(
      /applicationId\s+"[^"]+"/,
      `applicationId "${config.bundleId.android}"`
    );
    
    fs.writeFileSync(buildGradlePath, buildGradle);
    console.log('✅ Updated android/app/build.gradle');
  } catch (error) {
    console.error('❌ Failed to update build.gradle:', error.message);
    throw error;
  }
}

function updateAndroidStrings(config) {
  const stringsPath = path.join(__dirname, '../android/app/src/main/res/values/strings.xml');
  try {
    const stringsXml = `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <string name="app_name">${config.displayName}</string>
    <string name="facebook_app_id">YOUR_FACEBOOK_APP_ID</string>
    <string name="facebook_client_token">YOUR_FACEBOOK_CLIENT_TOKEN</string>
    <string name="fb_login_protocol_scheme">fbYOUR_FACEBOOK_APP_ID</string>
</resources>
`;
    
    fs.writeFileSync(stringsPath, stringsXml);
    console.log('✅ Updated android/app/src/main/res/values/strings.xml');
  } catch (error) {
    console.error('❌ Failed to update strings.xml:', error.message);
    throw error;
  }
}

function updateiOSConfig(config) {
  // iOS configuration is now handled by Xcode schemes and build settings
  // No file modifications needed - everything is controlled by the scheme selection
  console.log('✅ iOS configuration will be applied via scheme build settings');
  console.log(`   Scheme will control: Bundle ID, Display Name, and Firebase config`);
}

function updateAndroidNativeFiles(config) {
  // Update MainActivity.kt
  const mainActivityPath = path.join(__dirname, '../android/app/src/main/java/com/mhamada/telcb1german/MainActivity.kt');
  if (fs.existsSync(mainActivityPath)) {
    try {
      let mainActivity = fs.readFileSync(mainActivityPath, 'utf8');
      mainActivity = mainActivity.replace(
        /override fun getMainComponentName\(\): String = "[^"]+"/,
        `override fun getMainComponentName(): String = "${config.appName}"`
      );
      fs.writeFileSync(mainActivityPath, mainActivity);
      console.log('✅ Updated MainActivity.kt');
    } catch (error) {
      console.error('❌ Failed to update MainActivity.kt:', error.message);
      throw error;
    }
  }

  // Update settings.gradle
  const settingsGradlePath = path.join(__dirname, '../android/settings.gradle');
  if (fs.existsSync(settingsGradlePath)) {
    try {
      let settingsGradle = fs.readFileSync(settingsGradlePath, 'utf8');
      settingsGradle = settingsGradle.replace(
        /rootProject\.name = '[^']+'/,
        `rootProject.name = '${config.appName}'`
      );
      fs.writeFileSync(settingsGradlePath, settingsGradle);
      console.log('✅ Updated settings.gradle');
    } catch (error) {
      console.error('❌ Failed to update settings.gradle:', error.message);
      throw error;
    }
  }
}

function updateiOSNativeFiles(config) {
  // iOS native files are no longer modified per-build
  // The project structure (TelcExamApp) remains constant
  // All app-specific settings are controlled via Xcode schemes
  console.log('✅ iOS native files remain unchanged (using scheme-based configuration)');
}

function generateActiveExamConfig(config, examId) {
  const configContent = `/**
 * Active Exam Configuration
 * 
 * THIS FILE IS AUTO-GENERATED - DO NOT EDIT MANUALLY
 * Generated at: ${new Date().toISOString()}
 * Exam: ${config.displayName}
 * 
 * This file determines which exam configuration is active for the current build.
 * To change the active exam, run the build script with a different exam ID.
 */

import { ExamConfig } from './exam-config.types';
import { getExamConfig } from './exams';

const ACTIVE_EXAM_ID = '${examId}';

/**
 * Get the active exam configuration
 * @returns The currently active ExamConfig
 */
export const getActiveExamConfig = (): ExamConfig => {
  return getExamConfig(ACTIVE_EXAM_ID);
};

/**
 * The currently active exam configuration
 * This is a cached instance of the active config for convenience
 */
export const activeExamConfig = getActiveExamConfig();

/**
 * Get the active exam ID
 * @returns The ID of the currently active exam
 */
export const getActiveExamId = (): string => {
  return ACTIVE_EXAM_ID;
};

// Log the active configuration in development mode
if (__DEV__) {
  console.log('[ExamConfig] Active exam:', activeExamConfig.displayName);
  console.log('[ExamConfig] Exam ID:', activeExamConfig.id);
  console.log('[ExamConfig] Firebase collection:', activeExamConfig.firebaseCollections.examData);
}
`;
  
  const configPath = path.join(__dirname, '../src/config/active-exam.config.ts');
  try {
    fs.writeFileSync(configPath, configContent);
    console.log('✅ Generated src/config/active-exam.config.ts');
  } catch (error) {
    console.error('❌ Failed to generate active-exam.config.ts:', error.message);
    throw error;
  }
}

// ==================== Main Execution ====================

try {
  // 1. Update app.json (both platforms)
  updateAppJson(config);
  
  // 2. Platform-specific updates
  if (platform === 'android') {
    updateAndroidConfig(config);
    updateAndroidStrings(config);
    updateAndroidNativeFiles(config);
  } else if (platform === 'ios') {
    // For iOS, configuration is now handled by schemes
    updateiOSConfig(config);
    // No native file updates needed for iOS
  }
  
  // 3. Generate active exam configuration
  generateActiveExamConfig(config, examId);
  
  console.log('');
  console.log('================================================');
  console.log('✅ Configuration Applied Successfully!');
  console.log('================================================');
  console.log('');
  console.log('Next steps:');
  console.log('  - Review the changes');
  console.log('  - Build the app for', platform);
  console.log('');
  
  process.exit(0);
} catch (error) {
  console.log('');
  console.log('================================================');
  console.log('❌ Configuration Failed');
  console.log('================================================');
  console.log('');
  console.error('Error:', error.message);
  console.log('');
  process.exit(1);
}

