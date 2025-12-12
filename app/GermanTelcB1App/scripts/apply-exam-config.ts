#!/usr/bin/env npx tsx
/// <reference types="node" />

/**
 * Apply Exam Configuration Script
 * 
 * This script applies the selected exam configuration to the project by:
 * 1. Updating app.json with app name and display name
 * 2. Updating Android configuration (bundle ID, app name)
 * 3. Updating iOS configuration (bundle ID, display name)
 * 4. Generating the active exam configuration file
 * 
 * Usage: npx tsx scripts/apply-exam-config.ts <exam-id> <platform>
 * Example: npx tsx scripts/apply-exam-config.ts german-b1 android
 */

import * as fs from 'fs';
import * as path from 'path';
import { EXAM_CONFIGS, getAvailableExamIds } from '../src/config/exams';
import { ExamConfig } from '../src/config/exam-config.types';

// Parse arguments
const examId = process.argv[2];
const platform = process.argv[3] as 'android' | 'ios';

if (!examId || !platform) {
  console.error('❌ Error: Missing required arguments');
  console.error('Usage: npx tsx scripts/apply-exam-config.ts <exam-id> <platform>');
  console.error('Example: npx tsx scripts/apply-exam-config.ts german-b1 android');
  console.error('');
  console.error(`Available exam IDs: ${getAvailableExamIds().join(', ')}`);
  console.error('Available platforms: android, ios');
  process.exit(1);
}

if (!['android', 'ios'].includes(platform)) {
  console.error(`❌ Error: Invalid platform "${platform}". Must be "android" or "ios"`);
  process.exit(1);
}

// ==================== Load Config ====================

const examConfig = EXAM_CONFIGS[examId];

if (!examConfig) {
  console.error(`❌ Error: Exam configuration not found for "${examId}"`);
  console.error('Available configurations:', getAvailableExamIds().join(', '));
  process.exit(1);
}

// Derive additional fields needed by the build process
interface BuildConfig {
  examConfig: ExamConfig;
  appName: string;        // Android app name with 'App' suffix
  iosAppName: string;     // iOS always uses 'TelcExamApp'
  iosDisplayName: string; // e.g., "German B1 Exam"
}

const capitalizedLanguage = examConfig.language.charAt(0).toUpperCase() + examConfig.language.slice(1);

const config: BuildConfig = {
  examConfig,
  appName: `${examConfig.appName}App`,
  iosAppName: 'TelcExamApp',
  iosDisplayName: `${capitalizedLanguage} ${examConfig.level} Exam`,
};

console.log('');
console.log('================================================');
console.log(`📝 Applying Configuration: ${examConfig.displayName}`);
console.log('================================================');
console.log(`   Exam ID: ${examConfig.id}`);
console.log(`   Language: ${examConfig.language}`);
console.log(`   Level: ${examConfig.level}`);
console.log(`   Platform: ${platform}`);
console.log(`   Bundle ID: ${examConfig.bundleId[platform]}`);
console.log(`   Admob Android App ID: ${examConfig.ads.appID.android}`);
console.log(`   Admob iOS App ID: ${examConfig.ads.appID.ios}`);
console.log('');

// ==================== Helper Functions ====================

const scriptsDir = __dirname;
const projectRoot = path.join(scriptsDir, '..');

function updateAppJson() {
  const appJsonPath = path.join(projectRoot, 'app.json');
  try {
    const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));
    
    appJson.name = platform === 'android' ? config.appName : config.iosAppName;
    appJson.displayName = examConfig.displayName;
    appJson["react-native-google-mobile-ads"].android_app_id = examConfig.ads.appID.android;
    appJson["react-native-google-mobile-ads"].ios_app_id = examConfig.ads.appID.ios;
    
    fs.writeFileSync(appJsonPath, JSON.stringify(appJson, null, 2) + '\n');
    console.log('✅ Updated app.json');
  } catch (error: any) {
    console.error('❌ Failed to update app.json:', error.message);
    throw error;
  }
}

function updateAndroidConfig() {
  const buildGradlePath = path.join(projectRoot, 'android/app/build.gradle');
  try {
    let buildGradle = fs.readFileSync(buildGradlePath, 'utf8');
    
    // Update applicationId
    buildGradle = buildGradle.replace(
      /applicationId\s+"[^"]+"/,
      `applicationId "${examConfig.bundleId.android}"`
    );
    
    fs.writeFileSync(buildGradlePath, buildGradle);
    console.log('✅ Updated android/app/build.gradle');
  } catch (error: any) {
    console.error('❌ Failed to update build.gradle:', error.message);
    throw error;
  }
}

function updateAndroidStrings() {
  const stringsPath = path.join(projectRoot, 'android/app/src/main/res/values/strings.xml');
  try {
    const stringsXml = `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <string name="app_name">${examConfig.displayName}</string>
</resources>
`;
    
    fs.writeFileSync(stringsPath, stringsXml);
    console.log('✅ Updated android/app/src/main/res/values/strings.xml');
  } catch (error: any) {
    console.error('❌ Failed to update strings.xml:', error.message);
    throw error;
  }
}

