# Automated Release Scripts Documentation

This directory contains automation scripts for building and releasing multiple Telc Exam apps to Google Play Store and Apple App Store.

## 📋 Overview

The automation system provides:
- Sequential builds for multiple apps (to avoid configuration conflicts)
- Automated uploads to Play Store and App Store Connect
- Localized release notes in 9 languages
- Staged rollout support for Android
- Full logging and error handling

## 📁 Files

### Core Scripts

- **`release-all.sh`** - Main orchestrator script that runs the entire build and release process
- **`build-android.sh`** - Existing Android build script (unchanged)
- **`build-ios.sh`** - Existing iOS build script (unchanged)
- **`fastlane-android-release.sh`** - Android Play Store release automation
- **`fastlane-ios-release.sh`** - iOS App Store release automation

### Fastlane Configuration

- **`fastlane/Fastfile`** - Fastlane lanes for Android and iOS releases
- **`fastlane/Appfile`** - Fastlane Apple ID configuration
- **`Gemfile`** - Ruby dependencies (includes Fastlane)

### Data Files

- **`../update-messages.json`** - Release notes in 9 languages (en, de, es, fr, it, pt, ru, ar, tr)

## 🚀 Quick Start

### 1. Initial Setup

Install Ruby dependencies:

```bash
bundle install
```

### 2. Configure Play Store API Access

Set up Google Play Store API credentials:

1. Go to Google Play Console → Settings → API access
2. Create a service account and download JSON key
3. Set the `SUPPLY_JSON_KEY_DATA` environment variable or place the JSON file in your project
4. Grant the service account "Release Manager" permissions

### 3. Configure App Store Connect

Set up App Store Connect credentials:

1. Generate an app-specific password at https://appleid.apple.com
2. Update `fastlane/Appfile` with your Apple ID (already set to muhammad.aref.ali.hamada@gmail.com)
3. Optionally set environment variable `FASTLANE_PASSWORD` with your app-specific password

### 4. Run a Full Release

To build and release all apps:

```bash
./release-all.sh 0
```

This will:
1. Build all Android apps (german-a1, german-b1, german-b2, english-b1, english-b2)
2. Upload AAB files to Play Store
3. Create releases with localized notes (using message index 0)
4. Build all iOS apps
5. Upload to App Store Connect
6. Create releases and submit for review

## 📖 Usage Examples

### Release Specific Apps Only

```bash
./release-all.sh 0 --apps german-b1,english-b2
```

### Android Only

```bash
./release-all.sh 0 --android-only
```

### iOS Only

```bash
./release-all.sh 0 --ios-only
```

### Staged Rollout (Android)

Release to 10% of users:

```bash
./release-all.sh 0 --rollout 0.1
```

### Skip Build (Use Existing Builds)

```bash
./release-all.sh 0 --skip-build
```

### Beta Track (Android)

```bash
./release-all.sh 0 --track beta
```

## 🔧 Individual Script Usage

### Android Release Only

```bash
./fastlane-android-release.sh german-b1 dist/android/german-b1/app-release.aab 0
```

### iOS Release Only

```bash
./fastlane-ios-release.sh german-b1 1.4.0 42 0
```

## 📝 Update Messages

Update messages are stored in `../update-messages.json` with translations in 9 languages:

- English (en)
- German (de)
- Spanish (es)
- French (fr)
- Italian (it)
- Portuguese (pt)
- Russian (ru)
- Arabic (ar)
- Turkish (tr)

To use a specific message, pass its index (0-based) to the release scripts.

Example: To use the first message (index 0):
```bash
./release-all.sh 0
```

## 🏗️ Architecture

### Build Process

1. **Android**: Uses existing `build-android.sh` script
   - Applies app-specific configuration
   - Builds release AAB using Gradle
   - Outputs to `dist/android/<app-id>/`

2. **iOS**: Uses existing `build-ios.sh` script
   - Applies app-specific configuration
   - Builds and archives with Xcode
   - Uploads to App Store Connect using altool

### Release Process

1. **Android**: Fastlane lane
   - Uploads AAB to Play Store
   - Creates release with localized notes
   - Configures staged rollout
   - Sets to specified track (production/beta)

2. **iOS**: Fastlane lane
   - Creates app version in App Store Connect
   - Selects uploaded build
   - Adds localized release notes
   - Answers compliance questions
   - Submits for review

### Sequential Processing

Apps are processed sequentially (not in parallel) to:
- Avoid configuration file conflicts
- Ensure clean workspace for each build
- Provide clear error tracking

## 📊 Logging

All operations are logged to timestamped files in `release-logs/`:

```
release-logs/release_20260120_143052.log
```

Logs include:
- Build output
- Upload progress
- Fastlane operations
- Error messages

## ⚠️ Safety Features

- **Validation**: Checks for required files before proceeding
- **Error Handling**: Exits on first failure with clear messages
- **No Modifications**: Existing build scripts remain unchanged
- **Clean Workspace**: Each build starts with clean state
- **Rollback**: Failed builds don't affect other apps

## 🔐 Security Notes

1. **API Credentials**: Store securely using environment variables
2. **App Passwords**: Never commit to repository
3. **Service Accounts**: Use minimal required permissions
4. **Logs**: May contain sensitive data - review before sharing

## 🐛 Troubleshooting

### Build Fails

- Check `release-logs/` for detailed error messages
- Ensure dev flags are disabled (`./check-dev-flags.sh`)
- Verify app configuration is correct

### Upload Fails

- Verify Play Store/App Store Connect credentials
- Check service account permissions (Android)
- Ensure app exists in store consoles
- Verify version numbers are incremented

### Fastlane Errors

- Run `bundle install` to update dependencies
- Check Fastlane documentation: https://docs.fastlane.tools
- Review `fastlane/Fastfile` for configuration issues

### Version Conflicts

- Ensure versions are bumped before release
- Check both platforms have correct version numbers
- Use `./bump-version.sh` to update versions

## 🔄 Workflow

Recommended release workflow:

1. **Prepare Release**
   ```bash
   ./bump-version.sh
   ./check-dev-flags.sh
   ```

2. **Test Builds** (Optional)
   ```bash
   ./build-android.sh german-b1
   ./build-ios.sh german-b1
   ```

3. **Full Release**
   ```bash
   ./release-all.sh 0
   ```

4. **Monitor**
   - Check release-logs for any warnings
   - Monitor Play Console for rollout
   - Monitor App Store Connect for review status

## 📞 Support

For issues or questions:
- Review logs in `release-logs/`
- Check Fastlane documentation
- Verify store console settings
- Contact development team

## 🆕 Adding New Apps

To add a new app to the release process:

1. Update `get_app_config()` in `fastlane/Fastfile`
2. Add app ID to `DEFAULT_APPS` in `release-all.sh`
3. Ensure build scripts support the new app ID
4. Configure app in Play Console and App Store Connect

## 📚 Additional Resources

- [Fastlane Documentation](https://docs.fastlane.tools)
- [Google Play Console](https://play.google.com/console)
- [App Store Connect](https://appstoreconnect.apple.com)
- [React Native Documentation](https://reactnative.dev)