function updateiOSConfig() {
  const infoPlistPath = path.join(projectRoot, 'ios/TelcExamApp/Info.plist');
  
  if (fs.existsSync(infoPlistPath)) {
    try {
      let infoPlist = fs.readFileSync(infoPlistPath, 'utf8');
      
      // Update CFBundleDisplayName
      infoPlist = infoPlist.replace(
        /(<key>CFBundleDisplayName<\/key>\s*<string>)[^<]*(<\/string>)/,
        `$1${config.iosDisplayName}$2`
      );
      
      // Update CFBundleIdentifier
      infoPlist = infoPlist.replace(
        /(<key>CFBundleIdentifier<\/key>\s*<string>)[^<]*(<\/string>)/,
        `$1${examConfig.bundleId.ios}$2`
      );
      
      fs.writeFileSync(infoPlistPath, infoPlist);
      console.log('✅ Updated ios/TelcExamApp/Info.plist');
      console.log(`   Display Name: ${config.iosDisplayName}`);
      console.log(`   Bundle ID: ${examConfig.bundleId.ios}`);
    } catch (error: any) {
      console.error('❌ Failed to update Info.plist:', error.message);
      throw error;
    }
  } else {
    console.warn('⚠️  Warning: Info.plist not found at', infoPlistPath);
  }
  
  console.log('✅ iOS configuration will be applied via scheme build settings');
}

function updateAndroidNativeFiles() {
  // Update MainActivity.kt
  const mainActivityPath = path.join(projectRoot, 'android/app/src/main/java/com/mhamada/telcb1german/MainActivity.kt');
  if (fs.existsSync(mainActivityPath)) {
    try {
      let mainActivity = fs.readFileSync(mainActivityPath, 'utf8');
      mainActivity = mainActivity.replace(
        /override fun getMainComponentName\(\): String = "[^"]+"/,
        `override fun getMainComponentName(): String = "${config.appName}"`
      );
      fs.writeFileSync(mainActivityPath, mainActivity);
      console.log('✅ Updated MainActivity.kt');
    } catch (error: any) {
      console.error('❌ Failed to update MainActivity.kt:', error.message);
      throw error;
    }
  }

  // Update settings.gradle
  const settingsGradlePath = path.join(projectRoot, 'android/settings.gradle');
  if (fs.existsSync(settingsGradlePath)) {
    try {
      let settingsGradle = fs.readFileSync(settingsGradlePath, 'utf8');
      settingsGradle = settingsGradle.replace(
        /rootProject\.name = '[^']+'/,
        `rootProject.name = '${config.appName}'`
      );
      fs.writeFileSync(settingsGradlePath, settingsGradle);
      console.log('✅ Updated settings.gradle');
    } catch (error: any) {
      console.error('❌ Failed to update settings.gradle:', error.message);
      throw error;
    }
  }
}

function copyFirebaseConfigToFlavorDirectory() {
  // Generate flavor name from exam ID: 'german-b1' -> 'germanB1'
  const flavorName = examId
    .split('-')
    .map((part: string, index: number) => index === 0 ? part : part.toUpperCase())
    .join('');

  const sourceFile = path.join(projectRoot, `android/app/google-services.${examId}.json`);
  const flavorDir = path.join(projectRoot, `android/app/src/${flavorName}`);
  const destFile = path.join(flavorDir, 'google-services.json');

  try {
    if (!fs.existsSync(flavorDir)) {
      fs.mkdirSync(flavorDir, { recursive: true });
      console.log(`✅ Created flavor directory: ${flavorName}`);
    }

    if (!fs.existsSync(sourceFile)) {
      console.warn(`⚠️  Warning: Firebase config file not found: google-services.${examId}.json`);
      return;
    }

    fs.copyFileSync(sourceFile, destFile);
    console.log(`✅ Copied google-services.${examId}.json to ${flavorName} flavor directory`);
  } catch (error: any) {
    console.error(`❌ Failed to copy Firebase config:`, error.message);
    throw error;
  }
}

function generateActiveExamConfig() {
  const configContent = `/**
 * Active Exam Configuration
 * 
 * THIS FILE IS AUTO-GENERATED - DO NOT EDIT MANUALLY
 * Generated at: ${new Date().toISOString()}
 * Exam: ${examConfig.displayName}
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
  
  const configPath = path.join(projectRoot, 'src/config/active-exam.config.ts');
  try {
    fs.writeFileSync(configPath, configContent);
    console.log('✅ Generated src/config/active-exam.config.ts');
  } catch (error: any) {
    console.error('❌ Failed to generate active-exam.config.ts:', error.message);
    throw error;
  }
}

// ==================== Main Execution ====================

try {
  // 1. Update app.json (both platforms)
  updateAppJson();
  
  // 2. Platform-specific updates
  if (platform === 'android') {
    updateAndroidConfig();
    updateAndroidStrings();
    updateAndroidNativeFiles();
    copyFirebaseConfigToFlavorDirectory();
  } else if (platform === 'ios') {
    updateiOSConfig();
  }
  
  // 3. Generate active exam configuration
  generateActiveExamConfig();
  
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
} catch (error: any) {
  console.log('');
  console.log('================================================');
  console.log('❌ Configuration Failed');
  console.log('================================================');
  console.log('');
  console.error('Error:', error.message);
  console.log('');
  process.exit(1);
}

